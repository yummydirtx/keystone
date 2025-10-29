import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Workspaces - Keystone',
  description:
    'View and manage your workspaces on Keystone. Organize your teams and expense categories efficiently.',
  openGraph: {
    title: 'Workspaces - Keystone',
    description:
      'View and manage your workspaces on Keystone. Organize your teams and expense categories efficiently.',
    type: 'website',
    url: 'https://gokeystone.org/workspaces',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Workspaces - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
