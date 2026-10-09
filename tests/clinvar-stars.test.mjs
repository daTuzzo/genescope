// ClinVar review status -> gold stars (#11). ClinVar's table: https://www.ncbi.nlm.nih.gov/clinvar/docs/review_status/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { reviewToStars } from '../src/lib/analysis/disease-analyzer.ts'

const CLINVAR_STARS = [
  ['practice guideline', 4],
  ['reviewed by expert panel', 3],
  ['criteria provided, multiple submitters, no conflicts', 2],
  ['criteria provided, conflicting classifications', 1],
  ['criteria provided, conflicting interpretations', 1],
  ['criteria provided, single submitter', 1],
  ['no assertion criteria provided', 0],
  ['no classification provided', 0],
]

test('reviewToStars gives ClinVar\'s stars', () => {
  for (const [status, stars] of CLINVAR_STARS) {
    assert.equal(reviewToStars(status), stars, status)
  }
})

test('process_clinvar.mjs writes the same stars as reviewToStars', () => {
  // The script runs on import, so read its REVIEW_STARS table from the source.
  const source = readFileSync('scripts/process_clinvar.mjs', 'utf-8')
  const table = source.slice(source.indexOf('const REVIEW_STARS = {'), source.indexOf('};', source.indexOf('const REVIEW_STARS = {')))
  const rows = [...table.matchAll(/'([^']+)':\s*(\d)/g)].map(([, status, stars]) => [status, Number(stars)])
  assert.ok(rows.length >= 8)
  for (const [status, stars] of rows) {
    assert.equal(stars, reviewToStars(status), status)
  }
  for (const [status, stars] of CLINVAR_STARS) {
    assert.equal(rows.find(([s]) => s === status)?.[1], stars, status)
  }
})
