import type { Metadata } from 'next'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard - Keystone',
  openGraph: {
    title: 'Dashboard - Keystone',
    description: 'Your personal dashboard for managing expenses, categories, and notifications.',
    type: 'website',
    url: 'https://gokeystone.org/dashboard',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Dashboard - Keystone',
      },
    ],
  },
}

export default function DashboardPage() {
  return <DashboardClient />
}
