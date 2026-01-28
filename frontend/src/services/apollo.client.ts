import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Links para cada servicio GraphQL
const authLink = createHttpLink({ uri: `${API_URL}/auth` })
const pedidoLink = createHttpLink({ uri: `${API_URL}/pedidos` })
const fleetLink = createHttpLink({ uri: `${API_URL}/fleet` })
const billingLink = createHttpLink({ uri: `${API_URL}/billing` })

// Agregar token de autenticación
const authMiddleware = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

// Split de links basado en el nombre de la operación
const splitLink = ApolloLink.split(
  (operation) => {
    const operationName = operation.operationName?.toLowerCase() || ''
    if (operationName.includes('login') || operationName.includes('register') || operationName.includes('usuario')) {
      return true
    }
    return false
  },
  authLink,
  ApolloLink.split(
    (operation) => {
      const operationName = operation.operationName?.toLowerCase() || ''
      return operationName.includes('pedido')
    },
    pedidoLink,
    ApolloLink.split(
      (operation) => {
        const operationName = operation.operationName?.toLowerCase() || ''
        return operationName.includes('fleet') || operationName.includes('vehiculo') || operationName.includes('repartidor')
      },
      fleetLink,
      billingLink
    )
  )
)

export const apolloClient = new ApolloClient({
  link: authMiddleware.concat(authLink), // Por defecto usa auth service
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
})

// Clientes específicos para cada servicio
export const createServiceClient = (serviceUrl: string) => {
  return new ApolloClient({
    link: authMiddleware.concat(createHttpLink({ uri: serviceUrl })),
    cache: new InMemoryCache(),
  })
}

export const authClient = createServiceClient(`${API_URL}/auth`)
export const pedidoClient = createServiceClient(`${API_URL}/pedidos`)
export const fleetClient = createServiceClient(`${API_URL}/fleet`)
export const billingClient = createServiceClient(`${API_URL}/billing`)
