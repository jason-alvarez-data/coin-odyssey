import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Logger } from './logger';

const TARGET_BYTES = 500 * 1024;
const MAX_EDGE_PX = 1600;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
}

async function getSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? info.size : 0;
}

export async function compressForUpload(sourceUri: string): Promise<CompressedImage> {
  let lastResult = await manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_EDGE_PX } }],
    { compress: QUALITY_STEPS[0], format: SaveFormat.JPEG }
  );
  let size = await getSize(lastResult.uri);

  for (let i = 1; i < QUALITY_STEPS.length && size > TARGET_BYTES; i++) {
    lastResult = await manipulateAsync(
      sourceUri,
      [{ resize: { width: MAX_EDGE_PX } }],
      { compress: QUALITY_STEPS[i], format: SaveFormat.JPEG }
    );
    size = await getSize(lastResult.uri);
  }

  Logger.info('Image compressed for upload', {
    sizeKB: Math.round(size / 1024),
    width: lastResult.width,
    height: lastResult.height,
  });

  return {
    uri: lastResult.uri,
    width: lastResult.width,
    height: lastResult.height,
    sizeBytes: size,
  };
}
