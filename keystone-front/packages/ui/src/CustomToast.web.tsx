import { NativeToast as Toast } from './NativeToast'

/**
 * Web version of CustomToast component.
 * This component renders toast notifications for web environments
 * without relying on expo-constants which is not available in web.
 *
 * @returns {JSX.Element} The rendered toast component.
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
  // On web, always show the toast component
  return <Toast />
}
