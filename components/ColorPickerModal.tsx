"use client";

import { useState } from "react";
import { Product, ProductColor, ProductSize } from "@/types";
import { useCart } from "@/app/context/CartContext";
import { useProductStock } from "../hooks/useProductStock";
import { X, ShoppingCart, Plus, Minus, Check } from "lucide-react";

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
  const { stock, reserved } = useProductStock(product?.id);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const hasSizes = product.hasSizes && product.sizes && product.sizes.length > 0;
  const hasColors = product.hasColors && product.colors && product.colors.length > 0;

  const selectedSize: ProductSize | undefined = hasSizes ? product.sizes?.[selectedSizeIndex] : undefined;
  const finalPrice = selectedSize?.price ? parseFloat(selectedSize.price) : product.price;

  const handleAdd = async () => {
    const selectedColorName = hasColors ? product.colors?.[selectedColorIndex]?.name : undefined;
    const success = await addToCart(product, true, selectedColorName, quantity, selectedSize);

    if (success) {
      setAdded(true);
      setTimeout(() => {
        setQuantity(1);
        setSelectedColorIndex(0);
        setSelectedSizeIndex(0);
        setAdded(false);
        onClose();
      }, 1500);
    }
  };

  const stockAvailable = Math.max(0, stock - reserved);
  const totalStock = stock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* ✅ Modal بأبعاد ثابتة */}
      <div
        className="relative flex flex-col rounded-3xl z-10"
        style={{
          width: "340px",
          height: "480px",
          background: "rgba(15,15,30,0.98)",
          border: "1px solid rgba(124,58,237,0.4)",
          boxShadow: "0 0 40px rgba(124,58,237,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ثابت ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={16} className="text-slate-300" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={product.images?.[0] || product.image || ""}
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm line-clamp-1">{product.name}</h3>
              <p className="text-purple-400 font-bold text-base">{finalPrice} ج</p>
            </div>
          </div>
        </div>

        {/* ── المنطقة القابلة للـ scroll ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

          {/* المقاسات - 4 في الصف */}
          {hasSizes && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-2">اختر المقاس:</h4>
              {/* ✅ grid 4 أعمدة - كل مربع عرضه وارتفاعه متساويين */}
              <div className="grid grid-cols-4 gap-2">
                {product.sizes?.map((size: ProductSize, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSizeIndex(index)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                      selectedSizeIndex === index
                        ? "border-purple-500 bg-purple-600 text-white font-bold"
                        : "border-slate-600 hover:border-slate-400 bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-[11px] font-bold whitespace-nowrap leading-tight">
                      {size.length}×{size.width}
                    </span>
                    <span className="text-[10px] mt-0.5 opacity-80">{size.price}ج</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الألوان */}
          {hasColors && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-2">
                اختر اللون:
                <span className="text-purple-400 mr-1">{product.colors?.[selectedColorIndex]?.name}</span>
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {product.colors?.map((color: ProductColor, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColorIndex(index)}
                    title={color.name}
                    className={`relative w-9 h-9 rounded-full transition-all duration-200 border-2 flex items-center justify-center ${
                      selectedColorIndex === index
                        ? "border-purple-500 scale-110 shadow-lg shadow-purple-500/30"
                        : "border-slate-600 hover:border-slate-400"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selectedColorIndex === index && (
                      <Check
                        size={16}
                        className={isLightColor(color.hex) ? "text-black" : "text-white"}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* المتاح */}
          <div className="text-xs text-slate-400">
            المتاح:
            <span className={`font-bold mr-1 ${stockAvailable > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stockAvailable}
            </span>
            {totalStock !== stockAvailable && totalStock > 0 && (
              <span className="text-slate-500 mr-1">(من أصل {totalStock})</span>
            )}
          </div>
        </div>

        {/* ── Footer ثابت - الكمية وزرار الإضافة في صف واحد ── */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">

            {/* عداد الكمية */}
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-2 py-1.5 border border-slate-700">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center hover:bg-purple-600 transition"
              >
                <Minus size={13} />
              </button>
              <span className="text-sm font-black min-w-[22px] text-center text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
                disabled={quantity >= stockAvailable}
                className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center hover:bg-purple-600 transition disabled:opacity-50"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* السعر الإجمالي */}
            <span className="text-sm font-black text-purple-400 whitespace-nowrap">
              {finalPrice * quantity} ج
            </span>

            {/* زرار أضف للسلة */}
            <button
              onClick={handleAdd}
              disabled={stockAvailable === 0 || added}
              className={`flex-1 h-10 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs ${
                stockAvailable === 0
                  ? "bg-gray-600 text-white opacity-50 cursor-not-allowed"
                  : added
                  ? "bg-green-600 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <ShoppingCart size={15} />
              {stockAvailable === 0 ? "غير متاح" : added ? "✓ تمت!" : "أضف للسلة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}