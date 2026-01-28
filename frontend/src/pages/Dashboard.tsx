import { useWebSocket } from '../context/WebSocketContext'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { notifications, isConnected } = useWebSocket()

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>

      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">Pedidos Hoy</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">En Ruta</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">Entregados</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">Facturado</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Información de Usuario</h3>
          </div>
          <table className="table">
            <tbody>
              <tr>
                <td><strong>Usuario</strong></td>
                <td>{user?.username}</td>
              </tr>
              <tr>
                <td><strong>Email</strong></td>
                <td>{user?.email}</td>
              </tr>
              <tr>
                <td><strong>Rol</strong></td>
                <td>{user?.roles?.[0]?.replace('ROLE_', '')}</td>
              </tr>
              <tr>
                <td><strong>Zona</strong></td>
                <td>{user?.zonaId || 'No asignada'}</td>
              </tr>
              <tr>
                <td><strong>WebSocket</strong></td>
                <td>
                  <span className={`badge ${isConnected ? 'badge-success' : 'badge-danger'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Eventos en Tiempo Real</h3>
            <span className="badge badge-info">{notifications.length}</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                No hay eventos recientes
              </p>
            ) : (
              notifications.slice(0, 10).map((notification, index) => (
                <div key={index} style={{
                  padding: '10px',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: '500' }}>
                    {notification.data?.action || notification.type}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {notification.data?.message || JSON.stringify(notification.data).slice(0, 50)}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    {notification.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
