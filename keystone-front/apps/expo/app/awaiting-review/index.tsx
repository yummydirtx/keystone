import { AwaitingReviewListScreen } from 'app/features/awaiting-review/list-screen'
import { Stack } from 'expo-router'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Awaiting Review',
          headerTitle: () => <HeaderLogo title="Awaiting Review" />,
          headerRight: () => <HeaderMenuButton />,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <AwaitingReviewListScreen />
    </>
  )
}
