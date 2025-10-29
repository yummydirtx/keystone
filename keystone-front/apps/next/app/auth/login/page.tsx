import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Login - Keystone',
  description: 'Sign in to your Keystone account to manage expenses and budgets.',
  openGraph: {
    title: 'Login - Keystone',
    description: 'Sign in to your Keystone account to manage expenses and budgets.',
    type: 'website',
    url: 'https://gokeystone.org/auth/login',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Login - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
