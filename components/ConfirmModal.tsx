"use client";

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, confirmText = "تأكيد الحذف", cancelText = "إلغاء", onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-8 relative text-center"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)"
        }}
      >
        {/* أيقونة التحذير */}
        <div className="flex justify-center mb-5">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">{message}</p>

        {/* الأزرار */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold text-sm transition hover:bg-slate-200"
            style={{ background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.08)", color: "#475569" }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 0 20px rgba(220,38,38,0.4)" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}