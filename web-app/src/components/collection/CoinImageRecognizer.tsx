'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, Loader2, Check, AlertTriangle, X, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CoinRecognitionResult, RecognitionConfidence } from '@/types/recognition';
import { supabase } from '@/lib/supabase';

interface CoinImageRecognizerProps {
  onRecognitionComplete: (result: CoinRecognitionResult) => void;
  onDismiss?: () => void;
}

type ImageSlot = {
  base64: string;
  previewUrl: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
};

async function compressImage(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIMENSION = 1024;
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];

      resolve({ base64, mediaType: 'image/jpeg' });
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = objectUrl;
  });
}

const confidenceConfig: Record<
  RecognitionConfidence,
  { label: string; className: string; icon: React.ReactNode }
> = {
  high: { label: 'High Confidence', className: 'text-emerald-400', icon: <Check className="h-3 w-3" /> },
  medium: { label: 'Medium Confidence', className: 'text-amber-400', icon: <AlertTriangle className="h-3 w-3" /> },
  low: { label: 'Low Confidence', className: 'text-orange-400', icon: <AlertTriangle className="h-3 w-3" /> },
  unrecognized: { label: 'Unrecognized', className: 'text-red-400', icon: <X className="h-3 w-3" /> },
};

export function CoinImageRecognizer({ onRecognitionComplete, onDismiss }: CoinImageRecognizerProps) {
  const [obverse, setObverse] = useState<ImageSlot | null>(null);
  const [reverse, setReverse] = useState<ImageSlot | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CoinRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const obverseInputRef = useRef<HTMLInputElement>(null);
  const reverseInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    async (file: File, side: 'obverse' | 'reverse') => {
      setError(null);
      setResult(null);

      try {
        const { base64, mediaType } = await compressImage(file);
        const previewUrl = URL.createObjectURL(file);
        const slot: ImageSlot = { base64, previewUrl, mediaType };

        if (side === 'obverse') setObverse(slot);
        else setReverse(slot);
      } catch {
        setError('Failed to process image. Please try a different photo.');
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!obverse && !reverse) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Get the current session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to use coin recognition.');
      }

      const body: Record<string, string> = {
        mediaType: (obverse ?? reverse)!.mediaType,
      };
      if (obverse) body.obverseImage = obverse.base64;
      if (reverse) body.reverseImage = reverse.base64;

      const response = await fetch('/api/recognize-coin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Recognition failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [obverse, reverse]);

  const handleApply = () => {
    if (result) onRecognitionComplete(result);
  };

  const handleReset = () => {
    if (obverse?.previewUrl) URL.revokeObjectURL(obverse.previewUrl);
    if (reverse?.previewUrl) URL.revokeObjectURL(reverse.previewUrl);
    setObverse(null);
    setReverse(null);
    setResult(null);
    setError(null);
  };

  const confidence = result ? confidenceConfig[result.confidence] : null;

  return (
    <Card className="border-dashed">
      <CardContent className="pt-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">AI Coin Recognition</h3>
              <p className="text-xs text-muted-foreground">Upload a photo to auto-fill coin details</p>
            </div>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Image Upload Slots */}
        <div className="grid grid-cols-2 gap-3">
          {(['obverse', 'reverse'] as const).map((side) => {
            const slot = side === 'obverse' ? obverse : reverse;
            const inputRef = side === 'obverse' ? obverseInputRef : reverseInputRef;
            const label = side === 'obverse' ? 'Front (Obverse)' : 'Back (Reverse)';

            return (
              <div key={side}>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, side);
                  }}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isAnalyzing}
                  className={`
                    w-full aspect-square rounded-lg border-2 border-dashed
                    flex flex-col items-center justify-center gap-1
                    transition-all duration-200 overflow-hidden
                    ${slot
                      ? 'border-primary/40 p-0'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50 p-3'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {slot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.previewUrl}
                      alt={`Coin ${side}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground/40" />
                      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
                      <span className="text-xs text-muted-foreground/50">click to add</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        {!obverse && !reverse && (
          <p className="text-xs text-muted-foreground/60 text-center">
            Adding both sides improves accuracy. Front side alone is usually enough.
          </p>
        )}

        {/* Analyze Button */}
        {(obverse || reverse) && !result && (
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing coin...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Identify Coin{obverse && reverse ? ' (Both Sides)' : ''}
              </span>
            )}
          </Button>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-xs text-destructive">{error}</p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-destructive/70 hover:text-destructive mt-1 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && confidence && (
          <div className="space-y-3">
            {/* Confidence Badge */}
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1 text-xs font-medium ${confidence.className}`}>
                {confidence.icon} {confidence.label}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Try different photo
              </button>
            </div>

            {/* Recognized Fields */}
            {result.confidence !== 'unrecognized' && (
              <div className="rounded-lg bg-muted/50 border divide-y divide-border">
                {[
                  { label: 'Denomination', value: result.denomination },
                  { label: 'Year', value: result.year?.toString() },
                  { label: 'Country', value: result.country },
                  { label: 'Currency', value: result.currency },
                  { label: 'Mint Mark', value: result.mintMark },
                  { label: 'Composition', value: result.composition },
                ]
                  .filter((f) => f.value)
                  .map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-medium">{value}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Notes */}
            {result.notes && (
              <p className="text-xs text-muted-foreground italic px-1">{result.notes}</p>
            )}

            {/* Unrecognized message */}
            {result.confidence === 'unrecognized' && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Could not identify this coin. Try a clearer, well-lit photo or enter details manually.
              </p>
            )}

            {/* Apply / Dismiss Buttons */}
            {result.confidence !== 'unrecognized' && (
              <div className="flex gap-2">
                <Button type="button" onClick={handleApply} className="flex-1">
                  Apply to Form
                </Button>
                {onDismiss && (
                  <Button type="button" variant="outline" onClick={onDismiss}>
                    Skip
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
