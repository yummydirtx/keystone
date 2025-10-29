import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { getStoredTheme, setStoredTheme, type ThemeMode } from './storage/themeStorage'

interface ThemeContextType {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeMode
}

export function UniversalThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await getStoredTheme()
      if (storedTheme) {
        setThemeState(storedTheme)
      }
      setIsHydrated(true)
    }
    loadTheme()
  }, [])

  // Persist theme changes
  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    await setStoredTheme(newTheme)
  }

  // Calculate the resolved theme
  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme

  const toggle = () => {
    const themeOrder: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggle,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useUniversalTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useUniversalTheme must be used within a UniversalThemeProvider')
  }
  return context
}

// Compatibility hooks for existing @tamagui/next-theme usage
export function useThemeSetting() {
  const { theme, setTheme, toggle } = useUniversalTheme()
  return {
    current: theme,
    toggle,
    set: setTheme,
    forcedTheme: undefined,
    resolvedTheme: undefined,
  }
}

export function useRootTheme(): [string, (theme: string) => void] {
  const { resolvedTheme, setTheme } = useUniversalTheme()
  return [resolvedTheme, (newTheme: string) => setTheme(newTheme as ThemeMode)]
}
