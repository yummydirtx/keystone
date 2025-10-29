import { YStack, H2, Label, Input } from '@my/ui'
import { useEffect, useRef, useState, memo } from 'react'
import type { BasicInformationSectionProps } from './types'

function BasicInformationSectionComponent(props: BasicInformationSectionProps) {
  const {
    amount,
    description,
    transactionDate,
    onAmountChange,
    onDescriptionChange,
    onTransactionDateChange,
  } = props

  // Local UI state to reduce keystroke-driven rerenders of parents
  const [localAmount, setLocalAmount] = useState(amount)
  const [localDescription, setLocalDescription] = useState(description)
  const [localDate, setLocalDate] = useState(transactionDate)

  // Track focus to avoid overwriting while user is typing
  const amountFocusedRef = useRef(false)
  const descFocusedRef = useRef(false)
  const dateFocusedRef = useRef(false)

  // Debounce timers
  const amountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync down external changes (e.g., AI results) when not focused
  useEffect(() => {
    if (!amountFocusedRef.current && amount !== localAmount) {
      setLocalAmount(amount)
    }
  }, [amount])

  useEffect(() => {
    if (!descFocusedRef.current && description !== localDescription) {
      setLocalDescription(description)
    }
  }, [description])

  useEffect(() => {
    if (!dateFocusedRef.current && transactionDate !== localDate) {
      setLocalDate(transactionDate)
    }
  }, [transactionDate])

  const emitAmount = (value: string) => {
    if (amountTimerRef.current) clearTimeout(amountTimerRef.current)
    amountTimerRef.current = setTimeout(() => onAmountChange(value), 120)
  }

  const emitDescription = (value: string) => {
    if (descTimerRef.current) clearTimeout(descTimerRef.current)
    descTimerRef.current = setTimeout(() => onDescriptionChange(value), 120)
  }

  const emitDate = (value: string) => {
    if (dateTimerRef.current) clearTimeout(dateTimerRef.current)
    dateTimerRef.current = setTimeout(() => onTransactionDateChange(value), 120)
  }

  // Reset internal refs when signaled
  if (typeof resetSignal === 'number') {
    // When parent increments resetSignal, remount inputs and reset refs
    amountLocalRef.current = amount
    descriptionLocalRef.current = description
    dateLocalRef.current = transactionDate
  }
  const handleAmountChange = (value: string) => {
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

    onAmountChange(sanitizedValue)
  }

  return (
    <YStack gap="$3">
      <H2
        fontSize="$5"
        letterSpacing={0.1}
      >
        Basic Information
      </H2>

      {/* Amount input */}
      <YStack gap="$2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          placeholder="0.00"
          value={localAmount}
          onChangeText={(text) => {
            setLocalAmount(text)
            handleAmountChange(text)
            emitAmount(text)
          }}
          onFocus={() => {
            amountFocusedRef.current = true
          }}
          onBlur={() => {
            amountFocusedRef.current = false
            onAmountChange(localAmount)
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
      </YStack>

      {/* Description input */}
      <YStack gap="$2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Enter expense description"
          value={localDescription}
          onChangeText={(text) => {
            setLocalDescription(text)
            emitDescription(text)
          }}
          onFocus={() => {
            descFocusedRef.current = true
          }}
          onBlur={() => {
            descFocusedRef.current = false
            onDescriptionChange(localDescription)
          }}
        />
      </YStack>

      {/* Transaction date input */}
      <YStack gap="$2">
        <Label htmlFor="transactionDate">Transaction Date</Label>
        <Input
          id="transactionDate"
          placeholder="YYYY-MM-DD"
          value={localDate}
          onChangeText={(text) => {
            setLocalDate(text)
            emitDate(text)
          }}
          onFocus={() => {
            dateFocusedRef.current = true
          }}
          onBlur={() => {
            dateFocusedRef.current = false
            onTransactionDateChange(localDate)
          }}
        />
      </YStack>
    </YStack>
  )
}

export const BasicInformationSection = memo(BasicInformationSectionComponent)
