import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { runAnalysis } from '@/lib/analysis'
import { isUploadedGenomeFilename, isValidProfileName } from '@/lib/safe-names'

export async function POST(request: NextRequest) {
  try {
    const { filename, profileName } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 })
    }

    // Both values become file paths below. Accept only names that cannot leave data/ or profiles/.
    if (!isUploadedGenomeFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    if (profileName && !isValidProfileName(profileName)) {
      return NextResponse.json({ error: 'Invalid profile name' }, { status: 400 })
    }

    const baseDir = process.cwd()
    const name = profileName || `analysis_${Date.now()}`

    // Check registry
    const registryPath = path.join(baseDir, 'profiles', 'registry.json')
    let registry: { profiles: any[] } = { profiles: [] }
    if (existsSync(registryPath)) {
      registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
    }

    // Set up profile directory
    const profileDir = path.join(baseDir, 'profiles', name)
    const reportsDir = path.join(profileDir, 'reports')
    await mkdir(reportsDir, { recursive: true })

    // Copy genome file to profile
    const sourcePath = path.join(baseDir, 'data', filename)
    const profileGenomePath = path.join(profileDir, 'genome.txt')
    await copyFile(sourcePath, profileGenomePath)

    // Read and analyze
    const genomeContent = await readFile(profileGenomePath, 'utf-8')
    const result = await runAnalysis({ genomeContent, baseDir })

    // Save findings to profile
    await writeFile(
      path.join(profileDir, 'findings.json'),
      JSON.stringify(result.results, null, 2),
      'utf-8',
    )

    // Save reports to profile
    if (result.reports.genetic) {
      await writeFile(path.join(reportsDir, 'genetic-report.md'), result.reports.genetic, 'utf-8')
    }
    if (result.reports.disease) {
      await writeFile(path.join(reportsDir, 'disease-risk.md'), result.reports.disease, 'utf-8')
    }
    if (result.reports.protocol) {
      await writeFile(path.join(reportsDir, 'health-protocol.md'), result.reports.protocol, 'utf-8')
    }

    // Update registry
    const entry = {
      name,
      genomePath: `profiles/${name}/genome.txt`,
      format: 'detected',
      snpCount: result.results.genomeSNPCount,
      analyzedAt: new Date().toISOString(),
      findingsPath: `profiles/${name}/findings.json`,
      reportsDir: `profiles/${name}/reports/`,
    }

    const existingIdx = registry.profiles.findIndex((p: any) => p.name === name)
    if (existingIdx >= 0) {
      registry.profiles[existingIdx] = entry
    } else {
      registry.profiles.push(entry)
    }
    writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      profileName: name,
      summary: result.results.summary,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run analysis' },
      { status: 500 },
    )
  }
}
