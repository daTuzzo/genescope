import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const decoded = decodeURIComponent(filename)

    // filename format: "profileName/report-file.md"
    // Sanitize to prevent directory traversal
    const parts = decoded.split('/')
    if (parts.length !== 2 || !parts[1].endsWith('.md')) {
      return NextResponse.json({ error: 'Invalid report path' }, { status: 400 })
    }

    const [profileName, reportFile] = parts
    const safeName = path.basename(profileName)
    const safeFile = path.basename(reportFile)

    const filePath = path.join(process.cwd(), 'profiles', safeName, 'reports', safeFile)
    const content = await readFile(filePath, 'utf-8')

    return NextResponse.json({
      filename: `${safeName}/${safeFile}`,
      profileName: safeName,
      content,
    })
  } catch (error) {
    console.error('Error reading report:', error)
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
}
