"""Human-readable retrieval routes for archives that require a query or acknowledgement."""

from __future__ import annotations

ARCHIVES = {
    "AAVSO": "https://www.aavso.org/data-download",
    "MAST": "https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html",
    "ESO SPHERE": "https://archive.eso.org/cms/eso-archive-news/release-of-sphere-data-betelgeuse.html",
}


def format_guides() -> str:
    return "\n".join(f"{name}: {url}" for name, url in ARCHIVES.items())


if __name__ == "__main__":
    print(format_guides())
