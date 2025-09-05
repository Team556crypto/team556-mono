import { useWindowDimensions } from 'react-native'

const TABLET_BREAKPOINT = 768 // Or your desired breakpoint

export const useBreakpoint = () => {
  const { width } = useWindowDimensions()
  const isTabletOrLarger = width >= TABLET_BREAKPOINT
  return { isTabletOrLarger, width } // Return width too, might be useful
}
