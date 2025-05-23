import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { createObjectCsvWriter } from 'csv-writer'

// --- Configuration Loading ---
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

const dbConnectionString = process.env.MAIN_API__DB_DIRECT

if (!dbConnectionString) {
  console.error('Error: MAIN_API__DB_DIRECT environment variable is not set.')
  process.exit(1)
}

// --- CSV Configuration ---
const csvFilePathP1 = path.resolve(__dirname, 'redeemed_presales_p1.csv')
const csvWriterP1 = createObjectCsvWriter({
  path: csvFilePathP1,
  header: [
    { id: 'email', title: 'Email' },
    { id: 'presaleCode', title: 'Presale code' },
    { id: 'walletAddress', title: 'Wallet address' }
  ]
})

const csvFilePathP2 = path.resolve(__dirname, 'redeemed_presales_p2.csv')
const csvWriterP2 = createObjectCsvWriter({
  path: csvFilePathP2,
  header: [
    { id: 'email', title: 'Email' },
    { id: 'presaleCode', title: 'Presale code' },
    { id: 'walletAddress', title: 'Wallet address' }
  ]
})

// --- Database Connection ---
const pool = new Pool({ connectionString: dbConnectionString })

interface RedeemedPresaleRecord {
  email: string
  presaleCode: string
  walletAddress: string | null
}

// --- Main Function ---
async function findRedeemedPresales() {
  console.log('Finding users who redeemed a presale...')
  const client = await pool.connect()
  const recordsP1ToSave: RedeemedPresaleRecord[] = []
  const recordsP2ToSave: RedeemedPresaleRecord[] = []

  try {
    const query = `
      SELECT
        u.email AS "email",
        pc.code AS "presaleCode",
        pc.wallet_address AS "walletAddress"
      FROM
        presale_codes pc
      JOIN
        users u ON pc.user_id = u.id
      WHERE
        pc.redeemed = TRUE
        AND pc.deleted_at IS NULL
        AND u.deleted_at IS NULL;
    `

    const result = await client.query(query)

    if (result.rows.length === 0) {
      console.log('No redeemed presale codes found.')
      return
    }

    console.log(`Found ${result.rows.length} redeemed presale codes. Processing...`)

    for (const row of result.rows) {
      let walletAddr = row.walletAddress;
      if (typeof walletAddr === 'string') {
        // Replace newlines with a space, then trim leading/trailing whitespace
        walletAddr = walletAddr.replace(/\n/g, ' ').trim();
      } else {
        // Ensure null or undefined becomes an empty string for the CSV
        walletAddr = '';
      }

      const record = {
        email: row.email,
        presaleCode: row.presaleCode,
        walletAddress: walletAddr
      }

      if (row.presaleCode.startsWith('P1-')) {
        recordsP1ToSave.push(record)
      } else if (row.presaleCode.startsWith('P2-')) {
        recordsP2ToSave.push(record)
      } else {
        console.warn(`Record with code ${row.presaleCode} does not match P1- or P2- prefix. Skipping.`);
      }
    }

    if (recordsP1ToSave.length > 0) {
      await csvWriterP1.writeRecords(recordsP1ToSave)
      console.log(`Successfully wrote ${recordsP1ToSave.length} P1 records to ${csvFilePathP1}`)
    } else {
      console.log('No P1 records to write.')
    }

    if (recordsP2ToSave.length > 0) {
      await csvWriterP2.writeRecords(recordsP2ToSave)
      console.log(`Successfully wrote ${recordsP2ToSave.length} P2 records to ${csvFilePathP2}`)
    } else {
      console.log('No P2 records to write.')
    }

  } catch (error) {
    console.error('Error finding redeemed presales:', error)
  } finally {
    await client.release()
    await pool.end()
    console.log('Database connection closed.')
  }
}

findRedeemedPresales().catch(err => {
  console.error('Unhandled error in script:', err)
  process.exit(1)
})
