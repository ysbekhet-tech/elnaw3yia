import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123';
    
    if (code === secret) {
      const tokenData = { authenticated: true, timestamp: Date.now() };
      const tokenString = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      const encoder = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(tokenString));
      const signatureBase64 = Buffer.from(new Uint8Array(signature)).toString('base64');
      
      const finalToken = `${tokenString}.${signatureBase64}`;
      
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'admin_token',
        value: finalToken,
        httpOnly: false, // Keeping it false so the client can still read it for UI purposes, but it's signed so it can't be forged.
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 // 1 day
      });
      
      return response;
    }
    
    return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
