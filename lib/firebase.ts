import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: 'AIzaSyCR6mBQnJBuKrXGAs_YLl6hpX8bQYHYHQc',
  appId: '1:757476048946:web:8f26b05f2136be73efbc2b',
  messagingSenderId: '757476048946',
  projectId: 'vigilhub-firebase',
  authDomain: 'vigilhub-firebase.firebaseapp.com',
  // Firebase storage bucket must be the gs/appspot domain, not the HTTPS host
 // storageBucket: 'vigilhub-firebase.appspot.com',
  storageBucket: 'vigilhub-firebase.firebasestorage.app',
  measurementId: 'G-F4C4QXBXCP',
}

// Initialize Firebase
let app
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
} catch (error) {
  console.error('Error initializing Firebase:', error)
  throw error
}

// Initialize Firestore and Storage
const db = getFirestore(app)
// Use default bucket inferred from config. This respects your current bucket domain
// Explicitly point to the gs bucket to avoid domain mismatches
const storage = getStorage(app, 'gs://vigilhub-firebase.firebasestorage.app')

export { db, storage }

/**
 * Helper function to add "Mak." prefix to collection names
 * @param collectionName - The collection name without prefix
 * @returns Collection name with "Mak." prefix
 */
export function getCollectionName(collectionName: string): string {
  // If already has Mak. prefix, return as is
  if (collectionName.startsWith('Mak.')) {
    return collectionName
  }
  // Add Mak. prefix
  return `Mak.${collectionName}`
}
// ***********************