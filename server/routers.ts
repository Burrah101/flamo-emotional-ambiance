import { getSessionCookieOptions } from "./_core/cookies";
import { authRouter } from "./auth-routes";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { storagePut } from "./storage";
import { createSubscriptionCheckout, createMomentCheckout, createOneTimeCheckout, createPowerUpCheckout } from "./stripe/checkout";

export const appRouter = router({
  system: systemRouter,
  
  auth: authRouter,
  

  // ============= Subscription Routes =============
  subscription: router({
    // Get current subscription status
    status: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);
      return {
        isPremium: !!subscription,
        subscription: subscription || null,
      };
    }),

    // Subscribe to premium
    subscribe: protectedProcedure
      .input(z.object({
        type: z.enum(['monthly', 'yearly']).default('monthly'),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already subscribed
        const existing = await db.getActiveSubscription(ctx.user.id);
        if (existing) {
          return { success: false, error: 'Already subscribed' };
        }

        // Calculate expiration
        const now = new Date();
        const expiresAt = new Date(now);
        if (input.type === 'monthly') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // Create subscription
        await db.createSubscription({
          userId: ctx.user.id,
          type: input.type,
          status: 'active',
          expiresAt,
        });

        // Notify owner
        await notifyOwner({
          title: 'New Premium Subscription',
          content: `User ${ctx.user.name || ctx.user.openId} subscribed to ${input.type} premium.`,
        });

        return { success: true };
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);
      if (!subscription) {
        return { success: false, error: 'No active subscription' };
      }

      await db.cancelSubscription(subscription.id);
      return { success: true };
    }),
  }),

  // ============= Moment Purchase Routes =============
  moments: router({
    // Get user's active moment purchases
    list: protectedProcedure.query(async ({ ctx }) => {
      const purchases = await db.getUserMomentPurchases(ctx.user.id);
      return purchases;
    }),

    // Purchase a moment
    purchase: protectedProcedure
      .input(z.object({
        momentId: z.string(),
        durationHours: z.number(),
        price: z.number(), // in cents
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already has active purchase
        const existing = await db.getActiveMomentPurchase(ctx.user.id, input.momentId);
        if (existing) {
          return { success: false, error: 'Already have active access' };
        }

        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + input.durationHours);

        // Create purchase
        await db.createMomentPurchase({
          userId: ctx.user.id,
          momentId: input.momentId,
          expiresAt,
          price: input.price,
        });

        // Notify owner
        await notifyOwner({
          title: 'New Moment Purchase',
          content: `User ${ctx.user.name || ctx.user.openId} purchased ${input.momentId} moment for $${(input.price / 100).toFixed(2)}.`,
        });

        return { success: true, expiresAt };
      }),

    // Check access to a specific moment
    checkAccess: protectedProcedure
      .input(z.object({ momentId: z.string() }))
      .query(async ({ ctx, input }) => {
        const purchase = await db.getActiveMomentPurchase(ctx.user.id, input.momentId);
        return {
          hasAccess: !!purchase,
          expiresAt: purchase?.expiresAt || null,
        };
      }),
  }),

  // ============= Presence Session Routes =============
  presence: router({
    // Create a new presence session
    create: protectedProcedure
      .input(z.object({
        modeId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = nanoid(10);

        await db.createPresenceSession({
          sessionId,
          modeId: input.modeId,
          hostUserId: ctx.user.id,
          status: 'waiting',
        });

        return { sessionId, modeId: input.modeId };
      }),

    // Join an existing presence session
    join: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getPresenceSession(input.sessionId);
        
        if (!session) {
          return { success: false, error: 'Session not found' };
        }

        if (session.status === 'ended') {
          return { success: false, error: 'Session has ended' };
        }

        if (session.guestUserId) {
          return { success: false, error: 'Session is full' };
        }

        await db.joinPresenceSession(input.sessionId, ctx.user.id);

        return { 
          success: true, 
          modeId: session.modeId,
          hostUserId: session.hostUserId,
        };
      }),

    // Get current session status
    status: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await db.getPresenceSession(input.sessionId);
        
        if (!session) {
          return { exists: false, session: null };
        }

        return { 
          exists: true, 
          session: {
            sessionId: session.sessionId,
            modeId: session.modeId,
            status: session.status,
            hasGuest: !!session.guestUserId,
          },
        };
      }),

    // End a presence session
    end: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getPresenceSession(input.sessionId);
        
        if (!session) {
          return { success: false, error: 'Session not found' };
        }

        // Only host or guest can end
        if (session.hostUserId !== ctx.user.id && session.guestUserId !== ctx.user.id) {
          return { success: false, error: 'Not authorized' };
        }

        await db.endPresenceSession(input.sessionId);
        return { success: true };
      }),

    // Get user's active session
    active: protectedProcedure.query(async ({ ctx }) => {
      const session = await db.getActivePresenceSessionForUser(ctx.user.id);
      return session || null;
    }),
  }),

  // ============= Mode History Routes =============
  history: router({
    // Record mode entry
    start: protectedProcedure
      .input(z.object({
        modeId: z.string(),
        wasShared: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createModeHistoryEntry({
          userId: ctx.user.id,
          modeId: input.modeId,
          wasShared: input.wasShared,
        });

        return { success: true };
      }),

    // Get user's mode history
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const history = await db.getUserModeHistory(ctx.user.id, input.limit);
        return history;
      }),

    // Get usage statistics
    stats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getModeUsageStats(ctx.user.id);
      return stats;
    }),
  }),

  // ============= LLM Suggestion Routes =============
  suggest: router({
    // Get mode suggestion based on context
    mode: protectedProcedure
      .input(z.object({
        timeOfDay: z.string(),
        dayOfWeek: z.number(),
        recentModes: z.array(z.string()).optional(),
        userContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const prompt = `You are a mood and ambiance expert for the FLaMO app. Based on the following context, suggest the most appropriate emotional mode.

Available modes:
- focus: For concentration, work, study (mint neon, calm energy)
- chill: For relaxation, unwinding (ocean blue, peaceful)
- sleep: For rest, bedtime (violet/indigo, drowsy)
- romance: For intimate moments, dates (rose-gold, warm)
- bond: For connection, closeness (amber/teal, grounded)
- afterglow: For gentle lingering, soft moments (orchid fade, warm)

Context:
- Time of day: ${input.timeOfDay}
- Day of week: ${input.dayOfWeek} (0=Sunday)
- Recent modes used: ${input.recentModes?.join(', ') || 'none'}
- User context: ${input.userContext || 'none provided'}

Respond with ONLY a JSON object in this exact format:
{"mode": "mode_id", "reason": "brief explanation"}`;

          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'You are a helpful mood suggestion assistant. Respond only with valid JSON.' },
              { role: 'user', content: prompt },
            ],
          });

          const messageContent = response.choices[0]?.message?.content;
          const content = typeof messageContent === 'string' ? messageContent : '';
          
          // Parse JSON response
          try {
            const parsed = JSON.parse(content);
            return {
              success: true,
              modeId: parsed.mode,
              reason: parsed.reason,
            };
          } catch {
            // Fallback to default suggestion
            return {
              success: true,
              modeId: 'chill',
              reason: 'A good default for relaxation.',
            };
          }
        } catch (error) {
          console.error('LLM suggestion error:', error);
          return {
            success: false,
            modeId: 'chill',
            reason: 'Suggestion service unavailable.',
          };
        }
      }),
  }),

  // ============= Photo Upload Routes =============
  upload: router({
    // Upload profile photo
    profilePhoto: protectedProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Decode base64 to buffer
          const base64Clean = input.base64Data.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Clean, 'base64');
          
          // Validate size (max 5MB)
          if (buffer.length > 5 * 1024 * 1024) {
            return { success: false, error: 'Image too large. Max 5MB.' };
          }
          
          // Generate unique filename
          const ext = input.mimeType.split('/')[1];
          const timestamp = Date.now();
          const randomSuffix = nanoid(8);
          const fileKey = `avatars/${ctx.user.id}-${timestamp}-${randomSuffix}.${ext}`;
          
          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          
          // Update user profile with new avatar URL
          await db.upsertUserProfile({
            userId: ctx.user.id,
            avatarUrl: url,
          });
          
          return { success: true, url };
        } catch (error) {
          console.error('Photo upload error:', error);
          return { success: false, error: 'Failed to upload photo' };
        }
      }),
  }),

  // ============= GPS Matching Routes =============
  profile: router({
    // Get or create user profile
    get: protectedProcedure.query(async ({ ctx }) => {
      let profile = await db.getUserProfile(ctx.user.id);
      
      if (!profile) {
        // Create default profile
        profile = await db.upsertUserProfile({
          userId: ctx.user.id,
          displayName: ctx.user.name || 'Anonymous',
          isDiscoverable: false, // Default to not discoverable until they set up profile
        });
      }
      
      return profile;
    }),

    // Update user profile
    update: protectedProcedure
      .input(z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        preferences: z.string().optional(), // JSON string
        isDiscoverable: z.boolean().optional(),
        showDistance: z.boolean().optional(),
        meetupIntent: z.enum(['open', 'maybe', 'friends_only', 'not_now']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    // Update location
    updateLocation: protectedProcedure
      .input(z.object({
        latitude: z.number(),
        longitude: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserLocation(
          ctx.user.id,
          input.latitude.toString(),
          input.longitude.toString()
        );
        return { success: true };
      }),

    // Set online status
    setOnline: protectedProcedure
      .input(z.object({ isOnline: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserOnlineStatus(ctx.user.id, input.isOnline);
        return { success: true };
      }),

    // Verify profile photo with camera
    verify: protectedProcedure
      .input(z.object({
        verificationPhotoBase64: z.string(),
        profilePhotoUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Upload verification photo to S3
        const photoBuffer = Buffer.from(input.verificationPhotoBase64, 'base64');
        const photoKey = `verifications/${ctx.user.id}/${Date.now()}.jpg`;
        const { url: verificationPhotoUrl } = await storagePut(photoKey, photoBuffer, 'image/jpeg');

        // In a production app, you would use a face comparison API here
        // For now, we'll use a simple LLM-based comparison
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: 'You are a photo verification assistant. Compare two photos and determine if they show the same person. Respond with JSON: {"match": true/false, "confidence": 0-100, "reason": "brief explanation"}',
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Compare these two photos. Are they the same person?' },
                  { type: 'image_url', image_url: { url: input.profilePhotoUrl } },
                  { type: 'image_url', image_url: { url: verificationPhotoUrl } },
                ],
              },
            ],
          });

          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : '';
          let result = { match: false, confidence: 0, reason: 'Unable to verify' };
          
          try {
            // Try to parse JSON from response
            const jsonMatch = content.match(/\{[^}]+\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            }
          } catch {
            // If parsing fails, check for keywords
            const isMatch = content.toLowerCase().includes('same person') || 
                           content.toLowerCase().includes('match');
            result = { match: isMatch, confidence: isMatch ? 75 : 25, reason: content.slice(0, 100) };
          }

          // Save verification result
          await db.createOrUpdateVerification({
            userId: ctx.user.id,
            isVerified: result.match && result.confidence >= 70,
            method: 'camera_match',
            confidenceScore: result.confidence,
            profilePhotoUrl: input.profilePhotoUrl,
            verificationPhotoUrl,
          });

          // Notify owner of verification
          await notifyOwner({
            title: result.match ? 'User Verified' : 'Verification Failed',
            content: `User ${ctx.user.id} verification: ${result.match ? 'PASSED' : 'FAILED'} (${result.confidence}% confidence)`,
          });

          return {
            verified: result.match && result.confidence >= 70,
            confidenceScore: result.confidence,
            reason: result.reason,
          };
        } catch (error) {
          console.error('[Verification] LLM error:', error);
          // Fallback: mark as pending manual review
          await db.createOrUpdateVerification({
            userId: ctx.user.id,
            isVerified: false,
            method: 'camera_match',
            confidenceScore: 0,
            profilePhotoUrl: input.profilePhotoUrl,
            verificationPhotoUrl,
          });

          return {
            verified: false,
            confidenceScore: 0,
            reason: 'Verification pending manual review',
          };
        }
      }),

    // Get verification status
    verificationStatus: protectedProcedure.query(async ({ ctx }) => {
      const verification = await db.getUserVerification(ctx.user.id);
      return verification;
    }),
  }),

  discover: router({
    // Get nearby discoverable users
    nearby: protectedProcedure
      .input(z.object({
        latitude: z.number(),
        longitude: z.number(),
        maxDistanceKm: z.number().default(50),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        // Update user's location
        await db.updateUserLocation(
          ctx.user.id,
          input.latitude.toString(),
          input.longitude.toString()
        );

        const users = await db.getDiscoverableUsers(
          ctx.user.id,
          input.latitude,
          input.longitude,
          input.maxDistanceKm,
          input.limit
        );

        // Format response
        return users.map(u => ({
          userId: u.user.id,
          displayName: u.profile.displayName,
          bio: u.profile.bio,
          avatarUrl: u.profile.avatarUrl,
          distance: Math.round(u.distance * 10) / 10, // Round to 1 decimal
          meetupIntent: u.profile.meetupIntent,
          preferences: u.profile.preferences ? JSON.parse(u.profile.preferences) : null,
          isOnline: u.profile.isOnline,
          lastActiveAt: u.profile.lastActiveAt,
        }));
      }),
  }),

  match: router({
    // Like a user (send match request)
    like: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if blocked
        const blocked = await db.isBlocked(ctx.user.id, input.userId);
        if (blocked) {
          return { success: false, error: 'Cannot interact with this user' };
        }

        // Check if already matched/pending
        const existing = await db.getMatch(ctx.user.id, input.userId);
        if (existing) {
          return { success: false, error: 'Already sent a like', isNewMatch: false };
        }

        const result = await db.createMatch({
          fromUserId: ctx.user.id,
          toUserId: input.userId,
        });

        if (result.isNewMatch) {
          // Notify both users
          await notifyOwner({
            title: 'New Match!',
            content: `Users ${ctx.user.id} and ${input.userId} matched.`,
          });
        }

        return { success: true, isNewMatch: result.isNewMatch };
      }),

    // Get all matches
    list: protectedProcedure.query(async ({ ctx }) => {
      const matches = await db.getUserMatches(ctx.user.id);
      return matches.map(m => ({
        matchId: m.match.id,
        matchedAt: m.match.matchedAt,
        otherUser: {
          id: m.otherUser.id,
          name: m.otherUser.name,
          displayName: m.otherProfile?.displayName,
          avatarUrl: m.otherProfile?.avatarUrl,
          isOnline: m.otherProfile?.isOnline,
        },
      }));
    }),

    // Get pending likes (people who liked me)
    pending: protectedProcedure.query(async ({ ctx }) => {
      const pending = await db.getPendingLikes(ctx.user.id);
      return pending.map(p => ({
        matchId: p.match.id,
        createdAt: p.match.createdAt,
        fromUser: {
          id: p.fromUser.id,
          name: p.fromUser.name,
          displayName: p.fromProfile?.displayName,
          avatarUrl: p.fromProfile?.avatarUrl,
          bio: p.fromProfile?.bio,
        },
      }));
    }),

    // Respond to a pending like
    respond: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        accept: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.respondToMatch(input.matchId, input.accept);
        return { success: true, isMatch: input.accept };
      }),

    // Unmatch
    unmatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        await db.unmatch(input.matchId);
        return { success: true };
      }),
  }),

  messages: router({
    // Send a message
    send: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          matchId: input.matchId,
          senderId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),

    // Get messages for a match
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        // Mark as read
        await db.markMessagesAsRead(input.matchId, ctx.user.id);
        
        const messages = await db.getMessages(input.matchId, input.limit, input.offset);
        return messages.map(m => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          isMe: m.senderId === ctx.user.id,
          createdAt: m.createdAt,
          isRead: m.isRead,
        }));
      }),

    // Get unread count
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await db.getUnreadMessageCount(ctx.user.id);
      return { count };
    }),
  }),

  safety: router({
    // Block a user
    block: protectedProcedure
      .input(z.object({
        userId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createBlock({
          blockerId: ctx.user.id,
          blockedId: input.userId,
          reason: input.reason,
        });
        return { success: true };
      }),

    // Unblock a user
    unblock: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeBlock(ctx.user.id, input.userId);
        return { success: true };
      }),

    // Get blocked users
    blockedList: protectedProcedure.query(async ({ ctx }) => {
      const blocked = await db.getBlockedUsers(ctx.user.id);
      return blocked.map(b => ({
        userId: b.blockedUser.id,
        name: b.blockedUser.name,
        blockedAt: b.block.createdAt,
      }));
    }),

    // Report a user
    report: protectedProcedure
      .input(z.object({
        userId: z.number(),
        reason: z.enum(['inappropriate', 'spam', 'harassment', 'fake_profile', 'safety_concern', 'other']),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createReport({
          reporterId: ctx.user.id,
          reportedId: input.userId,
          reason: input.reason,
          description: input.description,
        });

        // Notify owner of report
        await notifyOwner({
          title: 'User Report Submitted',
          content: `User ${ctx.user.id} reported user ${input.userId} for: ${input.reason}`,
        });

        return { success: true };
      }),
  }),

  // ============= Stripe Payment Routes =============
  stripe: router({
    // Create VIP subscription checkout session
    createSubscriptionCheckout: protectedProcedure
      .input(z.object({
        type: z.enum(['monthly', 'yearly']),
      }))
      .mutation(async ({ ctx, input }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const checkoutUrl = await createSubscriptionCheckout(input.type, {
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          origin,
        });

        return { checkoutUrl };
      }),

    // Create one-time purchase checkout (single chat unlock, unlimited tonight)
    createOneTimeCheckout: protectedProcedure
      .input(z.object({
        productId: z.enum(['single_chat', 'unlimited_tonight']),
        targetUserId: z.number().optional(), // Required for single_chat
      }))
      .mutation(async ({ ctx, input }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const checkoutUrl = await createOneTimeCheckout(input.productId, {
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          origin,
          targetUserId: input.targetUserId,
        });

        return { checkoutUrl };
      }),

    // Create power-up purchase checkout (boost, super likes, incognito)
    createPowerUpCheckout: protectedProcedure
      .input(z.object({
        productId: z.enum(['profile_boost', 'super_likes', 'incognito']),
      }))
      .mutation(async ({ ctx, input }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const checkoutUrl = await createPowerUpCheckout(input.productId, {
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          origin,
        });

        return { checkoutUrl };
      }),

    // Create moment purchase checkout session (legacy)
    createMomentCheckout: protectedProcedure
      .input(z.object({
        momentId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const checkoutUrl = await createMomentCheckout(input.momentId, {
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          origin,
        });

        return { checkoutUrl };
      }),

    // Check user's premium access status
    checkAccess: protectedProcedure.query(async ({ ctx }) => {
      const premiumStatus = await db.hasPremiumAccess(ctx.user.id);
      const superLikes = await db.getSuperLikesBalance(ctx.user.id);
      const powerUps = await db.getActivePowerUps(ctx.user.id);
      const chatUnlocks = await db.getUserChatUnlocks(ctx.user.id);

      return {
        ...premiumStatus,
        superLikes,
        powerUps,
        chatUnlocks: chatUnlocks.map(u => u.targetUserId),
      };
    }),

    // Check if user can message a specific user
    canMessage: protectedProcedure
      .input(z.object({ targetUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const canMessage = await db.canMessageUser(ctx.user.id, input.targetUserId);
        return { canMessage };
      }),
  }),

  // ============= VibeLock Routes =============
  vibeLock: router({
    // Get or create VibeLock session for a match
    getSession: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Get existing session
        let session = await db.getVibeLockSession(input.matchId);
        
        if (!session || session.completed) {
          // Create new session with random question
          const questions = [
            "What would we do if we got lost in Bangkok at 2am?",
            "Pick the playlist for tonight: Chill, Chaos, or Cosmic?",
            "Which of us would survive a sunrise party better?",
            "Who's more likely to end up dancing on a table?",
            "If we found a secret rooftop at 3am, who suggests staying?",
            "Who picks the after-party spot?",
            "Who's the first to suggest 'one more drink'?",
            "Who would win at karaoke?",
            "Who's more likely to make friends with strangers?",
            "Who would remember the night better?",
          ];
          const question = questions[Math.floor(Math.random() * questions.length)];
          
          // Get match to determine user IDs
          const match = await db.getMatchById(input.matchId);
          if (!match) {
            throw new Error('Match not found');
          }
          
          const user1Id = match.fromUserId;
          const user2Id = match.toUserId;
          
          session = await db.createVibeLockSession({
            matchId: input.matchId,
            question,
            user1Id,
            user2Id,
          });
        }
        
        return session;
      }),

    // Submit answer to VibeLock
    submitAnswer: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        answer: z.enum(['You', 'Them']),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getVibeLockSessionById(input.sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        
        const isUser1 = session.user1Id === ctx.user.id;
        const otherAnswer = isUser1 ? session.user2Answer : session.user1Answer;
        
        let score: number | null = null;
        let completed = false;
        
        // If other user has answered, calculate score
        if (otherAnswer) {
          // Same answer = high compatibility
          if (input.answer === otherAnswer) {
            score = Math.floor(Math.random() * 15) + 85; // 85-100
          } else {
            score = Math.floor(Math.random() * 20) + 60; // 60-80
          }
          completed = true;
          
          // Unlock chat if score is good
          if (score >= 70) {
            await db.unlockVibeLockChat(session.matchId);
          }
        }
        
        const updated = await db.updateVibeLockAnswer({
          sessionId: input.sessionId,
          isUser1,
          answer: input.answer,
          score,
          completed,
        });
        
        return updated;
      }),
  }),

  // ============= Emotional Permissions Routes =============
  permissions: router({
    // Purchase an emotional permission
    purchase: protectedProcedure
      .input(z.object({
        permissionType: z.enum(['stay_longer', 'return_once', 'private_signal', 'unlock_tonight', 'deeper_access']),
        targetModeId: z.string().optional(),
        targetUserId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Price mapping
        const prices: Record<string, number> = {
          stay_longer: 299,
          return_once: 199,
          private_signal: 99,
          unlock_tonight: 499,
          deeper_access: 699,
        };
        
        const price = prices[input.permissionType];
        
        // Calculate expiration
        let expiresAt: Date | null = null;
        const now = new Date();
        
        switch (input.permissionType) {
          case 'stay_longer':
            expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
            break;
          case 'unlock_tonight':
            // Until 6am next day
            expiresAt = new Date(now);
            expiresAt.setHours(6, 0, 0, 0);
            if (expiresAt <= now) {
              expiresAt.setDate(expiresAt.getDate() + 1);
            }
            break;
          case 'deeper_access':
            // Monthly
            expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            break;
        }
        
        // Create permission record
        const permission = await db.createEmotionalPermission({
          userId: ctx.user.id,
          permissionType: input.permissionType,
          price,
          expiresAt,
          targetModeId: input.targetModeId,
          targetUserId: input.targetUserId,
        });
        
        // Notify owner
        await notifyOwner({
          title: 'Emotional Permission Purchased',
          content: `User ${ctx.user.name || ctx.user.openId} purchased ${input.permissionType} for $${(price / 100).toFixed(2)}`,
        });
        
        return { success: true, permission };
      }),

    // Get user's active permissions
    list: protectedProcedure.query(async ({ ctx }) => {
      const permissions = await db.getUserPermissions(ctx.user.id);
      return permissions;
    }),

    // Check if user has specific permission
    check: protectedProcedure
      .input(z.object({
        permissionType: z.enum(['stay_longer', 'return_once', 'private_signal', 'unlock_tonight', 'deeper_access']),
      }))
      .query(async ({ ctx, input }) => {
        const hasPermission = await db.hasActivePermission(ctx.user.id, input.permissionType);
        return { hasPermission };
      }),

    // Use a permission (mark as used)
    use: protectedProcedure
      .input(z.object({ permissionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.usePermission(input.permissionId);
        return { success: true };
      }),
  }),

  // ============= Owner Notification Routes =============
  notifications: router({
    // Send notification to owner (for critical events)
    send: protectedProcedure
      .input(z.object({
        type: z.string(),
        title: z.string(),
        content: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Log to database
        await db.createOwnerNotification({
          type: input.type,
          title: input.title,
          content: input.content,
          userId: ctx.user.id,
        });

        // Send actual notification
        const sent = await notifyOwner({
          title: input.title,
          content: input.content || '',
        });

        return { success: sent };
      }),

    // Subscribe to push notifications
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createPushSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
        });
        return { success: true };
      }),

    // Unsubscribe from push notifications
    unsubscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.removePushSubscription(input.endpoint);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
