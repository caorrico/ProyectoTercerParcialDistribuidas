import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WebSocketContextType {
  isConnected: boolean
  subscribe: (topic: string) => void
  unsubscribe: (topic: string) => void
  lastMessage: any
  notifications: any[]
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

const WS_URL = 'ws://localhost:4000/ws'

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!token) return

    const wsUrl = `${WS_URL}?token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket conectado')
      setIsConnected(true)

      // Suscribirse a todos los eventos por defecto
      ws.send(JSON.stringify({ type: 'SUBSCRIBE', topic: 'pedido/*' }))
      ws.send(JSON.stringify({ type: 'SUBSCRIBE', topic: 'vehiculo/*' }))
      ws.send(JSON.stringify({ type: 'SUBSCRIBE', topic: 'factura/*' }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)

        if (data.type === 'EVENT' || data.type === 'BROADCAST') {
          setNotifications(prev => [data, ...prev].slice(0, 50))
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket desconectado')
      setIsConnected(false)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [token])

  const subscribe = useCallback((topic: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'SUBSCRIBE', topic }))
    }
  }, [socket])

  const unsubscribe = useCallback((topic: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'UNSUBSCRIBE', topic }))
    }
  }, [socket])

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      subscribe,
      unsubscribe,
      lastMessage,
      notifications
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket debe usarse dentro de WebSocketProvider')
  }
  return context
}
