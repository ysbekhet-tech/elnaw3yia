import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // قراءة الكوكي
  const authToken = request.cookies.get('admin_token')?.value;

  let isAuthenticated = false;

  // التحقق من التوكن
  if (authToken) {
    try {
      // فك التشفير
      const decoded = JSON.parse(atob(authToken));
      if (decoded.authenticated === true) {
        isAuthenticated = true;
      }
    } catch (error) {
      isAuthenticated = false;
    }
  }

  // ١. حماية صفحات الأدمن (ما عدا صفحة الدخول)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // ٢. لو مسجل دخله بالفعل وحاول يفتح صفحة الدخول، حوله للداشبورد
  if (pathname.startsWith('/admin/login') && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// تحديد المسارات التي يعمل عليها الـ Middleware
export const config = {
  matcher: '/admin/:path*',
};