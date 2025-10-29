import { SubmitterScreen } from 'app/features/submitter/screen'
import { Stack } from 'expo-router'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function SubmitterPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <HeaderMenuButton />,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <SubmitterScreen />
    </>
  )
}
