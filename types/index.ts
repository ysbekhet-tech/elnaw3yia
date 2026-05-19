export interface ProductColor {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id?: string;              // جعلناه اختياري لأنه يتم توليده من Firebase
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  category: string;
  barcode: string;
  image: string;
  images?: string[];        // مصفوفة صور إضافية
  reserved?: number;        // الكمية المحجوزة
  rating?: number;          // ⚠️ هذا هو السطر الذي كان مفقوداً وسبب الخطأ
  hasColors?: boolean;
  colors?: ProductColor[];
}