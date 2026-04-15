#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const EXPECTED_FAMILIES = ['wallet', 'pos', 'landing', 'wp-plugin']
const SURFACE_ID_PATTERN = /^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      continue
    }

    const key = token.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }

    parsed[key] = value
    index += 1
  }

  return parsed
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath))
}

function readText(filePath) {
  return fs.readFileSync(path.resolve(filePath), 'utf8')
}

function parseScalar(rawValue) {
  const value = rawValue.trim()

  if (value === '') return ''
  if (value === 'null') return null
  if (value === 'true') return true
  if (value === 'false') return false

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      throw new Error(`Invalid double-quoted string scalar: ${value}`)
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }

  return value
}

function parseInlineKeyValue(raw, lineNumber) {
  const delimiterIndex = raw.indexOf(':')
  if (delimiterIndex <= 0) {
    throw new Error(`YAML parse error at line ${lineNumber}: expected key:value pair`) 
  }

  const key = raw.slice(0, delimiterIndex).trim()
  const value = parseScalar(raw.slice(delimiterIndex + 1))
  return { key, value }
}

function parseTrackerYaml(content) {
  const result = {}
  const lines = content.split(/\r?\n/)

  let currentTopLevelKey = null
  let currentListItem = null

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const rawLine = lines[index]

    if (!rawLine || rawLine.trim().length === 0) {
      continue
    }

    const trimmed = rawLine.trim()
    if (trimmed.startsWith('#')) {
      continue
    }

    if (!rawLine.startsWith(' ')) {
      const topMatch = /^([a-zA-Z0-9_\-]+):\s*(.*)$/.exec(rawLine)
      if (!topMatch) {
        throw new Error(`YAML parse error at line ${lineNumber}: invalid top-level syntax`)
      }

      const [, key, rawValue] = topMatch
      if (rawValue.trim().length === 0) {
        result[key] = []
        currentTopLevelKey = key
        currentListItem = null
      } else {
        result[key] = parseScalar(rawValue)
        currentTopLevelKey = null
        currentListItem = null
      }
      continue
    }

    const listMatch = /^  -\s*(.*)$/.exec(rawLine)
    if (listMatch) {
      if (!currentTopLevelKey || !Array.isArray(result[currentTopLevelKey])) {
        throw new Error(`YAML parse error at line ${lineNumber}: list item without active list key`)
      }

      const inline = listMatch[1]
      if (currentTopLevelKey === 'surfaces') {
        const item = {}
        if (inline.trim().length > 0) {
          const { key, value } = parseInlineKeyValue(inline, lineNumber)
          item[key] = value
        }
        result[currentTopLevelKey].push(item)
        currentListItem = item
      } else {
        result[currentTopLevelKey].push(parseScalar(inline))
        currentListItem = null
      }
      continue
    }

    const nestedMatch = /^    ([a-zA-Z0-9_\-]+):\s*(.*)$/.exec(rawLine)
    if (nestedMatch) {
      if (currentTopLevelKey !== 'surfaces' || !currentListItem) {
        throw new Error(`YAML parse error at line ${lineNumber}: nested key outside surfaces list item`)
      }

      const [, key, rawValue] = nestedMatch
      currentListItem[key] = parseScalar(rawValue)
      continue
    }

    throw new Error(`YAML parse error at line ${lineNumber}: unsupported syntax`) 
  }

  return result
}

function countByFamily(rows) {
  const counts = {}
  for (const family of EXPECTED_FAMILIES) {
    counts[family] = 0
  }
  for (const row of rows) {
    counts[row.family] = (counts[row.family] ?? 0) + 1
  }
  return counts
}

function validateCensus(census) {
  const errors = []

  if (!census || typeof census !== 'object') {
    return ['Census content is not a valid JSON object.']
  }

  if (!Array.isArray(census.surfaces)) {
    return ['Census is missing surfaces array.']
  }

  if (census.surfaces.length === 0) {
    errors.push('Census surfaces array is empty.')
    return errors
  }

  const seenIds = new Set()
  const duplicates = []

  for (const row of census.surfaces) {
    const rowId = row?.surface_id
    const rowMissing = ['surface_id', 'family', 'surface_kind', 'relative_path'].filter((field) => {
      return typeof row?.[field] !== 'string' || row[field].trim().length === 0
    })

    if (rowMissing.length > 0) {
      errors.push(`Malformed census row ${rowId || '<missing-id>'}: missing ${rowMissing.join(', ')}`)
      continue
    }

    if (!SURFACE_ID_PATTERN.test(rowId)) {
      errors.push(`Invalid surface_id format: ${rowId}`)
    }

    if (seenIds.has(rowId)) {
      duplicates.push(rowId)
    }
    seenIds.add(rowId)
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate census surface IDs: ${duplicates.join(', ')}`)
  }

  const familyCounts = countByFamily(census.surfaces)
  const missingFamilies = EXPECTED_FAMILIES.filter((family) => (familyCounts[family] ?? 0) === 0)
  if (missingFamilies.length > 0) {
    errors.push(`Missing required family coverage in census: ${missingFamilies.join(', ')}`)
  }

  return errors
}

function validateTracker(tracker) {
  const errors = []

  if (!tracker || typeof tracker !== 'object') {
    return ['Tracker content is not a valid YAML object.']
  }

  if (!Array.isArray(tracker.surfaces)) {
    return ['Tracker is missing surfaces list.']
  }

  if (tracker.surfaces.length === 0) {
    errors.push('Tracker surfaces list is empty.')
    return errors
  }

  const requiredFields = [
    'surface_id',
    'family',
    'surface_kind',
    'relative_path',
    'status',
    'coverage_state'
  ]

  const seenIds = new Set()
  const duplicates = []
  const malformedRows = []

  for (let index = 0; index < tracker.surfaces.length; index += 1) {
    const row = tracker.surfaces[index]
    const rowId = typeof row?.surface_id === 'string' && row.surface_id.trim().length > 0
      ? row.surface_id
      : `<row-${index + 1}>`

    const missingFields = requiredFields.filter((field) => {
      const value = row?.[field]
      return typeof value !== 'string' || value.trim().length === 0
    })

    if (missingFields.length > 0) {
      malformedRows.push(`${rowId} (missing ${missingFields.join(', ')})`)
      continue
    }

    if (!SURFACE_ID_PATTERN.test(row.surface_id)) {
      malformedRows.push(`${row.surface_id} (invalid surface_id format)`)
    }

    if (seenIds.has(row.surface_id)) {
      duplicates.push(row.surface_id)
    }
    seenIds.add(row.surface_id)
  }

  if (malformedRows.length > 0) {
    errors.push(`Malformed tracker rows: ${malformedRows.join('; ')}`)
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate tracker surface IDs: ${duplicates.join(', ')}`)
  }

  return errors
}

function verifyInventoryParity(census, tracker, phase) {
  const censusRows = census.surfaces
  const trackerRows = tracker.surfaces

  const censusById = new Map(censusRows.map((row) => [row.surface_id, row]))
  const trackerById = new Map(trackerRows.map((row) => [row.surface_id, row]))

  const missingSurfaceIds = []
  const extraSurfaceIds = []
  const mismatchedFamilyIds = []
  const mismatchedPathIds = []

  for (const censusRow of censusRows) {
    const trackerRow = trackerById.get(censusRow.surface_id)
    if (!trackerRow) {
      missingSurfaceIds.push(censusRow.surface_id)
      continue
    }

    if (trackerRow.family !== censusRow.family) {
      mismatchedFamilyIds.push(censusRow.surface_id)
    }

    if (trackerRow.relative_path !== censusRow.relative_path) {
      mismatchedPathIds.push(censusRow.surface_id)
    }
  }

  for (const trackerRow of trackerRows) {
    if (!censusById.has(trackerRow.surface_id)) {
      extraSurfaceIds.push(trackerRow.surface_id)
    }
  }

  const censusFamilyCounts = countByFamily(censusRows)
  const trackerFamilyCounts = countByFamily(trackerRows)

  const errors = []
  if (censusRows.length !== trackerRows.length) {
    errors.push(`Row-count mismatch: census=${censusRows.length}, tracker=${trackerRows.length}`)
  }
  if (missingSurfaceIds.length > 0) {
    errors.push(`Missing tracker rows for surface IDs: ${missingSurfaceIds.join(', ')}`)
  }
  if (extraSurfaceIds.length > 0) {
    errors.push(`Tracker has extra rows not in census: ${extraSurfaceIds.join(', ')}`)
  }
  if (mismatchedFamilyIds.length > 0) {
    errors.push(`Tracker family mismatch for IDs: ${mismatchedFamilyIds.join(', ')}`)
  }
  if (mismatchedPathIds.length > 0) {
    errors.push(`Tracker path mismatch for IDs: ${mismatchedPathIds.join(', ')}`)
  }

  const summary = {
    phase,
    census_count: censusRows.length,
    tracker_count: trackerRows.length,
    covered_count: censusRows.length - missingSurfaceIds.length,
    missing_surface_ids: missingSurfaceIds,
    extra_surface_ids: extraSurfaceIds,
    census_family_counts: censusFamilyCounts,
    tracker_family_counts: trackerFamilyCounts,
    coverage_status: errors.length === 0 ? 'pass' : 'fail'
  }

  return { errors, summary }
}

function verifyPhaseArguments(args) {
  const phase = args.phase || 'inventory'
  const errors = []

  if (!['inventory', 'personas', 'final'].includes(phase)) {
    errors.push(`Unsupported phase "${phase}". Expected inventory|personas|final.`)
    return { phase, errors }
  }

  const requiredByPhase = {
    inventory: ['tracker', 'census'],
    personas: ['tracker', 'census', 'taxonomy', 'journeys'],
    final: ['tracker', 'census', 'taxonomy', 'journeys', 'evidence', 'report']
  }

  for (const requiredArg of requiredByPhase[phase]) {
    if (!args[requiredArg]) {
      errors.push(`Missing required argument --${requiredArg} for phase ${phase}`)
    }
  }

  const mustExistByPhase = {
    inventory: ['tracker', 'census'],
    personas: ['tracker', 'census', 'taxonomy', 'journeys'],
    final: ['tracker', 'census', 'taxonomy', 'journeys', 'evidence']
  }

  for (const argName of mustExistByPhase[phase]) {
    const maybePath = args[argName]
    if (maybePath && !fileExists(maybePath)) {
      errors.push(`Missing required file for --${argName}: ${maybePath}`)
    }
  }

  return { phase, errors }
}

function run() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`[s01-verify] ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const { phase, errors: phaseErrors } = verifyPhaseArguments(args)
  if (phaseErrors.length > 0) {
    for (const phaseError of phaseErrors) {
      console.error(`[s01-verify] ${phaseError}`)
    }
    process.exit(1)
  }

  let census
  try {
    census = JSON.parse(readText(args.census))
  } catch (error) {
    console.error(`[s01-verify] Failed to parse census JSON: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  let tracker
  try {
    tracker = parseTrackerYaml(readText(args.tracker))
  } catch (error) {
    console.error(`[s01-verify] Failed to parse tracker YAML: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const censusErrors = validateCensus(census)
  const trackerErrors = validateTracker(tracker)

  const allErrors = [...censusErrors, ...trackerErrors]

  let summary = {
    phase,
    census_count: 0,
    tracker_count: 0,
    covered_count: 0,
    missing_surface_ids: [],
    extra_surface_ids: [],
    census_family_counts: {},
    tracker_family_counts: {},
    coverage_status: 'fail'
  }

  if (allErrors.length === 0) {
    const parity = verifyInventoryParity(census, tracker, phase)
    summary = parity.summary
    allErrors.push(...parity.errors)
  }

  const exitCode = allErrors.length === 0 ? 0 : 1
  const report = {
    ...summary,
    exit_code: exitCode
  }

  console.log(JSON.stringify(report, null, 2))

  if (allErrors.length > 0) {
    for (const verificationError of allErrors) {
      console.error(`[s01-verify] ${verificationError}`)
    }
    process.exit(1)
  }

  process.exit(0)
}

run()
