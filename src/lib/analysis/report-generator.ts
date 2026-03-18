/**
 * Markdown Report Generator
 *
 * Generates three reports from analysis results:
 * 1. EXHAUSTIVE_GENETIC_REPORT.md — lifestyle/health findings
 * 2. EXHAUSTIVE_DISEASE_RISK_REPORT.md — ClinVar disease findings
 * 3. ACTIONABLE_HEALTH_PROTOCOL.md — combined recommendations
 */

import type {
  AnalysisResults,
  HealthFinding,
  PharmGKBFinding,
  DiseaseFinding,
  DiseaseFindings,
  DiseaseStats,
} from './types'
import { classifyZygosity } from './disease-analyzer'

// ─── Report 1: Lifestyle/Health Genetics ──────────────────────────────────────

export function generateGeneticReport(results: AnalysisResults): string {
  const { healthFindings, pharmgkbFindings, summary } = results
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')

  let report = `# Genetic Health Report

**Generated:** ${now}

---

## Summary

| Metric | Value |
|--------|-------|
| Total SNPs in genome | ${summary.totalSNPs.toLocaleString()} |
| Curated variants analyzed | ${summary.analyzedSNPs} |
| High impact findings | ${summary.highImpact} |
| Moderate impact findings | ${summary.moderateImpact} |
| Drug-gene interactions | ${pharmgkbFindings.length} |

---

`

  // Group findings by category
  const byCategory = new Map<string, HealthFinding[]>()
  for (const f of healthFindings) {
    const list = byCategory.get(f.category) ?? []
    list.push(f)
    byCategory.set(f.category, list)
  }

  // High impact section first
  const highImpact = healthFindings.filter(f => f.magnitude >= 3)
  if (highImpact.length > 0) {
    report += `## High Impact Findings\n\n`
    report += `These findings have the strongest evidence and most significant health implications.\n\n`
    for (const f of highImpact) {
      report += formatHealthFinding(f)
    }
    report += `---\n\n`
  }

  // Category sections
  const categoryOrder = [
    'Drug Metabolism', 'Methylation', 'Detoxification', 'Neurotransmitters',
    'Caffeine Response', 'Sleep/Circadian', 'Fitness', 'Nutrition',
    'Cardiovascular', 'Inflammation', 'Iron Metabolism', 'Autoimmune',
    'Skin', 'Longevity', 'Respiratory', 'Alcohol',
  ]

  for (const category of categoryOrder) {
    const findings = byCategory.get(category)
    if (!findings?.length) continue

    report += `## ${category}\n\n`
    for (const f of findings) {
      report += formatHealthFinding(f)
    }
  }

  // PharmGKB section
  if (pharmgkbFindings.length > 0) {
    report += `## Drug-Gene Interactions (PharmGKB)\n\n`
    report += `These interactions are from PharmGKB, a curated pharmacogenomics database.\n`
    report += `Evidence levels: 1A/1B = strong clinical evidence, 2A/2B = moderate evidence.\n\n`

    for (const f of pharmgkbFindings) {
      report += `### ${f.gene} — ${f.drugs}\n\n`
      report += `| Field | Value |\n|-------|-------|\n`
      report += `| **Gene** | ${f.gene} |\n`
      report += `| **RSID** | ${f.rsid} |\n`
      report += `| **Your Genotype** | \`${f.genotype}\` |\n`
      report += `| **Drug(s)** | ${f.drugs} |\n`
      report += `| **Evidence Level** | ${f.level} |\n\n`
      report += `**Annotation:** ${f.annotation}\n\n---\n\n`
    }
  }

  report += generateDisclaimer()
  return report
}

function formatHealthFinding(f: HealthFinding): string {
  const mag = f.magnitude >= 4 ? 'Very High' : f.magnitude >= 3 ? 'High' : f.magnitude >= 2 ? 'Moderate' : 'Low'

  let out = `### ${f.gene} — ${f.category}\n\n`
  out += `| Field | Value |\n|-------|-------|\n`
  out += `| **Gene** | ${f.gene} |\n`
  out += `| **RSID** | ${f.rsid} |\n`
  out += `| **Your Genotype** | \`${f.genotype}\` |\n`
  out += `| **Status** | ${f.status} |\n`
  out += `| **Impact** | ${mag} (${f.magnitude}/6) |\n\n`
  out += `**Finding:** ${f.description}\n\n`
  if (f.note) {
    out += `**Note:** ${f.note}\n\n`
  }
  out += `---\n\n`
  return out
}

// ─── Report 2: Disease Risk ──────────────────────────────────────────────────

export function generateDiseaseReport(
  findings: DiseaseFindings,
  stats: DiseaseStats,
  genomeSNPCount: number,
): string {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')

  // Classify pathogenic findings by zygosity
  const affected: (DiseaseFinding & { zygStatus: string; zygDesc: string })[] = []
  const carriers: (DiseaseFinding & { zygStatus: string; zygDesc: string })[] = []
  const hetUnknown: (DiseaseFinding & { zygStatus: string; zygDesc: string })[] = []

  for (const f of [...findings.pathogenic, ...findings.likelyPathogenic]) {
    const { status, description } = classifyZygosity(f)
    const enriched = { ...f, zygStatus: status, zygDesc: description }

    if (status === 'AFFECTED') affected.push(enriched)
    else if (status === 'CARRIER') carriers.push(enriched)
    else hetUnknown.push(enriched)
  }

  let report = `# Disease Risk Report

**Generated:** ${now}

---

## Summary

### Genome Overview
- **Total SNPs in genome:** ${genomeSNPCount.toLocaleString()}
- **ClinVar variants scanned:** ${stats.totalClinvar.toLocaleString()}
- **Positions matched:** ${stats.matched.toLocaleString()}

### Clinical Findings

| Category | Count | Description |
|----------|-------|-------------|
| **Pathogenic (Affected)** | ${affected.length} | Homozygous or dominant |
| **Pathogenic (Carrier)** | ${carriers.length} | Heterozygous carrier for recessive |
| **Likely Pathogenic** | ${hetUnknown.length} | Heterozygous, inheritance unclear |
| **Risk Factors** | ${findings.riskFactor.length} | Increased susceptibility |
| **Drug Response** | ${findings.drugResponse.length} | Pharmacogenomic variants |
| **Protective** | ${findings.protective.length} | Reduced disease risk |

### Confidence Levels (Gold Stars)
- 4 stars: Practice guideline / Expert panel reviewed
- 3 stars: Multiple submitters, no conflicts
- 2 stars: Multiple submitters with some conflicts
- 1 star: Single submitter with criteria

---

`

  // Affected
  if (affected.length > 0) {
    report += `## Pathogenic Variants — Affected Status

These variants are classified as pathogenic and your genotype suggests you may be affected.
**Discuss with a genetic counselor or physician for clinical interpretation.**

`
    for (const f of affected) {
      report += formatDiseaseFinding(f)
    }
  }

  // Carriers
  if (carriers.length > 0) {
    report += `## Carrier Status — Recessive Conditions

You are a heterozygous carrier for these autosomal recessive conditions.
Carriers typically do not show symptoms but may pass the variant to offspring.

`
    for (const f of carriers) {
      report += formatDiseaseFinding(f)
    }
  }

  // Het unknown
  if (hetUnknown.length > 0) {
    report += `## Pathogenic/Likely Pathogenic — Inheritance Unclear

You are heterozygous for these variants. The inheritance pattern is not clearly specified
in ClinVar, so clinical impact is uncertain.

`
    for (const f of hetUnknown) {
      report += formatDiseaseFinding(f)
    }
  }

  // Risk factors
  if (findings.riskFactor.length > 0) {
    report += `## Risk Factor Variants

These variants are associated with increased susceptibility to certain conditions.
They do not guarantee disease but indicate elevated risk.

`
    for (const f of findings.riskFactor) {
      report += formatDiseaseFindingCompact(f)
    }
  }

  // Drug response
  if (findings.drugResponse.length > 0) {
    report += `## Drug Response Variants

These variants affect response to medications.

`
    for (const f of findings.drugResponse) {
      report += formatDiseaseFindingCompact(f)
    }
  }

  // Protective
  if (findings.protective.length > 0) {
    report += `## Protective Variants

These variants are associated with reduced disease risk.

`
    for (const f of findings.protective) {
      report += formatDiseaseFindingCompact(f)
    }
  }

  // Stats
  report += `## Analysis Statistics

| Metric | Value |
|--------|-------|
| Total SNPs in genome | ${genomeSNPCount.toLocaleString()} |
| ClinVar variants scanned | ${stats.totalClinvar.toLocaleString()} |
| Positions matched | ${stats.matched.toLocaleString()} |
| Pathogenic found | ${stats.pathogenicMatched} |
| Likely pathogenic found | ${stats.likelyPathogenicMatched} |
| Risk factors found | ${findings.riskFactor.length} |
| Drug response variants | ${findings.drugResponse.length} |
| Protective variants | ${findings.protective.length} |

---

`

  report += generateDisclaimer()
  return report
}

function formatDiseaseFinding(f: DiseaseFinding & { zygStatus?: string; zygDesc?: string }): string {
  const stars = starString(f.goldStars)
  const condition = f.traits ? f.traits.split(';')[0] : 'Condition not specified'

  let out = `### ${f.gene} — ${condition}\n\n`
  out += `| Field | Value |\n|-------|-------|\n`
  out += `| **Gene** | ${f.gene} |\n`
  out += `| **Position** | chr${f.chromosome}:${f.position} |\n`
  out += `| **RSID** | ${f.rsid} |\n`
  out += `| **Your Genotype** | \`${f.userGenotype}\` |\n`
  out += `| **Variant** | ${f.ref} > ${f.alt} |\n`
  out += `| **Zygosity** | ${f.isHomozygous ? 'Homozygous' : 'Heterozygous'} |\n`
  out += `| **Clinical Significance** | ${f.clinicalSignificance} |\n`
  out += `| **Confidence** | ${stars} (${f.goldStars}/4) |\n`
  out += `| **Inheritance** | ${f.inheritance || 'Not specified'} |\n\n`
  out += `**Condition(s):** ${f.traits || 'Not specified'}\n\n---\n\n`
  return out
}

function formatDiseaseFindingCompact(f: DiseaseFinding): string {
  const stars = starString(f.goldStars)
  const condition = f.traits ? f.traits.split(';')[0] : 'Not specified'

  let out = `### ${f.gene} — ${condition}\n\n`
  out += `| RSID | Genotype | Significance | Confidence |\n`
  out += `|------|----------|--------------|------------|\n`
  out += `| ${f.rsid} | \`${f.userGenotype}\` | ${f.clinicalSignificance} | ${stars} |\n\n`
  out += `**Associated Conditions:** ${f.traits || 'Not specified'}\n\n---\n\n`
  return out
}

function starString(n: number): string {
  return '\u2B50'.repeat(n) + '\u2606'.repeat(Math.max(0, 4 - n))
}

// ─── Report 3: Actionable Protocol ────────────────────────────────────────────

export function generateProtocol(results: AnalysisResults): string {
  const { healthFindings, pharmgkbFindings, diseaseFindings } = results
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')

  // Build gene lookup
  const geneMap = new Map<string, HealthFinding>()
  for (const f of healthFindings) {
    // Keep highest magnitude per gene
    const existing = geneMap.get(f.gene)
    if (!existing || f.magnitude > existing.magnitude) {
      geneMap.set(f.gene, f)
    }
  }

  // Classify disease findings
  const affected: DiseaseFinding[] = []
  const carriers: DiseaseFinding[] = []

  if (diseaseFindings) {
    for (const f of [...diseaseFindings.pathogenic, ...diseaseFindings.likelyPathogenic]) {
      const { status } = classifyZygosity(f)
      if (status === 'AFFECTED') affected.push(f)
      else if (status === 'CARRIER') carriers.push(f)
    }
  }

  const highImpact = healthFindings.filter(f => f.magnitude >= 3)

  let report = `# Actionable Health Protocol

**Generated:** ${now}

This protocol synthesizes all genetic findings into concrete recommendations.

- Lifestyle/health findings: ${healthFindings.length}
- Drug-gene interactions: ${pharmgkbFindings.length}
- Pathogenic variants: ${affected.length} affected, ${carriers.length} carrier
- Risk factors: ${diseaseFindings?.riskFactor.length ?? 0}

---

## High-Impact Findings

`

  if (highImpact.length > 0) {
    for (const f of highImpact) {
      report += `- **${f.gene}** (${f.category}): ${f.description}\n`
    }
  } else {
    report += `No high-impact lifestyle findings detected.\n`
  }

  if (affected.length > 0) {
    report += `\n### Pathogenic Variants (Affected)\n\n`
    for (const f of affected) {
      const condition = f.traits?.split(';')[0] ?? 'Unknown'
      report += `- **${f.gene}**: ${condition} (${f.goldStars}/4 stars)\n`
    }
  }

  if (carriers.length > 0) {
    report += `\n### Carrier Status\n\n`
    for (const f of carriers) {
      const condition = f.traits?.split(';')[0] ?? 'Unknown'
      report += `- **${f.gene}**: ${condition} (${f.goldStars}/4 stars)\n`
    }
  }

  // Supplement suggestions
  report += `\n---\n\n## Supplement Considerations\n\n`
  report += `*Discuss with healthcare provider before starting any supplements.*\n\n`
  report += `| Supplement | Reason | Gene/Source |\n|------------|--------|-------------|\n`

  const supplements: { name: string; reason: string; source: string }[] = []

  const mthfr = geneMap.get('MTHFR')
  if (mthfr && mthfr.magnitude >= 2) {
    supplements.push({ name: 'Methylfolate (L-5-MTHF)', reason: 'MTHFR variant reduces folate conversion', source: 'MTHFR' })
    supplements.push({ name: 'Methylcobalamin (B12)', reason: 'Supports methylation cycle', source: 'MTHFR' })
  }

  const mtrr = geneMap.get('MTRR')
  if (mtrr && mtrr.magnitude >= 2 && !supplements.some(s => s.name.includes('B12'))) {
    supplements.push({ name: 'Methylcobalamin (B12)', reason: 'MTRR variant impairs B12 recycling', source: 'MTRR' })
  }

  const gc = geneMap.get('GC')
  if (gc && gc.status === 'low') {
    supplements.push({ name: 'Vitamin D3', reason: 'Genetically low vitamin D binding protein', source: 'GC' })
  }

  const fads1 = geneMap.get('FADS1')
  if (fads1 && fads1.status === 'low_conversion') {
    supplements.push({ name: 'Fish Oil / Algae Oil (EPA/DHA)', reason: 'Poor plant omega-3 conversion', source: 'FADS1' })
  }

  const comt = geneMap.get('COMT')
  if (comt && comt.status === 'slow') {
    supplements.push({ name: 'Magnesium Glycinate', reason: 'Supports COMT function, calming effect', source: 'COMT' })
  }

  const pemt = geneMap.get('PEMT')
  if (pemt && pemt.magnitude >= 1) {
    supplements.push({ name: 'Choline (or eat more eggs)', reason: 'PEMT variant increases choline requirement', source: 'PEMT' })
  }

  if (supplements.length > 0) {
    for (const s of supplements) {
      report += `| ${s.name} | ${s.reason} | ${s.source} |\n`
    }
  } else {
    report += `| (none identified) | — | — |\n`
  }

  // Drug interactions
  if (pharmgkbFindings.length > 0) {
    report += `\n---\n\n## Drug Interactions to Discuss with Your Doctor\n\n`
    report += `| Drug | Gene | Your Genotype | Evidence |\n`
    report += `|------|------|---------------|----------|\n`
    for (const f of pharmgkbFindings) {
      report += `| ${f.drugs} | ${f.gene} | \`${f.genotype}\` | ${f.level} |\n`
    }
  }

  report += `\n---\n\n`
  report += generateDisclaimer()
  return report
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function generateDisclaimer(): string {
  return `## Disclaimer

This report is for **informational and educational purposes only**. It is NOT a clinical diagnosis.

- Variant classifications are based on database submissions and may change over time
- Clinical significance depends on individual and family history
- Many variants have incomplete penetrance (not everyone with the variant develops the condition)
- **Consult a genetic counselor or physician for clinical interpretation**

---

*Generated by GeneScope using ClinVar, PharmGKB, and curated SNP databases.*
`
}
