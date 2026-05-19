// src/types/index.ts

export interface ProductColor {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  category: string;
  barcode: string;
  image?: string;        // ⚠️ أضفنا علامة الاستفهام لجعله اختياري
  images?: string[];
  reserved?: number;
  rating?: number;
  hasColors?: boolean;
  colors?: ProductColor[];
}