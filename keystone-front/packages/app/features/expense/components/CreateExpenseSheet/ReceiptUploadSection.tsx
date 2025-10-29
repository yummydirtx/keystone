import { YStack, H2, Paragraph, XStack, Checkbox, Label, Card } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { ReceiptPicker } from '../../components/ReceiptPicker'
import { RainbowKeystoneAI } from '../../components/RainbowKeystoneAI'
import type { ReceiptUploadSectionProps } from './types'

export function ReceiptUploadSection({
  selectedReceipt,
  uploadingReceipt,
  creating,
  onReceiptSelected,
  onReceiptRemoved,
  isRequired = false,
  receiptProcessor,
  skipAI = false,
  onSkipAIChange,
}: ReceiptUploadSectionProps) {
  const handleToggleAI = useCallback(() => {
    if (onSkipAIChange && !creating && !uploadingReceipt) {
      onSkipAIChange(!skipAI)
    }
  }, [onSkipAIChange, skipAI, creating, uploadingReceipt])

  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <H2
          fontSize="$5"
          letterSpacing={0.1}
        >
          Upload Receipt {isRequired ? '(Required)' : '(Recommended)'}
        </H2>
        <Paragraph fontSize="$3">
          {isRequired
            ? 'This category requires a receipt to be uploaded. '
            : 'Upload a receipt and '}
          {!skipAI && <RainbowKeystoneAI>Keystone AI</RainbowKeystoneAI>}
          {!skipAI
            ? ' will automatically itemize your receipt and extract the amount, date, and description for you!'
            : skipAI
              ? 'you can manually enter the details below.'
              : 'you can manually enter the details below.'}
        </Paragraph>
      </YStack>

      {/* Use Keystone AI Checkbox */}
      <Card
        p="$3"
        bg="$color2"
        bordered
      >
        <Pressable
          onPress={handleToggleAI}
          disabled={creating || uploadingReceipt}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <XStack
            justify="space-between"
            items="center"
            gap="$3"
          >
            <Label fontWeight="600">
              Use <RainbowKeystoneAI>Keystone AI</RainbowKeystoneAI>
            </Label>
            <Checkbox
              checked={!skipAI}
              disabled={creating || uploadingReceipt}
              pointerEvents="none"
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
          </XStack>
        </Pressable>
      </Card>

      <ReceiptPicker
        onReceiptSelected={(uri) => onReceiptSelected(uri, skipAI)}
        onReceiptRemoved={onReceiptRemoved}
        selectedReceipt={selectedReceipt}
        isUploading={uploadingReceipt}
        disabled={creating}
        isRequired={isRequired}
        skipAI={skipAI}
      />

      {/* AI Processing Feedback */}
      {!skipAI && receiptProcessor.parsingReceipt ? (
        <YStack
          gap="$2"
          p="$3"
          bg="$blue2"
        >
          <Paragraph
            fontSize="$3"
            color="$blue11"
          >
            🤖 Analyzing receipt with AI...
          </Paragraph>
          {receiptProcessor.parsingInfo ? (
            <Paragraph
              fontSize="$2"
              color="$blue10"
            >
              {receiptProcessor.parsingInfo}
            </Paragraph>
          ) : null}
        </YStack>
      ) : null}

      {!skipAI && receiptProcessor.parsingError ? (
        <YStack
          gap="$2"
          p="$3"
          bg="$red2"
        >
          <Paragraph
            fontSize="$3"
            color="$red11"
          >
            ⚠️ AI Analysis Error
          </Paragraph>
          <Paragraph
            fontSize="$2"
            color="$red10"
          >
            {receiptProcessor.parsingError}
          </Paragraph>
        </YStack>
      ) : null}

      {!skipAI &&
        receiptProcessor.parsingInfo &&
        !receiptProcessor.parsingReceipt &&
        !receiptProcessor.parsingError ? (
        <YStack
          gap="$2"
          p="$3"
          bg="$green2"
        >
          <Paragraph
            fontSize="$3"
            color="$green11"
          >
            ✅ {receiptProcessor.parsingInfo}
          </Paragraph>
        </YStack>
      ) : null}
    </YStack>
  )
}
