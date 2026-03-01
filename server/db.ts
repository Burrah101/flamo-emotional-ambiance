import { memoryDb } from "./memory-db";

console.log("[Database] Using in-memory database");

// User operations
export async function createUser(openId: string, email?: string, passwordHash?: string) {
  return memoryDb.createUser(openId, email, passwordHash);
}

export async function getUserByOpenId(openId: string) {
  return memoryDb.getUserByOpenId(openId);
}

export async function getUserByEmail(email: string) {
  return memoryDb.getUserByEmail(email);
}

export async function getUserById(id: number) {
  return memoryDb.getUserById(id);
}

export async function updateUser(openId: string, updates: any) {
  return memoryDb.updateUser(openId, updates);
}

// Profile operations
export async function upsertUserProfile(userId: number, profile: any) {
  return memoryDb.updateProfile(userId, profile);
}

export async function getUserProfile(userId: number) {
  return memoryDb.getProfile(userId);
}

// Discovery operations
export async function getNearbyUsers(latitude: number, longitude: number, maxDistance?: number) {
  return memoryDb.getNearbyUsers(latitude, longitude, maxDistance);
}

// Match operations
export async function createMatch(userId: number, targetUserId: number) {
  return memoryDb.createMatch(userId, targetUserId);
}

export async function getMatches(userId: number) {
  return memoryDb.getMatches(userId);
}

export async function updateMatch(matchId: number, status: 'accepted' | 'rejected') {
  return memoryDb.updateMatch(matchId, status);
}

// Message operations
export async function createMessage(matchId: number, senderId: number, content: string) {
  return memoryDb.createMessage(matchId, senderId, content);
}

export async function getMessages(matchId: number) {
  return memoryDb.getMessages(matchId);
}

// Subscription operations (stub)
export async function getSubscription(userId: number) {
  return null;
}

export async function createSubscription(userId: number, tier: string) {
  return { userId, tier, createdAt: new Date() };
}

// Block operations (stub)
export async function isBlocked(userId: number, blockedUserId: number) {
  return false;
}

export async function blockUser(userId: number, blockedUserId: number) {
  return true;
}
