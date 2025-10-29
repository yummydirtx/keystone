import { Card, XStack, YStack, H3, Text, Separator } from '@my/ui'
import { Receipt } from '@tamagui/lucide-icons'
import { formatCurrency } from '../../../utils/currency'

interface ExpenseItem {
  name: string
  quantity: number
  price: number
}

interface ExpenseItemizedReceiptProps {
  items: ExpenseItem[]
}

export function ExpenseItemizedReceipt({ items }: ExpenseItemizedReceiptProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  return (
    <Card
      p="$4"
      bg="$background"
    >
      <XStack
        items="center"
        gap="$2"
        mb="$3"
      >
        <Receipt
          size="$1"
          color="$color11"
        />
        <H3>Itemized Receipt</H3>
      </XStack>

      <YStack gap="$2">
        {items.map((item, index) => (
          <XStack
            key={index}
            justify="space-between"
            items="center"
            py="$2"
          >
            <YStack flex={1}>
              <Text
                fontSize="$3"
                color="$color12"
                fontWeight="500"
              >
                {item.name}
              </Text>
              <Text
                fontSize="$2"
                color="$color11"
              >
                Qty: {item.quantity} × {formatCurrency(item.price)}
              </Text>
            </YStack>
            <Text
              fontSize="$3"
              color="$color12"
              fontWeight="600"
            >
              {formatCurrency(item.quantity * item.price)}
            </Text>
          </XStack>
        ))}

        <Separator my="$2" />

        <XStack
          justify="space-between"
          items="center"
          py="$2"
        >
          <Text
            fontSize="$4"
            color="$color12"
            fontWeight="600"
          >
            Total
          </Text>
          <Text
            fontSize="$4"
            color="$color12"
            fontWeight="700"
          >
            {formatCurrency(totalAmount)}
          </Text>
        </XStack>
      </YStack>
    </Card>
  )
}
