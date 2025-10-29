import { getExpense, getGuestExpenseDetail } from 'app/utils/api'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Expense } from 'app/types'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Read the guest token from search params
  const guestToken = searchParams.guestToken as string | undefined

  try {
    // Fetch expense data
    let expenseData: Expense | null = null

    if (guestToken) {
      // For guest users, try to get data from the guest API
      try {
        const guestResponse = await getGuestExpenseDetail(guestToken, params.id)

        expenseData = (guestResponse as any).data?.expense || null
      } catch (guestError) {
        console.error('Error fetching guest expense data:', guestError)
        // Fall back to default metadata
        expenseData = null
      }
    } else {
      expenseData = null
    }
    // If we have expense data, use it for the title
    if (expenseData?.description) {
      // Determine OG image URL based on guest token presence
      const ogImageUrl = guestToken
        ? `${'https://gokeystone.org'}/api/og/expense/${guestToken}/${params.id}`
        : `${'https://gokeystone.org'}/og.png`

      return {
        title: `${expenseData.description} - Keystone`,
        description: `View expense details for "${expenseData.description}" on Keystone`,
        openGraph: {
          title: `${expenseData.description} - Keystone`,
          description: `View expense details for "${expenseData.description}" on Keystone`,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${expenseData.description} - Keystone`,
            },
          ],
        },
        twitter: {
          title: `${expenseData.description} - Keystone`,
          description: `View expense details for "${expenseData.description}" on Keystone`,
          images: [ogImageUrl],
          card: 'summary_large_image',
        },
      }
    }
  } catch (error) {
    console.error('Error fetching expense metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Expense - Keystone',
    description: 'View expense details on Keystone',
  }
}

import PageClient from './page.client'

// Export the page component directly instead of re-exporting
export default function Page({ params }: { params: { id: string } }) {
  return <PageClient params={params} />
}
