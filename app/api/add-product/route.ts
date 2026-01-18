import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import { v2 as cloudinary } from 'cloudinary';
import { generateImageHash } from '@/lib/imageHasher';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const price = formData.get('price') as string | null;

    if (!file || !name || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageHash = await generateImageHash(buffer);

    interface CloudinaryResponse { secure_url: string; }
    
    const uploadResult = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'products' }, (error, result) => {
        if (error || !result) reject(error);
        else resolve(result);
      }).end(buffer);
    });

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    
    const newProduct = await Product.create({
      name,
      price: parseFloat(price),
      imageUrl: uploadResult.secure_url,
      imageHash,
    });

    return NextResponse.json({ success: true, product: newProduct });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}