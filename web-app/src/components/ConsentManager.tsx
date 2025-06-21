'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface ConsentPreferences {
  data_processing: boolean
  third_party_services: boolean
  international_transfers: boolean
  marketing_communications: boolean
  analytics: boolean
  performance_cookies: boolean
  consent_given_at: string
  consent_updated_at: string
  gpc_enabled: boolean
  gpc_processed_at: string | null
  gpc_detected_at: string | null
}

interface ConsentManagerProps {
  user: User
}

export default function ConsentManager({ user }: ConsentManagerProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConsentPreferences()
  }, [user.id])

  const fetchConsentPreferences = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_consent_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setPreferences(data)
      } else {
        // Create default preferences if none exist
        await createDefaultPreferences()
      }
    } catch (error) {
      console.error('Error fetching consent preferences:', error)
      setMessage({ type: 'error', text: 'Failed to load consent preferences' })
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPreferences = async () => {
    try {
      const defaultPrefs = {
        user_id: user.id,
        data_processing: true,
        third_party_services: true,
        international_transfers: true,
        marketing_communications: false,
        analytics: false,
        performance_cookies: true,
        gpc_enabled: false,
        gpc_processed_at: null,
        gpc_detected_at: null,
      }

      const { data, error } = await supabase
        .from('user_consent_preferences')
        .insert([defaultPrefs])
        .select()
        .single()

      if (error) throw error
      setPreferences(data)
    } catch (error) {
      console.error('Error creating default preferences:', error)
    }
  }

  const updateConsentPreferences = async (newPreferences: Partial<ConsentPreferences>) => {
    if (!preferences) return

    try {
      setSaving(true)
      setMessage(null)

      // Get client IP and user agent for audit trail
      const userAgent = navigator.userAgent
      
      const updatedPrefs = {
        ...preferences,
        ...newPreferences,
        consent_ip_address: null, // Could implement IP detection
        consent_user_agent: userAgent,
      }

      const { error } = await supabase
        .from('user_consent_preferences')
        .update(updatedPrefs)
        .eq('user_id', user.id)

      if (error) throw error

      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)
      setMessage({ type: 'success', text: 'Consent preferences updated successfully' })
    } catch (error) {
      console.error('Error updating consent preferences:', error)
      setMessage({ type: 'error', text: 'Failed to update consent preferences' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof ConsentPreferences) => {
    if (!preferences || saving) return

    const newValue = !preferences[key]
    
    // Check if user is trying to disable required consent
    if (!newValue && (key === 'data_processing' || key === 'third_party_services' || key === 'international_transfers')) {
      setMessage({ 
        type: 'error', 
        text: 'This consent is required for the service to function. To withdraw this consent, you would need to delete your account.' 
      })
      return
    }

    updateConsentPreferences({ [key]: newValue } as Partial<ConsentPreferences>)
  }

  if (loading) {
    return (
      <div className="bg-[#2a2a2a] p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="bg-[#2a2a2a] p-6 rounded-lg">
        <p className="text-red-400">Failed to load consent preferences</p>
      </div>
    )
  }

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Privacy & Consent Preferences</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-800 text-green-200' 
            : 'bg-red-800 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Required Consents */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-blue-400">Required for Service Operation</h3>
          <p className="text-sm text-gray-400 mb-4">
            These consents are required for our service to function properly. To withdraw these, you would need to delete your account.
          </p>
          
          <div className="space-y-3">
            <ConsentToggle
              label="Data Processing"
              description="Allow us to process your coin collection data to provide the service"
              checked={preferences.data_processing}
              onChange={() => handleToggle('data_processing')}
              disabled={saving}
              required={true}
            />
            
            <ConsentToggle
              label="Third-Party Services"
              description="Allow authentication via Google/GitHub and use of essential third-party services"
              checked={preferences.third_party_services}
              onChange={() => handleToggle('third_party_services')}
              disabled={saving}
              required={true}
            />
            
            <ConsentToggle
              label="International Data Transfers"
              description="Allow transfer of your data outside EU/UK for essential service operation"
              checked={preferences.international_transfers}
              onChange={() => handleToggle('international_transfers')}
              disabled={saving}
              required={true}
            />
            
            <ConsentToggle
              label="Performance Cookies"
              description="Allow essential cookies for website functionality and security"
              checked={preferences.performance_cookies}
              onChange={() => handleToggle('performance_cookies')}
              disabled={saving}
              required={true}
            />
          </div>
        </div>

        {/* Optional Consents */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-green-400">Optional Preferences</h3>
          <p className="text-sm text-gray-400 mb-4">
            You can enable or disable these features at any time.
          </p>
          
          <div className="space-y-3">
            <ConsentToggle
              label="Marketing Communications"
              description="Receive updates about new features and improvements (currently not implemented)"
              checked={preferences.marketing_communications}
              onChange={() => handleToggle('marketing_communications')}
              disabled={saving}
              required={false}
            />
            
            <ConsentToggle
              label="Analytics"
              description="Help us improve the service with anonymous usage analytics (currently not implemented)"
              checked={preferences.analytics}
              onChange={() => handleToggle('analytics')}
              disabled={saving}
              required={false}
            />
          </div>
        </div>

        {/* GPC Status */}
        {preferences.gpc_enabled && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-200 mb-2">
              Global Privacy Control Active
            </h3>
            <p className="text-xs text-blue-300">
              Your browser's Global Privacy Control signal has been detected and processed.
              {preferences.gpc_processed_at && (
                <span className="block mt-1">
                  Processed: {new Date(preferences.gpc_processed_at).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Consent History */}
        <div className="pt-4 border-t border-gray-600">
          <p className="text-sm text-gray-400">
            <strong>Last updated:</strong> {new Date(preferences.consent_updated_at).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            <strong>Originally given:</strong> {new Date(preferences.consent_given_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

interface ConsentToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  disabled: boolean
  required: boolean
}

function ConsentToggle({ label, description, checked, onChange, disabled, required }: ConsentToggleProps) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-[#1e1e1e] rounded-lg">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled || required}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-white">
            {label}
          </label>
          {required && (
            <span className="text-xs px-2 py-1 bg-orange-800 text-orange-200 rounded">
              Required
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  )
} 