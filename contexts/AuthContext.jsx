import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    // Initial session check
    checkUser()

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Check for existing session
  async function checkUser() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error getting auth session:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user profile from database
  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      setError(error.message)
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Google:', error.message)
      setError(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  async function signOut() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Update profile
  async function updateProfile(updates) {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      setProfile(prev => ({ ...prev, ...updates }))
      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error.message)
      setError(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signInWithGoogle,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}