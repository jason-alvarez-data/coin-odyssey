'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CoinService } from '@/services/coinService';
import { Coin } from '@coin-collecting/shared';
import { Loader2, X, Upload } from 'lucide-react';

import SeriesAutocomplete from '@/components/SeriesAutocomplete';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

        setCoin(CoinService.mapSupabaseToCoin(data));

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
          mint_mark: coin.mintMark,
          grade: coin.grade,
          face_value: coin.faceValue,
          current_market_value: coin.currentMarketValue,
          purchase_price: coin.purchasePrice,
          purchase_date: coin.purchaseDate,
          notes: coin.notes,
          country: coin.country,
          series: coin.series,
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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Coin</h1>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-9 w-full" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Coin</h1>
        <p className="text-destructive">Coin not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Coin</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Coin Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={coin.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  name="year"
                  value={coin.year || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faceValue">
                  Face Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="faceValue"
                  type="number"
                  name="faceValue"
                  value={coin.faceValue || ''}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="denomination">Type</Label>
                <Input
                  id="denomination"
                  type="text"
                  name="denomination"
                  value={coin.denomination || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  name="country"
                  value={coin.country || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Series (Optional)
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {coin.country && coin.denomination ? '- Suggestions based on country and type' : '- Enter country and type for suggestions'}
                </span>
              </Label>
              <SeriesAutocomplete
                country={coin.country || ''}
                denomination={coin.denomination || ''}
                value={coin.series || ''}
                onChange={(series) => setCoin(prev => prev ? { ...prev, series } : prev)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mintMark">Mint Mark</Label>
                <Input
                  id="mintMark"
                  type="text"
                  name="mintMark"
                  value={coin.mintMark || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  type="text"
                  name="grade"
                  value={coin.grade || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  name="purchasePrice"
                  value={coin.purchasePrice || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">
                  Date Acquired <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  name="purchaseDate"
                  value={coin.purchaseDate || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={coin.notes || ''}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {/* Coin Images - Obverse and Reverse */}
            <div className="space-y-3">
              <Label>Coin Images</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Obverse (Front) Image */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-normal">Obverse (Front)</Label>
                  {obverseImage ? (
                    <div className="relative">
                      <img
                        src={obverseImage}
                        alt="Obverse (Front)"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => removeImage('obverse')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No obverse image</span>
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
                    <Button
                      type="button"
                      variant="default"
                      className="w-full"
                      disabled={uploadingObverse}
                      asChild
                    >
                      <label htmlFor="obverse-upload" className="cursor-pointer">
                        {uploadingObverse ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            {obverseImage ? 'Change Obverse' : 'Add Obverse'}
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>

                {/* Reverse (Back) Image */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-normal">Reverse (Back)</Label>
                  {reverseImage ? (
                    <div className="relative">
                      <img
                        src={reverseImage}
                        alt="Reverse (Back)"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => removeImage('reverse')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No reverse image</span>
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
                    <Button
                      type="button"
                      variant="default"
                      className="w-full"
                      disabled={uploadingReverse}
                      asChild
                    >
                      <label htmlFor="reverse-upload" className="cursor-pointer">
                        {uploadingReverse ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            {reverseImage ? 'Change Reverse' : 'Add Reverse'}
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Obverse: The front side of the coin (usually with the face or main design)</p>
                <p>Reverse: The back side of the coin (usually with the denomination or secondary design)</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/collection')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
