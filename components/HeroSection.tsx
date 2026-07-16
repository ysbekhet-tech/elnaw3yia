"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";

interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  duration: number;
  showImage: boolean;
  isDefault?: boolean;
}

const DEFAULT_SLIDE: Slide = {
  id: "default-hero",
  image: "/images/hero-bg.jpg",
  title: "المكتبة النوعية \n الجودة والسعر",
  description: "كل ما تحتاجه للمكتب والمدرسة والدراسة\nفي مكان واحد بأفضل الأسعار وجودة ممتازة.",
  link: "/products",
  duration: 8,
  showImage: true,
  isDefault: true,
};

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([DEFAULT_SLIDE]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliderEnabled, setIsSliderEnabled] = useState(true);
  const [showDefaultHero, setShowDefaultHero] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // جلب حالة إعدادات السلايدر العامة
    const unsubConfig = onSnapshot(doc(db, "settings", "heroConfig"), (snap) => {
      if (snap.exists()) {
        setIsSliderEnabled(snap.data().isVisible !== false);
        setShowDefaultHero(snap.data().showDefaultHero !== false);
      }
    });

    // جلب شرائح السلايدر النشطة (مجموعة منفصلة عن الإعلانات)
    const q = query(collection(db, "heroSlides"), where("isActive", "==", true));
    const unsubSlides = onSnapshot(q, (snap) => {
      const fetchedSlides = snap.docs.map(d => ({
        id: d.id,
        image: d.data().image || "",
        title: d.data().title || "",
        description: d.data().description || "",
        link: d.data().link || "",
        duration: d.data().duration || 10,
        showImage: d.data().showImage !== false,
      })) as Slide[];
      
      setSlides(fetchedSlides);
    });

    return () => {
      unsubConfig();
      unsubSlides();
    };
  }, [isMounted]);

  // بناء قائمة الشرائح النهائية
  const buildActiveSlides = (): Slide[] => {
    const additionalSlides = isSliderEnabled ? slides : [];
    
    if (showDefaultHero) {
      return [DEFAULT_SLIDE, ...additionalSlides];
    } else if (additionalSlides.length > 0) {
      return additionalSlides;
    } else {
      // لو مفيش شرائح خالص نرجع للأساسي كاحتياطي
      return [DEFAULT_SLIDE];
    }
  };

  const activeSlides = buildActiveSlides();


  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  useEffect(() => {
    if (!isMounted || activeSlides.length <= 1) return;

    const currentDuration = (activeSlides[currentIndex]?.duration || 10) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, currentDuration);

    return () => clearInterval(timer);
  }, [currentIndex, activeSlides.length, activeSlides, isMounted]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  // SSR Safe Fallback (لتجنب الـ Hydration Error)
  if (!isMounted) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-[40px] min-h-[540px]">
          <Image
            src="/images/hero-bg.jpg"
            alt="Background"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-black/30" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.2) 0%, transparent 50%)" }} />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          
          <div className="relative z-10 flex flex-col justify-between h-full p-10 pb-16 min-h-[540px]">
            <div className="w-full text-center pt-8 md:pt-12">
              <h1 className="text-5xl md:text-6xl font-black leading-tight text-white">
                المكتبة النوعية 
                <span className="block gradient-text mt-2">الجودة والسعر</span>
              </h1>
            </div>
            <div className="max-w-xl mt-auto">
              <p className="text-slate-300 leading-loose text-lg">
                كل ما تحتاجه للمكتب والمدرسة والدراسة
                في مكان واحد بأفضل الأسعار وجودة ممتازة.
              </p>
              <div className="flex gap-4 mt-8">
                <div className="gradient-bg text-white px-8 py-4 rounded-2xl font-bold glow-purple text-base inline-block">
                  تسوق الآن
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = activeSlides[currentIndex] || DEFAULT_SLIDE;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-[40px] min-h-[540px] group bg-[#151530]">
        <AnimatePresence>
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            {currentSlide.showImage && currentSlide.image ? (
              <Image
                src={currentSlide.image}
                alt={currentSlide.title || "Banner"}
                fill
                priority={currentIndex === 0}
                className="object-fill"
                sizes="100vw"
              />
            ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-purple-900" />
            )}

            {/* Overlays (نخفيها لو الشريحة صورة فقط بدون نصوص عشان التصميم يبان بوضوح) */}
            {(currentSlide.title || currentSlide.description || currentSlide.isDefault) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-black/30" />
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 60%)" }} />
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.2) 0%, transparent 50%)" }} />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              </>
            )}

            {/* If there is no text but there is a link, make the whole slide clickable */}
            {!(currentSlide.title || currentSlide.description || currentSlide.isDefault) && currentSlide.link && (
              <Link href={currentSlide.link} className="absolute inset-0 z-20 cursor-pointer" />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-10 pb-16 min-h-[540px]">
              
              {currentSlide.isDefault ? (
                <>
                  <div className="w-full text-center pt-8 md:pt-12">
                    <h1 className="text-5xl md:text-6xl font-black leading-tight text-white">
                      المكتبة النوعية 
                      <span className="block gradient-text mt-2">الجودة والسعر</span>
                    </h1>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="max-w-xl">
                    <p className="text-slate-300 leading-loose text-lg whitespace-pre-line">
                      {currentSlide.description}
                    </p>
                    <div className="flex gap-4 mt-8">
                      <Link href="/products" className="gradient-bg hover:opacity-90 transition text-white px-8 py-4 rounded-2xl font-bold glow-purple hover:scale-105 active:scale-95 text-base shadow-lg shadow-purple-500/30 inline-block">
                        تسوق الآن
                      </Link>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="flex flex-col justify-center h-full max-w-2xl mt-10">
                  {(currentSlide.title || currentSlide.description) && (
                    <>
                      {currentSlide.title && (
                        <motion.h2 
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                          className="text-4xl md:text-5xl font-black leading-tight text-white mb-6"
                        >
                          {currentSlide.title}
                        </motion.h2>
                      )}
                      
                      {currentSlide.description && (
                        <motion.p 
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
                          className="text-slate-200 leading-relaxed text-lg mb-8 whitespace-pre-line"
                        >
                          {currentSlide.description}
                        </motion.p>
                      )}
                      
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                        <Link href={currentSlide.link || "/offers"} className="bg-white text-purple-900 hover:bg-slate-100 transition px-8 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 text-base shadow-lg shadow-white/10 inline-block relative z-30">
                          {currentSlide.link ? "تصفح العرض" : "تصفح العروض"}
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        {activeSlides.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              title="السابق"
            >
              <ChevronRight size={24} />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute top-1/2 left-4 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              title="التالي"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    currentIndex === idx 
                      ? "w-8 h-2 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50" 
                      : "w-2 h-2 bg-white/30 hover:bg-white/50"
                  }`}
                  title={`صورة ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
}