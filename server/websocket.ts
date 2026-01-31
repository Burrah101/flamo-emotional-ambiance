/**
 * FLaMO WebSocket Server
 * Real-time presence, typing indicators, and message delivery.
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import * as db from './db';

// Types
interface UserSocket {
  socketId: string;
  userId: number;
  connectedAt: Date;
}

interface TypingStatus {
  matchId: number;
  userId: number;
  isTyping: boolean;
}

// In-memory store for connected users
const connectedUsers = new Map<number, UserSocket>();
const socketToUser = new Map<string, number>();

// Socket.IO server instance
let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', handleConnection);

  console.log('[WebSocket] Server initialized');
  return io;
}

/**
 * Handle new socket connection
 */
async function handleConnection(socket: Socket) {
  console.log(`[WebSocket] New connection: ${socket.id}`);

  // Authentication - expect userId in handshake auth
  const userId = socket.handshake.auth?.userId as number | undefined;
  
  if (!userId) {
    console.log(`[WebSocket] No userId provided, disconnecting: ${socket.id}`);
    socket.disconnect();
    return;
  }

  // Register user
  const userSocket: UserSocket = {
    socketId: socket.id,
    userId,
    connectedAt: new Date(),
  };
  
  connectedUsers.set(userId, userSocket);
  socketToUser.set(socket.id, userId);

  // Update online status in database
  try {
    await db.setUserOnlineStatus(userId, true);
  } catch (error) {
    console.error('[WebSocket] Failed to update online status:', error);
  }

  // Notify matches that user is online
  broadcastPresenceUpdate(userId, true);

  // Join user's personal room for direct messages
  socket.join(`user:${userId}`);

  // Event handlers
  socket.on('typing:start', (data: { matchId: number }) => {
    handleTypingStart(socket, userId, data.matchId);
  });

  socket.on('typing:stop', (data: { matchId: number }) => {
    handleTypingStop(socket, userId, data.matchId);
  });

  socket.on('message:send', async (data: { matchId: number; content: string }) => {
    await handleMessageSend(socket, userId, data);
  });

  socket.on('presence:ping', () => {
    // Keep-alive ping
    socket.emit('presence:pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', async () => {
    await handleDisconnect(socket, userId);
  });

  // Send initial connection success
  socket.emit('connected', { 
    userId, 
    timestamp: Date.now(),
  });
}

/**
 * Handle typing start
 */
function handleTypingStart(socket: Socket, userId: number, matchId: number) {
  // Broadcast to match room
  socket.to(`match:${matchId}`).emit('typing:update', {
    matchId,
    userId,
    isTyping: true,
  });
}

/**
 * Handle typing stop
 */
function handleTypingStop(socket: Socket, userId: number, matchId: number) {
  socket.to(`match:${matchId}`).emit('typing:update', {
    matchId,
    userId,
    isTyping: false,
  });
}

/**
 * Handle message send via WebSocket
 */
async function handleMessageSend(
  socket: Socket, 
  userId: number, 
  data: { matchId: number; content: string }
) {
  try {
    // Save message to database
    await db.createMessage({
      matchId: data.matchId,
      senderId: userId,
      content: data.content,
    });

    // Get match to find recipient
    const matches = await db.getUserMatches(userId);
    const match = matches.find(m => m.match.id === data.matchId);
    
    if (match) {
      const recipientId = match.otherUser.id;
      
      // Emit to recipient if online
      const recipientSocket = connectedUsers.get(recipientId);
      if (recipientSocket && io) {
        io.to(`user:${recipientId}`).emit('message:new', {
          matchId: data.matchId,
          senderId: userId,
          content: data.content,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Confirm to sender
    socket.emit('message:sent', {
      matchId: data.matchId,
      success: true,
    });
  } catch (error) {
    console.error('[WebSocket] Message send error:', error);
    socket.emit('message:error', {
      matchId: data.matchId,
      error: 'Failed to send message',
    });
  }
}

/**
 * Handle socket disconnect
 */
async function handleDisconnect(socket: Socket, userId: number) {
  console.log(`[WebSocket] Disconnected: ${socket.id} (user: ${userId})`);

  // Remove from maps
  connectedUsers.delete(userId);
  socketToUser.delete(socket.id);

  // Update online status
  try {
    await db.setUserOnlineStatus(userId, false);
  } catch (error) {
    console.error('[WebSocket] Failed to update offline status:', error);
  }

  // Notify matches that user is offline
  broadcastPresenceUpdate(userId, false);
}

/**
 * Broadcast presence update to user's matches
 */
async function broadcastPresenceUpdate(userId: number, isOnline: boolean) {
  if (!io) return;

  try {
    // Get user's matches
    const matches = await db.getUserMatches(userId);
    
    for (const match of matches) {
      const otherUserId = match.otherUser.id;
      const otherSocket = connectedUsers.get(otherUserId);
      
      if (otherSocket) {
        io.to(`user:${otherUserId}`).emit('presence:update', {
          userId,
          isOnline,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast presence:', error);
  }
}

/**
 * Join a match room (for typing indicators)
 */
export function joinMatchRoom(userId: number, matchId: number) {
  const userSocket = connectedUsers.get(userId);
  if (userSocket && io) {
    const socket = io.sockets.sockets.get(userSocket.socketId);
    if (socket) {
      socket.join(`match:${matchId}`);
    }
  }
}

/**
 * Leave a match room
 */
export function leaveMatchRoom(userId: number, matchId: number) {
  const userSocket = connectedUsers.get(userId);
  if (userSocket && io) {
    const socket = io.sockets.sockets.get(userSocket.socketId);
    if (socket) {
      socket.leave(`match:${matchId}`);
    }
  }
}

/**
 * Get online status for a user
 */
export function isUserOnline(userId: number): boolean {
  return connectedUsers.has(userId);
}

/**
 * Get all online user IDs
 */
export function getOnlineUserIds(): number[] {
  return Array.from(connectedUsers.keys());
}

/**
 * Send a direct message to a user
 */
export function sendToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export { io };
