import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import Fleet from './pages/Fleet'
import Billing from './pages/Billing'
import Repartidor from './pages/Repartidor'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

// Ruta protegida por rol
function RoleRoute({
  children,
  allowedRoles,
  redirectTo = '/'
}: {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  const hasRole = user?.roles?.some(role => allowedRoles.includes(role))
  return hasRole ? <>{children}</> : <Navigate to={redirectTo} />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="fleet" element={
          <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR']}>
            <Fleet />
          </RoleRoute>
        } />
        <Route path="billing" element={
          <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_GERENTE']}>
            <Billing />
          </RoleRoute>
        } />
        <Route path="repartidor" element={
          <RoleRoute allowedRoles={['ROLE_REPARTIDOR', 'ROLE_ADMIN']}>
            <Repartidor />
          </RoleRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
