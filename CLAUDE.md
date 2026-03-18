# GeneScope

Personal genome analysis tool. Upload DNA files (MyHeritage, 23andMe, AncestryDNA), extract structured findings, and generate intelligent health reports.

## Two Versions

| | V1 (nicksaraev) | V2 (Georgi) |
|---|---|---|
| **Command** | `/analyze-genome` | `/analyze-genome-v2` |
| **Interpretation** | Static curated database (79 SNPs with hardcoded descriptions) | Claude agent team reads raw genome, researches each finding |
| **Intake** | None | Doctor-like questionnaire with iterative follow-up |
| **Analysis** | Template-filled reports | Agent teams research in parallel, verify on SNPedia/dbSNP |
| **Output** | `profiles/<name>/v1/` | `profiles/<name>/v2/` (5 separate report files) |
| **Follow-up** | None | Iterative question loop — compounds on findings |
| **Best for** | Quick automated baseline | Thorough, personalized, intelligent analysis |

**Recommended: V2.**

## First-Time Setup

PharmGKB and curated SNPs are in the repo. Only **ClinVar** needs downloading (55MB processed, too large for git).

Run `/setup` or manually:

```bash
npm install
curl -L -o data/variant_summary.txt.gz "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz"
node scripts/process_clinvar.mjs
rm data/variant_summary.txt.gz
```

| Data | In repo? | Notes |
|------|----------|-------|
| PharmGKB | Yes | `data/clinical_annotations.tsv` + `data/clinical_ann_alleles.tsv` (~11MB) |
| Curated SNPs (79) | Yes | `src/lib/analysis/snp-database.ts` (v1 only) |
| ClinVar | No | Run `/setup` to download (308K filtered variants) |

## Project Structure

```
genescope/
├── CLAUDE.md
├── .claude/skills/
│   ├── setup/SKILL.md                 # /setup — download ClinVar
│   ├── analyze-genome/SKILL.md        # /analyze-genome (v1)
│   ├── interpret-results/SKILL.md     # /interpret-results (v1)
│   └── analyze-genome-v2/SKILL.md     # /analyze-genome-v2 (v2)
├── profiles/
│   ├── registry.json                  # Tracks all analyses
│   └── <name>/
│       ├── <genome-file>.csv          # Original DNA file (never modified)
│       ├── intake.json                # Questionnaire answers (shared by v1/v2)
│       ├── v1/                        # V1 output
│       │   ├── genome.json
│       │   ├── findings.json
│       │   ├── genetic-report.md
│       │   ├── disease-risk.md
│       │   └── health-protocol.md
│       └── v2/                        # V2 output
│           ├── genome.json
│           ├── findings.json          # ClinVar + PharmGKB matches
│           ├── pharmacogenomics.md    # Drug metabolism & safety
│           ├── methylation-neuro.md   # Methylation, detox, neurotransmitters
│           ├── disease-risk.md        # Disease risk & clinical findings
│           ├── lifestyle-nutrition.md # Diet, fitness, sleep, caffeine
│           └── full-report.md         # Synthesized final report
├── data/                              # Reference databases
│   ├── clinvar_alleles.tsv            # ClinVar GRCh37 (NOT in git)
│   ├── clinical_annotations.tsv      # PharmGKB (in git)
│   └── clinical_ann_alleles.tsv      # PharmGKB (in git)
├── src/
│   ├── lib/analysis/                  # TypeScript extraction engine
│   └── app/                           # Next.js 14 frontend
└── scripts/
    ├── process_clinvar.mjs            # Process raw ClinVar download
    ├── genome-to-json.mjs             # Convert genome file to JSON
    ├── lookup-snps.mjs                # Query specific rsIDs from genome.json
    └── run-analysis.mts               # CLI runner for v1 pipeline
```

## V2 Flow

1. **Intake** — questionnaire (age, sex, ancestry, meds, family history, lifestyle, concerns)
2. **Extract** — convert genome to JSON, run ClinVar + PharmGKB matching
3. **Agent team** — 4 members research and write domain reports:
   - `pharmacogenomics` — drug metabolism, safety alerts
   - `methylation` — methylation pathways, detox, neurotransmitters
   - `disease-risk` — ClinVar findings, cardiovascular, autoimmune
   - `lifestyle` — nutrition, fitness, sleep, caffeine, alcohol
4. **Synthesize** — orchestrator writes final report with cross-domain interactions
5. **Follow-up loop** — ask targeted questions based on findings, update reports, repeat until exhausted

Agents query genome.json with `lookup-snps.mjs`, research on SNPedia/dbSNP, and verify strand orientation. They are NOT limited to any pre-curated list.

## Genome Formats

All use GRCh37/hg19 plus strand. Loader handles each natively:
- **MyHeritage**: CSV `"RSID","CHROMOSOME","POSITION","RESULT"`
- **23andMe**: TSV `rsid\tchromosome\tposition\tgenotype`
- **AncestryDNA**: TSV (sometimes 5-column with separate alleles)

## Important

- All data stays local. Nothing leaves the machine.
- NOT a clinical diagnosis tool. Reports include disclaimers.
- V1 and V2 output to separate folders — they never corrupt each other.
- `data/` has large files — ClinVar is gitignored.
