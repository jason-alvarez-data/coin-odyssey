'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import CoinForm from '@/components/CoinForm';
import { Coin } from '@/types/coin';

export default function AddCoinPage() {
  const router = useRouter();

  const handleSubmit = async (coin: Partial<Coin>) => {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        alert('You must be logged in to add coins. Please refresh the page and try again.');
        return;
      }

              // First, try to get ANY collection for the user (not just "My Collection")
        let { data: allCollections, error: allCollectionsError } = await supabase
          .from('collections')
          .select('id, name')
          .eq('user_id', user.id)
          .limit(1);

      let collectionId: string;

              if (allCollections && allCollections.length > 0) {
          // Use the first existing collection
          collectionId = allCollections[0].id;
        } else {
          // Try to create a default collection
        
        const { data: newCollection, error: createError } = await supabase
          .from('collections')
          .insert({
            user_id: user.id,
            name: 'My Collection',
            description: 'Default collection for my coins'
          })
          .select('id')
          .single();

                  if (createError) {
            console.error('Error creating collection:', createError.message);
            alert(`Error creating collection: ${createError.message || 'Unknown error'}. Please check your database setup and ensure you have proper permissions.`);
            return;
          } else if (!newCollection) {
            console.error('No collection returned after creation');
            alert('Error: No collection was created. Please check your database setup.');
            return;
          } else {
            collectionId = newCollection.id;
          }
      }

      // Map form data to database fields
      const coinData = {
        collection_id: collectionId,
        title: coin.title || null,
        denomination: coin.denomination || '',
        year: coin.year || new Date().getFullYear(),
        mint_mark: coin.mintMark || null,
        grade: coin.grade || null,
        purchase_price: coin.purchasePrice || null,
        purchase_date: coin.purchaseDate ? new Date(coin.purchaseDate).toISOString().split('T')[0] : null,
        notes: coin.notes || null,
        country: coin.country || null,
        // Note: images will be handled separately in the future when file upload is implemented
        images: null
      };

              // Insert the coin into the database
        const { data: newCoin, error: insertError } = await supabase
          .from('coins')
          .insert(coinData)
          .select()
          .single();

        if (insertError) {
          console.error('Error adding coin:', insertError.message);
          alert(`Error adding coin: ${insertError.message || 'Unknown error'}`);
          return;
        }
      alert('Coin added successfully!');
      
      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Unexpected error:', error);
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
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