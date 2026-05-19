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
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-8 relative text-center"
        style={{
          background: "rgba(15,15,30,0.98)",
          border: "1px solid rgba(124,58,237,0.4)",
          boxShadow: "0 0 60px rgba(124,58,237,0.2)"
        }}
      >
        {/* أيقونة التحذير */}
        <div className="flex justify-center mb-5">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">{message}</p>

        {/* الأزرار */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold text-sm transition hover:bg-slate-700"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}
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