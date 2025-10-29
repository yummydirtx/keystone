import { CategoryDetailScreen } from 'app/features/category/detail-screen'
import { Stack } from 'expo-router'
import { useParams } from 'solito/navigation'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { useCategoryDetail } from 'app/features/category/hooks/useCategoryDetail'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  const { id } = useParams()
  const { category } = useCategoryDetail(id as string)

  return (
    <>
      <Stack.Screen
        options={{
          title: category?.name,
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <HeaderMenuButton />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationDuration: 300,
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
        }}
      />
      <CategoryDetailScreen />
    </>
  )
}
