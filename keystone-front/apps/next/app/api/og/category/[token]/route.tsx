import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getGuestData, calculatePendingAmount } from '../../utils'

export const runtime = 'edge'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const guestData = await getGuestData(params.token)

    if (!guestData) {
      return new Response('Invalid token', { status: 400 })
    }

    const { category, permission_level } = guestData
    const owner = category.report.owner

    // Calculate pending amount for REVIEW_ONLY links
    let pendingAmount = 0
    if (permission_level === 'REVIEW_ONLY' && guestData.expenses) {
      pendingAmount = calculatePendingAmount(guestData.expenses)
    }

    // Determine text based on permission level
    const displayText =
      permission_level === 'SUBMIT_ONLY'
        ? `Submit expenses to: ${category.name}`
        : `${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(pendingAmount)} pending review`

    // Use fallback avatar if user doesn't have one
    const avatarUrl =
      owner.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.name)}&background=random`

    // Get the base URL for the favicon
    const baseUrl = 'https://gokeystone.org'

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
          fontFamily: 'Inter, sans-serif',
          padding: '40px',
        }}
      >
        {/* Keystone branding - centered at the top */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
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
            marginBottom: '20px',
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

        {/* Text content */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ffffff',
            lineHeight: 1.2,
            maxWidth: '90%',
            display: 'flex',
          }}
        >
          {displayText}
        </div>

        {/* Category name for REVIEW_ONLY links */}
        {permission_level === 'REVIEW_ONLY' && (
          <div
            style={{
              fontSize: '48px',
              textAlign: 'center',
              color: '#ffffff',
              marginTop: '10px',
              maxWidth: '90%',
              display: 'flex',
            }}
          >
            in {category.name}
          </div>
        )}
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
