// packages/app/features/submitter/useSubmitterCategory.ts
import { useState, useEffect } from 'react'
import { getCategory, validateGuestToken, getGuestData } from '../../utils/api'
import type { Category } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { useSearchParams, useRouter } from 'solito/navigation'

export function useSubmitterCategory(id: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile, loading: authLoading, setGuestSession, isGuest, guestSession } = useAuth()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const guestToken = searchParams?.get('guestToken')

    const authenticateGuest = async (token: string) => {
      try {
        const response = await validateGuestToken(token)
        let permissionLevel = null

        if (response.data) {
          const guestSessionData = {
            token: token,
            permissions: response.data.permission_level,
            categoryId: response.data.category_id,
          }
          setGuestSession(guestSessionData)
          permissionLevel = response.data.permission_level
        } else {
          // Check if the data is directly in the response
          if (response.permission_level && response.category_id) {
            const guestSessionData = {
              token: token,
              permissions: response.permission_level,
              categoryId: response.category_id,
            }
            setGuestSession(guestSessionData)
            permissionLevel = response.permission_level
          }
        }

        // Redirect REVIEW_ONLY users to the category detail page
        if (permissionLevel === 'REVIEW_ONLY') {
          router.push(`/category/${id}?guestToken=${token}`)
        }
      } catch (error) {
        console.error('Guest token validation failed', error)
      }
    }

    if (guestToken) {
      authenticateGuest(guestToken)
    }
  }, [id, searchParams, setGuestSession, router])

  useEffect(() => {
    const fetchCategory = async () => {
      if (!userProfile && !isGuest) return

      try {
        setLoading(true)

        // Handle guest users
        if (isGuest && guestSession) {
          const guestResponse = await getGuestData(guestSession.token)

          if (!(guestResponse as any).data?.category) {
            throw new Error('Category not found')
          }

          const originalCategory = (guestResponse as any).data.category

          // Check if the requested ID matches the original category
          if (id === originalCategory.id.toString()) {
            // The API already returns children property correctly
            setCategory(originalCategory)
          } else {
            // Check if the requested ID is a subcategory of the original category
            const subcategory = originalCategory.children?.find(
              (child: any) => child.id.toString() === id
            )

            if (subcategory) {
              // Create a full category object for the subcategory
              const subcategoryData = {
                ...subcategory,
                parentCategory: {
                  id: originalCategory.id,
                  name: originalCategory.name,
                },
                children: [], // Subcategories of subcategories would need additional handling
                report: originalCategory.report,
              }
              setCategory(subcategoryData)
            } else {
              throw new Error('Category not found or access denied')
            }
          }

          setError(null)
          return
        }

        // Handle regular authenticated users
        if (!id) return
        const response = await getCategory(id)
        setCategory(response.category)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch category:', err)
        setError("Couldn't load category. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [id, userProfile, isGuest, guestSession])

  return { category, loading, error }
}
