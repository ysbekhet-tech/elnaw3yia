import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

let cachedProducts: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const now = Date.now();
    // Cache the products in memory for 5 minutes to avoid excessive Firestore reads
    if (cachedProducts.length === 0 || now - lastFetchTime > CACHE_DURATION) {
      const snap = await getDocs(collection(db, 'products'));
      cachedProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lastFetchTime = now;
    }

    const filtered = cachedProducts.filter((p) =>
      p.name?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );

    // Limit the results to 50 items to avoid large payloads
    return NextResponse.json(filtered.slice(0, 50));
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
