import React, { useEffect, useRef, useState } from 'react'
import { Button, YStack, Text, Input, Label } from '@my/ui'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { useAuth } from '../../provider/AuthProvider'
import { useRouter } from 'solito/navigation'

interface EmailPasswordFormProps {
  onBack: () => void
}

export function EmailPasswordForm({ onBack }: EmailPasswordFormProps) {
  const { user, signInWithEmailPassword, signUpWithEmailPassword, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  // Use uncontrolled inputs with refs to avoid per-keystroke re-rendering
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const confirmPasswordRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleEmailAuth = async () => {
    const email = emailRef.current.trim()
    const password = passwordRef.current
    const confirmPassword = confirmPasswordRef.current
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setError(null)
      if (isSignUp) {
        await signUpWithEmailPassword(email, password)
      } else {
        await signInWithEmailPassword(email, password)
      }
      // Redirect will be handled by useEffect when user state updates
    } catch (error: any) {
      console.error('Email authentication failed:', error)
      let errorMessage = isSignUp ? 'Failed to create account.' : 'Failed to sign in.'

      // Handle common Firebase auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.'
            break
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.'
            break
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.'
            break
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.'
            break
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.'
            break
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.'
            break
          default:
            errorMessage = error.message || errorMessage
        }
      }

      setError(errorMessage)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    emailRef.current = ''
    passwordRef.current = ''
    confirmPasswordRef.current = ''
    setInputResetKey((k) => k + 1)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ width: '100%', maxWidth: 400 }}
    >
      <YStack
        gap="$3"
        width="100%"
        maxW={400}
      >
        {error && (
          <Text
            color="$red10"
            text="center"
          >
            {error}
          </Text>
        )}

        <YStack gap="$2">
          <Label htmlFor="email">Email</Label>
          <Input
            key={`email-${inputResetKey}`}
            id="email"
            placeholder="Enter your email"
            defaultValue=""
            onChangeText={(text) => {
              emailRef.current = text
              requestUiUpdate()
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            disabled={loading}
            returnKeyType="next"
          />
        </YStack>

        <YStack gap="$2">
          <Label htmlFor="password">Password</Label>
          <Input
            key={`password-${inputResetKey}`}
            id="password"
            placeholder="Enter your password"
            defaultValue=""
            onChangeText={(text) => {
              passwordRef.current = text
              requestUiUpdate()
            }}
            secureTextEntry
            disabled={loading}
            returnKeyType={isSignUp ? 'next' : 'done'}
            onSubmitEditing={isSignUp ? undefined : handleEmailAuth}
          />
        </YStack>

        {isSignUp && (
          <YStack gap="$2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              key={`confirm-${inputResetKey}`}
              id="confirmPassword"
              placeholder="Confirm your password"
              defaultValue=""
              onChangeText={(text) => {
                confirmPasswordRef.current = text
                requestUiUpdate()
              }}
              secureTextEntry
              disabled={loading}
              returnKeyType="done"
              onSubmitEditing={handleEmailAuth}
            />
          </YStack>
        )}

        <Button
          size="$5"
          onPress={handleEmailAuth}
          disabled={
            loading ||
            !emailRef.current.trim() ||
            !passwordRef.current.trim() ||
            (isSignUp && !confirmPasswordRef.current.trim())
          }
          theme="blue"
        >
          {loading ? (
            <Text>Processing...</Text>
          ) : (
            <Text>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          )}
        </Button>

        <Button
          size="$4"
          variant="outlined"
          onPress={toggleMode}
          disabled={loading}
        >
          <Text>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </Button>

        <Button
          size="$3"
          chromeless
          onPress={onBack}
          disabled={loading}
        >
          <Text color="$color10">Use social sign-in instead</Text>
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  )
}
