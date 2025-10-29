import type React from 'react'
import { ScrollView } from '@my/ui'

interface RefreshableScrollViewProps {
  children: React.ReactNode
  refreshing: boolean
  onRefresh: () => void
  flex?: number
  [key: string]: any // Allow other props to be passed through
}

export function RefreshableScrollView({
  children,
  refreshing,
  onRefresh,
  ...props
}: RefreshableScrollViewProps) {
  // On web, we don't have native pull-to-refresh, so just render a regular ScrollView
  // The refresh functionality will still be available via the refresh button
  return <ScrollView {...props}>{children}</ScrollView>
}
