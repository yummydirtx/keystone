import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Privacy Policy - Keystone',
  description: 'Read about our privacy practices and how we protect your data on Keystone.',
  openGraph: {
    title: 'Privacy Policy - Keystone',
    description: 'Read about our privacy practices and how we protect your data on Keystone.',
    type: 'website',
    url: 'https://gokeystone.org/privacy',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Privacy Policy - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
