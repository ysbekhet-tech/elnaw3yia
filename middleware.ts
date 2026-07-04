import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // قراءة الكوكي
  const authToken = request.cookies.get('admin_token')?.value;

  let isAuthenticated = false;

  // التحقق من التوكن
  if (authToken) {
    try {
      const parts = authToken.split('.');
      if (parts.length === 2) {
        const tokenString = parts[0];
        const signatureBase64 = parts[1];
        
        const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123';
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );
        
        const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
        
        const isValid = await crypto.subtle.verify(
          'HMAC',
          key,
          signatureBytes,
          encoder.encode(tokenString)
        );
        
        if (isValid) {
          const decoded = JSON.parse(atob(tokenString));
          if (decoded.authenticated === true) {
            isAuthenticated = true;
          }
        }
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