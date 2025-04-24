import { Colors } from './Colors'
import { StyleSheet } from 'react-native'

export const genericStyles = StyleSheet.create({
  input: {
    height: 50,
    backgroundColor: Colors.backgroundDark,
    color: Colors.text,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  button: {
    width: '100%',
    height: 46,
    marginTop: 6
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background
  }
})
