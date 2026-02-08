import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../context/WebSocketContext'

export default function Layout() {
  const { user, logout, hasRole } = useAuth()
  const { isConnected } = useWebSocket()

  const isRepartidor = hasRole('ROLE_REPARTIDOR')
  const isAdmin = hasRole('ROLE_ADMIN')
  const isGerente = hasRole('ROLE_GERENTE')
  const isSupervisor = hasRole('ROLE_SUPERVISOR')
  const isCliente = hasRole('ROLE_CLIENTE')

  const canViewFleet = isAdmin || isGerente || isSupervisor
  const canViewBilling = isAdmin || isGerente

  return (
    <div className="layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚚</span>
          <h1 style={{ margin: 0 }}>LogiFlow</h1>
        </div>

        <div style={{
          marginBottom: '20px',
          fontSize: '0.875rem',
          padding: '10px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '8px'
        }}>
          <p style={{ margin: '3px 0' }}>
            <strong>{user?.username}</strong>
          </p>
          <p style={{ margin: '3px 0', fontSize: '0.75rem', opacity: 0.8 }}>
            {user?.roles?.[0]?.replace('ROLE_', '')}
          </p>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '0.75rem',
            color: isConnected ? '#10b981' : '#ef4444'
          }}>
            {isConnected ? '● En línea' : '○ Desconectado'}
          </p>
        </div>

        <nav>
          {/* Dashboard - visible para todos excepto repartidores */}
          {!isRepartidor && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              📊 Dashboard
            </NavLink>
          )}

          {/* Panel de Repartidor */}
          {(isRepartidor || isAdmin) && (
            <NavLink to="/repartidor" className={({ isActive }) => isActive ? 'active' : ''}>
              🏍️ Mi Panel
            </NavLink>
          )}

          {/* Pedidos - visible para supervisores, gerentes, admin y clientes */}
          {!isRepartidor && (
            <NavLink to="/pedidos" className={({ isActive }) => isActive ? 'active' : ''}>
              📦 Pedidos
            </NavLink>
          )}

          {/* Flota - solo admin, gerente, supervisor */}
          {canViewFleet && (
            <NavLink to="/fleet" className={({ isActive }) => isActive ? 'active' : ''}>
              🚗 Flota
            </NavLink>
          )}

          {/* Facturación - solo admin, gerente */}
          {canViewBilling && (
            <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
              💰 Facturación
            </NavLink>
          )}
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
