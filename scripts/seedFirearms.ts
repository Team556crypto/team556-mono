import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { scrypt } from 'scrypt-js'
import * as crypto from 'crypto' // Import crypto components

// --- Configuration Loading ---
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

const dbConnectionString = process.env.MAIN_API__DB_DIRECT
const armorySecret = process.env.MAIN_API__ARMORY_SECRET

if (!dbConnectionString) {
  console.error('Error: MAIN_API__DB_DIRECT environment variable is not set.')
  process.exit(1)
}
if (!armorySecret) {
  console.error('Error: MAIN_API__ARMORY_SECRET environment variable is not set.')
  process.exit(1)
}

// --- Data Definition ---
// Adjusted to align closer with CreateFirearmRequest DTO structure
// Use ISO 8601 / RFC3339 string for dates, simple number for price
const firearmsToSeed = [
  {
    owner_user_id: 106,
    name: 'Glock 19 Gen 5',
    type: 'Pistol',
    serial_number: 'AB12345',
    manufacturer: 'Glock',
    model_name: '19 Gen 5',
    acquisition_date: '2023-05-15T10:00:00Z', // RFC3339 / ISO 8601 string
    purchase_price: 550.0, // Simple number/float
    caliber: '9mm',
    ballistic_performance: JSON.stringify({ muzzle_velocity: 1200, energy: 400 }),
    last_fired: new Date('2024-01-10T14:30:00Z'),
    image: '/images/glock19.jpg',
    round_count: 500,
    last_cleaned: new Date('2024-01-01T12:00:00Z'),
    value: 500.0,
    status: 'Active'
  },
  {
    owner_user_id: 106,
    name: 'AR-15 Custom Build',
    type: 'Rifle',
    serial_number: 'XYZ9876',
    manufacturer: 'Aero Precision / BCM',
    model_name: 'Custom',
    acquisition_date: '2022-11-20T09:00:00Z',
    purchase_price: 1250.99,
    caliber: '5.56 NATO',
    ballistic_performance: JSON.stringify({ effective_range: 500, accuracy: '1 MOA' }),
    last_fired: new Date('2024-02-15T11:00:00Z'),
    image: '/images/ar15.jpg',
    round_count: 1500,
    last_cleaned: new Date('2024-02-01T10:00:00Z'),
    value: 1400.0,
    status: 'Active'
  }
  // Add more firearm objects as needed
]

// --- Encryption Helper ---
// Reusing the Go AES GCM logic structure (needs node crypto equivalent)
// Placeholder - replace with actual Node.js crypto implementation if needed
// For direct DB seeding, we need the *exact same* encryption as Go
// For simplicity here, we'll call the Go crypto helper functions if possible,
// otherwise, implement a compatible Node version.
// **Assuming** we have a Node crypto setup compatible with Go's AES-GCM:
async function encryptAESGCM(plaintext: string, secret: string): Promise<string> {
  // IMPORTANT: This needs to produce output IDENTICAL to Go's crypto.EncryptAESGCM

  // Constants matching Go implementation
  const saltLength = 16 // crypto/aes.go
  const keyLength = 32  // crypto/aes.go
  const scryptN = 32768 // crypto/aes.go
  const scryptR = 8     // crypto/aes.go
  const scryptP = 1     // crypto/aes.go

  // 1. Generate a new random salt for each encryption (matching Go)
  const salt = crypto.randomBytes(saltLength)

  // 2. Derive the key using scrypt with parameters matching Go
  const derivedKey = await scrypt(Buffer.from(secret), salt, scryptN, scryptR, scryptP, keyLength);

  // 3. Encrypt using AES-256-GCM
  const iv = crypto.randomBytes(12) // AES-GCM standard nonce size (IV)
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv)

  // Perform encryption
  const encryptedPart1 = cipher.update(plaintext, 'utf8');
  const encryptedPart2 = cipher.final();
  const actualCiphertext = Buffer.concat([encryptedPart1, encryptedPart2]);
  const authTag = cipher.getAuthTag()

  // 4. Combine salt + nonce + ciphertext + auth tag (matching Go)
  const combined = Buffer.concat([salt, iv, actualCiphertext, authTag])

  // 5. Encode the entire combined buffer as Base64
  return combined.toString('base64')
}

// --- Database Connection ---
const pool = new Pool({ connectionString: dbConnectionString })

// --- Seeding Function ---
async function seedFirearms() {
  console.log(
    `Attempting to insert ${firearmsToSeed.length} firearms for User ID: ${firearmsToSeed[0].owner_user_id} directly into DB...`
  )
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (const firearm of firearmsToSeed) {
      console.log(`Processing firearm: ${firearm.name}`)

      // 1. Encrypt sensitive fields
      const encryptedData: { [key: string]: string | null } = {}
      const fieldsToEncrypt = [
        'name',
        'type',
        'serial_number',
        'manufacturer',
        'model_name',
        'acquisition_date',
        'purchase_price', // Add purchase_price here
        'caliber',
        'ballistic_performance',
        'image',
        'round_count',
        'value',
        'status'
      ]

      for (const key of fieldsToEncrypt) {
        let valueToEncrypt: any = (firearm as any)[key]

        // Convert date/price to string before encryption if they exist
        if (key === 'acquisition_date' && valueToEncrypt instanceof Date) {
          valueToEncrypt = valueToEncrypt.toISOString() // Ensure RFC3339 format
        } else if (key === 'acquisition_date' && typeof valueToEncrypt === 'string') {
          // Assume already correct format if string
        } else if (key === 'round_count' && typeof valueToEncrypt === 'number') {
          valueToEncrypt = valueToEncrypt.toString()
        } else if (key === 'value' && typeof valueToEncrypt === 'number') {
          valueToEncrypt = valueToEncrypt.toString()
        } else if (key === 'purchase_price' && typeof valueToEncrypt === 'number') {
          valueToEncrypt = valueToEncrypt.toFixed(2) // Convert price to string with 2 decimal places
        }

        if (valueToEncrypt !== null && valueToEncrypt !== undefined && valueToEncrypt !== '') {
          encryptedData[key] = await encryptAESGCM(String(valueToEncrypt), armorySecret!)
        } else {
          encryptedData[key] = null // Keep nulls as null
        }
      }

      // 2. Prepare SQL Insert Statement
      const columns = [
        'user_id',
        'name',
        'type',
        'serial_number',
        'manufacturer',
        'model_name',
        'acquisition_date',
        'purchase_price', // Add purchase_price here
        'caliber',
        'ballistic_performance',
        'last_fired',
        'image',
        'round_count',
        'last_cleaned',
        'value',
        'status',
        'created_at',
        'updated_at'
      ]

      const values = [
        firearm.owner_user_id,
        encryptedData.name,
        encryptedData.type,
        encryptedData.serial_number,
        encryptedData.manufacturer,
        encryptedData.model_name,
        encryptedData.acquisition_date,
        encryptedData.purchase_price, // Add encrypted purchase price
        encryptedData.caliber,
        encryptedData.ballistic_performance,
        firearm.last_fired?.toISOString() ?? null, // Convert Date to ISO string or null
        encryptedData.image,
        encryptedData.round_count,
        firearm.last_cleaned?.toISOString() ?? null, // Convert Date to ISO string or null
        encryptedData.value,
        encryptedData.status,
        new Date(), // created_at
        new Date() // updated_at
      ]

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      const queryText = `INSERT INTO firearms (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (serial_number) DO NOTHING RETURNING id`

      // 3. Execute Query
      try {
        const res = await client.query(queryText, values)
        if (res.rows.length > 0) {
          console.log(`Inserted firearm: ${firearm.name} with ID: ${res.rows[0].id}`)
        } else {
          console.log(`Skipped firearm (already exists?): ${firearm.name} (Serial: ${firearm.serial_number})`)
        }
      } catch (err: any) {
        console.error(`Error inserting firearm ${firearm.name}:`, err.stack || err)
      }
    }

    await client.query('COMMIT')
    console.log('\nDatabase seeding committed successfully.')
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('\nError during database seeding. Transaction rolled back.')
    console.error('Error:', error.message || error)
    if (error.stack) {
      console.error('Stacktrace:', error.stack)
    }
    process.exitCode = 1 // Indicate failure
  } finally {
    client.release()
    await pool.end() // Close the connection pool
    console.log('Database connection closed.')
  }
}

seedFirearms()
