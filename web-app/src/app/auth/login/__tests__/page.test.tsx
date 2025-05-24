// Mock modules before imports
jest.mock('@supabase/auth-ui-react', () => ({
  Auth: ({ providers }: { providers: string[] }) => (
    <main>
      {providers.map(provider => (
        <button key={provider}>
          Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </button>
      ))}
    </main>
  )
}))

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    }
  }
}))

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import Login from '../page'
import { MockSupabaseProvider } from '../../../../test/utils/supabaseMock'

describe('Login Page', () => {
  it('renders the login page with title', () => {
    render(
      <MockSupabaseProvider>
        <Login />
      </MockSupabaseProvider>
    )
    
    // Check if the title is rendered
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders the Auth component with correct providers', () => {
    render(
      <MockSupabaseProvider>
        <Login />
      </MockSupabaseProvider>
    )

    // Verify providers are rendered
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign in with Github/i)).toBeInTheDocument()
  })
}) 