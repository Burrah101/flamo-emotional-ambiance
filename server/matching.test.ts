import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({})),
  getUserProfile: vi.fn(),
  upsertUserProfile: vi.fn(),
  updateUserLocation: vi.fn(),
  setUserOnlineStatus: vi.fn(),
  getDiscoverableUsers: vi.fn(),
  createMatch: vi.fn(),
  getMatch: vi.fn(),
  getUserMatches: vi.fn(),
  getPendingLikes: vi.fn(),
  respondToMatch: vi.fn(),
  unmatch: vi.fn(),
  createMessage: vi.fn(),
  getMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
  getUnreadMessageCount: vi.fn(),
  createBlock: vi.fn(),
  removeBlock: vi.fn(),
  getBlockedUsers: vi.fn(),
  isBlocked: vi.fn(),
  createReport: vi.fn(),
}));

// Import mocked db
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Profile Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets or creates user profile", async () => {
    const { ctx } = createAuthContext();
    const mockProfile = {
      id: 1,
      userId: 1,
      displayName: "Test User",
      bio: null,
      avatarUrl: null,
      latitude: null,
      longitude: null,
      locationUpdatedAt: null,
      preferences: null,
      isDiscoverable: false,
      showDistance: true,
      meetupIntent: "maybe" as const,
      isOnline: false,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getUserProfile).mockResolvedValue(mockProfile);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.get();

    expect(result).toEqual(mockProfile);
    expect(db.getUserProfile).toHaveBeenCalledWith(1);
  });

  it("updates user profile", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.upsertUserProfile).mockResolvedValue(undefined as any);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({
      displayName: "New Name",
      bio: "Hello world",
      isDiscoverable: true,
      meetupIntent: "open",
    });

    expect(result).toEqual({ success: true });
    expect(db.upsertUserProfile).toHaveBeenCalledWith({
      userId: 1,
      displayName: "New Name",
      bio: "Hello world",
      isDiscoverable: true,
      meetupIntent: "open",
    });
  });

  it("updates user location", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.updateUserLocation).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.updateLocation({
      latitude: 37.7749,
      longitude: -122.4194,
    });

    expect(result).toEqual({ success: true });
    expect(db.updateUserLocation).toHaveBeenCalledWith(1, "37.7749", "-122.4194");
  });
});

describe("Match Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("likes a user and creates match request", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.isBlocked).mockResolvedValue(false);
    vi.mocked(db.getMatch).mockResolvedValue(undefined);
    vi.mocked(db.createMatch).mockResolvedValue({ isNewMatch: false });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.match.like({ userId: 2 });

    expect(result).toEqual({ success: true, isNewMatch: false });
    expect(db.createMatch).toHaveBeenCalledWith({
      fromUserId: 1,
      toUserId: 2,
    });
  });

  it("prevents liking blocked users", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.isBlocked).mockResolvedValue(true);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.match.like({ userId: 2 });

    expect(result).toEqual({ success: false, error: "Cannot interact with this user" });
    expect(db.createMatch).not.toHaveBeenCalled();
  });

  it("gets user matches", async () => {
    const { ctx } = createAuthContext();
    const mockMatches = [
      {
        match: {
          id: 1,
          fromUserId: 1,
          toUserId: 2,
          status: "matched" as const,
          matchedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        otherUser: {
          id: 2,
          openId: "other-user",
          name: "Other User",
          email: null,
          loginMethod: null,
          role: "user" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        otherProfile: {
          id: 2,
          userId: 2,
          displayName: "Other User",
          bio: null,
          avatarUrl: null,
          latitude: null,
          longitude: null,
          locationUpdatedAt: null,
          preferences: null,
          isDiscoverable: true,
          showDistance: true,
          meetupIntent: "open" as const,
          isOnline: true,
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    vi.mocked(db.getUserMatches).mockResolvedValue(mockMatches);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.match.list();

    expect(result).toHaveLength(1);
    expect(result[0].matchId).toBe(1);
    expect(result[0].otherUser.displayName).toBe("Other User");
  });
});

describe("Messages Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a message", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.createMessage).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.send({
      matchId: 1,
      content: "Hello!",
    });

    expect(result).toEqual({ success: true });
    expect(db.createMessage).toHaveBeenCalledWith({
      matchId: 1,
      senderId: 1,
      content: "Hello!",
    });
  });

  it("gets messages for a match", async () => {
    const { ctx } = createAuthContext();
    const mockMessages = [
      {
        id: 1,
        matchId: 1,
        senderId: 1,
        content: "Hello!",
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getMessages).mockResolvedValue(mockMessages);
    vi.mocked(db.markMessagesAsRead).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.list({ matchId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Hello!");
    expect(result[0].isMe).toBe(true);
    expect(db.markMessagesAsRead).toHaveBeenCalledWith(1, 1);
  });
});

describe("Safety Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks a user", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.createBlock).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.safety.block({
      userId: 2,
      reason: "Inappropriate behavior",
    });

    expect(result).toEqual({ success: true });
    expect(db.createBlock).toHaveBeenCalledWith({
      blockerId: 1,
      blockedId: 2,
      reason: "Inappropriate behavior",
    });
  });

  it("unblocks a user", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.removeBlock).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.safety.unblock({ userId: 2 });

    expect(result).toEqual({ success: true });
    expect(db.removeBlock).toHaveBeenCalledWith(1, 2);
  });

  it("reports a user", async () => {
    const { ctx } = createAuthContext();
    vi.mocked(db.createReport).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.safety.report({
      userId: 2,
      reason: "harassment",
      description: "Sending unwanted messages",
    });

    expect(result).toEqual({ success: true });
    expect(db.createReport).toHaveBeenCalledWith({
      reporterId: 1,
      reportedId: 2,
      reason: "harassment",
      description: "Sending unwanted messages",
    });
  });
});
