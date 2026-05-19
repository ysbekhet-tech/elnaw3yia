"use client";

import Link from "next/link";
import { Heart, Eye, ShoppingCart, Star, Plus, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";
import { useCart } from "@/app/context/CartContext";
import { useProductStock } from "../hooks/useProductStock";
import { useState, useEffect } from "react";
import ColorPickerModal from "./ColorPickerModal";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { stock, reserved } = useProductStock(product.id);
  
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const discount = product.originalPrice ? Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  ) : 0;

  const isMultiColor = product.hasColors && product.colors && product.colors.length > 0;

  const allImages = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ["https://via.placeholder.com/400"]);

  // ✅ المتاح = stock - reserved (محدث لحظياً من Firebase)
  const stockAvailable = Math.max(0, stock - reserved);
  const totalStock = stock;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantity > stockAvailable) {
      alert(`المتاح فقط ${stockAvailable} من هذا المنتج`);
      setQuantity(stockAvailable);
      return;
    }

    if (isMultiColor) {
      setIsModalOpen(true);
      return;
    }

    const success = await addToCart(product, true, undefined, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setQuantity(1);
      }, 2000);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] overflow-hidden flex flex-col h-full relative"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          transition: "box-shadow 0.3s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(124,58,237,0.25)";
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(124,58,237,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(124,58,237,0.2)";
        }}
      >
        <Link href={`/products/${product.id}`} className="block relative h-56 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          
          <AnimatePresence mode='wait'>
            <motion.img
              key={currentImageIndex}
              src={allImages[currentImageIndex]}
              alt={product.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition z-10 border border-white/10"
              >
                <ChevronRight size={18} className="rtl:rotate-180" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition z-10 border border-white/10"
              >
                <ChevronLeft size={18} className="rtl:rotate-180" />
              </button>
              
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      currentImageIndex === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {discount > 0 && (
            <span className="absolute top-4 right-4 gradient-bg text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              -{discount}%
            </span>
          )}

          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Heart size={16} className="text-white" />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Eye size={16} className="text-white" />
            </button>
          </div>
        </Link>

        <div className="p-5 flex flex-col flex-1">
          <Link
            href={`/category/${encodeURIComponent(product.category)}`}
            className="text-xs font-bold gradient-text mb-2 hover:opacity-80 inline-block transition"
            onClick={(e) => e.stopPropagation()}
          >
            {product.category}
          </Link>

          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-base text-slate-200 leading-relaxed line-clamp-2 hover:text-purple-400 transition">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mt-2">
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-slate-500">{product.rating || 4.5}</span>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xl font-black text-white">{product.price} ج</span>
            {product.originalPrice && (
              <span className="text-slate-500 line-through text-sm">{product.originalPrice} ج</span>
            )}
          </div>

          <div className="text-xs text-slate-400 mt-1">
            المتاح: 
            <span className={`font-bold ${stockAvailable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stockAvailable}
            </span>
            {totalStock !== stockAvailable && totalStock > 0 && (
              <span className="text-slate-500 text-[10px] mr-1">
                (من أصل {totalStock})
              </span>
            )}
          </div>

          <div className="mt-auto pt-3">
            {!isMultiColor ? (
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.max(1, q - 1)); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-purple-500/20 transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  <Minus size={13} className="text-slate-300" />
                </button>
                <span className="text-base font-black text-white min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    setQuantity((q) => Math.min(q + 1, stockAvailable));
                  }}
                  disabled={quantity >= stockAvailable}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-purple-500/20 transition disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  <Plus size={13} className="text-slate-300" />
                </button>
                <span className="text-xs text-slate-500">
                  = <span className="font-bold gradient-text">{product.price * quantity} ج</span>
                </span>
              </div>
            ) : (
              <div className="h-[35px] mb-3"></div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={stockAvailable === 0}
              className={`w-full h-11 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                stockAvailable === 0
                  ? "bg-gray-600 text-white cursor-not-allowed opacity-50"
                  : added && !isMultiColor
                  ? "bg-green-500 text-white"
                  : "gradient-bg text-white hover:opacity-90 glow-purple"
              }`}
            >
              <ShoppingCart size={17} />
              {stockAvailable === 0 
                ? "المنتج غير متاح" 
                : added && !isMultiColor 
                ? "✓ تمت الإضافة!" 
                : "أضف للسلة"}
            </button>
          </div>
        </div>
      </motion.div>

      <ColorPickerModal 
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}