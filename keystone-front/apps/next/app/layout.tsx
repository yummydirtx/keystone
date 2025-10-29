// apps/next/app/layout.tsx

import type { Metadata } from 'next'
import { NextTamaguiProvider } from 'app/provider/NextTamaguiProvider'

export const metadata: Metadata = {
  title: 'Keystone: Shared Budgets and Reimbursements',
  description: 'Keystone, now using Tamagui, Solito, Expo & Next.js',
  icons: '/favicon.ico',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Keystone',
      url: 'https://gokeystone.org/',
      logo: 'https://gokeystone.org/favicon.ico',
      description:
        "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Keystone',
      url: 'https://gokeystone.org/',
      description:
        "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Keystone',
      applicationCategory: 'BusinessApplication',
      operatingSystem: ['Web', 'iOS'],
      url: 'https://gokeystone.org/',
      description:
        "Streamline your team's expenses with Keystone. Manage shared budgets, track reimbursements, and simplify expense reporting for your organization.",
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      downloadUrl: ['https://apps.apple.com/us/app/keystone-shared-budgets/id6747334458'],
      installUrl: ['https://apps.apple.com/us/app/keystone-shared-budgets/id6747334458'],
      featureList: [
        'Expense tracking',
        'Budget management',
        'Reimbursement processing',
        'Team collaboration',
        'Receipt management',
      ],
      screenshot: [
        'https://gokeystone.org/screenshots/mobile-1.png',
        'https://gokeystone.org/screenshots/mobile-2.png',
        'https://gokeystone.org/screenshots/mobile-3.png',
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        reviewCount: '5',
        bestRating: '5',
        worstRating: '5',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Keystone',
      operatingSystem: 'iOS',
      applicationCategory: 'BusinessApplication',
      url: 'https://apps.apple.com/us/app/keystone-shared-budgets/id6747334458',
      downloadUrl: 'https://apps.apple.com/us/app/keystone-shared-budgets/id6747334458',
      description:
        "Streamline your team's expenses with Keystone mobile app. Manage shared budgets, track reimbursements, and simplify expense reporting on the go.",
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        reviewCount: '5',
        bestRating: '5',
        worstRating: '5',
      },
      screenshot: [
        'https://gokeystone.org/screenshots/mobile-1.png',
        'https://gokeystone.org/screenshots/mobile-2.png',
        'https://gokeystone.org/screenshots/mobile-3.png',
      ],
    },
  ]

  return (
    // Add className="t_dark" to the html tag
    <html
      lang="en"
      className="t_dark"
      suppressHydrationWarning
      style={{ height: '100%' }}
    >
      <head>
        {/* Enhanced structured data */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        {/* Additional meta tags for rich results */}
        <meta
          name="application-name"
          content="Keystone"
        />
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Keystone"
        />
        <meta
          name="format-detection"
          content="telephone=no"
        />
        <meta
          name="mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="theme-color"
          content="#000000"
        />

        {/* App Store Integration - Native iOS Smart App Banner */}
        <meta
          name="apple-itunes-app"
          content="app-id=6747334458, app-argument=https://gokeystone.org/"
        />

        {/* Deep Linking */}
        <meta
          name="al:ios:app_store_id"
          content="6747334458"
        />
        <meta
          name="al:ios:app_name"
          content="Keystone"
        />
        <meta
          name="al:ios:url"
          content="keystone:///"
        />
        <meta
          name="al:web:url"
          content="https://gokeystone.org/"
        />

        {/* Twitter App Cards */}
        <meta
          name="twitter:app:name:iphone"
          content="Keystone"
        />
        <meta
          name="twitter:app:id:iphone"
          content="6747334458"
        />
        <meta
          name="twitter:app:url:iphone"
          content="keystone:///"
        />

        {/* Additional link tags */}
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link
          rel="manifest"
          href="/manifest.json"
        />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh', height: '100%' }}>
        <div
          id="__next"
          style={{ minHeight: '100vh', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <NextTamaguiProvider>{children}</NextTamaguiProvider>
        </div>
      </body>
    </html>
  )
}
