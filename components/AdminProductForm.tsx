"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Upload, ChevronDown, Check, X, Save, Palette, Plus, ImagePlus, Ruler, AlertTriangle, Star, Edit2, Search } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Product, ProductColor, ProductSize } from "@/types";

interface AdminProductFormProps {
  onSubmit: (formData: Partial<Product>) => void;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [categoriesData, setCategoriesData] = useState<{ id: string; name: string }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // حالات الـ Crop
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"main" | "color">("main");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const catsList = snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name as string }));
      setCategoriesData(catsList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
        setCategorySearch("");
        setEditingCatId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // === دوال الـ Crop ===
  const openCropModal = (imageUrl: string, target: "main" | "color") => {
    setImageToCrop(imageUrl);
    setCropTarget(target);
    setCrop({ unit: "%", width: 50, height: 50, x: 25, y: 25 });
    setCompletedCrop(undefined);
    setCropModalOpen(true);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  async function getCroppedImg() {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg");
  }

  const handleSaveCrop = async () => {
    try {
      const croppedImage = await getCroppedImg();
      if (croppedImage) {
        if (cropTarget === "main") {
          setImagePreviews((prev) => [...prev, croppedImage]);
        } else {
          setNewColorImage(croppedImage);
        }
      }
    } catch (e) {
      console.error(e);
      alert("حصل خطأ أثناء القص، جرب تاني.");
    }
    setCropModalOpen(false);
    setImageToCrop(null);
  };
  // === نهاية دوال الـ Crop ===

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
    if (fileInputRef.current) fileInputRef.current.value = "";
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
  };

  const handleAddColor = () => {
    if (!newColorName || !newColorImage) {
      alert("يجب إدخال اسم اللون وصورته!");
      return;
    }
    setColors([...colors, { name: newColorName, hex: newColorHex, image: newColorImage }]);
    setNewColorName("");
    setNewColorHex("#000000");
    setNewColorImage(null);
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
      await updateDoc(doc(db, "categories", catId), { name: editingCatName });
      setEditingCatId(null);
      setEditingCatName("");
    } catch (error) {
      alert("خطأ في تحديث القسم");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPrice = Number(formData.price);
    if (hasSizes && sizes.length > 0) {
      finalPrice = Number(sizes[0].price);
    }

    onSubmit({
      ...formData,
      price: finalPrice,
      originalPrice: Number(formData.originalPrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock) || 5,
      countryOfOrigin: formData.countryOfOrigin,
      images: imagePreviews,
      hasColors: hasColors,
      colors: hasColors ? colors : [],
      hasSizes: hasSizes,
      sizes: hasSizes ? sizes : [],
    });

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
  };

  const inputStyle =
    "w-full h-12 px-4 rounded-xl bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const innerInputStyle =
    "w-full h-10 px-3 rounded-lg bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const borderConfig = { borderColor: "rgba(124,58,237,0.3)" };

  const filteredCategories = categoriesData.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()));

  return (
    <>
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl max-w-3xl max-h-[80vh] overflow-auto">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
              <img ref={imgRef} src={imageToCrop} alt="Crop" onLoad={onImageLoad} style={{ maxWidth: "100%", maxHeight: "60vh" }} />
            </ReactCrop>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={handleSaveCrop} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2">
              <Check size={16} /> حفظ القص
            </button>
            <button
              onClick={() => {
                setCropModalOpen(false);
                setImageToCrop(null);
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2"
            >
              <X size={16} /> إلغاء
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 mb-2">
          <h2 className="text-lg font-bold text-black">إدارة المنتجات</h2>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-black mb-2">صور المنتج (متعدد)</label>
          <div className="flex flex-col gap-3">
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition cursor-pointer ${
                isDragging ? "border-purple-500 bg-purple-500/10" : "border-slate-600 hover:border-purple-400 hover:bg-purple-500/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={32} className={isDragging ? "text-purple-400" : "text-slate-500"} />
              <div className="text-center">
                <p className="text-sm text-black font-medium">{isDragging ? "أفلت الصور هنا..." : "اسحب الصور هنا أو اضغط لاختيارها"}</p>
                <p className="text-xs text-slate-500 mt-1">تقدر تسحب صور من الجهاز أو من أى موقع على النت! 🌐 سيتم فتح نافذة القص تلقائياً ✂️</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} ref={fileInputRef} />
            </div>

            <span className="text-xs text-black font-bold">{imagePreviews.length} صور مختارة</span>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/30">
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

        {!hasSizes && <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="السعر *" required className={inputStyle} style={borderConfig} />}

        <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="السعر قبل الخصم" className={inputStyle} style={borderConfig} />

        <input type="text" name="countryOfOrigin" value={formData.countryOfOrigin} onChange={handleChange} placeholder="بلد الصناعة" className={inputStyle} style={borderConfig} />

        <div className="md:col-span-2">
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="اكتب وصف المنتج..."
            rows={10}
            className="w-full px-4 py-3 rounded-xl bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500 transition placeholder:text-slate-400 resize-y min-h-[250px]"
            style={borderConfig}
          />
        </div>

        <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-black">
              <Ruler size={16} className="text-purple-400" />
              هل المنتج بمقاسات مختلفة؟
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHasSizes(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasSizes ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                لا
              </button>
              <button type="button" onClick={() => setHasSizes(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasSizes ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                نعم
              </button>
            </div>
          </div>

          {hasSizes && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {sizes.map((size, index) => (
                    <div key={index} className="relative group flex flex-col items-center gap-1 bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div className="text-xs text-black font-bold">
                        {size.length} × {size.width} سم
                      </div>
                      <div className="text-sm text-purple-400 font-bold">{size.price} جنيه</div>
                      <button type="button" onClick={() => handleRemoveSize(index)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-black font-bold mb-1">الطول (سم)</label>
                  <input type="number" value={newLength} onChange={(e) => setNewLength(e.target.value)} placeholder="مثال: 100" className={innerInputStyle} style={borderConfig} />
                </div>
                <div>
                  <label className="block text-xs text-black font-bold mb-1">العرض (سم)</label>
                  <input type="number" value={newWidth} onChange={(e) => setNewWidth(e.target.value)} placeholder="مثال: 50" className={innerInputStyle} style={borderConfig} />
                </div>
                <div>
                  <label className="block text-xs text-black font-bold mb-1">السعر (جنيه)</label>
                  <input type="number" value={newSizePrice} onChange={(e) => setNewSizePrice(e.target.value)} placeholder="مثال: 250" className={innerInputStyle} style={borderConfig} />
                </div>
                <button type="button" onClick={handleAddSize} className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition flex items-center justify-center gap-1">
                  <Plus size={14} /> إضافة مقاس
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-black">
              <Palette size={16} className="text-purple-400" />
              هل المنتج متعدد الألوان؟
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHasColors(false)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!hasColors ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                لا
              </button>
              <button type="button" onClick={() => setHasColors(true)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${hasColors ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                نعم
              </button>
            </div>
          </div>
          {hasColors && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {colors.map((color, index) => (
                  <div key={index} className="relative group flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-600 overflow-hidden">
                      <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-black font-bold">{color.name}</span>
                    <button type="button" onClick={() => handleRemoveColor(index)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-black font-bold mb-1">اسم اللون</label>
                  <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="مثال: أحمر" className={innerInputStyle} style={borderConfig} />
                </div>
                <div>
                  <label className="block text-xs text-black font-bold mb-1">كود اللون</label>
                  <div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-white border" style={borderConfig}>
                    <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-6 h-6 bg-transparent cursor-pointer" />
                    <span className="!text-black !font-bold text-xs">{newColorHex}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-black font-bold mb-1">صورة اللون</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsColorDragging(true);
                    }}
                    onDragLeave={() => setIsColorDragging(false)}
                    onDrop={handleColorImageDrop}
                    className={`flex items-center gap-1 h-10 px-2 rounded-lg border transition cursor-pointer ${isColorDragging ? "border-purple-500 bg-purple-50" : "bg-white hover:bg-slate-50"}`}
                    style={borderConfig}
                    onClick={() => colorFileInputRef.current?.click()}
                  >
                    <Upload size={14} className="text-purple-400" />
                    <span className="text-xs !text-black !font-bold truncate">{isColorDragging ? "أفلت هنا" : newColorImage ? "تم الاختيار ✂️" : "اسحب أو اختر"}</span>
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

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="w-full h-12 px-4 rounded-xl text-sm text-right flex items-center justify-between transition bg-white border !text-black !font-bold focus:outline-none focus:border-purple-500"
            style={borderConfig}
          >
            <span className={formData.category ? "!text-black" : "text-slate-400"}>{formData.category || "اختر الفئة *"}</span>
            <ChevronDown size={16} className="text-black" style={{ transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {categoryOpen && (
            <div className="absolute top-full right-0 left-0 mt-1 rounded-xl overflow-hidden z-50 bg-white shadow-xl" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="ابحث عن فئة..."
                    className="bg-transparent outline-none text-sm w-full !text-black !font-bold"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "200px" }}>
                {filteredCategories.length === 0 && <p className="text-center text-sm text-slate-400 py-2">لا توجد فئات</p>}
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="w-full px-4 py-2.5 text-right text-sm flex items-center justify-between transition font-bold group text-black hover:bg-slate-50">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input type="text" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="w-full px-2 py-1 border rounded !text-black text-sm outline-none" autoFocus />
                        <button onClick={() => handleUpdateCategory(cat.id)} className="text-green-600 hover:text-green-800">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingCatId(null)} className="text-red-500 hover:text-red-700">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 cursor-pointer ${formData.category === cat.name ? "text-purple-700" : ""}`} onClick={() => {
                           setFormData({ ...formData, category: cat.name }); 
                           setCategoryOpen(false); 
                           setCategorySearch("");
                        }}>
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {formData.category === cat.name && <Check size={14} className="text-purple-700" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 transition"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="الباركود *" required className={inputStyle} style={borderConfig} />

        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="الكمية بالمخزن *" required className={inputStyle} style={borderConfig} />

        <div className="relative">
          <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} placeholder="الحد الأدنى للتنبيه *" required className={inputStyle} style={borderConfig} />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-400">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold">تنبيه</span>
          </div>
        </div>

        <div className="md:col-span-2 mt-2">
          <button type="submit" className="w-full h-14 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <Save size={18} />
            حفظ المنتج في الداتابيز
          </button>
        </div>
      </form>
    </>
  );
}