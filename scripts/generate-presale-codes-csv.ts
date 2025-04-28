import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { createObjectCsvWriter } from 'csv-writer'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const databaseUrl = process.env.MAIN_API__DB_POOLER

if (!databaseUrl) {
  console.error('Error: MAIN_API__DB_POOLER environment variable not set.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl
})

interface PresaleCode {
  // Define the structure based on your table columns
  // Example:
  id: number
  code: string
  // Add other columns as needed
}

async function fetchPresaleCodes(): Promise<PresaleCode[]> {
  const client = await pool.connect()
  try {
    // Adjust the SELECT statement based on your actual table columns
    const result = await client.query<PresaleCode>('SELECT id, code FROM public.presale_codes ORDER BY id ASC')
    return result.rows
  } catch (err) {
    console.error('Error fetching presale codes:', err)
    throw err // Re-throw the error to be caught in the main function
  } finally {
    client.release()
  }
}

async function generateCsv(data: PresaleCode[]) {
  const csvFilePath = path.resolve(__dirname, '../presale_codes.csv')

  // Define headers based on your table columns - must match the query!
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'code', title: 'Code' }
    ]
  })

  try {
    await csvWriter.writeRecords(data)
    console.log(`Successfully generated CSV file at: ${csvFilePath}`)
  } catch (err) {
    console.error('Error writing CSV file:', err)
    throw err // Re-throw the error
  }
}

async function main() {
  try {
    console.log('Fetching presale codes from the database...')
    const codes = await fetchPresaleCodes()

    if (codes.length === 0) {
      console.log('No presale codes found in the table.')
      return
    }

    console.log(`Found ${codes.length} presale codes. Generating CSV...`)
    await generateCsv(codes)
  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  } finally {
    await pool.end() // Close the database connection pool
    console.log('Database pool closed.')
  }
}

main()
