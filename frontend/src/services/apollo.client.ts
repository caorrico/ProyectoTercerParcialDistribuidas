import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const API_URL = 'http://localhost:4000'

// 1. Links para cada servicio
const authHttpLink = createHttpLink({ uri: `${API_URL}/auth` })
const pedidoHttpLink = createHttpLink({ uri: `${API_URL}/pedidos` })
const fleetHttpLink = createHttpLink({ uri: `${API_URL}/fleet` })
const billingHttpLink = createHttpLink({ uri: `${API_URL}/billing` })

// 2. Middleware de autenticación
const authMiddleware = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

export const TOMAR_PEDIDO = gql`
  mutation TomarPedido($id: ID!) {
    tomarPedido(idPedido: $id) {
      id
      estado
    }
  }
`;

export const MARCAR_EN_RUTA = gql`
  mutation MarcarEnRuta($id: ID!) {
    marcarPedidoEnRuta(idPedido: $id) {
      id
      estado
    }
  }
`;

export const MARCAR_ENTREGADO = gql`
  mutation MarcarEntregado($id: ID!) {
    marcarPedidoEntregado(idPedido: $id) {
      id
      estado
    }
  }
`;


// 3. Lógica de enrutamiento (Split)
const directionalLink = ApolloLink.split(
  (operation) => {
    const name = operation.operationName?.toLowerCase() || ''
    return name.includes('login') || name.includes('register') || name.includes('vehiculos') || name.includes('usuario')
  },
  authHttpLink,
  ApolloLink.split(
    (operation) => (operation.operationName?.toLowerCase() || '').includes('pedido'),
    pedidoHttpLink,
    ApolloLink.split(
      (operation) => {
        const name = operation.operationName?.toLowerCase() || ''
        return name.includes('fleet') || name.includes('vehiculo') || name.includes('repartidor')
      },
      fleetHttpLink,
      billingHttpLink // fallback a billing
    )
  )
)

export const apolloClient = new ApolloClient({
  link: authMiddleware.concat(directionalLink), 
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
})

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