/**
 * Register the Expo push token with the backend (authenticated).
 * Backend route: POST /api/users/me/push-endpoints
 */
type RegisterArgs = {
  token: string
  platform: 'ios' | 'android'
  app?: 'expo'
}

type RegisterOptions = {
  headers?: Record<string, string>
}

export async function registerPushToken(
  args: RegisterArgs,
  opts: RegisterOptions = {}
): Promise<void> {
  const { token, platform, app = 'expo' } = args

  const base =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'https://api.gokeystone.org/api'
  const endpoint = `${base}/users/me/push-endpoints`

  const body = {
    provider: 'expo' as const,
    token,
    platform,
    app,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to register push token: ${res.status} ${text}`)
  }
}
