import {
  users,
  players,
  matches,
  monthlyPayments,
  championshipPayments,
  teamConfig,
  otherPayments,
  matchAttendances,
  opponents,
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
  type MatchAttendance,
  type InsertMatchAttendance,
  type Opponent,
  type InsertOpponent,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
  createUserForPlayer(player: Player): Promise<User | null>;
  createUsersForAllExistingPlayers(): Promise<void>;

  // Player operations
  getPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByUserId(userId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  createPlayerForExistingUser(playerData: InsertPlayer, userId: string): Promise<Player>;
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

  // Match attendance operations
  getMatchAttendances(matchId: string): Promise<MatchAttendance[]>;
  getUserAttendances(userId: string): Promise<MatchAttendance[]>;
  createOrUpdateAttendance(attendance: InsertMatchAttendance): Promise<MatchAttendance>;
  updateAttendance(id: string, attendance: Partial<InsertMatchAttendance>): Promise<MatchAttendance>;

  // Opponent operations
  getOpponents(): Promise<Opponent[]>;
  getOpponent(id: string): Promise<Opponent | undefined>;
  getOpponentByName(name: string): Promise<Opponent | undefined>;
  getOpponentByLigaHesperidesId(ligaHesperidesId: string): Promise<Opponent | undefined>;
  createOpponent(opponent: InsertOpponent): Promise<Opponent>;
  updateOpponent(id: string, opponent: Partial<InsertOpponent>): Promise<Opponent>;
  deleteOpponent(id: string): Promise<void>;

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updateData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.password) return false;

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) return false;

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  async createUser(userData: InsertUser): Promise<User> {
    if (!userData.password) {
      throw new Error("Password is required");
    }
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
    
    const isValid = await bcrypt.compare(password, user.password!);
    if (!isValid) {
      return null;
    }
    
    // Update last access
    await db.update(users).set({ lastAccess: new Date() }).where(eq(users.id, user.id));
    return user;
  }

  // Player operations  
  async getPlayers(): Promise<Player[]> {
    const result = await db
      .select({
        id: players.id,
        name: players.name,
        jerseyNumber: players.jerseyNumber,
        position: players.position,
        phoneNumber: players.phoneNumber,
        email: players.email,
        birthDate: players.birthDate,
        tagline: players.tagline,
        profileImageUrl: users.profileImageUrl,
        isActive: players.isActive,
        createdAt: players.createdAt,
        updatedAt: players.updatedAt,
      })
      .from(players)
      .leftJoin(users, eq(players.email, users.email))
      .orderBy(desc(players.createdAt));
    
    return result;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    // First get the user to get their email
    const user = await this.getUser(userId);
    if (!user || !user.email) return undefined;
    
    // Find player by matching email
    const allPlayers = await this.getPlayers();
    const player = allPlayers.find(p => 
      p.email && p.email.toLowerCase() === user.email!.toLowerCase()
    );
    
    return player;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    
    // Auto-create user account for player
    await this.createUserForPlayer(newPlayer);
    
    return newPlayer;
  }

  async createUserForPlayer(player: Player): Promise<User | null> {
    try {
      // Check if user already exists for this player (by email)
      if (player.email) {
        const existingUser = await this.getUserByEmail(player.email);
        if (existingUser) {
          console.log(`User already exists for player ${player.name}: ${existingUser.username}`);
          return existingUser;
        }
      }

      // Generate username, handle duplicates
      let username = player.name.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.]/g, '');
      let counter = 1;
      let finalUsername = username;
      
      while (await this.getUserByUsername(finalUsername)) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      const defaultPassword = 'jugador123'; // Default password for players
      
      console.log(`🔧 Creating user account for player: ${player.name} with username: ${finalUsername}`);
      
      const newUser = await this.createUser({
        username: finalUsername,
        password: defaultPassword,
        firstName: player.name.split(' ')[0],
        lastName: player.name.split(' ').slice(1).join(' ') || '',
        email: player.email || `${finalUsername}@golmanager.local`,
        role: 'user',
        isActive: true,
      });
      
      console.log(`✅ User account created successfully for ${player.name}: ${finalUsername}`);
      return newUser;
    } catch (error) {
      console.error('❌ Failed to create user account for player:', player.name, error);
      return null;
    }
  }

  async createUsersForAllExistingPlayers(): Promise<void> {
    console.log('🔄 Creating user accounts for all existing players...');
    
    const allPlayers = await db.select().from(players);
    let created = 0;
    let skipped = 0;

    for (const player of allPlayers) {
      const result = await this.createUserForPlayer(player);
      if (result) {
        created++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Finished creating users: ${created} created, ${skipped} skipped`);
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    console.log(`Storage: Updating player ${id} with:`, player);
    
    // Get current player data to check for associated user
    const currentPlayer = await this.getPlayer(id);
    if (!currentPlayer) {
      throw new Error(`Player with ID ${id} not found`);
    }

    const [updatedPlayer] = await db
      .update(players)
      .set({ ...player, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    
    // If isActive status is being changed, sync it with associated user
    if (player.isActive !== undefined && currentPlayer.email) {
      console.log(`🔄 Syncing user status for player ${currentPlayer.name} (${currentPlayer.email})`);
      
      try {
        const associatedUser = await this.getUserByEmail(currentPlayer.email);
        if (associatedUser) {
          await this.updateUser(associatedUser.id, { 
            isActive: player.isActive 
          });
          console.log(`✅ User ${associatedUser.username} status synced: isActive = ${player.isActive}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not sync user status for player ${currentPlayer.name}:`, error);
      }
    }
    
    console.log(`Storage: Player updated successfully:`, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<void> {
    // Get player data to check for associated user before deletion
    const player = await this.getPlayer(id);
    
    if (player && player.email) {
      console.log(`🔄 Checking for associated user before deleting player ${player.name} (${player.email})`);
      
      try {
        const associatedUser = await this.getUserByEmail(player.email);
        if (associatedUser) {
          // Delete associated user first
          await db.delete(users).where(eq(users.id, associatedUser.id));
          console.log(`✅ Associated user ${associatedUser.username} deleted`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not delete associated user for player ${player.name}:`, error);
      }
    }

    // Delete the player
    await db.delete(players).where(eq(players.id, id));
    console.log(`✅ Player ${player?.name || id} deleted successfully`);
  }

  async createPlayerForExistingUser(playerData: InsertPlayer, userId: string): Promise<Player> {
    // Create the player without trying to create a user (since user already exists)
    const [newPlayer] = await db.insert(players).values(playerData).returning();
    return newPlayer;
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
    // Handle "none" value for matchId (no specific match)
    const paymentData = {
      ...payment,
      matchId: payment.matchId === "none" ? null : payment.matchId,
    };
    const [newPayment] = await db.insert(championshipPayments).values(paymentData).returning();
    return newPayment;
  }

  async updateChampionshipPayment(id: string, payment: Partial<InsertChampionshipPayment>): Promise<ChampionshipPayment> {
    // Handle "none" value for matchId (no specific match)
    const paymentData = {
      ...payment,
      matchId: payment.matchId === "none" ? null : payment.matchId,
      updatedAt: new Date(),
    };
    const [updatedPayment] = await db
      .update(championshipPayments)
      .set(paymentData)
      .where(eq(championshipPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteChampionshipPayment(id: string): Promise<void> {
    await db.delete(championshipPayments).where(eq(championshipPayments.id, id));
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

  // Team configuration methods
  async getTeamConfig(): Promise<TeamConfig | undefined> {
    const [config] = await db.select().from(teamConfig).where(eq(teamConfig.id, 'team_config'));
    return config || undefined;
  }

  async updateTeamConfig(configData: Partial<InsertTeamConfig>): Promise<TeamConfig> {
    const [config] = await db
      .insert(teamConfig)
      .values({ id: 'team_config', ...configData })
      .onConflictDoUpdate({
        target: teamConfig.id,
        set: configData,
      })
      .returning();
    return config;
  }

  // Match attendance operations
  async getMatchAttendances(matchId: string): Promise<MatchAttendance[]> {
    return await db
      .select()
      .from(matchAttendances)
      .where(eq(matchAttendances.matchId, matchId))
      .orderBy(desc(matchAttendances.createdAt));
  }

  async getUserAttendances(userId: string): Promise<MatchAttendance[]> {
    return await db
      .select()
      .from(matchAttendances)
      .where(eq(matchAttendances.userId, userId))
      .orderBy(desc(matchAttendances.createdAt));
  }

  async createOrUpdateAttendance(attendance: InsertMatchAttendance): Promise<MatchAttendance> {
    // Buscar si ya existe una asistencia para este usuario y partido
    const [existing] = await db
      .select()
      .from(matchAttendances)
      .where(
        and(
          eq(matchAttendances.matchId, attendance.matchId),
          eq(matchAttendances.userId, attendance.userId)
        )
      );

    if (existing) {
      // Actualizar la existente
      const [updated] = await db
        .update(matchAttendances)
        .set({
          ...attendance,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(matchAttendances.id, existing.id))
        .returning();
      return updated;
    } else {
      // Crear nueva
      const [newAttendance] = await db
        .insert(matchAttendances)
        .values({
          ...attendance,
          confirmedAt: new Date(),
        })
        .returning();
      return newAttendance;
    }
  }

  async updateAttendance(id: string, attendance: Partial<InsertMatchAttendance>): Promise<MatchAttendance> {
    const [updated] = await db
      .update(matchAttendances)
      .set({
        ...attendance,
        updatedAt: new Date(),
      })
      .where(eq(matchAttendances.id, id))
      .returning();
    return updated;
  }

  // Opponent operations
  async getOpponents(): Promise<Opponent[]> {
    return await db
      .select()
      .from(opponents)
      .where(eq(opponents.isActive, true))
      .orderBy(opponents.name);
  }

  async getOpponent(id: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(eq(opponents.id, id));
    return opponent;
  }

  async getOpponentByName(name: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(eq(opponents.name, name));
    return opponent;
  }

  async getOpponentByLigaHesperidesId(ligaHesperidesId: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(eq(opponents.ligaHesperidesId, ligaHesperidesId));
    return opponent;
  }

  async createOpponent(opponent: InsertOpponent): Promise<Opponent> {
    const [newOpponent] = await db
      .insert(opponents)
      .values(opponent)
      .returning();
    return newOpponent;
  }

  async updateOpponent(id: string, opponent: Partial<InsertOpponent>): Promise<Opponent> {
    const [updated] = await db
      .update(opponents)
      .set({
        ...opponent,
        updatedAt: new Date(),
      })
      .where(eq(opponents.id, id))
      .returning();
    return updated;
  }

  async deleteOpponent(id: string): Promise<void> {
    await db.delete(opponents).where(eq(opponents.id, id));
  }

  async createOrUpdateOpponent(opponentData: {
    name: string;
    logoUrl?: string;
    source?: string;
  }): Promise<Opponent> {
    // Check if opponent already exists by name
    const existing = await this.getOpponentByName(opponentData.name);
    
    if (existing) {
      // Update existing opponent
      return await this.updateOpponent(existing.id, {
        logoUrl: opponentData.logoUrl,
        source: opponentData.source || 'liga_hesperides',
        updatedAt: new Date(),
      });
    } else {
      // Create new opponent
      return await this.createOpponent({
        name: opponentData.name,
        logoUrl: opponentData.logoUrl,
        source: opponentData.source || 'liga_hesperides',
        isActive: true,
      });
    }
  }
}

export const storage = new DatabaseStorage();
