#!/usr/bin/env npx tsx
/**
 * CLI runner for GeneScope analysis pipeline.
 *
 * Usage:
 *   npx tsx scripts/run-analysis.mts <name> <genome-file> [--force]
 *
 * Examples:
 *   npx tsx scripts/run-analysis.mts john ~/Downloads/MyHeritage_raw.csv
 *   npx tsx scripts/run-analysis.mts mom data/genome_mom.txt --force
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

// Resolve project root
const __filename = fileURLToPath(import.meta.url)
const BASE_DIR = resolve(join(__filename, '..', '..'))

interface ProfileEntry {
  name: string
  genomePath: string
  format: string
  snpCount: number
  analyzedAt: string
  findingsPath: string
  reportsDir: string
}

interface Registry {
  profiles: ProfileEntry[]
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const positionalArgs = args.filter(a => !a.startsWith('--'))

  if (positionalArgs.length < 2) {
    console.error('Usage: npx tsx scripts/run-analysis.mts <name> <genome-file> [--force]')
    process.exit(1)
  }

  const [name, genomePath] = positionalArgs
  const resolvedGenomePath = resolve(genomePath)

  if (!existsSync(resolvedGenomePath)) {
    console.error(`Genome file not found: ${resolvedGenomePath}`)
    process.exit(1)
  }

  // Check registry
  const registryPath = join(BASE_DIR, 'profiles', 'registry.json')
  let registry: Registry = { profiles: [] }
  if (existsSync(registryPath)) {
    registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
  }

  const existing = registry.profiles.find(p => p.name === name)
  if (existing && !force) {
    console.error(`Profile "${name}" already exists (analyzed ${existing.analyzedAt}).`)
    console.error('Use --force to re-run.')
    process.exit(1)
  }

  // Set up profile directory — v1 output goes to profiles/<name>/v1/
  const profileDir = join(BASE_DIR, 'profiles', name)
  const v1Dir = join(profileDir, 'v1')
  mkdirSync(v1Dir, { recursive: true })

  // Read genome content from original location
  const genomeContent = readFileSync(resolvedGenomePath, 'utf-8')
  console.log(`Reading genome from ${resolvedGenomePath}`)

  // Dynamic import of the analysis module
  const { runAnalysis } = await import('../src/lib/analysis/index.js')

  console.log(`\nRunning analysis for "${name}" (v1 output to profiles/${name}/v1/)...`)
  const result = await runAnalysis({
    genomeContent,
    baseDir: BASE_DIR,
    outputDir: v1Dir,
  })

  // Update registry
  const entry: ProfileEntry = {
    name,
    genomePath: resolvedGenomePath,
    format: result.results.genomeSNPCount > 0 ? 'detected' : 'unknown',
    snpCount: result.results.genomeSNPCount,
    analyzedAt: new Date().toISOString(),
    findingsPath: `profiles/${name}/v1/findings.json`,
    reportsDir: `profiles/${name}/v1/`,
  }

  if (existing) {
    const idx = registry.profiles.indexOf(existing)
    registry.profiles[idx] = entry
  } else {
    registry.profiles.push(entry)
  }

  writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')

  // Summary
  console.log('\n===== Analysis Complete =====')
  console.log(`Profile: ${name}`)
  console.log(`SNPs loaded: ${result.results.genomeSNPCount.toLocaleString()}`)
  console.log(`Health findings: ${result.results.healthFindings.length}`)
  console.log(`Drug interactions: ${result.results.pharmgkbFindings.length}`)
  if (result.results.diseaseStats) {
    console.log(`Pathogenic: ${result.results.diseaseStats.pathogenicMatched}`)
    console.log(`Likely pathogenic: ${result.results.diseaseStats.likelyPathogenicMatched}`)
    console.log(`Risk factors: ${result.results.diseaseFindings?.riskFactor.length ?? 0}`)
  }
  console.log(`\nFiles saved to: profiles/${name}/`)
  console.log(`  - findings.json (structured data for Claude)`)
  console.log(`  - reports/genetic-report.md`)
  console.log(`  - reports/disease-risk.md`)
  console.log(`  - reports/health-protocol.md`)
  console.log(`\nRun /interpret-results ${name} for Claude's intelligent analysis.`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
