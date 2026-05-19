import Link from "next/link";

export default function Footer() {
  // رقم الواتساب بالصيغة الدولية (مصر 20) من غير + ومسافات
  const whatsappNumber = "201201930025"; 
  const whatsappMessage = "مرحبا، أريد الاستفسار عن منتج"; 
  const whatsappIcon = "/whatsapp.png"; // المسار المحلي للصورة

  return (
    <>
      {/* ✅ زرار الواتساب العائم (كبرناه شوية) */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
        style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37, 211, 102, 0.5)" }}
        title="تواصل معنا عبر واتساب"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-9 h-9 object-contain" />
      </a>

      {/* كود الفوتر الأساسي */}
      <footer style={{ background: "rgba(5,5,16,0.98)", borderTop: "1px solid rgba(124,58,237,0.2)" }} className="mt-16">
        <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <div className="text-2xl font-black mb-4">
              <span className="text-white">المكتبة</span>
              <span className="gradient-text mr-1">النوعية</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              متجرك الأول للأدوات المكتبية والمدرسية والهندسية. جودة عالية وأسعار منافسة في بورسعيد، مصر.
            </p>
            <div className="flex gap-2">
              {[
                { icon: <span>📘</span>, href: "#" },
                { icon: <span>📸</span>, href: "#" },
                { icon: <span>🎵</span>, href: "#" },
                { 
                  icon: <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 object-contain" />, 
                  href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}` 
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:scale-110 transition"
                  style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black mb-5 text-sm">روابط سريعة</h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: "الصفحة الرئيسية", href: "/" },
                { name: "المنتجات", href: "/products" },
                { name: "العروض", href: "/offers" },
                { name: "من نحن", href: "/about" },
                { name: "تواصل معنا", href: "/contact" },
                { name: "لوحة الإدارة", href: "/admin" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-500 text-sm hover:text-purple-400 transition font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-3 text-sm">النشرة البريدية</h4>
            <p className="text-slate-500 text-xs mb-4">اشترك واحصل على آخر العروض</p>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(124,58,237,0.3)" }}
            >
              <input
                type="email"
                placeholder="بريدك الإلكتروني..."
                className="flex-1 px-3 py-2.5 text-xs text-white outline-none placeholder-slate-600"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <button className="gradient-bg px-4 text-white text-sm hover:opacity-90 transition">
                ←
              </button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-white font-black mb-3 text-sm">تواصل معنا</h4>
              <p className="text-slate-500 text-xs mb-2">📞 01201930025</p>
              <p className="text-slate-500 text-xs mb-4">📍 بورسعيد، مصر</p>
              
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                style={{ background: "#25D366", boxShadow: "0 0 20px rgba(37, 211, 102, 0.2)" }}
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 object-contain" />
                تواصل عبر واتساب
              </a>
            </div>
          </div>

        </div>

        <div
          className="border-t py-5 px-4"
          style={{ borderColor: "rgba(124,58,237,0.15)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-600">
            <span>2026 المكتبة النوعية - جميع الحقوق محفوظة</span>
            <span>Visa | Mastercard | Vodafone Cash | InstaPay</span>
          </div>
        </div>
      </footer>
    </>
  );
}