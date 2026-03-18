/**
 * GeneScope Analysis Pipeline
 *
 * Main entry point that orchestrates:
 * 1. Genome loading (MyHeritage, 23andMe, AncestryDNA)
 * 2. Lifestyle/health SNP analysis (curated database)
 * 3. PharmGKB drug-gene interaction analysis
 * 4. ClinVar disease risk analysis
 * 5. Report generation (3 markdown reports)
 */

import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { loadGenome } from './genome-loader'
import { analyzeHealthSNPs, analyzePharmGKB } from './health-analyzer'
import { analyzeClinVar } from './disease-analyzer'
import { generateGeneticReport, generateDiseaseReport, generateProtocol } from './report-generator'
import type { AnalysisResults } from './types'

export { loadGenome, detectFormat } from './genome-loader'
export type { AnalysisResults, GenomeFormat } from './types'

export interface RunAnalysisOptions {
  /** Raw genome file content */
  genomeContent: string
  /** Base directory of the project (for finding data/ databases) */
  baseDir: string
  /** Output directory for findings.json and reports (defaults to baseDir/reports/) */
  outputDir?: string
}

export interface RunAnalysisResult {
  success: true
  results: AnalysisResults
  reports: {
    genetic: string
    disease: string | null
    protocol: string
  }
  reportFiles: string[]
}

/**
 * Run the full analysis pipeline.
 * Returns analysis results and generated report file paths.
 */
export async function runAnalysis(opts: RunAnalysisOptions): Promise<RunAnalysisResult> {
  const { genomeContent, baseDir, outputDir } = opts
  const dataDir = join(baseDir, 'data')
  const reportsDir = outputDir ?? join(baseDir, 'reports')

  // Ensure output directory exists
  await mkdir(reportsDir, { recursive: true })

  // Step 1: Load genome
  console.log('[Analysis] Loading genome...')
  const { snps: genome, format, count } = loadGenome(genomeContent)
  console.log(`[Analysis] Loaded ${count.toLocaleString()} SNPs (format: ${format})`)

  // Step 2: Analyze lifestyle/health SNPs
  console.log('[Analysis] Analyzing lifestyle/health variants...')
  const healthFindings = analyzeHealthSNPs(genome)
  console.log(`[Analysis] Found ${healthFindings.length} lifestyle/health findings`)

  // Step 3: PharmGKB drug interactions
  let pharmgkbFindings: Awaited<ReturnType<typeof analyzePharmGKB>> = []
  const annotationsPath = join(dataDir, 'clinical_annotations.tsv')
  const allelesPath = join(dataDir, 'clinical_ann_alleles.tsv')

  if (existsSync(annotationsPath) && existsSync(allelesPath)) {
    console.log('[Analysis] Analyzing PharmGKB drug interactions...')
    pharmgkbFindings = await analyzePharmGKB(genome, annotationsPath, allelesPath)
    console.log(`[Analysis] Found ${pharmgkbFindings.length} drug-gene interactions`)
  } else {
    console.log('[Analysis] PharmGKB files not found, skipping drug interactions')
  }

  // Step 4: ClinVar disease risk
  let diseaseFindings: AnalysisResults['diseaseFindings'] = null
  let diseaseStats: AnalysisResults['diseaseStats'] = null
  const clinvarPath = join(dataDir, 'clinvar_alleles.tsv')

  if (existsSync(clinvarPath)) {
    console.log('[Analysis] Analyzing ClinVar disease variants...')
    const result = await analyzeClinVar(genome, clinvarPath)
    diseaseFindings = result.findings
    diseaseStats = result.stats
    console.log(`[Analysis] Found ${diseaseStats.pathogenicMatched} pathogenic, ${diseaseStats.likelyPathogenicMatched} likely pathogenic`)
  } else {
    console.log('[Analysis] ClinVar file not found, skipping disease analysis')
  }

  // Build results
  const results: AnalysisResults = {
    genomeSNPCount: count,
    healthFindings,
    pharmgkbFindings,
    diseaseFindings,
    diseaseStats,
    summary: {
      totalSNPs: count,
      analyzedSNPs: healthFindings.length,
      highImpact: healthFindings.filter(f => f.magnitude >= 3).length,
      moderateImpact: healthFindings.filter(f => f.magnitude >= 2 && f.magnitude < 3).length,
      lowImpact: healthFindings.filter(f => f.magnitude >= 1 && f.magnitude < 2).length,
    },
  }

  // Step 5: Save structured findings as JSON (for Claude to read and reason over)
  console.log('[Analysis] Saving structured findings...')
  const reportFiles: string[] = []

  const findingsPath = join(reportsDir, 'findings.json')
  await writeFile(findingsPath, JSON.stringify(results, null, 2), 'utf-8')
  reportFiles.push(findingsPath)

  // Step 6: Generate automated reports (baseline — Claude can write better ones on top)
  const geneticReport = generateGeneticReport(results)
  const geneticPath = join(reportsDir, 'EXHAUSTIVE_GENETIC_REPORT.md')
  await writeFile(geneticPath, geneticReport, 'utf-8')
  reportFiles.push(geneticPath)

  let diseaseReport: string | null = null
  if (diseaseFindings && diseaseStats) {
    diseaseReport = generateDiseaseReport(diseaseFindings, diseaseStats, count)
    const diseasePath = join(reportsDir, 'EXHAUSTIVE_DISEASE_RISK_REPORT.md')
    await writeFile(diseasePath, diseaseReport, 'utf-8')
    reportFiles.push(diseasePath)
  }

  const protocolReport = generateProtocol(results)
  const protocolPath = join(reportsDir, 'ACTIONABLE_HEALTH_PROTOCOL.md')
  await writeFile(protocolPath, protocolReport, 'utf-8')
  reportFiles.push(protocolPath)

  console.log(`[Analysis] Complete — ${reportFiles.length} files generated (including findings.json for AI analysis)`)

  return {
    success: true,
    results,
    reports: {
      genetic: geneticReport,
      disease: diseaseReport,
      protocol: protocolReport,
    },
    reportFiles,
  }
}
