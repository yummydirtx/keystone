import { Card, XStack, H3, Text } from '@my/ui'
import { Briefcase } from '@tamagui/lucide-icons'

interface ExpenseNotesProps {
  notes: string
}

export function ExpenseNotes({ notes }: ExpenseNotesProps) {
  return (
    <Card
      p="$4"
      bg="$background"
    >
      <XStack
        items="center"
        gap="$2"
        mb="$2"
      >
        <Briefcase
          size="$1"
          color="$color11"
        />
        <H3>Notes</H3>
      </XStack>
      <Text
        color="$color12"
        lineHeight="$1"
      >
        {notes}
      </Text>
    </Card>
  )
}
