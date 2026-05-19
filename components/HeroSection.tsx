"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-[40px] min-h-[540px]">

        {/* Background */}
        <img
          src="/images/hero-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Background"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-black/30" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.2) 0%, transparent 50%)" }} />

        {/* Animated dots grid */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Content - تم تعديل الهيكل عشان العنوان يبقى فوق في النص والباقي تحت */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 pb-16 min-h-[540px]">

          {/* 1. العنوان في النص من الأعلى */}
          <div className="w-full text-center pt-8 md:pt-12">
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-white">
              المكتبة النوعية 
              <span className="block gradient-text mt-2">
                 الجودة والسعر
              </span>
            </h1>
          </div>

          {/* 2. النص والأزرار في الأسفل */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <p className="text-slate-300 leading-loose text-lg">
              كل ما تحتاجه للمكتب والمدرسة والدراسة
              في مكان واحد بأفضل الأسعار وجودة ممتازة.
            </p>

            <div className="flex gap-4 mt-8">
              <Link
                href="/products"
                className="gradient-bg hover:opacity-90 transition text-white px-8 py-4 rounded-2xl font-bold glow-purple hover:scale-105 active:scale-95"
                style={{ display: "inline-block", transition: "all 0.2s" }}
              >
                تسوق الآن
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}