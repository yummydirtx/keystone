import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Awaiting Review - Keystone',
  description: 'Review pending expenses and manage approval workflows on Keystone.',
  openGraph: {
    title: 'Awaiting Review - Keystone',
    description: 'Review pending expenses and manage approval workflows on Keystone.',
    type: 'website',
    url: 'https://gokeystone.org/awaiting-review',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Awaiting Review - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
