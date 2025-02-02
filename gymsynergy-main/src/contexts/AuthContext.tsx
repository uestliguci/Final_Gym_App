import { createContext, useContext, useEffect, useState } from 'react';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, createUserProfile, getUserProfile, UserProfile, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, type: 'instructor' | 'client', displayName: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: (type: 'instructor' | 'client') => Promise<UserCredential>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (
    email: string, 
    password: string, 
    type: 'instructor' | 'client',
    displayName: string
  ) => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user, type, { displayName });
      const profile = await getUserProfile(userCredential.user.uid);
      setUserProfile(profile);
      return userCredential;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(userCredential.user.uid);
      
      if (!profile) {
        await signOut(auth);
        throw new Error('Account setup incomplete. Please contact support.');
      }
      
      setCurrentUser(userCredential.user);
      setUserProfile(profile);

      if (profile.role === 'instructor') {
        window.location.href = '/instructor/dashboard';
      } else {
        window.location.href = '/';
      }

      return userCredential;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async (type: 'instructor' | 'client') => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
      auth_type: 'reauthenticate'
    });

    let result;
    try {
      // Try popup first
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup fails, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
          result = await getRedirectResult(auth);
          if (!result) {
            throw new Error('Failed to complete Google sign in. Please try again.');
          }
        } else {
          throw popupError;
        }
      }

      const user = result.user;
      let profile = await getUserProfile(user.uid);
      
      if (!profile) {
        // Create new profile based on type
        if (type === 'instructor') {
          await setDoc(doc(db, 'instructor_profiles', user.uid), {
            userId: user.uid,
            profile: {
              displayName: user.displayName || '',
              email: user.email || '',
              bio: '',
              specialties: [],
              rating: 0,
              reviewCount: 0,
              verified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            settings: {
              emailNotifications: true,
              pushNotifications: true,
              theme: 'light',
              availability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: [],
              },
            },
            fees: {
              baseRate: 0,
              sessionFee: 0,
              planFee: 0,
              currency: 'USD',
            },
            stats: {
              totalClients: 0,
              activeClients: 0,
              totalSessions: 0,
              totalEarnings: 0,
            },
            verification: {
              status: 'pending',
              documents: [],
              submittedAt: new Date(),
            },
          });
        } else {
          await setDoc(doc(db, 'client_profiles', user.uid), {
            userId: user.uid,
            demographic: {
              dateOfBirth: '',
              gender: '',
              height: '',
              weight: '',
              occupation: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            health: {
              healthConditions: [],
              medicalHistory: '',
              allergies: [],
              bloodType: '',
              bmi: '',
              updatedAt: new Date(),
            },
            measurements: {
              chest: '',
              waist: '',
              hips: '',
              biceps: '',
              thighs: '',
              updatedAt: new Date(),
            },
            settings: {
              emailNotifications: true,
              pushNotifications: true,
              theme: 'light',
            },
            subscription: {
              status: 'free',
              startDate: new Date(),
            },
          });
        }

        profile = await createUserProfile(user, type);
      }

      setUserProfile(profile);
      setCurrentUser(user);

      if (type === 'instructor') {
        window.location.href = '/instructor/dashboard';
      } else {
        window.location.href = '/';
      }

      return result;
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked. Please try again with redirect sign in.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection and try again.');
    }
    await signOut(auth);
    setUserProfile(null);
    window.location.href = '/';
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...data,
        updatedAt: new Date()
      }, { merge: true });

      const updatedProfile = await getUserProfile(currentUser.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribe: () => void;

    const setupAuthListener = async () => {
      if (mounted) setLoading(true);

      try {
        // Check for redirect result first
        const result = await getRedirectResult(auth);
        if (result) {
          const profile = await getUserProfile(result.user.uid);
          if (mounted && profile) {
            setCurrentUser(result.user);
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!mounted) return;

        try {
          if (user) {
            const profile = await getUserProfile(user.uid);
            if (!mounted) return;

            if (!profile) {
              console.error('No profile found for user:', user.uid);
              await signOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
            } else {
              setCurrentUser(user);
              setUserProfile(profile);
            }
          } else {
            setCurrentUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (mounted) {
            setCurrentUser(null);
            setUserProfile(null);
            await signOut(auth);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      });
    };

    setupAuthListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    sendPasswordReset,
    sendVerificationEmail,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
