import { CategorySubmitterScreen } from 'app/features/submitter/category-screen'
import { useLocalSearchParams } from 'expo-router'
import { Stack } from 'expo-router'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { useSubmitterCategory } from 'app/features/submitter/useSubmitterCategory'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function SubmitterCategoryPage() {
  const { id } = useLocalSearchParams()
  const { category } = useSubmitterCategory(id as string)

  return (
    <>
      <Stack.Screen
        options={{
          title: category?.name,
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <HeaderMenuButton />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
        }}
      />
      <CategorySubmitterScreen id={id as string} />
    </>
  )
}
