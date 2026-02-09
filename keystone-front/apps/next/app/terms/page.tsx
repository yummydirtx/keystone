import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Terms and Conditions - Keystone',
  description: 'Read the terms and conditions for using the Keystone expense tracking application.',
  openGraph: {
    title: 'Terms and Conditions - Keystone',
    description: 'Read the terms and conditions for using the Keystone expense tracking application.',
    type: 'website',
    url: 'https://gokeystone.org/terms',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Terms and Conditions - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
