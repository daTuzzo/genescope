# GeneScope Implementation Plan

Based on the YouTube video tutorial: https://youtu.be/O1ICQworLVc

## Overview

Personal genome health analysis tool where **Claude AI generates the health reports** based on SNP annotations from multiple databases.

## Workflow

```
┌─────────────────┐
│  Raw DNA File   │  (VCF, 23andMe TSV, MyHeritage CSV)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse & Extract│  Extract SNPs with rsIDs
│     SNPs        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Query Databases for EACH SNP               │
│  ├── ClinVar → clinical significance        │
│  ├── PharmGKB → drug response               │
│  └── SNPedia → general health info          │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Claude AI      │  Generate summaries for each SNP
│  (via API)      │  using prompt template
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  3 Markdown Reports                         │
│  ├── clinvar_report.md    (clinical)        │
│  ├── pharmgkb_report.md   (drug response)   │
│  └── snpedia_report.md    (general health)  │
└─────────────────────────────────────────────┘
```

## Claude AI Prompt Template

```
You are a genetics expert summarizing health implications of a specific SNP.

SNP: {rsid}

ClinVar Annotation: {clinvar_annotation}

PharmGKB Annotation: {pharmgkb_annotation}

SNPedia Summary: {snpedia_summary}

Summarize the potential health risks and benefits associated with this SNP based on the information above.
Provide links to the source databases (ClinVar, PharmGKB, SNPedia) for further reading.
Provide your answer in markdown format, including sections for summary, health risks, health benefits, and sources.
```

## Technical Implementation

### Files to Create

```
genescope/
├── main.py                 # Main entry point
├── lib/
│   ├── parser.py          # VCF/23andMe/MyHeritage parser
│   ├── clinvar.py         # ClinVar API/database queries
│   ├── pharmgkb.py        # PharmGKB API queries
│   ├── snpedia.py         # SNPedia MediaWiki API queries
│   └── claude.py          # Claude API client
├── data/
│   ├── clinvar_alleles.tsv    # Local ClinVar cache (already have)
│   └── clinical_annotations.tsv # PharmGKB data (already have)
├── reports/               # Generated output
└── .env                   # API keys (CLAUDE_API_KEY)
```

### Dependencies

```
vcfpy          # VCF parsing
requests       # API calls
python-dotenv  # Environment variables
anthropic      # Claude API client (or use requests directly)
```

### Execution Steps

1. **Setup**
   ```bash
   pip install vcfpy requests python-dotenv anthropic
   cp .env.example .env
   # Add ANTHROPIC_API_KEY to .env
   ```

2. **Run Analysis**
   ```bash
   python main.py data/genome.txt --name "User Name"
   ```

3. **Output**
   - `reports/clinvar_report.md`
   - `reports/pharmgkb_report.md`
   - `reports/snpedia_report.md`

## Key Differences from Current Scripts

| Current (Drive scripts) | Video Approach |
|------------------------|----------------|
| Python generates reports with templates | Claude AI generates report content |
| 3 reports: Genetic, Disease Risk, Protocol | 3 reports: ClinVar, PharmGKB, SNPedia |
| Curated SNP database (200 SNPs) | All SNPs with rsIDs analyzed |
| No AI involvement | Claude summarizes each SNP |

## API Access

### ClinVar
- Use local `clinvar_alleles.tsv` (already downloaded)
- Or query: `https://api.ncbi.nlm.nih.gov/variation/v1/`

### PharmGKB
- Use local `clinical_annotations.tsv` (already downloaded)
- Or API: `https://api.pharmgkb.org/v1/`

### SNPedia
- MediaWiki API: `https://bots.snpedia.com/api.php`
- Query: `?action=query&titles=Rs{rsid}&prop=revisions&rvprop=content&format=json`

### Claude
- API: `https://api.anthropic.com/v1/messages`
- Or use Claude Code for local processing

## Using Claude Code Instead of API

Instead of calling Claude API per-SNP (expensive, slow), can batch process:

1. Extract all SNPs + annotations into JSON
2. Run Claude Code with the JSON as context
3. Claude Code generates all 3 reports in one session

Command:
```bash
claude --print "Generate health reports from this SNP data: $(cat snp_annotations.json)" > reports/
```

## Next Steps

1. [ ] Modify parser to output JSON with annotations
2. [ ] Create Claude Code prompt for batch report generation
3. [ ] Build frontend to display reports
4. [ ] Test with real genome data
