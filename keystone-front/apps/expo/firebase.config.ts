import { Platform } from 'react-native'
import { initializeApp, getApps } from 'firebase/app'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBjIfDQ-8QBXlde4nB5c_pa89So1XSV-mI',
  authDomain: 'keystone-a4799.firebaseapp.com',
  projectId: 'keystone-a4799',
  storageBucket: 'keystone-a4799.firebasestorage.app',
  messagingSenderId: '178901875479',
  appId: '1:178901875479:web:6adbf280ee40ff6308d552',
}

// Only initialize Firebase if not already initialized
let isFirebaseInitialized = false

export const initializeFirebase = () => {
  if (isFirebaseInitialized) return

  // For React Native Firebase, initialization is done through the JSON files
  // so we don't need to initialize here for native platforms
  if (Platform.OS !== 'web') {
    isFirebaseInitialized = true
    return
  }

  // For web, initialize Firebase Web SDK
  // Check if Firebase app is already initialized
  const apps = getApps()
  if (apps.length === 0) {
    // Initialize Firebase app if not already initialized
    initializeApp(firebaseConfig)
  }

  isFirebaseInitialized = true
}

export { firebaseConfig }
