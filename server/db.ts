import { eq, and, desc, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  subscriptions, 
  InsertSubscription,
  momentPurchases,
  InsertMomentPurchase,
  presenceSessions,
  InsertPresenceSession,
  modeHistory,
  InsertModeHistoryEntry,
  ownerNotifications,
  InsertOwnerNotification,
  chatUnlocks,
  InsertChatUnlock,
  timeLimitedAccess,
  InsertTimeLimitedAccess,
  powerUps,
  InsertPowerUp,
  superLikesBalance,
  InsertSuperLikesBalance
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Helpers =============

export async function upsertUser(user: InsertUser): Promise<User | undefined> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
    
    // Return the user after upserting
    const result = await getUserByOpenId(user.openId);
    if (!result) {
      console.error("[Database] User not found after upsert:", user.openId);
    }
    return result;
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= Subscription Helpers =============

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(subscriptions).values(data);
  return result;
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db.select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gte(subscriptions.expiresAt, now)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function cancelSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}

// ============= Moment Purchase Helpers =============

export async function createMomentPurchase(data: InsertMomentPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(momentPurchases).values(data);
  return result;
}

export async function getActiveMomentPurchase(userId: number, momentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db.select()
    .from(momentPurchases)
    .where(
      and(
        eq(momentPurchases.userId, userId),
        eq(momentPurchases.momentId, momentId),
        gte(momentPurchases.expiresAt, now)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserMomentPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db.select()
    .from(momentPurchases)
    .where(
      and(
        eq(momentPurchases.userId, userId),
        gte(momentPurchases.expiresAt, now)
      )
    );
}

// ============= Presence Session Helpers =============

export async function createPresenceSession(data: InsertPresenceSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(presenceSessions).values(data);
  return result;
}

export async function getPresenceSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(presenceSessions)
    .where(eq(presenceSessions.sessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function joinPresenceSession(sessionId: string, guestUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(presenceSessions)
    .set({ 
      guestUserId, 
      status: 'active' 
    })
    .where(eq(presenceSessions.sessionId, sessionId));
}

export async function endPresenceSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(presenceSessions)
    .set({ 
      status: 'ended',
      endedAt: new Date()
    })
    .where(eq(presenceSessions.sessionId, sessionId));
}

export async function getActivePresenceSessionForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(presenceSessions)
    .where(
      and(
        sql`(${presenceSessions.hostUserId} = ${userId} OR ${presenceSessions.guestUserId} = ${userId})`,
        sql`${presenceSessions.status} != 'ended'`
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Mode History Helpers =============

export async function createModeHistoryEntry(data: InsertModeHistoryEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(modeHistory).values(data);
  return result;
}

export async function endModeHistoryEntry(id: number, durationMs: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(modeHistory)
    .set({ 
      endedAt: new Date(),
      durationMs
    })
    .where(eq(modeHistory.id, id));
}

export async function getUserModeHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(modeHistory)
    .where(eq(modeHistory.userId, userId))
    .orderBy(desc(modeHistory.startedAt))
    .limit(limit);
}

export async function getModeUsageStats(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    modeId: modeHistory.modeId,
    count: sql<number>`COUNT(*)`,
    totalDuration: sql<number>`SUM(${modeHistory.durationMs})`,
  })
    .from(modeHistory)
    .where(eq(modeHistory.userId, userId))
    .groupBy(modeHistory.modeId);

  return result;
}

// ============= Owner Notification Helpers =============

export async function createOwnerNotification(data: InsertOwnerNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(ownerNotifications).values(data);
  return result;
}

export async function getRecentOwnerNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(ownerNotifications)
    .orderBy(desc(ownerNotifications.createdAt))
    .limit(limit);
}


// ============= User Profile Helpers (GPS Matching) =============

import {
  userProfiles,
  InsertUserProfile,
  matches,
  InsertMatch,
  messages,
  InsertMessage,
  blocks,
  InsertBlock,
  reports,
  InsertReport,
} from "../drizzle/schema";

export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, data.userId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, data.userId));
    return existing[0];
  } else {
    await db.insert(userProfiles).values(data);
    const result = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, data.userId))
      .limit(1);
    return result[0];
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLocation(userId: number, latitude: string, longitude: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userProfiles)
    .set({ 
      latitude,
      longitude,
      locationUpdatedAt: new Date(),
      isOnline: true,
      lastActiveAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));
}

export async function setUserOnlineStatus(userId: number, isOnline: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userProfiles)
    .set({ 
      isOnline,
      lastActiveAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));
}

export async function getDiscoverableUsers(
  currentUserId: number,
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  // Get blocked user IDs
  const blockedByMe = await db.select({ blockedId: blocks.blockedId })
    .from(blocks)
    .where(eq(blocks.blockerId, currentUserId));
  
  const blockedMe = await db.select({ blockerId: blocks.blockerId })
    .from(blocks)
    .where(eq(blocks.blockedId, currentUserId));

  const blockedIds = [
    ...blockedByMe.map(b => b.blockedId),
    ...blockedMe.map(b => b.blockerId),
    currentUserId // Exclude self
  ];

  // Haversine formula for distance calculation in SQL
  // Returns distance in kilometers
  const distanceFormula = sql<number>`
    (6371 * acos(
      cos(radians(${latitude})) * cos(radians(${userProfiles.latitude})) *
      cos(radians(${userProfiles.longitude}) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(${userProfiles.latitude}))
    ))
  `;

  const result = await db.select({
    profile: userProfiles,
    user: users,
    distance: distanceFormula,
  })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(
      and(
        eq(userProfiles.isDiscoverable, true),
        sql`${userProfiles.latitude} IS NOT NULL`,
        sql`${userProfiles.longitude} IS NOT NULL`,
        sql`${userProfiles.userId} NOT IN (${blockedIds.join(',') || 0})`,
        sql`${distanceFormula} <= ${maxDistanceKm}`
      )
    )
    .orderBy(sql`${distanceFormula} ASC`)
    .limit(limit);

  return result;
}

// ============= Match Helpers =============

export async function createMatch(data: InsertMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if reverse match exists (they already liked us)
  const reverseMatch = await db.select()
    .from(matches)
    .where(
      and(
        eq(matches.fromUserId, data.toUserId),
        eq(matches.toUserId, data.fromUserId),
        eq(matches.status, 'pending')
      )
    )
    .limit(1);

  if (reverseMatch.length > 0) {
    // It's a mutual match! Update both to matched
    await db.update(matches)
      .set({ status: 'matched', matchedAt: new Date() })
      .where(eq(matches.id, reverseMatch[0].id));

    await db.insert(matches).values({
      ...data,
      status: 'matched',
      matchedAt: new Date(),
    });

    return { isNewMatch: true, matchId: reverseMatch[0].id };
  } else {
    // Just a one-way like for now
    await db.insert(matches).values(data);
    return { isNewMatch: false };
  }
}

export async function getMatch(fromUserId: number, toUserId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(matches)
    .where(
      and(
        eq(matches.fromUserId, fromUserId),
        eq(matches.toUserId, toUserId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getMutualMatch(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(matches)
    .where(
      and(
        sql`((${matches.fromUserId} = ${userId1} AND ${matches.toUserId} = ${userId2}) OR (${matches.fromUserId} = ${userId2} AND ${matches.toUserId} = ${userId1}))`,
        eq(matches.status, 'matched')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserMatches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    match: matches,
    otherUser: users,
    otherProfile: userProfiles,
  })
    .from(matches)
    .innerJoin(users, sql`
      CASE 
        WHEN ${matches.fromUserId} = ${userId} THEN ${users.id} = ${matches.toUserId}
        ELSE ${users.id} = ${matches.fromUserId}
      END
    `)
    .leftJoin(userProfiles, sql`${userProfiles.userId} = ${users.id}`)
    .where(
      and(
        sql`(${matches.fromUserId} = ${userId} OR ${matches.toUserId} = ${userId})`,
        eq(matches.status, 'matched')
      )
    )
    .orderBy(desc(matches.matchedAt));

  return result;
}

export async function getPendingLikes(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // People who liked me but I haven't responded
  const result = await db.select({
    match: matches,
    fromUser: users,
    fromProfile: userProfiles,
  })
    .from(matches)
    .innerJoin(users, eq(users.id, matches.fromUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, matches.fromUserId))
    .where(
      and(
        eq(matches.toUserId, userId),
        eq(matches.status, 'pending')
      )
    )
    .orderBy(desc(matches.createdAt));

  return result;
}

export async function respondToMatch(matchId: number, accept: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (accept) {
    await db.update(matches)
      .set({ status: 'matched', matchedAt: new Date() })
      .where(eq(matches.id, matchId));
  } else {
    await db.update(matches)
      .set({ status: 'declined' })
      .where(eq(matches.id, matchId));
  }
}

export async function unmatch(matchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(matches)
    .set({ status: 'unmatched' })
    .where(eq(matches.id, matchId));
}

// ============= Message Helpers =============

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(messages).values(data);
}

export async function getMessages(matchId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(messages)
    .where(eq(messages.matchId, matchId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function markMessagesAsRead(matchId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.matchId, matchId),
        sql`${messages.senderId} != ${userId}`,
        eq(messages.isRead, false)
      )
    );
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  // Get all matches for this user
  const userMatches = await getUserMatches(userId);
  const matchIds = userMatches.map(m => m.match.id);

  if (matchIds.length === 0) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(messages)
    .where(
      and(
        sql`${messages.matchId} IN (${matchIds.join(',')})`,
        sql`${messages.senderId} != ${userId}`,
        eq(messages.isRead, false)
      )
    );

  return result[0]?.count || 0;
}

// ============= Block Helpers =============

export async function createBlock(data: InsertBlock) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(blocks).values(data);

  // Also unmatch if there was a match
  await db.update(matches)
    .set({ status: 'unmatched' })
    .where(
      and(
        sql`((${matches.fromUserId} = ${data.blockerId} AND ${matches.toUserId} = ${data.blockedId}) OR (${matches.fromUserId} = ${data.blockedId} AND ${matches.toUserId} = ${data.blockerId}))`,
        eq(matches.status, 'matched')
      )
    );
}

export async function removeBlock(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(blocks)
    .where(
      and(
        eq(blocks.blockerId, blockerId),
        eq(blocks.blockedId, blockedId)
      )
    );
}

export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    block: blocks,
    blockedUser: users,
  })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, userId));
}

export async function isBlocked(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(blocks)
    .where(
      sql`(${blocks.blockerId} = ${userId1} AND ${blocks.blockedId} = ${userId2}) OR (${blocks.blockerId} = ${userId2} AND ${blocks.blockedId} = ${userId1})`
    )
    .limit(1);

  return result.length > 0;
}

// ============= Report Helpers =============

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(reports).values(data);
}

export async function getReports(status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed') {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return db.select()
      .from(reports)
      .where(eq(reports.status, status))
      .orderBy(desc(reports.createdAt));
  }

  return db.select()
    .from(reports)
    .orderBy(desc(reports.createdAt));
}


// ============= Push Subscription Helpers =============

import { 
  pushSubscriptions, 
  InsertPushSubscription,
  userVerifications,
  InsertUserVerification,
  payments,
  InsertPayment
} from "../drizzle/schema";

export async function createPushSubscription(data: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Remove existing subscription for this endpoint
  await db.delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, data.endpoint));

  // Create new subscription
  await db.insert(pushSubscriptions).values({
    userId: data.userId,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    isActive: true,
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.isActive, true)
    ));
}

export async function getAllActivePushSubscriptions() {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, true));
}

// ============= User Verification Helpers =============

export async function createOrUpdateVerification(data: {
  userId: number;
  isVerified: boolean;
  method?: 'camera_match' | 'manual' | 'admin';
  confidenceScore?: number;
  profilePhotoUrl?: string;
  verificationPhotoUrl?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select()
    .from(userVerifications)
    .where(eq(userVerifications.userId, data.userId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userVerifications)
      .set({
        isVerified: data.isVerified,
        verifiedAt: data.isVerified ? new Date() : null,
        method: data.method || 'camera_match',
        confidenceScore: data.confidenceScore,
        profilePhotoUrl: data.profilePhotoUrl,
        verificationPhotoUrl: data.verificationPhotoUrl,
      })
      .where(eq(userVerifications.userId, data.userId));
  } else {
    await db.insert(userVerifications).values({
      userId: data.userId,
      isVerified: data.isVerified,
      verifiedAt: data.isVerified ? new Date() : null,
      method: data.method || 'camera_match',
      confidenceScore: data.confidenceScore,
      profilePhotoUrl: data.profilePhotoUrl,
      verificationPhotoUrl: data.verificationPhotoUrl,
    });
  }
}

export async function getUserVerification(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(userVerifications)
    .where(eq(userVerifications.userId, userId))
    .limit(1);

  return result[0] || null;
}

// ============= Payment Helpers =============

export async function createPayment(data: InsertPayment): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.insert(payments).values(data);
  return Number(result[0].insertId);
}

export async function updatePaymentStatus(
  paymentId: number, 
  status: 'pending' | 'succeeded' | 'failed' | 'refunded',
  stripePaymentIntentId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: Partial<InsertPayment> = { status };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  await db.update(payments)
    .set(updateData)
    .where(eq(payments.id, paymentId));
}

export async function getPaymentByStripeId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);

  return result[0] || null;
}

export async function getUserPayments(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Store in payments table for reference
  await db.update(payments)
    .set({ stripeCustomerId })
    .where(eq(payments.userId, userId));
}


// ============= VibeLock Helpers =============

import {
  vibeLockSessions,
  InsertVibeLockSession,
  emotionalPermissions,
  InsertEmotionalPermission,
} from "../drizzle/schema";

export async function getVibeLockSession(matchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(vibeLockSessions)
    .where(and(
      eq(vibeLockSessions.matchId, matchId),
      eq(vibeLockSessions.completed, false)
    ))
    .orderBy(desc(vibeLockSessions.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function getVibeLockSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(vibeLockSessions)
    .where(eq(vibeLockSessions.id, sessionId))
    .limit(1);

  return result[0] || null;
}

export async function createVibeLockSession(data: {
  matchId: number;
  question: string;
  user1Id: number;
  user2Id: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(vibeLockSessions).values({
    matchId: data.matchId,
    question: data.question,
    user1Id: data.user1Id,
    user2Id: data.user2Id,
    completed: false,
  });

  // Get the created session
  const result = await db.select()
    .from(vibeLockSessions)
    .where(eq(vibeLockSessions.matchId, data.matchId))
    .orderBy(desc(vibeLockSessions.createdAt))
    .limit(1);

  return result[0];
}

export async function updateVibeLockAnswer(data: {
  sessionId: number;
  isUser1: boolean;
  answer: string;
  score: number | null;
  completed: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.isUser1) {
    updateData.user1Answer = data.answer;
  } else {
    updateData.user2Answer = data.answer;
  }

  if (data.score !== null) {
    updateData.score = data.score;
  }
  if (data.completed) {
    updateData.completed = true;
  }

  await db.update(vibeLockSessions)
    .set(updateData)
    .where(eq(vibeLockSessions.id, data.sessionId));

  // Return updated session
  const result = await db.select()
    .from(vibeLockSessions)
    .where(eq(vibeLockSessions.id, data.sessionId))
    .limit(1);

  return result[0];
}

export async function unlockVibeLockChat(matchId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(matches)
    .set({ vibeLockUnlocked: true })
    .where(eq(matches.id, matchId));
}

export async function getMatchById(matchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  return result[0] || null;
}

// ============= Emotional Permissions Helpers =============

export async function createEmotionalPermission(data: {
  userId: number;
  permissionType: 'stay_longer' | 'return_once' | 'private_signal' | 'unlock_tonight' | 'deeper_access';
  price: number;
  expiresAt?: Date | null;
  targetModeId?: string;
  targetUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emotionalPermissions).values({
    userId: data.userId,
    permissionType: data.permissionType,
    price: data.price,
    expiresAt: data.expiresAt,
    targetModeId: data.targetModeId,
    targetUserId: data.targetUserId,
    status: 'active',
  });

  // Get the created permission
  const result = await db.select()
    .from(emotionalPermissions)
    .where(eq(emotionalPermissions.userId, data.userId))
    .orderBy(desc(emotionalPermissions.createdAt))
    .limit(1);

  return result[0];
}

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  return db.select()
    .from(emotionalPermissions)
    .where(and(
      eq(emotionalPermissions.userId, userId),
      eq(emotionalPermissions.status, 'active'),
      sql`(${emotionalPermissions.expiresAt} IS NULL OR ${emotionalPermissions.expiresAt} > ${now})`
    ))
    .orderBy(desc(emotionalPermissions.createdAt));
}

export async function hasActivePermission(
  userId: number, 
  permissionType: 'stay_longer' | 'return_once' | 'private_signal' | 'unlock_tonight' | 'deeper_access'
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();
  
  const result = await db.select()
    .from(emotionalPermissions)
    .where(and(
      eq(emotionalPermissions.userId, userId),
      eq(emotionalPermissions.permissionType, permissionType),
      eq(emotionalPermissions.status, 'active'),
      sql`(${emotionalPermissions.expiresAt} IS NULL OR ${emotionalPermissions.expiresAt} > ${now})`
    ))
    .limit(1);

  return result.length > 0;
}

export async function usePermission(permissionId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(emotionalPermissions)
    .set({ 
      status: 'used',
      usedAt: new Date(),
    })
    .where(eq(emotionalPermissions.id, permissionId));
}


// ============= Chat Unlock Helpers =============

export async function createChatUnlock(data: { userId: number; targetUserId: number; price: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatUnlocks).values(data);
}

export async function hasChatUnlock(userId: number, targetUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(chatUnlocks)
    .where(
      and(
        eq(chatUnlocks.userId, userId),
        eq(chatUnlocks.targetUserId, targetUserId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function getUserChatUnlocks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(chatUnlocks)
    .where(eq(chatUnlocks.userId, userId))
    .orderBy(desc(chatUnlocks.createdAt));
}

// ============= Time-Limited Access Helpers =============

export async function createTimeLimitedAccess(data: { 
  userId: number; 
  type: 'unlimited_messaging' | 'profile_views' | 'priority_discover'; 
  expiresAt: Date; 
  price: number 
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(timeLimitedAccess).values(data);
}

export async function hasActiveTimeLimitedAccess(
  userId: number, 
  type: 'unlimited_messaging' | 'profile_views' | 'priority_discover'
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();
  const result = await db.select()
    .from(timeLimitedAccess)
    .where(
      and(
        eq(timeLimitedAccess.userId, userId),
        eq(timeLimitedAccess.type, type),
        gte(timeLimitedAccess.expiresAt, now)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function getActiveTimeLimitedAccess(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db.select()
    .from(timeLimitedAccess)
    .where(
      and(
        eq(timeLimitedAccess.userId, userId),
        gte(timeLimitedAccess.expiresAt, now)
      )
    );
}

// ============= Power-Up Helpers =============

export async function createPowerUp(data: { 
  userId: number; 
  type: 'profile_boost' | 'incognito' | 'super_like'; 
  expiresAt?: Date;
  multiplier?: number;
  remainingUses?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(powerUps).values(data);
}

export async function hasActivePowerUp(
  userId: number, 
  type: 'profile_boost' | 'incognito' | 'super_like'
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();
  const result = await db.select()
    .from(powerUps)
    .where(
      and(
        eq(powerUps.userId, userId),
        eq(powerUps.type, type),
        sql`(${powerUps.expiresAt} IS NULL OR ${powerUps.expiresAt} > ${now})`
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function getActivePowerUps(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db.select()
    .from(powerUps)
    .where(
      and(
        eq(powerUps.userId, userId),
        sql`(${powerUps.expiresAt} IS NULL OR ${powerUps.expiresAt} > ${now})`
      )
    );
}

// ============= Super Likes Balance Helpers =============

export async function getSuperLikesBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select()
    .from(superLikesBalance)
    .where(eq(superLikesBalance.userId, userId))
    .limit(1);

  return result[0]?.balance || 0;
}

export async function addSuperLikes(userId: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user has a balance record
  const existing = await db.select()
    .from(superLikesBalance)
    .where(eq(superLikesBalance.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing balance
    await db.update(superLikesBalance)
      .set({ 
        balance: sql`${superLikesBalance.balance} + ${amount}`,
        totalPurchased: sql`${superLikesBalance.totalPurchased} + ${amount}`,
      })
      .where(eq(superLikesBalance.userId, userId));
  } else {
    // Create new balance record
    await db.insert(superLikesBalance).values({
      userId,
      balance: amount,
      totalPurchased: amount,
      totalUsed: 0,
    });
  }
}

export async function useSuperLike(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const balance = await getSuperLikesBalance(userId);
  if (balance <= 0) return false;

  await db.update(superLikesBalance)
    .set({ 
      balance: sql`${superLikesBalance.balance} - 1`,
      totalUsed: sql`${superLikesBalance.totalUsed} + 1`,
    })
    .where(eq(superLikesBalance.userId, userId));

  return true;
}

// ============= Combined Access Check Helpers =============

/**
 * Check if user can message another user.
 * Returns true if: VIP subscriber, has chat unlock, or has unlimited tonight access.
 */
export async function canMessageUser(userId: number, targetUserId: number): Promise<boolean> {
  // Check VIP subscription
  const subscription = await getActiveSubscription(userId);
  if (subscription) return true;

  // Check chat unlock for specific user
  const hasUnlock = await hasChatUnlock(userId, targetUserId);
  if (hasUnlock) return true;

  // Check unlimited tonight access
  const hasUnlimitedTonight = await hasActiveTimeLimitedAccess(userId, 'unlimited_messaging');
  if (hasUnlimitedTonight) return true;

  return false;
}

/**
 * Check if user has any premium access (VIP or time-limited).
 */
export async function hasPremiumAccess(userId: number): Promise<{ isPremium: boolean; type: string | null; expiresAt: Date | null }> {
  // Check VIP subscription first
  const subscription = await getActiveSubscription(userId);
  if (subscription) {
    return { isPremium: true, type: 'vip', expiresAt: subscription.expiresAt };
  }

  // Check time-limited access
  const timeLimited = await getActiveTimeLimitedAccess(userId);
  if (timeLimited.length > 0) {
    const unlimitedMessaging = timeLimited.find(t => t.type === 'unlimited_messaging');
    if (unlimitedMessaging) {
      return { isPremium: true, type: 'unlimited_tonight', expiresAt: unlimitedMessaging.expiresAt };
    }
  }

  return { isPremium: false, type: null, expiresAt: null };
}
