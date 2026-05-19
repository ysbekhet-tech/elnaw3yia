export interface ProductColor {
  name: string;
  hex: string;
  image: string;
}

// ✅ interface جديد للمقاسات
export interface ProductSize {
  length: string;
  width: string;
  price: string;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  reserved?: number;
  purchased?: number;
  category: string;
  barcode: string;
  image?: string;
  images?: string[];
  rating?: number;
  hasColors?: boolean;
  colors?: ProductColor[];
  // ✅ حقول المقاسات الجديدة
  hasSizes?: boolean;
  sizes?: ProductSize[];
  isOffer?: boolean;
  isNew?: boolean;
}

// ✅ تحديث CartItem عشان يدعم المقاسات
export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: ProductSize; // المقاس المختار
  addedAt: number;
}