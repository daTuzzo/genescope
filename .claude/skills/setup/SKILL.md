---
name: setup
description: Download and process the ClinVar database for GeneScope. This is the only external data not included in the repo (too large for git). Run this after cloning.
user-invocable: true
argument-hint: "--refresh to re-download"
---

# GeneScope Setup

The repo includes everything except **ClinVar** (55MB processed, too large for git). This skill downloads and processes it.

`--refresh` flag: re-download even if the file already exists.

## Steps

### 1. Check current state

Check for `data/clinvar_alleles.tsv`:
- If it exists and no `--refresh` flag: tell the user it's already set up, show the file size, and skip to step 5.
- If missing or `--refresh`: proceed with download.

Also verify these files exist (they should — they're committed to the repo):
- `data/clinical_annotations.tsv` (PharmGKB)
- `data/clinical_ann_alleles.tsv` (PharmGKB)

If somehow missing, warn the user.

### 2. Install dependencies

```bash
npm install
```

### 3. Download and process ClinVar

```bash
# Download raw ClinVar (~415MB, takes a few minutes depending on connection)
curl -L -o data/variant_summary.txt.gz "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz"

# Process: filters ~8.9M entries to ~308K (GRCh37, SNPs only, clinically significant)
node scripts/process_clinvar.mjs

# Clean up the raw download to save disk space
rm data/variant_summary.txt.gz
```

### 4. Ensure profiles directory exists

If `profiles/registry.json` doesn't exist, create it:
```json
{
  "profiles": []
}
```

### 5. Verify

```bash
npm run build
```

Report to user:
- ClinVar: how many variants in the processed file
- PharmGKB: present/missing
- Build: passing/failing
- Next step: `/analyze-genome <name> <genome-file>`
