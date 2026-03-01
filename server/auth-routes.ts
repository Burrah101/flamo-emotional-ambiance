import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
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
        
        // Simple password hash (base64 for now)
        const hash = Buffer.from(input.password).toString('base64');
        
        // Create user with unique openId
        const openId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const user = await db.createUser(openId, input.email, hash);
        
        if (!user) {
          throw new Error('Failed to create user');
        }
        
        // Create session token
        const sessionToken = Buffer.from(JSON.stringify({ 
          openId: user.openId, 
          id: user.id,
          email: user.email 
        })).toString('base64');
        
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
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error('Invalid email or password');
        }
        
        // Verify password
        if (!user.passwordHash) {
          throw new Error('Invalid email or password');
        }
        
        // Verify password (simple comparison)
        const inputHash = Buffer.from(input.password).toString('base64');
        if (inputHash !== user.passwordHash) {
          throw new Error('Invalid email or password');
        }
        
        // Create session token
        const sessionToken = Buffer.from(JSON.stringify({ 
          openId: user.openId, 
          id: user.id,
          email: user.email 
        })).toString('base64');
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }
    }),
});
