'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the improved signin page
    router.replace('/auth/signin')
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md">
        <p className="text-center text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}