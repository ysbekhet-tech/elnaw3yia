"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { Product } from "@/types";
import AdminProductTable from "@/components/AdminProductTable";
import AdminProductForm from "@/components/AdminProductForm";
import AdminPriceEditor from "@/components/AdminPriceEditor";
import { isAuthenticated, auth } from "@/lib/auth";
import { Package, Plus, X, Tags, Filter, ImagePlus, Edit2, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

const iconOptions = [
  { icon: "✏️", label: "أقلام" }, { icon: "📓", label: "دفاتر" }, { icon: "📐", label: "هندسية" },
  { icon: "🔢", label: "حاسبة" }, { icon: "🎒", label: "مدرسية" }, { icon: "📎", label: "مكتبية" },
  { icon: "🖨️", label: "طباعة" }, { icon: "🎨", label: "رسم" }, { icon: "📦", label: "عام" },
  { icon: "🖊️", label: "قلم" }, { icon: "📏", label: "مسطرة" }, { icon: "✂️", label: "مقص" },
  { icon: "🗂️", label: "ملفات" }, { icon: "📋", label: "لوح" }, { icon: "🖇️", label: "مشبك" },
  { icon: "🖍️", label: "قلم تلوين" }, { icon: "📌", label: "دبوس" }, { icon: "🔭", label: "علوم" },
  { icon: "📚", label: "كتب" }, { icon: "🗃️", label: "أرشيف" },
];

const PRODUCTS_PER_PAGE = 30;

export default function ProductsPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catSearchTerm, setCatSearchTerm] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "stock-asc" | "stock-desc" | "newest">("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [quickJumpPage, setQuickJumpPage] = useState("");

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("✏️");
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState<string | null>(null);
  const [isCatImageDragging, setIsCatImageDragging] = useState(false);
  const catDropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editCatFileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editCatImagePreview, setEditCatImagePreview] = useState<string | null>(null);

  const [catCropModalOpen, setCatCropModalOpen] = useState(false);
  const [catImageToCrop, setCatImageToCrop] = useState<string | null>(null);
  const [catCropTarget, setCatCropTarget] = useState<"add" | "edit">("add");
  const [catCrop, setCatCrop] = useState<Crop>();
  const [catCompletedCrop, setCatCompletedCrop] = useState<PixelCrop>();
  const catImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/admin/login"); return; }
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      setAuthChecked(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Categories listener with error handling - only after auth check
  useEffect(() => {
    if (!authChecked) return;

    const unsubscribe = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category)));
      },
      (error) => {
        console.error("Categories listener error:", error);
        // Don't show alert - just log to avoid spamming user
      }
    );
    return () => unsubscribe();
  }, [authChecked]);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      setAllProducts(prods);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchAllProducts();
    }
  }, [authChecked, fetchAllProducts]);

  const filtered = useMemo(() => {
    let result = [...allProducts];
    if (searchTerm) {
      result = result.filter((p) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.barcode === searchTerm
      );
    }
    result.sort((a, b) => {
      if (sortOption === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortOption === "name-asc") return a.name.localeCompare(b.name, "ar");
      if (sortOption === "name-desc") return b.name.localeCompare(a.name, "ar");
      if (sortOption === "stock-asc") return a.stock - b.stock;
      if (sortOption === "stock-desc") return b.stock - a.stock;
      return 0;
    });
    return result;
  }, [allProducts, searchTerm, sortOption]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const currentProducts = filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOption]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleQuickJump = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    const page = parseInt(quickJumpPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
      setQuickJumpPage("");
    }
  };

  const getVisiblePages = () => {
    const maxVisible = 4;
    let start = Math.max(1, currentPage - 1);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const openCatCropModal = (imageUrl: string, target: "add" | "edit") => { 
    setCatImageToCrop(imageUrl); 
    setCatCropTarget(target); 
    setCatCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 }); 
    setCatCompletedCrop(undefined); 
    setCatCropModalOpen(true); 
  };

  const onCatImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => { 
    catImgRef.current = e.currentTarget; 
  };

  async function getCatCroppedImg() { 
    const image = catImgRef.current; 
    if (!image || !catCompletedCrop) return null; 
    const canvas = document.createElement("canvas"); 
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null; 
    if (!ctx) return null; 
    const scaleX = image.naturalWidth / image.width; 
    const scaleY = image.naturalHeight / image.height; 
    canvas.width = catCompletedCrop.width * scaleX; 
    canvas.height = catCompletedCrop.height * scaleY; 
    ctx.drawImage(image, catCompletedCrop.x * scaleX, catCompletedCrop.y * scaleY, catCompletedCrop.width * scaleX, catCompletedCrop.height * scaleY, 0, 0, canvas.width, canvas.height); 
    return canvas.toDataURL("image/jpeg"); 
  }

  const handleSaveCatCrop = async () => { 
    try { 
      const croppedImage = await getCatCroppedImg(); 
      if (croppedImage) { 
        if (catCropTarget === "add") { 
          setNewCatImagePreview(croppedImage); 
          setNewCatImage(new File([croppedImage], `category_${Date.now()}.jpg`, { type: "image/jpeg" })); 
        } else { 
          setEditCatImagePreview(croppedImage); 
        } 
      } 
    } catch (e) { 
      console.error(e); 
    } 
    setCatCropModalOpen(false); 
    setCatImageToCrop(null); 
  };

  const handleCatImageFromUrl = useCallback(async (url: string, target: "add" | "edit" = "add") => { 
    try { 
      const response = await fetch(url); 
      const blob = await response.blob(); 
      if (!blob.type.startsWith("image/")) { 
        setModalConfig({ isOpen: true, title: "خطأ", message: "الرابط ده مش صورة!", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) }); 
        return; 
      } 
      const reader = new FileReader(); 
      reader.onloadend = () => openCatCropModal(reader.result as string, target); 
      reader.readAsDataURL(blob); 
    } catch (error) { 
      console.error("Error loading image from URL:", error); 
    } 
  }, []);

  const handleCatDragOver = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsCatImageDragging(true); 
  }, []);

  const handleCatDragLeave = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsCatImageDragging(false); 
  }, []);

  const handleCatDrop = useCallback(async (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsCatImageDragging(false); 
    const files = e.dataTransfer.files; 
    if (files.length > 0) { 
      const file = files[0]; 
      if (file.type.startsWith("image/")) { 
        const reader = new FileReader(); 
        reader.onloadend = () => openCatCropModal(reader.result as string, "add"); 
        reader.readAsDataURL(file); 
      } 
      return; 
    } 
    const items = e.dataTransfer.items; 
    if (items) { 
      for (let i = 0; i < items.length; i++) { 
        const item = items[i]; 
        if (item.kind === "string") { 
          item.getAsString(async (url) => { 
            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith("http")) 
              await handleCatImageFromUrl(url); 
          }); 
        } 
      } 
    } 
    const textData = e.dataTransfer.getData("text/plain"); 
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) 
      await handleCatImageFromUrl(textData); 
    const uriList = e.dataTransfer.getData("text/uri-list"); 
    if (uriList) { 
      const urls = uriList.split("\n").filter((url) => url.trim() && !url.startsWith("#")); 
      for (const url of urls) { 
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) 
          await handleCatImageFromUrl(url); 
      } 
    } 
  }, [handleCatImageFromUrl]);

  const handleEditCatDrop = useCallback(async (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    const files = e.dataTransfer.files; 
    if (files.length > 0) { 
      const file = files[0]; 
      if (file.type.startsWith("image/")) { 
        const reader = new FileReader(); 
        reader.onloadend = () => openCatCropModal(reader.result as string, "edit"); 
        reader.readAsDataURL(file); 
      } 
      return; 
    } 
    const items = e.dataTransfer.items; 
    if (items) { 
      for (let i = 0; i < items.length; i++) { 
        const item = items[i]; 
        if (item.kind === "string") { 
          item.getAsString(async (url) => { 
            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith("http")) 
              await handleCatImageFromUrl(url, "edit"); 
          }); 
        } 
      } 
    } 
    const textData = e.dataTransfer.getData("text/plain"); 
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) 
      await handleCatImageFromUrl(textData, "edit"); 
    const uriList = e.dataTransfer.getData("text/uri-list"); 
    if (uriList) { 
      const urls = uriList.split("\n").filter((url) => url.trim() && !url.startsWith("#")); 
      for (const url of urls) { 
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) 
          await handleCatImageFromUrl(url, "edit"); 
      } 
    } 
  }, [handleCatImageFromUrl]);

  // Paste handler for Categories Modal
  useEffect(() => {
    if (!showCategoryModal) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'text') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const cropTarget = editingCatId ? "edit" : "add";
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => openCatCropModal(reader.result as string, cropTarget);
            reader.readAsDataURL(file);
          }
        }
        else if (item.type === "text/plain") {
          item.getAsString(async (text) => {
            if (text.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || (text.startsWith("http") && (text.includes(".jpg") || text.includes(".png") || text.includes(".jpeg")))) {
              e.preventDefault();
              await handleCatImageFromUrl(text, cropTarget);
            }
          });
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [showCategoryModal, editingCatId, handleCatImageFromUrl]);

  // Context menu for Categories Modal (Right Click -> Paste)
  useEffect(() => {
    if (!showCategoryModal) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const modalContent = document.getElementById("category-modal-content");
      if (!modalContent || !modalContent.contains(target)) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      e.preventDefault();

      const existingMenu = document.getElementById('cat-context-menu');
      if (existingMenu) existingMenu.remove();

      const customMenu = document.createElement('div');
      customMenu.id = 'cat-context-menu';
      customMenu.className = 'fixed bg-white rounded-lg shadow-xl border z-[250] overflow-hidden';
      customMenu.style.top = `${e.clientY}px`;
      customMenu.style.left = `${e.clientX}px`;

      const pasteOption = document.createElement('button');
      pasteOption.innerHTML = `
        <div class="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 transition-colors w-full text-right">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <span class="text-sm font-bold text-gray-700">لصق الصورة</span>
          <span class="text-xs text-gray-400 mr-auto">Ctrl+V</span>
        </div>
      `;
      pasteOption.className = 'w-full text-right';
      
      pasteOption.onclick = async () => {
        try {
          const cropTarget = editingCatId ? "edit" : "add";
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && (clipboardText.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || clipboardText.startsWith('http'))) {
            await handleCatImageFromUrl(clipboardText, cropTarget);
          } else {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
              const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
              for (const type of imageTypes) {
                const blob = await clipboardItem.getType(type);
                const reader = new FileReader();
                reader.onloadend = () => openCatCropModal(reader.result as string, cropTarget);
                reader.readAsDataURL(blob);
              }
            }
          }
        } catch (err) {
          console.error('Failed to paste:', err);
          setModalConfig({ isOpen: true, title: "تنبيه", message: "يرجى الضغط على Ctrl+V للصق الصورة لأن المتصفح يمنع القراءة المباشرة.", onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) });
        }
        if (document.body.contains(customMenu)) {
          document.body.removeChild(customMenu);
        }
      };

      customMenu.appendChild(pasteOption);
      document.body.appendChild(customMenu);

      const removeMenu = () => {
        const menu = document.getElementById('cat-context-menu');
        if (menu && document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
        document.removeEventListener('click', removeMenu);
        document.removeEventListener('contextmenu', removeMenu);
      };

      setTimeout(() => {
        document.addEventListener('click', removeMenu);
        document.addEventListener('contextmenu', removeMenu);
      }, 0);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      const existingMenu = document.getElementById('cat-context-menu');
      if (existingMenu && document.body.contains(existingMenu)) {
        document.body.removeChild(existingMenu);
      }
    };
  }, [showCategoryModal, editingCatId, handleCatImageFromUrl]);

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => { 
    try { 
      await updateDoc(doc(db, "products", id), { isActive: !currentVisibility }); 
      setAllProducts(allProducts.map((p) => p.id === id ? { ...p, isActive: !currentVisibility } : p)); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleAddProduct = async (formData: Partial<Product>) => { 
    try { 
      const { name, price, originalPrice, rating, category, barcode, stock, images, hasColors, colors, hasSizes, sizes, description } = formData; 
      const minStock = Number((formData as any).minStock) || 5; 
      const countryOfOrigin = (formData as any).countryOfOrigin || ""; 
      if (!name || !price || !category || !barcode) { 
        setModalConfig({ isOpen: true, title: "خطأ", message: "الاسم والسعر والفئة والباركود مطلوبة", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) }); 
        return; 
      } 
      const docRef = await addDoc(collection(db, "products"), { 
        name, description: description || "", price: Number(price), originalPrice: Number(originalPrice) || 0, rating: Number(rating) || 4.5, category, barcode, stock: Number(stock) || 0, minStock: Number(minStock) || 5, countryOfOrigin, images: images || [], hasColors: hasColors || false, colors: colors || [], hasSizes: hasSizes || false, sizes: sizes || [], createdAt: serverTimestamp(), isActive: true 
      }); 
      const newProduct: Product = { 
        id: docRef.id, name: name!, description: description || "", price: Number(price), originalPrice: Number(originalPrice) || 0, rating: Number(rating) || 4.5, category: category!, barcode: barcode!, stock: Number(stock) || 0, minStock: Number(minStock) || 5, countryOfOrigin, images: images || [], hasColors: hasColors || false, colors: colors || [], hasSizes: hasSizes || false, sizes: sizes || [], isActive: true, createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any 
      };
      setAllProducts([newProduct, ...allProducts]); 
      setShowAddForm(false); 
      setModalConfig({ isOpen: true, title: "نجاح ✓", message: "تم إضافة المنتج بنجاح", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) }); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleDeleteProduct = (id: string) => { 
    setModalConfig({ isOpen: true, title: "حذف المنتج", message: "هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟", onConfirm: () => executeDeleteProduct(id) }); 
  };

  const executeDeleteProduct = async (id: string) => { 
    try { 
      await deleteDoc(doc(db, "products", id)); 
      setAllProducts(allProducts.filter((p) => p.id !== id)); 
      setModalConfig((prev) => ({ ...prev, isOpen: false })); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  // دالة تعديل المنتج الكامل
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  // handleUpdateProduct
const handleUpdateProduct = async (updatedData: Partial<Product>) => {
  try {
    const { id, ...dataToUpdate } = updatedData;
    if (!id) return;
    await updateDoc(doc(db, "products", id), dataToUpdate);
    setAllProducts(allProducts.map((p) => (p.id === id ? { ...p, ...dataToUpdate } : p)));
    setEditingProduct(null);
    setModalConfig({ isOpen: true, title: "نجاح ✓", message: "تم تحديث المنتج بنجاح", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) });
  } catch (error) {
    console.error(error);
    setModalConfig({ isOpen: true, title: "خطأ", message: "حدث خطأ أثناء تحديث المنتج", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) });
  }
};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (!file) return; 
    if (!file.type.startsWith("image/")) return; 
    const reader = new FileReader(); 
    reader.onloadend = () => openCatCropModal(reader.result as string, "add"); 
    reader.readAsDataURL(file); 
  };

  const handleEditCatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (!file || !file.type.startsWith("image/")) return; 
    const reader = new FileReader(); 
    reader.onloadend = () => openCatCropModal(reader.result as string, "edit"); 
    reader.readAsDataURL(file); 
  };

  const handleAddCategory = async () => { 
    if (!newCatName.trim()) return; 
    try { 
      let imageUrl: string | undefined = undefined; 
      if (newCatImage) imageUrl = newCatImagePreview || undefined; 
      await addDoc(collection(db, "categories"), { name: newCatName.trim(), icon: imageUrl ? "" : newCatIcon, imageUrl: imageUrl || "" }); 
      setNewCatName(""); 
      setNewCatIcon("✏️"); 
      setNewCatImage(null); 
      setNewCatImagePreview(null); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      setModalConfig({ isOpen: true, title: "تمت الإضافة ✓", message: `تم إضافة قسم "${newCatName.trim()}" بنجاح`, onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) }); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleStartEditCategory = (cat: Category) => { 
    setEditingCatId(cat.id); 
    setEditingCatName(cat.name); 
    setEditCatImagePreview(cat.imageUrl || null); 
  };

  const handleCancelEditCategory = () => { 
    setEditingCatId(null); 
    setEditingCatName(""); 
    setEditCatImagePreview(null); 
  };

  const handleUpdateCategory = async (catId: string) => { 
    if (!editingCatName.trim()) return; 
    try { 
      const catRef = doc(db, "categories", catId); 
      await updateDoc(catRef, { name: editingCatName.trim(), imageUrl: editCatImagePreview || "", icon: editCatImagePreview ? "" : (categories.find((c) => c.id === catId)?.icon || "📦") }); 
      handleCancelEditCategory(); 
    } catch (error) { 
      console.error(error); 
    } 
  };

  const handleDeleteCategory = (catId: string, catName: string) => { 
    setModalConfig({ isOpen: true, title: "حذف القسم", message: `هل أنت متأكد من حذف قسم "${catName}"؟`, onConfirm: () => executeDeleteCategory(catId) }); 
  };

  const executeDeleteCategory = async (catId: string) => { 
    try { 
      await deleteDoc(doc(db, "categories", catId)); 
      setModalConfig((prev) => ({ ...prev, isOpen: false })); 
    } catch (error) { 
      console.error("خطأ في حذف القسم:", error); 
    } 
  };

  const isSuccessModal = modalConfig.title.includes("نجاح") || modalConfig.title.includes("تمت");

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {catCropModalOpen && catImageToCrop && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl max-w-3xl max-h-[80vh] overflow-auto">
            <ReactCrop crop={catCrop} onChange={(c) => setCatCrop(c)} onComplete={(c) => setCatCompletedCrop(c)}>
              <img ref={catImgRef} src={catImageToCrop} alt="Crop" onLoad={onCatImageLoad} style={{ maxWidth: "100%", maxHeight: "60vh" }} />
            </ReactCrop>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={handleSaveCatCrop} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2"><Check size={16} /> حفظ القص</button>
            <button onClick={() => { setCatCropModalOpen(false); setCatImageToCrop(null); }} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2"><X size={16} /> إلغاء</button>
          </div>
        </div>
      )}

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
           {isSuccessModal && (
  <div className="mb-8 flex justify-center">
    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
      <Check size={48} className="text-green-500" strokeWidth={3} />
    </div>
  </div>
)}
            <h3 className={`text-2xl font-black mb-4 ${isSuccessModal ? "text-green-600" : "text-slate-900"}`}>
              {modalConfig.title}
            </h3>
            <p className="text-slate-600 text-base mb-10 leading-relaxed">
              {modalConfig.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={modalConfig.onConfirm}
                className={`px-12 py-3.5 rounded-xl font-bold text-white text-sm transition hover:opacity-90 ${
                  modalConfig.title.includes("حذف") 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-gradient-to-r from-purple-600 to-pink-500"
                }`}
              >
                {modalConfig.title.includes("حذف") ? "تأكيد الحذف" : "موافق"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1">
              <Tags size={20} className="text-purple-600" />
              إدارة الأقسام
            </h2>
            <p className="text-sm font-medium text-slate-500">
              يوجد حالياً <span className="font-bold text-purple-600">{categories.length}</span> قسم في المكتبة.
            </p>
          </div>
          
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="px-8 py-3 rounded-xl font-black text-white transition hover:opacity-90 hover:scale-105 active:scale-95 shadow-md shadow-purple-200 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            <Tags size={18} />
            فتح إدارة الأقسام
          </button>
        </div>

        {/* ✅ نافذة إدارة الأقسام (Modal) */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              
              {/* هيدر المودال */}
              <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Tags size={26} className="text-purple-600" />
                    إدارة الأقسام المتقدمة
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">يمكنك إضافة، تعديل، أو حذف الأقسام من هنا.</p>
                </div>
                <button 
                  onClick={() => setShowCategoryModal(false)} 
                  className="p-2 hover:bg-red-50 bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* محتوى المودال */}
              <div id="category-modal-content" className="p-6 overflow-y-auto custom-scrollbar flex-1">
                
                {/* نموذج إضافة قسم جديد */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-purple-600" />
                    إضافة قسم جديد
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {!newCatImagePreview && (
                      <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="h-11 px-3 rounded-xl text-slate-900 text-sm font-bold outline-none bg-slate-50 border border-slate-300 focus:border-purple-400 w-full sm:w-auto">
                        {iconOptions.map((item) => ( <option key={item.icon} value={item.icon}>{item.icon} {item.label}</option> ))}
                      </select>
                    )}
                    <div ref={catDropZoneRef} onDragOver={handleCatDragOver} onDragLeave={handleCatDragLeave} onDrop={handleCatDrop} onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center gap-2 px-4 h-11 rounded-xl cursor-pointer transition border w-full sm:w-auto ${isCatImageDragging ? "bg-purple-50 border-purple-400" : "bg-slate-50 border-slate-300 hover:border-purple-400"}`}>
                      <ImagePlus size={18} className="text-purple-600" />
                      <span className="text-sm font-bold text-slate-700">{isCatImageDragging ? "أفلت الصورة هنا..." : "رفع صورة"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
                    </div>
                    {newCatImagePreview && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 flex-shrink-0 shadow-sm">
                        <img src={newCatImagePreview} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => { setNewCatImage(null); setNewCatImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs border border-white">×</button>
                      </div>
                    )}
                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اكتب اسم القسم هنا..." className="flex-1 h-11 px-4 rounded-xl font-bold text-slate-900 text-sm outline-none placeholder:text-slate-400 placeholder:font-normal bg-slate-50 border border-slate-300 focus:border-purple-400 w-full" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
                    <button onClick={handleAddCategory} className="h-11 px-8 rounded-xl font-black text-white text-sm transition hover:opacity-90 w-full sm:w-auto shadow-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                      حفظ القسم
                    </button>
                  </div>
                </div>

                {/* رأس قسم الأقسام الحالية وشريط البحث */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-sm font-black text-slate-800">الأقسام الحالية ({categories.length})</h3>
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث عن قسم..." 
                      value={catSearchTerm}
                      onChange={(e) => setCatSearchTerm(e.target.value)}
                      className="w-full h-10 pr-9 pl-3 rounded-lg text-sm outline-none bg-white border border-slate-200 focus:border-purple-400 text-black shadow-sm"
                    />
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <span className="text-sm font-bold text-slate-400">لا توجد أقسام مسجلة حتى الآن.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {categories.filter(c => c.name.toLowerCase().includes(catSearchTerm.toLowerCase())).map((cat) => (
                      <div key={cat.id} className="relative group bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-purple-300 hover:shadow-md transition-all h-[130px]">
                        
                        {/* أزرار التعديل والحذف (تظهر عند الـ Hover) */}
                        {editingCatId !== cat.id && (
                          <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition border border-red-100" title="حذف">
                              <X size={14} />
                            </button>
                            <button onClick={() => handleStartEditCategory(cat)} className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center transition border border-blue-100" title="تعديل">
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}

                        {editingCatId === cat.id ? (
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-300 cursor-pointer flex-shrink-0 flex items-center justify-center bg-slate-50 hover:border-purple-500 transition-colors" 
                              onClick={() => editCatFileInputRef.current?.click()}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onDrop={handleEditCatDrop}
                            >
                              {(editCatImagePreview || cat.imageUrl) ? <img src={editCatImagePreview || cat.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{cat.icon}</span>}
                              <input type="file" accept="image/*" className="hidden" onChange={handleEditCatImageUpload} ref={editCatFileInputRef} />
                            </div>
                            <input type="text" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="w-full px-2 py-1.5 text-xs font-bold text-center border border-purple-300 rounded-lg outline-none bg-white text-black" />
                            <div className="flex items-center justify-center gap-2 w-full mt-1">
                              <button onClick={() => handleUpdateCategory(cat.id)} className="flex-1 bg-green-500 text-white rounded-lg py-1.5 flex items-center justify-center hover:bg-green-600 transition"><Check size={14}/></button>
                              <button onClick={() => handleCancelEditCategory()} className="flex-1 bg-slate-200 text-slate-700 rounded-lg py-1.5 flex items-center justify-center hover:bg-slate-300 transition"><X size={14}/></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-purple-200 transition-colors flex items-center justify-center bg-slate-50 mt-2">
                              {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-2xl">{cat.icon}</span>}
                            </div>
                            <span className="text-sm font-black text-slate-800 text-center line-clamp-1 w-full px-1">{cat.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 whitespace-nowrap">
                <Package size={20} className="text-purple-600" />
                إدارة المنتجات
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                {allProducts.length} منتج
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث بالاسم أو الباركود" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 h-10 pr-9 pl-3 rounded-lg text-sm outline-none bg-slate-50 border border-slate-200 focus:border-purple-400 text-black"
                />
              </div>

              <div className="relative group">
                 <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-purple-400 transition whitespace-nowrap shrink-0">
                   <Filter size={14} /> ترتيب
                 </button>
                 <div className="absolute top-full left-0 mt-2 w-40 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 bg-white border border-slate-200">
                    <button onClick={() => setSortOption("newest")} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === "newest" ? "text-purple-600 font-bold" : "text-slate-600"}`}>المضاف حديثاً</button>
                    <button onClick={() => setSortOption("name-asc")} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === "name-asc" ? "text-purple-600 font-bold" : "text-slate-600"}`}>الاسم (أ-ي)</button>
                    <button onClick={() => setSortOption("name-desc")} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === "name-desc" ? "text-purple-600 font-bold" : "text-slate-600"}`}>الاسم (ي-أ)</button>
                    <button onClick={() => setSortOption("stock-desc")} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === "stock-desc" ? "text-purple-600 font-bold" : "text-slate-600"}`}>الأكثر مخزوناً</button>
                    <button onClick={() => setSortOption("stock-asc")} className={`w-full text-right px-4 py-2 text-xs hover:bg-purple-50 transition ${sortOption === "stock-asc" ? "text-purple-600 font-bold" : "text-slate-600"}`}>الأقل مخزوناً</button>
                 </div>
              </div>

              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap shrink-0" style={{ background: showAddForm ? "white" : "linear-gradient(135deg, #7c3aed, #ec4899)", border: showAddForm ? "1px solid #fecaca" : "none", color: showAddForm ? "#ef4444" : "white" }}> 
                {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? "إلغاء" : "إضافة"} 
              </button>
            </div>
          </div>

          {showAddForm && ( <div className="mb-8 p-6 rounded-xl bg-slate-50 border border-slate-200"> <h3 className="text-lg font-black text-slate-900 mb-5">إضافة منتج جديد</h3> <AdminProductForm onSubmit={handleAddProduct} /> </div> )}

          <AdminProductTable 
            products={currentProducts}
            onDelete={handleDeleteProduct} 
            onEdit={handleEditProduct}
            onToggleVisibility={handleToggleVisibility}
            loading={loading} 
          />

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition ${
                  currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <ChevronRight size={18} />
              </button>

              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition ${
                  currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-3">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">الذهاب لصفحة:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={quickJumpPage}
                  onChange={(e) => setQuickJumpPage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickJump(e)}
                  placeholder="#"
                  className="w-14 h-8 text-center text-xs border border-slate-300 rounded-md outline-none focus:border-purple-500 text-black bg-white"
                />
                <button
                  onClick={handleQuickJump}
                  className="px-2 h-8 bg-purple-100 text-purple-700 text-xs font-bold rounded-md hover:bg-purple-200 transition"
                >
                  انتقال
                </button>
              </div>

              <span className="text-xs text-slate-400 font-bold">
                {filtered.length} منتج - صفحة {currentPage} من {totalPages}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* مودال تعديل المنتج الكامل */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">تعديل المنتج</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <AdminPriceEditor
                product={editingProduct}
                onUpdate={handleUpdateProduct}
                onClose={() => setEditingProduct(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}