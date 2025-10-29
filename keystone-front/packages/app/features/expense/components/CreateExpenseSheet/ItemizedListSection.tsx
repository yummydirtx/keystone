import { YStack, H2, XStack, Input, Button, Paragraph } from '@my/ui'
import { memo, useEffect, useRef, useState } from 'react'
import { formatCurrency } from '../../../../utils/currency'
import type { ItemizedListSectionProps } from './types'

function ItemizedListSectionComponent({
  items,
  itemName,
  itemQuantity,
  itemPrice,
  editingItemIndex,
  editItemName,
  editItemQuantity,
  editItemPrice,
  onItemNameChange,
  onItemQuantityChange,
  onItemPriceChange,
  onEditItemNameChange,
  onEditItemQuantityChange,
  onEditItemPriceChange,
  onAddItem,
  onEditItem,
  onSaveEdit,
  onCancelEdit,
  onDeleteItem,
}: ItemizedListSectionProps) {
  const [localName, setLocalName] = useState(itemName)
  const [localQty, setLocalQty] = useState(itemQuantity)
  const [localPrice, setLocalPrice] = useState(itemPrice)
  const nameFocusedRef = useRef(false)
  const qtyFocusedRef = useRef(false)
  const priceFocusedRef = useRef(false)

  useEffect(() => {
    if (!nameFocusedRef.current) setLocalName(itemName)
  }, [itemName])
  useEffect(() => {
    if (!qtyFocusedRef.current) setLocalQty(itemQuantity)
  }, [itemQuantity])
  useEffect(() => {
    if (!priceFocusedRef.current) setLocalPrice(itemPrice)
  }, [itemPrice])
  const handlePriceChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '')

    // Prevent multiple decimal points
    const parts = sanitizedValue.split('.')
    if (parts.length > 2) {
      return // Don't update if there are multiple decimal points
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return // Don't update if more than 2 decimal places
    }

    // Check if the value exceeds maximum
    const numericValue = Number.parseFloat(sanitizedValue)
    if (!Number.isNaN(numericValue) && numericValue > 999999.99) {
      return // Don't update if exceeds maximum
    }

    onItemPriceChange(sanitizedValue)
  }

  const handleEditPriceChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '')

    // Prevent multiple decimal points
    const parts = sanitizedValue.split('.')
    if (parts.length > 2) {
      return // Don't update if there are multiple decimal points
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return // Don't update if more than 2 decimal places
    }

    // Check if the value exceeds maximum
    const numericValue = Number.parseFloat(sanitizedValue)
    if (!Number.isNaN(numericValue) && numericValue > 999999.99) {
      return // Don't update if exceeds maximum
    }

    onEditItemPriceChange(sanitizedValue)
  }

  return (
    <YStack gap="$3">
      <H2
        fontSize="$5"
        letterSpacing={0.1}
      >
        Itemized List (Optional)
      </H2>

      {/* Display list of added items */}
      <YStack gap="$2">
        {items.map((item, index) => (
          <XStack
            key={index}
            gap="$2"
            items="center"
            p="$2"
            bg="$background"
          >
            {editingItemIndex === index ? (
              // Edit mode
              <YStack
                flex={1}
                gap="$2"
              >
                <Input
                  placeholder="Item Name"
                  value={editItemName}
                  onChangeText={onEditItemNameChange}
                />
                <XStack gap="$2">
                  <Input
                    placeholder="Qty"
                    value={editItemQuantity}
                    onChangeText={onEditItemQuantityChange}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    width="30%"
                  />
                  <Input
                    placeholder="Price"
                    value={editItemPrice}
                    onChangeText={handleEditPriceChange}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    width="70%"
                  />
                </XStack>
                <XStack
                  gap="$2"
                  justify="flex-end"
                >
                  <Button
                    size="$2"
                    variant="outlined"
                    onPress={onCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="$2"
                    onPress={onSaveEdit}
                  >
                    Save
                  </Button>
                </XStack>
              </YStack>
            ) : (
              // Display mode
              <XStack
                flex={1}
                gap="$1"
                items="center"
              >
                <Paragraph
                  flex={1}
                >{`${item.quantity}x ${item.name} @ ${formatCurrency(item.price)}`}</Paragraph>
                <XStack gap="$1">
                  <Button
                    size="$2"
                    variant="outlined"
                    onPress={() => onEditItem(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="$2"
                    theme="red"
                    onPress={() => onDeleteItem(index)}
                  >
                    Delete
                  </Button>
                </XStack>
              </XStack>
            )}
          </XStack>
        ))}
      </YStack>

      {/* Form to add new items */}
      <YStack gap="$3">
        {/* Item name input */}
        <Input
          placeholder="Item Name"
          value={localName}
          onChangeText={(t) => {
            setLocalName(t)
            onItemNameChange(t)
          }}
          onFocus={() => {
            nameFocusedRef.current = true
          }}
          onBlur={() => {
            nameFocusedRef.current = false
            onItemNameChange(localName)
          }}
        />

        {/* Quantity and price inputs in a row */}
        <XStack gap="$2">
          <Input
            placeholder="Quantity"
            value={localQty}
            onChangeText={(t) => {
              setLocalQty(t)
              onItemQuantityChange(t)
            }}
            onFocus={() => {
              qtyFocusedRef.current = true
            }}
            onBlur={() => {
              qtyFocusedRef.current = false
              onItemQuantityChange(localQty)
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            width="30%"
          />
          <Input
            placeholder="Price"
            value={localPrice}
            onChangeText={(t) => {
              setLocalPrice(t)
              handlePriceChange(t)
            }}
            onFocus={() => {
              priceFocusedRef.current = true
            }}
            onBlur={() => {
              priceFocusedRef.current = false
              onItemPriceChange(localPrice)
            }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            width="70%"
          />
        </XStack>

        {/* Add item button */}
        <Button onPress={onAddItem}>Add Item</Button>
      </YStack>
    </YStack>
  )
}

export const ItemizedListSection = memo(ItemizedListSectionComponent)
