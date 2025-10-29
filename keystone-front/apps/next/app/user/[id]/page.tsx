import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'User Profile - Keystone',
  description: 'View user profile and expense history on Keystone.',
  openGraph: {
    title: 'User Profile - Keystone',
    description: 'View user profile and expense history on Keystone.',
    type: 'website',
    url: 'https://gokeystone.org/user',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'User Profile - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
