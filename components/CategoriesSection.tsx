"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView, Variants } from "framer-motion";
// ✅ استخدام CategoriesContext المشترك بدل onSnapshot منفصل
import { useCategories } from "@/app/context/CategoriesContext";

export default function CategoriesSection() {
  // ✅ البيانات جاية من CategoriesProvider — مفيش listener جديد بيتفتح هنا
  const { categories } = useCategories();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 relative" ref={containerRef}>
      {/* Background ambient light for the section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[150px] bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between mb-8 relative z-10"
      >
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          تسوق حسب القسم
          <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        </h2>
        <Link href="/products" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors text-sm font-bold bg-purple-500/10 px-4 py-2 rounded-xl">
          كل الأقسام
        </Link>
      </motion.div>
      
      <div className="relative group/slider">
        
        {/* تأثير التلاشي الزجاجي الحديث باستخدام CSS Mask (أشيك وأكثر عصرية) */}
        
        {/* زرار الرجوع لليمين */}
        <button 
          onClick={() => scroll("right")}
          className="absolute start-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white/70 flex items-center justify-center hover:bg-purple-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg border border-white/5 opacity-0 group-hover/slider:opacity-100"
          aria-label="Scroll Right"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        {/* زرار التقدم لليسار */}
        <button 
          onClick={() => scroll("left")}
          className="absolute end-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white/70 flex items-center justify-center hover:bg-purple-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg border border-white/5 opacity-0 group-hover/slider:opacity-100"
          aria-label="Scroll Left"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* صف الأقسام */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          ref={scrollContainerRef}
          className={`flex items-center gap-5 overflow-x-auto scroll-smooth py-6 px-4 relative z-0 ${categories.length <= 5 ? 'justify-center' : ''}`}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
          }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants} className="flex-shrink-0">
              <Link
                href={`/category/${encodeURIComponent(cat.name)}`}
                className="relative flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-3xl p-3 transition-all duration-500 group/cat cursor-pointer w-[110px] h-[130px] overflow-hidden backdrop-blur-md hover:-translate-y-2 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.25)]"
              >
                {/* تأثير الإضاءة المتحركة داخل البطاقة عند الـ Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover/cat:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700/50 shadow-inner group-hover/cat:shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover/cat:border-purple-500/50 transition-all duration-500">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full rounded-full object-cover group-hover/cat:scale-110 transition-transform duration-500" />
                  ) : (
                    <span className="text-3xl group-hover/cat:scale-110 group-hover/cat:-translate-y-1 transition-all duration-500 drop-shadow-md">{cat.icon}</span>
                  )}
                </div>
                
                <span className="text-[12px] font-extrabold text-slate-300 text-center w-full line-clamp-2 group-hover/cat:text-white transition-colors duration-300 relative z-10">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}