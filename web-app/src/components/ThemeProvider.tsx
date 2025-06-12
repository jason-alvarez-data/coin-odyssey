'use client'

import { useEffect } from 'react'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Always default to dark mode unless explicitly set to light
    const isDark = localStorage.theme !== 'light'
    
    // Apply dark mode
    document.documentElement.classList.toggle('dark', isDark)
    
    // Store the preference
    if (!localStorage.theme) {
      localStorage.theme = 'dark'
    }
  }, [])

  return <>{children}</>
} 