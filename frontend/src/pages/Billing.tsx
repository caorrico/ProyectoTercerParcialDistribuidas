import { gql, useQuery } from '@apollo/client'
import { billingClient } from '../services/apollo.client'

const GET_FACTURAS = gql`
  query GetFacturas {
    facturas {
      id
      numeroFactura
      pedidoId
      clienteId
      subtotal
      impuestos
      total
      estado
      fechaEmision
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

export default function Billing() {
  const today = new Date().toISOString().split('T')[0]
  const { data: facturasData, loading } = useQuery(GET_FACTURAS, { client: billingClient })
  const { data: kpiData } = useQuery(GET_KPI, {
    client: billingClient,
    variables: { fecha: today }
  })

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      BORRADOR: 'badge-info',
      EMITIDA: 'badge-warning',
      PAGADA: 'badge-success',
      ANULADA: 'badge-danger'
    }
    return badges[estado] || 'badge-info'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Facturación</h1>

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
          <p>Cargando...</p>
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
              </tr>
            </thead>
            <tbody>
              {facturasData?.facturas?.map((f: any) => (
                <tr key={f.id}>
                  <td><strong>{f.numeroFactura}</strong></td>
                  <td>#{f.pedidoId}</td>
                  <td>{formatCurrency(f.subtotal)}</td>
                  <td>{formatCurrency(f.impuestos)}</td>
                  <td><strong>{formatCurrency(f.total)}</strong></td>
                  <td>
                    <span className={`badge ${getEstadoBadge(f.estado)}`}>
                      {f.estado}
                    </span>
                  </td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!facturasData?.facturas || facturasData.facturas.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>
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
