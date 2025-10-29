import { UserDetailScreen } from 'app/features/user/detail-screen'
import { Stack } from 'expo-router'
import { useParams } from 'solito/navigation'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  const { id } = useParams()
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderLogo />,
          presentation: 'modal',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerRight: () => <HeaderMenuButton />,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
        }}
      />
      <UserDetailScreen id={id as string} />
    </>
  )
}
