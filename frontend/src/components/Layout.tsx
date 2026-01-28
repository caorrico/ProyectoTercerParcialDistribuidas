import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../context/WebSocketContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>LogiFlow</h1>

        <div style={{ marginBottom: '20px', fontSize: '0.875rem' }}>
          <p>Usuario: {user?.username}</p>
          <p>Rol: {user?.roles?.[0]?.replace('ROLE_', '')}</p>
          <p style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? '● Conectado' : '○ Desconectado'}
          </p>
        </div>

        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/pedidos" className={({ isActive }) => isActive ? 'active' : ''}>
            Pedidos
          </NavLink>
          <NavLink to="/fleet" className={({ isActive }) => isActive ? 'active' : ''}>
            Flota
          </NavLink>
          <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
            Facturación
          </NavLink>
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 'auto',
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px'
          }}
          className="btn btn-danger"
        >
          Cerrar Sesión
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
