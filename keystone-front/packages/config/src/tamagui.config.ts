import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'
import { bodyFont, headingFont } from './fonts'
import { animations } from './animations'

// Create custom themes with adjusted yellow colors for light theme and pure white background
const customThemes = {
  ...defaultConfig.themes,
  light: {
    ...defaultConfig.themes.light,
    // Set background to pure white for light mode
    background: '#ffffff',
    backgroundHover: '#f9f9f9',
    backgroundPress: '#f0f0f0',
    backgroundFocus: '#f9f9f9',
    backgroundStrong: '#ffffff',
    backgroundTransparent: 'rgba(255,255,255,0)',
    // Adjust yellow colors to be more visible in light mode
    yellow1: 'hsl(60, 54.0%, 98.5%)', // Keep the same
    yellow2: 'hsl(52, 100%, 95.5%)', // Keep the same
    yellow3: 'hsl(55, 100%, 90.9%)', // Keep the same
    yellow4: 'hsl(50, 90%, 70%)', // Modified - darker and more saturated
    yellow5: 'hsl(50, 90%, 65%)', // Modified - darker and more saturated
    yellow6: 'hsl(50, 90%, 60%)', // Modified - darker and more saturated
    yellow7: 'hsl(47, 80.4%, 68.0%)', // Keep the same
    yellow8: 'hsl(48, 100%, 46.1%)', // Keep the same
    yellow9: 'hsl(53, 92.0%, 50.0%)', // Keep the same
    yellow10: 'hsl(50, 100%, 40%)', // Modified - darker for better visibility
    yellow11: 'hsl(42, 100%, 25%)', // Modified - darker for better visibility
    yellow12: 'hsl(40, 55.0%, 13.5%)', // Keep the same
  },
}

export const config = createTamagui({
  ...defaultConfig,
  themes: customThemes,
  animations,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
})
