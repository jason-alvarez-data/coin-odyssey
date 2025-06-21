'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function TermsOfService() {
  useEffect(() => {
    // Load Termly.io terms of service script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://app.termly.io/embed-policy.min.js'
    script.setAttribute('data-name', 'termly-embed-policy')
    script.setAttribute('data-policy-uuid', 'de3d1a01-5c9f-4dd2-ba3b-a7e0daf9808b')
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
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Terms of Service
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          {/* Termly.io Terms of Service Embed */}
          <div 
            data-name="termly-embed" 
            data-id="de3d1a01-5c9f-4dd2-ba3b-a7e0daf9808b" 
            data-type="iframe"
            className="min-h-[600px]"
          />
          
          {/* Fallback iframe if embed doesn't work */}
          <div className="min-h-[600px] mt-4">
            <iframe
              src="https://app.termly.io/policy-viewer/policy.html?policyUUID=de3d1a01-5c9f-4dd2-ba3b-a7e0daf9808b"
              width="100%"
              height="600"
              frameBorder="0"
              title="Terms of Service"
              className="rounded-lg border-0"
            />
          </div>
          
          {/* Fallback content while Termly loads or if it fails */}
          <noscript>
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please enable JavaScript to view our Terms of Service, or visit our terms directly:
              </p>
              <a 
                href="https://app.termly.io/policy-viewer/policy.html?policyUUID=de3d1a01-5c9f-4dd2-ba3b-a7e0daf9808b" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View Terms of Service
              </a>
            </div>
          </noscript>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These terms of service are powered by{' '}
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