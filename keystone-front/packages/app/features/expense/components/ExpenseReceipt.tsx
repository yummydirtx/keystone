import { Card, XStack, H3, Button } from '@my/ui'
import { Briefcase } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { ImageViewer } from '../../../components/ImageViewer'
import { getSecureReceiptUrl } from '../../../utils/secureReceipts'

interface ExpenseReceiptProps {
  receiptUrl: string
  guestToken?: string
}

export function ExpenseReceipt({ receiptUrl, guestToken }: ExpenseReceiptProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [secureUrl, setSecureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleViewReceipt = async () => {
    if (!receiptUrl) return

    setIsLoading(true)
    try {
      // Get secure URL from backend
      const url = await getSecureReceiptUrl(receiptUrl, guestToken)
      setSecureUrl(url)
      setIsViewerOpen(true)
    } catch (error) {
      console.error('Failed to get secure receipt URL:', error)
      console.error('Receipt URL that failed:', receiptUrl)
      console.error('Guest token present:', !!guestToken)

      // Don't fallback to the raw file path - it won't work
      alert(`Failed to load receipt: ${error.message}`)
      setSecureUrl(null)
      setIsViewerOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseViewer = () => {
    setIsViewerOpen(false)
    setSecureUrl(null)
  }

  return (
    <>
      <Card
        p="$4"
        bg="$background"
        flex={1}
        minW="49%"
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
          <H3>Receipt</H3>
        </XStack>
        <Button
          variant="outlined"
          onPress={handleViewReceipt}
          width="100%"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'View Receipt'}
        </Button>
      </Card>

      {secureUrl && (
        <ImageViewer
          visible={isViewerOpen}
          imageUrl={secureUrl}
          onClose={handleCloseViewer}
        />
      )}
    </>
  )
}
