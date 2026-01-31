/**
 * FLaMO WebSocket Client Hook
 * Real-time presence, typing indicators, and message delivery.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';

interface PresenceUpdate {
  userId: number;
  isOnline: boolean;
  timestamp: number;
}

interface TypingUpdate {
  matchId: number;
  userId: number;
  isTyping: boolean;
}

interface NewMessage {
  matchId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

interface UseSocketOptions {
  onPresenceUpdate?: (update: PresenceUpdate) => void;
  onTypingUpdate?: (update: TypingUpdate) => void;
  onNewMessage?: (message: NewMessage) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Store callbacks in refs to avoid reconnection on callback changes
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // Connect to WebSocket server
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Create socket connection
    const socket = io({
      path: '/api/socket',
      auth: {
        userId: user.id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Custom events
    socket.on('presence:update', (update: PresenceUpdate) => {
      callbacksRef.current.onPresenceUpdate?.(update);
    });

    socket.on('typing:update', (update: TypingUpdate) => {
      callbacksRef.current.onTypingUpdate?.(update);
    });

    socket.on('message:new', (message: NewMessage) => {
      callbacksRef.current.onNewMessage?.(message);
    });

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:ping');
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  // Start typing indicator
  const startTyping = useCallback((matchId: number) => {
    socketRef.current?.emit('typing:start', { matchId });
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback((matchId: number) => {
    socketRef.current?.emit('typing:stop', { matchId });
  }, []);

  // Send message via WebSocket (for real-time delivery)
  const sendMessage = useCallback((matchId: number, content: string) => {
    socketRef.current?.emit('message:send', { matchId, content });
  }, []);

  // Join match room (for typing indicators)
  const joinMatch = useCallback((matchId: number) => {
    socketRef.current?.emit('match:join', { matchId });
  }, []);

  // Leave match room
  const leaveMatch = useCallback((matchId: number) => {
    socketRef.current?.emit('match:leave', { matchId });
  }, []);

  return {
    isConnected,
    connectionError,
    startTyping,
    stopTyping,
    sendMessage,
    joinMatch,
    leaveMatch,
  };
}

/**
 * Hook for tracking online status of specific users
 */
export function useOnlineStatus(userIds: number[]) {
  const [onlineStatus, setOnlineStatus] = useState<Record<number, boolean>>({});

  const handlePresenceUpdate = useCallback((update: PresenceUpdate) => {
    if (userIds.includes(update.userId)) {
      setOnlineStatus(prev => ({
        ...prev,
        [update.userId]: update.isOnline,
      }));
    }
  }, [userIds]);

  useSocket({
    onPresenceUpdate: handlePresenceUpdate,
  });

  return onlineStatus;
}

/**
 * Hook for typing indicators in a specific match
 */
export function useTypingIndicator(matchId: number) {
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const timeoutRef = useRef<Record<number, NodeJS.Timeout>>({});

  const handleTypingUpdate = useCallback((update: TypingUpdate) => {
    if (update.matchId !== matchId) return;

    // Clear existing timeout for this user
    if (timeoutRef.current[update.userId]) {
      clearTimeout(timeoutRef.current[update.userId]);
    }

    if (update.isTyping) {
      setTypingUsers(prev => new Set(Array.from(prev).concat(update.userId)));
      
      // Auto-clear after 3 seconds of no updates
      timeoutRef.current[update.userId] = setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(update.userId);
          return next;
        });
      }, 3000);
    } else {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(update.userId);
        return next;
      });
    }
  }, [matchId]);

  useSocket({
    onTypingUpdate: handleTypingUpdate,
  });

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  return {
    isTyping: typingUsers.size > 0,
    typingUserIds: Array.from(typingUsers),
  };
}
