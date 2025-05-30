'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import CoinForm from '@/components/CoinForm';
import { Coin } from '@/types/coin';

export default function AddCoinPage() {
  const router = useRouter();

  const handleSubmit = async (coin: Partial<Coin>) => {
    // TODO: Add Supabase integration
    console.log(coin);
    // Navigate back after successful submission
    router.back();
  };

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white">
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Add New Coin</h1>
          <Header />
        </div>

        <div className="max-w-7xl mx-auto">
          <CoinForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
} 