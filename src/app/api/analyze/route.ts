import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { mkdir } from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 })
    }

    const genomePath = path.join(process.cwd(), 'data', filename)
    const scriptsPath = path.join(process.cwd(), 'scripts', 'run_full_analysis.py')
    const reportsDir = path.join(process.cwd(), 'reports')

    // Ensure reports directory exists
    await mkdir(reportsDir, { recursive: true })

    // Generate analysis ID
    const analysisId = `analysis_${Date.now()}`

    // Run Python analysis
    const result = await runPythonAnalysis(scriptsPath, genomePath, analysisId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysisId,
      message: 'Analysis complete',
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to run analysis' },
      { status: 500 }
    )
  }
}

function runPythonAnalysis(
  scriptPath: string,
  genomePath: string,
  analysisId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = spawn('python3', [scriptPath, genomePath, '--name', analysisId], {
      cwd: process.cwd(),
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    python.stdout.on('data', (data) => {
      stdout += data.toString()
      console.log('[Analysis]', data.toString())
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('[Analysis Error]', data.toString())
    })

    python.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        resolve({ success: false, error: stderr || 'Analysis failed' })
      }
    })

    python.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      python.kill()
      resolve({ success: false, error: 'Analysis timed out' })
    }, 5 * 60 * 1000)
  })
}
