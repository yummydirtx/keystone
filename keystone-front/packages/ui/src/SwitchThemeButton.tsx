import { Button, isWeb } from 'tamagui'
import { useThemeSetting } from './UniversalThemeProvider'

/**
 * Renders a button that toggles between light and dark themes.
 * This component automatically detects the current theme and provides
 * a way for users to switch between available themes.
 * Works on both web and native platforms.
 *
 * @returns {JSX.Element} The rendered theme toggle button showing current theme.
 *
 * @example
 * // Basic theme switcher
 * <SwitchThemeButton />
 *
 * @example
 * // Typically placed in a settings or navigation area
 * <YStack gap="$2">
 *   <Text>Appearance</Text>
 *   <SwitchThemeButton />
 * </YStack>
 *
 * @example
 * // In a toolbar or header
 * <XStack justify="space-between">
 *   <Logo />
 *   <SwitchThemeButton />
 * </XStack>
 */
export const SwitchThemeButton = () => {
  const themeSetting = useThemeSetting()

  const getThemeLabel = () => {
    const currentTheme = themeSetting.current || 'system'
    if (currentTheme === 'light') return 'Light'
    if (currentTheme === 'dark') return 'Dark'
    return 'System'
  }

  return (
    <Button
      onPress={themeSetting.toggle}
      size="$3"
    >
      {getThemeLabel()}
    </Button>
  )
}
