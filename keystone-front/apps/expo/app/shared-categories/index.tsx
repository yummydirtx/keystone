import { SharedCategoriesListScreen } from 'app/features/shared-categories/list-screen'
import { Stack } from 'expo-router'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Shared With You',
          headerTitle: () => <HeaderLogo title="Shared With You" />,
          headerRight: () => <HeaderMenuButton />,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <SharedCategoriesListScreen />
    </>
  )
}
