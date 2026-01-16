import sharp from 'sharp';

export async function generateImageHash(buffer: Buffer): Promise<string> {
  const data = await sharp(buffer)
    .resize(32, 32, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const avg = sum / data.length;

  let hash = '';
  for (let i = 0; i < data.length; i++) {
    hash += data[i] >= avg ? '1' : '0';
  }

  return hash;
}

export function calculateHammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  // التأكد من أن الطول متساوي لتجنب الأخطاء
  const length = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}