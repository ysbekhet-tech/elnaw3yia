"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const catsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catsList);
    });
    return () => unsubscribe();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">تسوق حسب القسم</h2>
        <Link href="/products" className="text-purple-400 hover:underline text-sm">
          كل الأقسام
        </Link>
      </div>
      
      <div className="relative group">
        
        {/* تأثير التلاشي (Fade) على الجوانب */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none rounded-l-xl"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none rounded-r-xl"></div>
        
        {/* زرار السحب لشمال - يأشر شمال */}
        <button 
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white/70 flex items-center justify-center hover:bg-purple-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg border border-white/5"
          aria-label="Scroll Left"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* زرار السحب ليمين - يأشر يمين */}
        <button 
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white/70 flex items-center justify-center hover:bg-purple-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg border border-white/5"
          aria-label="Scroll Right"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        {/* صف الأقسام */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-4 overflow-x-auto scroll-smooth py-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center justify-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 hover:border-purple-500 hover:bg-slate-800 transition-all duration-300 group/cat cursor-pointer flex-shrink-0 w-[110px] h-[130px] backdrop-blur-sm"
            >
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} className="w-14 h-14 rounded-full object-cover group-hover/cat:scale-110 transition-transform duration-300 ring-2 ring-slate-700 group-hover/cat:ring-purple-500" />
              ) : (
                <span className="text-3xl group-hover/cat:scale-110 transition-transform duration-300">{cat.icon}</span>
              )}
              <span className="text-[11px] leading-tight font-bold text-gray-300 text-center w-full line-clamp-2 group-hover/cat:text-white transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}