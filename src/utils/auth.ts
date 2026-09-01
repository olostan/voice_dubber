import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

// Public client-side configuration for 'fun-voice-dubber'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVw8MVAUma2nxePdRUpzUNeKA6MtZPOFk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fun-voice-dubber.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fun-voice-dubber",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fun-voice-dubber.firebasestorage.app",
  messagingSenderId: "305447084513",
  appId: "1:305447084513:web:83f8ffe125d8ae29da32a0",
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

let auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export async function signInWithGoogle(): Promise<AuthUserProfile | null> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(authInstance, provider);
  const user = result.user;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function signOutUser(): Promise<void> {
  const authInstance = getFirebaseAuth();
  await signOut(authInstance);
}

export function subscribeToAuthChanges(callback: (user: AuthUserProfile | null) => void): () => void {
  const authInstance = getFirebaseAuth();
  return onAuthStateChanged(authInstance, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

export async function getAuthToken(): Promise<string | null> {
  const authInstance = getFirebaseAuth();
  if (authInstance.currentUser) {
    try {
      return await authInstance.currentUser.getIdToken();
    } catch {
      return null;
    }
  }
  return null;
}
