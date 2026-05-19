// src/types/index.ts

export interface ProductColor {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id?: string;              // اختياري لأنه يتولد من Firebase
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  category: string;
  barcode: string;
  image: string;
  images?: string[];
  reserved?: number;
  rating?: number;          // ⚠️ هذا السطر ضروري لإصلاح الخطأ
  hasColors?: boolean;
  colors?: ProductColor[];
}