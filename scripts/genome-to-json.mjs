#!/usr/bin/env node
/**
 * Convert a genome file (MyHeritage CSV / 23andMe TSV / AncestryDNA) to JSON.
 *
 * Output format:
 * {
 *   "meta": { "format": "myheritage", "snpCount": 608505, "processedAt": "..." },
 *   "snps": {
 *     "rs762551":  { "chrom": "15", "pos": "75041917", "genotype": "AC" },
 *     "rs4680":    { "chrom": "22", "pos": "19951271", "genotype": "AG" },
 *     ...
 *   }
 * }
 *
 * Usage:
 *   node scripts/genome-to-json.mjs input.csv output.json
 *   node scripts/genome-to-json.mjs profiles/georgi/MyHeritage_raw.csv profiles/georgi/genome.json
 */

import { readFileSync, writeFileSync } from 'fs'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/genome-to-json.mjs <input-genome> <output.json>')
  process.exit(1)
}

const content = readFileSync(inputPath, 'utf-8')
const lines = content.split('\n')

// Detect format
let format = 'unknown'
const headerLines = lines.slice(0, 15)
// Same tests and order as detectFormat() in src/lib/analysis/genome-loader.ts. The MyHeritage test needs a
// quoted RSID, a CSV header or the MyHeritage marker, so the tab-separated 23andMe and AncestryDNA headers
// do not match it. AncestryDNA goes before 23andMe, whose data-line test also matches AncestryDNA data.
if (headerLines.some(l => /["']RSID["']/i.test(l) || /^RSID,CHROMOSOME/i.test(l) || /^##fileformat=MyHeritage/i.test(l))) {
  format = 'myheritage'
} else if (headerLines.some(l => l.includes('AncestryDNA') || /^rsid\tchromosome/i.test(l))) {
  format = 'ancestry'
} else if (headerLines.some(l => l.startsWith('# rsid') || /^rs\d+\t/.test(l))) {
  format = '23andme'
}

const snps = {}
let skipped = 0

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue

  let rsid, chrom, pos, genotype

  if (format === 'myheritage') {
    // CSV: "rs123","1","12345","AG" or unquoted
    if (/RSID/i.test(trimmed) && /CHROMOSOME/i.test(trimmed)) continue
    const fields = parseCSV(trimmed)
    if (fields.length < 4) continue
    ;[rsid, chrom, pos, genotype] = fields
  } else {
    // TSV: rs123\t1\t12345\tAG
    const parts = trimmed.split('\t')
    if (parts.length >= 5) {
      // AncestryDNA with allele1/allele2
      ;[rsid, chrom, pos] = parts
      genotype = parts[3] + parts[4]
      if (parts[3] === '0' || parts[4] === '0') { skipped++; continue }
    } else if (parts.length >= 4) {
      ;[rsid, chrom, pos, genotype] = parts
    } else {
      continue
    }
  }

  if (!rsid || !/^rs\d+$/.test(rsid)) continue // also skips the "rsid" header row
  if (!genotype || genotype === '--' || genotype === '00') { skipped++; continue }

  snps[rsid] = { chrom, pos, genotype }
}

const output = {
  meta: {
    format,
    snpCount: Object.keys(snps).length,
    skippedNoCalls: skipped,
    processedAt: new Date().toISOString(),
    source: inputPath,
  },
  snps,
}

writeFileSync(outputPath, JSON.stringify(output), 'utf-8')

// Also write a pretty-printed stats summary
console.log(`Converted: ${inputPath}`)
console.log(`Format: ${format}`)
console.log(`SNPs: ${output.meta.snpCount.toLocaleString()}`)
console.log(`Skipped (no-calls): ${skipped.toLocaleString()}`)
console.log(`Output: ${outputPath} (${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1)}MB)`)

function parseCSV(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  fields.push(current.trim())
  return fields
}
