import { useState } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { billingClient, pedidoClient } from '../services/apollo.client'
import { useAuth } from '../context/AuthContext'

const GET_FACTURAS = gql`
  query GetFacturas {
    facturas {
      id
      numeroFactura
      pedidoId
      clienteId
      subtotal
      descuento
      impuestos
      total
      estado
      fechaEmision
      metodoPago
      createdAt
    }
  }
`

const GET_KPI = gql`
  query GetKPI($fecha: String!) {
    kpiDiario(fecha: $fecha) {
      totalFacturado
      cantidadFacturas
      facturasPagadas
      facturasAnuladas
      promedioFactura
    }
  }
`

const GET_PEDIDOS_ENTREGADOS = gql`
  query GetPedidosEntregados {
    pedidos(filtro: { estado: ENTREGADO }) {
      id
      codigo
      clienteId
      tipoEntrega
      peso
    }
  }
`

const GENERAR_FACTURA = gql`
  mutation GenerarFactura($input: CreateFacturaInput!) {
    generarFactura(input: $input) {
      id
      numeroFactura
      total
      estado
    }
  }
`

const EMITIR_FACTURA = gql`
  mutation EmitirFactura($id: ID!) {
    emitirFactura(id: $id) {
      id
      estado
      fechaEmision
    }
  }
`

const REGISTRAR_PAGO = gql`
  mutation RegistrarPago($id: ID!, $metodoPago: String!) {
    registrarPago(id: $id, metodoPago: $metodoPago) {
      id
      estado
      fechaPago
      metodoPago
    }
  }
`

const ANULAR_FACTURA = gql`
  mutation AnularFactura($id: ID!, $motivo: String!) {
    anularFactura(id: $id, motivo: $motivo) {
      id
      estado
    }
  }
`

export default function Billing() {
  const { hasRole } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [showGenerarForm, setShowGenerarForm] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const [subtotal, setSubtotal] = useState('')
  const [descuento, setDescuento] = useState('0')

  const { data: facturasData, loading, refetch } = useQuery(GET_FACTURAS, { client: billingClient })
  const { data: kpiData } = useQuery(GET_KPI, {
    client: billingClient,
    variables: { fecha: today }
  })
  const { data: pedidosData } = useQuery(GET_PEDIDOS_ENTREGADOS, { client: pedidoClient })

  const [generarFactura] = useMutation(GENERAR_FACTURA, { client: billingClient })
  const [emitirFactura] = useMutation(EMITIR_FACTURA, { client: billingClient })
  const [registrarPago] = useMutation(REGISTRAR_PAGO, { client: billingClient })
  const [anularFactura] = useMutation(ANULAR_FACTURA, { client: billingClient })

  const isGerente = hasRole('ROLE_GERENTE') || hasRole('ROLE_ADMIN')

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; color: string }> = {
      BORRADOR: { bg: '#6b7280', color: 'white' },
      EMITIDA: { bg: '#f59e0b', color: 'white' },
      PAGADA: { bg: '#10b981', color: 'white' },
      ANULADA: { bg: '#ef4444', color: 'white' }
    }
    return badges[estado] || { bg: '#6b7280', color: 'white' }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const handleGenerarFactura = async () => {
    if (!selectedPedido || !subtotal) {
      alert('Seleccione un pedido y ingrese el subtotal')
      return
    }

    try {
      await generarFactura({
        variables: {
          input: {
            pedidoId: parseInt(selectedPedido.id),
            clienteId: selectedPedido.clienteId,
            subtotal: parseFloat(subtotal),
            descuento: parseFloat(descuento) || 0,
            tipoEntrega: selectedPedido.tipoEntrega
          }
        }
      })
      refetch()
      setShowGenerarForm(false)
      setSelectedPedido(null)
      setSubtotal('')
      setDescuento('0')
      alert('Factura generada exitosamente')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleEmitir = async (id: string) => {
    try {
      await emitirFactura({ variables: { id } })
      refetch()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handlePagar = async (id: string) => {
    const metodo = prompt('Ingrese el método de pago (EFECTIVO, TARJETA, TRANSFERENCIA):')
    if (!metodo) return

    try {
      await registrarPago({ variables: { id, metodoPago: metodo.toUpperCase() } })
      refetch()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleAnular = async (id: string) => {
    const motivo = prompt('Ingrese el motivo de anulación:')
    if (!motivo) return

    try {
      await anularFactura({ variables: { id, motivo } })
      refetch()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  // Filtrar pedidos que ya tienen factura
  const pedidosFacturados = new Set(facturasData?.facturas?.map((f: any) => f.pedidoId) || [])
  const pedidosSinFactura = pedidosData?.pedidos?.filter(
    (p: any) => !pedidosFacturados.has(parseInt(p.id))
  ) || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Facturación</h1>
        {isGerente && (
          <button
            className="btn btn-primary"
            onClick={() => setShowGenerarForm(!showGenerarForm)}
          >
            {showGenerarForm ? 'Cancelar' : '+ Nueva Factura'}
          </button>
        )}
      </div>

      {/* Formulario para generar factura */}
      {showGenerarForm && isGerente && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">Generar Nueva Factura</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Pedido Entregado:
              </label>
              <select
                value={selectedPedido?.id || ''}
                onChange={(e) => {
                  const pedido = pedidosSinFactura.find((p: any) => p.id === e.target.value)
                  setSelectedPedido(pedido)
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              >
                <option value="">Seleccione un pedido...</option>
                {pedidosSinFactura.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - Cliente #{p.clienteId} - {p.tipoEntrega}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Subtotal ($):
                </label>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Descuento ($):
                </label>
                <input
                  type="number"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            {subtotal && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                <p>Subtotal: {formatCurrency(parseFloat(subtotal) || 0)}</p>
                <p>Descuento: {formatCurrency(parseFloat(descuento) || 0)}</p>
                <p>IVA (15%): {formatCurrency((parseFloat(subtotal) - parseFloat(descuento || '0')) * 0.15)}</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Total: {formatCurrency((parseFloat(subtotal) - parseFloat(descuento || '0')) * 1.15)}
                </p>
              </div>
            )}

            <button
              className="btn btn-success"
              onClick={handleGenerarFactura}
              style={{ marginTop: '15px' }}
              disabled={!selectedPedido || !subtotal}
            >
              Generar Factura
            </button>
          </div>
        </div>
      )}

      {/* KPIs del día */}
      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-value">{formatCurrency(kpiData?.kpiDiario?.totalFacturado || 0)}</div>
          <div className="stat-label">Facturado Hoy</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{kpiData?.kpiDiario?.cantidadFacturas || 0}</div>
          <div className="stat-label">Facturas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{kpiData?.kpiDiario?.facturasPagadas || 0}</div>
          <div className="stat-label">Pagadas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{formatCurrency(kpiData?.kpiDiario?.promedioFactura || 0)}</div>
          <div className="stat-label">Promedio</div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Facturas Recientes</h3>
        </div>
        {loading ? (
          <p style={{ padding: '20px' }}>Cargando...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Pedido</th>
                <th>Subtotal</th>
                <th>Impuestos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                {isGerente && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {facturasData?.facturas?.map((f: any) => {
                const badge = getEstadoBadge(f.estado)
                return (
                  <tr key={f.id}>
                    <td><strong>{f.numeroFactura}</strong></td>
                    <td>#{f.pedidoId}</td>
                    <td>{formatCurrency(f.subtotal)}</td>
                    <td>{formatCurrency(f.impuestos)}</td>
                    <td><strong>{formatCurrency(f.total)}</strong></td>
                    <td>
                      <span
                        className="badge"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    {isGerente && (
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {f.estado === 'BORRADOR' && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEmitir(f.id)}
                            >
                              Emitir
                            </button>
                          )}
                          {f.estado === 'EMITIDA' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handlePagar(f.id)}
                            >
                              Pagar
                            </button>
                          )}
                          {(f.estado === 'BORRADOR' || f.estado === 'EMITIDA') && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleAnular(f.id)}
                            >
                              Anular
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {(!facturasData?.facturas || facturasData.facturas.length === 0) && (
                <tr>
                  <td colSpan={isGerente ? 8 : 7} style={{ textAlign: 'center', color: '#6b7280' }}>
                    No hay facturas registradas
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
