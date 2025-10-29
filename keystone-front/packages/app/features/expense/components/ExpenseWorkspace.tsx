import { Card, XStack, H3, Text } from '@my/ui'
import { Briefcase } from '@tamagui/lucide-icons'

interface ExpenseWorkspaceProps {
  workspace: {
    name: string
  }
}

export function ExpenseWorkspace({ workspace }: ExpenseWorkspaceProps) {
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
        <H3>Workspace</H3>
      </XStack>
      <Text
        color="$color11"
        fontWeight="600"
      >
        {workspace.name}
      </Text>
    </Card>
  )
}
