import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recognizeCoin, recognizeCoinBothSides } from '@/services/coinRecognition';
import { RecognitionAPIResponse } from '@/types/recognition';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse<RecognitionAPIResponse>> {
  // Auth check: extract the user's token from the Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { obverseImage, reverseImage, mediaType } = body as {
      obverseImage?: string;
      reverseImage?: string;
      mediaType?: string;
    };

    if (!obverseImage && !reverseImage) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
    type ValidMediaType = (typeof validTypes)[number];
    const resolvedMediaType: ValidMediaType = validTypes.includes(mediaType as ValidMediaType)
      ? (mediaType as ValidMediaType)
      : 'image/jpeg';

    // Validate image sizes
    if (obverseImage && Buffer.from(obverseImage, 'base64').length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Obverse image exceeds 4MB limit' },
        { status: 400 }
      );
    }
    if (reverseImage && Buffer.from(reverseImage, 'base64').length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Reverse image exceeds 4MB limit' },
        { status: 400 }
      );
    }

    let result;

    if (obverseImage && reverseImage) {
      result = await recognizeCoinBothSides(obverseImage, reverseImage, resolvedMediaType);
    } else if (obverseImage) {
      result = await recognizeCoin(obverseImage, resolvedMediaType, 'obverse');
    } else {
      result = await recognizeCoin(reverseImage!, resolvedMediaType, 'reverse');
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Coin recognition error:', error);
    return NextResponse.json(
      { success: false, error: 'Recognition service unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
