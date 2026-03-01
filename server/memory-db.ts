// In-memory database implementation for FLaMO
// This provides a working database without requiring external setup

interface User {
  id: number;
  openId: string;
  email?: string;
  name?: string;
  passwordHash?: string;
  lastSignedIn?: Date;
  role?: string;
}

interface UserProfile {
  userId: number;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  isDiscoverable?: boolean;
  meetupIntent?: string;
  currentMood?: string;
  sexualityPreference?: string;
}

interface Match {
  id: number;
  userId: number;
  targetUserId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface Message {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  createdAt: Date;
}

class MemoryDatabase {
  private users: Map<string, User> = new Map();
  private profiles: Map<number, UserProfile> = new Map();
  private matches: Map<number, Match> = new Map();
  private messages: Map<number, Message> = new Map();
  private userIdCounter = 1;
  private matchIdCounter = 1;
  private messageIdCounter = 1;

  // User operations
  createUser(openId: string, email?: string, passwordHash?: string): User {
    const user: User = {
      id: this.userIdCounter++,
      openId,
      email,
      passwordHash,
      lastSignedIn: new Date(),
      role: 'user',
    };
    this.users.set(openId, user);
    return user;
  }

  getUserByOpenId(openId: string): User | undefined {
    return this.users.get(openId);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getUserById(id: number): User | undefined {
    return Array.from(this.users.values()).find(u => u.id === id);
  }

  updateUser(openId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(openId);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(openId, updated);
    return updated;
  }

  // Profile operations
  createProfile(userId: number, profile: Partial<UserProfile>): UserProfile {
    const fullProfile: UserProfile = {
      userId,
      ...profile,
    };
    this.profiles.set(userId, fullProfile);
    return fullProfile;
  }

  getProfile(userId: number): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  updateProfile(userId: number, updates: Partial<UserProfile>): UserProfile | undefined {
    const profile = this.profiles.get(userId);
    if (!profile) {
      return this.createProfile(userId, updates);
    }
    const updated = { ...profile, ...updates };
    this.profiles.set(userId, updated);
    return updated;
  }

  // Nearby users (discovery)
  getNearbyUsers(latitude: number, longitude: number, maxDistance: number = 50): UserProfile[] {
    const nearby: UserProfile[] = [];
    
    for (const profile of this.profiles.values()) {
      if (!profile.latitude || !profile.longitude || !profile.isDiscoverable) continue;
      
      const distance = this.calculateDistance(latitude, longitude, profile.latitude, profile.longitude);
      if (distance <= maxDistance) {
        nearby.push(profile);
      }
    }
    
    return nearby.sort((a, b) => {
      const distA = this.calculateDistance(latitude, longitude, a.latitude!, a.longitude!);
      const distB = this.calculateDistance(latitude, longitude, b.latitude!, b.longitude!);
      return distA - distB;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Match operations
  createMatch(userId: number, targetUserId: number): Match {
    const match: Match = {
      id: this.matchIdCounter++,
      userId,
      targetUserId,
      status: 'pending',
      createdAt: new Date(),
    };
    this.matches.set(match.id, match);
    return match;
  }

  getMatch(id: number): Match | undefined {
    return this.matches.get(id);
  }

  getMatches(userId: number): Match[] {
    return Array.from(this.matches.values()).filter(m => m.userId === userId || m.targetUserId === userId);
  }

  updateMatch(id: number, status: 'accepted' | 'rejected'): Match | undefined {
    const match = this.matches.get(id);
    if (!match) return undefined;
    match.status = status;
    return match;
  }

  // Message operations
  createMessage(matchId: number, senderId: number, content: string): Message {
    const message: Message = {
      id: this.messageIdCounter++,
      matchId,
      senderId,
      content,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  getMessages(matchId: number): Message[] {
    return Array.from(this.messages.values())
      .filter(m => m.matchId === matchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

// Global instance
export const memoryDb = new MemoryDatabase();
