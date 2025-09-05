import {
  users,
  players,
  matches,
  monthlyPayments,
  championshipPayments,
  teamConfig,
  otherPayments,
  type User,
  type UpsertUser,
  type InsertUser,
  type Player,
  type InsertPlayer,
  type Match,
  type InsertMatch,
  type MonthlyPayment,
  type InsertMonthlyPayment,
  type ChampionshipPayment,
  type InsertChampionshipPayment,
  type TeamConfig,
  type InsertTeamConfig,
  type OtherPayment,
  type InsertOtherPayment,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;

  // Player operations
  getPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player>;
  deletePlayer(id: string): Promise<void>;

  // Match operations
  getMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match>;
  deleteMatch(id: string): Promise<void>;

  // Monthly payment operations
  getMonthlyPayments(): Promise<(MonthlyPayment & { player: Player })[]>;
  getMonthlyPayment(id: string): Promise<MonthlyPayment | undefined>;
  createMonthlyPayment(payment: InsertMonthlyPayment): Promise<MonthlyPayment>;
  updateMonthlyPayment(id: string, payment: Partial<InsertMonthlyPayment>): Promise<MonthlyPayment>;
  deleteMonthlyPayment(id: string): Promise<void>;
  getPlayerMonthlyPayments(playerId: string): Promise<MonthlyPayment[]>;

  // Championship payment operations
  getChampionshipPayments(): Promise<(ChampionshipPayment & { match?: Match })[]>;
  getChampionshipPayment(id: string): Promise<ChampionshipPayment | undefined>;
  createChampionshipPayment(payment: InsertChampionshipPayment): Promise<ChampionshipPayment>;
  updateChampionshipPayment(id: string, payment: Partial<InsertChampionshipPayment>): Promise<ChampionshipPayment>;
  deleteChampionshipPayment(id: string): Promise<void>;

  // Team configuration operations
  getTeamConfig(): Promise<TeamConfig | undefined>;
  updateTeamConfig(config: InsertTeamConfig): Promise<TeamConfig>;

  // Other payments operations
  getOtherPayments(): Promise<OtherPayment[]>;
  getOtherPayment(id: string): Promise<OtherPayment | undefined>;
  createOtherPayment(payment: InsertOtherPayment): Promise<OtherPayment>;
  updateOtherPayment(id: string, payment: Partial<InsertOtherPayment>): Promise<OtherPayment>;
  deleteOtherPayment(id: string): Promise<void>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalPlayers: number;
    activePlayers: number;
    upcomingMatches: number;
    pendingPayments: number;
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      await db.update(users).set({ lastAccess: new Date() }).where(eq(users.id, id));
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
    
    // Update last access
    await db.update(users).set({ lastAccess: new Date() }).where(eq(users.id, user.id));
    return user;
  }

  // Player operations
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players).orderBy(desc(players.createdAt));
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    
    // Auto-create user account for player with read-only access
    try {
      const username = player.name.toLowerCase().replace(/\s+/g, '.');
      const defaultPassword = 'jugador123'; // Default password for players
      
      await this.createUser({
        username,
        password: defaultPassword,
        firstName: player.name.split(' ')[0],
        lastName: player.name.split(' ').slice(1).join(' ') || '',
        email: player.email || null,
        role: 'user',
        isActive: true,
      });
    } catch (error) {
      // Log error but don't fail player creation if user creation fails
      console.warn('Failed to create user account for player:', error);
    }
    
    return newPlayer;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    const [updatedPlayer] = await db
      .update(players)
      .set({ ...player, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  // Match operations
  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.date));
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    
    // Auto-create championship payment in pending status
    try {
      const teamConfig = await this.getTeamConfig();
      const championshipFee = teamConfig?.monthlyFee || "15.00"; // Default fee
      
      await db.insert(championshipPayments).values({
        matchId: newMatch.id,
        concept: `Inscripción - ${match.competition || 'Competición'}`,
        amount: championshipFee,
        dueDate: match.date ? match.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: "pending",
        notes: `Pago automático generado para partido vs ${match.opponent}`,
      });
    } catch (error) {
      // Log error but don't fail match creation if payment creation fails
      console.warn('Failed to create automatic championship payment:', error);
    }
    
    return newMatch;
  }

  async updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match> {
    const [updatedMatch] = await db
      .update(matches)
      .set({ ...match, updatedAt: new Date() })
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  async deleteMatch(id: string): Promise<void> {
    await db.delete(matches).where(eq(matches.id, id));
  }

  // Monthly payment operations
  async getMonthlyPayments(): Promise<(MonthlyPayment & { player: Player })[]> {
    const payments = await db
      .select()
      .from(monthlyPayments)
      .leftJoin(players, eq(monthlyPayments.playerId, players.id))
      .orderBy(desc(monthlyPayments.createdAt));
    
    return payments.map(({ monthly_payments, players: player }) => ({
      ...monthly_payments,
      player: player!,
    }));
  }

  async getMonthlyPayment(id: string): Promise<MonthlyPayment | undefined> {
    const [payment] = await db.select().from(monthlyPayments).where(eq(monthlyPayments.id, id));
    return payment;
  }

  async createMonthlyPayment(payment: InsertMonthlyPayment): Promise<MonthlyPayment> {
    const [newPayment] = await db.insert(monthlyPayments).values(payment).returning();
    return newPayment;
  }

  async updateMonthlyPayment(id: string, payment: Partial<InsertMonthlyPayment>): Promise<MonthlyPayment> {
    const [updatedPayment] = await db
      .update(monthlyPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(monthlyPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteMonthlyPayment(id: string): Promise<void> {
    await db.delete(monthlyPayments).where(eq(monthlyPayments.id, id));
  }

  async getPlayerMonthlyPayments(playerId: string): Promise<MonthlyPayment[]> {
    return await db
      .select()
      .from(monthlyPayments)
      .where(eq(monthlyPayments.playerId, playerId))
      .orderBy(desc(monthlyPayments.month));
  }

  // Championship payment operations
  async getChampionshipPayments(): Promise<(ChampionshipPayment & { match?: Match })[]> {
    const payments = await db
      .select()
      .from(championshipPayments)
      .leftJoin(matches, eq(championshipPayments.matchId, matches.id))
      .orderBy(desc(championshipPayments.createdAt));
    
    return payments.map(({ championship_payments, matches: match }) => ({
      ...championship_payments,
      match: match || undefined,
    }));
  }

  async getChampionshipPayment(id: string): Promise<ChampionshipPayment | undefined> {
    const [payment] = await db.select().from(championshipPayments).where(eq(championshipPayments.id, id));
    return payment;
  }

  async createChampionshipPayment(payment: InsertChampionshipPayment): Promise<ChampionshipPayment> {
    const [newPayment] = await db.insert(championshipPayments).values(payment).returning();
    return newPayment;
  }

  async updateChampionshipPayment(id: string, payment: Partial<InsertChampionshipPayment>): Promise<ChampionshipPayment> {
    const [updatedPayment] = await db
      .update(championshipPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(championshipPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteChampionshipPayment(id: string): Promise<void> {
    await db.delete(championshipPayments).where(eq(championshipPayments.id, id));
  }

  // Team configuration operations
  async getTeamConfig(): Promise<TeamConfig | undefined> {
    const [config] = await db.select().from(teamConfig).where(eq(teamConfig.id, "team_config"));
    return config;
  }

  async updateTeamConfig(config: InsertTeamConfig): Promise<TeamConfig> {
    const [updatedConfig] = await db
      .insert(teamConfig)
      .values({ ...config, id: "team_config" })
      .onConflictDoUpdate({
        target: teamConfig.id,
        set: { ...config, updatedAt: new Date() },
      })
      .returning();
    return updatedConfig;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalPlayers: number;
    activePlayers: number;
    upcomingMatches: number;
    pendingPayments: number;
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
  }> {
    // Count all players
    const [totalPlayersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players);

    // Count active players
    const [activePlayersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.isActive, true));

    // Count upcoming matches
    const [upcomingMatchesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(and(eq(matches.status, "scheduled"), sql`${matches.date} > now()`));

    // Count pending payments
    const [pendingPaymentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(monthlyPayments)
      .where(eq(monthlyPayments.status, "pending"));

    // Calculate total income from paid monthly payments
    const [totalIncomeResult] = await db
      .select({ total: sql<number>`coalesce(sum(${monthlyPayments.amount}), 0)` })
      .from(monthlyPayments)
      .where(eq(monthlyPayments.status, "paid"));

    // Calculate total expenses from paid championship payments
    const [totalExpensesResult] = await db
      .select({ total: sql<number>`coalesce(sum(${championshipPayments.amount}), 0)` })
      .from(championshipPayments)
      .where(eq(championshipPayments.status, "paid"));

    const totalIncome = Number(totalIncomeResult.total) || 0;
    const totalExpenses = Number(totalExpensesResult.total) || 0;

    return {
      totalPlayers: totalPlayersResult.count || 0,
      activePlayers: activePlayersResult.count || 0,
      upcomingMatches: upcomingMatchesResult.count || 0,
      pendingPayments: pendingPaymentsResult.count || 0,
      totalIncome,
      totalExpenses,
      currentBalance: totalIncome - totalExpenses,
    };
  }

  // Other payments operations
  async getOtherPayments(): Promise<OtherPayment[]> {
    return await db.select().from(otherPayments).orderBy(desc(otherPayments.createdAt));
  }

  async getOtherPayment(id: string): Promise<OtherPayment | undefined> {
    const [payment] = await db.select().from(otherPayments).where(eq(otherPayments.id, id));
    return payment;
  }

  async createOtherPayment(payment: InsertOtherPayment): Promise<OtherPayment> {
    const [newPayment] = await db.insert(otherPayments).values(payment).returning();
    return newPayment;
  }

  async updateOtherPayment(id: string, payment: Partial<InsertOtherPayment>): Promise<OtherPayment> {
    const [updatedPayment] = await db
      .update(otherPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(otherPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteOtherPayment(id: string): Promise<void> {
    await db.delete(otherPayments).where(eq(otherPayments.id, id));
  }
}

export const storage = new DatabaseStorage();
