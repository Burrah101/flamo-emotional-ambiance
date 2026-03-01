import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { InsertUser, User } from "../drizzle/schema";

export async function createUserDirect(user: InsertUser): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot create user: database not available");
    return null;
  }

  try {
    console.log("[Database] Inserting user with openId:", user.openId);
    
    const result = await db.insert(users).values(user);
    console.log("[Database] Insert result:", result);
    
    if (!result) {
      console.error("[Database] Insert failed - no result");
      return null;
    }

    // Query the user back immediately
    const queryResult = await db.select().from(users).where(
      (t) => t.openId === user.openId
    ).limit(1);
    
    console.log("[Database] Query result:", queryResult);
    
    if (!queryResult || queryResult.length === 0) {
      console.error("[Database] User not found after insert");
      return null;
    }

    return queryResult[0] as User;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}
