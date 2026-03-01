import type { User } from "../drizzle/schema";

// In-memory user store for testing
const users: Map<string, User> = new Map();
let userIdCounter = 1;

export function createUserInMemory(data: {
  email: string;
  name: string;
  openId: string;
  passwordHash: string;
  loginMethod: string;
}): User {
  const user: User = {
    id: userIdCounter++,
    openId: data.openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: data.loginMethod,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  
  users.set(data.openId, user);
  console.log("[MemoryStore] Created user:", user.openId);
  return user;
}

export function getUserByOpenIdInMemory(openId: string): User | undefined {
  const user = users.get(openId);
  console.log("[MemoryStore] Looking up user:", openId, "Found:", !!user);
  return user;
}

export function getUserByEmailInMemory(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email === email) {
      console.log("[MemoryStore] Found user by email:", email);
      return user;
    }
  }
  console.log("[MemoryStore] No user found with email:", email);
  return undefined;
}
