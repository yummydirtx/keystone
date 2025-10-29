import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { useAuth } from '../provider/AuthProvider'
import { registerPushToken } from '../utils/registerPushToken'

/**
 * Configure how notifications are handled when the app is foregrounded.
 * This should be set once in app startup.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined'

export interface UseNotificationsOptions {
  /**
   * Called when a notification is received while the app is in the foreground.
   */
  onReceiveForeground?: (notification: Notifications.Notification) => void
  /**
   * Called when the user taps a notification (from background/quit).
   * Useful for deep linking.
   */
  onRespond?: (response: Notifications.NotificationResponse) => void
  /**
   * Whether to automatically register the device push token to backend when available.
   * Defaults to true.
   */
  autoRegisterToken?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user, loading: authLoading, isGuest, authInstance } = useAuth() as any
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined')
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<Notifications.Subscription | null>(null)
  const responseListener = useRef<Notifications.Subscription | null>(null)

  const { onReceiveForeground, onRespond, autoRegisterToken = true } = options

  useEffect(() => {
    // iOS requires explicit permission; Android 13+ also has POST_NOTIFICATIONS permission
    const requestPermissionsAndGetToken = async () => {
      try {
        // Physical device check - use Platform.OS check instead of Constants.isDevice
        // Constants.isDevice can be unreliable on some development builds
        const isPhysicalDevice =
          Platform.OS !== 'web' && !Constants.isDevice
            ? Platform.OS === 'ios' || Platform.OS === 'android'
            : Constants.isDevice

        if (!isPhysicalDevice && Platform.OS === 'web') {
          console.warn('[notif] Web platform; skipping permissions')
          setPermissionStatus('denied')
          return
        }

        // Ensure iOS presentation options are set (required for foreground on iOS)
        await Notifications.setNotificationCategoryAsync?.('default', [])
        await Notifications.setNotificationChannelAsync?.('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        }).catch(() => {})

        // Ask for permissions
        const current = await Notifications.getPermissionsAsync()
        let finalStatus = current.status

        if (finalStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          })
          finalStatus = requested.status
        }

        setPermissionStatus(
          finalStatus === 'granted'
            ? 'granted'
            : finalStatus === 'denied'
              ? 'denied'
              : 'undetermined'
        )

        if (finalStatus !== 'granted') {
          return
        }

        // Android channel (optional but recommended)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
          }).catch(() => {})
        }

        // Get Expo push token
        const tokenResponse = await Notifications.getExpoPushTokenAsync()
        const token = tokenResponse.data
        setExpoPushToken(token)
      } catch (err) {
        console.error('[notif] Failed to setup notifications:', err)
      }
    }

    requestPermissionsAndGetToken()
  }, [])

  // Register listeners
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      try {
        onReceiveForeground?.(notification)
      } catch (e) {
        console.error('onReceiveForeground error:', e)
      }
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        onRespond?.(response)
      } catch (e) {
        console.error('onRespond error:', e)
      }
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReceiveForeground, onRespond])

  // Auto-register token with backend when we have a logged-in user and a token
  useEffect(() => {
    const register = async () => {
      if (!autoRegisterToken) return
      if (!expoPushToken) return
      if (authLoading) return
      if (!user || isGuest) return

      try {
        const idToken = await authInstance?.currentUser?.getIdToken?.(true).catch(() => null)
        if (!idToken) {
          console.warn('[notif] missing idToken; skipping push registration')
          return
        }

        await registerPushToken(
          {
            token: expoPushToken,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            app: 'expo',
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        )
      } catch (e) {
        console.error('Failed to register push token:', e)
      }
    }

    register()
  }, [expoPushToken, user, isGuest, authLoading, autoRegisterToken, authInstance])

  return {
    permissionStatus,
    expoPushToken,
  }
}
