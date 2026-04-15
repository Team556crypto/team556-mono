#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const EXPECTED_FAMILIES = ['wallet', 'pos', 'landing', 'wp-plugin']

const SURFACE_DEFINITIONS = [
  {
    family: 'wallet',
    surfaceKind: 'route',
    root: 'apps/wallet/app',
    glob: 'apps/wallet/app/**/*.tsx',
    include: ({ relativePath }) => relativePath.endsWith('.tsx')
  },
  {
    family: 'pos',
    surfaceKind: 'route',
    root: 'apps/pos/app',
    glob: 'apps/pos/app/**/*.tsx',
    include: ({ relativePath }) => relativePath.endsWith('.tsx')
  },
  {
    family: 'landing',
    surfaceKind: 'component',
    root: 'apps/wallet/components/landing',
    glob: 'apps/wallet/components/landing/**/*.{ts,tsx}',
    include: ({ relativePath }) => relativePath.endsWith('.ts') || relativePath.endsWith('.tsx')
  },
  {
    family: 'wp-plugin',
    surfaceKind: 'bootstrap',
    root: 'apps/wp-plugin',
    glob: 'apps/wp-plugin/team556-pay.php',
    include: ({ relativePath }) => relativePath === 'apps/wp-plugin/team556-pay.php'
  },
  {
    family: 'wp-plugin',
    surfaceKind: 'admin-php',
    root: 'apps/wp-plugin/includes/admin',
    glob: 'apps/wp-plugin/includes/admin/**/*.php',
    include: ({ relativePath }) => relativePath.endsWith('.php')
  },
  {
    family: 'wp-plugin',
    surfaceKind: 'checkout-php',
    root: 'apps/wp-plugin/includes',
    glob: 'apps/wp-plugin/includes/class-team556-pay{,-gateway,-gateway-blocks,-shortcode}.php',
    include: ({ filename }) =>
      [
        'class-team556-pay.php',
        'class-team556-pay-gateway.php',
        'class-team556-pay-gateway-blocks.php',
        'class-team556-pay-shortcode.php'
      ].includes(filename)
  },
  {
    family: 'wp-plugin',
    surfaceKind: 'frontend-js',
    root: 'apps/wp-plugin/assets/js',
    glob: 'apps/wp-plugin/assets/js/**/*.js',
    include: ({ relativePath, filename }) =>
      relativePath.endsWith('.js') && filename !== 'qrcode.min.js'
  },
  {
    family: 'wp-plugin',
    surfaceKind: 'block-js',
    root: 'apps/wp-plugin/src',
    glob: 'apps/wp-plugin/src/**/*.js',
    include: ({ relativePath }) => relativePath.endsWith('.js')
  }
]

const REQUIRED_ROW_FIELDS = ['surface_id', 'family', 'surface_kind', 'relative_path', 'source_glob', 'source_root']

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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

function walkFiles(rootDir) {
  const absoluteRoot = path.resolve(rootDir)
  const stack = [absoluteRoot]
  const files = []

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue
      }

      const absolutePath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolutePath)
      } else if (entry.isFile()) {
        files.push(absolutePath)
      }
    }
  }

  return files
}

function makeSurfaceId(family, surfaceKind, relativePath) {
  const familyToken = family.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  const kindToken = surfaceKind.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  const pathToken = relativePath
    .replace(/\.[^/.]+$/, '')
    .replace(/^apps\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return `${familyToken}__${kindToken}__${pathToken}`
}

function collectSurfaceRows() {
  const missingRoots = []
  const rows = []

  for (const definition of SURFACE_DEFINITIONS) {
    const rootAbsolute = path.resolve(definition.root)
    if (!fs.existsSync(rootAbsolute)) {
      missingRoots.push(definition.root)
      continue
    }

    const allFiles = walkFiles(definition.root)
    for (const absolutePath of allFiles) {
      const relativePath = toPosixPath(path.relative(process.cwd(), absolutePath))
      const filename = path.basename(absolutePath)

      if (!definition.include({ relativePath, filename })) {
        continue
      }

      rows.push({
        surface_id: makeSurfaceId(definition.family, definition.surfaceKind, relativePath),
        family: definition.family,
        surface_kind: definition.surfaceKind,
        relative_path: relativePath,
        source_glob: definition.glob,
        source_root: definition.root
      })
    }
  }

  return { rows, missingRoots }
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

function validateRows(rows) {
  const errors = []

  if (rows.length === 0) {
    errors.push('Census scan returned zero rows.')
    return errors
  }

  const invalidRows = []
  for (const row of rows) {
    const missingFields = REQUIRED_ROW_FIELDS.filter((field) => {
      const value = row[field]
      return typeof value !== 'string' || value.trim().length === 0
    })

    if (missingFields.length > 0) {
      invalidRows.push(`${row.surface_id || '<missing-id>'} (missing: ${missingFields.join(', ')})`)
    }
  }

  if (invalidRows.length > 0) {
    errors.push(`Malformed census row(s): ${invalidRows.join('; ')}`)
  }

  const seen = new Set()
  const duplicates = []
  for (const row of rows) {
    if (seen.has(row.surface_id)) {
      duplicates.push(row.surface_id)
    }
    seen.add(row.surface_id)
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate surface_id values: ${duplicates.join(', ')}`)
  }

  const familyCounts = countByFamily(rows)
  const missingFamilies = EXPECTED_FAMILIES.filter((family) => (familyCounts[family] ?? 0) === 0)
  if (missingFamilies.length > 0) {
    errors.push(`Missing required families: ${missingFamilies.join(', ')}`)
  }

  return errors
}

function sortRows(rows) {
  return [...rows].sort((left, right) => {
    return (
      left.family.localeCompare(right.family) ||
      left.surface_kind.localeCompare(right.surface_kind) ||
      left.relative_path.localeCompare(right.relative_path)
    )
  })
}

function buildTrackerYaml(rows) {
  const lines = []

  lines.push('schema_version: 1')
  lines.push('scope: "m001-s01"')
  lines.push('status_seed: "inventory"')
  lines.push('families:')
  for (const family of EXPECTED_FAMILIES) {
    lines.push(`  - ${JSON.stringify(family)}`)
  }
  lines.push('surfaces:')

  const trackerRowFields = [
    'surface_id',
    'family',
    'surface_kind',
    'relative_path',
    'source_glob',
    'status',
    'coverage_state',
    'capability_id',
    'persona_id',
    'journey_id',
    'dependency_anchor',
    'failure_semantics',
    'notes'
  ]

  for (const row of rows) {
    const trackerRow = {
      surface_id: row.surface_id,
      family: row.family,
      surface_kind: row.surface_kind,
      relative_path: row.relative_path,
      source_glob: row.source_glob,
      status: 'seeded',
      coverage_state: 'inventory-seeded',
      capability_id: '',
      persona_id: '',
      journey_id: '',
      dependency_anchor: '',
      failure_semantics: '',
      notes: ''
    }

    lines.push(`  - surface_id: ${JSON.stringify(trackerRow.surface_id)}`)
    for (const field of trackerRowFields.slice(1)) {
      lines.push(`    ${field}: ${JSON.stringify(trackerRow[field])}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

function writeAtomic(filePath, content) {
  const absolutePath = path.resolve(filePath)
  const directory = path.dirname(absolutePath)
  const tempPath = `${absolutePath}.tmp-${process.pid}`

  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(tempPath, content, 'utf8')
  fs.renameSync(tempPath, absolutePath)
}

function run() {
  const args = parseArgs(process.argv.slice(2))
  const outPath = args.out || 'docs/parity/m001/s01/surface-census.json'
  const trackerPath = args.tracker || path.join(path.dirname(outPath), 'coverage-tracker.yaml')

  const { rows, missingRoots } = collectSurfaceRows()

  if (missingRoots.length > 0) {
    console.error('[s01-surface-census] Missing required surface root(s):')
    for (const missingRoot of missingRoots) {
      console.error(`  - ${missingRoot}`)
    }
    process.exit(1)
  }

  const sortedRows = sortRows(rows)
  const rowErrors = validateRows(sortedRows)
  if (rowErrors.length > 0) {
    console.error('[s01-surface-census] Validation failed:')
    for (const rowError of rowErrors) {
      console.error(`  - ${rowError}`)
    }
    process.exit(1)
  }

  const familyCounts = countByFamily(sortedRows)
  const censusDocument = {
    schema_version: 1,
    scope: 'm001-s01',
    families: EXPECTED_FAMILIES,
    surface_count: sortedRows.length,
    family_counts: familyCounts,
    surfaces: sortedRows
  }

  const censusJson = `${JSON.stringify(censusDocument, null, 2)}\n`
  const trackerYaml = buildTrackerYaml(sortedRows)

  try {
    writeAtomic(outPath, censusJson)
    writeAtomic(trackerPath, trackerYaml)
  } catch (error) {
    console.error('[s01-surface-census] Failed to write census/tracker artifacts atomically.')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  console.log('[s01-surface-census] Census + tracker generated successfully.')
  console.log(`[s01-surface-census] census_path=${toPosixPath(outPath)}`)
  console.log(`[s01-surface-census] tracker_path=${toPosixPath(trackerPath)}`)
  console.log(`[s01-surface-census] surface_count=${sortedRows.length}`)
  console.log(`[s01-surface-census] family_counts=${JSON.stringify(familyCounts)}`)
}

run()
