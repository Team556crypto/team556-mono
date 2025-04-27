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
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Error inserting codes:', e)
    throw e
  } finally {
    client.release()
  }
}

async function main() {
  const p1Codes = generateCodes('P1-', 172)
  const p2Codes = generateCodes('P2-', 100)
  const allCodes = [...p1Codes, ...p2Codes]

  try {
    await insertCodes(allCodes)
  } catch (error) {
    console.error('Failed to generate presale codes:', error)
  } finally {
    await pool.end() // Close the connection pool
  }
}

main()
