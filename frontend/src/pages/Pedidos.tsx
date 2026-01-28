import { useState } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { pedidoClient } from '../services/apollo.client'

const GET_PEDIDOS = gql`
  query GetPedidos {
    pedidos {
      id
      codigo
      clienteId
      repartidorId
      direccionOrigen
      direccionDestino
      descripcion
      estado
      tipoEntrega
      createdAt
    }
  }
`

const CREATE_PEDIDO = gql`
  mutation CrearPedido($input: CreatePedidoInput!) {
    crearPedido(input: $input) {
      id
      codigo
      estado
    }
  }
`

export default function Pedidos() {
  const { data, loading, refetch } = useQuery(GET_PEDIDOS, { client: pedidoClient })
  const [createPedido] = useMutation(CREATE_PEDIDO, { client: pedidoClient })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    clienteId: 1,
    direccionOrigen: '',
    direccionDestino: '',
    descripcion: '',
    tipoEntrega: 'URBANO'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPedido({ variables: { input: formData } })
      setShowForm(false)
      setFormData({ clienteId: 1, direccionOrigen: '', direccionDestino: '', descripcion: '', tipoEntrega: 'URBANO' })
      refetch()
    } catch (error) {
      console.error('Error creando pedido:', error)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      RECIBIDO: 'badge-info',
      ASIGNADO: 'badge-warning',
      EN_RUTA: 'badge-warning',
      ENTREGADO: 'badge-success',
      CANCELADO: 'badge-danger'
    }
    return badges[estado] || 'badge-info'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Pedidos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Pedido'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Pedido</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Dirección Origen</label>
                <input
                  type="text"
                  value={formData.direccionOrigen}
                  onChange={(e) => setFormData({ ...formData, direccionOrigen: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dirección Destino</label>
                <input
                  type="text"
                  value={formData.direccionDestino}
                  onChange={(e) => setFormData({ ...formData, direccionDestino: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                required
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Tipo de Entrega</label>
              <select
                value={formData.tipoEntrega}
                onChange={(e) => setFormData({ ...formData, tipoEntrega: e.target.value })}
              >
                <option value="URBANO">Urbano</option>
                <option value="INTERMUNICIPAL">Intermunicipal</option>
                <option value="NACIONAL">Nacional</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">Crear Pedido</button>
          </form>
        </div>
      )}

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
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data?.pedidos?.map((pedido: any) => (
                <tr key={pedido.id}>
                  <td><strong>{pedido.codigo}</strong></td>
                  <td>{pedido.direccionOrigen}</td>
                  <td>{pedido.direccionDestino}</td>
                  <td>{pedido.tipoEntrega}</td>
                  <td>
                    <span className={`badge ${getEstadoBadge(pedido.estado)}`}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td>{new Date(pedido.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!data?.pedidos || data.pedidos.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                    No hay pedidos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
