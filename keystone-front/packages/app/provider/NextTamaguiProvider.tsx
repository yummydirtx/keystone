'use client'

import '@tamagui/core/reset.css'
import '@tamagui/font-inter/css/400.css'
import '@tamagui/font-inter/css/700.css'
import '@tamagui/polyfill-dev'

import type { ReactNode } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { config, UniversalThemeProvider, useUniversalTheme } from '@my/ui'
import { Provider } from 'app/provider'
import { StyleSheet } from 'react-native'

function NextTamaguiProviderInner({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useUniversalTheme()

  useServerInsertedHTML(() => {
    // @ts-ignore
    const rnwStyle = StyleSheet.getSheet()
    return (
      <>
        <link
          rel="stylesheet"
          href="/tamagui.css"
        />
        <style
          dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }}
          id={rnwStyle.id}
        />
        <style
          dangerouslySetInnerHTML={{
            // the first time this runs you'll get the full CSS including all themes
            // after that, it will only return CSS generated since the last call
            __html: config.getNewCSS(),
          }}
        />

        <style
          dangerouslySetInnerHTML={{
            __html: config.getCSS({
              exclude: process.env.NODE_ENV === 'production' ? 'design-system' : null,
            }),
          }}
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: var(--background) !important;
                transition: none !important;
                height: 100%;
                margin: 0;
                padding: 0;
              }
              html {
                height: 100%;
              }
              body {
                min-height: 100vh;
                height: 100%;
              }
              .t_unmounted * {
                transition: none !important;
                animation: none !important;
              }
              /* Prevent background color changes during hydration */
              body, #__next, [data-reactroot] {
                background-color: var(--background) !important;
                min-height: 100vh;
                height: 100%;
              }
              /* Ensure all React root containers fill the viewport */
              #__next {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                background-color: var(--background) !important;
              }
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            // avoid flash of animated things on enter and ensure proper theme loading:
            __html: `
              document.documentElement.classList.add('t_unmounted');
              // Ensure body background is consistent
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                  document.documentElement.classList.remove('t_unmounted');
                }, 50);
              });
            `,
          }}
        />
      </>
    )
  })

  return <Provider defaultTheme={resolvedTheme}>{children}</Provider>
}

export const NextTamaguiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UniversalThemeProvider defaultTheme="system">
      <NextTamaguiProviderInner>{children}</NextTamaguiProviderInner>
    </UniversalThemeProvider>
  )
}
