import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Button } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'

type ReceiveDrawerProps = {
  address: string
  onClose: () => void
  onDismiss?: () => void
}

export const ReceiveDrawerContent: React.FC<ReceiveDrawerProps> = ({ address, onClose, onDismiss }) => {
  const { copyAddressToClipboard } = useWalletClipboard()

  const handleCopy = () => {
    copyAddressToClipboard(address)
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text preset='h3' style={styles.title}>
          Receive Tokens
        </Text>

        <Text preset='paragraph' style={styles.description}>
          Share this address or scan the QR code to receive SOL or TEAM tokens.
        </Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode value={address} size={130} color='black' backgroundColor='white' />
        </View>

        {/* Address Display and Copy Button */}
        <View style={styles.addressSection}>
          <Text preset='caption' style={styles.addressLabel}>
            Your Wallet Address
          </Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode='middle'>
              {address}
            </Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
              <Ionicons name='copy-outline' size={20} color={Colors.tint} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtonsContainer}>
          <Button title='Close' onPress={onClose} variant='secondary' style={styles.button} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 150
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold'
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  addressSection: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  addressLabel: {
    color: Colors.icon,
    marginBottom: 6,
    fontSize: 13
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  addressText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    marginRight: 8
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.backgroundDark
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  button: {
    flex: 1
  }
})

export default ReceiveDrawerContent
