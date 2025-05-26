'use client'

import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#1e1e2d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-12 relative w-64 h-32 mx-auto">
          <Image
            src="/images/CoinOdyssey_Logo_Final.png"
            alt="Coin Odyssey Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Coin Odyssey
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-400 mb-12">
          Your journey through numismatic treasures
        </p>

        {/* Auth Buttons */}
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-[#3699FF] text-white rounded-lg px-4 py-3 font-semibold hover:bg-[#187DE4] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signin?signup=true"
            className="block w-full bg-white text-[#3699FF] rounded-lg px-4 py-3 font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-sm text-gray-500">
          Track, manage, and explore your coin collection
        </p>
      </div>
    </div>
  );
}
