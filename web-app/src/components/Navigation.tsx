"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Collection', path: '/collection', icon: '🪙' },
    { name: 'Analysis', path: '/analysis', icon: '📊' },
    { name: 'Upload Collection', path: '/upload', icon: '📤' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <nav className="w-64 bg-[#1e1e1e] h-screen flex flex-col">
      {/* Logo */}
      <div className="mx-4 mt-4 mb-4">
        <div className="rounded-lg flex justify-center items-center">
          <Image
            src="/images/CoinOdyssey_Logo_Final.png"
            alt="Coin Odyssey"
            width={180}
            height={60}
            priority
            className="w-auto h-auto"
          />
        </div>
      </div>

      {/* Add Coin Button */}
      <div className="px-4 mb-2">
        <Link
          href="/dashboard/add"
          className="flex items-center gap-2 bg-[#2a2a2a] text-white px-4 py-3 rounded-lg hover:bg-[#353535] transition-colors"
        >
          <span>+</span>
          <span>Add Coin</span>
        </Link>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-[#353535] text-white'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#353535]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Light/Dark Mode Toggle */}
      <div className="p-4 border-t border-[#353535]">
        <div className="flex items-center justify-between text-white">
          <span>Light/Dark Mode</span>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
            <input
              type="checkbox"
              className="hidden"
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <div
              className={`w-12 h-6 bg-[#3b82f6] rounded-full p-1 cursor-pointer ${
                isDarkMode ? 'bg-[#3b82f6]' : 'bg-gray-400'
              }`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}