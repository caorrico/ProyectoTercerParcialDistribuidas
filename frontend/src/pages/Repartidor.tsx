import { useState, useEffect } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { pedidoClient, fleetClient } from '../services/apollo.client'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../context/WebSocketContext'

const GET_PEDIDOS_DISPONIBLES = gql`
  query GetPedidosDisponibles {
    pedidos(filtro: { estado: RECIBIDO }) {
      id
      codigo
      direccionOrigen
      direccionDestino
      descripcion
      tipoEntrega
      peso
      zonaId
      createdAt
    }
  }
`

const GET_MIS_PEDIDOS = gql`
  query GetMisPedidos($repartidorId: Int!) {
    pedidosPorRepartidor(repartidorId: $repartidorId) {
      id
      codigo
      direccionOrigen
      direccionDestino
      descripcion
      estado
      tipoEntrega
      peso
      latDestino
      lngDestino
      createdAt
    }
  }
`

const GET_VEHICULOS_DISPONIBLES = gql`
  query GetVehiculosDisponibles {
    vehiculosDisponibles {
      id
      placa
      tipoVehiculo
      marca
      modelo
    }
  }
`

const TOMAR_PEDIDO = gql`
  mutation TomarPedido($input: TomarPedidoInput!) {
    tomarPedido(input: $input) {
      id
      codigo
      estado
      repartidorId
    }
  }
`

const CAMBIAR_ESTADO_PEDIDO = gql`
  mutation CambiarEstadoPedido($id: ID!, $estado: EstadoPedido!) {
    cambiarEstadoPedido(id: $id, estado: $estado) {
      id
      estado
    }
  }
`

const ACTUALIZAR_UBICACION = gql`
  mutation ActualizarUbicacion($id: Int!, $lat: Float!, $lng: Float!) {
    actualizarUbicacionRepartidor(id: $id, lat: $lat, lng: $lng) {
      id
      latActual
      lngActual
      ultimaActualizacionUbicacion
    }
  }
`

export default function Repartidor() {
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const [activeTab, setActiveTab] = useState<'disponibles' | 'mis-pedidos'>('disponibles')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Record<number, number>>({})
  const [ubicacionActual, setUbicacionActual] = useState<{ lat: number; lng: number } | null>(null)

  // Queries
  const { data: pedidosDisponibles, loading: loadingDisponibles, refetch: refetchDisponibles } =
    useQuery(GET_PEDIDOS_DISPONIBLES, { client: pedidoClient })

  const { data: misPedidos, loading: loadingMisPedidos, refetch: refetchMisPedidos } =
    useQuery(GET_MIS_PEDIDOS, {
      client: pedidoClient,
      variables: { repartidorId: user?.id },
      skip: !user?.id
    })

  const { data: vehiculosData } = useQuery(GET_VEHICULOS_DISPONIBLES, { client: fleetClient })

  // Mutations
  const [tomarPedido] = useMutation(TOMAR_PEDIDO, { client: pedidoClient })
  const [cambiarEstado] = useMutation(CAMBIAR_ESTADO_PEDIDO, { client: pedidoClient })
  const [actualizarUbicacion] = useMutation(ACTUALIZAR_UBICACION, { client: fleetClient })

  // Obtener ubicación GPS
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUbicacionActual({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => console.error('Error GPS:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Enviar ubicación periódicamente
  useEffect(() => {
    if (ubicacionActual && user?.id) {
      const interval = setInterval(async () => {
        try {
          await actualizarUbicacion({
            variables: {
              id: user.id,
              lat: ubicacionActual.lat,
              lng: ubicacionActual.lng
            }
          })
        } catch (error) {
          console.error('Error actualizando ubicación:', error)
        }
      }, 30000) // Cada 30 segundos

      return () => clearInterval(interval)
    }
  }, [ubicacionActual, user?.id])

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.action?.includes('PEDIDO')) {
        refetchDisponibles()
        refetchMisPedidos()
      }
    }
  }, [lastMessage])

  const handleTomarPedido = async (pedidoId: number) => {
    const vehiculoId = vehiculoSeleccionado[pedidoId]
    if (!vehiculoId) {
      alert('Selecciona un vehículo primero')
      return
    }

    try {
      await tomarPedido({
        variables: { input: { pedidoId, vehiculoId } }
      })
      refetchDisponibles()
      refetchMisPedidos()
      setActiveTab('mis-pedidos')
      alert('Pedido tomado exitosamente')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleCambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    try {
      await cambiarEstado({
        variables: { id: pedidoId, estado: nuevoEstado }
      })
      refetchMisPedidos()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      RECIBIDO: '#3b82f6',
      ASIGNADO: '#f59e0b',
      EN_RUTA: '#8b5cf6',
      ENTREGADO: '#10b981',
      CANCELADO: '#ef4444'
    }
    return colores[estado] || '#6b7280'
  }

  const getTipoEntregaIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      URBANO: '🏍️',
      INTERMUNICIPAL: '🚗',
      NACIONAL: '🚚'
    }
    return icons[tipo] || '📦'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Panel de Repartidor</h1>
        {ubicacionActual && (
          <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
            📍 GPS Activo ({ubicacionActual.lat.toFixed(4)}, {ubicacionActual.lng.toFixed(4)})
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'disponibles' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('disponibles')}
        >
          Pedidos Disponibles ({pedidosDisponibles?.pedidos?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'mis-pedidos' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('mis-pedidos')}
        >
          Mis Pedidos ({misPedidos?.pedidosPorRepartidor?.length || 0})
        </button>
      </div>

      {/* Pedidos Disponibles */}
      {activeTab === 'disponibles' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pedidos Disponibles para Tomar</h3>
          </div>

          {loadingDisponibles ? (
            <p style={{ padding: '20px' }}>Cargando pedidos...</p>
          ) : pedidosDisponibles?.pedidos?.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No hay pedidos disponibles en este momento
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '15px', padding: '15px' }}>
              {pedidosDisponibles?.pedidos?.map((pedido: any) => (
                <div
                  key={pedido.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>
                      {getTipoEntregaIcon(pedido.tipoEntrega)} {pedido.codigo}
                    </span>
                    <span className="badge badge-info">{pedido.tipoEntrega}</span>
                  </div>

                  <p style={{ margin: '5px 0', fontSize: '0.875rem' }}>
                    <strong>Origen:</strong> {pedido.direccionOrigen}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.875rem' }}>
                    <strong>Destino:</strong> {pedido.direccionDestino}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    {pedido.descripcion}
                  </p>
                  {pedido.peso && (
                    <p style={{ margin: '5px 0', fontSize: '0.875rem' }}>
                      <strong>Peso:</strong> {pedido.peso} kg
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
                    <select
                      value={vehiculoSeleccionado[pedido.id] || ''}
                      onChange={(e) => setVehiculoSeleccionado({
                        ...vehiculoSeleccionado,
                        [pedido.id]: Number(e.target.value)
                      })}
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">Seleccionar vehículo...</option>
                      {vehiculosData?.vehiculosDisponibles?.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.placa} - {v.marca} {v.modelo} ({v.tipoVehiculo})
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-success"
                      onClick={() => handleTomarPedido(pedido.id)}
                      disabled={!vehiculoSeleccionado[pedido.id]}
                    >
                      Tomar Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mis Pedidos */}
      {activeTab === 'mis-pedidos' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Mis Pedidos Asignados</h3>
          </div>

          {loadingMisPedidos ? (
            <p style={{ padding: '20px' }}>Cargando pedidos...</p>
          ) : misPedidos?.pedidosPorRepartidor?.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No tienes pedidos asignados
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '15px', padding: '15px' }}>
              {misPedidos?.pedidosPorRepartidor?.map((pedido: any) => (
                <div
                  key={pedido.id}
                  style={{
                    border: `2px solid ${getEstadoColor(pedido.estado)}`,
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>
                      {getTipoEntregaIcon(pedido.tipoEntrega)} {pedido.codigo}
                    </span>
                    <span
                      className="badge"
                      style={{ backgroundColor: getEstadoColor(pedido.estado), color: 'white' }}
                    >
                      {pedido.estado}
                    </span>
                  </div>

                  <p style={{ margin: '5px 0', fontSize: '0.875rem' }}>
                    <strong>Origen:</strong> {pedido.direccionOrigen}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.875rem' }}>
                    <strong>Destino:</strong> {pedido.direccionDestino}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    {pedido.descripcion}
                  </p>

                  {/* Acciones según estado */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    {pedido.estado === 'ASIGNADO' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleCambiarEstado(pedido.id, 'EN_RUTA')}
                      >
                        🚀 Iniciar Ruta
                      </button>
                    )}

                    {pedido.estado === 'EN_RUTA' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleCambiarEstado(pedido.id, 'ENTREGADO')}
                        >
                          ✅ Confirmar Entrega
                        </button>
                        {pedido.latDestino && pedido.lngDestino && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pedido.latDestino},${pedido.lngDestino}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            🗺️ Navegar
                          </a>
                        )}
                      </>
                    )}

                    {pedido.estado === 'ENTREGADO' && (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ✓ Entrega completada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
