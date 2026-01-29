import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const reportsDir = path.join(process.cwd(), 'reports')
    
    // List all report files
    const files = await readdir(reportsDir)
    const reports = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(reportsDir, file)
        const stats = await stat(filePath)
        
        // Determine report type
        let type = 'other'
        let title = file.replace('.md', '')
        
        if (file.includes('EXHAUSTIVE_GENETIC_REPORT')) {
          type = 'genetic'
          title = 'Exhaustive Genetic Report'
        } else if (file.includes('EXHAUSTIVE_DISEASE_RISK')) {
          type = 'disease'
          title = 'Disease Risk Report'
        } else if (file.includes('ACTIONABLE_HEALTH_PROTOCOL')) {
          type = 'protocol'
          title = 'Actionable Health Protocol'
        }

        reports.push({
          filename: file,
          title,
          type,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        })
      }
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error listing reports:', error)
    return NextResponse.json({ reports: [] })
  }
}
