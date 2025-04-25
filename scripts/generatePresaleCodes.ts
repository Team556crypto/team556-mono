import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const dbUrl = process.env.MAIN_API__DB_DIRECT

if (!dbUrl) {
  console.error('Error: MAIN_API__DB_DIRECT environment variable not set.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: dbUrl
})

interface PresaleCode {
  code: string
  redeemed: boolean
}

// Function to generate unique codes
function generateCodes(prefix: string, count: number): PresaleCode[] {
  const codes: PresaleCode[] = []
  const generated = new Set<string>()
  while (codes.length < count) {
    const uniquePart = uuidv4().split('-')[0] // Use first part of UUID for brevity
    const code = `${prefix}${uniquePart}`.toUpperCase()
    if (!generated.has(code)) {
      codes.push({ code, redeemed: false })
      generated.add(code)
    }
  }
  return codes
}

async function insertCodes(codes: PresaleCode[]) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    console.log(`Attempting to insert ${codes.length} codes...`)

    // Use a prepared statement for efficiency and security
    const insertQuery =
      'INSERT INTO presale_codes (code, redeemed, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (code) DO NOTHING'

    let insertedCount = 0
    for (const code of codes) {
      const res = await client.query(insertQuery, [code.code, code.redeemed])
      // Check if rowCount is not null before using it
      if (res.rowCount && res.rowCount > 0) {
        insertedCount++
      }
    }

    await client.query('COMMIT')
    console.log(`Successfully inserted ${insertedCount} new codes.`)
    if (insertedCount < codes.length) {
      console.log(`${codes.length - insertedCount} codes already existed and were skipped.`)
    }
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Error inserting codes:', e)
    throw e
  } finally {
    client.release()
  }
}

async function main() {
  console.log('Generating presale codes...')
  const p1Codes = generateCodes('P1-', 172)
  const p2Codes = generateCodes('P2-', 100)
  const allCodes = [...p1Codes, ...p2Codes]

  console.log(`Generated ${p1Codes.length} P1 codes and ${p2Codes.length} P2 codes.`)

  try {
    await insertCodes(allCodes)
    console.log('Presale code generation finished.')
  } catch (error) {
    console.error('Failed to generate presale codes:', error)
  } finally {
    await pool.end() // Close the connection pool
  }
}

main()
