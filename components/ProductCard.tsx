"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, ShoppingCart, Star, Plus, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";
import { useCart } from "@/app/context/CartContext";
import { useState, useEffect, useCallback } from "react";
import ColorPickerModal from "./ColorPickerModal";

type ViewMode = "grid" | "compact" | "list";

export default function ProductCard({ product, viewMode = "grid" }: { product: Product; viewMode?: ViewMode }) {
  const { addToCart } = useCart();
  
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
    : (product.image ? [product.image] : ["/placeholder.jpg"]);

  const stock = product.stock || 0;
  const reserved = product.reserved || 0;
  const stockAvailable = Math.max(0, stock - reserved);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

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

  if (viewMode === "list") {
    return (
      <>
        <div
          className="rounded-2xl overflow-hidden flex flex-row h-40 relative"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(124,58,237,0.2)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          {/* ✅ تعديل: استخدام aspect-square للمحافظة على شكل مربع موحد */}
          <Link href={`/products/${product.id}`} className="block relative w-32 aspect-square flex-shrink-0 overflow-hidden bg-slate-900/40">
            <Image 
              src={allImages[0]} 
              alt={product.name} 
              fill
              sizes="128px"
              className="object-contain p-2"
              style={{ maxWidth: '100%', maxHeight: '100%' }} // لإصلاح تحذير Next.js
              loading="lazy"
            />
            {discount > 0 && (
              <span className="absolute top-2 right-2 gradient-bg text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                -{discount}%
              </span>
            )}
          </Link>

          <div className="p-3 flex flex-col flex-1 overflow-hidden">
            <Link href={`/category/${encodeURIComponent(product.category)}`} className="text-[10px] font-bold gradient-text mb-0.5 hover:opacity-80 inline-block transition">
              {product.category}
            </Link>
            <Link href={`/products/${product.id}`}>
              <h3 className="font-bold text-sm text-slate-200 hover:text-purple-400 transition line-clamp-1">{product.name}</h3>
            </Link>
            
            <div className="flex items-center gap-1 mt-1">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-slate-500">{product.rating || 4.5}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className={`text-[10px] font-bold ${stockAvailable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                متاح: {stockAvailable}
              </span>
            </div>

            <div className="flex items-end justify-between mt-auto pt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white">{product.price} ج</span>
                {product.originalPrice && <span className="text-slate-500 line-through text-[10px]">{product.originalPrice} ج</span>}
              </div>

              <div className="flex items-center gap-2">
                {!isMultiColor && (
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-purple-500/20">
                    <button onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.max(1, q - 1)); }} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-purple-500/20"><Minus size={11} className="text-slate-300" /></button>
                    <span className="text-xs font-black text-white min-w-[16px] text-center">{quantity}</span>
                    <button onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.min(q + 1, stockAvailable)); }} disabled={quantity >= stockAvailable} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-purple-500/20"><Plus size={11} className="text-slate-300" /></button>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={stockAvailable === 0}
                  className={`h-8 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    stockAvailable === 0 ? "bg-gray-600 cursor-not-allowed opacity-50" : added ? "bg-green-500 text-white" : "gradient-bg text-white glow-purple"
                  }`}
                >
                  <ShoppingCart size={13} />
                  {stockAvailable === 0 ? "غير متاح" : added ? "✓ تمت" : "أضف"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <ColorPickerModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  const isCompact = viewMode === "compact";

  return (
    <>
      <motion.div
        whileHover={{ y: isCompact ? -3 : -5 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden flex flex-col h-full relative"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* ✅ تعديل: استخدام aspect-square بدلاً من الارتفاع الثابت، وتغيير الخلفية لتتناسب مع البطاقة */}
        <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-square bg-slate-900/40">
          
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full"
            >
              {/* ✅ إصلاح مشكلة التصغير والتحذير */}
              <Image
                src={allImages[currentImageIndex]}
                alt={product.name}
                fill
                sizes={isCompact ? "(max-width: 640px) 50vw, 20vw" : "(max-width: 768px) 50vw, 25vw"}
                className="object-contain p-4"
                style={{ maxWidth: '100%', maxHeight: '100%' }} // إصلاح تحذير الـ Next.js
                priority={currentImageIndex === 0}
                loading={currentImageIndex === 0 ? "eager" : "lazy"}
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {allImages.length > 1 && !isCompact && (
            <>
              <button onClick={prevImage} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition z-10 border border-white/10">
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
              <button onClick={nextImage} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition z-10 border border-white/10">
                <ChevronLeft size={14} className="rtl:rotate-180" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                {allImages.map((_, idx) => (
                  <button key={idx} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }} className={`h-1 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'w-3 bg-white' : 'w-1 bg-white/50'}`} />
                ))}
              </div>
            </>
          )}

          {discount > 0 && (
            <span className="absolute top-2 right-2 gradient-bg text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">-{discount}%</span>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Heart size={13} className="text-white" />
            </button>
            {!isCompact && (
              <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Eye size={13} className="text-white" />
              </button>
            )}
          </div>
        </Link>

        <div className={`flex flex-col flex-1 ${isCompact ? "p-2.5" : "p-3.5"}`}>
          <Link href={`/category/${encodeURIComponent(product.category)}`} className="text-[10px] font-bold gradient-text mb-0.5 hover:opacity-80 inline-block transition">
            {product.category}
          </Link>

          <Link href={`/products/${product.id}`}>
            <h3 className={`font-bold text-slate-200 leading-relaxed line-clamp-2 hover:text-purple-400 transition ${isCompact ? "text-xs" : "text-sm"}`}>
              {product.name}
            </h3>
          </Link>

          {!isCompact && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-slate-500">{product.rating || 4.5}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`${isCompact ? "text-sm" : "text-base"} font-black text-white`}>{product.price} ج</span>
            {product.originalPrice && <span className="text-slate-500 line-through text-[10px]">{product.originalPrice} ج</span>}
          </div>

          {!isCompact && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              المتاح: <span className={`font-bold ${stockAvailable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stockAvailable}</span>
              {stock !== stockAvailable && stock > 0 && <span className="text-slate-500 text-[8px] mr-0.5">(من أصل {stock})</span>}
            </div>
          )}

          <div className="mt-auto pt-2">
            {!isMultiColor && !isCompact ? (
              <div className="flex items-center gap-2 mb-2">
                <button onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.max(1, q - 1)); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-500/20 transition" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Minus size={11} className="text-slate-300" />
                </button>
                <span className="text-sm font-black text-white min-w-[20px] text-center">{quantity}</span>
                <button onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.min(q + 1, stockAvailable)); }} disabled={quantity >= stockAvailable} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-500/20 transition disabled:opacity-50" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Plus size={11} className="text-slate-300" />
                </button>
                <span className="text-[10px] text-slate-500">= <span className="font-bold gradient-text">{product.price * quantity} ج</span></span>
              </div>
            ) : !isCompact && <div className="h-[28px] mb-2"></div>}

            <button
              onClick={handleAddToCart}
              disabled={stockAvailable === 0}
              className={`w-full ${isCompact ? "h-8 rounded-lg text-xs" : "h-9 rounded-xl text-sm"} font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                stockAvailable === 0
                  ? "bg-gray-600 text-white cursor-not-allowed opacity-50"
                  : added && !isMultiColor
                  ? "bg-green-500 text-white"
                  : "gradient-bg text-white hover:opacity-90 glow-purple"
              }`}
            >
              <ShoppingCart size={14} />
              {stockAvailable === 0 ? "غير متاح" : added && !isMultiColor ? "✓ تمت" : isCompact ? "أضف" : "أضف للسلة"}
            </button>
          </div>
        </div>
      </motion.div>

      <ColorPickerModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}