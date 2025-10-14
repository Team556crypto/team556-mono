import { useWindowDimensions } from 'react-native'

const TABLET_BREAKPOINT = 768 // Or your desired breakpoint

export const useBreakpoint = () => {
  const { width, height } = useWindowDimensions()
  const isTabletOrLarger = width >= TABLET_BREAKPOINT
  const isLandscape = width > height
  const isTabletLandscape = isTabletOrLarger && isLandscape
  return { isTabletOrLarger, isTabletLandscape, isLandscape, width, height }
}
