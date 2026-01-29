# GeneScope - Personal Genome Analysis Tool

A beautiful web frontend for genetic health analysis. Wraps existing Python analysis scripts with a modern Next.js UI.

## Project Status

**Backend:** ✅ Complete (Python scripts from nicksaraev's Genetic Health pipeline)
**Data:** ✅ Downloaded (ClinVar 289MB + PharmGKB annotations)
**Frontend:** 🔨 In Progress

## What It Does

1. **Upload** your raw DNA file (MyHeritage, 23andMe, AncestryDNA)
2. **Analyze** against ClinVar + PharmGKB + curated SNP database
3. **Generate** 3 comprehensive health reports:
   - EXHAUSTIVE_GENETIC_REPORT.md — lifestyle/health genetics
   - EXHAUSTIVE_DISEASE_RISK_REPORT.md — clinical variants
   - ACTIONABLE_HEALTH_PROTOCOL.md — personalized protocol

## Tech Stack

- **Frontend:** Next.js 14 + TailwindCSS + Framer Motion
- **Backend:** Python analysis scripts (already complete)
- **API:** Next.js API routes calling Python subprocess
- **Storage:** Local filesystem

## Genome File Formats Supported

### 23andMe (native support)
```
# rsid    chromosome    position    genotype
rs123     1             12345       AG
```

### MyHeritage (needs conversion)
MyHeritage CSV format → convert to 23andMe TSV format

### AncestryDNA
Similar to 23andMe, should work with minor parsing adjustments.

## Frontend Requirements

### Pages

1. **Landing/Upload** (`/`)
   - Drag-drop file upload
   - Format detection (MyHeritage/23andMe/Ancestry)
   - Progress indicator during conversion/analysis

2. **Dashboard** (`/dashboard`)
   - Summary cards (total SNPs, findings, risk factors)
   - Category overview (Drug Metabolism, Cardiovascular, etc.)
   - Quick links to reports

3. **Report Viewer** (`/reports/[type]`)
   - Render markdown reports beautifully
   - Table of contents navigation
   - Syntax highlighting for gene names
   - Expandable sections

4. **Export** (`/export`)
   - Download reports as MD/PDF
   - Print-friendly view

### Design

- **Theme:** Dark mode, medical/tech aesthetic
- **Colors:** Deep blue (#0a0f1c), teal accents (#14b8a6), red for high-risk (#ef4444), green for protective (#22c55e)
- **Typography:** Inter for body, JetBrains Mono for genetic data
- **Motion:** Smooth transitions, loading skeletons

## API Routes

### POST /api/upload
- Accept genome file
- Detect format
- Convert if needed
- Return upload ID

### POST /api/analyze
- Run Python scripts on uploaded genome
- Stream progress updates
- Return when complete

### GET /api/reports/[id]/[type]
- Return generated report content

## Directory Structure

```
genescope/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Upload page
│   ├── dashboard/
│   ├── reports/
│   └── api/
├── components/            # React components
│   ├── ui/               # Base components
│   ├── upload/           # Upload flow
│   └── reports/          # Report display
├── lib/                  # Utilities
│   ├── parser.ts         # Format conversion
│   └── analyzer.ts       # Python bridge
├── scripts/              # Python analysis (complete)
│   ├── run_full_analysis.py
│   ├── disease_risk_analyzer.py
│   ├── comprehensive_snp_database.py
│   └── ...
├── data/                 # Reference databases
│   ├── clinvar_alleles.tsv
│   ├── clinical_annotations.tsv
│   └── ...
└── reports/              # Generated outputs
```

## MyHeritage Conversion

MyHeritage exports as CSV with headers:
```
"RSID","CHROMOSOME","POSITION","RESULT"
"rs12345","1","12345","AG"
```

Conversion:
1. Strip quotes
2. Convert header to comment
3. Output as TSV

## Running Analysis

```bash
# From genescope directory
python scripts/run_full_analysis.py data/genome.txt --name "User Name"

# Reports generated in reports/
```
