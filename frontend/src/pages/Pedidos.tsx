import { useState } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { pedidoClient, fleetClient } from '../services/apollo.client'

const GET_PEDIDOS = gql`
  query GetPedidos {
    pedidos {
      id
      codigo
      direccionOrigen
      direccionDestino
      estado
      tipoEntrega
      createdAt
    }
  }
`

const GET_VEHICULOS_DISPONIBLES = gql`
  query GetVehiculosDisponibles {
    vehiculosDisponibles {
      id
      placa
      tipo
      estado
    }
  }
`

const TOMAR_PEDIDO = gql`
  mutation TomarPedido($input: TomarPedidoInput!) {
    tomarPedido(input: $input) {
      id
      estado
      vehiculoId
    }
  }
`

const INICIAR_ENTREGA = gql`
  mutation IniciarEntrega($id: ID!) {
    iniciarEntrega(id: $id) {
      id
      estado
    }
  }
`

const CONFIRMAR_ENTREGA = gql`
  mutation ConfirmarEntrega($id: ID!) {
    confirmarEntrega(id: $id) {
      id
      estado
    }
  }
`

export default function Pedidos() {
  const { data, loading, refetch } = useQuery(GET_PEDIDOS, { client: pedidoClient })
  const { data: vehiculosData } = useQuery(GET_VEHICULOS_DISPONIBLES, { client: fleetClient })

  const [tomarPedido] = useMutation(TOMAR_PEDIDO, { client: pedidoClient })
  const [iniciarEntrega] = useMutation(INICIAR_ENTREGA, { client: pedidoClient })
  const [confirmarEntrega] = useMutation(CONFIRMAR_ENTREGA, { client: pedidoClient })

  // 👉 Vehículo seleccionado POR pedido
  const [vehiculoSeleccionado, setVehiculoSeleccionado] =
    useState<Record<number, number>>({})

  const handleTomarPedido = async (pedidoId: number) => {
    const vehiculoId = vehiculoSeleccionado[pedidoId]
    if (!vehiculoId) return alert('Selecciona un vehículo')

    await tomarPedido({
      variables: {
        input: { pedidoId, vehiculoId }
      }
    })

    refetch()
  }

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      RECIBIDO: 'badge-info',
      ASIGNADO: 'badge-warning',
      EN_RUTA: 'badge-warning',
      ENTREGADO: 'badge-success',
      CANCELADO: 'badge-danger'
    }
    return map[estado] || 'badge-info'
  }

  return (
    <div className="card">
      {loading ? (
        <p>Cargando pedidos...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.pedidos?.map((p: any) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.direccionOrigen}</td>
                <td>{p.direccionDestino}</td>
                <td>
                  <span className={`badge ${getEstadoBadge(p.estado)}`}>
                    {p.estado}
                  </span>
                </td>
                <td>
                  {p.estado === 'RECIBIDO' && (
                    <>
                      <select
                        value={vehiculoSeleccionado[p.id] || ''}
                        onChange={(e) =>
                          setVehiculoSeleccionado({
                            ...vehiculoSeleccionado,
                            [p.id]: Number(e.target.value)
                          })
                        }
                      >
                        <option value="">Vehículo</option>
                        {vehiculosData?.vehiculosDisponibles?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.placa} - {v.tipo}
                          </option>
                        ))}
                      </select>

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleTomarPedido(p.id)}
                      >
                        Tomar
                      </button>
                    </>
                  )}

                  {p.estado === 'ASIGNADO' && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => iniciarEntrega({ variables: { id: p.id } })}
                    >
                      Iniciar ruta
                    </button>
                  )}

                  {p.estado === 'EN_RUTA' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => confirmarEntrega({ variables: { id: p.id } })}
                    >
                      Entregar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
