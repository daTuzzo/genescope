# GeneScope 🧬

Personal genome analysis tool. Upload your raw DNA data, get comprehensive health reports.

## What It Does

1. **Upload** your raw DNA file (MyHeritage, 23andMe, or AncestryDNA)
2. **Analyze** against 3 databases:
   - **ClinVar** — 340K+ clinical variants (disease associations)
   - **PharmGKB** — Drug-gene interactions (how you metabolize medications)
   - **Curated SNPs** — 200+ high-impact health variants
3. **Generate** 3 detailed reports:
   - `EXHAUSTIVE_GENETIC_REPORT.md` — Lifestyle & health genetics (methylation, nutrition, fitness, sleep)
   - `EXHAUSTIVE_DISEASE_RISK_REPORT.md` — Clinical variants (pathogenic, carrier status, risk factors)
   - `ACTIONABLE_HEALTH_PROTOCOL.md` — Personalized protocol (supplements, diet, exercise, monitoring)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- ~300MB disk space for databases

### Install & Run

```bash
# Clone the repo
git clone https://github.com/daTuzzo/genescope.git
cd genescope

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:3000

### Usage

1. Drag & drop your genome file (or click to browse)
2. Click "Analyze" 
3. Wait ~2-5 minutes for analysis
4. View your reports in the dashboard

## Supported File Formats

| Provider | Format | Auto-Detected |
|----------|--------|---------------|
| 23andMe | TSV (tab-separated) | ✅ |
| MyHeritage | CSV (comma-separated) | ✅ (auto-converts) |
| AncestryDNA | TSV | ✅ |

## Project Structure

```
genescope/
├── app/                  # Next.js frontend
│   ├── page.tsx         # Upload page
│   ├── dashboard/       # Results dashboard
│   ├── reports/         # Report viewer
│   └── api/             # Backend routes
├── scripts/             # Python analysis
│   ├── run_full_analysis.py      # Main entry point
│   ├── disease_risk_analyzer.py  # ClinVar analysis
│   └── comprehensive_snp_database.py  # Curated SNPs
├── data/                # Reference databases
│   ├── clinvar_alleles.tsv       # ClinVar (289MB)
│   └── clinical_annotations.tsv  # PharmGKB
└── reports/             # Generated outputs
```

## How to Get Your Raw DNA File

### MyHeritage
1. Go to myheritage.com → DNA → Manage DNA kits
2. Click ⋮ (three dots) → Download
3. Check your email for download link

### 23andMe
1. Go to 23andme.com → Settings → 23andMe Data
2. Scroll to "Download Your Data"
3. Request raw data download

### AncestryDNA
1. Go to ancestry.com → DNA → Settings
2. Click "Download Raw DNA Data"

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Python 3, Next.js API routes
- **Databases:** ClinVar, PharmGKB, SNPedia-derived

## Disclaimer

⚠️ **For informational purposes only.** Not a clinical diagnosis. Consult a healthcare provider for medical decisions.

## Credits

Analysis pipeline based on [nicksaraev's Genetic Health](https://github.com/nicksaraev) scripts.
