import React from 'react'
import { StyleSheet } from 'react-native'
import { ExpoLiquidGlassView, LiquidGlassType, CornerStyle } from 'expo-liquid-glass-view'
import { useUniversalTheme } from '@my/ui'

/**
 * A header background component that provides theme-aware glass effect.
 * Automatically adjusts the glass tint based on the current app theme.
 */
export function ThemeAwareBlurHeader() {
  const { resolvedTheme } = useUniversalTheme()

  return (
    <ExpoLiquidGlassView
      type={LiquidGlassType.Tint}
      tint={resolvedTheme === 'dark' ? '#000000' : '#ffffff'}
      cornerRadius={0}
      cornerStyle={CornerStyle.Continuous}
      style={StyleSheet.absoluteFill}
    />
  )
}
