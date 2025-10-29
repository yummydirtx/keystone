import { Platform } from 'react-native'
import { NativeToast as Toast } from './NativeToast'

// Only import expo-constants on native platforms
const getIsExpo = () => {
  if (Platform.OS === 'web') {
    return false
  }

  try {
    const Constants = require('expo-constants')
    return Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient
  } catch (error) {
    // If expo-constants is not available, assume it's not running in Expo
    return false
  }
}

const isExpo = getIsExpo()

/**
 * Renders a platform-specific toast notification component.
 * This component conditionally renders toast notifications based on the execution environment,
 * hiding them in Expo Go client but showing them in standalone builds.
 *
 * @returns {JSX.Element | null} The rendered toast component or null if running in Expo Go.
 *
 * @example
 * // Basic usage in app root
 * <CustomToast />
 *
 * @example
 * // Typically placed at the app root level
 * function App() {
 *   return (
 *     <TamaguiProvider>
 *       <YourAppContent />
 *       <CustomToast />
 *     </TamaguiProvider>
 *   )
 * }
 */
export const CustomToast = () => {
  if (isExpo) {
    return null
  }
  return <Toast />
}
