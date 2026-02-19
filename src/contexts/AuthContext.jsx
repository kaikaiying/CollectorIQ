import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!auth)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithEmail = async (email, password) => {
    if (!auth) return
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email, password, displayName) => {
    if (!auth) return
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName?.trim()) {
      await updateProfile(newUser, { displayName: displayName.trim() })
    }
  }

  const signInWithGoogle = async () => {
    if (!auth) return
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  const signInWithApple = async () => {
    if (!auth) return
    const provider = new OAuthProvider('apple.com')
    await signInWithPopup(auth, provider)
  }

  const signOut = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }

  const resetPassword = async (email) => {
    if (!auth) return
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    loading,
    authReady: !!auth,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
