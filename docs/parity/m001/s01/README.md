# M001 / S01 Coverage Baseline Artifacts

This directory contains the machine-checkable baseline artifacts for Slice S01.

## Artifacts

- `surface-census.json` — deterministic source-of-truth inventory of in-scope frontend surfaces.
- `coverage-tracker.yaml` — seeded tracker rows keyed by `surface_id` and pre-populated with inventory status.

## Generation

```bash
node scripts/parity/s01-surface-census.mjs --out docs/parity/m001/s01/surface-census.json
```

By default, this also writes:

- `docs/parity/m001/s01/coverage-tracker.yaml`

## Inventory Verification

```bash
node scripts/parity/verify-s01-coverage.mjs \
  --phase inventory \
  --tracker docs/parity/m001/s01/coverage-tracker.yaml \
  --census docs/parity/m001/s01/surface-census.json
```

The verifier prints a summary with:

- `covered_count`
- `missing_surface_ids`
- per-family row counts
- `coverage_status`
- `exit_code`

A non-zero exit means census↔tracker parity has drifted or a malformed artifact was detected.
