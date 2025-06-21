'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function PrivacyPolicy() {
  useEffect(() => {
    // Load Termly.io privacy policy script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://app.termly.io/embed-policy.min.js'
    script.setAttribute('data-name', 'termly-embed-policy')
    script.setAttribute('data-policy-uuid', 'c406524c-1d92-4af6-9845-c524ad72fbfa')
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://app.termly.io/embed-policy.min.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          {/* Termly.io Privacy Policy Embed */}
          <div 
            data-name="termly-embed"
            data-id="c406524c-1d92-4af6-9845-c524ad72fbfa" 
            data-type="iframe"
            className="min-h-[600px]"
          />
          
          {/* Fallback iframe if embed doesn't work */}
          <div className="min-h-[600px] mt-4">
            <iframe
              src="https://app.termly.io/policy-viewer/policy.html?policyUUID=c406524c-1d92-4af6-9845-c524ad72fbfa"
              width="100%"
              height="600"
              frameBorder="0"
              title="Privacy Policy"
              className="rounded-lg border-0"
            />
          </div>
          
          {/* Fallback content */}
          <noscript>
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please enable JavaScript to view our Privacy Policy, or visit our policy directly:
              </p>
              <a 
                href="https://app.termly.io/policy-viewer/policy.html?policyUUID=c406524c-1d92-4af6-9845-c524ad72fbfa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View Privacy Policy
              </a>
            </div>
          </noscript>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This privacy policy is powered by{' '}
            <a 
              href="https://termly.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Termly
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 