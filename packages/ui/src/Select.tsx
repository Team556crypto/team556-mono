import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native'
import { useTheme, ThemeContextType } from './ThemeContext'

interface SelectItem<T> {
  label: string
  value: T
}

interface SelectProps<T> {
  items: SelectItem<T>[]
  selectedValue: T | undefined
  onValueChange: (value: T) => void
  placeholder?: string
  style?: object
  headerTitle?: string
}

export const Select = <T extends string | number>({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select an item',
  style,
  headerTitle
}: SelectProps<T>) => {
  const [modalVisible, setModalVisible] = useState(false)
  const theme: ThemeContextType = useTheme()
  const styles = createStyles(theme)

  const selectedItem = items.find(item => item.value === selectedValue)
  const modalDisplayTitle = headerTitle || placeholder

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
        accessibilityRole='button'
        accessibilityLabel={selectedItem ? selectedItem.label : placeholder}
        accessibilityState={{ expanded: modalVisible }}
      >
        <Text style={styles.selectButtonText}>{selectedItem ? selectedItem.label : placeholder}</Text>
        <Text style={styles.arrow}>{modalVisible ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType='fade'
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {modalDisplayTitle && (
              <View style={styles.modalHeaderContainer}>
                <Text style={styles.modalHeaderText}>{modalDisplayTitle}</Text>
              </View>
            )}
            <FlatList<SelectItem<T>>
              data={items}
              keyExtractor={item => item.value.toString()}
              renderItem={({ item, index }) => {
                const isSelected = item.value === selectedValue
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isSelected && styles.selectedModalItem,
                      index === items.length - 1 && styles.lastModalItem
                    ]}
                    onPress={() => {
                      onValueChange(item.value)
                      setModalVisible(false)
                    }}
                    accessibilityRole='menuitem'
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>{item.label}</Text>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    container: {
      width: '100%'
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      minHeight: 50
    },
    selectButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      marginRight: 8
    },
    arrow: {
      fontSize: 16,
      color: theme.colors.textSecondary
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    modalContent: {
      backgroundColor: theme.colors.backgroundDark,
      borderRadius: 10,
      width: '90%',
      maxHeight: '60%',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      overflow: 'hidden'
    },
    modalHeaderContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.backgroundDark || theme.colors.textSecondary,
      alignItems: 'center'
    },
    modalHeaderText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text
    },
    modalItem: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background || theme.colors.textSecondary,
      width: '100%'
    },
    lastModalItem: {
      borderBottomWidth: 0
    },
    selectedModalItem: {
      backgroundColor: theme.colors.primarySubtle || 'rgba(194, 147, 251, 0.15)'
    },
    modalItemText: {
      fontSize: 16,
      color: theme.colors.text
    },
    selectedModalItemText: {
      fontWeight: 'bold',
      color: theme.colors.primary || theme.colors.text
    }
  })

export default Select
