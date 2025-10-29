import { getCategory, getGuestCategoryData, getGuestData } from 'app/utils/api'
import type { Metadata, ResolvingMetadata } from 'next'
import type { Category } from 'app/types'

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
    // Fetch category data
    let categoryData: Category | null = null

    if (guestToken) {
      // For guest users, try to get data from the guest API
      try {
        // First try to get data for the specific category
        const guestResponse = await getGuestData(guestToken)

        if (!(guestResponse as any).data?.category) {
          throw new Error('Category not found')
        }

        const originalCategory = (guestResponse as any).data.category

        // Check if the requested ID matches the original category
        if (params.id === originalCategory.id.toString()) {
          categoryData = originalCategory
        }
        // Check if the requested ID is a subcategory of the original category
        else if (originalCategory.children) {
          const subcategory = originalCategory.children.find(
            (child: any) => child.id.toString() === params.id
          )
          if (subcategory) {
            categoryData = subcategory
          }
        }
      } catch (guestError) {
        console.error('Error fetching guest category data:', guestError)
        // Fall back to trying authenticated user approach
        categoryData = null
      }
    } else {
      categoryData = null
    }
    if (categoryData?.name) {
      // Determine OG image URL based on guest token presence
      const ogImageUrl = guestToken
        ? `https://gokeystone.org/api/og/category/${guestToken}`
        : `https://gokeystone.org/og.png`

      return {
        title: `${categoryData.name} - Keystone`,
        description: `Submit expenses in the ${categoryData.name} category on Keystone`,
        openGraph: {
          title: `${categoryData.name} - Keystone`,
          description: `Submit expenses in the ${categoryData.name} category on Keystone`,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${categoryData.name} - Keystone`,
            },
          ],
        },
        twitter: {
          title: `${categoryData.name} - Keystone`,
          description: `Submit expenses in the ${categoryData.name} category on Keystone`,
          images: [ogImageUrl],
          card: 'summary_large_image',
        },
      }
    }
  } catch (error) {
    console.error('Error fetching category metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Submit Expense - Keystone',
    description: 'Submit expenses in this category on Keystone',
  }
}

import PageClient from './page.client'

// Export the page component directly instead of re-exporting
export default function Page({ params }: { params: { id: string } }) {
  return <PageClient params={params} />
}
