import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Expenses - Keystone',
  description:
    'View and manage your expenses on Keystone. Track spending, receipts, and reimbursements efficiently.',
  openGraph: {
    title: 'Expenses - Keystone',
    description:
      'View and manage your expenses on Keystone. Track spending, receipts, and reimbursements efficiently.',
    type: 'website',
    url: 'https://gokeystone.org/expense',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Expenses - Keystone',
      },
    ],
  },
}

export default function Page() {
  return <PageClient />
}
