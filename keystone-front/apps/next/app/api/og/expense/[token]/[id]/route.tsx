import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { publicApiRequest } from 'app/utils/api'

export const runtime = 'edge'

interface GuestExpenseData {
  expense: {
    id: number
    description: string
    amount: number
    status: string
    submitter: {
      id: number
      name: string
      email: string
      avatar_url: string | null
    }
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
  }
  permission_level: 'SUBMIT_ONLY' | 'REVIEW_ONLY'
}

async function getGuestExpenseData(
  token: string,
  expenseId: string
): Promise<GuestExpenseData | null> {
  try {
    const response = await publicApiRequest(
      `/api/guest/expenses/${expenseId}?token=${encodeURIComponent(token)}`
    )
    if (response.success) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('Error fetching guest expense data:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const guestData = await getGuestExpenseData(params.token, params.id)

    if (!guestData || !guestData.expense) {
      return new Response('Invalid token or expense ID', { status: 400 })
    }

    const { expense, permission_level } = guestData
    const submitter = expense.submitter

    // Use fallback avatar if submitter doesn't have one
    const avatarUrl =
      submitter?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(submitter?.name || 'User')}&background=random`

    // Get the base URL for the favicon
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: '40px',
        }}
      >
        {/* Keystone branding - centered at the top */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
          }}
        >
          <img
            src={`${baseUrl}/titleandlogo.png`}
            width="702"
            height="150"
            alt="Keystone Logo"
          />
        </div>

        {/* Profile picture */}
        <div
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #4f46e5',
            marginBottom: '5px',
            display: 'flex',
          }}
        >
          <img
            src={avatarUrl}
            width="200"
            height="200"
            style={{ objectFit: 'cover' }}
            alt="Profile"
          />
        </div>

        {/* Expense description */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ffffff',
            lineHeight: 1.2,
            maxWidth: '90%',
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          {expense.description || 'Expense'}
        </div>

        {/* Amount and status */}
        <div
          style={{
            fontSize: '48px',
            textAlign: 'center',
            color: '#ffffff',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(expense.amount || 0)}
        </div>

        <div
          style={{
            fontSize: '30px',
            textAlign: 'center',
            color:
              expense.status === 'APPROVED'
                ? '#10b981'
                : expense.status === 'DENIED'
                  ? '#ef4444'
                  : expense.status === 'PENDING_REVIEW'
                    ? '#f59e0b'
                    : '#ffffff',
            display: 'flex',
          }}
        >
          {(expense.status || 'UNKNOWN').replace('_', ' ')}
        </div>

        {/* Category name */}
        <div
          style={{
            fontSize: '32px',
            textAlign: 'center',
            color: '#ffffff',
            marginTop: '10px',
            display: 'flex',
          }}
        >
          in {expense.category?.name || 'Unknown Category'}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
