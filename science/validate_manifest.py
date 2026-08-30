"""Validate required keys and committed-file hashes in the data manifest."""

from __future__ import annotations

import hashlib
from pathlib import Path
import sys

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from science.betelgeuse.provenance import missing_product_fields


def main(manifest_path: str) -> int:
    root = Path(manifest_path).resolve().parent.parent
    with Path(manifest_path).open("r", encoding="utf-8") as stream:
        manifest = yaml.safe_load(stream)
    errors: list[str] = []
    for product in manifest.get("products", []):
        missing = missing_product_fields(product)
        if missing:
            errors.append(f"{product.get('dataset_id', '<unknown>')}: missing {sorted(missing)}")
        local_path = product.get("local_path")
        expected_hash = product.get("sha256")
        if local_path and expected_hash:
            path = root / local_path
            if not path.is_file():
                errors.append(f"{product['dataset_id']}: local file does not exist: {path}")
            else:
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                if digest.lower() != str(expected_hash).lower():
                    errors.append(f"{product['dataset_id']}: SHA-256 mismatch")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Validated {len(manifest.get('products', []))} product records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1]))
