import {
  users,
  sessions,
  tenders,
  savedTenders,
  consortiums,
  consortiumMembers,
  serviceProviders,
  tenderCategories,
  aiAnalyses,
  type User,
  type UpsertUser,
  type Tender,
  type InsertTender,
  type SavedTender,
  type InsertSavedTender,
  type Consortium,
  type InsertConsortium,
  type ConsortiumMember,
  type InsertConsortiumMember,
  type ServiceProvider,
  type InsertServiceProvider,
  type TenderCategory,
  type InsertTenderCategory,
  type AiAnalysis,
  type InsertAiAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, subscriptionData: Partial<User>): Promise<User>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  addLoyaltyPoints(userId: string, points: number): Promise<User>;
  markTwitterFollowed(userId: string): Promise<User>;
  
  // Tender operations
  getTenders(filters?: { category?: string; location?: string; search?: string }): Promise<Tender[]>;
  getTender(id: number): Promise<Tender | undefined>;
  getTenderByReference(referenceNumber: string): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender>;
  
  // Saved tenders operations
  getSavedTenders(userId: string): Promise<(SavedTender & { tender: Tender })[]>;
  saveTender(savedTender: InsertSavedTender): Promise<SavedTender>;
  unsaveTender(userId: string, tenderId: number): Promise<void>;
  isTenderSaved(userId: string, tenderId: number): Promise<boolean>;
  
  // Consortium operations
  getConsortiums(userId?: string): Promise<Consortium[]>;
  getConsortium(id: number): Promise<Consortium | undefined>;
  createConsortium(consortium: InsertConsortium): Promise<Consortium>;
  joinConsortium(member: InsertConsortiumMember): Promise<ConsortiumMember>;
  getConsortiumMembers(consortiumId: number): Promise<(ConsortiumMember & { user: User })[]>;
  
  // Service provider operations
  getServiceProviders(filters?: { specialization?: string; search?: string }): Promise<ServiceProvider[]>;
  getServiceProvider(id: number): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  
  // Category operations
  getCategories(): Promise<TenderCategory[]>;
  createCategory(category: InsertTenderCategory): Promise<TenderCategory>;
  
  // AI analysis operations
  getAiAnalysis(tenderId: number): Promise<AiAnalysis | undefined>;
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate referral code if not provided
    if (!userData.referralCode) {
      userData.referralCode = `REF${userData.id?.slice(-6).toUpperCase() || Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    // Check if this is one of the first 100 users for early user benefits
    const userCount = await db.$count(users);
    if (userCount < 100) {
      userData.isEarlyUser = true;
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, subscriptionData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async addLoyaltyPoints(userId: string, points: number): Promise<User> {
    const currentUser = await this.getUser(userId);
    const newPoints = (currentUser?.loyaltyPoints || 0) + points;
    
    const [user] = await db
      .update(users)
      .set({
        loyaltyPoints: newPoints,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async markTwitterFollowed(userId: string): Promise<User> {
    const currentUser = await this.getUser(userId);
    const newPoints = (currentUser?.loyaltyPoints || 0) + 50; // 50 points for following Twitter
    
    const [user] = await db
      .update(users)
      .set({
        twitterFollowed: true,
        loyaltyPoints: newPoints,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getTenderByReference(referenceNumber: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.tenderNumber, referenceNumber));
    return tender;
  }

  // Tender operations
  async getTenders(filters?: { category?: string; location?: string; search?: string }): Promise<Tender[]> {
    let query = db.select().from(tenders).orderBy(desc(tenders.createdAt));
    
    if (filters) {
      const conditions = [];
      
      if (filters.category) {
        conditions.push(eq(tenders.category, filters.category));
      }
      
      if (filters.location) {
        conditions.push(eq(tenders.location, filters.location));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(tenders.title, `%${filters.search}%`),
            like(tenders.description, `%${filters.search}%`),
            like(tenders.organization, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async getTender(id: number): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender;
  }

  async createTender(tender: InsertTender): Promise<Tender> {
    const [newTender] = await db.insert(tenders).values(tender).returning();
    return newTender;
  }

  async updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender> {
    const [updatedTender] = await db
      .update(tenders)
      .set({ ...tender, updatedAt: new Date() })
      .where(eq(tenders.id, id))
      .returning();
    return updatedTender;
  }

  // Saved tenders operations
  async getSavedTenders(userId: string): Promise<(SavedTender & { tender: Tender })[]> {
    return await db
      .select({
        id: savedTenders.id,
        userId: savedTenders.userId,
        tenderId: savedTenders.tenderId,
        createdAt: savedTenders.createdAt,
        tender: tenders,
      })
      .from(savedTenders)
      .innerJoin(tenders, eq(savedTenders.tenderId, tenders.id))
      .where(eq(savedTenders.userId, userId))
      .orderBy(desc(savedTenders.createdAt));
  }

  async saveTender(savedTender: InsertSavedTender): Promise<SavedTender> {
    const [newSavedTender] = await db.insert(savedTenders).values(savedTender).returning();
    return newSavedTender;
  }

  async unsaveTender(userId: string, tenderId: number): Promise<void> {
    await db
      .delete(savedTenders)
      .where(and(eq(savedTenders.userId, userId), eq(savedTenders.tenderId, tenderId)));
  }

  async isTenderSaved(userId: string, tenderId: number): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedTenders)
      .where(and(eq(savedTenders.userId, userId), eq(savedTenders.tenderId, tenderId)));
    return !!saved;
  }

  // Consortium operations
  async getConsortiums(userId?: string): Promise<Consortium[]> {
    let query = db.select().from(consortiums);
    if (userId) {
      query = query.where(eq(consortiums.createdBy, userId));
    }
    return await query;
  }

  async getConsortium(id: number): Promise<Consortium | undefined> {
    const [consortium] = await db.select().from(consortiums).where(eq(consortiums.id, id));
    return consortium;
  }

  async createConsortium(consortium: InsertConsortium): Promise<Consortium> {
    const [newConsortium] = await db.insert(consortiums).values(consortium).returning();
    return newConsortium;
  }

  async joinConsortium(member: InsertConsortiumMember): Promise<ConsortiumMember> {
    const [newMember] = await db.insert(consortiumMembers).values(member).returning();
    return newMember;
  }

  async getConsortiumMembers(consortiumId: number): Promise<(ConsortiumMember & { user: User })[]> {
    return await db
      .select({
        id: consortiumMembers.id,
        consortiumId: consortiumMembers.consortiumId,
        userId: consortiumMembers.userId,
        role: consortiumMembers.role,
        joinedAt: consortiumMembers.joinedAt,
        user: users,
      })
      .from(consortiumMembers)
      .innerJoin(users, eq(consortiumMembers.userId, users.id))
      .where(eq(consortiumMembers.consortiumId, consortiumId));
  }

  // Service provider operations
  async getServiceProviders(filters?: { specialization?: string; search?: string }): Promise<ServiceProvider[]> {
    let query = db.select().from(serviceProviders);
    
    if (filters) {
      const conditions = [];
      
      if (filters.specialization) {
        conditions.push(like(serviceProviders.specializations, `%${filters.specialization}%`));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(serviceProviders.name, `%${filters.search}%`),
            like(serviceProviders.description, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async getServiceProvider(id: number): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return provider;
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    const [newProvider] = await db.insert(serviceProviders).values(provider).returning();
    return newProvider;
  }

  // Category operations
  async getCategories(): Promise<TenderCategory[]> {
    return await db.select().from(tenderCategories).orderBy(tenderCategories.name);
  }

  async createCategory(category: InsertTenderCategory): Promise<TenderCategory> {
    const [newCategory] = await db.insert(tenderCategories).values(category).returning();
    return newCategory;
  }

  // AI analysis operations
  async getAiAnalysis(tenderId: number): Promise<AiAnalysis | undefined> {
    const [analysis] = await db.select().from(aiAnalyses).where(eq(aiAnalyses.tenderId, tenderId));
    return analysis;
  }

  async createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const [newAnalysis] = await db.insert(aiAnalyses).values(analysis).returning();
    return newAnalysis;
  }
}

export const storage = new DatabaseStorage();
