import type { Metadata } from 'next'
import { LandingClient } from './landing-client'

export const metadata: Metadata = {
  title: 'Keystone: Shared Budgets and Reimbursements',
  description:
    "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
  keywords: [
    'expense management',
    'budget tracking',
    'reimbursements',
    'team expenses',
    'receipt management',
    'business expenses',
  ],
  openGraph: {
    title: 'Keystone: Shared Budgets and Reimbursements',
    description:
      "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    type: 'website',
    url: 'https://gokeystone.org',
    siteName: 'Keystone',
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Keystone: Shared Budgets and Reimbursements',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keystone: Shared Budgets and Reimbursements',
    description:
      "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    images: ['https://gokeystone.org/og.png'],
  },
  alternates: {
    canonical: 'https://gokeystone.org',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Keystone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Keystone is a comprehensive expense management platform that helps teams streamline their expense tracking, budget management, and reimbursement processes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I submit an expense?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can submit expenses through our intuitive interface by uploading receipts, categorizing expenses, and providing necessary details for reimbursement processing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Keystone free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Keystone offers flexible pricing options to accommodate teams of all sizes. Contact us for detailed pricing information.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingClient />
    </>
  )
}
