import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // supabase auth user
  const [profile, setProfile] = useState(null) // public.profiles row
  const [loading, setLoading] = useState(true)

  async function loadProfile(authUser) {
    if (!authUser) { setProfile(null); setUser(null); return }
    try {
      const p = await getProfile(authUser.id)
      setUser(authUser)
      setProfile(p)
    } catch {
      setUser(authUser)
      setProfile(null)
    }
  }

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = { user, profile, loading, refreshProfile: () => user && loadProfile(user) }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// Convenience role checks
export function useRole() {
  const { profile } = useAuth()
  const role = profile?.role ?? 'brouwer'
  return {
    role,
    isSuperuser: role === 'superuser',
    isAdmin: role === 'admin' || role === 'superuser',
    isAny: true,
  }
}
