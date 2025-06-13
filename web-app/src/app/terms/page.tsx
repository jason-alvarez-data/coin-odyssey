'use client'

import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Coin Odyssey, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily use Coin Odyssey for personal, non-commercial purposes. This license does not include:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for commercial purposes</li>
            <li>Attempting to reverse engineer any software</li>
            <li>Removing any copyright or proprietary notations</li>
          </ul>

          <h2>3. User Responsibilities</h2>
          <p>
            As a user of Coin Odyssey, you agree to:
          </p>
          <ul>
            <li>Provide accurate account information</li>
            <li>Maintain the security of your account</li>
            <li>Use the service in compliance with all applicable laws</li>
            <li>Not engage in any unauthorized access or use</li>
          </ul>

          <h2>4. Disclaimer</h2>
          <p>
            The materials on Coin Odyssey are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2>5. Limitations</h2>
          <p>
            In no event shall Coin Odyssey or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Coin Odyssey.
          </p>

          <h2>6. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:legal@coinodyssey.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              legal@coinodyssey.com
            </a>
          </p>

          <p>You&apos;re responsible for maintaining the security of your account and password.</p>
        </div>
      </div>
    </div>
  )
} 