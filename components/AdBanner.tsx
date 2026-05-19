"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore"; // أضفنا doc
import { db } from "@/lib/firebase";

type Ad = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  showImage: boolean;
  duration: number;
  isActive?: boolean;
};

export default function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isBannerEnabled, setIsBannerEnabled] = useState(true); // الإعداد العام

  // 🔥 جلب الإعلانات المفعلة + جلب إعداد ظهور البانر
  useEffect(() => {
    // 1. جلب الإعلانات
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const list = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((ad: any) => ad.isActive !== false) as Ad[];

      setAds(list);
      setIndex(0);
    });

    // 2. جلب إعداد التشغيل/الإيقاف من مجموعة settings
    const unsubConfig = onSnapshot(doc(db, "settings", "bannerConfig"), (snap) => {
      if (snap.exists()) {
        setIsBannerEnabled(snap.data().isVisible !== false);
      }
    });

    return () => {
      unsubAds();
      unsubConfig();
    };
  }, []);

  // مؤقت الانتقال بين الإعلانات
  useEffect(() => {
    if (ads.length === 0 || !isBannerEnabled) return; // لو مقفول ميشغلش التايمر
    const current = ads[index];

    const timer = setTimeout(() => {
      setIsVisible(false);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ads.length);
        setIsVisible(true);
      }, 500);

    }, (current?.duration || 10) * 1000);

    return () => clearTimeout(timer);
  }, [ads, index, isBannerEnabled]);

  // لو الإعلانات مقفولة من الأدمن، او مفيش إعلانات، متعرضش حاجة خالص
  if (!isBannerEnabled || ads.length === 0) return null;

  const ad = ads[index];
  const hasImage = ad.showImage && ad.image && ad.image !== "";

  const goTo = (i: number) => {
    if (i === index) return;
    setIsVisible(false);
    setTimeout(() => {
      setIndex(i);
      setIsVisible(true);
    }, 500);
  };

  return (
    <div className="w-full px-2 md:px-4 py-4">
      <div
        className={`relative w-full overflow-hidden rounded-2xl shadow-2xl flex ${
          hasImage ? "items-center justify-between" : "items-center justify-center text-center"
        } px-6 md:px-16 py-8 md:py-10 text-white transition-all duration-500 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
        style={{
          background: "linear-gradient(135deg, #4c1d95, #7c3aed, #db2777)",
          minHeight: "180px",
          textShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        {/* النص */}
        <div className={`flex flex-col gap-3 z-10 ${hasImage ? "max-w-[70%]" : "max-w-[90%]"}`}>
          <h2
            className={`font-extrabold leading-tight tracking-tight ${
              hasImage ? "text-xl md:text-4xl" : "text-2xl md:text-5xl"
            }`}
          >
            {ad.title}
          </h2>

          {ad.description && (
            <p
              className={`font-semibold opacity-95 ${
                hasImage ? "text-lg md:text-2xl" : "text-xl md:text-3xl"
              }`}
            >
              {ad.description}
            </p>
          )}
        </div>

        {/* الصورة */}
        {hasImage && (
          <div className="relative h-full flex items-center justify-center z-10">
            <img
              src={ad.image}
              alt="ad"
              className="max-h-[140px] md:max-h-[200px] w-auto object-contain drop-shadow-2xl hidden sm:block transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* 🔘 Indicators */}
      {ads.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 h-3 bg-purple-600 shadow-md"
                  : "w-3 h-3 bg-gray-300/60 hover:bg-gray-400/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}