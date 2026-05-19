import { Sparkles, Eye, Target, CheckCircle, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      
      {/* خلفية توهج */}
      <div
        className="fixed top-0 left-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)", filter: "blur(120px)", transform: "translateX(-50%)" }}
      />

      <div className="max-w-5xl mx-auto px-4 py-16 relative z-10">
        
        {/* ===== الهيدر الرئيسي ===== */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            <span className="gradient-text">المكتبة النوعية</span> – بورسعيد
          </h1>
          <div className="w-24 h-1 mx-auto rounded-full gradient-bg mb-8"></div>
          
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl mx-auto mb-6">
            في قلب مدينة بورسعيد، وُلدت المكتبة النوعية لتكون أكثر من مجرد مكتبة، بل وجهة متكاملة لكل ما يخص الأدوات المكتبية والفنية، خامات الهاند ميد، تصوير المستندات، وتجهيز الكتب الخارجية، مع تقديم تجربة تجمع بين الجودة، التنوع، والخدمة المميزة لكل طالب، فنان، موظف، ومحب للإبداع.
          </p>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl mx-auto">
            نحن نسعى لتوفير كل ما يحتاجه عملاؤنا من أدوات مكتبية، مستلزمات دراسية، منتجات فنية، هدايا، وطباعة وخدمات متنوعة، مع الحرص على تقديم منتجات عالية الجودة بأسعار مناسبة وتجربة شراء سهلة وعصرية.
          </p>
        </div>

        {/* ===== أسباب الثقة ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {[
            "توفير تشكيلة واسعة من المنتجات المختارة بعناية.",
            "تقديم خدمة سريعة واحترافية.",
            "متابعة أحدث المنتجات والأدوات التعليمية والمكتبية.",
            "الاهتمام بتفاصيل تجربة العميل داخل المكتبة أو من خلال الطلب أونلاين."
          ].map((point, i) => (
            <div 
              key={i} 
              className="flex items-start gap-4 p-5 rounded-2xl transition hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 gradient-bg">
                <CheckCircle size={20} className="text-white" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-2">{point}</p>
            </div>
          ))}
        </div>

        {/* ===== الرؤية والرسالة ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          
          {/* رؤيتنا */}
          <div 
            className="rounded-3xl p-8 relative overflow-hidden group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition" style={{ background: "radial-gradient(circle, #7c3aed, transparent)", filter: "blur(40px)", transform: "translate(30%, -30%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <Eye size={24} className="text-purple-400" />
              <h2 className="text-2xl font-black text-white">رؤيتنا</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              أن نكون من أفضل وأقوى المكتبات والخدمات المكتبية في بورسعيد، وأن نصبح الوجهة الأولى لكل من يبحث عن الجودة والثقة والتنوع.
            </p>
          </div>

          {/* رسالتنا */}
          <div 
            className="rounded-3xl p-8 relative overflow-hidden group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(236,72,153,0.3)" }}
          >
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition" style={{ background: "radial-gradient(circle, #ec4899, transparent)", filter: "blur(40px)", transform: "translate(-30%, 30%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <Target size={24} className="text-pink-400" />
              <h2 className="text-2xl font-black text-white">رسالتنا</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              تقديم منتجات وخدمات مكتبية وتعليمية مميزة تساعد عملاءنا على الدراسة والعمل والإبداع بسهولة واحترافية.
            </p>
          </div>
          
        </div>

        {/* ===== لماذا يختارنا العملاء ===== */}
        <div 
          className="rounded-3xl p-8 md:p-10 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center gradient-bg">
              <Sparkles size={28} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-8">لماذا يختارنا العملاء؟</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              "جودة منتجات موثوقة",
              "أسعار تنافسية",
              "تنوع كبير في المنتجات",
              "خدمة عملاء تهتم بالتفاصيل",
              "تطوير مستمر وخدمات حديثة"
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <div className="w-3 h-3 rounded-full gradient-bg mb-2"></div>
                <p className="text-slate-300 font-bold text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== الخاتمة ===== */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Heart size={20} className="text-pink-400" />
            <p className="text-white font-bold text-lg">
              شكرًا لثقتكم بالمكتبة النوعية، ونسعد دائمًا بخدمتكم.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}