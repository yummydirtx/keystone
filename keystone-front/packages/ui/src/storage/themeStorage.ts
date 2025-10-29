// Native theme storage using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'app-theme'

export const getStoredTheme = async (): Promise<ThemeMode | null> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY)
    return stored && ['light', 'dark', 'system'].includes(stored) ? (stored as ThemeMode) : null
  } catch {
    return null
  }
}

export const setStoredTheme = async (theme: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}
