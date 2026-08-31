"""Retrieve and bin the historical Betelgeuse visual/V-band light curve.

The raw AAVSO export is kept in ``data/raw`` (gitignored).  Only robust,
passband-separated summaries are committed for the web visualisation.  The
pre-AAVSO points are the magnitudes reconstructed from Herschel's 1836--1840
comparison sequences by Lloyd (2020), Table 1.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import statistics
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

AAVSO_AUID = "000-BBK-383"
AAVSO_ENDPOINT = "https://www.aavso.org/vsx/index.php"
AAVSO_RANGES = ((2412000.0, 2435000.0), (2435000.0, 2450000.0), (2450000.0, 2461300.0))
RAW_FIELDS = (
    "JD",
    "mag",
    "uncert",
    "band",
    "by",
    "transformed",
    "val",
    "mtype",
    "obsID",
    "fainterThan",
    "obsType",
    "credit",
)

# (JD, derived visual magnitude, explicitly parenthesised/uncertain in Lloyd 2020)
HERSCHEL_ESTIMATES = (
    (2391726.0, 1.1, False),
    (2391961.0, 0.0, False),
    (2391962.0, 0.1, False),
    (2391975.0, 0.4, False),
    (2392307.0, 0.3, False),
    (2392307.0, -0.1, False),
    (2392347.0, 0.8, True),
    (2392360.0, 0.7, False),
    (2392373.0, 0.6, False),
    (2392377.0, 0.8, False),
    (2392381.0, 0.7, False),
    (2392388.0, 0.8, False),
    (2392431.0, 0.6, False),
    (2392479.0, 0.5, False),
    (2392756.0, 1.1, True),
    (2392757.0, 1.0, False),
    (2392762.0, 1.0, False),
    (2393070.0, 0.1, False),
    (2393074.0, 0.4, False),
    (2393085.0, 0.6, False),
    (2393103.0, 0.7, False),
    (2393107.0, 0.6, False),
    (2393110.0, 0.6, False),
    (2393111.0, 0.7, False),
    (2393112.0, 0.7, False),
    (2393161.0, 0.7, False),
    (2393214.0, 0.6, False),
)


@dataclass(frozen=True)
class Observation:
    jd: float
    magnitude: float
    band: str


def decimal_year_from_jd(jd: float) -> float:
    """Convert Julian Date to UTC decimal year for plotting."""

    instant = datetime(1970, 1, 1, tzinfo=UTC) + timedelta(days=jd - 2440587.5)
    year_start = datetime(instant.year, 1, 1, tzinfo=UTC)
    next_year = datetime(instant.year + 1, 1, 1, tzinfo=UTC)
    fraction = (instant - year_start).total_seconds() / (next_year - year_start).total_seconds()
    return instant.year + fraction


def relative_flux(magnitude: float, reference_magnitude: float = 0.5) -> float:
    """Return flux relative to an explicitly chosen reference magnitude."""

    return 10 ** (-0.4 * (magnitude - reference_magnitude))


def _aavso_url(from_jd: float, to_jd: float) -> str:
    query = {
        "view": "api.object",
        "ident": AAVSO_AUID,
        "data": "50000",
        "fromjd": f"{from_jd:.1f}",
        "tojd": f"{to_jd:.1f}",
        "band": "Vis.,V",
        "mtype": "std",
    }
    # The legacy endpoint uses the presence of ``csv`` as a flag.
    return f"{AAVSO_ENDPOINT}?{urllib.parse.urlencode(query)}&csv"


def _read_cdata_csv(payload: bytes) -> list[dict[str, str]]:
    root = ET.fromstring(payload)
    data = root.findtext("Data")
    if not data:
        raise ValueError("AAVSO response did not contain a Data table")
    return list(csv.DictReader(io.StringIO(data)))


def fetch_aavso_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for from_jd, to_jd in AAVSO_RANGES:
        request = urllib.request.Request(
            _aavso_url(from_jd, to_jd),
            headers={"User-Agent": "Betelgeuse-Observatory/1.1 (scientific reproducibility)"},
        )
        with urllib.request.urlopen(request, timeout=120) as response:  # noqa: S310
            rows.extend(_read_cdata_csv(response.read()))

    deduplicated = {row.get("obsID", f"row-{index}"): row for index, row in enumerate(rows)}
    return sorted(deduplicated.values(), key=lambda row: float(row["JD"]))


def usable_observations(rows: Iterable[dict[str, str]]) -> list[Observation]:
    observations: list[Observation] = []
    for row in rows:
        if row.get("band") not in {"Vis.", "V"} or row.get("fainterThan") == "1":
            continue
        try:
            jd = float(row["JD"])
            magnitude = float(row["mag"])
        except (KeyError, TypeError, ValueError):
            continue
        # A deliberately broad target-specific plausibility screen removes a
        # handful of obvious transcription/outlier values (for example 11.3
        # mag) while retaining the full documented VSX range and margin.
        if math.isfinite(jd) and math.isfinite(magnitude) and -0.5 <= magnitude <= 3.0:
            observations.append(Observation(jd=jd, magnitude=magnitude, band=row["band"]))
    return observations


def _percentile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    position = fraction * (len(ordered) - 1)
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def bin_observations(
    observations: Iterable[Observation], *, bin_days: float, start_jd: float, end_jd: float
) -> list[dict[str, float | int | str]]:
    grouped: dict[tuple[str, int], list[Observation]] = {}
    for observation in observations:
        if start_jd <= observation.jd < end_jd:
            index = int((observation.jd - start_jd) // bin_days)
            grouped.setdefault((observation.band, index), []).append(observation)

    result: list[dict[str, float | int | str]] = []
    for (band, index), rows in sorted(grouped.items(), key=lambda item: (item[0][1], item[0][0])):
        values = [row.magnitude for row in rows]
        median = statistics.median(values)
        deviations = [abs(value - median) for value in values]
        mid_jd = start_jd + (index + 0.5) * bin_days
        result.append(
            {
                "series": "AAVSO visual estimates" if band == "Vis." else "AAVSO Johnson V",
                "band": band,
                "bin_days": int(bin_days),
                "start_jd": round(start_jd + index * bin_days, 5),
                "end_jd": round(min(start_jd + (index + 1) * bin_days, end_jd), 5),
                "mid_jd": round(mid_jd, 5),
                "year": round(decimal_year_from_jd(mid_jd), 5),
                "magnitude": round(median, 4),
                "q1": round(_percentile(values, 0.25), 4),
                "q3": round(_percentile(values, 0.75), 4),
                "mad": round(statistics.median(deviations), 4),
                "n": len(values),
            }
        )
    return result


def _herschel_rows() -> list[dict[str, float | int | str | bool]]:
    return [
        {
            "series": "Herschel estimates (Lloyd 2020 reconstruction)",
            "band": "historical visual",
            "bin_days": 0,
            "start_jd": jd,
            "end_jd": jd,
            "mid_jd": jd,
            "year": round(decimal_year_from_jd(jd), 5),
            "magnitude": magnitude,
            "q1": magnitude,
            "q3": magnitude,
            "mad": 0.0,
            "n": 1,
            "uncertain": uncertain,
        }
        for jd, magnitude, uncertain in HERSCHEL_ESTIMATES
    ]


def write_raw(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=RAW_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_outputs(rows: list[dict[str, str]], root: Path) -> dict[str, int | float | str]:
    observations = usable_observations(rows)
    overview = bin_observations(
        observations, bin_days=90.0, start_jd=2412000.0, end_jd=2461300.0
    )
    recent = bin_observations(
        observations, bin_days=30.0, start_jd=2455197.5, end_jd=2461300.0
    )
    herschel = _herschel_rows()

    visual_count = sum(observation.band == "Vis." for observation in observations)
    v_count = sum(observation.band == "V" for observation in observations)
    metadata: dict[str, int | float | str] = {
        "target": "Betelgeuse / Alpha Orionis",
        "aavso_auid": AAVSO_AUID,
        "retrieved_utc": datetime.now(UTC).isoformat(timespec="seconds"),
        "first_aavso_jd": min(observation.jd for observation in observations),
        "last_aavso_jd": max(observation.jd for observation in observations),
        "first_aavso_year": round(decimal_year_from_jd(min(o.jd for o in observations)), 3),
        "last_aavso_year": round(decimal_year_from_jd(max(o.jd for o in observations)), 3),
        "aavso_observations": len(observations),
        "aavso_rows_received": len(rows),
        "aavso_rows_excluded": len(rows) - len(observations),
        "aavso_visual_observations": visual_count,
        "aavso_v_observations": v_count,
        "herschel_estimates": len(herschel),
        "reference_magnitude": 0.5,
        "quality_screen": "detections only; -0.5 <= magnitude <= 3.0",
        "aavso_source": "https://www.aavso.org/vsx/index.php?oid=24710&view=detail.top",
        "historical_source": "https://arxiv.org/abs/2006.15403",
    }

    sample_dir = root / "data" / "samples"
    public_dir = root / "public" / "downloads"
    sample_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    payload = {"metadata": metadata, "herschel": herschel, "overview": overview, "recent": recent}
    (sample_dir / "betelgeuse_historical_lightcurve.json").write_text(
        json.dumps(payload, indent=2) + "\n", encoding="utf-8"
    )

    output_csv = public_dir / "betelgeuse-historical-photometry-1836-2026.csv"
    fields = (
        "view",
        "series",
        "band",
        "bin_days",
        "start_jd",
        "end_jd",
        "mid_jd",
        "year",
        "magnitude",
        "q1",
        "q3",
        "mad",
        "n",
        "uncertain",
    )
    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for item in herschel:
            writer.writerow({"view": "historical point", **item})
        for item in overview:
            writer.writerow({"view": "1836-2026 overview", **item})
        for item in recent:
            writer.writerow({"view": "2010-2026 detail", **item})

    (public_dir / "betelgeuse-historical-photometry-README.txt").write_text(
        "Betelgeuse historical photometry, generated by science/ingestion/aavso_history.py\n"
        f"AAVSO AID records used: {len(observations)} ({visual_count} Vis.; {v_count} V).\n"
        "Overview: separate 90-day medians and quartiles for Vis. and Johnson V.\n"
        "Recent detail: separate 30-day medians and quartiles from 2010 onward.\n"
        "Herschel: 27 visual magnitudes reconstructed in Lloyd (2020), Table 1.\n"
        "No interpolation is inserted across missing intervals. "
        "Magnitude decreases upward in plots.\n"
        "AAVSO acknowledgement: We gratefully acknowledge the contributions of the AAVSO "
        "observer community, whose photometric data and metadata resources were used in this "
        "study and made available through the AAVSO's scientific archives.\n"
        "Sources:\n"
        "https://www.aavso.org/index.php/data-access\n"
        "https://vsx.aavso.org/index.php?oid=24710&view=detail.top\n"
        "https://arxiv.org/abs/2006.15403\n",
        encoding="utf-8",
    )
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument(
        "--raw-output",
        type=Path,
        help="Optional raw CSV location; defaults to data/raw/aavso_alpha_ori_1893_2026.csv",
    )
    args = parser.parse_args()

    rows = fetch_aavso_rows()
    raw_output = args.raw_output or args.root / "data" / "raw" / "aavso_alpha_ori_1893_2026.csv"
    write_raw(rows, raw_output)
    metadata = write_outputs(rows, args.root)
    print(json.dumps({"raw_output": str(raw_output), **metadata}, indent=2))


if __name__ == "__main__":
    main()
