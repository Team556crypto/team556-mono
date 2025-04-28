import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'
import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import validator from 'validator'

// --- Configuration ---
const USER_CSV_PATH = path.resolve(__dirname, '../presale-type-1-users.csv')
const CODE_CSV_PATH = path.resolve(__dirname, '../presale_codes.csv')
const CODE_PREFIX = 'P1-'
const EMAIL_SUBJECT = 'Your Exclusive Presale Code!'
// Define the email sender address authorised with Resend
const EMAIL_FROM = 'Support <support@openworth.io>' // <-- IMPORTANT: Update this!
// --- End Configuration ---

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const resendApiKey = process.env.GLOBAL__RESEND_API_KEY

if (!resendApiKey) {
  console.error('Error: GLOBAL__RESEND_API_KEY environment variable not set.')
  process.exit(1)
}

const resend = new Resend(resendApiKey)

interface User {
  Name: string
  Email: string
  Address: string
}

interface PresaleCode {
  ID: string
  Code: string
}

async function readCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`))
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: T) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: any) => reject(error))
  })
}

async function main() {
  try {
    // 1. Read Users and Validate Emails
    console.log(`Reading users from ${USER_CSV_PATH}...`)
    const users = await readCsv<User>(USER_CSV_PATH)
    console.log(`Found ${users.length} users.`)

    const validUsers: User[] = []
    const invalidUserReasons: { user: User; reason: string }[] = []

    for (const user of users) {
      let isValid = true
      let reason = ''

      if (!user.Name || user.Name.trim() === '') {
        isValid = false
        reason = 'Missing Name'
      } else if (!user.Email || !validator.isEmail(user.Email)) {
        isValid = false
        reason = `Invalid or Missing Email (${user.Email || 'MISSING'})`
      }

      if (isValid) {
        validUsers.push(user)
      } else {
        invalidUserReasons.push({ user, reason })
      }
    }

    if (invalidUserReasons.length > 0) {
      console.error(`Error: Found ${invalidUserReasons.length} invalid user record(s):`)
      invalidUserReasons.forEach(({ user, reason }) => {
        console.error(`- User (Name: ${user.Name || 'N/A'}, Email: ${user.Email || 'N/A'}): ${reason}`)
      })
      console.error('Please fix the user records in the CSV and try again.')
      process.exit(1)
    }
    console.log(`All ${validUsers.length} user records are valid (have Name, Address, and valid Email).`)

    // 2. Read and Filter Codes
    console.log(`Reading codes from ${CODE_CSV_PATH}...`)
    const allCodes = await readCsv<PresaleCode>(CODE_CSV_PATH)
    const availableCodes = allCodes.map(c => c.Code).filter(code => code && code.startsWith(CODE_PREFIX))

    console.log(
      `Found ${allCodes.length} total codes, ${availableCodes.length} codes matching prefix '${CODE_PREFIX}'.`
    )

    // 3. Check Code Availability
    if (availableCodes.length < validUsers.length) {
      console.error(`Error: Not enough codes available for all users.`)
      console.error(
        `Need ${validUsers.length} codes, but only ${availableCodes.length} codes with prefix '${CODE_PREFIX}' found.`
      )
      process.exit(1)
    }

    // Make a copy to assign from
    const codesToAssign = [...availableCodes]

    // 4. Send Emails
    console.log(`Starting to send emails to ${validUsers.length} users...`)
    let successCount = 0
    let failureCount = 0

    for (const user of validUsers) {
      const code = codesToAssign.pop() // Assign a unique code
      if (!code) {
        // Should not happen due to the check above, but good safety measure
        console.error(
          `Error: Ran out of codes unexpectedly while processing user ${user.Email}. This should not happen.`
        )
        failureCount++
        continue
      }

      const emailBody = `
            Hello ${user.Name || 'there'},

            Here is your exclusive presale code:
            ${code}

            Thank you!
        ` // Customize this body as needed

      try {
        // console.log(`Attempting to send code ${code} to ${user.Email}...`); // Verbose logging
        const { data, error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [user.Email],
          subject: EMAIL_SUBJECT,
          text: emailBody // Use 'html' for HTML content
        })

        if (error) {
          console.error(`Failed to send email to ${user.Email}, with code ${code}:`, error)
          failureCount++
        } else {
          // console.log(`Successfully sent email to ${user.Email} (ID: ${data?.id})`); // Verbose success
          successCount++
        }
      } catch (err) {
        console.error(`Unexpected error sending email to ${user.Email}, with code ${code}:`, err)
        failureCount++
      }
      // Optional: Add a small delay between emails if needed to avoid rate limits
      // await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n--- Email Sending Summary ---')
    console.log(`Successfully sent: ${successCount}`)
    console.log(`Failed to send:    ${failureCount}`)
    console.log('-----------------------------')
  } catch (error: any) {
    console.error('\nScript failed with an unexpected error:', error)
    process.exit(1)
  }
}

main()
