# Contributing

Contributions are welcome when they preserve scientific provenance and causal honesty.

## Before opening a change

1. Link every new observational claim to a primary paper or official observatory/archive source.
2. Add observation dates separately from publication or release dates.
3. Add products to `data/manifest.yaml`, including licence, hash, units, and processing level.
4. Do not commit raw ALMA measurement sets, large FITS cubes, credentials, or model checkpoints.
5. Add physical-conversion tests and compare neural methods with a transparent baseline.
6. Label simulations and model-dependent statements in both code and user-facing copy.

## Checks

```bash
python -m pytest
python -m mypy science/betelgeuse science/ingestion ml/baselines
python -m ruff check .
pnpm typecheck
pnpm lint
pnpm build
```

Scientific discussions should name assumptions and uncertainty. Unsupported exact explosion dates or claims of observing outside Earth's past light cone will not be accepted.
