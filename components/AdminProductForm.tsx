"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { uploadBase64Image } from "@/lib/uploadImage";
import { Upload, ChevronDown, Check, X, Save, Palette, Plus, ImagePlus, Ruler, AlertTriangle, Star, Edit2, Search } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Product, ProductColor, ProductSize } from "@/types";

interface AdminProductFormProps {
  onSubmit: (formData: Partial<Product>) => void | Promise<void>;
}

const DEFAULT_COUNTRIES = [
  "مصر",
  "الصين",
  "المانيا",
  "ايطاليا",
  "تركيا",
  "اسبانيا",
  "الهند",
  "ماليزيا",
  "اندونيسيا",
  "امريكا",
  "اليابان",
  "فيتنام",
  "الامارات",
  "السعودية",
];

export default function AdminProductForm({ onSubmit }: AdminProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    barcode: "",
    stock: "",
    description: "",
    minStock: "5",
    countryOfOrigin: "",
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  const [categoriesData, setCategoriesData] = useState<{ id: string; name: string }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorImage, setNewColorImage] = useState<string | null>(null);
  const [isColorPickerTouched, setIsColorPickerTouched] = useState(false);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [isColorDragging, setIsColorDragging] = useState(false);

  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [newLength, setNewLength] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"main" | "color">("main");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Notification timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Categories listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const catsList = snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name as string }));
        setCategoriesData(catsList);
      },
      (error) => {
        console.error("Categories listener error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
        setCategorySearch("");
        setEditingCatId(null);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
        setCountrySearch("");
        setNewCountry("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Crop modal: handle cached images
  useEffect(() => {
    if (cropModalOpen && imageToCrop && imgRef.current) {
      if (imgRef.current.complete && imgRef.current.naturalWidth !== 0) {
        setIsImageLoading(false);
        setCrop({
          unit: "%",
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        });
      }
    }
  }, [cropModalOpen, imageToCrop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCountry = () => {
    const trimmed = newCountry.trim();
    if (!trimmed) return;
    if (countries.includes(trimmed)) {
      alert("البلد ده موجود بالفعل!");
      return;
    }
    setCountries([...countries, trimmed]);
    setNewCountry("");
  };

  const openCropModal = (imageUrl: string, target: "main" | "color") => {
    imgRef.current = null;
    setImageToCrop(imageUrl);
    setCropTarget(target);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsImageLoading(true);
    setCropModalOpen(true);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    setIsImageLoading(false);
    setCrop({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
  };

  async function getCroppedImg() {
    const image = imgRef.current;
    if (!image) {
      console.warn("getCroppedImg: imgRef.current is null");
      return null;
    }
    if (!completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      console.warn("getCroppedImg: completedCrop is invalid", completedCrop);
      return null;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("getCroppedImg: canvas context is null");
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.round(completedCrop.width * scaleX);
    canvas.height = Math.round(completedCrop.height * scaleY);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL("image/jpeg", 0.95);
  }

  const handleSaveCrop = async () => {
    if (isImageLoading) {
      alert("الصورة لسه بتحمل، استنى شوية...");
      return;
    }

    try {
      const croppedImage = await getCroppedImg();

      if (croppedImage) {
        if (cropTarget === "main") {
          setImagePreviews((prev) => [...prev, croppedImage]);
        } else {
          setNewColorImage(croppedImage);
        }
      } else {
        alert("مقدرش أقص الصورة. جرب تاني.");
        return;
      }
    } catch (e) {
      console.error("Error in handleSaveCrop:", e);
      alert("حصل خطأ أثناء القص، جرب تاني.");
      return;
    }

    setCropModalOpen(false);
    setImageToCrop(null);
    imgRef.current = null;
  };

  const handleImageFromUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        alert("الرابط ده مش صورة!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => openCropModal(reader.result as string, "main");
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading image from URL:", error);
      alert("مقدرش أحمل الصورة من الرابط ده. جرب ترفعها من الجهاز.");
    }
  }, []);

  // Paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const isPasteZone = pasteZoneRef.current?.contains(activeElement as Node) || 
                          dropZoneRef.current?.contains(activeElement as Node);

      if (!isPasteZone) return;

      e.preventDefault();

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => openCropModal(reader.result as string, "main");
            reader.readAsDataURL(file);
          }
        }
        else if (item.type === "text/plain") {
          item.getAsString(async (text) => {
            if (text.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
                text.startsWith("http") && (text.includes(".jpg") || text.includes(".png") || text.includes(".jpeg"))) {
              await handleImageFromUrl(text);
            }
          });
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleImageFromUrl]);

  // Context menu with proper cleanup
  useEffect(() => {
    const pasteZone = pasteZoneRef.current || dropZoneRef.current;
    if (!pasteZone) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isPasteZone = pasteZoneRef.current?.contains(target) || 
                          dropZoneRef.current?.contains(target);

      if (!isPasteZone) return;

      e.preventDefault();

      const existingMenu = document.getElementById('custom-context-menu');
      if (existingMenu) existingMenu.remove();

      const customMenu = document.createElement('div');
      customMenu.id = 'custom-context-menu';
      customMenu.className = 'fixed bg-white rounded-lg shadow-xl border z-[200] overflow-hidden';
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
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && (clipboardText.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || clipboardText.startsWith('http'))) {
            await handleImageFromUrl(clipboardText);
          } else {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
              const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
              for (const type of imageTypes) {
                const blob = await clipboardItem.getType(type);
                const reader = new FileReader();
                reader.onloadend = () => openCropModal(reader.result as string, "main");
                reader.readAsDataURL(blob);
              }
            }
          }
        } catch (err) {
          console.error('Failed to paste:', err);
          alert('اضغط Ctrl+V للصق الصورة');
        }
        if (document.body.contains(customMenu)) {
          document.body.removeChild(customMenu);
        }
      };

      customMenu.appendChild(pasteOption);
      document.body.appendChild(customMenu);

      const removeMenu = () => {
        const menu = document.getElementById('custom-context-menu');
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

    pasteZone.addEventListener('contextmenu', handleContextMenu);
    return () => {
      pasteZone.removeEventListener('contextmenu', handleContextMenu);
      const existingMenu = document.getElementById('custom-context-menu');
      if (existingMenu && document.body.contains(existingMenu)) {
        document.body.removeChild(existingMenu);
      }
    };
  }, [handleImageFromUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => openCropModal(reader.result as string, "main");
        reader.readAsDataURL(file);
      }
    });
    // Clear input to allow re-selecting same files
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => openCropModal(reader.result as string, "main");
            reader.readAsDataURL(file);
          }
        });
        return;
      }

      const items = e.dataTransfer.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "string") {
            item.getAsString(async (url) => {
              if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || url.startsWith("http")) {
                await handleImageFromUrl(url);
              }
            });
          }
        }
      }

      const textData = e.dataTransfer.getData("text/plain");
      if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
        await handleImageFromUrl(textData);
      }

      const uriList = e.dataTransfer.getData("text/uri-list");
      if (uriList) {
        const urls = uriList
          .split("\n")
          .filter((url) => url.trim() && !url.startsWith("#"));
        for (const url of urls) {
          if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
            await handleImageFromUrl(url);
          }
        }
      }
    },
    [handleImageFromUrl]
  );

  const handleRemoveImage = (index: number) => {
    const newImages = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newImages);
  };

  const handleSetPrimaryImage = (index: number) => {
    const newImages = [...imagePreviews];
    const primaryImg = newImages.splice(index, 1)[0];
    newImages.unshift(primaryImg);
    setImagePreviews(newImages);
  };

  const handleColorImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsColorDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => openCropModal(reader.result as string, "color");
      reader.readAsDataURL(files[0]);
      return;
    }

    const textData = e.dataTransfer.getData("text/plain");
    if (textData && textData.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
      try {
        const response = await fetch(textData);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => openCropModal(reader.result as string, "color");
        reader.readAsDataURL(blob);
      } catch (error) {
        alert("مقدرش أحمل الصورة من الرابط ده.");
      }
    }
  }, []);

  const handleColorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => openCropModal(reader.result as string, "color");
      reader.readAsDataURL(file);
    }
    if (colorFileInputRef.current) colorFileInputRef.current.value = "";
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) {
      alert("يجب إدخال اسم اللون!");
      return;
    }
    // Name alone is not enough - need either a color selection or an image
    const hasImage = !!newColorImage;
    if (!hasImage && !isColorPickerTouched) {
      alert("يجب اختيار درجة لون أو رفع صورة للون!");
      return;
    }
    setColors([...colors, { name: newColorName, hex: newColorHex, image: newColorImage || "" }]);
    setNewColorName("");
    setNewColorHex("#000000");
    setNewColorImage(null);
    setIsColorPickerTouched(false);
    if (colorFileInputRef.current) colorFileInputRef.current.value = "";
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleAddSize = () => {
    if (!newLength || !newWidth || !newSizePrice) {
      alert("يجب إدخال الطول والعرض والسعر!");
      return;
    }
    if (Number(newLength) <= 0 || Number(newWidth) <= 0 || Number(newSizePrice) <= 0) {
      alert("الطول والعرض والسعر يجب أن تكون قيم موجبة!");
      return;
    }
    setSizes([...sizes, { length: newLength, width: newWidth, price: newSizePrice }]);
    setNewLength("");
    setNewWidth("");
    setNewSizePrice("");
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editingCatName.trim()) return;
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "categories", catId), { name: editingCatName });
      setEditingCatId(null);
      setEditingCatName("");
    } catch (error) {
      alert("خطأ في تحديث القسم");
    }
  };

  const uploadImagesToStorage = async (productId: string): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (let i = 0; i < imagePreviews.length; i++) {
      try {
        if (imagePreviews[i].startsWith("data:")) {
          const path = `products/${productId}/image_${i}_${Date.now()}.jpg`;
          const url = await uploadBase64Image(imagePreviews[i], path);
          imageUrls.push(url);
        } else {
          imageUrls.push(imagePreviews[i]);
        }
      } catch (error) {
        console.error(`Error uploading image ${i}:`, error);
        throw new Error(`فشل رفع الصورة رقم ${i + 1}`);
      }
    }

    return imageUrls;
  };

  const uploadColorImages = async (productId: string): Promise<ProductColor[]> => {
    if (!hasColors || colors.length === 0) return [];

    const updatedColors: ProductColor[] = [];

    for (let i = 0; i < colors.length; i++) {
      try {
        const color = colors[i];
        if (color.image && color.image.startsWith("data:")) {
          const path = `products/${productId}/colors/color_${i}_${Date.now()}.jpg`;
          const url = await uploadBase64Image(color.image, path);
          updatedColors.push({ ...color, image: url });
        } else {
          updatedColors.push(color);
        }
      } catch (error) {
        console.error(`Error uploading color image ${i}:`, error);
        throw new Error(`فشل رفع صورة اللون ${colors[i].name || i + 1}`);
      }
    }

    return updatedColors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploading) return;

    // Validation
    if (!formData.name.trim()) {
      setNotification({ type: "error", message: "اسم المنتج مطلوب! ❌" });
      return;
    }

    if (!formData.barcode.trim()) {
      setNotification({ type: "error", message: "الباركود مطلوب! ❌" });
      return;
    }

    if (!formData.category) {
      setNotification({ type: "error", message: "يجب اختيار الفئة! ❌" });
      return;
    }

    if (!formData.stock || Number(formData.stock) < 0) {
      setNotification({ type: "error", message: "الكمية يجب أن تكون قيمة موجبة! ❌" });
      return;
    }

    if (hasSizes && sizes.length === 0) {
      setNotification({ type: "error", message: "لقد اخترت المقاسات المختلفة، يجب إضافة مقاس واحد على الأقل! ❌" });
      return;
    }

    if (hasColors && colors.length === 0) {
      setNotification({ type: "error", message: "لقد اخترت الألوان المتعددة، يجب إضافة لون واحد على الأقل! ❌" });
      return;
    }

    setIsUploading(true);

    try {
      // Check duplicate name
      const nameQuery = query(collection(db, "products"), where("name", "==", formData.name.trim()));
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        setNotification({ type: "error", message: "اسم المنتج ده موجود بالفعل! ❌" });
        setIsUploading(false);
        return;
      }

      // Check duplicate barcode
      const barcode = formData.barcode.trim();
      const barcodeQuery = query(collection(db, "products"), where("barcode", "==", barcode));
      const barcodeSnapshot = await getDocs(barcodeQuery);

      if (!barcodeSnapshot.empty) {
        setNotification({ type: "error", message: "الباركود مستخدم بالفعل ❌" });
        setIsUploading(false);
        return;
      }

      const productId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imageUrls = await uploadImagesToStorage(productId);
      const finalColors = await uploadColorImages(productId);

      let finalPrice = Number(formData.price);
      if (hasSizes && sizes.length > 0) {
        finalPrice = Number(sizes[0].price);
      }

      await onSubmit({
        id: productId,
        ...formData,
        description: formData.description,
        price: finalPrice,
        originalPrice: Number(formData.originalPrice) || 0,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock) || 5,
        countryOfOrigin: formData.countryOfOrigin,
        images: imageUrls,
        hasColors: hasColors,
        colors: hasColors ? finalColors : [],
        hasSizes: hasSizes,
        sizes: hasSizes ? sizes : [],
      });

      setNotification({ type: "success", message: "تم إضافة المنتج بنجاح! ✅" });

      // Reset form ONLY on success
      setFormData({
        name: "",
        price: "",
        originalPrice: "",
        category: "",
        barcode: "",
        stock: "",
        description: "",
        minStock: "5",
        countryOfOrigin: "",
      });
      setImagePreviews([]);
      setHasColors(false);
      setColors([]);
      setHasSizes(false);
      setSizes([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error submitting product:", error);
      setNotification({ type: "error", message: "حدث خطأ أثناء إضافة المنتج! حاول مرة أخرى ❌" });
      // Data is NOT reset - user keeps everything they typed
    } finally {
      setIsUploading(false);
    }
  };

  const inputStyle = "w-full h-12 px-4 rounded-xl bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const innerInputStyle = "w-full h-10 px-3 rounded-lg bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const borderConfig = { borderColor: "rgba(124,58,237,0.3)" };

  const filteredCategories = categoriesData.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const filteredCountries = countries.filter((c) => c.includes(countrySearch));

  return (
    <>
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl max-w-3xl max-h-[80vh] overflow-auto">
            {isImageLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="mr-3 text-black font-bold">جاري تحميل الصورة...</span>
              </div>
            )}
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} keepSelection>
              <img ref={imgRef} src={imageToCrop} alt="Crop" onLoad={onImageLoad} style={{ maxWidth: "100%", maxHeight: "60vh", display: isImageLoading ? "none" : "block" }} />
            </ReactCrop>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={handleSaveCrop} disabled={isImageLoading} className={`px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 ${isImageLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Check size={16} /> حفظ القص
            </button>
            <button onClick={() => { setCropModalOpen(false); setImageToCrop(null); imgRef.current = null; }} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2">
              <X size={16} /> إلغاء
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notification && (
          <div className={`md:col-span-2 mb-2 p-4 rounded-xl flex items-center justify-between ${notification.type === "success" ? "bg-green-50 border border-green-300 text-green-800" : "bg-red-50 border border-red-300 text-red-800"}`}>
            <div className="flex items-center gap-2">
              {notification.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
              <span className="font-bold text-sm">{notification.message}</span>
            </div>
            <button type="button" onClick={() => setNotification(null)} className="hover:opacity-70"><X size={16} /></button>
          </div>
        )}

        <div className="md:col-span-2 mb-2">
          <h2 className="text-lg font-bold text-black">إضافة منتج جديد</h2>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-black mb-2">صور المنتج (متعدد)</label>
          <div className="flex flex-col gap-3">
            <div
              ref={(node) => {
                dropZoneRef.current = node;
                pasteZoneRef.current = node;
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              tabIndex={0}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDragging ? "border-purple-500 bg-purple-500/10" : "border-slate-600 hover:border-purple-400 hover:bg-purple-500/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={32} className={isDragging ? "text-purple-400" : "text-slate-500"} />
              <div className="text-center">
                <p className="text-sm text-black font-medium">{isDragging ? "أفلت الصور هنا..." : "اختر الصور من جهازك"}</p>
                <p className="text-xs text-slate-500 mt-1">اسحب الصور أو استخدم Ctrl+V للصق</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} ref={fileInputRef} />
            </div>

            <span className="text-xs text-black font-bold">{imagePreviews.length} صور مختارة</span>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((img, idx) => (
                  <div key={`img-${idx}-${img.slice(-20)}`} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/30">
                    <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-yellow-400 text-black p-0.5 rounded-full">
                        <Star size={10} fill="black" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button type="button" onClick={() => handleSetPrimaryImage(idx)} className="p-1 bg-yellow-400 text-black rounded-full hover:bg-yellow-300" title="اجعلها الصورة الرئيسية">
                          <Star size={12} />
                        </button>
                      )}
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="p-1 bg-red-500 text-white rounded-full hover:bg-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="اسم المنتج *" required className={inputStyle} style={borderConfig} />
        {!hasSizes && <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="السعر *" required={!hasSizes} className={inputStyle} style={borderConfig} />}
        <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="السعر قبل الخصم" className={inputStyle} style={borderConfig} />

        <div ref={countryDropdownRef} className="relative">
          <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="w-full h-12 px-4 rounded-xl text-sm text-right flex items-center justify-between transition bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500" style={borderConfig}>
            <span className={formData.countryOfOrigin ? "!text-black" : "text-slate-400"}>{formData.countryOfOrigin || "بلد الصناعة"}</span>
            <ChevronDown size={16} className="text-black" style={{ transform: countryOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {countryOpen && (
            <div className="absolute top-full right-0 left-0 mt-1 rounded-xl overflow-hidden z-50 bg-white shadow-xl" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                  <Search size={14} className="text-slate-400" />
                  <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="ابحث عن بلد..." className="bg-transparent outline-none text-sm w-full !text-black !font-bold" autoFocus />
                </div>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "200px" }}>
                {filteredCountries.length === 0 && <p className="text-center text-sm text-slate-400 py-2">لا توجد نتائج</p>}
                {filteredCountries.map((country) => (
                  <div key={country} className="w-full px-4 py-2.5 text-right text-sm flex items-center justify-between transition font-bold text-black hover:bg-slate-50 cursor-pointer" onClick={() => { setFormData({ ...formData, countryOfOrigin: country }); setCountryOpen(false); setCountrySearch(""); }}>
                    <span className={formData.countryOfOrigin === country ? "text-purple-700" : ""}>{country}</span>
                    {formData.countryOfOrigin === country && <Check size={14} className="text-purple-700" />}
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="أضف بلد جديد..." className="flex-1 px-3 py-1.5 border rounded-lg text-sm outline-none !text-black !font-bold" style={borderConfig} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCountry(); } }} />
                  <button type="button" onClick={handleAddCountry} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"><Plus size={12} /> إضافة</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="اكتب وصف المنتج..." rows={10} className="w-full px-4 py-3 rounded-xl bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 resize-y min-h-[250px]" style={borderConfig} />
        </div>

        <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-black"><Ruler size={16} className="text-purple-400" /> هل المنتج بمقاسات مختلفة؟</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHasSizes(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasSizes ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>لا</button>
              <button type="button" onClick={() => setHasSizes(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasSizes ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>نعم</button>
            </div>
          </div>
          {hasSizes && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {sizes.map((size, index) => (
                    <div key={`size-${index}`} className="relative group flex flex-col items-center gap-1 bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div className="text-xs text-black font-bold">{size.length} × {size.width} سم</div>
                      <div className="text-sm text-purple-400 font-bold">{size.price} جنيه</div>
                      <button type="button" onClick={() => handleRemoveSize(index)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div><label className="block text-xs text-black font-bold mb-1">الطول (سم)</label><input type="number" value={newLength} onChange={(e) => setNewLength(e.target.value)} placeholder="مثال: 100" min="0" className={innerInputStyle} style={borderConfig} /></div>
                <div><label className="block text-xs text-black font-bold mb-1">العرض (سم)</label><input type="number" value={newWidth} onChange={(e) => setNewWidth(e.target.value)} placeholder="مثال: 50" min="0" className={innerInputStyle} style={borderConfig} /></div>
                <div><label className="block text-xs text-black font-bold mb-1">السعر (جنيه)</label><input type="number" value={newSizePrice} onChange={(e) => setNewSizePrice(e.target.value)} placeholder="مثال: 250" min="0" className={innerInputStyle} style={borderConfig} /></div>
                <button type="button" onClick={handleAddSize} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1"><Plus size={14} /> إضافة مقاس</button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-black"><Palette size={16} className="text-purple-400" /> هل المنتج متعدد الألوان؟</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHasColors(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasColors ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>لا</button>
              <button type="button" onClick={() => setHasColors(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasColors ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>نعم</button>
            </div>
          </div>
          {hasColors && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {colors.map((color, index) => (
                    <div key={`color-${index}`} className="relative group flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-600 overflow-hidden">
                        {color.image ? <img src={color.image} alt={color.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: color.hex }} />}
                      </div>
                      <span className="text-[10px] text-black font-bold">{color.name}</span>
                      <button type="button" onClick={() => handleRemoveColor(index)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div><label className="block text-xs text-black font-bold mb-1">اسم اللون</label><input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="مثال: أحمر" className={innerInputStyle} style={borderConfig} /></div>
                <div><label className="block text-xs text-black font-bold mb-1">كود اللون</label><div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-white border" style={borderConfig}><input type="color" value={newColorHex} onChange={(e) => { setNewColorHex(e.target.value); setIsColorPickerTouched(true); }} className="w-6 h-6 bg-transparent cursor-pointer" /><span className="!text-black !font-bold text-xs">{newColorHex}</span></div></div>
                <div><label className="block text-xs text-black font-bold mb-1">صورة اللون (اختياري)</label><div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsColorDragging(true); }} onDragLeave={() => setIsColorDragging(false)} onDrop={handleColorImageDrop} className={`flex items-center gap-1 h-10 px-2 rounded-lg border transition cursor-pointer ${isColorDragging ? "border-purple-500 bg-purple-50" : "bg-white hover:bg-slate-50"}`} style={borderConfig} onClick={() => colorFileInputRef.current?.click()}><Upload size={14} className="text-purple-400" /><span className="text-xs !text-black !font-bold truncate">{isColorDragging ? "أفلت هنا" : newColorImage ? "تم الاختيار" : "اختياري"}</span><input type="file" accept="image/*" className="hidden" onChange={handleColorImageChange} ref={colorFileInputRef} /></div></div>
                <button type="button" onClick={handleAddColor} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1"><Plus size={14} /> إضافة لون</button>
              </div>
            </div>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className="w-full h-12 px-4 rounded-xl text-sm text-right flex items-center justify-between transition bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500" style={borderConfig}>
            <span className={formData.category ? "!text-black" : "text-slate-400"}>{formData.category || "اختر الفئة *"}</span>
            <ChevronDown size={16} className="text-black" style={{ transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {categoryOpen && (
            <div className="absolute top-full right-0 left-0 mt-1 rounded-xl overflow-hidden z-50 bg-white shadow-xl" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg"><Search size={14} className="text-slate-400" /><input type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="ابحث عن فئة..." className="bg-transparent outline-none text-sm w-full !text-black !font-bold" autoFocus /></div>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "200px" }}>
                {filteredCategories.length === 0 && <p className="text-center text-sm text-slate-400 py-2">لا توجد فئات</p>}
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="w-full px-4 py-2.5 text-right text-sm flex items-center justify-between transition font-bold group text-black hover:bg-slate-50">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-2 w-full"><input type="text" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="w-full px-2 py-1 border rounded !text-black text-sm outline-none" autoFocus /><button onClick={() => handleUpdateCategory(cat.id)} className="text-green-600 hover:text-green-800"><Check size={16} /></button><button onClick={() => setEditingCatId(null)} className="text-red-500 hover:text-red-700"><X size={16} /></button></div>
                    ) : (
                      <>
                        <span className={`flex-1 cursor-pointer ${formData.category === cat.name ? "text-purple-700" : ""}`} onClick={() => { setFormData({ ...formData, category: cat.name }); setCategoryOpen(false); setCategorySearch(""); }}>{cat.name}</span>
                        <div className="flex items-center gap-2">{formData.category === cat.name && <Check size={14} className="text-purple-700" />}<button onClick={(e) => { e.stopPropagation(); setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 transition"><Edit2 size={12} /></button></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <input 
          type="text" 
          name="barcode" 
          value={formData.barcode} 
          onChange={handleChange} 
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          placeholder="الباركود *" 
          required 
          className={inputStyle} 
          style={borderConfig} 
        />
        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="الكمية بالمخزن *" required min="0" className={inputStyle} style={borderConfig} />

        <div className="relative">
          <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} placeholder="الحد الأدنى للتنبيه *" required min="0" className={inputStyle} style={borderConfig} />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-400"><AlertTriangle size={14} /><span className="text-[10px] font-bold">تنبيه</span></div>
        </div>

        <div className="md:col-span-2 mt-2">
          <button type="submit" disabled={isUploading} className={`w-full h-14 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 ${isUploading ? "opacity-70 cursor-not-allowed" : ""}`} style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <Save size={18} /> {isUploading ? "جاري رفع الصور..." : "حفظ المنتج في الداتابيز"}
          </button>
        </div>
      </form>
    </>
  );
}