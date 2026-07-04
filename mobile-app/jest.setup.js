// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// @sentry/react-native touches RN native internals at import time that the
// jest-expo environment does not provide; crashReporting.ts already guards
// every call, so a shallow mock is sufficient.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  wrap: (component) => component,
}));

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-blur', () => {
  const React = require('react');
  return {
    BlurView: ({ children }) => React.createElement('View', {}, children),
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children }) => React.createElement('View', {}, children),
  };
});
