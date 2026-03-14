import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
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
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle()
      const credential = GoogleAuthProvider.credential(result.credential?.idToken)
      await signInWithCredential(auth, credential)
    } else {
      await signInWithPopup(auth, new GoogleAuthProvider())
    }
  }

  const signInWithApple = async () => {
    if (!auth) return
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true })
        const idToken = result.credential?.idToken
        const nonce = result.credential?.nonce
        if (!idToken) {
          throw new Error(result?.credential ? 'Apple sign-in was cancelled.' : 'Apple sign-in failed. Enable Sign in with Apple in Xcode (Signing & Capabilities) and configure the Apple provider in Firebase Console.')
        }
        const provider = new OAuthProvider('apple.com')
        const credential = provider.credential({
          idToken,
          rawNonce: nonce ?? undefined,
        })
        await signInWithCredential(auth, credential)
      } catch (err) {
        const msg = err?.message || String(err)
        const code = err?.code ?? ''
        if (msg.includes('1001') || msg.includes('cancelled') || code === '1001') {
          throw new Error('Sign in was cancelled.')
        }
        if (msg.includes('operation') && msg.toLowerCase().includes('completed')) {
          throw new Error('Apple Sign In failed. Add "Sign in with Apple" capability in Xcode (Signing & Capabilities) and enable it for your App ID in Apple Developer.')
        }
        throw err
      }
    } else {
      const provider = new OAuthProvider('apple.com')
      await signInWithPopup(auth, provider)
    }
  }

  const signOut = async () => {
    if (!auth) return
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut()
    }
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
