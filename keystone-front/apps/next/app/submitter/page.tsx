import type { Metadata } from 'next'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Submit Expense - Keystone',
  description:
    'Submit a new expense report or reimbursement request on Keystone. Track receipts, categorize expenses, and streamline your reimbursement process.',
  keywords: [
    'expense submission',
    'reimbursement',
    'receipt tracking',
    'expense report',
    'business expenses',
  ],
  openGraph: {
    title: 'Submit Expense - Keystone',
    description:
      'Submit a new expense report or reimbursement request on Keystone. Track receipts, categorize expenses, and streamline your reimbursement process.',
    type: 'website',
    url: 'https://gokeystone.org/submitter',
    images: [
      {
        url: 'https://gokeystone.org/og-submitter.png',
        width: 1200,
        height: 630,
        alt: 'Submit Expense - Keystone',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit Expense - Keystone',
    description: 'Submit a new expense report or reimbursement request on Keystone.',
    images: ['https://gokeystone.org/og-submitter.png'],
  },
  alternates: {
    canonical: 'https://gokeystone.org/submitter',
  },
}

export default function SubmitterPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://gokeystone.org',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Submit Expense',
        item: 'https://gokeystone.org/submitter',
      },
    ],
  }

  const actionSchema = {
    '@context': 'https://schema.org',
    '@type': 'Action',
    name: 'Submit Expense',
    description: 'Submit a new expense report or reimbursement request',
    url: 'https://gokeystone.org/submitter',
    object: {
      '@type': 'CreativeWork',
      name: 'Expense Report',
      description: 'Digital expense report for reimbursement processing',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(actionSchema) }}
      />
      <PageClient />
    </>
  )
}
