export interface ProductSize {
  length: string;
  width: string;
  price: string;
}

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
  minStock?: number;
  countryOfOrigin?: string;
  reserved?: number;
  purchased?: number;
  category: string;
  barcode: string;
  image?: string;
  images?: string[];
  rating?: number;
  hasColors?: boolean;
  colors?: ProductColor[];
  hasSizes?: boolean;
  sizes?: ProductSize[];
  isOffer?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  createdAt?: Date | string | any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: ProductSize;
  addedAt: number;
}

// ✅ Cloudinary types
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}