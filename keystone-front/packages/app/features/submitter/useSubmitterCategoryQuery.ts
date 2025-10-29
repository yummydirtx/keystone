// packages/app/features/submitter/useSubmitterCategoryQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCategory, validateGuestToken, getGuestData } from '../../utils/api'
import type { Category } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { useSearchParams, useRouter } from 'solito/navigation'
import { queryKeys } from '../../utils/queries.optimized'

export function useSubmitterCategoryQuery(id: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile, loading: authLoading, setGuestSession, isGuest, guestSession } = useAuth()
  const queryClient = useQueryClient()

  // Handle guest token authentication
  const guestToken = searchParams?.get('guestToken')

  // Authenticate guest user if token is present
  const {
    data: guestAuthData,
    isLoading: guestAuthLoading,
    error: guestAuthError,
  } = useQuery({
    queryKey: [...queryKeys.guest(), 'auth', guestToken],
    queryFn: async ({ signal }) => {
      if (!guestToken) return null

      try {
        const response = await validateGuestToken(guestToken, signal)
        let permissionLevel = null
        let categoryId = null

        if (response.data) {
          permissionLevel = response.data.permission_level
          categoryId = response.data.category_id
        } else if (response.permission_level && response.category_id) {
          permissionLevel = response.permission_level
          categoryId = response.category_id
        }

        if (permissionLevel && categoryId) {
          const guestSessionData = {
            token: guestToken,
            permissions: permissionLevel,
            categoryId: categoryId,
          }
          setGuestSession(guestSessionData)

          // Redirect REVIEW_ONLY users to the category detail page
          if (permissionLevel === 'REVIEW_ONLY') {
            router.push(`/category/${id}?guestToken=${guestToken}`)
          }

          return { permissionLevel, categoryId }
        }

        return null
      } catch (error) {
        console.error('Guest token validation failed', error)
        throw error
      }
    },
    enabled: !!guestToken,
    retry: false,
  })

  // Fetch category data for authenticated users
  const {
    data: authCategoryData,
    isLoading: authCategoryLoading,
    error: authCategoryError,
  } = useQuery({
    queryKey: queryKeys.category(id),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('Category ID is required')
      const response = await getCategory(id, signal)
      return response.category
    },
    enabled: !!userProfile && !isGuest && !!id && !authLoading,
    retry: false,
  })

  // Fetch category data for guest users
  const {
    data: guestCategoryData,
    isLoading: guestCategoryLoading,
    error: guestCategoryError,
  } = useQuery({
    queryKey: [...queryKeys.guest(), 'category', guestSession?.token, id],
    queryFn: async ({ signal }) => {
      if (!guestSession?.token) throw new Error('Guest token is required')

      const guestResponse = await getGuestData(guestSession.token, signal)

      if (!(guestResponse as any).data?.category) {
        throw new Error('Category not found')
      }

      const originalCategory = (guestResponse as any).data.category

      // Check if the requested ID matches the original category
      if (id === originalCategory.id.toString()) {
        return originalCategory
      }

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
        return subcategoryData
      }

      throw new Error('Category not found or access denied')
    },
    enabled: isGuest && !!guestSession?.token && !!id,
    retry: false,
  })

  // Determine which data to use based on user type
  let category: Category | null = null
  let loading = true
  let error: string | null = null

  if (guestToken && guestAuthLoading) {
    loading = true
  } else if (isGuest && guestCategoryLoading) {
    loading = true
  } else if (!isGuest && authCategoryLoading) {
    loading = true
  } else if (authLoading) {
    loading = true
  } else {
    loading = false

    // Handle errors
    if (guestAuthError) {
      error = 'Failed to authenticate guest user'
    } else if (guestCategoryError) {
      error = 'Failed to load category data'
    } else if (authCategoryError) {
      error = 'Failed to load category data'
    }

    // Set category data
    if (isGuest && guestCategoryData) {
      category = guestCategoryData
    } else if (!isGuest && authCategoryData) {
      category = authCategoryData
    }
  }

  // Function to refetch category data
  const refetch = async () => {
    if (isGuest) {
      await queryClient.refetchQueries(
        { queryKey: [...queryKeys.guest(), 'category', guestSession?.token, id], type: 'active' },
        { cancelRefetch: false }
      )
    } else {
      await queryClient.refetchQueries(
        { queryKey: queryKeys.category(id), type: 'active' },
        { cancelRefetch: false }
      )
    }
  }

  return { category, loading, error, refetch }
}
