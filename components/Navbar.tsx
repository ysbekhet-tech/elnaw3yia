"use client";

import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, X, LayoutGrid } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
// ✅ استخدام CategoriesContext المشترك بدل onSnapshot منفصل
import { useCategories } from "@/app/context/CategoriesContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { cartCount, openCart } = useCart();

  // ✅ البيانات جاية من CategoriesContext — مش بيفتح listener جديد
  const { categories } = useCategories();

  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoriesBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

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

  // ✅ تم إزالة الـ scroll listener عشان مايمنعش الـ scroll جوه القائمة

  return (
    <header className="sticky top-0 z-50">

      <div
        className="glass border-b"
        style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(255,255,255,0.92)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-5">

          <Link
            href="/"
            className="flex flex-row items-center gap-2 leading-none group"
            onClick={() => { setOpen(false); setCategoriesOpen(false); }}
          >
            <span className="text-2xl font-black text-slate-800 group-hover:text-purple-600 transition">المكتبة</span>
            <span className="text-2xl font-black gradient-text">النوعية</span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 items-center rounded-2xl overflow-hidden border"
            style={{ background: "#f8fafc", borderColor: "rgba(124,58,237,0.3)" }}
          >
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-5 py-3 outline-none text-sm text-slate-800 placeholder-slate-400"
            />
            <button type="submit" className="gradient-bg px-5 py-3 text-white hover:opacity-90 transition">
              <Search size={18} />
            </button>
          </form>

          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center transition hover:scale-110 hover:bg-slate-100"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <Heart size={19} className="text-slate-700" />
            </button>

            <button
              onClick={openCart}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition hover:scale-110 hover:bg-slate-100"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <ShoppingCart size={19} className="text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full gradient-bg text-white text-[10px] flex items-center justify-center font-bold pulse-glow">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center transition hover:scale-110 hover:bg-slate-100"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <User size={19} className="text-slate-700" />
            </button>

            <button
              ref={menuBtnRef}
              onClick={() => setOpen(!open)}
              className="md:hidden w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {open ? <X size={20} className="text-slate-800" /> : <Menu size={20} className="text-slate-800" />}
            </button>
          </div>
        </div>

        <div className="hidden md:block border-t" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-12 text-sm font-semibold text-slate-600">

            <div className="relative" ref={categoriesRef}>
              <button
                ref={categoriesBtnRef}
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl transition hover:text-purple-600 hover:bg-purple-500/10"
              >
                كل الأقسام
                <ChevronDown size={15} className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div
                  className="absolute top-full right-0 mt-0 z-50 rounded-b-2xl"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(124,58,237,0.15)",
                    borderTop: "none",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
                    width: "min(860px, 90vw)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
                    <span className="text-sm font-black text-slate-500 uppercase tracking-wider">تصفح الأقسام</span>
                    <Link
                      href="/products"
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition"
                    >
                      <LayoutGrid size={13} />
                      جميع المنتجات
                    </Link>
                  </div>

                  {/* Mega Grid — قابل للـ scroll */}
                  <div
                    className="p-4 grid grid-cols-6 gap-1 overflow-y-auto"
                    style={{ maxHeight: "55vh", scrollbarWidth: "thin", scrollbarColor: "rgba(124,58,237,0.3) transparent" }}
                  >
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.name}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition group text-center"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 group-hover:bg-purple-100 transition">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <span className="text-xl">{cat.icon}</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-purple-700 transition line-clamp-2 leading-tight">{cat.name}</span>
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <div className="col-span-6 px-4 py-6 text-center text-slate-400 text-sm">لا توجد أقسام بعد</div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 border-t flex justify-center" style={{ borderColor: "rgba(124,58,237,0.08)", background: "#fafafa", borderRadius: "0 0 16px 16px" }}>
                    <Link
                      href="/products"
                      onClick={() => setCategoriesOpen(false)}
                      className="text-xs text-slate-500 hover:text-purple-600 transition font-semibold"
                    >
                      عرض كل المنتجات ({categories.length} قسم)
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {[{ name: "الرئيسية", href: "/" },
              { name: "العروض", href: "/offers" },
              { name: "الجديد", href: "/new" },
              { name: "من نحن", href: "/about" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setCategoriesOpen(false)}
                className="px-4 py-2 rounded-xl hover:text-purple-600 hover:bg-purple-500/10 transition"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div ref={mobileMenuRef}>
          {open && (
            <div className="md:hidden border-t flex flex-col" style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(255,255,255,0.98)", maxHeight: "80vh" }}>

              <form onSubmit={handleSearch} className="p-4 border-b flex-shrink-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                <div className="flex items-center rounded-xl overflow-hidden border" style={{ background: "#f8fafc", borderColor: "rgba(124,58,237,0.3)" }}>
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm text-slate-800 placeholder-slate-400"
                  />
                  <button type="submit" className="gradient-bg px-4 py-2.5 text-white hover:opacity-90 transition">
                    <Search size={16} />
                  </button>
                </div>
              </form>

              <div className="overflow-y-auto">
                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:text-purple-600 hover:bg-purple-500/10 border-b text-sm font-bold transition"
                  style={{ borderColor: "rgba(0,0,0,0.05)" }}
                >
                  <LayoutGrid size={16} />
                  <span>جميع المنتجات</span>
                </Link>

                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.name}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-purple-600 hover:bg-purple-500/10 border-b text-sm transition"
                    style={{ borderColor: "rgba(0,0,0,0.05)" }}
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
            </div>
          )}
        </div>

      </div>
    </header>
  );
}