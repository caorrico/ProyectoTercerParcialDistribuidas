export const typeDefs = `#graphql
  enum EstadoFactura {
    BORRADOR
    EMITIDA
    PAGADA
    ANULADA
  }

  type Factura {
    id: ID!
    numeroFactura: String!
    pedidoId: ID!
    clienteId: ID!
    subtotal: Float!
    descuento: Float!
    impuestos: Float!
    total: Float!
    estado: EstadoFactura!
    fechaEmision: String
    fechaPago: String
    metodoPago: String
    observaciones: String
    tipoEntrega: String
    zonaId: String
    createdAt: String!
    updatedAt: String!
  }

  type KPIDiario {
    totalFacturado: Float!
    cantidadFacturas: Int!
    facturasPagadas: Int!
    facturasAnuladas: Int!
    promedioFactura: Float!
  }

  type EstadoCantidad {
    estado: String!
    cantidad: Int!
  }

  type ReporteZona {
    zona: String!
    totalFacturado: Float!
    cantidadPedidos: Int!
    facturasPorEstado: [EstadoCantidad!]!
  }

  input CreateFacturaInput {
    pedidoId: ID!
    clienteId: ID!
    subtotal: Float!
    descuento: Float
    tipoEntrega: String
    zonaId: String
    observaciones: String
  }

  input FacturaFiltro {
    estado: EstadoFactura
    clienteId: ID
    pedidoId: ID
    zonaId: String
    fechaDesde: String
    fechaHasta: String
  }

  type Query {
    # Obtener factura por ID
    factura(id: ID!): Factura

    # Obtener factura por número
    facturaPorNumero(numeroFactura: String!): Factura

    # Listar facturas con filtros
    facturas(filtro: FacturaFiltro): [Factura!]!

    # Listar facturas por cliente
    facturasPorCliente(clienteId: ID!): [Factura!]!

    # Obtener KPI diario
    kpiDiario(fecha: String!, zonaId: String): KPIDiario!

    # Reporte por zona
    reporteZona(zonaId: String!, fechaDesde: String!, fechaHasta: String!): ReporteZona!
  }

  type Mutation {
    # Generar nueva factura
    generarFactura(input: CreateFacturaInput!): Factura!

    # Emitir factura (cambiar de BORRADOR a EMITIDA)
    emitirFactura(id: ID!): Factura!

    # Registrar pago
    registrarPago(id: ID!, metodoPago: String!): Factura!

    # Anular factura
    anularFactura(id: ID!, motivo: String!): Factura!
  }
`;
