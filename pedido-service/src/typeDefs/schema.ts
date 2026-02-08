export const typeDefs = `#graphql
  enum EstadoPedido {
    RECIBIDO
    ASIGNADO
    EN_RUTA
    ENTREGADO
    CANCELADO
  }

  enum TipoEntrega {
    URBANO
    INTERMUNICIPAL
    NACIONAL
  }

  input TomarPedidoInput {
  pedidoId: ID!
  vehiculoId: ID!
  }


  type Pedido {
    id: ID!
    codigo: String!
    clienteId: ID!
    repartidorId: ID
    direccionOrigen: String!
    direccionDestino: String!
    descripcion: String!
    estado: EstadoPedido!
    tipoEntrega: TipoEntrega!
    zonaId: String
    vehiculoId: ID
    peso: Float
    latOrigen: Float
    lngOrigen: Float
    latDestino: Float
    lngDestino: Float
    observaciones: String
    fechaEstimadaEntrega: String
    fechaEntrega: String
    createdAt: String!
    updatedAt: String!
  }

  type EstadisticasPedido {
    total: Int!
    recibidos: Int!
    asignados: Int!
    enRuta: Int!
    entregados: Int!
    cancelados: Int!
  }

  input CreatePedidoInput {
    clienteId: ID!
    direccionOrigen: String!
    direccionDestino: String!
    descripcion: String!
    tipoEntrega: TipoEntrega!
    zonaId: String
    peso: Float
    latOrigen: Float
    lngOrigen: Float
    latDestino: Float
    lngDestino: Float
    observaciones: String
    fechaEstimadaEntrega: String
  }

  input UpdatePedidoInput {
    direccionOrigen: String
    direccionDestino: String
    descripcion: String
    observaciones: String
    fechaEstimadaEntrega: String
  }

  input PedidoFiltro {
    estado: EstadoPedido
    tipoEntrega: TipoEntrega
    zonaId: String
    clienteId: ID
    repartidorId: ID
    fechaDesde: String
    fechaHasta: String
  }

  type Query {
    # Obtener pedido por ID
    pedido(id: ID!): Pedido

    # Obtener pedido por código
    pedidoPorCodigo(codigo: String!): Pedido

    # Listar pedidos con filtros opcionales
    pedidos(filtro: PedidoFiltro): [Pedido!]!

    # Listar pedidos por cliente
    pedidosPorCliente(clienteId: ID!): [Pedido!]!

    # Listar pedidos por repartidor
    pedidosPorRepartidor(repartidorId: ID!): [Pedido!]!

    # Listar pedidos por zona
    pedidosPorZona(zonaId: String!): [Pedido!]!

    # Obtener estadísticas de pedidos
    estadisticasPedidos(zonaId: String): EstadisticasPedido!
  }

  type Mutation {
    # Crear nuevo pedido
    crearPedido(input: CreatePedidoInput!): Pedido!

    # Actualizar pedido
    actualizarPedido(id: ID!, input: UpdatePedidoInput!): Pedido!

    # Cambiar estado del pedido
    cambiarEstadoPedido(id: ID!, estado: EstadoPedido!): Pedido!

    # Asignar repartidor a un pedido
    asignarRepartidor(id: ID!, repartidorId: ID!): Pedido!

    # Cancelar pedido
    cancelarPedido(id: ID!, motivo: String!): Pedido!

    # Marcar pedido como en ruta
    iniciarEntrega(id: ID!): Pedido!

    # Marcar pedido como entregado
    confirmarEntrega(id: ID!): Pedido!

    tomarPedido(input: TomarPedidoInput!): Pedido!
  }
`;
