'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectAttempts?: number
  reconnectInterval?: number
  autoConnect?: boolean
}

export function useWebSocket(url: string | null, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!url) return

    // 이미 연결 중이거나 연결된 경우 무시
    if (wsRef.current?.readyState === WebSocket.CONNECTING ||
        wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setStatus('connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectCountRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        onClose?.()

        // 재연결 시도
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        setStatus('error')
        onError?.(error)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setStatus('error')
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectCountRef.current = reconnectAttempts // 재연결 방지

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('disconnected')
  }, [reconnectAttempts])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
      return true
    }
    return false
  }, [])

  const sendPing = useCallback(() => {
    return sendMessage({ type: 'ping' })
  }, [sendMessage])

  // 자동 연결
  useEffect(() => {
    if (autoConnect && url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, url, connect, disconnect])

  // 핑-퐁으로 연결 유지
  useEffect(() => {
    if (status !== 'connected') return

    const pingInterval = setInterval(() => {
      sendPing()
    }, 30000) // 30초마다 핑

    return () => clearInterval(pingInterval)
  }, [status, sendPing])

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === 'connected',
  }
}


// 채팅 전용 훅
interface ChatMessage {
  type: 'message' | 'typing' | 'read' | 'user_joined' | 'user_left' | 'contact_warning' | 'pong'
  id?: number
  content?: string
  sender_id?: string
  sender_name?: string
  has_contact_info?: boolean
  created_at?: string
  user_id?: string
  user_name?: string
  is_typing?: boolean
  online_users?: string[]
  message?: string
  detected?: any[]
}

interface UseChatWebSocketOptions {
  roomId: number
  token: string
  onMessage?: (message: ChatMessage) => void
  onTyping?: (userId: string, userName: string, isTyping: boolean) => void
  onUserJoined?: (userId: string, onlineUsers: string[]) => void
  onUserLeft?: (userId: string, onlineUsers: string[]) => void
  onContactWarning?: (message: string, detected: any[]) => void
}

export function useChatWebSocket(options: UseChatWebSocketOptions) {
  const { roomId, token, onMessage, onTyping, onUserJoined, onUserLeft, onContactWarning } = options

  const wsUrl = typeof window !== 'undefined' && token
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host.replace(':3000', ':8000')}/ws/chat/${roomId}?token=${token}`
    : null

  const handleMessage = useCallback((data: ChatMessage) => {
    switch (data.type) {
      case 'message':
        onMessage?.(data)
        break
      case 'typing':
        onTyping?.(data.user_id!, data.user_name!, data.is_typing!)
        break
      case 'user_joined':
        onUserJoined?.(data.user_id!, data.online_users!)
        break
      case 'user_left':
        onUserLeft?.(data.user_id!, data.online_users!)
        break
      case 'contact_warning':
        onContactWarning?.(data.message!, data.detected!)
        break
    }
  }, [onMessage, onTyping, onUserJoined, onUserLeft, onContactWarning])

  const { status, sendMessage, isConnected } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
  })

  const sendChatMessage = useCallback((content: string) => {
    return sendMessage({ type: 'message', content })
  }, [sendMessage])

  const sendTyping = useCallback((isTyping: boolean) => {
    return sendMessage({ type: 'typing', is_typing: isTyping })
  }, [sendMessage])

  const sendRead = useCallback(() => {
    return sendMessage({ type: 'read' })
  }, [sendMessage])

  return {
    status,
    isConnected,
    sendMessage: sendChatMessage,
    sendTyping,
    sendRead,
  }
}
