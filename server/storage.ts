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
  standings,
  organizations,
  userOrganizations,
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
  type Standing,
  type InsertStanding,
  type Organization,
  type InsertOrganization,
  type UserOrganization,
  type InsertUserOrganization,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  getAllOrganizationsWithStats(): Promise<(Organization & { userCount: number; playerCount: number })[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization>;
  
  // User-Organization operations (multi-team support)
  getUserOrganizations(userId: string): Promise<(UserOrganization & { organization: Organization })[]>;
  addUserToOrganization(userId: string, orgId: string, role: string): Promise<UserOrganization>;
  removeUserFromOrganization(userId: string, orgId: string): Promise<void>;
  switchUserOrganization(userId: string, newOrgId: string): Promise<User>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(orgId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
  createUserForPlayer(player: Player, orgId: string): Promise<User | null>;
  createUsersForAllExistingPlayers(orgId: string): Promise<void>;

  // Player operations
  getPlayers(orgId: string): Promise<Player[]>;
  getPlayer(id: string, orgId: string): Promise<Player | undefined>;
  getPlayerByUserId(userId: string, orgId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer, orgId: string): Promise<Player>;
  createPlayerForExistingUser(playerData: InsertPlayer, userId: string, orgId: string): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>, orgId: string): Promise<Player>;
  deletePlayer(id: string, orgId: string): Promise<void>;

  // Match operations
  getMatches(orgId: string): Promise<Match[]>;
  getMatch(id: string, orgId: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch, orgId: string): Promise<Match>;
  updateMatch(id: string, match: Partial<InsertMatch>, orgId: string): Promise<Match>;
  deleteMatch(id: string, orgId: string): Promise<void>;

  // Monthly payment operations
  getMonthlyPayments(orgId: string): Promise<(MonthlyPayment & { player: Player })[]>;
  getMonthlyPayment(id: string, orgId: string): Promise<MonthlyPayment | undefined>;
  createMonthlyPayment(payment: InsertMonthlyPayment, orgId: string): Promise<MonthlyPayment>;
  updateMonthlyPayment(id: string, payment: Partial<InsertMonthlyPayment>, orgId: string): Promise<MonthlyPayment>;
  deleteMonthlyPayment(id: string, orgId: string): Promise<void>;
  getPlayerMonthlyPayments(playerId: string, orgId: string): Promise<MonthlyPayment[]>;

  // Championship payment operations
  getChampionshipPayments(orgId: string): Promise<(ChampionshipPayment & { match?: Match })[]>;
  getChampionshipPayment(id: string, orgId: string): Promise<ChampionshipPayment | undefined>;
  createChampionshipPayment(payment: InsertChampionshipPayment, orgId: string): Promise<ChampionshipPayment>;
  updateChampionshipPayment(id: string, payment: Partial<InsertChampionshipPayment>, orgId: string): Promise<ChampionshipPayment>;
  deleteChampionshipPayment(id: string, orgId: string): Promise<void>;

  // Team configuration operations
  getTeamConfig(orgId: string): Promise<TeamConfig | undefined>;
  updateTeamConfig(config: InsertTeamConfig, orgId: string): Promise<TeamConfig>;

  // Other payments operations
  getOtherPayments(orgId: string): Promise<OtherPayment[]>;
  getOtherPayment(id: string, orgId: string): Promise<OtherPayment | undefined>;
  createOtherPayment(payment: InsertOtherPayment, orgId: string): Promise<OtherPayment>;
  updateOtherPayment(id: string, payment: Partial<InsertOtherPayment>, orgId: string): Promise<OtherPayment>;
  deleteOtherPayment(id: string, orgId: string): Promise<void>;

  // Match attendance operations
  getMatchAttendances(matchId: string, orgId: string): Promise<MatchAttendance[]>;
  getUserAttendances(userId: string, orgId: string): Promise<MatchAttendance[]>;
  createOrUpdateAttendance(attendance: InsertMatchAttendance, orgId: string): Promise<MatchAttendance>;
  updateAttendance(id: string, attendance: Partial<InsertMatchAttendance>, orgId: string): Promise<MatchAttendance>;

  // Opponent operations
  getOpponents(orgId: string): Promise<Opponent[]>;
  getOpponent(id: string, orgId: string): Promise<Opponent | undefined>;
  getOpponentByName(name: string, orgId: string): Promise<Opponent | undefined>;
  getOpponentByLigaHesperidesId(ligaHesperidesId: string, orgId: string): Promise<Opponent | undefined>;
  createOpponent(opponent: InsertOpponent, orgId: string): Promise<Opponent>;
  updateOpponent(id: string, opponent: Partial<InsertOpponent>, orgId: string): Promise<Opponent>;
  deleteOpponent(id: string, orgId: string): Promise<void>;
  createOrUpdateOpponent(opponentData: { name: string; logoUrl?: string; source?: string; }, orgId: string): Promise<Opponent>;

  // Standings operations
  getStandings(orgId: string): Promise<Standing[]>;
  getStanding(id: string, orgId: string): Promise<Standing | undefined>;
  createStanding(standing: InsertStanding, orgId: string): Promise<Standing>;
  updateStanding(id: string, standing: Partial<InsertStanding>, orgId: string): Promise<Standing>;
  deleteStanding(id: string, orgId: string): Promise<void>;
  deleteAllStandings(orgId: string): Promise<void>;

  // Dashboard statistics
  getDashboardStats(orgId: string): Promise<{
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
  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization> {
    const [updated] = await db
      .update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async getAllOrganizationsWithStats(): Promise<(Organization & { userCount: number; playerCount: number })[]> {
    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    const result = await Promise.all(orgs.map(async (org) => {
      const [userCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.organizationId, org.id));
      const [playerCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(players)
        .where(eq(players.organizationId, org.id));
      return {
        ...org,
        userCount: userCountResult?.count || 0,
        playerCount: playerCountResult?.count || 0,
      };
    }));
    return result;
  }

  // User-Organization operations (multi-team support)
  async getUserOrganizations(userId: string): Promise<(UserOrganization & { organization: Organization })[]> {
    const userOrgs = await db.select().from(userOrganizations)
      .where(eq(userOrganizations.userId, userId));
    
    const result = await Promise.all(userOrgs.map(async (uo) => {
      const [org] = await db.select().from(organizations)
        .where(eq(organizations.id, uo.organizationId));
      return { ...uo, organization: org };
    }));
    
    return result;
  }

  async addUserToOrganization(userId: string, orgId: string, role: string = 'user'): Promise<UserOrganization> {
    const existing = await db.select().from(userOrganizations)
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, orgId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newUserOrg] = await db.insert(userOrganizations).values({
      userId,
      organizationId: orgId,
      role,
    }).returning();
    return newUserOrg;
  }

  async removeUserFromOrganization(userId: string, orgId: string): Promise<void> {
    await db.delete(userOrganizations)
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, orgId)
      ));
  }

  async switchUserOrganization(userId: string, newOrgId: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ organizationId: newOrgId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

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

  async getAllUsers(orgId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(desc(users.createdAt));
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
    
    await db.update(users).set({ lastAccess: new Date() }).where(eq(users.id, user.id));
    return user;
  }

  // Player operations  
  async getPlayers(orgId: string): Promise<Player[]> {
    const result = await db
      .select({
        id: players.id,
        organizationId: players.organizationId,
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
      .where(eq(players.organizationId, orgId))
      .orderBy(desc(players.createdAt));
    
    return result;
  }

  async getPlayer(id: string, orgId: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(and(eq(players.id, id), eq(players.organizationId, orgId)));
    return player;
  }

  async getPlayerByUserId(userId: string, orgId: string): Promise<Player | undefined> {
    const user = await this.getUser(userId);
    if (!user || !user.email) return undefined;
    
    const allPlayers = await this.getPlayers(orgId);
    const player = allPlayers.find(p => 
      p.email && p.email.toLowerCase() === user.email!.toLowerCase()
    );
    
    return player;
  }

  async createPlayer(player: InsertPlayer, orgId: string): Promise<Player> {
    const [newPlayer] = await db.insert(players).values({
      ...player,
      organizationId: orgId,
    }).returning();
    
    await this.createUserForPlayer(newPlayer, orgId);
    
    return newPlayer;
  }

  async createUserForPlayer(player: Player, orgId: string): Promise<User | null> {
    try {
      if (player.email) {
        const existingUser = await this.getUserByEmail(player.email);
        if (existingUser) {
          console.log(`User already exists for player ${player.name}: ${existingUser.username}`);
          return existingUser;
        }
      }

      let username = player.name.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.]/g, '');
      let counter = 1;
      let finalUsername = username;
      
      while (await this.getUserByUsername(finalUsername)) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      const defaultPassword = 'jugador123';
      
      console.log(`🔧 Creating user account for player: ${player.name} with username: ${finalUsername}`);
      
      const newUser = await this.createUser({
        username: finalUsername,
        password: defaultPassword,
        firstName: player.name.split(' ')[0],
        lastName: player.name.split(' ').slice(1).join(' ') || '',
        email: player.email || `${finalUsername}@golmanager.local`,
        role: 'user',
        isActive: true,
        organizationId: orgId,
      });
      
      console.log(`✅ User account created successfully for ${player.name}: ${finalUsername}`);
      return newUser;
    } catch (error) {
      console.error('❌ Failed to create user account for player:', player.name, error);
      return null;
    }
  }

  async createUsersForAllExistingPlayers(orgId: string): Promise<void> {
    console.log('🔄 Creating user accounts for all existing players...');
    
    const allPlayers = await db.select().from(players).where(eq(players.organizationId, orgId));
    let created = 0;
    let skipped = 0;

    for (const player of allPlayers) {
      const result = await this.createUserForPlayer(player, orgId);
      if (result) {
        created++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Finished creating users: ${created} created, ${skipped} skipped`);
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>, orgId: string): Promise<Player> {
    console.log(`Storage: Updating player ${id} with:`, player);
    
    const currentPlayer = await this.getPlayer(id, orgId);
    if (!currentPlayer) {
      throw new Error(`Player with ID ${id} not found in organization`);
    }

    const [updatedPlayer] = await db
      .update(players)
      .set({ ...player, updatedAt: new Date() })
      .where(and(eq(players.id, id), eq(players.organizationId, orgId)))
      .returning();
    
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

  async deletePlayer(id: string, orgId: string): Promise<void> {
    const player = await this.getPlayer(id, orgId);
    if (!player) {
      throw new Error(`Player with ID ${id} not found in organization`);
    }
    
    if (player.email) {
      console.log(`🔄 Checking for associated user before deleting player ${player.name} (${player.email})`);
      
      try {
        const associatedUser = await this.getUserByEmail(player.email);
        if (associatedUser) {
          await db.delete(users).where(eq(users.id, associatedUser.id));
          console.log(`✅ Associated user ${associatedUser.username} deleted`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not delete associated user for player ${player.name}:`, error);
      }
    }

    await db.delete(players).where(and(eq(players.id, id), eq(players.organizationId, orgId)));
    console.log(`✅ Player ${player.name} deleted successfully`);
  }

  async createPlayerForExistingUser(playerData: InsertPlayer, userId: string, orgId: string): Promise<Player> {
    const [newPlayer] = await db.insert(players).values({
      ...playerData,
      organizationId: orgId,
    }).returning();
    return newPlayer;
  }

  // Match operations
  async getMatches(orgId: string): Promise<Match[]> {
    return await db.select().from(matches)
      .where(eq(matches.organizationId, orgId))
      .orderBy(desc(matches.date));
  }

  async getMatch(id: string, orgId: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(and(eq(matches.id, id), eq(matches.organizationId, orgId)));
    return match;
  }

  async createMatch(match: InsertMatch, orgId: string): Promise<Match> {
    const [newMatch] = await db.insert(matches).values({
      ...match,
      organizationId: orgId,
    }).returning();
    
    try {
      const config = await this.getTeamConfig(orgId);
      const championshipFee = config?.monthlyFee || "15.00";
      
      await db.insert(championshipPayments).values({
        organizationId: orgId,
        matchId: newMatch.id,
        concept: `Inscripción - ${match.competition || 'Competición'}`,
        amount: championshipFee,
        dueDate: match.date ? match.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: "pending",
        notes: `Pago automático generado para partido vs ${match.opponent}`,
      });
    } catch (error) {
      console.warn('Failed to create automatic championship payment:', error);
    }
    
    return newMatch;
  }

  async updateMatch(id: string, match: Partial<InsertMatch>, orgId: string): Promise<Match> {
    const existing = await this.getMatch(id, orgId);
    if (!existing) {
      throw new Error(`Match with ID ${id} not found in organization`);
    }
    const [updatedMatch] = await db
      .update(matches)
      .set({ ...match, updatedAt: new Date() })
      .where(and(eq(matches.id, id), eq(matches.organizationId, orgId)))
      .returning();
    return updatedMatch;
  }

  async deleteMatch(id: string, orgId: string): Promise<void> {
    const existing = await this.getMatch(id, orgId);
    if (!existing) {
      throw new Error(`Match with ID ${id} not found in organization`);
    }
    await db.delete(matches).where(and(eq(matches.id, id), eq(matches.organizationId, orgId)));
  }

  // Monthly payment operations
  async getMonthlyPayments(orgId: string): Promise<(MonthlyPayment & { player: Player })[]> {
    const payments = await db
      .select()
      .from(monthlyPayments)
      .leftJoin(players, eq(monthlyPayments.playerId, players.id))
      .where(eq(monthlyPayments.organizationId, orgId))
      .orderBy(desc(monthlyPayments.createdAt));
    
    return payments.map(({ monthly_payments, players: player }) => ({
      ...monthly_payments,
      player: player!,
    }));
  }

  async getMonthlyPayment(id: string, orgId: string): Promise<MonthlyPayment | undefined> {
    const [payment] = await db.select().from(monthlyPayments).where(and(eq(monthlyPayments.id, id), eq(monthlyPayments.organizationId, orgId)));
    return payment;
  }

  async createMonthlyPayment(payment: InsertMonthlyPayment, orgId: string): Promise<MonthlyPayment> {
    const [newPayment] = await db.insert(monthlyPayments).values({
      ...payment,
      organizationId: orgId,
    }).returning();
    return newPayment;
  }

  async updateMonthlyPayment(id: string, payment: Partial<InsertMonthlyPayment>, orgId: string): Promise<MonthlyPayment> {
    const existing = await this.getMonthlyPayment(id, orgId);
    if (!existing) {
      throw new Error(`Monthly payment with ID ${id} not found in organization`);
    }
    const [updatedPayment] = await db
      .update(monthlyPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(and(eq(monthlyPayments.id, id), eq(monthlyPayments.organizationId, orgId)))
      .returning();
    return updatedPayment;
  }

  async deleteMonthlyPayment(id: string, orgId: string): Promise<void> {
    const existing = await this.getMonthlyPayment(id, orgId);
    if (!existing) {
      throw new Error(`Monthly payment with ID ${id} not found in organization`);
    }
    await db.delete(monthlyPayments).where(and(eq(monthlyPayments.id, id), eq(monthlyPayments.organizationId, orgId)));
  }

  async getPlayerMonthlyPayments(playerId: string, orgId: string): Promise<MonthlyPayment[]> {
    return await db
      .select()
      .from(monthlyPayments)
      .where(and(eq(monthlyPayments.playerId, playerId), eq(monthlyPayments.organizationId, orgId)))
      .orderBy(desc(monthlyPayments.month));
  }

  // Championship payment operations
  async getChampionshipPayments(orgId: string): Promise<(ChampionshipPayment & { match?: Match })[]> {
    const payments = await db
      .select()
      .from(championshipPayments)
      .leftJoin(matches, eq(championshipPayments.matchId, matches.id))
      .where(eq(championshipPayments.organizationId, orgId))
      .orderBy(desc(championshipPayments.createdAt));
    
    return payments.map(({ championship_payments, matches: match }) => ({
      ...championship_payments,
      match: match || undefined,
    }));
  }

  async getChampionshipPayment(id: string, orgId: string): Promise<ChampionshipPayment | undefined> {
    const [payment] = await db.select().from(championshipPayments).where(and(eq(championshipPayments.id, id), eq(championshipPayments.organizationId, orgId)));
    return payment;
  }

  async createChampionshipPayment(payment: InsertChampionshipPayment, orgId: string): Promise<ChampionshipPayment> {
    const paymentData = {
      ...payment,
      organizationId: orgId,
      matchId: payment.matchId === "none" ? null : payment.matchId,
    };
    const [newPayment] = await db.insert(championshipPayments).values(paymentData).returning();
    return newPayment;
  }

  async updateChampionshipPayment(id: string, payment: Partial<InsertChampionshipPayment>, orgId: string): Promise<ChampionshipPayment> {
    const existing = await this.getChampionshipPayment(id, orgId);
    if (!existing) {
      throw new Error(`Championship payment with ID ${id} not found in organization`);
    }
    const paymentData = {
      ...payment,
      matchId: payment.matchId === "none" ? null : payment.matchId,
      updatedAt: new Date(),
    };
    const [updatedPayment] = await db
      .update(championshipPayments)
      .set(paymentData)
      .where(and(eq(championshipPayments.id, id), eq(championshipPayments.organizationId, orgId)))
      .returning();
    return updatedPayment;
  }

  async deleteChampionshipPayment(id: string, orgId: string): Promise<void> {
    const existing = await this.getChampionshipPayment(id, orgId);
    if (!existing) {
      throw new Error(`Championship payment with ID ${id} not found in organization`);
    }
    await db.delete(championshipPayments).where(and(eq(championshipPayments.id, id), eq(championshipPayments.organizationId, orgId)));
  }

  // Dashboard statistics
  async getDashboardStats(orgId: string): Promise<{
    totalPlayers: number;
    activePlayers: number;
    upcomingMatches: number;
    pendingPayments: number;
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
  }> {
    const [totalPlayersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.organizationId, orgId));

    const [activePlayersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(and(eq(players.organizationId, orgId), eq(players.isActive, true)));

    const [upcomingMatchesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(and(
        eq(matches.organizationId, orgId),
        eq(matches.status, "scheduled"),
        sql`${matches.date} > now()`
      ));

    const [pendingPaymentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(monthlyPayments)
      .where(and(
        eq(monthlyPayments.organizationId, orgId),
        eq(monthlyPayments.status, "pending")
      ));

    const [totalIncomeResult] = await db
      .select({ total: sql<number>`coalesce(sum(${monthlyPayments.amount}), 0)` })
      .from(monthlyPayments)
      .where(and(
        eq(monthlyPayments.organizationId, orgId),
        eq(monthlyPayments.status, "paid")
      ));

    const [totalExpensesResult] = await db
      .select({ total: sql<number>`coalesce(sum(${championshipPayments.amount}), 0)` })
      .from(championshipPayments)
      .where(and(
        eq(championshipPayments.organizationId, orgId),
        eq(championshipPayments.status, "paid")
      ));

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
  async getOtherPayments(orgId: string): Promise<OtherPayment[]> {
    return await db.select().from(otherPayments)
      .where(eq(otherPayments.organizationId, orgId))
      .orderBy(desc(otherPayments.createdAt));
  }

  async getOtherPayment(id: string, orgId: string): Promise<OtherPayment | undefined> {
    const [payment] = await db.select().from(otherPayments).where(and(eq(otherPayments.id, id), eq(otherPayments.organizationId, orgId)));
    return payment;
  }

  async createOtherPayment(payment: InsertOtherPayment, orgId: string): Promise<OtherPayment> {
    const [newPayment] = await db.insert(otherPayments).values({
      ...payment,
      organizationId: orgId,
    }).returning();
    return newPayment;
  }

  async updateOtherPayment(id: string, payment: Partial<InsertOtherPayment>, orgId: string): Promise<OtherPayment> {
    const existing = await this.getOtherPayment(id, orgId);
    if (!existing) {
      throw new Error(`Other payment with ID ${id} not found in organization`);
    }
    const [updatedPayment] = await db
      .update(otherPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(and(eq(otherPayments.id, id), eq(otherPayments.organizationId, orgId)))
      .returning();
    return updatedPayment;
  }

  async deleteOtherPayment(id: string, orgId: string): Promise<void> {
    const existing = await this.getOtherPayment(id, orgId);
    if (!existing) {
      throw new Error(`Other payment with ID ${id} not found in organization`);
    }
    await db.delete(otherPayments).where(and(eq(otherPayments.id, id), eq(otherPayments.organizationId, orgId)));
  }

  // Team configuration methods
  async getTeamConfig(orgId: string): Promise<TeamConfig | undefined> {
    const [config] = await db.select().from(teamConfig)
      .where(eq(teamConfig.organizationId, orgId));
    return config || undefined;
  }

  async updateTeamConfig(configData: Partial<InsertTeamConfig>, orgId: string): Promise<TeamConfig> {
    const existing = await this.getTeamConfig(orgId);
    const { id: _, organizationId: __, ...safeConfigData } = configData as any;
    
    if (existing) {
      const [config] = await db
        .update(teamConfig)
        .set({ ...safeConfigData, updatedAt: new Date() })
        .where(eq(teamConfig.organizationId, orgId))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(teamConfig)
        .values({ ...safeConfigData, organizationId: orgId })
        .returning();
      return config;
    }
  }

  // Match attendance operations
  async getMatchAttendances(matchId: string, orgId: string): Promise<MatchAttendance[]> {
    return await db
      .select()
      .from(matchAttendances)
      .where(and(eq(matchAttendances.matchId, matchId), eq(matchAttendances.organizationId, orgId)))
      .orderBy(desc(matchAttendances.createdAt));
  }

  async getUserAttendances(userId: string, orgId: string): Promise<MatchAttendance[]> {
    return await db
      .select()
      .from(matchAttendances)
      .where(and(eq(matchAttendances.userId, userId), eq(matchAttendances.organizationId, orgId)))
      .orderBy(desc(matchAttendances.createdAt));
  }

  async createOrUpdateAttendance(attendance: InsertMatchAttendance, orgId: string): Promise<MatchAttendance> {
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
      const [newAttendance] = await db
        .insert(matchAttendances)
        .values({
          ...attendance,
          organizationId: orgId,
          confirmedAt: new Date(),
        })
        .returning();
      return newAttendance;
    }
  }

  async updateAttendance(id: string, attendance: Partial<InsertMatchAttendance>, orgId: string): Promise<MatchAttendance> {
    const [existing] = await db.select().from(matchAttendances).where(and(eq(matchAttendances.id, id), eq(matchAttendances.organizationId, orgId)));
    if (!existing) {
      throw new Error(`Attendance with ID ${id} not found in organization`);
    }
    const [updated] = await db
      .update(matchAttendances)
      .set({
        ...attendance,
        updatedAt: new Date(),
      })
      .where(and(eq(matchAttendances.id, id), eq(matchAttendances.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Opponent operations
  async getOpponents(orgId: string): Promise<Opponent[]> {
    return await db
      .select()
      .from(opponents)
      .where(and(
        eq(opponents.organizationId, orgId),
        eq(opponents.isActive, true)
      ))
      .orderBy(opponents.name);
  }

  async getOpponent(id: string, orgId: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(and(eq(opponents.id, id), eq(opponents.organizationId, orgId)));
    return opponent;
  }

  async getOpponentByName(name: string, orgId: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(and(
        eq(opponents.organizationId, orgId),
        eq(opponents.name, name)
      ));
    return opponent;
  }

  async getOpponentByLigaHesperidesId(ligaHesperidesId: string, orgId: string): Promise<Opponent | undefined> {
    const [opponent] = await db
      .select()
      .from(opponents)
      .where(and(
        eq(opponents.organizationId, orgId),
        eq(opponents.ligaHesperidesId, ligaHesperidesId)
      ));
    return opponent;
  }

  async createOpponent(opponent: InsertOpponent, orgId: string): Promise<Opponent> {
    const [newOpponent] = await db
      .insert(opponents)
      .values({
        ...opponent,
        organizationId: orgId,
      })
      .returning();
    return newOpponent;
  }

  async updateOpponent(id: string, opponent: Partial<InsertOpponent>, orgId: string): Promise<Opponent> {
    const existing = await this.getOpponent(id, orgId);
    if (!existing) {
      throw new Error(`Opponent with ID ${id} not found in organization`);
    }
    const [updated] = await db
      .update(opponents)
      .set({
        ...opponent,
        updatedAt: new Date(),
      })
      .where(and(eq(opponents.id, id), eq(opponents.organizationId, orgId)))
      .returning();
    return updated;
  }

  async deleteOpponent(id: string, orgId: string): Promise<void> {
    const existing = await this.getOpponent(id, orgId);
    if (!existing) {
      throw new Error(`Opponent with ID ${id} not found in organization`);
    }
    await db.delete(opponents).where(and(eq(opponents.id, id), eq(opponents.organizationId, orgId)));
  }

  async createOrUpdateOpponent(opponentData: {
    name: string;
    logoUrl?: string;
    source?: string;
  }, orgId: string): Promise<Opponent> {
    const existing = await this.getOpponentByName(opponentData.name, orgId);
    
    if (existing) {
      return await this.updateOpponent(existing.id, {
        logoUrl: opponentData.logoUrl,
        source: opponentData.source || 'liga_hesperides',
      }, orgId);
    } else {
      return await this.createOpponent({
        name: opponentData.name,
        logoUrl: opponentData.logoUrl,
        source: opponentData.source || 'liga_hesperides',
        isActive: true,
      }, orgId);
    }
  }

  // Standings operations
  async getStandings(orgId: string): Promise<Standing[]> {
    return await db
      .select()
      .from(standings)
      .where(eq(standings.organizationId, orgId))
      .orderBy(standings.position);
  }

  async getStanding(id: string, orgId: string): Promise<Standing | undefined> {
    const [standing] = await db
      .select()
      .from(standings)
      .where(and(eq(standings.id, id), eq(standings.organizationId, orgId)));
    return standing;
  }

  async createStanding(standing: InsertStanding, orgId: string): Promise<Standing> {
    const [newStanding] = await db
      .insert(standings)
      .values({
        ...standing,
        organizationId: orgId,
      })
      .returning();
    return newStanding;
  }

  async updateStanding(id: string, standing: Partial<InsertStanding>, orgId: string): Promise<Standing> {
    const existing = await this.getStanding(id, orgId);
    if (!existing) {
      throw new Error(`Standing with ID ${id} not found in organization`);
    }
    const [updated] = await db
      .update(standings)
      .set({
        ...standing,
        updatedAt: new Date(),
      })
      .where(and(eq(standings.id, id), eq(standings.organizationId, orgId)))
      .returning();
    return updated;
  }

  async deleteStanding(id: string, orgId: string): Promise<void> {
    const existing = await this.getStanding(id, orgId);
    if (!existing) {
      throw new Error(`Standing with ID ${id} not found in organization`);
    }
    await db.delete(standings).where(and(eq(standings.id, id), eq(standings.organizationId, orgId)));
  }

  async deleteAllStandings(orgId: string): Promise<void> {
    await db.delete(standings).where(eq(standings.organizationId, orgId));
  }
}

export const storage = new DatabaseStorage();
