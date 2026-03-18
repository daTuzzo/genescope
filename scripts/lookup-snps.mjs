#!/usr/bin/env node
/**
 * SNP Lookup Script — designed for Claude/LLM usage
 *
 * Reads a genome.json file and returns genotypes for requested rsIDs.
 * Fast, focused output that fits easily in an LLM context window.
 *
 * Usage:
 *   node scripts/lookup-snps.mjs <genome.json> rs762551 rs4680 rs1801133
 *   node scripts/lookup-snps.mjs <genome.json> --file snp-list.txt
 *   node scripts/lookup-snps.mjs <genome.json> --all          (dumps everything, big!)
 *   node scripts/lookup-snps.mjs <genome.json> --stats         (summary only)
 *
 * Output: clean JSON to stdout
 */

import { readFileSync } from 'fs'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node scripts/lookup-snps.mjs <genome.json> <rsIDs...>')
  console.error('       node scripts/lookup-snps.mjs <genome.json> --file snp-list.txt')
  console.error('       node scripts/lookup-snps.mjs <genome.json> --stats')
  process.exit(1)
}

const genomePath = args[0]
const genome = JSON.parse(readFileSync(genomePath, 'utf-8'))

// --stats: just show summary
if (args.includes('--stats')) {
  console.log(JSON.stringify(genome.meta, null, 2))
  process.exit(0)
}

// --all: dump everything (warning: large)
if (args.includes('--all')) {
  console.log(JSON.stringify(genome, null, 2))
  process.exit(0)
}

// --file: read rsIDs from a file (one per line)
let rsids
if (args.includes('--file')) {
  const fileIdx = args.indexOf('--file')
  const listPath = args[fileIdx + 1]
  rsids = readFileSync(listPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('rs'))
} else {
  rsids = args.slice(1).filter(a => a.startsWith('rs'))
}

// Look up each rsID
const results = {}
const missing = []

for (const rsid of rsids) {
  if (genome.snps[rsid]) {
    results[rsid] = genome.snps[rsid]
  } else {
    missing.push(rsid)
  }
}

const output = {
  found: Object.keys(results).length,
  missing: missing.length,
  results,
}

if (missing.length > 0) {
  output.missingRsids = missing
}

console.log(JSON.stringify(output, null, 2))
