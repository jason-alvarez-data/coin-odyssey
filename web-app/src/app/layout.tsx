import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from '@/components/ThemeProvider'

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
        {/* No-JS fallback */}
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
        </ThemeProvider>
      </body>
    </html>
  );
}