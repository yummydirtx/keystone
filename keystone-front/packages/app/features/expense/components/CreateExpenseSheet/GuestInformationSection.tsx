import { YStack, H2, Label, Input } from '@my/ui'
import type { GuestInformationSectionProps } from './types'

export function GuestInformationSection({
  guestName,
  guestEmail,
  onGuestNameChange,
  onGuestEmailChange,
}: GuestInformationSectionProps) {
  return (
    <YStack gap="$3">
      <H2
        fontSize="$5"
        letterSpacing={0.1}
      >
        Your Information (Optional)
      </H2>

      {/* Guest Name input */}
      <YStack gap="$2">
        <Label htmlFor="guestName">Your Name</Label>
        <Input
          id="guestName"
          placeholder="Enter your name"
          value={guestName}
          onChangeText={onGuestNameChange}
        />
      </YStack>

      {/* Guest Email input */}
      <YStack gap="$2">
        <Label htmlFor="guestEmail">Your Email</Label>
        <Input
          id="guestEmail"
          placeholder="Enter your email"
          value={guestEmail}
          onChangeText={onGuestEmailChange}
          keyboardType="email-address"
          inputMode="email"
        />
      </YStack>
    </YStack>
  )
}
