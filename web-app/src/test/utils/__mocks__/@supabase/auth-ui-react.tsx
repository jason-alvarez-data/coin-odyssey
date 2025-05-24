import React from 'react'

export const Auth = ({ providers }: { providers: string[] }) => {
  return (
    <main>
      {providers.map(provider => (
        <button key={provider}>
          Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </button>
      ))}
    </main>
  )
} 