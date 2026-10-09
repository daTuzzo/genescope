/**
 * Allowlists for request values that API routes turn into file paths.
 * A value that passes has no path separator and no `..` segment.
 */

/** The names that /api/upload creates: genome_<timestamp>.txt */
const UPLOADED_GENOME_RE = /^genome_\d+\.txt$/

/** A profile folder name: 1 to 64 letters, digits, underscores or hyphens. */
const PROFILE_NAME_RE = /^[A-Za-z0-9_-]{1,64}$/

export function isUploadedGenomeFilename(value: unknown): value is string {
  return typeof value === 'string' && UPLOADED_GENOME_RE.test(value)
}

export function isValidProfileName(value: unknown): value is string {
  return typeof value === 'string' && PROFILE_NAME_RE.test(value)
}
