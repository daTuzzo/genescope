// Format detection for 23andMe and AncestryDNA files (#10). Synthetic data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadGenome } from '../src/lib/analysis/genome-loader.ts'

const SYNTHETIC_23ANDME = [
  '# rsid\tchromosome\tposition\tgenotype',
  'rs1000001\t1\t1000\tAA',
  'rs1000002\t1\t2000\tAG',
  'rs1000003\t2\t3000\t--',
  'rs1000004\t3\t4000\tCT',
].join('\n') + '\n'

const SYNTHETIC_ANCESTRY = [
  'rsid\tchromosome\tposition\tallele1\tallele2',
  'rs1000001\t1\t1000\tA\tA',
  'rs1000002\t1\t2000\tA\tG',
  'rs1000003\t2\t3000\t0\t0',
  'rs1000004\t3\t4000\tC\tT',
].join('\n') + '\n'

const SYNTHETIC_MYHERITAGE = [
  '##fileformat=MyHeritage',
  'RSID,CHROMOSOME,POSITION,RESULT',
  '"rs1000001","1","1000","AA"',
  '"rs1000002","1","2000","AG"',
  '"rs1000003","2","3000","--"',
  '"rs1000004","3","4000","CT"',
].join('\n') + '\n'

/** Runs scripts/genome-to-json.mjs on `content` and returns the meta block it writes. */
function convert(content) {
  const dir = mkdtempSync(path.join(tmpdir(), 'genescope-format-'))
  try {
    const input = path.join(dir, 'genome.txt')
    const output = path.join(dir, 'genome.json')
    writeFileSync(input, content)
    execFileSync(process.execPath, [path.join('scripts', 'genome-to-json.mjs'), input, output], { stdio: 'pipe' })
    return JSON.parse(readFileSync(output, 'utf-8'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('genome-to-json reads a 23andMe file as 23andme', () => {
  const out = convert(SYNTHETIC_23ANDME)
  assert.equal(out.meta.format, '23andme')
  assert.equal(out.meta.snpCount, 3)
  assert.equal(out.snps.rs1000002.genotype, 'AG')
})

test('genome-to-json reads an AncestryDNA file as ancestry, without the header row', () => {
  const out = convert(SYNTHETIC_ANCESTRY)
  assert.equal(out.meta.format, 'ancestry')
  assert.equal(out.meta.snpCount, 3)
  assert.equal(out.snps.rs1000004.genotype, 'CT')
  assert.equal(out.snps.rsid, undefined)
})

test('genome-to-json still reads a MyHeritage file as myheritage', () => {
  const out = convert(SYNTHETIC_MYHERITAGE)
  assert.equal(out.meta.format, 'myheritage')
  assert.equal(out.meta.snpCount, 3)
})

test('loadGenome reads a 5-column AncestryDNA file as ancestry with two-letter genotypes', () => {
  const { format, count, snps } = loadGenome(SYNTHETIC_ANCESTRY)
  assert.equal(format, 'ancestry')
  assert.equal(count, 3)
  assert.equal(snps.get('rs1000002')?.genotype, 'AG')
  assert.equal(snps.has('rsid'), false)
})

test('loadGenome reads a 23andMe file as 23andme', () => {
  const { format, count } = loadGenome(SYNTHETIC_23ANDME)
  assert.equal(format, '23andme')
  assert.equal(count, 3)
})
