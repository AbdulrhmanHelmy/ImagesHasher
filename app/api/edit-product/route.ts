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

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const file = formData.get('file') as File | null;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    let updateData: any = { name, price: parseFloat(price) };

    // لو المستخدم رفع صورة جديدة، بنحدث الهاش والرابط
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageHash = await generateImageHash(buffer);
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'products' }, (error, result) => {
          if (error) reject(error); else resolve(result);
        }).end(buffer);
      });

      updateData.imageUrl = uploadResult.secure_url;
      updateData.imageHash = imageHash;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}