// src/utils/constants.ts
export const APP_CONFIG = {
  name: 'Coin Odyssey',
  version: '1.0.0',
  supportEmail: 'support@coinodyssey.com',
} as const;

export const SCREEN_NAMES = {
  // Auth Stack
  SIGN_IN: 'SignIn',
  SIGN_UP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Tab
  DASHBOARD: 'Dashboard',
  COLLECTION: 'Collection',
  CAMERA: 'Camera',
  ANALYTICS: 'Analytics',
  PROFILE: 'Profile',
  
  // Collection Stack
  COLLECTION_LIST: 'CollectionList',
  COIN_DETAIL: 'CoinDetail',
  ADD_COIN: 'AddCoin',
  EDIT_COIN: 'EditCoin',
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_COINS: 'offline_coins',
  LAST_SYNC: 'last_sync',
} as const;

export const COIN_GRADES = [
  'PR-70', 'PR-69', 'PR-68', 'PR-67', 'PR-66', 'PR-65',
  'MS-70', 'MS-69', 'MS-68', 'MS-67', 'MS-66', 'MS-65',
  'MS-64', 'MS-63', 'MS-62', 'MS-61', 'MS-60',
  'AU-58', 'AU-55', 'AU-53', 'AU-50',
  'XF-45', 'XF-40',
  'VF-35', 'VF-30', 'VF-25', 'VF-20',
  'F-15', 'F-12',
  'VG-10', 'VG-8',
  'G-6', 'G-4',
  'AG-3',
  'FR-2',
  'PO-1'
] as const;

export const MINT_MARKS = [
  'P', 'D', 'S', 'W', 'O', 'CC', 'C', 'H'
] as const;

export const DENOMINATIONS = [
  'Half Cent',
  'Large Cent',
  'Small Cent',
  'Two Cent',
  'Three Cent (Silver)',
  'Three Cent (Nickel)',
  'Half Dime',
  'Nickel',
  'Dime',
  'Twenty Cent',
  'Quarter',
  'Half Dollar',
  'Dollar',
  'Gold Dollar',
  'Quarter Eagle ($2.50)',
  'Three Dollar Gold',
  'Half Eagle ($5)',
  'Eagle ($10)',
  'Double Eagle ($20)',
] as const;

export const COUNTRIES = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Australia',
  'New Zealand',
  'South Africa',
  'China',
  'Japan',
  'India',
  'Brazil',
  'Argentina',
  'Other'
] as const;