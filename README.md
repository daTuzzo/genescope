# GeneScope

Personal genome analysis powered by Claude. Upload your DNA file from MyHeritage, 23andMe, or AncestryDNA and get detailed, personalized health reports — drug metabolism, disease risk, methylation pathways, nutrition, fitness, and more.

## What You Get

- **Drug metabolism profile** — how you process caffeine, warfarin, statins, opioids, antidepressants, and more (CYP1A2, CYP2C19, CYP2D6, DPYD, TPMT, etc.)
- **Disease risk assessment** — ClinVar pathogenic variants, carrier status, cardiovascular risk (APOE, Factor V Leiden), autoimmune markers
- **Methylation & neurotransmitter analysis** — MTHFR, COMT, BDNF, serotonin transporter, dopamine receptors — how they interact as pathways, not just individual SNPs
- **Personalized lifestyle recommendations** — diet (lactose, omega-3 conversion, vitamin D), fitness (muscle fiber type, injury risk), sleep chronotype, caffeine sensitivity
- **Iterative follow-up** — Claude asks targeted questions based on YOUR findings to refine the analysis

## Requirements

- [Claude Code](https://claude.ai/code) (CLI)
- Node.js 18+
- A raw DNA file from MyHeritage, 23andMe, or AncestryDNA

## Quick Start

```bash
git clone <repo-url>
cd genescope
npm install
```

### First-time setup — download ClinVar database

```bash
/setup
```

This downloads and processes the ClinVar database (~415MB download, filters to 308K clinically significant variants). PharmGKB data is already included in the repo.

### Analyze your genome

Place your DNA file in `profiles/yourname/`, then:

```bash
/analyze-genome-v2 yourname
```

This will:
1. **Ask intake questions** — like a doctor: age, sex, ancestry, medications, family history, lifestyle, specific concerns
2. **Extract data** — parse your ~600K+ SNPs, match against ClinVar (308K disease variants) and PharmGKB (drug interactions), convert to queryable JSON
3. **Research & interpret** — a team of 4 Claude agents analyze your genome in parallel:
   - **Pharmacogenomics** — drug metabolism and safety alerts
   - **Methylation & Neurotransmitters** — MTHFR, COMT, detox pathways
   - **Disease Risk** — ClinVar findings, cardiovascular, autoimmune, carrier status
   - **Lifestyle & Nutrition** — diet, fitness, sleep, caffeine, alcohol
4. **Write reports** — 5 detailed markdown files + a synthesized full report with cross-domain gene interactions
5. **Follow-up loop** — ask targeted questions based on YOUR results to compound the analysis. Keeps going until you're satisfied.

### Multiple people

```bash
# Place each person's DNA file in their own folder
mkdir -p profiles/mom profiles/dad
cp ~/Downloads/mom_data.csv profiles/mom/
cp ~/Downloads/dad_data.csv profiles/dad/

/analyze-genome-v2 mom
/analyze-genome-v2 dad
```

Each person gets their own isolated folder. Results never mix.

## How It Works

```
Your DNA File (MyHeritage / 23andMe / AncestryDNA)
         ↓
  Intake Questionnaire (age, meds, family history, lifestyle)
         ↓
  TypeScript Extraction Pipeline
    ├── ClinVar — 308K disease variants (rsID-matched, GRCh37)
    ├── PharmGKB — drug-gene interactions (evidence level 1A-2B)
    └── Genome → JSON (608K+ SNPs, queryable by rsID)
         ↓
  Claude Agent Team (4 specialists, researching in parallel)
    ├── pharmacogenomics — verifies on CPIC/dbSNP, checks your medications
    ├── methylation — maps pathway bottlenecks, not just individual SNPs
    ├── disease-risk — validates ClinVar findings on SNPedia, checks family history
    └── lifestyle — cross-references genotype with your actual diet/exercise/sleep
         ↓
  Orchestrator (Claude) synthesizes cross-domain interactions
         ↓
  5 Report Files + Follow-Up Question Loop
```

## Output Structure

```
profiles/yourname/
├── genome_raw_data.csv           # Your original file (untouched)
├── intake.json                    # Questionnaire answers + follow-ups
├── v2/                            # Claude-interpreted reports
│   ├── genome.json                # Your 600K+ SNPs as queryable JSON
│   ├── findings.json              # ClinVar + PharmGKB matches
│   ├── pharmacogenomics.md        # Drug metabolism & safety
│   ├── methylation-neuro.md       # Methylation, detox, neurotransmitters
│   ├── disease-risk.md            # Disease risk & clinical findings
│   ├── lifestyle-nutrition.md     # Diet, fitness, sleep, caffeine
│   └── full-report.md             # Synthesized report with gene interactions
└── v1/                            # Automated baseline (optional)
    ├── genetic-report.md
    ├── disease-risk.md
    └── health-protocol.md
```

## Two Versions

| | V1 | V2 (Recommended) |
|---|---|---|
| **Command** | `/analyze-genome` | `/analyze-genome-v2` |
| **How it interprets** | Static database with hardcoded descriptions | Claude reads raw genome, researches on SNPedia/dbSNP |
| **Intake** | None | Doctor-like questionnaire |
| **Analysis** | Template-filled | Agent team researches in parallel |
| **Follow-up** | None | Iterative question loop |
| **Output** | `v1/` folder | `v2/` folder (5 report files) |

V1 exists as a quick baseline. V2 is the real analysis.

## Supported Formats

| Provider | Format | Auto-Detected | How to Download |
|----------|--------|---------------|-----------------|
| MyHeritage | CSV | Yes | myheritage.com → DNA → Manage DNA kits → Download |
| 23andMe | TSV | Yes | 23andme.com → Settings → 23andMe Data → Download Raw Data |
| AncestryDNA | TSV | Yes | ancestry.com → DNA → Settings → Download Raw DNA Data |

All formats use GRCh37/hg19 coordinates. The loader handles each natively — no manual conversion needed.

## Web UI (Work in Progress)

```bash
npm run dev               # http://localhost:3000
```

The Next.js web viewer exists but is **not fully tested yet**. It was built for V1's report structure and hasn't been updated for V2's multi-file output. Don't expect a polished experience — the CLI with Claude Code is the primary interface for now.

## Privacy

All data stays on your machine. Nothing is uploaded anywhere. The genome file, findings, and reports live in your local `profiles/` directory.

## Disclaimer

For informational and educational purposes only. This is NOT a clinical diagnosis. Always consult a genetic counselor or healthcare provider for medical decisions. Variant classifications change over time as research progresses.
