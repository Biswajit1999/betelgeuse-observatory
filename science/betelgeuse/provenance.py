"""Schema-level checks for observational product provenance."""

from __future__ import annotations

from collections.abc import Mapping

REQUIRED_PRODUCT_FIELDS = frozenset(
    {
        "dataset_id", "target", "observatory", "telescope", "instrument",
        "programme_id", "observation_start", "observation_end", "spectral_coverage",
        "bandwidth", "spatial_resolution", "spectral_resolution", "processing_level",
        "units", "source_url", "publication", "licence", "sha256", "local_path",
        "downloaded_at", "pipeline_version",
    }
)


def missing_product_fields(product: Mapping[str, object]) -> frozenset[str]:
    """Return absent keys. Values may be null only when the manifest explains why."""

    return REQUIRED_PRODUCT_FIELDS.difference(product)
