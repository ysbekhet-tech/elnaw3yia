import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const productDoc = doc(db, 'products', id);
    const snapshot = await getDoc(productDoc);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: snapshot.id,
      ...snapshot.data(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في جلب المنتج' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, price, stock, category, barcode, image } = body;

    // Validation for price if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json(
        { error: 'السعر يجب أن يكون رقماً موجباً' },
        { status: 400 }
      );
    }

    const productDoc = doc(db, 'products', id);
    const snapshot = await getDoc(productDoc);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (category !== undefined) updateData.category = category;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (image !== undefined) updateData.image = image;

    await updateDoc(productDoc, updateData);

    return NextResponse.json({
      id: params.id,
      ...snapshot.data(),
      ...updateData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في تحديث المنتج' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const productDoc = doc(db, 'products', id);
    await deleteDoc(productDoc);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في حذف المنتج' },
      { status: 500 }
    );
  }
}
