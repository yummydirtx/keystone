import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Shared With You - Keystone',
  description:
    'Manage shared expense categories and permissions across your organization on Keystone.',
  openGraph: {
    title: 'Shared With You - Keystone',
    description:
      'Manage shared expense categories and permissions across your organization on Keystone.',
    type: 'website',
    url: 'https://gokeystone.org/shared-categories',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Shared With You - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
