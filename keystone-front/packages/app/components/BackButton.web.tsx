import { Button } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

export function BackButton() {
  const router = useRouter()
  // Use the router to navigate back
  return (
    <Button
      icon={ChevronLeft}
      onPress={() => {
        router.back()
      }}
      chromeless
      aria-label="Go back"
    />
  )
}
