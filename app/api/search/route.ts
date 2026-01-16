import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product, { IProduct } from '@/models/Product';
import { generateImageHash, calculateHammingDistance } from '@/lib/imageHasher';

// واجهة للنتيجة مع المسافة
interface SearchResult extends IProduct {
  distance: number;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const searchHash = await generateImageHash(buffer);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    
    // استخدام lean() لتحويل المستندات لكائنات JS عادية وتجنب مشاكل الـ Types
    const products = await Product.find({}).lean<IProduct[]>();

    const results: SearchResult[] = products.map((p) => {
      return {
        ...p,
        distance: calculateHammingDistance(searchHash, p.imageHash),
      };
    })
    .filter(p => p.distance < 15) // نسبة السماحية
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

export async function GET() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ products });
}