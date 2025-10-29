'use client'

import { NextSeo } from 'next-seo'
import { useEffect } from 'react'

interface DynamicSEOProps {
  title?: string
  description?: string
  canonical?: string
  noindex?: boolean
  openGraph?: {
    title?: string
    description?: string
    url?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
  additionalJsonLd?: Record<string, any>[]
}

export function useDynamicSEO(props: DynamicSEOProps) {
  useEffect(() => {
    // Update page title dynamically if needed
    if (props.title && typeof document !== 'undefined') {
      document.title = props.title
    }
  }, [props.title])

  return null
}

export function DynamicSEO(props: DynamicSEOProps) {
  return (
    <>
      <NextSeo {...props} />
      {props.additionalJsonLd?.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
