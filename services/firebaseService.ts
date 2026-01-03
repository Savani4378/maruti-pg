
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

/**
 * Firebase Configuration for Maruti PG
 * IMPORTANT: Ensure you have replaced the placeholder values with your actual 
 * config from the Firebase Console for the project: maruti-pg-jaysavani
 */
const firebaseConfig = {
  apiKey: "AIzaSyAs-PLACEHOLDER", // Replace with actual API Key from Firebase Console
  authDomain: "maruti-pg-jaysavani.firebaseapp.com",
  projectId: "maruti-pg-jaysavani",
  storageBucket: "maruti-pg-jaysavani.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);

/**
 * We use initializeFirestore instead of getFirestore to enable:
 * 1. experimentalForceLongPolling: Fixes connectivity issues in environments that block WebSockets.
 * 2. localCache: Enables robust offline functionality and faster subsequent loads.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});

// Collection Names
const RESIDENTS_COL = 'residents';
const EXPENSES_COL = 'expenses';
const ANNOUNCEMENTS_COL = 'announcements';
const SETTINGS_COL = 'settings';

export const syncData = (collectionName: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    console.error(`Firebase Sync Error [${collectionName}]:`, error);
  });
};

export const saveToFirebase = async (collectionName: string, id: string, data: any) => {
  try {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
  } catch (error) {
    console.error("Firebase Save Error:", error);
    throw error;
  }
};

export const deleteFromFirebase = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error("Firebase Delete Error:", error);
    throw error;
  }
};
