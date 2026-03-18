import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const baseDir = process.cwd()
    const registryPath = path.join(baseDir, 'profiles', 'registry.json')

    if (!existsSync(registryPath)) {
      return NextResponse.json({ reports: [] })
    }

    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
    const reports = []

    for (const profile of registry.profiles) {
      const reportsDir = path.join(baseDir, profile.reportsDir)

      try {
        const files = await readdir(reportsDir)
        for (const file of files) {
          if (!file.endsWith('.md')) continue
          const filePath = path.join(reportsDir, file)
          const stats = await stat(filePath)

          let type = 'other'
          let title = file.replace('.md', '').replace(/-/g, ' ')
          if (file.includes('genetic')) {
            type = 'genetic'
            title = 'Genetic Health Report'
          } else if (file.includes('disease')) {
            type = 'disease'
            title = 'Disease Risk Report'
          } else if (file.includes('protocol')) {
            type = 'protocol'
            title = 'Health Protocol'
          }

          reports.push({
            filename: `${profile.name}/${file}`,
            profileName: profile.name,
            title: `${title} — ${profile.name}`,
            type,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          })
        }
      } catch {
        // Profile reports dir might not exist yet
      }
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error listing reports:', error)
    return NextResponse.json({ reports: [] })
  }
}
