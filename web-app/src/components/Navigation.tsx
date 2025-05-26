"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
    <nav className="w-64 bg-[#1e1e2d] text-white h-screen p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <div className="bg-yellow-400 p-4 rounded-lg">
          <h1 className="text-black text-xl font-bold">Coin Odyssey</h1>
        </div>
      </div>

      {/* Add Coin Button */}
      <Link
        href="/dashboard/add"
        className="bg-blue-600 text-white p-3 rounded-lg mb-6 flex items-center gap-2 hover:bg-blue-700 transition-colors"
      >
        <span>+</span>
        <span>Add Coin</span>
      </Link>
      
      {/* Navigation Items */}
      <div className="space-y-2 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === item.path
                ? 'bg-gray-800'
                : 'hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Dark Mode Toggle */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm">Light/Dark Mode</span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-400'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </nav>
  );
}