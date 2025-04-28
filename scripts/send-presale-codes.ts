import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'
import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import validator from 'validator'

// --- Configuration ---
const USER_CSV_PATH = path.resolve(__dirname, '../presale-type-2-users.csv')
const CODE_CSV_PATH = path.resolve(__dirname, '../presale_codes.csv')
const CODE_PREFIX = 'P2-'
const EMAIL_SUBJECT = 'Your Exclusive Presale Code!'
// Define the email sender address authorised with Resend
const EMAIL_FROM = 'Support <support@support.openworth.io>' // <-- IMPORTANT: Update this!
// Delay between sends to avoid rate limits (in milliseconds)
const DELAY_MS = 3000 // 3 seconds
// --- End Configuration ---

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const resendApiKey = process.env.GLOBAL__RESEND_API_KEY

if (!resendApiKey) {
  console.error('Error: GLOBAL__RESEND_API_KEY environment variable not set.')
  process.exit(1)
}

const resend = new Resend(resendApiKey)

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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
      // Add delay *before* sending the email
      console.log(`Waiting ${DELAY_MS / 1000} seconds before sending to ${user.Email}...`)
      await delay(DELAY_MS)

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
Subject: Important: Set Up Your Team556 Wallet and Redeem Your Presale Tokens


Thank you for participating in the Team556 presale!
We’re excited to announce that the Team556 Wallet is now live.
 This wallet is required to claim your presale tokens and view your vesting schedule.
Each presale participant has been issued a Redeem Code (included below).
 Follow the instructions carefully to set up your wallet and redeem your tokens:

How to Set Up Your Team556 Wallet:
Go to https://wallet.team556.com.


Enter your email address and password, then click Sign Up.


Check your email for the verification code we send you.


Enter the verification code and click Create Wallet.


Your Recovery Phrase will appear.


Click the eye icon to reveal it.


IMPORTANT: Save your recovery phrase somewhere safe (write it down, take a picture, etc.).
 If you lose it, you will lose access to your wallet and your tokens.


Check the box confirming you saved your recovery phrase, then click Finish.


Your Team556 Wallet is now ready!

How to Redeem Your Presale Tokens:
Open your Team556 Wallet and go to the Settings tab.


Scroll to the bottom and click Redeem Presale.


Enter your full Redeem Code (listed below).


Click Check Code, then Redeem.


After redeeming, you will see a new section called Presale Dashboard under Settings.
 This will show:


Your total number of Team556 tokens


Your personal vesting schedule



Important Notes About Redemption and Vesting:
Redeeming your code does not immediately deliver your tokens.


Your tokens will unlock and become available according to the vesting schedule shown in your Presale Dashboard.


No tokens can be claimed until the vesting periods have concluded.



How Solana and Swapping for Team556 Will Work: Right now, the Team556 Wallet is only able to receive Solana (SOL).
As we get closer to the official Team556 launch, the wallet will be updated to allow you to swap Solana directly for Team556 inside the app.
When the time comes:
Purchase Solana however you prefer (Coinbase, Binance, etc.).


Send your Solana to your new Team556 Wallet.


Once the swap feature is active, you’ll be able to swap Solana for Team556 safely and easily right inside the wallet.


This will be the most user-friendly way to purchase Team556 — no external exchanges, no confusing token addresses, and no extra steps.

Your Redeem Code:
${code}

Final Reminders:
You must create a wallet and redeem your code to receive your tokens once vesting is complete.


Save your Recovery Phrase somewhere safe — it cannot be recovered if lost.


Stay tuned for updates as we get closer to launch and additional wallet features go live!


Thank you again for supporting Team556 early on —
 We’re just getting started and we’re excited to build this with you.
— Team556
Invest. Defend.

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
