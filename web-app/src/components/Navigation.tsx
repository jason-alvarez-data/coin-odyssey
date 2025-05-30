"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();

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
      <div className="mx-6 my-8">
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
      <div className="px-6 mb-6">
        <Link
          href="/dashboard/add"
          className="flex items-center gap-3 bg-[#2a2a2a] text-white px-5 py-3.5 rounded-lg hover:bg-[#353535] transition-colors"
        >
          <span className="text-lg">+</span>
          <span>Add Coin</span>
        </Link>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 px-4">
        <div className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-5 py-3.5 mx-2 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-[#353535] text-white'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#353535]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}