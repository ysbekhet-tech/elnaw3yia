export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // اختياري
  rating?: number;        // اختياري
  stock?: number;
  barcode?: string;
  category: string;
  image?: string;
  createdAt?: any;
}
export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  paymentMethod: "cash" | "vodafone" | "instapay" | "card";
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  total: number;
  status: "new" | "preparing" | "shipped" | "delivered" | "cancelled";
  createdAt: any;
}