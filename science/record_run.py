"""Print a machine-readable runtime record without mutating the repository."""

from __future__ import annotations

import json

from science.betelgeuse.reproducibility import capture_runtime

if __name__ == "__main__":
    print(json.dumps(capture_runtime().as_dict(), indent=2, sort_keys=True))
