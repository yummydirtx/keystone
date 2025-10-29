import { H2, Paragraph, XStack, Card } from '@my/ui'
import type React from 'react'

interface DashboardCardProps {
  title: string
  value: string
  icon: React.ComponentType<any>
}

export const DashboardCard = ({ title, value, icon: Icon }: DashboardCardProps) => (
  <Card
    flex={1}
    p="$4"
    minWidth={180}
  >
    <Card.Header>
      <XStack
        items="center"
        gap="$3"
      >
        <Icon
          size="$1.5"
          color="$color10"
        />
        <Paragraph
          size="$5"
          color="$color10"
        >
          {title}
        </Paragraph>
      </XStack>
    </Card.Header>
    <H2
      mt="$2"
      color="$color12"
    >
      {value}
    </H2>
  </Card>
)
