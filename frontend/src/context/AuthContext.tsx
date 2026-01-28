import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { gql, useMutation } from '@apollo/client'

interface User {
  id: string
  username: string
  email: string
  roles: string[]
  zonaId?: string
  tipoFlota?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
  rol: string
  zonaId?: string
  tipoFlota?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      usuario {
        id
        username
        email
        roles
        zonaId
        tipoFlota
      }
    }
  }
`

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      usuario {
        id
        username
        email
        roles
        zonaId
        tipoFlota
      }
    }
  }
`

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [loginMutation] = useMutation(LOGIN_MUTATION)
  const [registerMutation] = useMutation(REGISTER_MUTATION)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await loginMutation({
      variables: { input: { username, password } }
    })

    const { token: newToken, usuario } = data.login
    setToken(newToken)
    setUser(usuario)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(usuario))
    navigate('/')
  }

  const register = async (registerData: RegisterData) => {
    const { data } = await registerMutation({
      variables: { input: registerData }
    })

    const { token: newToken, usuario } = data.register
    setToken(newToken)
    setUser(usuario)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(usuario))
    navigate('/')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      logout,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
