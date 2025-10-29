import type { DefaultSeoProps } from 'next-seo'

const defaultSEO: DefaultSeoProps = {
  title: 'Keystone: Shared Budgets and Reimbursements',
  description:
    "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
  canonical: 'https://gokeystone.org',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gokeystone.org',
    siteName: 'Keystone',
    title: 'Keystone: Shared Budgets and Reimbursements',
    description:
      "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    images: [
      {
        url: 'https://gokeystone.org/og.png',
        width: 1200,
        height: 630,
        alt: 'Keystone: Shared Budgets and Reimbursements',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    handle: '@keystoneapp',
    site: '@keystoneapp',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'application-name',
      content: 'Keystone',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'Keystone',
    },
    {
      name: 'format-detection',
      content: 'telephone=no',
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'theme-color',
      content: '#000000',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
}

export default defaultSEO

// SEO configurations for specific pages
export const pageSEOConfigs = {
  submitter: {
    title: 'Submit Expense - Keystone',
    description:
      'Submit a new expense report or reimbursement request on Keystone. Track receipts, categorize expenses, and streamline your reimbursement process.',
    canonical: 'https://gokeystone.org/submitter',
    openGraph: {
      title: 'Submit Expense - Keystone',
      description:
        'Submit a new expense report or reimbursement request on Keystone. Track receipts, categorize expenses, and streamline your reimbursement process.',
      url: 'https://gokeystone.org/submitter',
      images: [
        {
          url: 'https://gokeystone.org/og-submitter.png',
          width: 1200,
          height: 630,
          alt: 'Submit Expense - Keystone',
          type: 'image/png',
        },
      ],
    },
  },
  dashboard: {
    title: 'Dashboard - Keystone',
    description:
      'View and manage your expenses, budgets, and reimbursements in your Keystone dashboard.',
    canonical: 'https://gokeystone.org/dashboard',
    openGraph: {
      title: 'Dashboard - Keystone',
      description:
        'View and manage your expenses, budgets, and reimbursements in your Keystone dashboard.',
      url: 'https://gokeystone.org/dashboard',
    },
  },
  workspaces: {
    title: 'Workspaces - Keystone',
    description:
      'Manage your team workspaces and collaborate on shared budgets and expense tracking.',
    canonical: 'https://gokeystone.org/workspaces',
    openGraph: {
      title: 'Workspaces - Keystone',
      description:
        'Manage your team workspaces and collaborate on shared budgets and expense tracking.',
      url: 'https://gokeystone.org/workspaces',
    },
  },
}

// Structured data schemas
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Keystone',
  url: 'https://gokeystone.org',
  logo: 'https://gokeystone.org/logo.png',
  description:
    "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
  sameAs: [
    // Add social media URLs when available
  ],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Keystone',
  url: 'https://gokeystone.org',
  description:
    "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
}

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Keystone',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://gokeystone.org',
  description:
    "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Expense tracking',
    'Budget management',
    'Reimbursement processing',
    'Team collaboration',
    'Receipt management',
  ],
}
