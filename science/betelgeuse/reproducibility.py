"""Capture the runtime facts needed to reproduce a scientific result."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
import platform
import subprocess


@dataclass(frozen=True)
class RuntimeRecord:
    python_version: str
    platform: str
    git_sha: str | None
    packages: dict[str, str | None]

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def _package_version(name: str) -> str | None:
    try:
        return version(name)
    except PackageNotFoundError:
        return None


def capture_runtime(repository: Path | None = None) -> RuntimeRecord:
    root = repository or Path.cwd()
    try:
        sha = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=root, check=True, capture_output=True, text=True
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        sha = None
    packages = {
        name: _package_version(name)
        for name in ("numpy", "pandas", "scipy", "astropy", "scikit-learn", "torch")
    }
    return RuntimeRecord(platform.python_version(), platform.platform(), sha, packages)
