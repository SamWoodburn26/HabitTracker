import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  apiMe,
  apiSignIn,
  apiSignUp,
  getToken,
  isApiConfigured,
  setToken,
  type AuthUser,
} from '../lib/api'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isApiConfigured)

  useEffect(() => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }

    let mounted = true
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    apiMe(token)
      .then((next) => {
        if (mounted) setUser(next)
      })
      .catch(() => {
        setToken(null)
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isApiConfigured) throw new Error('Sign-in is not configured yet.')
    const { user: next, token } = await apiSignIn(email, password)
    setToken(token)
    setUser(next)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isApiConfigured) throw new Error('Sign-in is not configured yet.')
    const { user: next, token } = await apiSignUp(email, password)
    setToken(token)
    setUser(next)
    return { needsEmailConfirm: false }
  }, [])

  const signOut = useCallback(async () => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isApiConfigured,
      loading,
      user,
      signIn,
      signUp,
      signOut,
    }),
    [loading, user, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
