import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { createUserInMemory, getUserByEmailInMemory, getUserByOpenIdInMemory } from "./memory-store";

import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new Error('Email already registered');
        }
        
        // Simple password hash (not secure, for testing only)
        const hash = Buffer.from(input.password).toString('base64');
        
        // Create user with unique openId
        const openId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log('[Auth] Creating user with openId:', openId);
        const user = createUserInMemory({
          email: input.email,
          name: input.name,
          openId: openId,
          passwordHash: `${salt}:${hash}`,
          loginMethod: 'email',
        });
        
        console.log('[Auth] User created:', user);
        if (!user) {
          throw new Error('Failed to create user');
        }
        
        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Signup failed');
      }
    }),
  
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user
        const user = getUserByEmailInMemory(input.email);
        if (!user) {
          throw new Error('Invalid email or password');
        }
        
        // Verify password
        const passwordHash = user.passwordHash as string | null;
        if (!passwordHash) {
          throw new Error('Invalid email or password');
        }
        
        // Verify password (simple comparison for testing)
        const inputHash = Buffer.from(input.password).toString('base64');
        if (inputHash !== passwordHash) {
          throw new Error('Invalid email or password');
        }
        
        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        // Note: In-memory store doesn't persist, so we skip DB update
        
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }
    }),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
