import type { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    type?: string
    url?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
  twitter?: {
    card?: string
    title?: string
    description?: string
    images?: string[]
  }
  noindex?: boolean
  nofollow?: boolean
}

const baseUrl = 'https://gokeystone.org'

export function generateSEOMetadata(config: SEOConfig): Metadata {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    openGraph: {
      title: config.openGraph?.title || config.title,
      description: config.openGraph?.description || config.description,
      type: (config.openGraph?.type as 'website') || 'website',
      url: config.openGraph?.url || config.canonical,
      siteName: 'Keystone',
      locale: 'en_US',
      images: config.openGraph?.images || [
        {
          url: `${baseUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: (config.twitter?.card as 'summary_large_image') || 'summary_large_image',
      title: config.twitter?.title || config.title,
      description: config.twitter?.description || config.description,
      images: config.twitter?.images || [`${baseUrl}/og.png`],
    },
    alternates: {
      canonical: config.canonical,
    },
    robots: {
      index: !config.noindex,
      follow: !config.nofollow,
      googleBot: {
        index: !config.noindex,
        follow: !config.nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// Pre-configured SEO for common pages
export const seoConfigs = {
  home: {
    title: 'Keystone: Shared Budgets and Reimbursements',
    description:
      "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    keywords: [
      'expense management',
      'budget tracking',
      'reimbursements',
      'team expenses',
      'receipt management',
    ],
    canonical: baseUrl,
  },
  submitter: {
    title: 'Submit Expense - Keystone',
    description:
      'Submit a new expense report or reimbursement request on Keystone. Track receipts, categorize expenses, and streamline your reimbursement process.',
    keywords: ['expense submission', 'reimbursement', 'receipt tracking', 'expense report'],
    canonical: `${baseUrl}/submitter`,
    openGraph: {
      images: [
        {
          url: `${baseUrl}/og-submitter.png`,
          width: 1200,
          height: 630,
          alt: 'Submit Expense - Keystone',
        },
      ],
    },
  },
  dashboard: {
    title: 'Dashboard - Keystone',
    description:
      'View and manage your expenses, budgets, and reimbursements in your Keystone dashboard. Track spending, approve requests, and generate reports.',
    keywords: ['expense dashboard', 'budget management', 'spending analytics', 'expense tracking'],
    canonical: `${baseUrl}/dashboard`,
  },
  workspaces: {
    title: 'Workspaces - Keystone',
    description:
      'Manage your team workspaces and collaborate on shared budgets and expense tracking. Create teams, set permissions, and streamline workflows.',
    keywords: ['team workspaces', 'collaboration', 'shared budgets', 'team expenses'],
    canonical: `${baseUrl}/workspaces`,
  },
}

// Generate structured data for specific content types
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

export function generateProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Keystone',
    applicationCategory: 'BusinessApplication',
    operatingSystem: ['Web', 'iOS', 'Android'],
    url: baseUrl,
    description:
      "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    downloadUrl: [
      'https://apps.apple.com/app/keystone/id[YOUR_APP_ID]',
      'https://play.google.com/store/apps/details?id=com.keystone.app',
    ],
    installUrl: [
      'https://apps.apple.com/app/keystone/id[YOUR_APP_ID]',
      'https://play.google.com/store/apps/details?id=com.keystone.app',
    ],
    featureList: [
      'Expense tracking',
      'Budget management',
      'Reimbursement processing',
      'Team collaboration',
      'Receipt management',
      'Approval workflows',
      'Reporting and analytics',
    ],
    screenshot: `${baseUrl}/screenshot.png`,
    author: {
      '@type': 'Organization',
      name: 'Keystone',
      url: baseUrl,
    },
  }
}
