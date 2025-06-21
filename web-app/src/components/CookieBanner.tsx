'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookieBannerProps {
  useTermly?: boolean // Set to true if using Termly's cookie solution
}

export default function CookieBanner({ useTermly = false }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent && !useTermly) {
      setShowBanner(true)
    }

    // If using Termly, load their cookie banner script
    if (useTermly) {
      loadTermlyCookieBanner()
    }
  }, [useTermly])

  const loadTermlyCookieBanner = () => {
    // Load Termly cookie banner script
    const script = document.createElement('script')
    script.src = 'https://app.termly.io/embed.min.js'
    script.async = true
    script.setAttribute('data-auto-block', 'on')
    script.setAttribute('data-website-uuid', 'b0b3a60c-b292-49ce-b517-30b0261f9363')
    document.head.appendChild(script)
  }

  const acceptAllCookies = () => {
    setIsLoading(true)
    
    // Store consent in localStorage
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false, // Respect GPC if enabled
      preferences: true,
      timestamp: new Date().toISOString()
    }))

    // Hide banner
    setShowBanner(false)
    setIsLoading(false)

    // You can also update user's consent preferences in database here
    console.log('Cookie consent accepted')
  }

  const acceptNecessaryOnly = () => {
    setIsLoading(true)
    
    // Store minimal consent
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    }))

    setShowBanner(false)
    setIsLoading(false)
    
    console.log('Necessary cookies only accepted')
  }

  const manageCookies = () => {
    // Open cookie preferences modal or redirect to cookie policy
    window.open('/cookies', '_blank')
  }

  // Don't render if using Termly (they handle the banner) or if banner shouldn't show
  if (useTermly || !showBanner) {
    return null
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-6 w-6 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    We use cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    We use essential cookies for authentication and functionality, and optional cookies to improve your experience. 
                    <Link 
                      href="/cookies" 
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline ml-1"
                    >
                      Learn more in our Cookie Policy
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={manageCookies}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Manage Cookies
              </button>
              <button
                onClick={acceptNecessaryOnly}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Necessary Only'}
              </button>
              <button
                onClick={acceptAllCookies}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Accept All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook to check cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<any>(null)

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie-consent')
    if (storedConsent) {
      setConsent(JSON.parse(storedConsent))
    }
  }, [])

  return consent
}

// Utility function to check if specific cookie type is allowed
export function isCookieAllowed(type: 'necessary' | 'analytics' | 'marketing' | 'preferences'): boolean {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) return type === 'necessary' // Only necessary cookies by default
  
  const parsed = JSON.parse(consent)
  return parsed[type] === true
} 