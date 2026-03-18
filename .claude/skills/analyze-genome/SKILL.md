---
name: analyze-genome
description: "V1 genome analysis — static pipeline with curated SNP database. Quick automated reports to profiles/<name>/v1/."
user-invocable: true
argument-hint: "name"
---

# GeneScope V1 — Static Pipeline Analysis

**Original author: nicksaraev. Fixed allele errors by Georgi.**

Runs the TypeScript extraction pipeline with curated 79-SNP database, ClinVar, and PharmGKB. Output goes to `profiles/<name>/v1/`.

**Arguments:**
- `$ARGUMENTS[0]` — Person's name (folder under `profiles/`)
- Genome file must already be in `profiles/<name>/`. If not found, ask user where it is and move it there.
- `--force` — Re-run even if v1 output exists

## Steps

1. Find genome file in `profiles/<name>/` (`.csv`, `.txt`, `.tsv`). If missing, ask and move it.
2. Create `profiles/<name>/v1/`
3. Convert genome to JSON:
   ```bash
   node scripts/genome-to-json.mjs profiles/<name>/<genome-file> profiles/<name>/v1/genome.json
   ```
4. Run extraction pipeline → saves findings + reports to `profiles/<name>/v1/`
5. Update `profiles/registry.json`
6. Report results. Suggest `/analyze-genome-v2` for thorough Claude-powered analysis.
