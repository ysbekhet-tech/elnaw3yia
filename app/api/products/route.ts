import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// التحقق من إن الأدمن هو اللي بيرفع الصور (نفس نظامك)
const verifyAuth = (request: NextRequest) => {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.authenticated === true;
  } catch {
    return false;
  }
};

// إعداد Cloudinary باستخدام المتغيرات السرية من .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  // 1. التحقق من الصلاحيات
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح برفع الصور' },
      { status: 401 }
    );
  }

  try {
    // 2. استقبال الصورة كـ Base64
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'لم يتم إرسال صورة' },
        { status: 400 }
      );
    }

    // 3. رفع الصورة إلى Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'products', // اسم الفولدر في Cloudinary
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // ضغط تلقائي وتحويل لـ WebP
      ],
    });

    // 4. إرجاع الرابط الآمن والـ Public ID
    return NextResponse.json({ 
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id 
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الصورة' },
      { status: 500 }
    );
  }
}