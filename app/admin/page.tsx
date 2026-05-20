'use client';

export default function AdminHome() {
  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">مرحباً بك في لوحة التحكم</h2>
      <p className="text-slate-500 mb-8">اختر القسم من القائمة الجانبية للبدء</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-900 text-lg">إحصائيات سريعة</h3>
          <p className="text-slate-500 text-sm mt-2">هنا يمكنك إضافة إحصائيات عن المبيعات أو الطلبات لاحقاً.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-900 text-lg">طلبات جديدة</h3>
          <p className="text-slate-500 text-sm mt-2">تابع الطلبات الواردة من قسم "إدارة الطلبات".</p>
        </div>
      </div>
    </div>
  );
}