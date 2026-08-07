import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Configuration for nexlance-fb3fc
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBJW0kA23xRkoduF0LUOnK2TJuPo0jKLs0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexlance-fb3fc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexlance-fb3fc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexlance-fb3fc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "363080675189",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:363080675189:web:fb158846868ea11d596d3c"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export default app;
