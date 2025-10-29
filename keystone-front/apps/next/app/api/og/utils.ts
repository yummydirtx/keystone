import { publicApiRequest } from 'app/utils/api'

export interface GuestData {
  category: {
    id: number
    name: string
    report: {
      id: number
      name: string
      owner: {
        id: number
        name: string
        email: string
        avatar_url: string | null
      }
    }
  }
  permission_level: 'SUBMIT_ONLY' | 'REVIEW_ONLY'
  expenses?: Array<{
    id: number
    amount: number
    status: string
  }>
}

export async function getGuestData(token: string): Promise<GuestData | null> {
  try {
    const response = await publicApiRequest(`/api/guest?token=${encodeURIComponent(token)}`)
    if (response.success) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('Error fetching guest data:', error)
    return null
  }
}

export function calculatePendingAmount(expenses: GuestData['expenses']): number {
  if (!expenses) return 0

  return expenses
    .filter((expense) => expense.status === 'PENDING_REVIEW')
    .reduce((sum, expense) => sum + expense.amount, 0)
}
