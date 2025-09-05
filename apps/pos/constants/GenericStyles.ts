import { Colors } from './Colors'
import { StyleSheet } from 'react-native'

export const genericStyles = StyleSheet.create({
  input: {
    height: 50,
    backgroundColor: Colors.backgroundDarker,
    color: Colors.text,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
