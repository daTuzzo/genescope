/**
 * Genome file loader — handles 23andMe, MyHeritage, and AncestryDNA formats.
 * All formats are normalized to rsid + chromosome + position + genotype.
 */

import type { GenomeSNP, GenomeByRsid, GenomeFormat } from './types'

/** Detect genome file format from content */
export function detectFormat(content: string): GenomeFormat {
  const lines = content.split('\n', 15)

  // MyHeritage: CSV with headers RSID,CHROMOSOME,POSITION,RESULT (quoted or unquoted)
  // Also detect via ##fileformat=MyHeritage marker
  if (lines.some(l => /["']RSID["']/i.test(l) || /^RSID,CHROMOSOME/i.test(l) || /^##fileformat=MyHeritage/i.test(l))) {
    return 'myheritage'
  }

  // AncestryDNA: header "rsid\tchromosome\tposition\tallele1\tallele2" or mentions AncestryDNA.
  // Checked before 23andMe, whose data-line test also matches AncestryDNA data lines.
  if (lines.some(l => l.includes('AncestryDNA') || /^rsid\tchromosome/i.test(l))) {
    return 'ancestry'
  }

  // 23andMe: TSV with # comments, lines like "rs12345\t1\t12345\tAG"
  if (lines.some(l => l.startsWith('# rsid') || /^rs\d+\t/.test(l))) {
    return '23andme'
  }

  return 'unknown'
}

/** Parse a MyHeritage CSV file into SNP records */
function parseMyHeritage(content: string): GenomeSNP[] {
  const snps: GenomeSNP[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip header lines
    if (/RSID/i.test(trimmed) && /CHROMOSOME/i.test(trimmed)) continue
    // Skip comment lines
    if (trimmed.startsWith('#')) continue

    // Parse CSV properly — MyHeritage format:
    // "rs12345","1","12345","AG"
    // Fields may or may not be quoted
    const fields = parseCSVLine(trimmed)
    if (fields.length < 4) continue

    const [rsid, chromosome, position, genotype] = fields

    // Skip no-calls
    if (!genotype || genotype === '--' || genotype === '00') continue
    // Must have a valid rsID
    if (!rsid.startsWith('rs')) continue

    snps.push({ rsid, chromosome, position, genotype })
  }

  return snps
}

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  fields.push(current.trim())
  return fields
}

/** Parse a 23andMe TSV file */
function parse23andMe(content: string): GenomeSNP[] {
  const snps: GenomeSNP[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const parts = trimmed.split('\t')
    if (parts.length < 4) continue

    const [rsid, chromosome, position, genotype] = parts

    if (!genotype || genotype === '--') continue
    if (!/^(rs|i)\d+$/.test(rsid)) continue // also skips a "rsid" header row

    snps.push({ rsid, chromosome, position, genotype })
  }

  return snps
}

/** Parse an AncestryDNA file (similar to 23andMe but may have allele1/allele2 columns) */
function parseAncestryDNA(content: string): GenomeSNP[] {
  const snps: GenomeSNP[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const parts = trimmed.split('\t')

    // AncestryDNA can have: rsid, chromosome, position, allele1, allele2
    if (parts.length >= 5) {
      const [rsid, chromosome, position, allele1, allele2] = parts
      if (allele1 === '0' || allele2 === '0') continue
      if (!/^rs\d+$/.test(rsid)) continue // also skips the "rsid" header row
      snps.push({ rsid, chromosome, position, genotype: allele1 + allele2 })
    } else if (parts.length >= 4) {
      // Or same as 23andMe format
      const [rsid, chromosome, position, genotype] = parts
      if (!genotype || genotype === '--' || genotype === '00') continue
      if (!rsid.startsWith('rs')) continue
      snps.push({ rsid, chromosome, position, genotype })
    }
  }

  return snps
}

/**
 * Load a genome file (any supported format) and return a Map indexed by rsID.
 * Auto-detects format.
 */
export function loadGenome(content: string): { snps: GenomeByRsid; format: GenomeFormat; count: number } {
  const format = detectFormat(content)

  let snpList: GenomeSNP[]
  switch (format) {
    case 'myheritage':
      snpList = parseMyHeritage(content)
      break
    case '23andme':
      snpList = parse23andMe(content)
      break
    case 'ancestry':
      snpList = parseAncestryDNA(content)
      break
    default:
      // Try 23andMe-style as fallback
      snpList = parse23andMe(content)
  }

  const snps: GenomeByRsid = new Map()
  for (const snp of snpList) {
    snps.set(snp.rsid, snp)
  }

  return { snps, format, count: snps.size }
}
