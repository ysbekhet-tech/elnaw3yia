// lib/auth.ts

export const authenticateAdmin = (enteredCode: string): boolean => {
  // تأكد أنك تستخدم NEXT_PUBLIC_ في ملف .env
  const secretCode = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123';
  return enteredCode === secretCode;
};

export const setAuthToken = () => {
  const token = btoa(JSON.stringify({ authenticated: true, timestamp: Date.now() }));
  
  // ✅ التعديل 1: استخدام encodeURIComponent لضمان حفظ الرموز الخاصة بشكل آمن
  const encodedToken = encodeURIComponent(token);

  // ✅ التعديل 2: إضافة SameSite=Lax لضمان عمل الكوكي في جميع المتصفحات
  document.cookie = `admin_token=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
};

export const clearAuthToken = () => {
  // يجب مسح الكوكي بنفس الخصائص التي تم إنشاؤها بها (يفضل إضافة SameSite هنا أيضاً)
  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
};

export const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/admin_token=([^;]*)/);
  if (!match) return null;

  // ✅ التعديل 3: استخدام decodeURIComponent عند القراءة
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const decoded = JSON.parse(atob(token));
    return decoded.authenticated === true;
  } catch (e) {
    // في حالة وجود أي خطأ في فك التشفير، نعتبر المستخدم غير مسجل
    return false;
  }
};