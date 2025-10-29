import React, { useState } from 'react'
import { useAuth } from '../provider/AuthProvider'

interface NavigationBarProps {
  onMenuPress: () => void
}

export function NavigationBar({ onMenuPress }: NavigationBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut, user, getUserDisplayName } = useAuth()

  return <></>
}
