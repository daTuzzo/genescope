import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    let content = await file.text()

    // Convert MyHeritage format if needed
    if (format === 'myheritage') {
      content = convertMyHeritageToTsv(content)
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data')
    await mkdir(dataDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `genome_${timestamp}.txt`
    const filepath = path.join(dataDir, filename)

    // Write file
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

function convertMyHeritageToTsv(content: string): string {
  const lines = content.split('\n')
  const result: string[] = ['# rsid\tchromosome\tposition\tgenotype']

  for (const line of lines) {
    // Skip header line
    if (line.includes('RSID') || line.includes('rsid') || !line.trim()) continue

    // Parse CSV (handle quoted values)
    const match = line.match(/"?([^",]+)"?,\s*"?([^",]+)"?,\s*"?([^",]+)"?,\s*"?([^",]+)"?/)
    if (match) {
      const [, rsid, chromosome, position, genotype] = match
      result.push(`${rsid}\t${chromosome}\t${position}\t${genotype}`)
    }
  }

  return result.join('\n')
}
