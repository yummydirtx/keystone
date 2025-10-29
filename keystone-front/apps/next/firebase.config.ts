import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBjIfDQ-8QBXlde4nB5c_pa89So1XSV-mI',
  authDomain: 'keystone-a4799.firebaseapp.com',
  projectId: 'keystone-a4799',
  storageBucket: 'keystone-a4799.firebasestorage.app',
  messagingSenderId: '178901875479',
  appId: '1:178901875479:web:6adbf280ee40ff6308d552',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase App Check (only if reCAPTCHA key is available)
let appCheck
if (process.env.NEXT_PUBLIC_RECAPTCHA_API_KEY) {
  // Dynamically import App Check to avoid SSR issues
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_API_KEY!),
        isTokenAutoRefreshEnabled: true, // Enables automatic token refresh for Firebase App Check.
      })
    })
    .catch((error) => {
      console.error('Failed to initialize App Check:', error)
    })
} else {
  console.warn(
    'App Check not initialized: NEXT_PUBLIC_RECAPTCHA_API_KEY environment variable not set'
  )
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export { appCheck }
export default app
