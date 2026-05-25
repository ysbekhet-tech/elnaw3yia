"use client";

import { Product, ProductColor, ProductSize } from "@/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { uploadBase64Image } from "@/lib/uploadImage";
import { X, Save, ChevronDown, Check, Upload, Palette, Plus, ImagePlus, Trash2, Ruler, AlertTriangle, Star, Search } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface AdminPriceEditorProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: (productId: string, updatedData: Partial<Product>) => Promise<void>;
  loading?: boolean;
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

export default function AdminPriceEditor({ product, onClose, onSubmit, loading = false }: AdminPriceEditorProps) {
  const [formData, setFormData] = useState({
    name: "", price: 0, originalPrice: 0, stock: 0, category: "", barcode: "", description: "", minStock: 5, countryOfOrigin: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ✅ بلد الصناعة - Dropdown
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
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [isColorDragging, setIsColorDragging] = useState(false);

  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [newLength, setNewLength] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"main" | "color">("main");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ✅ حالة الإشعارات
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ✅ إخفاء الإشعار تلقائياً
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ✅ إضافة بلد جديد
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

  // ✅✅✅ جلب الداتا الكاملة من Firestore مباشرة
  useEffect(() => {
    if (!product?.id) return;
    
    const productId = product.id;

    const fetchFullProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, "products", productId));
        if (productDoc.exists()) {
          const data = productDoc.data();

          setFormData({
            name: data.name || product.name || "",
            price: data.price || product.price || 0,
            originalPrice: data.originalPrice || product.originalPrice || 0,
            stock: data.stock ?? product.stock ?? 0,
            category: data.category || product.category || "",
            barcode: data.barcode || product.barcode || "",
            description: data.description || data.desc || "",
            minStock: data.minStock ?? product.minStock ?? 5,
            countryOfOrigin: data.countryOfOrigin || "",
          });

          if (Array.isArray(data.images) && data.images.length > 0) {
            setImagePreviews(data.images);
          } else if (data.image) {
            setImagePreviews([data.image]);
          } else if (Array.isArray(product.images) && product.images.length > 0) {
            setImagePreviews(product.images);
          } else {
            setImagePreviews([]);
          }

          setHasColors(data.hasColors || false);
          setColors(Array.isArray(data.colors) ? data.colors : []);
          setHasSizes(data.hasSizes || false);
          setSizes(Array.isArray(data.sizes) ? data.sizes : []);
        } else {
          const productAny = product as any;
          setFormData({
            name: product.name || "",
            price: product.price || 0,
            originalPrice: product.originalPrice || 0,
            stock: product.stock || 0,
            category: product.category || "",
            barcode: product.barcode || "",
            description: productAny.description || productAny.desc || "",
            minStock: product.minStock || 5,
            countryOfOrigin: productAny.countryOfOrigin || "",
          });

          if (Array.isArray(product.images) && product.images.length > 0) {
            setImagePreviews(product.images);
          } else if (productAny.image) {
            setImagePreviews([productAny.image]);
          } else {
            setImagePreviews([]);
          }

          setHasColors(product.hasColors || false);
          setColors(product.colors || []);
          setHasSizes(product.hasSizes || false);
          setSizes(product.sizes || []);
        }
      } catch (error) {
        console.error("Error fetching full product:", error);
        const productAny = product as any;
        setFormData({
          name: product.name || "",
          price: product.price || 0,
          originalPrice: product.originalPrice || 0,
          stock: product.stock || 0,
          category: product.category || "",
          barcode: product.barcode || "",
          description: productAny.description || productAny.desc || "",
          minStock: product.minStock || 5,
          countryOfOrigin: productAny.countryOfOrigin || "",
        });

        if (Array.isArray(product.images) && product.images.length > 0) {
          setImagePreviews(product.images);
        } else if (productAny.image) {
          setImagePreviews([productAny.image]);
        } else {
          setImagePreviews([]);
        }

        setHasColors(product.hasColors || false);
        setColors(product.colors || []);
        setHasSizes(product.hasSizes || false);
        setSizes(product.sizes || []);
      }
    };

    fetchFullProduct();
  }, [product]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => setCategories(snapshot.docs.map((doc) => doc.data().name as string)));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
        setCategorySearch("");
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

  if (!product) return null;

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
        const urls = uriList.split("\n").filter((url) => url.trim() && !url.startsWith("#"));
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
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    const newImages = [...imagePreviews];
    const primaryImg = newImages.splice(index, 1)[0];
    newImages.unshift(primaryImg);
    setImagePreviews(newImages);
  };

  const handleColorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => openCropModal(reader.result as string, "color");
      reader.readAsDataURL(file);
    }
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

  // ✅ الصورة اختيارية - يكفي اسم اللون
  const handleAddColor = () => {
    if (!newColorName) {
      alert("يجب إدخال اسم اللون!");
      return;
    }
    setColors([...colors, { name: newColorName, hex: newColorHex, image: newColorImage || "" }]);
    setNewColorName("");
    setNewColorHex("#000000");
    setNewColorImage(null);
    if (colorFileInputRef.current) colorFileInputRef.current.value = "";
  };

  const handleRemoveColor = (index: number) => setColors(colors.filter((_, i) => i !== index));

  const handleAddSize = () => {
    if (!newLength || !newWidth || !newSizePrice) {
      alert("يجب إدخال الطول والعرض والسعر!");
      return;
    }
    setSizes([...sizes, { length: newLength, width: newWidth, price: newSizePrice }]);
    setNewLength("");
    setNewWidth("");
    setNewSizePrice("");
  };

  const handleRemoveSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));

  // ✅ دالة مساعدة لرفع الصور الجديدة على Storage
  const uploadNewImages = async (productId: string): Promise<string[]> => {
    const finalUrls: string[] = [];

    for (let i = 0; i < imagePreviews.length; i++) {
      if (imagePreviews[i].startsWith("data:")) {
        const path = `products/${productId}/image_${Date.now()}_${i}.jpg`;
        const url = await uploadBase64Image(imagePreviews[i], path);
        finalUrls.push(url);
      } else {
        finalUrls.push(imagePreviews[i]);
      }
    }

    return finalUrls;
  };

  // ✅ دالة مساعدة لرفع صور الألوان الجديدة
  const uploadNewColorImages = async (productId: string): Promise<ProductColor[]> => {
    if (!hasColors || colors.length === 0) return [];

    const updatedColors: ProductColor[] = [];

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      if (color.image && color.image.startsWith("data:")) {
        const path = `products/${productId}/colors/color_${Date.now()}_${i}.jpg`;
        const url = await uploadBase64Image(color.image, path);
        updatedColors.push({ ...color, image: url });
      } else {
        updatedColors.push(color);
      }
    }

    return updatedColors;
  };

  const handleSubmit = async () => {
    if (!formData.name || (!hasSizes && formData.price <= 0) || !formData.category || !formData.barcode) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (!product.id) {
      alert("المنتج لا يحتوي على معرف صالح");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ رفع الصور الجديدة على Storage
      const finalImageUrls = await uploadNewImages(product.id);

      // ✅ رفع صور الألوان الجديدة
      const finalColors = await uploadNewColorImages(product.id);

      let finalPrice = Number(formData.price);
      if (hasSizes && sizes.length > 0) {
        finalPrice = Number(sizes[0].price);
      }

      await onSubmit(product.id, {
        ...formData,
        description: formData.description,
        price: finalPrice,
        minStock: Number(formData.minStock) || 5,
        countryOfOrigin: formData.countryOfOrigin,
        images: finalImageUrls,
        originalPrice: Number(formData.originalPrice) || 0,
        hasColors: hasColors,
        colors: hasColors ? finalColors : [],
        hasSizes: hasSizes,
        sizes: hasSizes ? sizes : [],
      });

      // ✅ رسالة نجاح
      setNotification({ type: "success", message: "تم تعديل المنتج بنجاح! ✅" });

      // ✅ إغلاق المودال بعد عرض رسالة النجاح
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("خطأ في التحديث:", error);
      // ✅ رسالة خطأ
      setNotification({ type: "error", message: "حدث خطأ أثناء تعديل المنتج! حاول مرة أخرى ❌" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()));
  const filteredCountries = countries.filter((c) => c.includes(countrySearch));

  return (
    <>
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl max-w-3xl max-h-[80vh] overflow-auto">
            {isImageLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="mr-3 text-black font-bold">جاري تحميل الصورة...</span>
              </div>
            )}
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imageToCrop}
                alt="Crop"
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", maxHeight: "60vh", display: isImageLoading ? "none" : "block" }}
              />
            </ReactCrop>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSaveCrop}
              disabled={isImageLoading}
              className={`px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 ${isImageLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Check size={16} /> حفظ القص
            </button>
            <button
              onClick={() => {
                setCropModalOpen(false);
                setImageToCrop(null);
                imgRef.current = null;
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2"
            >
              <X size={16} /> إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white border border-slate-200 shadow-xl">

          {/* ✅ إشعار النجاح أو الخطأ */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-xl flex items-center justify-between ${
                notification.type === "success"
                  ? "bg-green-50 border border-green-300 text-green-800"
                  : "bg-red-50 border border-red-300 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
                <span className="font-bold text-sm">{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="hover:opacity-70">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-900">تعديل بيانات المنتج</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition border border-slate-200">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">صور المنتج</label>
              <div className="flex flex-col gap-3">
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition cursor-pointer ${
                    isDragging
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-300 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={24} className={isDragging ? "text-purple-600" : "text-slate-400"} />
                  <div className="text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      {isDragging ? "أفلت الصور هنا..." : "اسحب الصور هنا أو اضغط لاختيارها"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      تقدر تسحب صور من الجهاز أو من أى موقع على النت! 🌐 سيتم فتح نافذة القص ✂️
                    </p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} ref={fileInputRef} />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
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

                <span className="text-xs text-slate-500 font-bold">{imagePreviews.length} صور</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المنتج *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition" disabled={isSubmitting} />
            </div>

            {/* ✅ وصف المنتج - داتا كاملة من Firestore */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">وصف المنتج</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب وصف المنتج هنا..."
                className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition resize-y min-h-[200px]"
                rows={8}
                disabled={isSubmitting}
              />
            </div>

            {!hasSizes && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">السعر (جنيه) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition" disabled={isSubmitting} />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">السعر قبل الخصم</label>
              <input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition" disabled={isSubmitting} />
            </div>

            {/* ✅ بلد الصناعة - Dropdown مع بحث وإضافة */}
            <div ref={countryDropdownRef}>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">بلد الصناعة</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryOpen(!countryOpen)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-right flex items-center justify-between transition bg-slate-50 border border-slate-200 focus:border-purple-400 text-slate-900"
                  disabled={isSubmitting}
                >
                  <span className={formData.countryOfOrigin ? "text-slate-900" : "text-slate-400"}>{formData.countryOfOrigin || "اختر بلد الصناعة"}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {countryOpen && (
                  <div className="absolute top-full right-0 left-0 mt-1 rounded-2xl overflow-hidden z-50 bg-white border border-slate-200 shadow-lg">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                        <Search size={14} className="text-slate-400" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="ابحث عن بلد..."
                          className="bg-transparent outline-none text-sm w-full text-slate-900 font-bold"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[200px]">
                      {filteredCountries.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-2">لا توجد نتائج</p>
                      )}
                      {filteredCountries.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, countryOfOrigin: country });
                            setCountryOpen(false);
                            setCountrySearch("");
                          }}
                          className={`w-full px-4 py-2.5 text-right text-sm hover:bg-purple-50 transition flex items-center justify-between ${formData.countryOfOrigin === country ? "text-purple-700 font-bold" : "text-slate-600"}`}
                        >
                          <span>{country}</span>
                          {formData.countryOfOrigin === country && <Check size={14} className="text-purple-700" />}
                        </button>
                      ))}
                    </div>
                    {/* ✅ إضافة بلد جديد */}
                    <div className="border-t border-slate-100 p-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCountry}
                          onChange={(e) => setNewCountry(e.target.value)}
                          placeholder="أضف بلد جديد..."
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none text-slate-900 font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCountry();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCountry}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Plus size={12} /> إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* مقاسات */}
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Ruler size={14} className="text-purple-600" />
                  هل المنتج بمقاسات مختلفة؟
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setHasSizes(false); setSizes([]); }} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasSizes ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>لا</button>
                  <button type="button" onClick={() => setHasSizes(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasSizes ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>نعم</button>
                </div>
              </div>

              {hasSizes && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  {sizes.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {sizes.map((size, index) => (
                        <div key={index} className="relative group flex flex-col items-center gap-1 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                          <div className="text-xs text-slate-700 font-bold">
                            {size.length} × {size.width} سم
                          </div>
                          <div className="text-sm text-purple-600 font-bold">
                            {size.price} جنيه
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">الطول (سم)</label>
                      <input type="number" value={newLength} onChange={(e) => setNewLength(e.target.value)} placeholder="مثال: 100" className="w-full h-10 px-3 rounded-lg text-sm bg-white border border-slate-200 text-slate-900 outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">العرض (سم)</label>
                      <input type="number" value={newWidth} onChange={(e) => setNewWidth(e.target.value)} placeholder="مثال: 50" className="w-full h-10 px-3 rounded-lg text-sm bg-white border border-slate-200 text-slate-900 outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">السعر (جنيه)</label>
                      <input type="number" value={newSizePrice} onChange={(e) => setNewSizePrice(e.target.value)} placeholder="مثال: 250" className="w-full h-10 px-3 rounded-lg text-sm bg-white border border-slate-200 text-slate-900 outline-none focus:border-purple-400" />
                    </div>
                    <button type="button" onClick={handleAddSize} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1">
                      <Plus size={14} /> إضافة مقاس
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ألوان */}
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Palette size={14} className="text-purple-600" />
                  هل المنتج متعدد الألوان؟
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setHasColors(false); setColors([]); }} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasColors ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>لا</button>
                  <button type="button" onClick={() => setHasColors(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasColors ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>نعم</button>
                </div>
              </div>

              {hasColors && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  {colors.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {colors.map((color, index) => (
                        <div key={index} className="relative group flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm">
                            {color.image ? (
                              <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" style={{ backgroundColor: color.hex }} />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-600">{color.name}</span>
                          <button type="button" onClick={() => handleRemoveColor(index)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">اسم اللون</label>
                      <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="مثال: أحمر" className="w-full h-10 px-3 rounded-lg text-sm bg-white border border-slate-200 text-slate-900 outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">كود اللون</label>
                      <div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-white border border-slate-200">
                        <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-6 h-6 bg-transparent cursor-pointer" />
                        <span className="text-slate-500 text-xs">{newColorHex}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">صورة اللون (اختياري)</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsColorDragging(true); }}
                        onDragLeave={() => setIsColorDragging(false)}
                        onDrop={handleColorImageDrop}
                        className={`flex items-center gap-1 h-10 px-2 rounded-lg border transition cursor-pointer ${isColorDragging ? "border-purple-500 bg-purple-50" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                        onClick={() => colorFileInputRef.current?.click()}
                      >
                        <Upload size={14} className="text-purple-600" />
                        <span className="text-xs text-slate-500 truncate">
                          {isColorDragging ? "أفلت هنا" : newColorImage ? "تم الاختيار ✂️" : "اختياري"}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleColorImageChange} ref={colorFileInputRef} />
                      </div>
                    </div>
                    <button type="button" onClick={handleAddColor} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1">
                      <Plus size={14} /> إضافة لون
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">الكمية المتاحة</label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition" disabled={isSubmitting} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-orange-500" />
                  الحد الأدنى للتنبيه
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الفئة *</label>
              <div className="relative">
                <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className="w-full px-4 py-3 rounded-xl text-sm text-right flex items-center justify-between transition bg-slate-50 border border-slate-200 focus:border-purple-400 text-slate-900" disabled={isSubmitting}>
                  <span className={formData.category ? "text-slate-900" : "text-slate-400"}>{formData.category || "اختر الفئة"}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {categoryOpen && (
                  <div className="absolute top-full right-0 left-0 mt-1 rounded-2xl overflow-hidden z-50 bg-white border border-slate-200 shadow-lg">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                        <Search size={14} className="text-slate-400" />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="ابحث عن فئة..."
                          className="bg-transparent outline-none text-sm w-full text-slate-900 font-bold"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[200px]">
                      {filteredCategories.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-2">لا توجد فئات</p>
                      )}
                      {filteredCategories.map((cat) => (
                        <button key={cat} type="button" onClick={() => { setFormData({ ...formData, category: cat }); setCategoryOpen(false); setCategorySearch(""); }} className={`w-full px-4 py-2.5 text-right text-sm hover:bg-purple-50 transition ${formData.category === cat ? "text-purple-700 font-bold" : "text-slate-600"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الباركود *</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 transition" disabled={isSubmitting} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm border border-slate-200 bg-white">إلغاء</button>
            <button onClick={handleSubmit} disabled={isSubmitting || loading} className="flex-1 py-3 rounded-xl font-bold text-white transition text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <Save size={16} /> {isSubmitting || loading ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}