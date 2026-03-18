/** Core types for the genetic analysis pipeline */

/** A single SNP from the user's genome file */
export interface GenomeSNP {
  rsid: string
  chromosome: string
  position: string
  genotype: string
}

/** Parsed genome data indexed by rsID */
export type GenomeByRsid = Map<string, GenomeSNP>

/** Variant interpretation from the curated SNP database */
export interface VariantInterpretation {
  status: string
  desc: string
  magnitude: number
}

/** A curated SNP entry */
export interface CuratedSNP {
  gene: string
  category: string
  note?: string
  variants: Record<string, VariantInterpretation>
}

/** A lifestyle/health finding */
export interface HealthFinding {
  rsid: string
  gene: string
  category: string
  genotype: string
  status: string
  description: string
  magnitude: number
  note: string
}

/** A PharmGKB drug-gene finding */
export interface PharmGKBFinding {
  rsid: string
  gene: string
  drugs: string
  genotype: string
  annotation: string
  level: string
  category: string
}

/** PharmGKB entry */
export interface PharmGKBEntry {
  gene: string
  drugs: string
  phenotype: string
  level: string
  category: string
  genotypes: Record<string, string>
}

/** A ClinVar disease finding */
export interface DiseaseFinding {
  rsid: string
  chromosome: string
  position: string
  gene: string
  ref: string
  alt: string
  userGenotype: string
  isHomozygous: boolean
  isHeterozygous: boolean
  clinicalSignificance: string
  reviewStatus: string
  goldStars: number
  traits: string
  inheritance: string
}

/** Categorized disease findings */
export interface DiseaseFindings {
  pathogenic: DiseaseFinding[]
  likelyPathogenic: DiseaseFinding[]
  riskFactor: DiseaseFinding[]
  drugResponse: DiseaseFinding[]
  protective: DiseaseFinding[]
  otherSignificant: DiseaseFinding[]
}

/** Disease analysis stats */
export interface DiseaseStats {
  totalClinvar: number
  matched: number
  pathogenicMatched: number
  likelyPathogenicMatched: number
}

/** Complete analysis results */
export interface AnalysisResults {
  genomeSNPCount: number
  healthFindings: HealthFinding[]
  pharmgkbFindings: PharmGKBFinding[]
  diseaseFindings: DiseaseFindings | null
  diseaseStats: DiseaseStats | null
  summary: {
    totalSNPs: number
    analyzedSNPs: number
    highImpact: number
    moderateImpact: number
    lowImpact: number
  }
}

/** Genome file format */
export type GenomeFormat = 'myheritage' | '23andme' | 'ancestry' | 'unknown'
