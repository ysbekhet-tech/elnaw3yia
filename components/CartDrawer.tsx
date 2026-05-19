"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer() {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    cartTotal,
    isCartOpen,
    closeCart,
  } = useCart();

  const router = useRouter();
  const [animatedId, setAnimatedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerAnim = (id: string, color?: string) => {
    setAnimatedId(id + (color || ""));
    setTimeout(() => setAnimatedId(null), 250);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const checkout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={closeCart}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ x: isCartOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col"
        style={{
          background: "rgba(8,8,20,0.98)",
          backdropFilter: "blur(30px)",
          borderLeft: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-5 border-b"
          style={{ borderColor: "rgba(124,58,237,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">سلة التسوق</h2>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 text-red-400 text-sm font-bold"
            >
              <AlertTriangle size={16} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <ShoppingBag size={64} className="text-slate-700" />
              <p className="text-slate-500 font-bold text-lg">السلة فارغة</p>
              <button
                onClick={closeCart}
                className="gradient-bg text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition"
              >
                تسوق الآن
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.id + (item.selectedColor || "")}
                animate={
                  animatedId === item.id + (item.selectedColor || "")
                    ? {
                        x: [0, -4, 4, -4, 4, 0],
                        scale: [1, 1.02, 1],
                      }
                    : { x: 0, scale: 1 }
                }
                transition={{ duration: 0.25 }}
                className="flex gap-3 p-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(124,58,237,0.15)",
                }}
              >
                <img
                  src={item.image || "https://via.placeholder.com/60"}
                  className="w-16 h-16 object-cover rounded-xl"
                  alt={item.name}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-200 text-sm line-clamp-1">
                    {item.name}
                    {item.selectedColor && (
                      <span className="text-purple-400 text-xs mr-1">
                        ({item.selectedColor})
                      </span>
                    )}
                  </h3>
                  <p className="gradient-text font-bold text-sm mt-1">
                    {item.price} ج
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        removeFromCart(item.id, item.selectedColor);
                        triggerAnim(item.id, item.selectedColor);
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                        item.quantity === 1
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "text-slate-400 hover:bg-white/10"
                      }`}
                      style={
                        item.quantity !== 1
                          ? { border: "1px solid rgba(255,255,255,0.1)" }
                          : {}
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <motion.span
                      key={item.quantity}
                      animate={
                        animatedId === item.id + (item.selectedColor || "")
                          ? { scale: [1, 1.4, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.2 }}
                      className="min-w-[24px] text-center font-black text-white"
                    >
                      {item.quantity}
                    </motion.span>
                    <button
                      onClick={async () => {
                        const success = await addToCart(
                          item,
                          false,
                          item.selectedColor
                        );
                        if (success) {
                          triggerAnim(item.id, item.selectedColor);
                        } else {
                          showError(
                            `نفذت الكمية المتاحة من ${item.name}`
                          );
                        }
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition"
                      style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() =>
                    deleteFromCart(item.id, item.selectedColor)
                  }
                  className="text-slate-600 hover:text-red-400 transition self-start mt-1"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            className="p-5 border-t"
            style={{
              borderColor: "rgba(124,58,237,0.2)",
              background: "rgba(5,5,16,0.9)",
            }}
          >
            <div className="flex justify-between mb-4">
              <span className="text-slate-400 font-semibold">الإجمالي</span>
              <span className="text-xl font-black gradient-text">
                {cartTotal} ج
              </span>
            </div>
            <button
              onClick={checkout}
              className="w-full gradient-bg text-white h-13 py-3.5 rounded-2xl font-bold text-base hover:opacity-90 active:scale-95 transition glow-purple"
            >
              إتمام الشراء
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}