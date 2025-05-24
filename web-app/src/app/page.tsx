import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center justify-center gap-8 row-start-2">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Coin Collecting
        </h1>
        
        <p className="text-lg text-center max-w-2xl text-gray-600 dark:text-gray-300">
          A modern web application for managing your coin collection, tracking values,
          and connecting with other collectors.
        </p>

        <div className="flex gap-4 mt-8">
          <Link 
            href="/auth/login"
            className="rounded-full border border-solid transition-colors flex items-center justify-center bg-foreground text-background px-6 py-3 hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/register"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] px-6 py-3"
          >
            Create Account
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Track Collection</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your coin collection digitally with detailed information and images.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Monitor Value</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Keep track of your collection's value and investment performance.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Share & Connect</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Connect with other collectors and share your collection securely.
            </p>
          </div>
        </div>
      </main>

      <footer className="row-start-3 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Coin Collecting App. All rights reserved.
      </footer>
    </div>
  );
}
