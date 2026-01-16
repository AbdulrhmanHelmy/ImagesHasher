import mongoose, { Schema, model, models, Model } from 'mongoose';

// تعريف شكل البيانات (Interface)
export interface IProduct {
  _id?: string;
  name: string;
  price: number;
  imageUrl: string;
  imageHash: string;
  createdAt?: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: false, default: "بدون اسم" },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  imageHash: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

// منع خطأ OverwriteModelError
const Product: Model<IProduct> = models.Product || model<IProduct>('Product', ProductSchema);

export default Product;