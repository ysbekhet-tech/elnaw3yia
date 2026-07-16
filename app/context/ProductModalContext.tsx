"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { Product } from "@/types";
import ColorPickerModal from "@/components/ColorPickerModal";

type ProductModalContextType = {
  openProductModal: (product: Product) => void;
};

const ProductModalContext = createContext<ProductModalContextType>({
  openProductModal: () => {},
});

/**
 * ProductModalProvider
 * يعرض ColorPickerModal واحد فقط في الـ DOM بدل ما كل ProductCard يعمل modal خاص بيه
 * لو عندك 21 منتج → كان 21 modal في الـ DOM — دلوقتي واحد بس
 */
export function ProductModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openProductModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // ✅ تأخير صغير لحين انتهاء animation الإغلاق
    setTimeout(() => setSelectedProduct(null), 300);
  }, []);

  return (
    <ProductModalContext.Provider value={{ openProductModal }}>
      {children}
      {/* ✅ Modal واحد فقط في الـ DOM */}
      {selectedProduct && (
        <ColorPickerModal
          product={selectedProduct}
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  return useContext(ProductModalContext);
}
