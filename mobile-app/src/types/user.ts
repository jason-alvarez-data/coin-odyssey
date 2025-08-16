// src/types/user.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  currency: string;
  notifications: {
    priceAlerts: boolean;
    reminders: boolean;
    marketUpdates: boolean;
  };
}