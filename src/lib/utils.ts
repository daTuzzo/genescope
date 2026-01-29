import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function detectGenomeFormat(content: string): 'myheritage' | '23andme' | 'ancestry' | 'unknown' {
  const lines = content.split('\n').slice(0, 10)
  
  // MyHeritage: CSV with quoted headers
  if (lines.some(l => l.includes('"RSID"') || l.includes('"rsid"'))) {
    return 'myheritage'
  }
  
  // 23andMe: TSV with # comments
  if (lines.some(l => l.startsWith('# rsid') || l.match(/^rs\d+\t/))) {
    return '23andme'
  }
  
  // AncestryDNA: Similar to 23andMe but different header format
  if (lines.some(l => l.includes('AncestryDNA') || l.match(/^rsid\tchromosome/i))) {
    return 'ancestry'
  }
  
  return 'unknown'
}

export function convertMyHeritageToTsv(content: string): string {
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
