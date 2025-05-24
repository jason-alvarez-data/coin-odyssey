import { createClient } from '@supabase/supabase-js'
import { ReactNode } from 'react'
import { jest } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import React from 'react'

// Create a custom mock client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })
} as unknown as SupabaseClient

// Mock the createClient function at the module level
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}))

// Create a mock provider component
export const MockSupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'mock-supabase-provider' }, children)
}

// Export the mock client for direct usage in tests
export const mockClient = mockSupabaseClient