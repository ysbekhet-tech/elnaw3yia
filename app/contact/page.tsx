import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تواصل معنا | المكتبة النوعية',
  description: 'تواصل معنا للاستفسار عن منتجاتنا وعروضنا في المكتبة النوعية',
};

export default function ContactPage() {
  const whatsappNumber = "201201930025"; 
  const whatsappMessage = "مرحبا، لدي استفسار"; 
  
  return (
    <div className="min-h-[70vh] py-16 px-4 flex items-center justify-center bg-white">
      <div className="w-full max-w-4xl mx-auto rounded-[40px] p-8 md:p-12 relative overflow-hidden bg-white border border-slate-200 shadow-sm">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-[100px] -z-10" />

        <h1 className="text-4xl md:text-5xl font-black text-center text-slate-800 mb-6">تواصل <span className="gradient-text">معنا</span></h1>
        <p className="text-center text-slate-600 mb-12 text-lg max-w-2xl mx-auto leading-relaxed">
          نحن هنا لمساعدتك والإجابة على أي استفسارات تخص منتجاتنا، عروضنا، أو تفاصيل طلباتك.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* WhatsApp Card */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">الدعم الفني</h3>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed">أسرع طريقة للتواصل معنا هي عبر الواتساب، فريقنا متاح للرد على رسائلك في أوقات العمل الرسمية.</p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
              style={{ background: "#25D366", boxShadow: "0 0 30px rgba(37, 211, 102, 0.3)" }}
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
              تواصل عبر واتساب
            </a>
          </div>

          {/* Info Card */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center">معلومات الاتصال</h3>
            <div className="flex flex-col gap-6 text-slate-700 text-base">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>📍</div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">العنوان</p>
                  <p className="font-bold">بورسعيد، مصر</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>📞</div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">رقم الهاتف</p>
                  <p className="font-bold" dir="ltr">{whatsappNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>✉️</div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                  <p className="font-bold">info@stationery.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
