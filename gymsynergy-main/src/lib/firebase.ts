import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { 
  getFirestore,
  getDoc,
  doc,
  setDoc,
  DocumentData,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAHff5lb5A6gTseA5BArUemF6FlgE7tPHk",
  authDomain: "gym-application-ffa6d.firebaseapp.com",
  projectId: "gym-application-ffa6d",
  storageBucket: "gym-application-ffa6d.appspot.com",
  messagingSenderId: "909126258660",
  appId: "1:909126258660:web:845333db9917851d2e01f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Initialize Firestore with optimized settings
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }),
  experimentalAutoDetectLongPolling: true // Remove experimentalForceLongPolling to avoid conflict
});

// Initialize Storage
const storage = getStorage(app);

// Helper function to handle Firestore operations with enhanced error handling and retry logic
export const handleFirestoreOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      console.error('Firestore operation error:', error);
      lastError = error;
      
      // Don't retry certain errors
      if (error.code === 'permission-denied' || 
          error.code === 'not-found' ||
          error.code === 'invalid-argument') {
        break;
      }
      
      // Handle specific errors
      if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        if (i === maxRetries - 1) {
          throw new Error('You appear to be offline. Please check your internet connection and try again.');
        }
      } else if (error.code === 'deadline-exceeded') {
        if (i === maxRetries - 1) {
          throw new Error('Operation timed out. Please try again.');
        }
      }
      
      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
    }
  }
  
  // Handle final error
  if (lastError) {
    if (lastError.code === 'permission-denied') {
      throw new Error('You do not have permission to perform this action.');
    } else if (lastError.code === 'not-found') {
      throw new Error('The requested resource was not found.');
    } else if (lastError.code === 'invalid-argument') {
      throw new Error('Invalid data provided. Please check your input.');
    }
    
    throw new Error(lastError.message || 'An error occurred while performing the operation.');
  }
  
  throw new Error('Operation failed after multiple retries.');
};

// User profile type definition
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'client' | 'instructor';
  createdAt: Date;
  updatedAt: Date;
}

// Get user profile with error handling
export const getUserProfile = async (userId: string | User) => {
  return handleFirestoreOperation(async () => {
    const uid = typeof userId === 'string' ? userId : userId.uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  });
};

// Create user profile with error handling
export const createUserProfile = async (
  user: User | string,
  type: 'instructor' | 'client',
  additionalData: Partial<UserProfile> = {}
) => {
  return handleFirestoreOperation(async () => {
    const userId = typeof user === 'string' ? user : user.uid;
    const userProfile: UserProfile = {
      uid: userId,
      email: typeof user === 'string' ? additionalData.email || '' : user.email || '',
      displayName: typeof user === 'string' ? additionalData.displayName : user.displayName || '',
      photoURL: typeof user === 'string' ? additionalData.photoURL : user.photoURL || '',
      role: type,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...additionalData
    };
    await setDoc(doc(db, 'users', userId), userProfile);
    return userProfile;
  });
};

export { app, auth, db, storage };
