import { Card, XStack, YStack, H3, Text, Image } from '@my/ui'
import { User, UserX } from '@tamagui/lucide-icons'
import { ProfilePicture } from '../../../components/ProfilePicture'

interface ExpenseSubmitterProps {
  submitter?: {
    name: string
    email: string
    avatar_url?: string
  } | null
  guestName?: string
  guestEmail?: string
}

export function ExpenseSubmitter({
  submitter,
  guestName,
  guestEmail,
}: ExpenseSubmitterProps & { guestName?: string; guestEmail?: string }) {
  // Handle guest submissions
  if (guestName || guestEmail) {
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
          <User
            size="$1"
            color="$color11"
          />
          <H3>Submitted by</H3>
          <Text
            bg="$yellow4"
            color="$yellow11"
            fontSize="$2"
            fontWeight="600"
            px="$2"
            py="$1"
          >
            GUEST
          </Text>
        </XStack>
        <XStack
          items="center"
          gap="$3"
        >
          <ProfilePicture
            name={guestName || 'Guest'}
            size={48}
            borderRadius="$6"
          />
          <YStack
            gap="$1"
            flex={1}
          >
            <Text fontWeight="600">{guestName || 'Guest User'}</Text>
            {guestEmail && (
              <Text
                color="$color11"
                fontSize="$3"
              >
                {guestEmail}
              </Text>
            )}
            <Text
              color="$color9"
              fontSize="$2"
            >
              Guest Submission
            </Text>
          </YStack>
        </XStack>
      </Card>
    )
  }

  // Handle anonymized expenses where submitter is null
  if (!submitter) {
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
          <UserX
            size="$1"
            color="$color11"
          />
          <H3>Submitted by</H3>
        </XStack>
        <XStack
          items="center"
          gap="$3"
        >
          <ProfilePicture
            name="Anonymous"
            size={48}
            borderRadius="$6"
          />
          <YStack
            gap="$1"
            flex={1}
          >
            <Text
              fontWeight="600"
              color="$color10"
            >
              Anonymous User
            </Text>
            <Text
              color="$color9"
              fontSize="$3"
            >
              Account deleted
            </Text>
          </YStack>
        </XStack>
      </Card>
    )
  }

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
        <User
          size="$1"
          color="$color11"
        />
        <H3>Submitted by</H3>
      </XStack>
      <XStack
        items="center"
        gap="$3"
      >
        <ProfilePicture
          avatarUrl={submitter.avatar_url}
          name={submitter.name}
          size={48}
          borderRadius="$6"
        />
        <YStack
          gap="$1"
          flex={1}
        >
          <Text fontWeight="600">{submitter.name}</Text>
          <Text
            color="$color11"
            fontSize="$3"
          >
            {submitter.email}
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}
