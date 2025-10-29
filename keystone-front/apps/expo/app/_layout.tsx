import { useEffect, useRef, useState } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, router } from 'expo-router'
import { Provider } from 'app/provider'
import { UniversalThemeProvider, useUniversalTheme } from '@my/ui'
import { NativeToast } from '@my/ui/src/NativeToast'
import { initializeFirebase } from '../firebase.config'
// Notifications hook
import { useNotifications } from 'app/hooks/useNotifications'
import { BackHandler, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as TrackingTransparency from 'expo-tracking-transparency'

export const unstable_settings = {
  // Ensure that reloading on `/user` keeps a back button present.
  initialRouteName: 'Home',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase()

    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync()
    }
  }, [interLoaded, interError])

  if (!interLoaded && !interError) {
    return null
  }

  return (
    <UniversalThemeProvider defaultTheme="system">
      <RootLayoutNav />
    </UniversalThemeProvider>
  )
}

function RootLayoutNav() {
  const { resolvedTheme } = useUniversalTheme()

  return (
    <Provider defaultTheme={resolvedTheme}>
      <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PermissionSequenceHandler />
        <BackPressThrottler />
        <Stack screenOptions={{ freezeOnBlur: true }} />
        <NativeToast />
      </ThemeProvider>
    </Provider>
  )
}

function PermissionSequenceHandler() {
  const [shouldInitializeNotifications, setShouldInitializeNotifications] = useState(false)

  // Handle App Tracking Transparency first
  useEffect(() => {
    const handlePermissionSequence = async () => {
      // Only request on iOS 14.5+
      if (Platform.OS !== 'ios') {
        // On non-iOS platforms, proceed directly to notifications
        setShouldInitializeNotifications(true)
        return
      }

      try {
        // First, handle App Tracking Transparency
        const isAvailable = TrackingTransparency.isAvailable()
        if (!isAvailable) {
        } else {
          // Check current permission status
          const { status } = await TrackingTransparency.getTrackingPermissionsAsync()

          if (status === TrackingTransparency.PermissionStatus.UNDETERMINED) {
            // Request permission - this will show the App Tracking Transparency dialog
            const result = await TrackingTransparency.requestTrackingPermissionsAsync()
          }
        }

        // Wait a bit after ATT dialog closes, then enable notifications
        setTimeout(() => {
          setShouldInitializeNotifications(true)
        }, 1000)
      } catch (error) {
        // Still proceed to notifications even if ATT fails
        setShouldInitializeNotifications(true)
      }
    }

    // Start the permission sequence after the app is fully loaded
    const timer = setTimeout(handlePermissionSequence, 2000)

    return () => clearTimeout(timer)
  }, [])

  return <>{shouldInitializeNotifications && <NotificationInitializer />}</>
}

function NotificationInitializer() {
  // Initialize notifications here, inside the Provider context
  const handledRef = useRef<boolean>(false)

  const navigateFromData = (data: any) => {
    if (handledRef.current) return
    if (!data || typeof data !== 'object') return

    // Prefer explicit URL from payload
    const url: string | undefined = typeof data.url === 'string' ? data.url : undefined

    // Fallback: build path from type/id
    const type: string | undefined = typeof data.type === 'string' ? data.type : undefined
    const id: string | number | undefined = data.id

    let path: string | undefined = url
    if (!path && type && (id || id === 0)) {
      const normalizedType = type.toLowerCase()
      if (normalizedType === 'expense') path = `/expense/${id}`
      else if (normalizedType === 'category') path = `/category/${id}`
      else if (normalizedType === 'user') path = `/user/${id}`
      else if (normalizedType === 'submitter') path = `/submitter/${id}`
    }

    // Additional simple named routes
    if (!path && typeof data.route === 'string') {
      const r = data.route
      if (r === 'awaiting-review') path = '/awaiting-review'
      else if (r === 'workspaces') path = '/workspaces'
      else if (r === 'shared-categories') path = '/shared-categories'
      else if (r === 'settings') path = '/settings'
      else if (r === 'home') path = '/'
    }

    if (path) {
      handledRef.current = true
      try {
        // Convert known dynamic routes to typed Href objects for Expo Router
        const expenseMatch = path.match(/^\/expense\/(.+)$/)
        if (expenseMatch) {
          router.push({ pathname: '/expense/[id]', params: { id: String(expenseMatch[1]) } })
          return
        }
        const categoryMatch = path.match(/^\/category\/(.+)$/)
        if (categoryMatch) {
          router.push({ pathname: '/category/[id]', params: { id: String(categoryMatch[1]) } })
          return
        }
        const userMatch = path.match(/^\/user\/(.+)$/)
        if (userMatch) {
          router.push({ pathname: '/user/[id]', params: { id: String(userMatch[1]) } })
          return
        }
        const submitterMatch = path.match(/^\/submitter\/(.+)$/)
        if (submitterMatch) {
          router.push({ pathname: '/submitter/[id]', params: { id: String(submitterMatch[1]) } })
          return
        }
        // Simple static routes
        router.push(path as any)
      } catch (e) {
        // no-op
      }
    }
  }

  useNotifications({
    onReceiveForeground: () => {
      // Optional: show an in-app toast, etc.
    },
    onRespond: (response) => {
      const data = response?.notification?.request?.content?.data
      navigateFromData(data)
    },
    autoRegisterToken: true,
  })

  // Handle cold start (app opened by tapping a notification while the app was killed)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync()
        if (!mounted) return
        const data = last?.notification?.request?.content?.data
        navigateFromData(data)
      } catch (_) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

function BackPressThrottler() {
  const lastPressRef = useRef<number>(0)

  useEffect(() => {
    if (Platform.OS === 'web') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const now = Date.now()
      const delta = now - (lastPressRef.current || 0)
      lastPressRef.current = now
      if (delta < 400) {
        // Swallow extremely fast consecutive back presses

        return true
      }
      return false
    })
    return () => sub.remove()
  }, [])

  return null
}
