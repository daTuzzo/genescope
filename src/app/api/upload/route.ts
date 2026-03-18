import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { detectFormat } from '@/lib/analysis'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Detect format (no conversion needed — genome-loader handles all formats natively)
    const format = detectFormat(content)

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data')
    await mkdir(dataDir, { recursive: true })

    // Save with unique filename
    const timestamp = Date.now()
    const filename = `genome_${timestamp}.txt`
    const filepath = path.join(dataDir, filename)

    // Write raw content — the analysis pipeline handles format differences
    await writeFile(filepath, content, 'utf-8')

    return NextResponse.json({
      success: true,
      filename,
      format,
      size: content.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
