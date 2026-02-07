import { gql, useQuery, useMutation } from '@apollo/client'
import { fleetClient } from '../services/apollo.client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Modificamos la query para manejar tipos abstractos (Soluciona Error 2)
const GET_VEHICULOS = gql`
  query GetVehiculos {
    vehiculos {
      id
      placa
      marca
      modelo
      estado
      activo
      ... on Moto { tipoMoto }
      ... on Liviano { tipoAuto }
      ... on Camion { capacidadToneladas }
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
      }
    }
  }
`

const GET_FLOTA_ACTIVA = gql`
  query FleetFlotaActiva {
  flotaActiva {
    total
    disponibles
    enRuta
    mantenimiento
  }
}
`

const CREAR_MOTO = gql`
  mutation CrearMoto($input: CreateMotoInput!) {
    crearMoto(input: $input) { id placa }
  }
`

export default function Fleet() {

  const { user } = useAuth()

  const isAdminLike = user?.roles?.some(r =>
    ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR'].includes(r)
  )

  const isRepartidor = user?.roles?.includes('ROLE_REPARTIDOR')

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState('MOTO')
  const [formData, setFormData] = useState({
    placa: '', marca: '', modelo: '', color: '', anioFabricacion: '2024', cilindraje: 150, tipoMoto: 'NAKED'
  })

  // Queries
  const { data: vehiculosData, loading: loadingVehiculos, refetch: refetchVehiculos } = useQuery(GET_VEHICULOS, { client: fleetClient })
  const { data: repartidoresData, loading: loadingRepartidores } = useQuery(GET_REPARTIDORES, { client: fleetClient })
  const { data: flotaData, refetch: refetchFlota } = useQuery(GET_FLOTA_ACTIVA, { client: fleetClient })

  // Mutación
  const [crearMoto] = useMutation(CREAR_MOTO, { 
    client: fleetClient,
    onCompleted: () => {
      refetchVehiculos()
      refetchFlota()
      setShowForm(false)
      alert('Vehículo añadido!')
    }
  })

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (tipo === 'MOTO') {
        await crearMoto({ variables: { input: formData } })
      }
      // Aquí podrías añadir las condiciones para LIVIANO y CAMION
    } catch (err) {
      alert('Error al crear: ' + err)
    }
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Flota</h1>
        {isAdminLike && (
        <button onClick={() => setShowForm(!showForm)}>
          + Añadir Vehículo
        </button>
        )}
      </div>

      {/* Formulario de Adición */}

      {isAdminLike && showForm && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid #3b82f6' }}>
          <form onSubmit={handleAddVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '10px' }}>
            <input placeholder="Placa" required onChange={e => setFormData({...formData, placa: e.target.value})} />
            <input placeholder="Marca" required onChange={e => setFormData({...formData, marca: e.target.value})} />
            <input placeholder="Modelo" required onChange={e => setFormData({...formData, modelo: e.target.value})} />
            <input placeholder="Color" required onChange={e => setFormData({...formData, color: e.target.value})} />
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="MOTO">Moto</option>
              <option value="LIVIANO">Liviano </option>
            </select>
            <button type="submit" className="badge-success" style={{ cursor: 'pointer' }}>Guardar</button>
          </form>
        </div>
      )}

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
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosData?.vehiculos?.map((v: any) => (
                  <tr key={v.id}>
                    <td><strong>{v.placa}</strong></td>
                    <td>{v.marca} {v.modelo}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(v.estado)}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Repartidores */}
        {isRepartidor && (
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
                  <th>Vehículo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {repartidoresData?.repartidores?.map((r: any) => (
                  <tr key={r.id}>
                    <td><strong>{r.nombre} {r.apellido}</strong></td>
                    <td>{r.vehiculo?.placa || 'Sin asignar'}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        )}
      </div>
    </div>
  )
}