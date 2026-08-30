"""Safe ALMA archive retrieval planning.

This module never downloads multi-gigabyte visibility datasets implicitly.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AlmaProgramme:
    project_code: str
    purpose: str

    @property
    def query_url(self) -> str:
        return f"https://almascience.eso.org/aq/?project_code={self.project_code}"


PROGRAMMES = (
    AlmaProgramme("2022.A.00026.S", "2023 Bands 6/7/8 continuum and line data"),
    AlmaProgramme("2015.1.00206.S", "2015 Band 7 temporal comparison"),
)


def retrieval_instructions() -> str:
    lines = [
        "Review archive product sizes and ALMA data-use conditions before downloading.",
        "Prefer pipeline-calibrated products for the first reproduction pass.",
        "Use CASA for measurement-set calibration and interferometric imaging.",
    ]
    lines.extend(f"{item.project_code}: {item.query_url}" for item in PROGRAMMES)
    return "\n".join(lines)


if __name__ == "__main__":
    print(retrieval_instructions())
