"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const catsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catsList);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">تسوق حسب القسم</h2>
        <Link href="/products" className="text-purple-400 hover:underline text-sm">
          كل الأقسام
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${encodeURIComponent(cat.name)}`}
            className="flex flex-col items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-purple-400 hover:shadow-md transition group cursor-pointer"
          >
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 rounded-full object-cover group-hover:scale-110 transition" />
            ) : (
              <span className="text-4xl group-hover:scale-110 transition">{cat.icon}</span>
            )}
            <span className="text-sm font-bold text-gray-300 text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}