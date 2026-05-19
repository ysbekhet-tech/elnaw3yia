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
  reserved?: number;
  purchased?: number;
  category: string;
  barcode: string;
  image?: string;
  images?: string[];
  rating?: number;
  hasColors?: boolean;
  colors?: ProductColor[];
  isOffer?: boolean;
  isNew?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  addedAt: number;
}