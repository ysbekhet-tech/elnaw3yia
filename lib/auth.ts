import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const authenticateAdmin = async (enteredCode: string): Promise<boolean> => {
  const secretCode = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123';
  if (enteredCode !== secretCode) return false;

  try {
    const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL!;
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD!;
    await signInWithEmailAndPassword(auth, email, password);
    
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: enteredCode })
    });
    
    return res.ok;
  } catch (error) {
    console.error('Firebase login error:', error);
    return false;
  }
};

export const clearAuthToken = () => {
  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
  signOut(auth);
};

export const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/admin_token=([^;]*)/);
  if (!match) return null;
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
    const parts = token.split('.');
    const decoded = JSON.parse(atob(parts[0]));
    return decoded.authenticated === true;
  } catch {
    return false;
  }
};