import type { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'Settings - Keystone',
  description: 'Manage your account settings, preferences, and profile information on Keystone.',
  openGraph: {
    title: 'Settings - Keystone',
    description: 'Manage your account settings, preferences, and profile information on Keystone.',
    type: 'website',
    url: 'https://gokeystone.org/settings',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Settings - Keystone',
      },
    ],
  },
}

export default function SettingsPage() {
  return <SettingsClient />
}
