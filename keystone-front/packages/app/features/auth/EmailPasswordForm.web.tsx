import React, { useState } from 'react'
import { Button, YStack, Text, Input, Label } from '@my/ui'
import { useAuth } from '../../provider/AuthProvider'

interface EmailPasswordFormProps {
  onBack: () => void
}

export function EmailPasswordForm({ onBack }: EmailPasswordFormProps) {
  const { signInWithEmailPassword, signUpWithEmailPassword, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
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
        await signUpWithEmailPassword(email.trim(), password)
      } else {
        await signInWithEmailPassword(email.trim(), password)
      }
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
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      handleEmailAuth()
    }
  }

  return (
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
          id="email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          disabled={loading}
          onKeyPress={handleKeyPress}
        />
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          disabled={loading}
          onKeyPress={handleKeyPress}
        />
      </YStack>

      {isSignUp && (
        <YStack gap="$2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            disabled={loading}
            onKeyPress={handleKeyPress}
          />
        </YStack>
      )}

      <Button
        size="$5"
        onPress={handleEmailAuth}
        disabled={
          loading || !email.trim() || !password.trim() || (isSignUp && !confirmPassword.trim())
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
  )
}
