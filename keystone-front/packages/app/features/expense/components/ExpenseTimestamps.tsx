import { Card, YStack, XStack, Separator, Text } from '@my/ui'

interface ExpenseTimestampsProps {
  createdAt: string
  updatedAt: string
}

export function ExpenseTimestamps({ createdAt, updatedAt }: ExpenseTimestampsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card
      p="$4"
      bg="$background"
    >
      <YStack gap="$2">
        <XStack justify="space-between">
          <Text color="$color11">Created:</Text>
          <Text>{formatDate(createdAt)}</Text>
        </XStack>
        <Separator />
        <XStack justify="space-between">
          <Text color="$color11">Updated:</Text>
          <Text>{formatDate(updatedAt)}</Text>
        </XStack>
      </YStack>
    </Card>
  )
}
