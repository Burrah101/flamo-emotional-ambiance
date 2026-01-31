import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Premium subscriptions table.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["monthly", "yearly"]).default("monthly").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * One-time moment purchases.
 */
export const momentPurchases = mysqlTable("moment_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  momentId: varchar("momentId", { length: 64 }).notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  price: int("price").notNull(), // in cents
});

export type MomentPurchase = typeof momentPurchases.$inferSelect;
export type InsertMomentPurchase = typeof momentPurchases.$inferInsert;

/**
 * Shared presence sessions.
 * Allows two users to be in the same mode simultaneously.
 */
export const presenceSessions = mysqlTable("presence_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 32 }).notNull().unique(),
  modeId: varchar("modeId", { length: 32 }).notNull(),
  hostUserId: int("hostUserId").notNull(),
  guestUserId: int("guestUserId"),
  status: mysqlEnum("status", ["waiting", "active", "ended"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type PresenceSession = typeof presenceSessions.$inferSelect;
export type InsertPresenceSession = typeof presenceSessions.$inferInsert;

/**
 * Mode usage history for analytics and suggestions.
 */
export const modeHistory = mysqlTable("mode_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modeId: varchar("modeId", { length: 32 }).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  durationMs: bigint("durationMs", { mode: "number" }),
  wasShared: boolean("wasShared").default(false).notNull(),
});

export type ModeHistoryEntry = typeof modeHistory.$inferSelect;
export type InsertModeHistoryEntry = typeof modeHistory.$inferInsert;

/**
 * Owner notifications log.
 */
export const ownerNotifications = mysqlTable("owner_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content"),
  userId: int("userId"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OwnerNotification = typeof ownerNotifications.$inferSelect;
export type InsertOwnerNotification = typeof ownerNotifications.$inferInsert;

// ============================================
// GPS-BASED MATCHING SYSTEM TABLES
// ============================================

/**
 * User profiles for matching.
 * Contains preferences and discovery settings.
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Display info
  displayName: varchar("displayName", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  
  // Location (stored as decimal for precision)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  locationUpdatedAt: timestamp("locationUpdatedAt"),
  
  // Preferences (stored as JSON)
  preferences: text("preferences"), // JSON: { modePreferences: string[], interests: string[], ageRange: [min, max], maxDistance: number }
  
  // Discovery settings
  isDiscoverable: boolean("isDiscoverable").default(true).notNull(),
  showDistance: boolean("showDistance").default(true).notNull(),
  meetupIntent: mysqlEnum("meetupIntent", ["open", "maybe", "friends_only", "not_now"]).default("maybe").notNull(),
  
  // Status
  isOnline: boolean("isOnline").default(false).notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Match requests and connections.
 * Tracks when users express interest in each other.
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  
  // User who initiated
  fromUserId: int("fromUserId").notNull(),
  // User who received
  toUserId: int("toUserId").notNull(),
  
  // Match status
  status: mysqlEnum("status", ["pending", "matched", "declined", "unmatched"]).default("pending").notNull(),
  
  // When the match became mutual (both users accepted)
  matchedAt: timestamp("matchedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Messages between matched users.
 * Only available after mutual match.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  
  // The match/conversation this belongs to
  matchId: int("matchId").notNull(),
  
  // Sender
  senderId: int("senderId").notNull(),
  
  // Message content
  content: text("content").notNull(),
  
  // Read status
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Block list for users.
 * Blocked users won't appear in discovery and can't message.
 */
export const blocks = mysqlTable("blocks", {
  id: int("id").autoincrement().primaryKey(),
  
  // User who blocked
  blockerId: int("blockerId").notNull(),
  // User who was blocked
  blockedId: int("blockedId").notNull(),
  
  reason: text("reason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;

/**
 * Reports for safety.
 * Users can report inappropriate behavior.
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reporter
  reporterId: int("reporterId").notNull(),
  // Reported user
  reportedId: int("reportedId").notNull(),
  
  // Report details
  reason: mysqlEnum("reason", ["inappropriate", "spam", "harassment", "fake_profile", "safety_concern", "other"]).notNull(),
  description: text("description"),
  
  // Admin review
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;


/**
 * Push notification subscriptions.
 * Stores Web Push API subscription info.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull(),
  
  // Web Push subscription data
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  
  // Subscription status
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * User verification status.
 * Tracks camera-based photo verification.
 */
export const userVerifications = mysqlTable("user_verifications", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().unique(),
  
  // Verification status
  isVerified: boolean("isVerified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  
  // Verification method
  method: mysqlEnum("method", ["camera_match", "manual", "admin"]).default("camera_match").notNull(),
  
  // Confidence score from face comparison (0-100)
  confidenceScore: int("confidenceScore"),
  
  // Reference image URLs
  profilePhotoUrl: text("profilePhotoUrl"),
  verificationPhotoUrl: text("verificationPhotoUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserVerification = typeof userVerifications.$inferSelect;
export type InsertUserVerification = typeof userVerifications.$inferInsert;

/**
 * Stripe payment records.
 * Tracks all payment transactions.
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull(),
  
  // Stripe IDs
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  // Payment details
  type: mysqlEnum("type", ["subscription", "moment_purchase"]).notNull(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  
  // Related item
  itemId: varchar("itemId", { length: 64 }), // subscription type or moment ID
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
