import { useColorScheme } from 'react-native'
import {
  CustomToast,
  TamaguiProvider,
  type TamaguiProviderProps,
  ToastProvider,
  config,
  isWeb,
} from '@my/ui'
import { ToastViewport } from './ToastViewport'
import { AuthProvider } from './AuthProvider'
import { QueryProvider } from './QueryProvider'

export function Provider({
  children,
  defaultTheme,
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { defaultTheme?: string }) {
  const colorScheme = useColorScheme()
  const theme = defaultTheme || colorScheme || 'light'

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={theme}
      disableInjectCSS
      {...rest}
    >
      <ToastProvider
        swipeDirection="horizontal"
        duration={6000}
        native={isWeb ? [] : ['mobile']}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <CustomToast />
            <ToastViewport />
          </AuthProvider>
        </QueryProvider>
      </ToastProvider>
    </TamaguiProvider>
  )
}
