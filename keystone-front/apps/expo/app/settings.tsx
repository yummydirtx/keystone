import { SettingsScreen } from 'app/features/user/SettingsScreen'
import { Stack } from 'expo-router'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderLogo title="Settings" />,
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerRight: () => <HeaderMenuButton />,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
        }}
      />
      <SettingsScreen />
    </>
  )
}
