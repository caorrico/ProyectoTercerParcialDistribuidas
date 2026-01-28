import { gql, useQuery } from '@apollo/client'
import { fleetClient } from '../services/apollo.client'

const GET_VEHICULOS = gql`
  query GetVehiculos {
    vehiculos {
      id
      placa
      marca
      modelo
      tipoVehiculo
      estado
      activo
    }
  }
`

const GET_REPARTIDORES = gql`
  query GetRepartidores {
    repartidores {
      id
      identificacion
      nombre
      apellido
      telefono
      tipoLicencia
      estado
      vehiculo {
        placa
        tipoVehiculo
      }
    }
  }
`

const GET_FLOTA_ACTIVA = gql`
  query GetFlotaActiva {
    flotaActiva {
      total
      disponibles
      enRuta
      mantenimiento
    }
  }
`

export default function Fleet() {
  const { data: vehiculosData, loading: loadingVehiculos } = useQuery(GET_VEHICULOS, { client: fleetClient })
  const { data: repartidoresData, loading: loadingRepartidores } = useQuery(GET_REPARTIDORES, { client: fleetClient })
  const { data: flotaData } = useQuery(GET_FLOTA_ACTIVA, { client: fleetClient })

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      DISPONIBLE: 'badge-success',
      EN_RUTA: 'badge-warning',
      MANTENIMIENTO: 'badge-danger',
      ACTIVO: 'badge-success',
      INACTIVO: 'badge-danger'
    }
    return badges[estado] || 'badge-info'
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Gestión de Flota</h1>

      {/* Estadísticas */}
      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-value">{flotaData?.flotaActiva?.total || 0}</div>
          <div className="stat-label">Total Vehículos</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{flotaData?.flotaActiva?.disponibles || 0}</div>
          <div className="stat-label">Disponibles</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{flotaData?.flotaActiva?.enRuta || 0}</div>
          <div className="stat-label">En Ruta</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{flotaData?.flotaActiva?.mantenimiento || 0}</div>
          <div className="stat-label">Mantenimiento</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Vehículos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vehículos</h3>
          </div>
          {loadingVehiculos ? (
            <p>Cargando...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca/Modelo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosData?.vehiculos?.map((v: any) => (
                  <tr key={v.id}>
                    <td><strong>{v.placa}</strong></td>
                    <td>{v.marca} {v.modelo}</td>
                    <td>{v.tipoVehiculo}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(v.estado)}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!vehiculosData?.vehiculos || vehiculosData.vehiculos.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                      No hay vehículos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Repartidores */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Repartidores</h3>
          </div>
          {loadingRepartidores ? (
            <p>Cargando...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Licencia</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {repartidoresData?.repartidores?.map((r: any) => (
                  <tr key={r.id}>
                    <td><strong>{r.nombre} {r.apellido}</strong></td>
                    <td>{r.tipoLicencia}</td>
                    <td>{r.vehiculo?.placa || 'Sin asignar'}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!repartidoresData?.repartidores || repartidoresData.repartidores.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                      No hay repartidores registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
