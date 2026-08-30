from __future__ import annotations

import unittest

from science.betelgeuse.provenance import REQUIRED_PRODUCT_FIELDS, missing_product_fields


class ProvenanceTests(unittest.TestCase):
    def test_complete_record(self) -> None:
        record = {field: None for field in REQUIRED_PRODUCT_FIELDS}
        self.assertEqual(missing_product_fields(record), frozenset())

    def test_missing_fields_are_reported(self) -> None:
        self.assertIn("sha256", missing_product_fields({"dataset_id": "example"}))


if __name__ == "__main__":
    unittest.main()
