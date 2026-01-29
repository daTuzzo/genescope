import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename)
    
    if (!sanitizedFilename.endsWith('.md')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'reports', sanitizedFilename)
    const content = await readFile(filePath, 'utf-8')

    return NextResponse.json({
      filename: sanitizedFilename,
      content,
    })
  } catch (error) {
    console.error('Error reading report:', error)
    return NextResponse.json(
      { error: 'Report not found' },
      { status: 404 }
    )
  }
}
