import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("FLaMO API", () => {
  describe("auth.me", () => {
    it("returns null for unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeNull();
    });

    it("returns user data for authenticated users", async () => {
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe("test1@example.com");
    });
  });

  describe("auth.logout", () => {
    it("clears the session cookie", async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.logout();
      
      expect(result).toEqual({ success: true });
      expect(clearedCookies.length).toBeGreaterThan(0);
    });
  });

  describe("presence.create", () => {
    it("creates a new presence session", async () => {
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.presence.create({ modeId: "focus" });
      
      expect(result).toHaveProperty("sessionId");
      expect(result.sessionId).toBeTruthy();
      expect(result.modeId).toBe("focus");
    });
  });

  describe("presence.status", () => {
    it("returns session status for valid session", async () => {
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      // First create a session
      const created = await caller.presence.create({ modeId: "chill" });
      
      // Then check its status
      const status = await caller.presence.status({ sessionId: created.sessionId });
      
      expect(status.exists).toBe(true);
      expect(status.session?.modeId).toBe("chill");
      expect(status.session?.status).toBe("waiting");
    });

    it("returns not found for invalid session", async () => {
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      const status = await caller.presence.status({ sessionId: "invalid-session-id" });
      
      expect(status.exists).toBe(false);
      expect(status.session).toBeNull();
    });
  });

  describe("history.start", () => {
    it("records mode entry in history", async () => {
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.history.start({ 
        modeId: "sleep",
        wasShared: false 
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe("suggest.mode", () => {
    it("returns a mode suggestion with fallback", async () => {
      // This test verifies the fallback behavior when LLM is unavailable
      // The actual LLM call may timeout, but the fallback should work
      const { ctx } = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.suggest.mode({
        timeOfDay: "evening",
        dayOfWeek: 5,
        recentModes: ["focus", "chill"],
      });
      
      // Should always return a result (either from LLM or fallback)
      expect(result).toHaveProperty("modeId");
      expect(result).toHaveProperty("reason");
      // Should return a valid mode ID (fallback is 'chill')
      expect(["focus", "chill", "sleep", "romance", "bond", "afterglow"]).toContain(result.modeId);
    }, 15000); // Increase timeout to 15 seconds for LLM call
  });
});
