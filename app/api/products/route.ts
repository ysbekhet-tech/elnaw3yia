import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

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

export async function GET(request: NextRequest) {
  try {
    const productsCollection = collection(db, 'products');
    const snapshot = await getDocs(productsCollection);

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في جلب المنتجات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, price, category, barcode, image, stock } = body;

    // Validation
    if (!name || !price || !category || !barcode) {
      return NextResponse.json(
        { error: 'الاسم والسعر والفئة والباركود مطلوبة' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'السعر يجب أن يكون رقماً موجباً' },
        { status: 400 }
      );
    }

    const productData = {
      name,
      price,
      category,
      barcode,
      stock: stock || 0,
      image: image || '',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'products'), productData);

    return NextResponse.json(
      { id: docRef.id, ...productData },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في إنشاء المنتج' },
      { status: 500 }
    );
  }
}
