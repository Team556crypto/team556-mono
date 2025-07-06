import React from 'react'
import { StyleSheet, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { Colors } from '@/constants/Colors'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'

export default function PrivacyScreen() {
  const router = useRouter()
  const headerElement = (
    <TouchableOpacity onPress={() => router.push('/settings')}>
      <Ionicons name='close' size={30} color={Colors.text} />
    </TouchableOpacity>
  )
  return (
    <ScreenLayout
      title='Privacy Policy'
      headerRightElement={headerElement}
      headerIcon={<Ionicons name='shield-checkmark-outline' size={24} color={Colors.tint} />}
    >
      <Head>
        <title>Privacy Policy | Team556 Wallet</title>
      </Head>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.effectiveDate}>Effective Date: April 27, 2025</Text>

        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to Team556 Wallet ("Team556," "we," "us," or "our"), a product of OpenWorth Technologies, LLC ("OpenWorth"). We are committed to protecting your privacy and providing a transparent service regarding personal information collection, use, and disclosure. This Privacy Policy applies to all users of our mobile and web applications (collectively, the "App").
        </Text>

        <Text style={styles.heading}>2. Scope</Text>
        <Text style={styles.paragraph}>
          This Policy governs data related to wallet operations, transactions, the encrypted Digital Armory feature, and any other services provided by the App, regardless of device or platform.
        </Text>

        <Text style={styles.heading}>3. Definitions</Text>
        <Text style={styles.subHeading}>Personal Information:</Text>
        <Text style={styles.paragraph}>Information that identifies or could reasonably identify an individual.</Text>
        <Text style={styles.subHeading}>Non-Personal Data:</Text>
        <Text style={styles.paragraph}>Anonymized or aggregated information that cannot identify any individual.</Text>
        <Text style={styles.subHeading}>Digital Armory:</Text>
        <Text style={styles.paragraph}>Encrypted local storage feature for firearms, ammunition, NFA items, and related records.</Text>
        <Text style={styles.subHeading}>Processing:</Text>
        <Text style={styles.paragraph}>Any operation performed on data, including collection, storage, analysis, transfer, or deletion.</Text>
        <Text style={styles.subHeading}>Controller:</Text>
        <Text style={styles.paragraph}>Entity responsible for determining processing purposes and means (OpenWorth Technologies, LLC).</Text>
        <Text style={styles.subHeading}>Processor:</Text>
        <Text style={styles.paragraph}>Third parties acting on behalf of the Controller.</Text>
        <Text style={styles.subHeading}>Data Subject:</Text>
        <Text style={styles.paragraph}>Individual to whom Personal Information relates.</Text>

        <Text style={styles.heading}>4. Information We Collect</Text>
        <Text style={styles.subHeading}>4.1 Information You Provide</Text>
        <Text style={styles.listItem}>• Account Data: Public wallet addresses, transaction hashes, and token balances.</Text>
        <Text style={styles.listItem}>• Support Data: Support tickets, diagnostic logs, screenshots, and correspondence.</Text>
        <Text style={styles.listItem}>• Communications: Feedback, surveys, and other correspondence.</Text>
        <Text style={styles.subHeading}>4.2 Automatically Collected Data</Text>
        <Text style={styles.listItem}>• Device Data: Device model, OS version, unique device identifiers, network information.</Text>
        <Text style={styles.listItem}>• Usage Data: App interactions, feature usage metrics, errors, and crash reports.</Text>
        <Text style={styles.listItem}>• Log Data: IP address, timestamp, access logs.</Text>
        <Text style={styles.subHeading}>4.3 Third-Party Sources</Text>
        <Text style={styles.listItem}>• Integrated Services: Data from Solana Pay or similar payment APIs, per their privacy terms.</Text>
        <Text style={styles.listItem}>• Analytics: Aggregated metrics from analytics providers under strict confidentiality agreements.</Text>
        <Text style={styles.subHeading}>4.4 Cookies and Tracking (Web)</Text>
        <Text style={styles.listItem}>• Web Components: If introduced, cookies, local storage, or similar may be used with explicit user consent and opt-out controls.</Text>

        <Text style={styles.heading}>5. How We Use Your Information</Text>
        <Text style={styles.listItem}>• Service Provision: To facilitate wallet operations, token transactions, and Digital Armory features.</Text>
        <Text style={styles.listItem}>• Security & Fraud Prevention: To detect suspicious activity, prevent attacks, and secure user accounts.</Text>
        <Text style={styles.listItem}>• Customer Support: To troubleshoot issues, respond to requests, and provide assistance.</Text>
        <Text style={styles.listItem}>• Product Development: To analyze usage trends and improve functionality.</Text>
        <Text style={styles.listItem}>• Legal Compliance: To comply with laws, regulations, and valid legal processes.</Text>
        <Text style={styles.listItem}>• Marketing: With your explicit consent, OpenWorth will send promotional materials and updates.</Text>

        <Text style={styles.heading}>6. Legal Bases for Processing (EEA)</Text>
        <Text style={styles.listItem}>• Performance of Contract: Necessary for providing App functionalities.</Text>
        <Text style={styles.listItem}>• Legal Obligation: Compliance with BSA, AML/CTF, OFAC.</Text>
        <Text style={styles.listItem}>• Legitimate Interests: Security, fraud prevention, service improvement.</Text>
        <Text style={styles.listItem}>• Consent: Optional features (e.g., marketing).</Text>

        <Text style={styles.heading}>7. Data Minimization & Retention</Text>
        <Text style={styles.subHeading}>Minimization:</Text>
        <Text style={styles.paragraph}>OpenWorth will only collect data necessary for the purposes stated.</Text>
        <Text style={styles.subHeading}>Retention Period:</Text>
        <Text style={styles.paragraph}>Generally up to 5 years after last user activity, unless extended by law.</Text>
        <Text style={styles.subHeading}>Deletion:</Text>
        <Text style={styles.paragraph}>Data deleted upon request, subject to legal obligations.</Text>

        <Text style={styles.heading}>8. Data Security Measures</Text>
        <Text style={styles.subHeading}>Encryption:</Text>
        <Text style={styles.paragraph}>AES-256 for private keys, seed phrases, and Digital Armory entries.</Text>
        <Text style={styles.subHeading}>Transit Protection:</Text>
        <Text style={styles.paragraph}>TLS 1.2+ for all communications.</Text>
        <Text style={styles.subHeading}>Access Controls:</Text>
        <Text style={styles.paragraph}>Role-based controls, MFA, and optional biometric authentication.</Text>
        <Text style={styles.subHeading}>Operational Security:</Text>
        <Text style={styles.paragraph}>Quarterly security audits, annual penetration tests, and code reviews per NIST SP 800-53 and ISO/IEC 27001.</Text>

        <Text style={styles.heading}>9. Information Sharing and Disclosure</Text>
        <Text style={styles.listItem}>• Service Providers: Under the Non-Disclosure Agreement, only to perform necessary services.</Text>
        <Text style={styles.listItem}>• Legal Requirements: Disclosure under valid subpoenas, court orders, or government requests.</Text>
        <Text style={styles.listItem}>• Corporate Transactions: In mergers, acquisitions, or asset sales, with confidentiality commitments.</Text>
        <Text style={styles.listItem}>• Aggregate Data: Anonymous statistics for research and reporting.</Text>

        <Text style={styles.heading}>10. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your data may be transferred to, processed, and stored in the United States or other jurisdictions. By using the App, you consent to these transfers under applicable data protection laws.
        </Text>

        <Text style={styles.heading}>11. Data Subject Rights</Text>
        <Text style={styles.paragraph}>You may, subject to local law:</Text>
        <Text style={styles.listItem}>• Access your Personal Information.</Text>
        <Text style={styles.listItem}>• Correct inaccuracies.</Text>
        <Text style={styles.listItem}>• Request deletion or restriction.</Text>
        <Text style={styles.listItem}>• Obtain portability of your data.</Text>
        <Text style={styles.listItem}>• Object to processing.</Text>
        <Text style={styles.listItem}>• Withdraw consent for consent-based processing. Requests: support@team556.com.</Text>

        <Text style={styles.heading}>12. Data Breach Response</Text>
        <Text style={styles.subHeading}>Notification:</Text>
        <Text style={styles.paragraph}>Where required by law, OpenWorth will notify affected users and regulators within 72 hours of a data breach.</Text>
        <Text style={styles.subHeading}>Investigation:</Text>
        <Text style={styles.paragraph}>OpenWorth will investigate and remediate vulnerabilities to prevent recurrence.</Text>

        <Text style={styles.heading}>13. Automated Decision-Making</Text>
        <Text style={styles.paragraph}>
          OpenWorth does not use solely automated decision-making processes that produce legal or similarly significant effects on users.
        </Text>

        <Text style={styles.heading}>14. Children’s Privacy</Text>
        <Text style={styles.paragraph}>
          The App is intended for users 18 years or older. OpenWorth does not knowingly collect data from children under the age of 18.
        </Text>

        <Text style={styles.heading}>15. California Privacy Rights (CCPA/CPRA)</Text>
        <Text style={styles.paragraph}>California residents may:</Text>
        <Text style={styles.listItem}>• Opt-out of data sale (no sales currently occur).</Text>
        <Text style={styles.listItem}>• Request categories of data collected and purposes.</Text>
        <Text style={styles.listItem}>• Request deletion of Personal Information. Contact: support@team556.com</Text>

        <Text style={styles.heading}>16. European Privacy Rights (GDPR)</Text>
        <Text style={styles.paragraph}>EEA users have rights to data access, correction, portability, erasure, restriction, and objection. Complaints: support@team556.com</Text>

        <Text style={styles.heading}>17. Additional Jurisdictional Notices</Text>
        <Text style={styles.listItem}>• UK GDPR: Rights enforced by ICO.</Text>
        <Text style={styles.listItem}>• LGPD (Brazil): Confirmation, access, correction, deletion. Contact: support@team556.com</Text>
        <Text style={styles.listItem}>• Australian Privacy Act: Requests: support@team556.com</Text>

        <Text style={styles.heading}>18. Other Third-Party Disclosures</Text>
        <Text style={styles.listItem}>• Advertising Partners: None without consent.</Text>
        <Text style={styles.listItem}>• Business Partners: Disclosed in-app where applicable.</Text>

        <Text style={styles.heading}>19. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          OpenWorth reserves the right to update this Policy at any time. Update notices will be provided via in-app notice, along with an updated effective date. Continued use indicates acceptance of these terms.
        </Text>

        <Text style={styles.heading}>20. Contact Information</Text>
        <Text style={styles.paragraphLast}>Privacy inquiries: support@team556.com</Text>

      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  effectiveDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 6,
    marginLeft: 10, // Indent list items
  },
  paragraphLast: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginTop: 16, // Adjusted from 24 for a slightly less gap
    marginBottom: 16, // Add some bottom padding
    textAlign: 'center',
  },
})
