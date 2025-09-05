import React from 'react'
import { StyleSheet, ScrollView, Text } from 'react-native'
import { useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { Colors } from '@/constants/Colors'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'

export default function TermsScreen() {
  const router = useRouter()
  const headerElement = (
    <TouchableOpacity onPress={() => router.push('/settings')}>
      <Ionicons name='close' size={30} color={Colors.text} />
    </TouchableOpacity>
  )
  return (
    <ScreenLayout
      title='Terms of Service'
      headerRightElement={headerElement}
      headerIcon={<Ionicons name='document' size={24} color={Colors.tint} />}
    >
      <Head>
        <title>Terms of Service | Team556 Wallet</title>
      </Head>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.effectiveDate}>Effective Date: April 27, 2025</Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using the Team556 Wallet ("App"), you agree to these Terms of Service ("Terms") and our Privacy Policy as
          outlined. If you disagree with the Terms, do not use the App.
        </Text>

        <Text style={styles.heading}>2. Relationship to OpenWorth</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC owns and operates the App, and these Terms constitute a binding contract between
          you and OpenWorth Technologies, LLC.
        </Text>

        <Text style={styles.heading}>3. Definitions</Text>
        <Text style={styles.subHeading}>User:</Text>
        <Text style={styles.paragraph}>Individual or entity accessing App.</Text>
        <Text style={styles.subHeading}>Account:</Text>
        <Text style={styles.paragraph}>Unique wallet identity defined by a keypair assigned to User.</Text>
        <Text style={styles.subHeading}>Digital Assets:</Text>
        <Text style={styles.paragraph}>
          Cryptocurrencies (SOL, Team556 tokens) and related digital representations.
        </Text>
        <Text style={styles.subHeading}>Network Fees:</Text>
        <Text style={styles.paragraph}>Fees charged by blockchain validators for transaction processing.</Text>
        <Text style={styles.subHeading}>Services:</Text>
        <Text style={styles.paragraph}>
          Wallet functionalities, Token transactions, Digital Armory, and related features.
        </Text>
        <Text style={styles.subHeading}>User Content:</Text>
        <Text style={styles.paragraph}>Any data, text, or records you input into the App.</Text>

        <Text style={styles.heading}>4. Eligibility and Compliance</Text>
        <Text style={styles.paragraph}>User represents and warrants that:</Text>
        <Text style={styles.listItem}>• You are at least 18 years old.</Text>
        <Text style={styles.listItem}>• You have the capacity to enter into binding contracts.</Text>
        <Text style={styles.listItem}>
          • You will comply with all local, state, federal, and international laws regarding digital assets, firearms,
          and payments.
        </Text>
        <Text style={styles.listItem}>
          • You are not subject to sanctions or located in a jurisdiction subject to U.S. embargoes or trade
          restrictions.
        </Text>

        <Text style={styles.heading}>5. Account Creation, Security & Ownership</Text>
        <Text style={styles.subHeading}>Private Keys & Seed Phrases:</Text>
        <Text style={styles.paragraph}>
          User generates and stores these securely. OpenWorth Technologies, LLC has no access.
        </Text>
        <Text style={styles.subHeading}>Account Responsibility:</Text>
        <Text style={styles.paragraph}>User is responsible for all actions and transactions under their account.</Text>
        <Text style={styles.subHeading}>Security Best Practices:</Text>
        <Text style={styles.paragraph}>
          Users shall use secure devices and strong passwords. Users acknowledge that enabling MFA and biometric locks,
          if available, is recommended.
        </Text>
        <Text style={styles.subHeading}>Lost Credentials:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC is not responsible for lost private keys or seed phrases and cannot recover them.
        </Text>

        <Text style={styles.heading}>6. License Grant and Restrictions</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC grants User a limited, non-exclusive, revocable license to use the App for
          personal, non-commercial purposes, subject to these Terms. User agrees not to:
        </Text>
        <Text style={styles.listItem}>• Reverse-engineer, decompile, or disassemble the App.</Text>
        <Text style={styles.listItem}>• Modify or create derivative works of the App.</Text>
        <Text style={styles.listItem}>
          • Use the App for illicit activities (e.g., money laundering, terrorism financing, illegal arms trafficking).
        </Text>
        <Text style={styles.listItem}>• Distribute malicious code or malware.</Text>

        <Text style={styles.heading}>7. Transactions and Fees</Text>
        <Text style={styles.paragraph}>User acknowledges:</Text>
        <Text style={styles.listItem}>• Finality: Transactions on the blockchain are final and irreversible.</Text>
        <Text style={styles.listItem}>
          • Network Fees: User pays all associated network fees and third-party costs.
        </Text>
        <Text style={styles.listItem}>• Transaction Delays: Dependent on network congestion and fee selection.</Text>
        <Text style={styles.listItem}>• Refunds: No refunds on network fees or completed transactions.</Text>

        <Text style={styles.heading}>8. User Content and Data</Text>
        <Text style={styles.subHeading}>Ownership:</Text>
        <Text style={styles.paragraph}>User retains ownership of their User Content.</Text>
        <Text style={styles.subHeading}>License to OpenWorth Technologies, LLC:</Text>
        <Text style={styles.paragraph}>
          User grants OpenWorth Technologies, LLC a worldwide, royalty-free license to use User Content to provide and
          improve the services.
        </Text>
        <Text style={styles.subHeading}>Content Removal:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC reserves the right to remove or disable access to User Content that violates these
          Terms or applicable laws.
        </Text>
        <Text style={styles.subHeading}>User Feedback:</Text>
        <Text style={styles.paragraph}>
          By submitting suggestions or feedback, you grant OpenWorth Technologies, LLC a non-exclusive, perpetual,
          irrevocable, royalty-free license to use, modify, and incorporate such feedback without compensation or
          obligation to you.
        </Text>

        <Text style={styles.heading}>9. Prohibited Conduct</Text>
        <Text style={styles.paragraph}>User agrees not to:</Text>
        <Text style={styles.listItem}>• Engage in any form of illegal activity using the App.</Text>
        <Text style={styles.listItem}>• Facilitate fraud or deceive other users.</Text>
        <Text style={styles.listItem}>• Transmit harmful code or viruses.</Text>
        <Text style={styles.listItem}>• Circumvent or disable any security features.</Text>

        <Text style={styles.heading}>10. Third-Party Services and Links</Text>
        <Text style={styles.paragraph}>
          The App may integrate or link to third-party services (e.g., Solana Pay, analytics). Users agree that use of
          these services is subject to their terms and privacy policies. OpenWorth Technologies, LLC is not responsible
          for the content, functionality, accuracy, legality, or security of third-party services.
        </Text>

        <Text style={styles.heading}>11. Customer Support & Service Levels</Text>
        <Text style={styles.subHeading}>Support Channels:</Text>
        <Text style={styles.paragraph}>Email support@team556.com.</Text>
        <Text style={styles.subHeading}>Response Times:</Text>
        <Text style={styles.paragraph}>We strive to respond within 48 hours.</Text>
        <Text style={styles.subHeading}>Maintenance Windows:</Text>
        <Text style={styles.paragraph}>
          Scheduled maintenance may cause downtime. Notifications will be provided in-app.
        </Text>

        <Text style={styles.heading}>12. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All rights in the App, including trademarks, copyrights, and patents, belong to OpenWorth Technologies, LLC
          and its licensors. Unauthorized use is prohibited.
        </Text>

        <Text style={styles.heading}>13. Representations and Warranties</Text>
        <Text style={styles.paragraph}>User represents and warrants that:</Text>
        <Text style={styles.listItem}>• You have the requisite authority to enter into these Terms.</Text>
        <Text style={styles.listItem}>• You will comply with these Terms and all applicable laws.</Text>
        <Text style={styles.listItem}>• Your use of the App will not infringe on the rights of others.</Text>

        <Text style={styles.heading}>14. Disclaimers</Text>
        <Text style={styles.subHeading}>AS IS:</Text>
        <Text style={styles.paragraph}>The App is provided without warranties of any kind.</Text>
        <Text style={styles.subHeading}>NO LIABILITY:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC disclaims liability for market losses, delays, or service disruptions.
        </Text>
        <Text style={styles.subHeading}>BLOCKCHAIN RISKS:</Text>
        <Text style={styles.paragraph}>
          You acknowledge that blockchain technologies involve inherent risks, including network congestion, bugs,
          protocol changes, regulatory uncertainty, and volatility. You assume full responsibility for all such risks.
        </Text>
        <Text style={styles.subHeading}>NO PROFESSIONAL ADVICE:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC does not provide legal, tax, financial, or investment advice. Use of the App does
          not create any fiduciary relationship.
        </Text>

        <Text style={styles.heading}>15. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the fullest extent permitted by law, OpenWorth Technologies, LLC and its affiliates shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages. In all cases, liability is capped at
          $500 USD.
        </Text>

        <Text style={styles.heading}>16. Indemnification</Text>
        <Text style={styles.paragraph}>
          User agrees to indemnify and hold harmless OpenWorth Technologies, LLC, its officers, directors, employees,
          and agents from any claims, losses, or expenses arising from your use of the App or breach of these Terms.
        </Text>

        <Text style={styles.heading}>17. Governing Law & Dispute Resolution</Text>
        <Text style={styles.subHeading}>Governing Law:</Text>
        <Text style={styles.paragraph}>Washington State law, without regard to conflicts.</Text>
        <Text style={styles.subHeading}>Arbitration:</Text>
        <Text style={styles.paragraph}>
          Disputes will be resolved by binding arbitration under the AAA rules in Washington State. Arbitration must be
          initiated in accordance with the AAA procedures available at www.adr.org.
        </Text>
        <Text style={styles.subHeading}>Class Action Waiver:</Text>
        <Text style={styles.paragraph}>User waives rights to participate in class actions.</Text>
        <Text style={styles.subHeading}>Small Claims:</Text>
        <Text style={styles.paragraph}>
          Users may pursue individual claims in small claims court in an appropriate jurisdiction.
        </Text>

        <Text style={styles.heading}>18. Termination</Text>
        <Text style={styles.paragraph}>
          Violation of these Terms will result in user termination. OpenWorth Technologies, LLC reserves the right to
          suspend or terminate User access at any time. Surviving sections include Section 7 (Transaction Fees), Section
          8 (User Content and Data), Section 9 (Prohibited Conduct), Section 10 (Third-Party Services and Links),
          Section 14 (Disclaimers), Section 15 (Limitation of Liability), Section 16 (Indemnification), Section 17
          (Governing Law & Dispute Resolution), Section 18 (Termination), and Section 25 (Security and Risk).
        </Text>

        <Text style={styles.heading}>19. Force Majeure</Text>
        <Text style={styles.paragraph}>
          Neither party is liable for delays due to events beyond reasonable control, including acts of God, war,
          strikes, or network outages.
        </Text>

        <Text style={styles.heading}>20. Modifications to Terms</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC reserves the right to modify these Terms at any time. Updates will be posted in
          the App. We will notify you of material changes. Continued use indicates acceptance of all Terms.
        </Text>

        <Text style={styles.heading}>21. Notices</Text>
        <Text style={styles.paragraph}>All legal notices shall be sent via email to support@team556.com.</Text>

        <Text style={styles.heading}>22. Miscellaneous</Text>
        <Text style={styles.subHeading}>Assignment:</Text>
        <Text style={styles.paragraph}>
          User may not assign these Terms. OpenWorth Technologies, LLC may assign in connection with corporate changes.
        </Text>
        <Text style={styles.subHeading}>Severability:</Text>
        <Text style={styles.paragraph}>Invalid provisions do not affect remaining Terms.</Text>
        <Text style={styles.subHeading}>Entire Agreement:</Text>
        <Text style={styles.paragraph}>
          These Terms and the Privacy Policy constitute the entire agreement between User and OpenWorth Technologies,
          LLC.
        </Text>

        <Text style={styles.heading}>23. Contact Us</Text>
        <Text style={styles.paragraph}>For questions regarding these Terms, contact support@team556.com.</Text>

        <Text style={styles.heading}>24. Securities Law and Token Status</Text>
        <Text style={styles.subHeading}>Token Utility and Classification:</Text>
        <Text style={styles.paragraph}>
          Team556 tokens are designed and intended to function solely as utility tokens within the Team556 ecosystem,
          providing access to wallet features, transaction services, and the encrypted Digital Armory. They have not
          been structured or sold as securities, and OpenWorth Technologies, LLC has not registered them under the
          Securities Act of 1933 or any state securities laws. Team556 tokens do not confer any ownership interest,
          dividend rights, or profit-sharing rights in OpenWorth Technologies, LLC or its affiliates.
        </Text>
        <Text style={styles.subHeading}>Investment Advice Disclaimer:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC and the App do not provide legal, financial, investment, or tax advice. Nothing in
          these Terms or the App should be construed as investment advice, a recommendation to invest, or an offer to
          sell securities. User is solely responsible for their financial decisions and should consult a qualified
          professional for advice tailored to their individual circumstances.
        </Text>
        <Text style={styles.subHeading}>Presale Offering Structure (Team556 Token):</Text>
        <Text style={styles.paragraph}>
          The initial presale of Team556 tokens was conducted as a public token sale, open to U.S. and international
          participants. It was announced to our core community, and buyers were fully informed of the vesting schedules
          and transfer restrictions prior to purchasing.
        </Text>
        <Text style={styles.subHeading}>Presale Allocation:</Text>
        <Text style={styles.paragraph}>
          22.5% of the total token supply was reserved for presale participants, subject to vesting terms outlined in
          the Team556 Whitepaper.
        </Text>
        <Text style={styles.subHeading}>Development Wallet:</Text>
        <Text style={styles.paragraph}>
          5% of the supply is allocated for development and infrastructure needs, also subject to vesting.
        </Text>
        <Text style={styles.subHeading}>Marketing Wallet:</Text>
        <Text style={styles.paragraph}>
          2.5% of the supply is allocated for promotional efforts and growth, with vesting terms in place.
        </Text>
        <Text style={styles.subHeading}>Public Circulation:</Text>
        <Text style={styles.paragraph}>
          70% of the supply was made available at launch for open market trading. All presale participants were required
          to acknowledge and agree to the vesting schedule and token transfer limitations before participating. These
          measures were implemented to ensure stability, discourage immediate dumping, and align the token release with
          long-term project goals.
        </Text>
        <Text style={styles.subHeading}>Money Services Business (MSB) Notice:</Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies LLC is not registered as a Money Services Business (MSB) with FinCEN and does not
          provide custodial or exchange services. The App is strictly a non-custodial wallet interface. Users bear full
          responsibility for compliance with any applicable money-transmitter or MSB regulations in their jurisdiction.
        </Text>
        <Text style={styles.subHeading}>Survival:</Text>
        <Text style={styles.paragraph}>
          Sections 24 (Securities Law and Token Status), Section 15 (Limitation of Liability), Section 17 (Governing Law
          & Dispute Resolution), and Section 25 (Security and Risk) will survive termination or expiration of these
          Terms.
        </Text>

        <Text style={styles.heading}>25. User Security and Assumption of Risk</Text>
        <Text style={styles.paragraph}>
          You acknowledge and agree that the security of your wallet depends on your control of your private keys, seed
          phrases, and devices. OpenWorth Technologies, LLC is not a custodian of your digital assets and has no ability
          to access, retrieve, or restore your wallet credentials. You bear full responsibility for implementing
          appropriate security measures (such as strong passwords, device encryption, and secure backup practices).
        </Text>
        <Text style={styles.paragraph}>
          OpenWorth Technologies, LLC shall not be liable for any losses or damages arising from:
        </Text>
        <Text style={styles.listItem}>• Unauthorized access to your wallet or device,</Text>
        <Text style={styles.listItem}>• Phishing attacks, malware, or other security breaches,</Text>
        <Text style={styles.listItem}>• User error or negligence,</Text>
        <Text style={styles.listItem}>• Failure to follow recommended security practices.</Text>
        <Text style={styles.paragraph}>
          You use the App and interact with blockchain networks at your own risk. Blockchain transactions are
          irreversible and final.
        </Text>

        <Text style={styles.paragraphLast}>
          Thank you for choosing Team556 Wallet, powered by OpenWorth Technologies, LLC.
        </Text>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1
  },
  contentContainer: {
    paddingVertical: 16
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  effectiveDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center'
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 8
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 6,
    marginLeft: 10
  },
  paragraphLast: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginTop: 24,
    textAlign: 'center'
  }
})
