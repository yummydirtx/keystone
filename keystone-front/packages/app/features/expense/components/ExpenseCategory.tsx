import { Card, XStack, H3, Text } from '@my/ui'
import { Tag } from '@tamagui/lucide-icons'

interface ExpenseCategoryProps {
  category: {
    name: string
  }
}

export function ExpenseCategory({ category }: ExpenseCategoryProps) {
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
        <Tag
          size="$1"
          color="$color11"
        />
        <H3>Category</H3>
      </XStack>
      <Text
        color="$blue11"
        fontWeight="600"
      >
        {category.name}
      </Text>
    </Card>
  )
}
