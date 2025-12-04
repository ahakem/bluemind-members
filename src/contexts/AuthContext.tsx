import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserData: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Clean up previous user data listener if it exists
      if (unsubscribeUserData) {
        unsubscribeUserData();
        unsubscribeUserData = null;
      }
      
      if (user) {
        // Set up real-time listener for user data
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserData = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() as User;
              console.log('🔍 User data updated:', data);
              console.log('✅ Approved:', data.approved);
              console.log('👤 Role:', data.role);
              setUserData(data);
            } else {
              console.log('⚠️ User document does not exist');
            }
            setLoading(false);
          },
          (error) => {
            console.error('❌ Error fetching user data:', error);
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const newUser: User = {
      uid: user.uid,
      email: email,
      name: name,
      role: 'member',
      createdAt: new Date(),
      approved: false, // Pending admin approval
    };

    await setDoc(doc(db, 'users', user.uid), newUser);
    
    return userCredential;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userData) return false;
    if (role === 'admin') return userData.role === 'admin' || userData.role === 'coach' || userData.role === 'super-admin' || userData.role === 'board';
    return userData.role === role;
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
