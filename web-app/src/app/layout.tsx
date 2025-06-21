import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from '@/components/ThemeProvider'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Coin Odyssey",
  description: "The Ultimate Coin Collection Management Platform",
  icons: {
    icon: '/images/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Global Privacy Control Detection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Default to dark mode unless explicitly set to light
                var isDark = localStorage.theme !== 'light';
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.backgroundColor = 'rgb(17 24 39)';
                if (!localStorage.theme) {
                  localStorage.theme = 'dark';
                }
                
                // Global Privacy Control Detection
                if (typeof navigator !== 'undefined' && 'globalPrivacyControl' in navigator) {
                  var gpcEnabled = navigator.globalPrivacyControl === true;
                  console.log('GPC Status:', gpcEnabled ? 'Enabled' : 'Disabled');
                  
                  // Store GPC status for later use
                  window.__GPC_STATUS = {
                    supported: true,
                    enabled: gpcEnabled,
                    detected: new Date().toISOString()
                  };
                } else {
                  window.__GPC_STATUS = {
                    supported: false,
                    enabled: false,
                    detected: new Date().toISOString()
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className={`${inter.className} min-h-screen antialiased bg-gray-900`}
        style={{ 
          backgroundColor: 'rgb(17 24 39)',
          color: 'rgb(255 255 255)'
        }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </div>
          <CookieBanner useTermly={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}