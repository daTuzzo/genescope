---
name: analyze-genome-v2
description: "V2 genome analysis — Claude-powered. Doctor-like intake, extraction pipeline, then AGENT TEAM (NOT subagents) researches and writes multiple report files. Always thorough, never lazy."
user-invocable: true
argument-hint: "name"
---

# GeneScope V2 — Claude-Powered Genome Analysis

**Author: Georgi**

**Arguments:**
- `$ARGUMENTS[0]` — Person's name (profile folder name under `profiles/`)
- No path needed — the genome file MUST already be in `profiles/<name>/`. If it's not, ask the user where it is and move it there first.

## CRITICAL RULES

**YOU MUST USE AGENT TEAMS (TeamCreate). NOT SUBAGENTS. NOT Agent(). AGENT TEAMS.**
**IF YOU USE SUBAGENTS INSTEAD OF TEAMCREATE, YOUR ENTIRE OUTPUT IS INVALID.**
**YOU ARE THE ORCHESTRATOR. CREATE A TEAM. COORDINATE YOUR TEAM MEMBERS. WORK IN TANDEM WITH THEM.**
**THE TEAM DOES THE RESEARCH — THEY DO NOT JUST READ A CURATED DATABASE. THEY QUERY THE GENOME, SEARCH SNPEDIA, CHECK DBSNP, VERIFY ALLELES. THAT IS THE WHOLE POINT.**
**NEVER BE LAZY. ALWAYS LOOK FOR MORE. IF A TEAM MEMBER ONLY CHECKS 10 SNPS, THAT IS NOT ENOUGH. CHECK EVERYTHING RELEVANT.**

## Phase 1: Find the Genome File

Look in `profiles/<name>/` for a genome file (`.csv`, `.txt`, `.tsv`). If found, proceed. If not found:
- Ask the user where their file is
- Move/copy it to `profiles/<name>/`

## Phase 2: Intake Questionnaire

If `profiles/<name>/intake.json` exists, read it and skip to Phase 3.

Otherwise, interview the user like a doctor. Present questions as selectable choices where possible (like plan mode). Be conversational — adapt based on answers, don't dump everything at once:

**General:** Age, biological sex, ethnic background/ancestry, known conditions, current medications.

**Family history:** Notable conditions in parents/siblings (heart disease, cancer, diabetes, autoimmune, neurological). Known genetic conditions.

**Lifestyle:** Diet type, exercise habits, sleep patterns (morning/night owl), caffeine intake and effects, alcohol, smoking, current supplements.

**Specific concerns:** What they want to know, past medication reactions, foods that affect them unusually.

Save to `profiles/<name>/intake.json`.

## Phase 3: Extraction Pipeline

**Always run this. Every time. No skipping.**

1. Create `profiles/<name>/v2/`
2. Find the genome file in `profiles/<name>/` and convert to JSON:
   ```bash
   node scripts/genome-to-json.mjs profiles/<name>/<genome-file> profiles/<name>/v2/genome.json
   ```
3. Run ClinVar + PharmGKB extraction (database scans that need scripts — 308K ClinVar entries):
   Save to `profiles/<name>/v2/findings.json`
4. Update `profiles/registry.json`

### How team members query the genome

```bash
node scripts/lookup-snps.mjs profiles/<name>/v2/genome.json rs762551 rs4680 rs1801133
```
Returns clean JSON. Can request as many rsIDs as needed in one call.

## Phase 4: AGENT TEAM Interpretation

**USE TeamCreate. NOT Agent(). NOT subagents. AGENT TEAMS.**

You are the orchestrator. Create a team of 4 members. You coordinate them, they research and write. You work IN TANDEM — communicate, share findings, catch what they miss.

Each team member MUST:
- Query the genome using `lookup-snps.mjs` for ALL rsIDs relevant to their domain — BE EXHAUSTIVE
- Read `profiles/<name>/v2/findings.json` for ClinVar + PharmGKB data
- Read `profiles/<name>/intake.json` for user context
- **RESEARCH** — WebSearch and WebFetch to verify interpretations against SNPedia, dbSNP, CPIC guidelines
- **NEVER RELY ONLY ON THE CURATED DATABASE** — the curated SNP database (snp-database.ts) is V1 garbage. Team members use their own knowledge + research to interpret genotypes
- Verify plus-strand allele orientation on dbSNP BEFORE interpreting any genotype. If unsure, state uncertainty.
- Look for more SNPs beyond the obvious ones. If the user mentioned a concern in intake, search for relevant rsIDs for it.
- **NEVER BE LAZY. ALWAYS LOOK FOR MORE. ALWAYS CROSS-REFERENCE. ALWAYS VERIFY.**
- Write their report file directly to `profiles/<name>/v2/`

### Team Members

**pharmacogenomics** → writes `profiles/<name>/v2/pharmacogenomics.md`

Research and look up from genome:
- CYP enzymes: CYP1A2 (rs762551), CYP2C19 (rs4244285, rs12248560), CYP2C9 (rs1799853, rs1057910), CYP2D6 (rs3892097 + others), CYP3A5 (rs776746)
- Critical safety: DPYD (rs3918290), TPMT (rs1800460), SLCO1B1 (rs4149056), VKORC1 (rs9923231), HLA-B (rs2395029), UGT1A1, NAT2 (rs1801280, rs1799930)
- PharmGKB findings from findings.json
- Cross-reference with user's current medications from intake — flag safety concerns PROMINENTLY
- Research CPIC guidelines for any flagged gene-drug pairs
- Verify plus-strand allele orientation on dbSNP for every interpretation
- Look for additional pharmacogenes beyond this list — DO NOT STOP AT THE OBVIOUS ONES

**methylation** → writes `profiles/<name>/v2/methylation-neuro.md`

Research and look up from genome:
- Methylation pathway: MTHFR (rs1801133, rs1801131), MTRR (rs1801394), MTR (rs1805087), CBS (rs234706), PEMT (rs7946), BHMT, AHCY, MAT1A, MTHFD1, SHMT1, TCN2
- Detox: SOD2 (rs4880), GSTP1 (rs1695, rs1138272), GPX1, NQO1
- Neurotransmitters: COMT (rs4680, rs4633), BDNF (rs6265), DRD2/ANKK1 (rs1800497), OPRM1 (rs1799971), SLC6A4 (rs25531), MAO-A, GAD1, DBH, TPH2, HTR2A
- Explain PATHWAY interactions — how do these combine? What are the bottlenecks?
- Research on SNPedia/PubMed — don't just rely on what you know
- Look for additional one-carbon metabolism SNPs — DO NOT STOP AT THE OBVIOUS ONES

**disease-risk** → writes `profiles/<name>/v2/disease-risk.md`

Research and look up from genome:
- All ClinVar pathogenic/likely pathogenic from findings.json — VERIFY EACH on SNPedia/dbSNP
- Cardiovascular: APOE (rs429358 + rs7412 → determine e2/e3/e4), F5 Leiden (rs6025), F2 (rs1799963), AGTR1 (rs5186), AGT (rs699), ACE (rs4343), GNB3 (rs5443), ADRB1 (rs1801253)
- Iron: HFE C282Y (rs1800562) + H63D (rs1799945) — compound heterozygosity matters
- Autoimmune: HLA-DQA1 (rs2187668), PTPN22 (rs2476601), STAT4 (rs7574865)
- Respiratory: SERPINA1 (rs28929474)
- Longevity: FOXO3 (rs2802292), TP53 (rs1042522), CETP (rs2542052)
- Cross-reference with family history from intake
- For every ClinVar pathogenic finding: check allele frequency, verify not false positive, check population context
- Look for additional disease SNPs based on user's ethnicity and family history — DO NOT STOP AT THE OBVIOUS ONES

**lifestyle** → writes `profiles/<name>/v2/lifestyle-nutrition.md`

Research and look up from genome:
- Weight/diabetes: FTO (rs9939609), TCF7L2 (rs7903146), PPARG (rs1801282), ADRB3 (rs4994), APOA2 (rs5082), MC4R
- Nutrients: FADS1 (rs174547), BCMO1 (rs12934922), FUT2 (rs602662), GC/vitamin D (rs2282679), MCM6/LCT (rs4988235)
- Fitness: ACTN3 (rs1815739), ACE (rs1799752, rs4343), PPARGC1A (rs8192678), PPARA (rs4253778), COL5A1 (rs7181866), COL1A1 (rs1800012), ADRB2 (rs1042713)
- Sleep: CLOCK (rs1801260), PER2 (rs57875989), ARNTL (rs12649507), MTNR1B (rs28532698), ADA (rs73598374), ADORA2A (rs5751876, rs2298383)
- Caffeine: CYP1A2 (rs762551), ADORA2A
- Alcohol: ALDH2 (rs671), ADH1B (rs1229984)
- Skin: MC1R (rs1805007, rs1805008, rs2228479), IRF4 (rs12203592)
- Inflammation: TNF (rs1800629), IL6 (rs1800795)
- Cross-reference with diet, exercise, sleep, caffeine from intake
- If user asked about something specific, research relevant SNPs for it
- DO NOT STOP AT THE OBVIOUS ONES — look for everything relevant

### Orchestrator responsibilities (you)

While the team works, prepare cross-domain analysis. When all 4 report back:
- Review ALL outputs thoroughly
- Identify cross-domain interactions they missed (slow COMT + CYP1A2 caffeine, MTHFR + folate-depleting meds, HFE + iron supplements, etc.)
- Resolve contradictions between team members
- Contextualize everything with intake answers
- Challenge your team if their output seems thin — send them back to look for more

## Phase 5: Write Final Synthesis Report

Write `profiles/<name>/v2/full-report.md`:

```markdown
# GeneScope Report — <Name>
**V2 | Claude-Interpreted | <Date>**

## About You
(From intake — age, ancestry, relevant context)

## Key Takeaways
(Top 5-7 most important findings, personalized)

## Pharmacogenomics
(From pharmacogenomics.md — drug metabolism, safety alerts)

## Methylation & Neurotransmitters
(From methylation-neuro.md — pathway analysis)

## Disease Risk Assessment
(From disease-risk.md — clinical findings, carrier status)

## Lifestyle & Nutrition
(From lifestyle-nutrition.md — personalized recommendations)

## Gene Interactions
(Cross-domain interactions:
- Compounding effects across categories
- Intake/lifestyle + genetic findings
- Medication + genotype interactions)

## What NOT to Worry About
(Low-confidence findings, common variants that look scary but aren't)

## Suggested Follow-Up
(Tests to ask for, specialists to see, areas to explore)

## Disclaimer
(Educational only, not clinical diagnosis, consult healthcare provider)
```

## Phase 6: Iterative Refinement Loop

**This is NOT optional. After the report, ALWAYS enter this loop.**

### Step 1: Ask findings-based questions

Present follow-up questions as selectable choices based on what the analysis found:

```
Based on your results, I'd like to ask a few more questions:

1. Your COMT is slow — do you get anxious easily? (caffeine, stress, noisy environments)
2. You carry an HFE variant — have you had iron/ferritin tested?
3. Your MTHFR shows reduced activity — do you take B-vitamin supplements?
4. [Optional] Anything else you'd like me to look into?
```

Questions must be:
- Based on a SPECIFIC finding
- Answerable by a normal person (no jargon)
- Connecting genetics to lived experience

### Step 2: Update intake.json

Append answers under `followUp` array in `profiles/<name>/intake.json`.

### Step 3: Update reports

Re-read reports in `profiles/<name>/v2/` and **update them in-place** with new context. Compound — don't rewrite from scratch.

### Step 4: Loop or close

Ask if they want more questions, deeper dive, or to stop. Keep looping until done.
