import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import * as path from 'path'

// --- Configuration ---
const EMAIL_SUBJECT = 'Your Exclusive Presale Code!' // Subject indicating a retry
const EMAIL_FROM = 'Support <support@support.openworth.io>' // Use the same verified sender from your previous script
const DELAY_MS = 3000 // 3 second delay between sends
// --- End Configuration ---

// --- Failed Emails/Codes (Extracted from Log) ---
const failedSends = [
  { email: 'nhamenhung@gmail.com', code: 'P1-675F8595' },
  { email: 'kory@snugsservices.com', code: 'P1-3997CCFD' },
  { email: 'pagewells@att.net', code: 'P1-AA4CD314' },
  { email: 'nelsoncasey594@hotmail.com', code: 'P1-0984C6AC' },
  { email: 'kyle@snugsservices.com', code: 'P1-CC1019E6' },
  { email: 'emoholicg@gmail.com', code: 'P1-BE4C412C' },
  { email: 'drew.gregory@gruntstyle.com', code: 'P1-D9D7431C' },
  { email: 'jeremydunham21@gmail.com', code: 'P1-252D310F' },
  { email: 'jeremy@finelineconstruct.com', code: 'P1-006A51B0' },
  { email: 'anthonyrusso161@gmail.com', code: 'P1-A7E1EEB6' },
  { email: 'ande414@yahoo.com', code: 'P1-14FF91CD' },
  { email: 'bailycaamal@gmail.com', code: 'P1-38B453EE' },
  { email: 'badsinbred@gmail.com', code: 'P1-1E901BA3' },
  { email: 'timmytibbets23@gmail.com', code: 'P1-A5E16328' },
  { email: 'Crs123crsaylor@gmail.com', code: 'P1-882C89A1' },
  { email: 'dirthead79@gmail.com', code: 'P1-BB2B6E0B' },
  { email: 'alecjohnjoubert@yahoo.com', code: 'P1-A9D59210' },
  { email: 'eric.breza@gmail.com', code: 'P1-4B1ACAEC' },
  { email: 'davisajm@gmail.com', code: 'P1-444643B2' },
  { email: 'timbomb8@hotmail.com', code: 'P1-641EB1F1' },
  { email: 'Larrystone@hotmail.com', code: 'P1-A01DE1D1' },
  { email: 'lencollin15@gmail.com', code: 'P1-A4DAD379' },
  { email: 'ajriley35@gmail.com', code: 'P1-FDEED17C' },
  { email: 'Dillon-93-dillon@hotmail.com', code: 'P1-93B48D52' },
  { email: 'salmon_snatcher3@live.com', code: 'P1-CC4599ED' },
  { email: 'smartfixwa@gmail.com', code: 'P1-6F97C29B' },
  { email: 'igottaplay79@gmail.com', code: 'P1-8277DFBB' },
  { email: 'michaelmfitzgerald@yahoo.com', code: 'P1-14FC0AE9' },
  { email: 'byronmcnabbj@gmail.com', code: 'P1-A7C0E7DD' },
  { email: 'jupitercarguy@gmail.com', code: 'P1-F5474FC9' },
  { email: 'keatonyourdon@gmail.com', code: 'P1-04486E5D' },
  { email: 'dipietroa@outlook.com', code: 'P1-7159E862' },
  { email: 'drew12_09@yahoo.com', code: 'P1-33033BC6' },
  { email: 'peytonhulstrom@comcast.net', code: 'P1-E29D2C39' },
  { email: 'joerobf@gmail.com', code: 'P1-6F3BC434' },
  { email: 'jmaplethorpe87@yahoo.com', code: 'P1-959AE5EE' },
  { email: 'jworkman53@hotmail.com', code: 'P1-EB766638' },
  { email: 'matt.oswald@hotmail.com', code: 'P1-0008C61A' },
  { email: 'nick.rountree92@gmail.com', code: 'P1-99CA715D' },
  { email: 'thesgcoffeedude@gmail.com', code: 'P1-0B44D50B' },
  { email: 'lorenzocapitano@yahoo.com', code: 'P1-1D7432F5' },
  { email: '208worx@gmail.com', code: 'P1-9C841B09' },
  { email: 'logansiegler11@gmail.com', code: 'P1-56E2C972' },
  { email: 'bcastrojr3@gmail.com', code: 'P1-01786F54' },
  { email: 'etherington211@gmail.com', code: 'P1-16F99766' },
  { email: 'edwardo98682@gmail.com', code: 'P1-2D7B873F' },
  { email: 'chadb@caliberservicellc.com', code: 'P1-ADCDF33E' },
  { email: 'bobiceleski32@gmail.con', code: 'P1-24498177' }, // Note: .con domain might be invalid
  { email: 'Jbourgeois073110@yahoo.com', code: 'P1-E18A97DB' },
  { email: 'omerm14@icloud.com', code: 'P1-C6D3974F' },
  { email: 'dustindillen@gmail.com', code: 'P1-12F8378A' },
  { email: 'cartwrightjake17@gmail.com', code: 'P1-0CFC4686' },
  { email: 'duramaxspecialties@gmail.com', code: 'P1-9CF5DC12' },
  { email: 'adragoo21@gmail.com', code: 'P1-887773CD' },
  { email: 'Walkers.updates@gmail.com', code: 'P1-9ED467A7' },
  { email: 'aaronbabcock94@gmail.com', code: 'P1-C6DBC23B' },
  { email: 'carlirocco@gmail.com', code: 'P1-B0F652C1' },
  { email: 'Stevenjgysin@gmail.com', code: 'P1-27320424' },
  { email: 'gagebramsen@yahoo.com', code: 'P1-EA6F68AE' },
  { email: 'Nick.ryan.barry@gmail.com', code: 'P1-F789AD60' },
  { email: 'jgarcia062396@aol.com', code: 'P1-FC7A1AAE' },
  { email: 'pelayo.lupe@gmail.com', code: 'P1-B666546D' },
  { email: 'scrillavilla69@yourmom.com', code: 'P1-74AC72B5' }, // Note: yourmom.com domain is likely invalid
  { email: 'grinderdallon@gmail.com', code: 'P1-6AE5C05D' },
  { email: 'brysonclayton11@gmail.com', code: 'P1-2E537253' },
  { email: 'lil.pavlenko@gmail.com', code: 'P1-3A847003' },
  { email: 'jakecumberledge1@aol.com', code: 'P1-50E7F0D9' },
  { email: 'mrpierce007@yahoo.com', code: 'P1-9A21A175' },
  { email: 'levileach27@gmail.com', code: 'P1-3FB2FE38' },
  { email: 'joshwinskowski@gmail.com', code: 'P1-8FDA7661' },
  { email: 'wubah123@gmail.com', code: 'P1-6283F884' },
  { email: 'natesr24@gmail.com', code: 'P1-6B961E68' },
  { email: 'dianecampbell1919@gmail.com', code: 'P1-A6E09D50' },
  { email: 'jonathandill98@icloud.com', code: 'P1-CD02C550' },
  { email: 'asandona94@gmail.com', code: 'P1-D4666012' },
  { email: 'pgrubner11@gmail.com', code: 'P1-4C7764DD' },
  { email: 'cmautoandtireredmond@gmail.com', code: 'P1-1F89B2ED' },
  { email: 'lemmonkyle@yahoo.com', code: 'P1-6106EAF2' },
  { email: 'mariandron@hotmail.com', code: 'P1-CA17284C' },
  { email: 'hookedoninvestments@gmail.com', code: 'P1-8503D10B' },
  { email: 'mhossain1227@gmail.com', code: 'P1-3A019AE6' },
  { email: 'larrydalestone@gmail.com', code: 'P1-FDC34B84' },
  { email: 'klskustoms@gmail.com', code: 'P1-B0941A3E' },
  { email: 'u8it2.mmm@gmail.com', code: 'P1-F3BE6704' },
  { email: 'artsay29@gmail.com', code: 'P1-F4CA5306' },
  { email: 'donhyde88@gmail.com', code: 'P1-3294883C' }
]
// --- End Failed Emails/Codes ---

// Load environment variables
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

// Function to generate email body
function generateEmailBody(code: string): string {
  // We don't have the Name from the log, so use a generic greeting.
  return `
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
`
}

async function main() {
  console.log(`Attempting to resend ${failedSends.length} failed presale code emails...`)
  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < failedSends.length; i++) {
    const { email, code } = failedSends[i]
    console.log(`[${i + 1}/${failedSends.length}] Attempting to send code ${code} to ${email}...`)

    const emailBody = generateEmailBody(code)

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: EMAIL_SUBJECT,
        text: emailBody
      })

      if (error) {
        // Check if it's *still* a rate limit error or something else
        if (error.name === 'rate_limit_exceeded') {
          console.error(
            `   RATE LIMIT HIT AGAIN for ${email}. Stopping script. You might need a longer delay or contact Resend support.`
          )
          failureCount++
          // Exit immediately if rate limit is hit again during retry
          process.exit(1)
        } else {
          console.error(`   Failed to resend email to ${email}:`, error)
          failureCount++
        }
      } else {
        console.log(`   Successfully resent email to ${email} (ID: ${data?.id})`)
        successCount++
      }
    } catch (err) {
      console.error(`   Unexpected error resending email to ${email}:`, err)
      failureCount++
    }

    // Add delay *after* each attempt (except the last one)
    if (i < failedSends.length - 1) {
      console.log(`   Waiting ${DELAY_MS / 1000} seconds...`)
      await delay(DELAY_MS)
    }
  }

  console.log('\n--- Resend Summary ---')
  console.log(`Successfully resent: ${successCount}`)
  console.log(`Failed to resend:  ${failureCount}`)
  console.log('----------------------')
}

main()
