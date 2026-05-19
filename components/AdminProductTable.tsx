'use client';

import { Product } from '@/types';
import { useState } from 'react';
import { Trash2, Edit2, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface AdminProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEditPrice: (product: Product) => void;
  loading?: boolean;
}

export default function AdminProductTable({
  products,
  onDelete,
  onEditPrice,
  loading = false,
}: AdminProductTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('خطأ في الحذف:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7c3aed" }}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(124,58,237,0.2)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: "rgba(124,58,237,0.15)", borderBottom: "1px solid rgba(124,58,237,0.25)" }}>
            <th className="px-4 py-3.5 text-center text-sm font-black text-slate-200 w-24">الصورة</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-200">الاسم</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-200">السعر</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-200">الكمية</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-200">الفئة</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-200">الباركود</th>
            <th className="px-4 py-3.5 text-center text-sm font-black text-slate-200">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-slate-400 font-bold">لا توجد منتجات</p>
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const imageUrl = Array.isArray(product.images) && product.images.length > 0 
                ? product.images[0] 
                : (product as any).image || '';

              const stock = product.stock || 0;
              const minStock = product.minStock || 5; // ✅ الحد الأدنى للتنبيه
              const isLowStock = stock > 0 && stock <= minStock; // ✅ هل وصل للحد الأدنى؟
              const isOutOfStock = stock === 0;

              let stockBadgeStyle: React.CSSProperties = {};
              let stockText = `${stock}`;
              let StockIcon: any = null;

              if (isOutOfStock) {
                stockBadgeStyle = { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" };
                stockText = "نفذت الكمية";
              } else if (isLowStock) {
                // ✅ لون أحمر للتنبيه عند قرب الانتهاء
                stockBadgeStyle = { background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.5)" };
                stockText = `${stock} (قرب ينتهي!)`;
                StockIcon = <AlertTriangle size={12} className="ml-1" />;
              } else if (stock < 15) {
                stockBadgeStyle = { background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.4)" };
                stockText = `${stock} (متوسط)`;
              } else {
                stockBadgeStyle = { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" };
                stockText = `${stock} (متوفر)`;
                StockIcon = <CheckCircle size={12} className="ml-1" />;
              }

              return (
                <tr
                  key={product.id}
                  className="border-t transition hover:bg-purple-500/5"
                  style={{ borderColor: "rgba(124,58,237,0.1)" }}
                >
                  <td className="px-4 py-3.5 text-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm mx-auto" 
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(124,58,237,0.3)" }}
                      >
                        <Package size={20} className="text-slate-600" />
                      </div>
                    )}
                  </td>

                  {/* ✅ اسم المنتج مع تنبيه أحمر لو قرب ينتهي */}
                  <td className="px-4 py-3.5 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      {isLowStock && (
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                          style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)" }}
                          title={`الكمية وصلت للحد الأدنى (${minStock})`}
                        >
                          <AlertTriangle size={10} className="text-red-400" />
                        </span>
                      )}
                      <span className={isLowStock ? "text-red-400" : "text-white"}>
                        {product.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm">
                    <span
                      className="font-black px-2 py-1 rounded-lg text-xs"
                      style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                    >
                      {product.price} جنيه
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-sm">
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={stockBadgeStyle}
                    >
                      {stockText}
                      {StockIcon}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-300 text-sm">{product.category}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{product.barcode}</td>

                  <td className="px-4 py-3.5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEditPrice(product)}
                        className="p-2 rounded-xl transition hover:scale-110"
                        style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
                        title="تعديل السعر"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (!product.id) {
                            console.error('Product ID is undefined');
                            return;
                          }
                          handleDelete(product.id);
                        }}
                        className="p-2 rounded-xl transition hover:scale-110 min-w-[36px]"
                        style={
                          deleteConfirm === product.id
                            ? { background: "rgba(239,68,68,0.8)", color: "white", border: "1px solid rgba(239,68,68,0.8)" }
                            : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                        }
                        title="حذف"
                      >
                        {deleteConfirm === product.id ? (
                          <span className="text-xs font-black px-1">تأكيد</span>
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}