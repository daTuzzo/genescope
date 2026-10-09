/**
 * ClinVar Disease Risk Analyzer
 *
 * Matches user genome against ClinVar database to find clinically significant variants.
 *
 * KEY FIXES vs the original Python implementation:
 * 1. Uses rsID-based matching (not position-based) — eliminates genome build mismatch
 * 2. Requires minimum gold_stars >= 1 for pathogenic claims
 * 3. Filters by clinical significance properly (handles "Pathogenic/Likely pathogenic")
 * 4. Streams the ClinVar file (doesn't load it all into memory)
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import type {
  GenomeByRsid,
  DiseaseFinding,
  DiseaseFindings,
  DiseaseStats,
} from './types'

/** Minimum gold stars required to report pathogenic/likely pathogenic findings */
const MIN_STARS_PATHOGENIC = 1

/**
 * Classify clinical significance string into a category.
 * Handles ClinVar's messy multi-value strings properly.
 */
function classifyClinSig(raw: string): string | null {
  const lower = raw.toLowerCase()

  // Skip benign and uncertain
  if (lower === 'benign' || lower === 'likely benign' || lower === 'benign/likely benign') {
    return null
  }
  if (lower === 'uncertain significance' || lower === 'not provided') {
    return null
  }

  // Pathogenic (including "Pathogenic/Likely pathogenic" — should be treated as pathogenic)
  if (lower.includes('pathogenic') && !lower.includes('benign') && !lower.includes('conflict')) {
    if (lower === 'likely pathogenic' || lower === 'likely_pathogenic') {
      return 'likely_pathogenic'
    }
    // "Pathogenic", "Pathogenic/Likely pathogenic", etc.
    if (lower.includes('pathogenic')) {
      return 'pathogenic'
    }
  }

  if (lower.includes('risk factor') || lower.includes('risk_factor')) return 'risk_factor'
  if (lower.includes('drug response') || lower.includes('drug_response')) return 'drug_response'
  if (lower.includes('protective')) return 'protective'
  if (lower.includes('association') || lower.includes('affects')) return 'other_significant'

  return null
}

/**
 * Convert ClinVar review status to gold stars, as ClinVar does:
 * https://www.ncbi.nlm.nih.gov/clinvar/docs/review_status/
 */
export function reviewToStars(status: string): number {
  const lower = status.toLowerCase()
  if (lower.includes('practice guideline')) return 4
  if (lower.includes('expert panel')) return 3
  if (lower.includes('multiple submitters') && lower.includes('no conflicts')) return 2
  if (lower.includes('conflicting')) return 1
  if (lower.includes('criteria provided') && lower.includes('single')) return 1
  return 0
}

/**
 * Analyze genome against ClinVar database.
 *
 * IMPORTANT: This uses rsID-based matching, NOT position-based.
 * This eliminates false positives from genome build mismatches (GRCh37 vs GRCh38).
 */
export async function analyzeClinVar(
  genome: GenomeByRsid,
  clinvarPath: string,
): Promise<{ findings: DiseaseFindings; stats: DiseaseStats }> {
  const findings: DiseaseFindings = {
    pathogenic: [],
    likelyPathogenic: [],
    riskFactor: [],
    drugResponse: [],
    protective: [],
    otherSignificant: [],
  }

  const stats: DiseaseStats = {
    totalClinvar: 0,
    matched: 0,
    pathogenicMatched: 0,
    likelyPathogenicMatched: 0,
  }

  const stream = createReadStream(clinvarPath, 'utf-8')
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  let header: string[] | null = null

  for await (const line of rl) {
    if (!header) {
      header = line.split('\t')
      continue
    }

    stats.totalClinvar++
    const fields = line.split('\t')

    const get = (col: string): string => {
      const idx = header!.indexOf(col)
      return idx >= 0 ? fields[idx] ?? '' : ''
    }

    // rsID-based matching (the key fix)
    const rsid = get('rsid')
    if (!rsid || !rsid.startsWith('rs')) continue

    const snp = genome.get(rsid)
    if (!snp) continue

    stats.matched++

    const ref = get('ref')
    const alt = get('alt')

    // Only true SNPs (single nucleotide)
    if (ref.length !== 1 || alt.length !== 1) continue

    const userGenotype = snp.genotype

    // Check if user has the variant allele
    const hasVariant = userGenotype.includes(alt)
    const isHomozygous = userGenotype === alt + alt
    const isHeterozygous = hasVariant && !isHomozygous
    const hasRefOnly = userGenotype === ref + ref

    if (hasRefOnly || !hasVariant) continue

    // Classify clinical significance
    const clinSig = get('clinical_significance')
    const category = classifyClinSig(clinSig)
    if (!category) continue

    // From the review status when the row has one, so a clinvar_alleles.tsv processed with the old
    // star table still gets ClinVar's stars without a rebuild.
    const reviewStatus = get('review_status')
    const goldStars = reviewStatus ? reviewToStars(reviewStatus) : parseInt(get('gold_stars')) || 0

    // For pathogenic/likely pathogenic: require minimum confidence
    if ((category === 'pathogenic' || category === 'likely_pathogenic') && goldStars < MIN_STARS_PATHOGENIC) {
      continue
    }

    const finding: DiseaseFinding = {
      rsid,
      chromosome: get('chrom') || snp.chromosome,
      position: get('pos') || snp.position,
      gene: get('symbol'),
      ref,
      alt,
      userGenotype,
      isHomozygous,
      isHeterozygous,
      clinicalSignificance: clinSig,
      reviewStatus: get('review_status'),
      goldStars,
      traits: get('all_traits'),
      inheritance: get('inheritance_modes') || '',
    }

    switch (category) {
      case 'pathogenic':
        findings.pathogenic.push(finding)
        stats.pathogenicMatched++
        break
      case 'likely_pathogenic':
        findings.likelyPathogenic.push(finding)
        stats.likelyPathogenicMatched++
        break
      case 'risk_factor':
        findings.riskFactor.push(finding)
        break
      case 'drug_response':
        findings.drugResponse.push(finding)
        break
      case 'protective':
        findings.protective.push(finding)
        break
      case 'other_significant':
        findings.otherSignificant.push(finding)
        break
    }
  }

  // Sort all categories by confidence (gold stars descending, then gene name)
  const sortByConfidence = (a: DiseaseFinding, b: DiseaseFinding) =>
    b.goldStars - a.goldStars || a.gene.localeCompare(b.gene)

  findings.pathogenic.sort(sortByConfidence)
  findings.likelyPathogenic.sort(sortByConfidence)
  findings.riskFactor.sort(sortByConfidence)
  findings.drugResponse.sort(sortByConfidence)
  findings.protective.sort(sortByConfidence)
  findings.otherSignificant.sort(sortByConfidence)

  return { findings, stats }
}

/**
 * Classify zygosity impact based on inheritance pattern.
 */
export function classifyZygosity(finding: DiseaseFinding): { status: string; description: string } {
  const inheritance = finding.inheritance.toLowerCase()

  if (finding.isHomozygous) {
    return { status: 'AFFECTED', description: 'Homozygous for variant allele' }
  }

  if (finding.isHeterozygous) {
    if (inheritance.includes('recessive')) {
      return { status: 'CARRIER', description: 'Heterozygous carrier (autosomal recessive)' }
    }
    if (inheritance.includes('dominant')) {
      return { status: 'AFFECTED', description: 'Heterozygous (autosomal dominant — one copy sufficient)' }
    }
    if (inheritance.includes('x-linked')) {
      return { status: 'CARRIER/AT_RISK', description: 'X-linked variant (impact depends on sex)' }
    }
    return { status: 'HETEROZYGOUS', description: 'Heterozygous (inheritance pattern not specified in ClinVar)' }
  }

  return { status: 'UNKNOWN', description: 'Zygosity unclear' }
}
