import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useTheme, ThemeContextType } from './ThemeContext';

interface SelectItem<T> {
  label: string;
  value: T;
}

interface SelectProps<T> {
  items: SelectItem<T>[];
  selectedValue: T | undefined;
  onValueChange: (value: T) => void;
  placeholder?: string;
  style?: object; 
}

export const Select = <T extends string | number>({ items, selectedValue, onValueChange, placeholder = "Select an item", style }: SelectProps<T>) => {
  const [modalVisible, setModalVisible] = useState(false);
  const theme: ThemeContextType = useTheme(); 
  const styles = createStyles(theme);

  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <View style={[styles.container, style]}> 
      <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectButtonText}>{selectedItem ? selectedItem.label : placeholder}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList<SelectItem<T>>
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (theme: ThemeContextType) => StyleSheet.create({
  container: {
    width: '100%',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderWidth: 1,
    borderColor: theme.colors.textSecondary, 
    borderRadius: 8,
    backgroundColor: theme.colors.backgroundCard, 
    minHeight: 48, 
  },
  selectButtonText: {
    fontSize: 16,
    color: theme.colors.text, 
  },
  arrow: {
    fontSize: 16, 
    color: theme.colors.text, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundCard, 
    borderRadius: 8,
    paddingVertical: 8, 
    width: '85%', 
    maxHeight: '50%', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalItem: {
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary, 
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.text, 
  },
});

export default Select; 
