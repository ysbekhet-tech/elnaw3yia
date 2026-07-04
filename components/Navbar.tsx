"use client";

import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, X, LayoutGrid } from "lucide-react"; // ضفنا LayoutGrid
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { cartCount, openCart } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoriesBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const catsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catsList);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setOpen(false);
      setCategoriesOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoriesOpen &&
        categoriesRef.current &&
        !categoriesRef.current.contains(e.target as Node) &&
        categoriesBtnRef.current &&
        !categoriesBtnRef.current.contains(e.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [categoriesOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        open &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleScroll() {
      if (categoriesOpen) setCategoriesOpen(false);
      if (open) setOpen(false);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoriesOpen, open]);

  return (
    <header className="sticky top-0 z-50">

      <div
        className="glass border-b"
        style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(5,5,16,0.85)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-5">

          <Link
            href="/"
            className="flex flex-row items-center gap-2 leading-none group"
            onClick={() => { setOpen(false); setCategoriesOpen(false); }}
          >
            <span className="text-2xl font-black text-white group-hover:text-purple-300 transition">المكتبة</span>
            <span className="text-2xl font-black gradient-text">النوعية</span>
          </Link>

          <form 
            onSubmit={handleSearch} 
            className="hidden md:flex flex-1 items-center rounded-2xl overflow-hidden border"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(124,58,237,0.3)" }}
          >
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-5 py-3 outline-none text-sm text-slate-300 placeholder-slate-500"
            />
            <button type="submit" className="gradient-bg px-5 py-3 text-white hover:opacity-90 transition">
              <Search size={18} />
            </button>
          </form>

          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center transition hover:scale-110"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Heart size={19} className="text-slate-300" />
            </button>

            <button
              onClick={openCart}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition hover:scale-110"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ShoppingCart size={19} className="text-slate-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full gradient-bg text-white text-[10px] flex items-center justify-center font-bold pulse-glow">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center transition hover:scale-110"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <User size={19} className="text-slate-300" />
            </button>

            <button
              ref={menuBtnRef}
              onClick={() => setOpen(!open)}
              className="md:hidden w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {open ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>

        <div className="hidden md:block border-t" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-12 text-sm font-semibold text-slate-400">

            <div className="relative" ref={categoriesRef}>
              <button
                ref={categoriesBtnRef}
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl transition hover:text-purple-400 hover:bg-purple-500/10"
              >
                كل الأقسام
                <ChevronDown size={15} className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div
                  className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl w-56 z-50 overflow-hidden"
                  style={{
                    background: "rgba(10,10,25,0.98)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    boxShadow: "0 25px 50px rgba(124,58,237,0.2)"
                  }}
                >
                  {/* لينك جميع المنتجات المضاف هنا */}
                  <Link
                    href="/products"
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 hover:text-purple-400 transition border-b text-slate-300 font-bold"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <LayoutGrid size={16} />
                    <span>جميع المنتجات</span>
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.name}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 hover:text-purple-400 transition border-b text-slate-300"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <span className="text-base">{cat.icon}</span>
                      )}
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <div className="px-4 py-3 text-slate-500 text-xs">لا توجد أقسام بعد</div>
                  )}
                </div>
              )}
            </div>

            {/* تم حذف "المنتجات" من هنا */}
            {[{ name: "الرئيسية", href: "/" },
              { name: "العروض", href: "/offers" },
              { name: "الجديد", href: "/new" },
              { name: "من نحن", href: "/about" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className="px-4 py-2 rounded-xl hover:text-purple-400 hover:bg-purple-500/10 transition"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div ref={mobileMenuRef}>
          {open && (
            <div className="md:hidden border-t" style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(5,5,16,0.98)" }}>

              <form onSubmit={handleSearch} className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center rounded-xl overflow-hidden border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(124,58,237,0.3)" }}>
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm text-slate-300 placeholder-slate-500"
                  />
                  <button type="submit" className="gradient-bg px-4 py-2.5 text-white hover:opacity-90 transition">
                    <Search size={16} />
                  </button>
                </div>
              </form>

              {/* لينك جميع المنتجات في الموبايل */}
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 border-b text-sm font-bold transition"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <LayoutGrid size={16} />
                <span>جميع المنتجات</span>
              </Link>

              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.name}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 border-b text-sm transition"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-base">{cat.icon}</span>
                  )}
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}