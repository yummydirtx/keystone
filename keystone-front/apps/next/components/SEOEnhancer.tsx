'use client'

import { NextSeo, ArticleJsonLd, BreadcrumbJsonLd, OrganizationJsonLd } from 'next-seo'
import { organizationSchema, websiteSchema, softwareApplicationSchema } from '../lib/seo.config'

interface SEOEnhancerProps {
  title?: string
  description?: string
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
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
      type?: string
    }>
  }
  additionalJsonLd?: Record<string, any>[]
  breadcrumbs?: Array<{
    position: number
    name: string
    item: string
  }>
}

export function SEOEnhancer({
  title,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  openGraph,
  additionalJsonLd = [],
  breadcrumbs,
}: SEOEnhancerProps) {
  const structuredData = [
    organizationSchema,
    websiteSchema,
    softwareApplicationSchema,
    ...additionalJsonLd,
  ]

  return (
    <>
      {(title || description || canonical || noindex || nofollow || openGraph) && (
        <NextSeo
          title={title}
          description={description}
          canonical={canonical}
          noindex={noindex}
          nofollow={nofollow}
          openGraph={openGraph}
        />
      )}

      {/* Organization JSON-LD */}
      <OrganizationJsonLd
        type="Organization"
        id="https://gokeystone.org"
        name="Keystone"
        url="https://gokeystone.org"
        logo="https://gokeystone.org/logo.png"
      />

      {/* Breadcrumbs JSON-LD */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <BreadcrumbJsonLd
          itemListElements={breadcrumbs.map((crumb) => ({
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          }))}
        />
      )}

      {/* Additional structured data */}
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
