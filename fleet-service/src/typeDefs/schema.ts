export const typeDefs = `#graphql
  enum TipoVehiculo {
    MOTO
    LIVIANO
    CAMION
  }

  enum EstadoVehiculo {
    DISPONIBLE
    EN_RUTA
    MANTENIMIENTO
  }

  enum MotoType {
    NAKED
    DEPORTIVA
    ENDURO
    CHOPPER
    TOURING
    CROSS
    CAFE_RACER
  }

  enum AutoType {
    SEDAN
    SUV
    HATCHBACK
    CAMIONETA
    COUPE
    MINIVAN
    CONVERTIBLE
  }

  enum TipoEstado {
    ACTIVO
    INACTIVO
  }

  enum TipoLicencia {
    A
    B
    C
    E
  }
interface VehiculoGQL {
  id: ID!
  placa: String!
  marca: String!
  modelo: String!
  color: String!
  anioFabricacion: String!
  cilindraje: Int!
  activo: Boolean!
  estado: EstadoVehiculo!
  tipoVehiculo: TipoVehiculo!
  createdAt: String!
  updatedAt: String!
}

  type Moto implements VehiculoGQL {
    id: ID!
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    activo: Boolean!
    estado: EstadoVehiculo!
    tipoVehiculo: TipoVehiculo!
    tipoMoto: MotoType!
    tieneCasco: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Liviano implements VehiculoGQL {
    id: ID!
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    activo: Boolean!
    estado: EstadoVehiculo!
    tipoVehiculo: TipoVehiculo!
    tipoAuto: AutoType!
    tipoCombustible: String!
    numeroPuertas: Int!
    capacidadMaleteroLitros: Float!
    capacidadOcupantes: Int!
    transmision: String!
    createdAt: String!
    updatedAt: String!
  }

  type Camion implements VehiculoGQL {
    id: ID!
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    activo: Boolean!
    estado: EstadoVehiculo!
    tipoVehiculo: TipoVehiculo!
    capacidadToneladas: Float!
    tipoCarga: String
    numeroEjes: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Repartidor {
    id: ID!
    identificacion: String!
    nombre: String!
    apellido: String!
    telefono: String!
    email: String
    licencia: String!
    tipoLicencia: TipoLicencia!
    estado: TipoEstado!
    zonaId: String
    usuarioId: ID
    vehiculo: VehiculoGQL
    latActual: Float
    lngActual: Float
    ultimaActualizacionUbicacion: String
    createdAt: String!
    updatedAt: String!
  }

  type FlotaResumen {
    total: Int!
    disponibles: Int!
    enRuta: Int!
    mantenimiento: Int!
  }

  input CreateMotoInput {
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    tipoMoto: MotoType!
    tieneCasco: Boolean
  }

  input CreateLivianoInput {
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    tipoAuto: AutoType!
    tipoCombustible: String!
    numeroPuertas: Int!
    capacidadMaleteroLitros: Float!
    capacidadOcupantes: Int!
    transmision: String!
  }

  input CreateCamionInput {
    placa: String!
    marca: String!
    modelo: String!
    color: String!
    anioFabricacion: String!
    cilindraje: Int!
    capacidadToneladas: Float!
    tipoCarga: String
    numeroEjes: Int
  }

  input CreateRepartidorInput {
    identificacion: String!
    nombre: String!
    apellido: String!
    telefono: String!
    email: String
    licencia: String!
    tipoLicencia: TipoLicencia!
    zonaId: String
    usuarioId: ID
  }

  type Query {
    # Vehículos
    vehiculos: [VehiculoGQL!]!
    vehiculosPorTipo(tipo: TipoVehiculo!): [VehiculoGQL!]!
    vehiculosDisponibles: [VehiculoGQL!]!
    vehiculo(id: ID!): VehiculoGQL
    vehiculoPorPlaca(placa: String!): VehiculoGQL

    # Repartidores
    repartidores: [Repartidor!]!
    repartidoresActivos: [Repartidor!]!
    repartidoresPorZona(zonaId: String!): [Repartidor!]!
    repartidor(id: ID!): Repartidor

    # Resumen de flota
    flotaActiva(zonaId: String): FlotaResumen!
  }

  type Mutation {
    # Crear vehículos
    crearMoto(input: CreateMotoInput!): Moto!
    crearLiviano(input: CreateLivianoInput!): Liviano!
    crearCamion(input: CreateCamionInput!): Camion!

    # Actualizar estado vehículo
    actualizarEstadoVehiculo(placa: String!, estado: EstadoVehiculo!): VehiculoGQL!

    # Repartidores
    crearRepartidor(input: CreateRepartidorInput!): Repartidor!
    asignarVehiculo(repartidorId: ID!, placa: String!): Repartidor!
    actualizarUbicacionRepartidor(id: ID!, lat: Float!, lng: Float!): Repartidor!
    cambiarEstadoRepartidor(id: ID!, estado: TipoEstado!): Repartidor!
  }
`;
