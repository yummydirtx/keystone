import { ExpenseDetailScreen } from 'app/features/expense/detail-screen'
import { Stack } from 'expo-router'
import { useParams } from 'solito/navigation'
import { HeaderMenuButton } from 'app/components/HeaderMenuButton'
import { HeaderLogo } from 'app/components/HeaderLogo'
import { useExpense } from 'app/hooks/useExpense'
import { ThemeAwareBlurHeader } from 'app/components/ThemeAwareBlurHeader'

export default function Screen() {
  const { id } = useParams()
  const { expense } = useExpense(id as string)

  return (
    <>
      <Stack.Screen
        options={{
          title: expense?.description,
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <HeaderMenuButton />,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerTransparent: true,
          headerBackground: () => <ThemeAwareBlurHeader />,
        }}
      />
      <ExpenseDetailScreen id={id as string} />
    </>
  )
}
