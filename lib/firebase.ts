import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC6OhAbBefFIIf_w66R36u8sqtweuuPQn8",
  authDomain: "stationery-store-77640.firebaseapp.com",
  projectId: "stationery-store-77640",
  storageBucket: "stationery-store-77640.firebasestorage.app",
  messagingSenderId: "587038252416",
  appId: "1:587038252416:web:4ffa03b80be368e1b53565",
  measurementId: "G-5XNLYDYPSM",
};

// منع إعادة التهيئة في API Routes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);