import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Define the type for the mocked fetch
const mockFetch = jest.fn() as jest.Mock

// Mock the global fetch
global.fetch = mockFetch as unknown as (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

export {}