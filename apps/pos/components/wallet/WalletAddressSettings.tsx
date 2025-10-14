import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { WalletAddressForm } from './WalletAddressForm'
import { usePOSWalletStore } from '@/store/posWalletStore'

export const WalletAddressSettings: React.FC = () => {
  const { health, getWalletHealth, canAcceptTeam556 } = usePOSWalletStore()

  useEffect(() => {
    if (!health) getWalletHealth()
  }, [health])

  const ready = canAcceptTeam556()

  return (
    <View style={styles.container}>
      <View style={[styles.banner, ready ? styles.bannerSuccess : styles.bannerWarning]}>
        <Text style={styles.bannerTitle}>
          {ready ? 'Ready to accept TEAM556 payments' : 'TEAM556 payments not fully configured'}
        </Text>
        <Text style={styles.bannerText}>
          These addresses are only destinations for deposits after successful TEAM556 payments. The POS does not create wallets or check balances.
        </Text>
        {!ready && (
          <Text style={styles.bannerText}>Enter and save a valid primary address below to enable Team556 tender.</Text>
        )}
      </View>

      <WalletAddressForm />

      <View style={styles.docsBox}>
        <Text style={styles.docsTitle}>Learn more</Text>
        <Text style={styles.docsText}>See the merchant docs and the WordPress plugin flow for how Team556 Pay works with QR and reference verification.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  banner: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerSuccess: {
    backgroundColor: Colors.primarySubtle,
  },
  bannerWarning: {
    backgroundColor: Colors.secondarySubtle,
  },
  bannerTitle: {
    color: Colors.text,
    marginBottom: 6,
  },
  bannerText: {
    color: Colors.textSecondary,
  },
  docsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundDark,
  },
  docsTitle: {
    color: Colors.text,
    marginBottom: 6,
  },
  docsText: {
    color: Colors.textSecondary,
  },
})
