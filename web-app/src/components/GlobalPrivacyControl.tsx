'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface GPCStatus {
  isEnabled: boolean
  isSupported: boolean
  lastChecked: Date
}

interface GlobalPrivacyControlProps {
  user?: User | null
  onGPCDetected?: (gpcEnabled: boolean) => void
}

export default function GlobalPrivacyControl({ user, onGPCDetected }: GlobalPrivacyControlProps) {
  const [gpcStatus, setGPCStatus] = useState<GPCStatus>({
    isEnabled: false,
    isSupported: false,
    lastChecked: new Date()
  })
  const [hasProcessedGPC, setHasProcessedGPC] = useState(false)

  useEffect(() => {
    checkGPCStatus()
  }, [])

  useEffect(() => {
    if (gpcStatus.isEnabled && user && !hasProcessedGPC) {
      handleGPCSignal()
      setHasProcessedGPC(true)
    }
  }, [gpcStatus.isEnabled, user, hasProcessedGPC])

  const checkGPCStatus = () => {
    // Check if GPC is supported and enabled
    const isSupported = 'globalPrivacyControl' in navigator
    const isEnabled = isSupported && (navigator as any).globalPrivacyControl === true

    const status: GPCStatus = {
      isEnabled,
      isSupported,
      lastChecked: new Date()
    }

    setGPCStatus(status)

    // Notify parent component
    if (onGPCDetected) {
      onGPCDetected(isEnabled)
    }

    // Log GPC status for debugging
    console.log('Global Privacy Control Status:', {
      supported: isSupported,
      enabled: isEnabled,
      userAgent: navigator.userAgent
    })
  }

  const handleGPCSignal = async () => {
    if (!user) return

    try {
      console.log('Processing GPC signal for user:', user.id)

      // Update user consent preferences based on GPC signal
      // GPC = true means user wants to opt-out of data sales/sharing
      const gpcPreferences = {
        marketing_communications: false, // Opt out of marketing
        analytics: false, // Opt out of analytics
        // Keep required consents as they are necessary for service operation
        // data_processing, third_party_services, international_transfers remain unchanged
      }

      const { error } = await supabase
        .from('user_consent_preferences')
        .update({
          ...gpcPreferences,
          gpc_enabled: true,
          gpc_processed_at: new Date().toISOString(),
          gpc_detected_at: new Date().toISOString(),
          consent_ip_address: null, // Could implement IP detection
          consent_user_agent: navigator.userAgent,
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating consent preferences for GPC:', error)
        return
      }

      // Log GPC processing for audit trail
      console.log('GPC signal processed successfully', {
        userId: user.id,
        preferences: gpcPreferences,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error processing GPC signal:', error)
    }
  }

  // Don't render anything if GPC is not supported
  if (!gpcStatus.isSupported) {
    return null
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-blue-400" 
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
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global Privacy Control Detected
          </h3>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            {gpcStatus.isEnabled ? (
              <div>
                <p className="mb-2">
                  Your browser is sending a Global Privacy Control (GPC) signal indicating you want to opt-out of data sales and sharing.
                </p>
                <p className="mb-2">
                  <strong>We've automatically:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Disabled marketing communications</li>
                  <li>Disabled analytics tracking</li>
                  <li>Maintained essential services for app functionality</li>
                </ul>
                <p className="mt-2 text-xs">
                  You can still adjust these preferences manually in your account settings.
                </p>
              </div>
            ) : (
              <p>
                Your browser supports Global Privacy Control, but the signal is not currently enabled.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for checking GPC status
export function useGlobalPrivacyControl() {
  const [gpcStatus, setGPCStatus] = useState<GPCStatus>({
    isEnabled: false,
    isSupported: false,
    lastChecked: new Date()
  })

  useEffect(() => {
    const checkGPC = () => {
      const isSupported = 'globalPrivacyControl' in navigator
      const isEnabled = isSupported && (navigator as any).globalPrivacyControl === true

      setGPCStatus({
        isEnabled,
        isSupported,
        lastChecked: new Date()
      })
    }

    checkGPC()

    // Check GPC status periodically (every 5 minutes)
    const interval = setInterval(checkGPC, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return gpcStatus
}

// Utility function to check if GPC is enabled
export function isGPCEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return 'globalPrivacyControl' in navigator && (navigator as any).globalPrivacyControl === true
}

// Utility function to get GPC status for server-side or API usage
export function getGPCStatus() {
  if (typeof window === 'undefined') {
    return {
      isEnabled: false,
      isSupported: false,
      lastChecked: new Date()
    }
  }

  const isSupported = 'globalPrivacyControl' in navigator
  const isEnabled = isSupported && (navigator as any).globalPrivacyControl === true

  return {
    isEnabled,
    isSupported,
    lastChecked: new Date()
  }
} 