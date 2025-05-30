"use client";

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: true;
}

const ThemeContext = createContext<ThemeContextType>({ isDarkMode: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always ensure dark mode is enabled
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 