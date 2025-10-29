import type React from 'react'
import { ScrollView, useUniversalTheme, useTheme } from '@my/ui'
import { RefreshControl } from 'react-native'

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
  const { resolvedTheme } = useUniversalTheme()
  const theme = useTheme()
  
  // Use very high contrast colors that should be clearly visible
  const isDark = resolvedTheme === 'dark'
  
  const spinnerColor = isDark ? '#ffffff' : '#000000'
  const progressColor = isDark ? '#000000' : '#ffffff' 
  
  const accentColor = isDark ? '#ffffff' : '#000000'
  
  console.log('RefreshControl debug:', {
    resolvedTheme,
    isDark,
    spinnerColor,
    progressColor,
    accentColor,
    refreshing,
    platform: 'native'
  })

  return (
    <ScrollView
      {...props}
      // Ensure the ScrollView can properly show the refresh control
      contentInsetAdjustmentBehavior="automatic" // Let iOS handle the insets properly
      // Make sure we can scroll to reveal the refresh control
      bounces={true}
      alwaysBounceVertical={true}
      style={[
        props.style,
        {
          backgroundColor: 'transparent',
        }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[accentColor, spinnerColor]} // Use bright test colors first
          tintColor={accentColor} // Use bright color for iOS
          progressBackgroundColor={progressColor}
          // Add progressViewOffset to push refresh control below the transparent header
          progressViewOffset={100} // Push it down below the header area
          // Add title for iOS to make it more visible
        />
      }
    >
      {children}
    </ScrollView>
  )
}
