#!/usr/bin/env node
/**
 * Process ClinVar variant_summary.txt.gz into a filtered clinvar_alleles.tsv
 *
 * Filters:
 * - GRCh37 assembly only (matches 23andMe / MyHeritage coordinates)
 * - SNPs only (single nucleotide, not indels)
 * - Clinically significant only (pathogenic, likely pathogenic, risk factor, drug response, protective)
 * - Must have a valid RS number (for rsID-based matching)
 *
 * Usage: node scripts/process_clinvar.mjs
 */

import { createReadStream, createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const INPUT_PATH = join(DATA_DIR, 'variant_summary.txt.gz');
const OUTPUT_PATH = join(DATA_DIR, 'clinvar_alleles.tsv');

// Review status -> gold stars mapping (ClinVar standard, https://www.ncbi.nlm.nih.gov/clinvar/docs/review_status/).
// Keep in step with reviewToStars() in src/lib/analysis/disease-analyzer.ts (tests/clinvar-stars.test.mjs checks it).
const REVIEW_STARS = {
  'practice guideline': 4,
  'reviewed by expert panel': 3,
  'criteria provided, multiple submitters, no conflicts': 2,
  'criteria provided, conflicting classifications': 1,
  'criteria provided, conflicting interpretations': 1,
  'criteria provided, single submitter': 1,
  'no assertion for the individual variant': 0,
  'no assertion criteria provided': 0,
  'no classification provided': 0,
  'no classification for the single variant': 0,
};

// Clinical significance values we care about
const SIGNIFICANT_TERMS = [
  'pathogenic',
  'likely pathogenic',
  'risk factor',
  'drug response',
  'protective',
  'affects',
  'association',
  'pathogenic/likely pathogenic',
];

function isSignificant(clinSig) {
  const lower = clinSig.toLowerCase();
  // Skip benign, likely benign, uncertain significance
  if (lower.includes('benign') && !lower.includes('pathogenic')) return false;
  if (lower === 'uncertain significance') return false;
  if (lower === 'not provided') return false;
  // Check for any significant term
  return SIGNIFICANT_TERMS.some(term => lower.includes(term));
}

function getGoldStars(reviewStatus) {
  const lower = reviewStatus.toLowerCase();
  for (const [key, stars] of Object.entries(REVIEW_STARS)) {
    if (lower.includes(key)) return stars;
  }
  return 0;
}

async function processClivar() {
  console.log('Processing ClinVar variant_summary.txt.gz...');
  console.log(`Input: ${INPUT_PATH}`);
  console.log(`Output: ${OUTPUT_PATH}`);

  const gunzip = createGunzip();
  const input = createReadStream(INPUT_PATH).pipe(gunzip);
  const rl = createInterface({ input, crlfDelay: Infinity });

  // Output columns (what our analysis code expects)
  const outputColumns = [
    'rsid', 'chrom', 'pos', 'ref', 'alt', 'symbol',
    'clinical_significance', 'review_status', 'gold_stars',
    'all_traits', 'inheritance_modes',
  ];

  const output = createWriteStream(OUTPUT_PATH);
  output.write(outputColumns.join('\t') + '\n');

  let headerCols = null;
  let lineNum = 0;
  let kept = 0;
  let skipped = {
    notGrch37: 0,
    notSnp: 0,
    noRsid: 0,
    notSignificant: 0,
    noChrom: 0,
  };

  for await (const line of rl) {
    lineNum++;

    // Parse header
    if (lineNum === 1) {
      headerCols = line.split('\t').reduce((acc, col, i) => {
        // Normalize column name: trim and use as-is
        acc[col.replace(/^#/, '').trim()] = i;
        return acc;
      }, {});
      console.log(`Found ${Object.keys(headerCols).length} columns`);
      // Log the columns we need
      const needed = [
        'Assembly', 'Chromosome', 'Start', 'PositionVCF',
        'ReferenceAlleleVCF', 'AlternateAlleleVCF',
        'RS# (dbSNP)', 'GeneSymbol', 'ClinicalSignificance',
        'ReviewStatus', 'PhenotypeList', 'Type',
      ];
      for (const col of needed) {
        if (headerCols[col] === undefined) {
          console.warn(`  WARNING: Column "${col}" not found!`);
        }
      }
      continue;
    }

    const fields = line.split('\t');

    // Get column values safely
    const get = (colName) => {
      const idx = headerCols[colName];
      return idx !== undefined ? (fields[idx] || '') : '';
    };

    // Filter: GRCh37 only
    const assembly = get('Assembly');
    if (assembly !== 'GRCh37') {
      skipped.notGrch37++;
      continue;
    }

    // Filter: must have RS number
    const rsNum = get('RS# (dbSNP)');
    if (!rsNum || rsNum === '-1' || rsNum === '-') {
      skipped.noRsid++;
      continue;
    }
    const rsid = `rs${rsNum}`;

    // Filter: SNPs only (Type = "single nucleotide variant")
    const varType = get('Type');
    if (varType !== 'single nucleotide variant') {
      skipped.notSnp++;
      continue;
    }

    // Filter: clinically significant
    const clinSig = get('ClinicalSignificance');
    if (!isSignificant(clinSig)) {
      skipped.notSignificant++;
      continue;
    }

    // Get position data (prefer VCF-style for consistency)
    const chrom = get('Chromosome');
    const pos = get('PositionVCF') || get('Start');
    const ref = get('ReferenceAlleleVCF') || get('ReferenceAllele');
    const alt = get('AlternateAlleleVCF') || get('AlternateAllele');

    if (!chrom || chrom === '-' || chrom === 'na') {
      skipped.noChrom++;
      continue;
    }

    // Double-check it's a true SNP (single nucleotide ref and alt)
    if (ref.length !== 1 || alt.length !== 1) {
      skipped.notSnp++;
      continue;
    }

    const reviewStatus = get('ReviewStatus');
    const goldStars = getGoldStars(reviewStatus);
    const traits = get('PhenotypeList');
    const gene = get('GeneSymbol');

    // ClinVar doesn't have inheritance in variant_summary — leave empty
    // We'll handle this differently in the analysis
    const inheritance = '';

    const row = [
      rsid, chrom, pos, ref, alt, gene,
      clinSig, reviewStatus, goldStars,
      traits, inheritance,
    ];

    output.write(row.join('\t') + '\n');
    kept++;

    if (lineNum % 500000 === 0) {
      console.log(`  Processed ${lineNum.toLocaleString()} lines, kept ${kept.toLocaleString()}...`);
    }
  }

  output.end();

  console.log('\n--- Processing Complete ---');
  console.log(`Total lines: ${(lineNum - 1).toLocaleString()}`);
  console.log(`Kept: ${kept.toLocaleString()}`);
  console.log(`Skipped:`);
  console.log(`  Not GRCh37: ${skipped.notGrch37.toLocaleString()}`);
  console.log(`  Not SNP: ${skipped.notSnp.toLocaleString()}`);
  console.log(`  No rsID: ${skipped.noRsid.toLocaleString()}`);
  console.log(`  Not significant: ${skipped.notSignificant.toLocaleString()}`);
  console.log(`  No chromosome: ${skipped.noChrom.toLocaleString()}`);
  console.log(`\nOutput: ${OUTPUT_PATH}`);
}

processClivar().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
