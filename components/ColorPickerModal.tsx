"use client";

import { useState } from "react";
import { Product, ProductColor } from "@/types";
import { useCart } from "@/app/context/CartContext";
import { X, ShoppingCart, Plus, Minus, Check } from "lucide-react";

// دالة تحديد هل اللون فاتح ولا غامق
function isLightColor(hex: string) {
  if (!hex) return false;
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

interface ColorPickerModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ColorPickerModal({ product, isOpen, onClose }: ColorPickerModalProps) {
  const { addToCart } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    const selectedColorName = product.colors?.[selectedColorIndex]?.name;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, true, selectedColorName);
    }
    // إعادة تعيين القيم والإغلاق
    setQuantity(1);
    setSelectedColorIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-sm rounded-3xl p-6 z-10"
        style={{ background: "rgba(15,15,30,0.98)", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 0 40px rgba(124,58,237,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* زرار الإغلاق */}
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
          <X size={16} className="text-slate-300" />
        </button>

        {/* بيانات المنتج */}
        <div className="flex items-center gap-4 mb-6">
          <img src={product.image || ""} alt={product.name} className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
          <div>
            <h3 className="font-black text-white text-base line-clamp-1">{product.name}</h3>
            <p className="text-purple-400 font-bold text-sm">{product.price} ج</p>
          </div>
        </div>

        {/* اختيار اللون */}
        <div className="mb-5">
          <h4 className="text-sm font-bold text-slate-300 mb-3">
            اختر اللون: 
            <span className="text-purple-400 mr-1">{product.colors?.[selectedColorIndex]?.name}</span>
          </h4>
          <div className="flex items-center gap-3 flex-wrap">
            {product.colors?.map((color: ProductColor, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedColorIndex(index)}
                title={color.name}
                className={`relative w-10 h-10 rounded-full transition-all duration-200 border-2 flex items-center justify-center ${
                  selectedColorIndex === index 
                    ? "border-purple-500 scale-110 shadow-lg shadow-purple-500/30" 
                    : "border-slate-600 hover:border-slate-400"
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {selectedColorIndex === index && (
                  <Check size={18} className={isLightColor(color.hex) ? "text-black" : "text-white"} strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* اختيار الكمية */}
        <div className="flex items-center justify-between mb-6 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <span className="text-sm font-bold text-slate-300">الكمية:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition"
            >
              <Minus size={14} />
            </button>
            <span className="text-lg font-black min-w-[30px] text-center text-white">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
              className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-purple-600 transition"
            >
              <Plus size={14} />
            </button>
          </div>
          <div>
            <span className="font-black text-purple-400 text-sm">{product.price * quantity} ج</span>
          </div>
        </div>

        {/* زرار الإضافة للسلة */}
        <button
          onClick={handleAdd}
          className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm bg-purple-600 hover:bg-purple-700 text-white"
        >
          <ShoppingCart size={18} />
          أضف للسلة
        </button>
      </div>
    </div>
  );
}