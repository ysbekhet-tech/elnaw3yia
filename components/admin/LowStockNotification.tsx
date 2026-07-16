"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Bell, AlertTriangle, PackageOpen } from "lucide-react";
import Link from "next/link";
import { Product } from "@/types";

export default function LowStockNotification() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    // نجلب المنتجات الفعالة فقط
    const q = query(
      collection(db, "products"),
      where("isActive", "!=", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      const alerts = allProducts.filter((product) => {
        // نتجاهل المنتجات اللي مش متحدد لها minStock
        if (typeof product.minStock !== "number" || product.minStock <= 0) {
          return false;
        }

        const availableStock = Math.max(0, (product.stock || 0) - (product.reserved || 0));
        
        return availableStock <= product.minStock;
      });

      setLowStockProducts(alerts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 shadow-sm border ${
          isOpen 
            ? "bg-purple-50 border-purple-200 text-purple-700 shadow-purple-100" 
            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <Bell size={26} strokeWidth={2.5} className={lowStockProducts.length > 0 ? "animate-pulse text-red-500" : ""} />
        
        {/* الشارة الحمراء للعدد */}
        {lowStockProducts.length > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs font-black flex items-center justify-center rounded-full border-[3px] border-white shadow-md">
            {lowStockProducts.length > 99 ? "99+" : lowStockProducts.length}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة (Dropdown) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 mt-3 w-[380px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
          style={{ transformOrigin: "top left" }}
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <AlertTriangle size={22} className="text-red-500" strokeWidth={2.5} />
              تنبيهات المخزون
            </h3>
            <span className="text-sm font-black bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
              {lowStockProducts.length} منتج
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-3">
                <PackageOpen size={40} className="text-slate-300" strokeWidth={1.5} />
                <p className="text-base font-bold text-slate-400">لا توجد منتجات ناقصة حالياً</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {lowStockProducts.map((product) => {
                  const available = Math.max(0, (product.stock || 0) - (product.reserved || 0));
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/admin/products?search=${encodeURIComponent(product.name)}`}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col p-4 bg-white hover:bg-red-50/50 rounded-2xl transition-all border border-slate-100 hover:border-red-200 shadow-sm hover:shadow-md"
                      >
                        <span className="text-base font-black text-slate-900 line-clamp-1 mb-2">
                          {product.name}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 font-medium">
                            الحد الأدنى: <span className="font-black text-slate-700">{product.minStock}</span>
                          </span>
                          <span className={`text-sm font-black px-3 py-1 rounded-lg border ${
                            available === 0 
                              ? "bg-red-100 text-red-700 border-red-200" 
                              : "bg-orange-100 text-orange-700 border-orange-200"
                          }`}>
                            المتاح: {available}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <Link 
              href="/admin/products" 
              onClick={() => setIsOpen(false)}
              className="inline-block px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm"
            >
              إدارة جميع المنتجات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
