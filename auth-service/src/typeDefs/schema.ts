export const typeDefs = `#graphql
  enum RolNombre {
    ROLE_CLIENTE
    ROLE_REPARTIDOR
    ROLE_SUPERVISOR
    ROLE_GERENTE
    ROLE_ADMIN
  }

  type Rol {
    id: ID!
    nombre: RolNombre!
  }

  type Usuario {
    id: ID!
    username: String!
    email: String!
    zonaId: String
    tipoFlota: String
    activo: Boolean!
    roles: [Rol!]!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    usuario: UsuarioAuth!
  }

  type UsuarioAuth {
    id: ID!
    username: String!
    email: String!
    roles: [String!]!
    zonaId: String
    tipoFlota: String
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    rol: RolNombre!
    zonaId: String
    tipoFlota: String
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input UpdateUsuarioInput {
    username: String
    email: String
    password: String
    zonaId: String
    tipoFlota: String
    activo: Boolean
  }

  type Query {
    # Obtener usuario por ID
    usuario(id: ID!): Usuario

    # Listar todos los usuarios
    usuarios: [Usuario!]!

    # Listar usuarios por rol
    usuariosByRol(rol: RolNombre!): [Usuario!]!

    # Obtener usuario actual (requiere autenticación)
    me: Usuario

    # Verificar si un token es válido
    verifyToken(token: String!): Boolean!
  }

  type Mutation {
    # Registrar nuevo usuario
    register(input: RegisterInput!): AuthPayload!

    # Iniciar sesión
    login(input: LoginInput!): AuthPayload!

    # Refrescar token
    refreshToken(token: String!): AuthPayload!

    # Actualizar usuario
    updateUsuario(id: ID!, input: UpdateUsuarioInput!): Usuario!

    # Desactivar usuario
    deactivateUsuario(id: ID!): Usuario!
  }
`;
