import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isUploadedGenomeFilename, isValidProfileName } from '../src/lib/safe-names.ts'

test('accepts the file names that /api/upload creates', () => {
  assert.equal(isUploadedGenomeFilename('genome_1791580963118.txt'), true)
  assert.equal(isUploadedGenomeFilename('genome_1.txt'), true)
})

test('rejects any other file name', () => {
  for (const value of [
    '../package.json',
    '..\\package.json',
    'genome_1.txt/../../package.json',
    'sub/genome_1.txt',
    'genome_.txt',
    'genome_1.csv',
    'genome_1.txt ',
    'clinvar_alleles.tsv',
    '',
    undefined,
    null,
    42,
    ['genome_1.txt'],
  ]) {
    assert.equal(isUploadedGenomeFilename(value), false, JSON.stringify(value))
  }
})

test('accepts plain profile names', () => {
  for (const value of ['alice', 'analysis_1791580966906', 'Test-Profile_2', 'a'.repeat(64)]) {
    assert.equal(isValidProfileName(value), true, value)
  }
})

test('rejects profile names that could leave profiles/', () => {
  for (const value of [
    '..',
    '../x',
    '..\\x',
    'a/b',
    'a\\b',
    'registry.json',
    'C:',
    'a b',
    '',
    'a'.repeat(65),
    undefined,
    null,
    7,
    { name: 'x' },
  ]) {
    assert.equal(isValidProfileName(value), false, JSON.stringify(value))
  }
})
