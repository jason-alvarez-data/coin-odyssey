'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
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
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including:
          </p>
          <ul>
            <li>Account information (name, email address)</li>
            <li>Collection data and preferences</li>
            <li>Usage information and analytics</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about updates and features</li>
            <li>Ensure the security of our platform</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. Your data is stored securely using industry-standard encryption and security practices.
          </p>

          <h2>4. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:privacy@coinodyssey.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              privacy@coinodyssey.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 