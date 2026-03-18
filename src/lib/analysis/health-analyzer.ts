/**
 * Lifestyle/Health SNP Analyzer
 *
 * Matches the user's genome against the curated SNP database (~70 well-studied variants)
 * and PharmGKB drug-gene interactions.
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import type {
  GenomeByRsid,
  HealthFinding,
  PharmGKBFinding,
  PharmGKBEntry,
} from './types'
import { CURATED_SNPS } from './snp-database'

/**
 * Analyze genome against the curated SNP database.
 * This is the most reliable part of the analysis — well-studied, manually validated variants.
 */
export function analyzeHealthSNPs(genome: GenomeByRsid): HealthFinding[] {
  const findings: HealthFinding[] = []

  for (const [rsid, info] of Object.entries(CURATED_SNPS)) {
    const snp = genome.get(rsid)
    if (!snp) continue

    const genotype = snp.genotype
    // Try both orientations (e.g., "AG" and "GA")
    const genotypeRev = genotype.length === 2
      ? genotype[1] + genotype[0]
      : genotype

    const variant = info.variants[genotype] ?? info.variants[genotypeRev]
    if (!variant) continue

    findings.push({
      rsid,
      gene: info.gene,
      category: info.category,
      genotype,
      status: variant.status,
      description: variant.desc,
      magnitude: variant.magnitude,
      note: info.note ?? '',
    })
  }

  // Sort by magnitude (highest impact first)
  findings.sort((a, b) => b.magnitude - a.magnitude)
  return findings
}

/**
 * Load PharmGKB data from TSV files and match against genome.
 * Only includes evidence levels 1A, 1B, 2A, 2B (clinically actionable).
 */
export async function analyzePharmGKB(
  genome: GenomeByRsid,
  annotationsPath: string,
  allelesPath: string,
): Promise<PharmGKBFinding[]> {
  // Step 1: Load annotation metadata
  const annotations = new Map<string, {
    rsid: string
    gene: string
    drugs: string
    phenotype: string
    level: string
    category: string
  }>()

  const annStream = createReadStream(annotationsPath, 'utf-8')
  const annRL = createInterface({ input: annStream, crlfDelay: Infinity })

  let annHeader: string[] | null = null
  for await (const line of annRL) {
    if (!annHeader) {
      annHeader = line.split('\t')
      continue
    }
    const fields = line.split('\t')
    const get = (col: string) => {
      const idx = annHeader!.indexOf(col)
      return idx >= 0 ? fields[idx] ?? '' : ''
    }

    const annId = get('Clinical Annotation ID')
    const variant = get('Variant/Haplotypes')
    if (variant.startsWith('rs')) {
      annotations.set(annId, {
        rsid: variant,
        gene: get('Gene'),
        drugs: get('Drug(s)'),
        phenotype: get('Phenotype(s)'),
        level: get('Level of Evidence'),
        category: get('Phenotype Category'),
      })
    }
  }

  // Step 2: Load allele-specific annotations
  const pharmgkb = new Map<string, PharmGKBEntry>()

  const alStream = createReadStream(allelesPath, 'utf-8')
  const alRL = createInterface({ input: alStream, crlfDelay: Infinity })

  let alHeader: string[] | null = null
  for await (const line of alRL) {
    if (!alHeader) {
      alHeader = line.split('\t')
      continue
    }
    const fields = line.split('\t')
    const get = (col: string) => {
      const idx = alHeader!.indexOf(col)
      return idx >= 0 ? fields[idx] ?? '' : ''
    }

    const annId = get('Clinical Annotation ID')
    const ann = annotations.get(annId)
    if (!ann) continue

    const genotype = get('Genotype/Allele')
    const text = get('Annotation Text')

    let entry = pharmgkb.get(ann.rsid)
    if (!entry) {
      entry = {
        gene: ann.gene,
        drugs: ann.drugs,
        phenotype: ann.phenotype,
        level: ann.level,
        category: ann.category,
        genotypes: {},
      }
      pharmgkb.set(ann.rsid, entry)
    }
    entry.genotypes[genotype] = text
  }

  // Step 3: Match against genome
  const findings: PharmGKBFinding[] = []
  const validLevels = new Set(['1A', '1B', '2A', '2B'])

  for (const [rsid, entry] of Array.from(pharmgkb.entries())) {
    if (!validLevels.has(entry.level)) continue

    const snp = genome.get(rsid)
    if (!snp) continue

    const genotype = snp.genotype
    const genotypeRev = genotype.length === 2
      ? genotype[1] + genotype[0]
      : genotype

    const annotation = entry.genotypes[genotype] ?? entry.genotypes[genotypeRev]
    if (!annotation) continue

    findings.push({
      rsid,
      gene: entry.gene,
      drugs: entry.drugs,
      genotype,
      annotation,
      level: entry.level,
      category: entry.category,
    })
  }

  findings.sort((a, b) => a.level.localeCompare(b.level))
  return findings
}
