import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

// Auto-authentication system
let authInitialized = false;

export const initializeAuth = async () => {
  if (authInitialized) return;
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user && !authInitialized) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('❌ Website anonymous authentication failed:', error);
          if (error instanceof Error) {
            if (error.message.includes('admin-restricted-operation')) {
              console.error('💡 Fix: Enable Anonymous Authentication in Firebase Console > Authentication > Sign-in method');
            }
          }
        }
      }
      authInitialized = true;
      unsubscribe();
      resolve(user);
    });
  });
};

// Helper function to ensure auth before any Firestore operations
export const ensureAuth = async () => {
  await initializeAuth();
};

export default app;