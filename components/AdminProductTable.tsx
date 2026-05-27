'use client';

import { Product } from '@/types';
import { useState } from 'react';
import { Trash2, Edit2, Package, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface AdminProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onToggleVisibility: (id: string, isActive: boolean) => void;
  loading?: boolean;
}

export default function AdminProductTable({
  products,
  onDelete,
  onEdit,
  onToggleVisibility,
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3.5 text-center text-sm font-black text-slate-600 w-24">الصورة</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-600">الاسم</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-600">السعر</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-600">الكمية</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-600">الفئة</th>
            <th className="px-4 py-3.5 text-right text-sm font-black text-slate-600">الباركود</th>
            <th className="px-4 py-3.5 text-center text-sm font-black text-slate-600">الإجراءات</th>
           </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-slate-500 font-bold">لا توجد منتجات</p>
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const imageUrl = Array.isArray(product.images) && product.images.length > 0 
                ? product.images[0] 
                : (product as any).image || '';

              const stock = product.stock || 0;
              const minStock = product.minStock || 5; 
              const isLowStock = stock > 0 && stock <= minStock; 
              const isOutOfStock = stock === 0;

              let stockBadgeClass: string = "";
              let stockText = `${stock}`;
              let StockIcon: any = null;

              if (isOutOfStock) {
                stockBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                stockText = "نفذت الكمية";
              } else if (isLowStock) {
                stockBadgeClass = "bg-red-50 text-red-600 border-red-200";
                stockText = `${stock} (قرب ينتهي!)`;
                StockIcon = <AlertTriangle size={12} className="ml-1" />;
              } else if (stock < 15) {
                stockBadgeClass = "bg-orange-50 text-orange-600 border-orange-200";
                stockText = `${stock} (متوسط)`;
              } else {
                stockBadgeClass = "bg-green-50 text-green-600 border-green-200";
                stockText = `${stock} (متوفر)`;
                StockIcon = <CheckCircle size={12} className="ml-1" />;
              }

              return (
                <tr
                  key={product.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3.5 text-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm mx-auto" 
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto bg-slate-100 border border-dashed border-slate-300"
                      >
                        <Package size={20} className="text-slate-400" />
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-sm max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {isLowStock && (
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 border border-red-200 flex-shrink-0"
                          title={`الكمية وصلت للحد الأدنى (${minStock})`}
                        >
                          <AlertTriangle size={10} className="text-red-500" />
                        </span>
                      )}
                      <span className={`truncate block ${isLowStock ? "text-red-600" : "text-slate-900"}`}>
                        {product.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                    <span
                      className="font-black px-2 py-1 rounded-lg text-xs bg-purple-50 text-purple-700"
                    >
                      {product.price} جنيه
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                    <span 
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${stockBadgeClass}`}
                    >
                      {stockText}
                      {StockIcon}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600 text-sm whitespace-nowrap">{product.category}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs font-mono whitespace-nowrap">{product.barcode}</td>

                  <td className="px-4 py-3.5">
                    <div className="flex justify-center gap-2">
                      
                      {/* ✅ زرار تعديل المنتج (قلم) */}
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 rounded-xl transition hover:scale-110 border bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                        title="تعديل المنتج"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* زرار الإخفاء والإظهار (عين) */}
                      <button
                        onClick={() => onToggleVisibility(product.id || "", product.isActive ?? true)}
                        className={`p-2 rounded-xl transition hover:scale-110 border ${
                          product.isActive === false 
                            ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
                        }`}
                        title={product.isActive === false ? 'إظهار المنتج للعملاء' : 'إخفاء المنتج عن العملاء'}
                      >
                        {product.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>

                      {/* زرار الحذف (سلة) */}
                      <button
                        onClick={() => {
                          if (!product.id) {
                            console.error('Product ID is undefined');
                            return;
                          }
                          handleDelete(product.id);
                        }}
                        className="p-2 rounded-xl transition hover:scale-110 min-w-[36px] border"
                        style={
                          deleteConfirm === product.id
                            ? { background: "#ef4444", color: "white", borderColor: "#ef4444" }
                            : { background: "#fef2f2", color: "#ef4444", borderColor: "#fecaca" }
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