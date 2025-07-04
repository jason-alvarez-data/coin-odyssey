'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';

interface Coin {
  id: string;
  title: string | null;
  denomination: string;
  year: number;
  mint_mark?: string | null;
  grade?: string | null;
  face_value: number | null;
  current_market_value?: number | null;
  purchase_price?: number | null;
  purchase_date: string | null;
  notes?: string | null;
  country?: string | null;
  images?: string[] | null;
}

export default function EditCoinPage() {
  const params = useParams();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obverseImage, setObverseImage] = useState<string | null>(null);
  const [reverseImage, setReverseImage] = useState<string | null>(null);
  const [uploadingObverse, setUploadingObverse] = useState(false);
  const [uploadingReverse, setUploadingReverse] = useState(false);

  useEffect(() => {
    const fetchCoin = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('coins')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        
        setCoin(data);
        
        // Set existing images if they exist
        if (data.images && data.images.length > 0) {
          setObverseImage(data.images[0] || null);
          setReverseImage(data.images[1] || null);
        } else {
          setObverseImage(null);
          setReverseImage(null);
        }
      } catch (error) {
        console.error('Error fetching coin:', error);
        setError('Could not load coin details');
      } finally {
        setLoading(false);
      }
    };
    fetchCoin();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coin) return;

    try {
      setSaving(true);
      
      // Build images array from obverse and reverse
      const images: string[] = [];
      if (obverseImage) images.push(obverseImage);
      if (reverseImage && reverseImage !== obverseImage) images.push(reverseImage);
      
      const { error } = await supabase
        .from('coins')
        .update({
          title: coin.title,
          denomination: coin.denomination,
          year: coin.year,
          mint_mark: coin.mint_mark,
          grade: coin.grade,
          face_value: coin.face_value,
          current_market_value: coin.current_market_value,
          purchase_price: coin.purchase_price,
          purchase_date: coin.purchase_date,
          notes: coin.notes,
          country: coin.country,
          images: images.length > 0 ? images : null,
        })
        .eq('id', coin.id);

      if (error) throw error;
      router.push('/collection');
    } catch (error) {
      console.error('Error updating coin:', error);
      setError('Failed to update coin');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoin(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleImageChange = (side: 'obverse' | 'reverse') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coin) return;

    // Set loading state
    if (side === 'obverse') {
      setUploadingObverse(true);
    } else {
      setUploadingReverse(true);
    }

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${coin.id}_${side}_${Date.now()}.${fileExt}`;
      
      // Validate file
      if (!fileExt) {
        throw new Error('Invalid file: no extension');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large: maximum size is 10MB');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type: must be an image');
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coin-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('coin-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Update the local state
      if (side === 'obverse') {
        setObverseImage(imageUrl);
      } else {
        setReverseImage(imageUrl);
      }

    } catch (error) {
      console.error(`Error uploading ${side} image:`, error);
      alert(`Failed to upload ${side} image. Please try again.`);
    } finally {
      // Clear loading state
      if (side === 'obverse') {
        setUploadingObverse(false);
      } else {
        setUploadingReverse(false);
      }
    }
  };

  const removeImage = async (side: 'obverse' | 'reverse') => {
    const currentImageUrl = side === 'obverse' ? obverseImage : reverseImage;
    
    if (currentImageUrl && currentImageUrl.includes('coin-images')) {
      try {
        // Extract filename from URL
        const urlParts = currentImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Delete from Supabase Storage
        const { error } = await supabase.storage
          .from('coin-images')
          .remove([fileName]);
          
        if (error) {
          console.error('Error deleting image:', error);
        }
      } catch (error) {
        console.error('Error removing image from storage:', error);
      }
    }

    // Update local state
    if (side === 'obverse') {
      setObverseImage(null);
    } else {
      setReverseImage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Coin</h1>
          <Header />
        </div>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Coin</h1>
          <Header />
        </div>
        <div className="text-red-400">Coin not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Coin</h1>
        <Header />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={coin.title || ''}
              onChange={handleInputChange}
              required
              className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="year"
                value={coin.year || ''}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Face Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="face_value"
                value={coin.face_value || ''}
                onChange={handleInputChange}
                required
                step="0.01"
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <input
                type="text"
                name="denomination"
                value={coin.denomination || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={coin.country || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mint Mark</label>
              <input
                type="text"
                name="mint_mark"
                value={coin.mint_mark || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Grade</label>
              <input
                type="text"
                name="grade"
                value={coin.grade || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Purchase Price</label>
              <input
                type="number"
                name="purchase_price"
                value={coin.purchase_price || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Date Acquired <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={coin.purchase_date || ''}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              name="notes"
              value={coin.notes || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
            />
          </div>

          {/* Coin Images - Obverse and Reverse */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Coin Images</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Obverse (Front) Image */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Obverse (Front)</label>
                <div className="space-y-3">
                  {obverseImage ? (
                    <div className="relative">
                      <img
                        src={obverseImage}
                        alt="Obverse (Front)"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('obverse')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No obverse image</span>
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange('obverse')}
                      className="hidden"
                      id="obverse-upload"
                      disabled={uploadingObverse}
                    />
                    <label
                      htmlFor="obverse-upload"
                      className={`w-full py-2 px-4 rounded-lg transition-colors text-center block ${
                        uploadingObverse 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      } text-white`}
                    >
                      {uploadingObverse ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        obverseImage ? 'Change Obverse' : 'Add Obverse'
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Reverse (Back) Image */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Reverse (Back)</label>
                <div className="space-y-3">
                  {reverseImage ? (
                    <div className="relative">
                      <img
                        src={reverseImage}
                        alt="Reverse (Back)"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('reverse')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No reverse image</span>
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange('reverse')}
                      className="hidden"
                      id="reverse-upload"
                      disabled={uploadingReverse}
                    />
                    <label
                      htmlFor="reverse-upload"
                      className={`w-full py-2 px-4 rounded-lg transition-colors text-center block ${
                        uploadingReverse 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      } text-white`}
                    >
                      {uploadingReverse ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        reverseImage ? 'Change Reverse' : 'Add Reverse'
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              <p>• Obverse: The front side of the coin (usually with the face or main design)</p>
              <p>• Reverse: The back side of the coin (usually with the denomination or secondary design)</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/collection')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 