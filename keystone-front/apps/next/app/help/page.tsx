import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Help & Information - Keystone',
  description: 'About the Keystone app and its creator, Alex Frutkin.',
  openGraph: {
    title: 'Help & Information - Keystone',
    description: 'About the Keystone app and its creator, Alex Frutkin.',
    type: 'website',
    url: 'https://gokeystone.org/help',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Help & Information - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
