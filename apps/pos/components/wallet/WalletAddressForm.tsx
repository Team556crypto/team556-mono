import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import { Text, Button } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { usePOSWalletStore } from '@/store/posWalletStore'
import type { POSWalletAddresses } from '@/types/pos-wallet'
import { formatWalletAddress } from '@/utils/formatWalletAddress'

interface WalletAddressFormProps {
  style?: any
}

export const WalletAddressForm: React.FC<WalletAddressFormProps> = ({ style }) => {
  const {
    addresses,
    health,
    isLoading,
    isValidating,
    error,
    fetchWalletAddresses,
    getWalletHealth,
    updatePrimaryAddress,
    updateSecondaryAddress,
    clearSecondaryAddress,
    validateAddress,
  } = usePOSWalletStore()

  const [primaryInput, setPrimaryInput] = useState('')
  const [secondaryInput, setSecondaryInput] = useState('')
  const [saving, setSaving] = useState<'primary' | 'secondary' | null>(null)

  useEffect(() => {
    if (!addresses) {
      fetchWalletAddresses()
    }
    if (!health) {
      getWalletHealth()
    }
  }, [])

  useEffect(() => {
    if (addresses) {
      setPrimaryInput(addresses.primary_address || '')
      setSecondaryInput(addresses.secondary_address || '')
    }
  }, [addresses])

  const primaryValid = useMemo(() => health?.primary_valid ?? false, [health])
  const secondaryValid = useMemo(() => health?.secondary_valid ?? true, [health])

  const onSavePrimary = async () => {
    setSaving('primary')
    try {
      const result = await validateAddress(primaryInput)
      if (!result.is_valid) {
        alert(`Primary address invalid: ${result.message}`)
        return
      }
      await updatePrimaryAddress(primaryInput)
      alert('Primary wallet address saved')
    } finally {
      setSaving(null)
    }
  }

  const onSaveSecondary = async () => {
    setSaving('secondary')
    try {
      if (!secondaryInput) {
        await clearSecondaryAddress()
        alert('Secondary wallet address cleared')
        return
      }
      const result = await validateAddress(secondaryInput)
      if (!result.is_valid) {
        alert(`Secondary address invalid: ${result.message}`)
        return
      }
      await updateSecondaryAddress(secondaryInput)
      alert('Secondary wallet address saved')
    } finally {
      setSaving(null)
    }
  }

  return (
    <View style={[styles.card, style]}>
      <Text preset='h5' style={styles.title}>Payment Wallet Addresses</Text>
      <Text style={styles.subtitle}>Configure the addresses where TEAM556 payments will be deposited.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Primary Wallet Address</Text>
        <TextInput
          value={primaryInput}
          onChangeText={setPrimaryInput}
          placeholder='Enter primary Solana address'
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize='none'
          autoCorrect={false}
          style={[styles.input, primaryInput ? styles.inputFilled : undefined]}
        />
        <View style={styles.rowBetween}>
          <AddressValidatorBadge
            loading={isValidating || isLoading}
            isValid={primaryInput ? primaryValid : false}
            text={primaryInput ? (primaryValid ? 'Valid address' : 'Not validated yet') : 'Empty'}
          />
          <Button
            size='sm'
            disabled={saving === 'primary'}
            onPress={onSavePrimary}
          >
            {saving === 'primary' ? 'Saving…' : 'Save'}
          </Button>
        </View>
        {!!addresses?.primary_address && (
          <Text style={styles.current}>Current: {formatWalletAddress(addresses.primary_address)}</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.fieldGroup}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Secondary Wallet Address (optional)</Text>
          {addresses?.has_secondary && (
            <TouchableOpacity onPress={clearSecondaryAddress}>
              <Text style={styles.clearLink}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          value={secondaryInput}
          onChangeText={setSecondaryInput}
          placeholder='Enter secondary Solana address (optional)'
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize='none'
          autoCorrect={false}
          style={[styles.input, secondaryInput ? styles.inputFilled : undefined]}
        />
        <View style={styles.rowBetween}>
          <AddressValidatorBadge
            loading={isValidating || isLoading}
            isValid={!secondaryInput ? true : secondaryValid}
            text={!secondaryInput ? 'Not set' : (secondaryValid ? 'Valid address' : 'Not validated yet')}
          />
          <Button
            size='sm'
            disabled={saving === 'secondary'}
            onPress={onSaveSecondary}
          >
            {saving === 'secondary' ? 'Saving…' : 'Save'}
          </Button>
        </View>
        {!!addresses?.secondary_address && (
          <Text style={styles.current}>Current: {formatWalletAddress(addresses.secondary_address)}</Text>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

export const AddressValidatorBadge: React.FC<{ loading?: boolean; isValid: boolean; text?: string }> = ({ loading, isValid, text }) => {
  if (loading) {
    return (
      <View style={[styles.badge, styles.badgeInfo]}>
        <ActivityIndicator size='small' color={Colors.text} />
        <Text style={styles.badgeText}>Checking…</Text>
      </View>
    )
  }
  return (
    <View style={[styles.badge, isValid ? styles.badgeSuccess : styles.badgeWarning]}>
      <Text style={styles.badgeText}>{text || (isValid ? 'Valid' : 'Invalid')}</Text>
    </View>
  )
}

export const WalletAddressDisplay: React.FC<{ addresses: POSWalletAddresses | null }> = ({ addresses }) => {
  if (!addresses) return null
  return (
    <View style={styles.displayBox}>
      <Text style={styles.displayRow}>Primary: <Text style={styles.mono}>{formatWalletAddress(addresses.primary_address)}</Text></Text>
      {addresses.secondary_address && (
        <Text style={styles.displayRow}>Secondary: <Text style={styles.mono}>{formatWalletAddress(addresses.secondary_address)}</Text></Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    marginBottom: 6,
    color: Colors.text,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.backgroundDark,
    color: Colors.text,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8, default: 10 }),
  },
  inputFilled: {
    borderColor: Colors.tint,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  current: {
    marginTop: 6,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    opacity: 0.6,
  },
  clearLink: {
    color: Colors.warning,
  },
  error: {
    color: Colors.error,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.text,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  badgeInfo: {
    backgroundColor: Colors.tint,
  },
  displayBox: {
    backgroundColor: Colors.backgroundDark,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  displayRow: {
    color: Colors.text,
    marginBottom: 4,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text,
  },
})
