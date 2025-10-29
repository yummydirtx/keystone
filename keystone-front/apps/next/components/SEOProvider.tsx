'use client'

import { DefaultSeo } from 'next-seo'
import defaultSEO from '../lib/seo.config'

export function SEOProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DefaultSeo {...defaultSEO} />
      {children}
    </>
  )
}
