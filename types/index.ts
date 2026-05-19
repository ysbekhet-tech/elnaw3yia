export interface ProductColor {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  category: string;
  barcode: string;
  image: string;
  images?: string[];        // ✅ جديد: مصفوفة صور إضافية
  reserved?: number;        // ✅ جديد: الكمية المحجوزة
  hasColors?: boolean;
  colors?: ProductColor[];
}