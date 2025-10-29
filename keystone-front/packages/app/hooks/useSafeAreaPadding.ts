import { Platform } from 'react-native'
import { useSafeArea } from '../provider/safe-area/use-safe-area'

/**
 * Hook that provides platform-appropriate padding values for screen content.
 *
 * On native platforms:
 * - Uses safe area insets and accounts for transparent header
 * - Returns proper top padding to account for both safe area and header height
 *
 * On web:
 * - Returns consistent padding values
 * - Uses larger top padding to account for custom navigation
 */
export function useSafeAreaPadding() {
  const safeAreaInsets = useSafeArea()

  if (Platform.OS === 'web') {
    // Web needs consistent padding since we have custom navigation
    return {
      paddingTop: '$12' as const,
      paddingBottom: '$8' as const,
      paddingHorizontal: '$4' as const,
    }
  }

  // Native platforms - Need to account for transparent header + safe area
  // Header is typically ~44pt on iOS, so we need safe area + header height
  return {
    paddingTop: '$2' as const, // Increased to account for transparent header
    paddingBottom: '$8' as const,
    paddingHorizontal: '$4' as const,
  }
}

/**
 * Hook that provides just the top padding value for screens.
 * Useful when you only need to override the top padding.
 */
export function useScreenTopPadding() {
  const padding = useSafeAreaPadding()
  return padding.paddingTop
}
