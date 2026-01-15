import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, loginUser, registerUser, registerUserWithOrganization, getOrgId } from "./auth";
import { 
  insertPlayerSchema,
  insertMatchSchema,
  insertMonthlyPaymentSchema,
  insertChampionshipPaymentSchema,
  insertTeamConfigSchema,
  insertOtherPaymentSchema,
  insertMatchAttendanceSchema,
  insertOrganizationSchema,
  insertOpponentSchema,
  loginSchema,
  registerSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const user = await loginUser(req.body);
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(401).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const user = await registerUser(req.body);
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Register error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post('/api/auth/register-with-organization', async (req, res) => {
    try {
      const { userData, organizationData } = req.body;
      const { user, organization } = await registerUserWithOrganization(userData, organizationData);
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, organization });
    } catch (error) {
      console.error("Register with org error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post('/api/auth/register-admin', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const orgId = getOrgId(req);
      const validatedData = { ...req.body, organizationId: orgId };
      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user as any;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post('/api/admin/create-users-for-players', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied - Admin required" });
      }
      const orgId = getOrgId(req);
      console.log(`🔧 Admin ${currentUser.username || currentUser.id} initiating user creation for existing players...`);
      await storage.createUsersForAllExistingPlayers(orgId);
      res.json({ success: true, message: "Users created successfully for all existing players" });
    } catch (error) {
      console.error("Error creating users for existing players:", error);
      res.status(500).json({ message: "Failed to create users for existing players" });
    }
  });

  app.post('/api/emergency/reset-admin', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: "Emergency endpoint only available in development" });
    }
    try {
      console.log('🚨 EMERGENCY: Creating/resetting admin user...');
      const existingAdmin = await storage.getUserByEmail('admin@sobrado.com');
      if (existingAdmin) {
        await storage.updateUser(existingAdmin.id, {
          password: await bcrypt.hash('password', 10),
          username: 'admin',
          role: 'admin',
          isActive: true
        });
        console.log('✅ Admin password reset to: password');
        res.json({ success: true, message: 'Admin password reset successfully', username: 'admin', email: 'admin@sobrado.com', password: 'password' });
      } else {
        await storage.createUser({
          username: 'admin',
          email: 'admin@sobrado.com',
          password: 'password',
          firstName: 'Admin',
          lastName: 'System',
          role: 'admin',
          isActive: true,
          organizationId: 'default-org'
        });
        console.log('✅ Admin user created with password: password');
        res.json({ success: true, message: 'Admin user created successfully', username: 'admin', email: 'admin@sobrado.com', password: 'password' });
      }
    } catch (error) {
      console.error('❌ Error in emergency admin reset:', error);
      res.status(500).json({ message: "Failed to reset admin user" });
    }
  });

  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      const success = await storage.changePassword(currentUser.id, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get('/api/placeholder-profile-image/:userId', (req, res) => {
    const userId = req.params.userId;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const colorIndex = userId.length % colors.length;
    const color = colors[colorIndex];
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="${color}"/>
      <circle cx="100" cy="70" r="25" fill="white" opacity="0.9"/>
      <path d="M100 120 Q70 150 40 180 Q70 160 100 160 Q130 160 160 180 Q130 150 100 120" fill="white" opacity="0.9"/>
      <text x="100" y="140" text-anchor="middle" fill="white" font-size="14" font-family="Arial">Foto</text>
    </svg>`;
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache');
    res.send(svg);
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const { password, ...userWithoutPassword } = user as any;
      if (req.organization) {
        (userWithoutPassword as any).organization = req.organization;
      }
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.get("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (currentUser.role === "admin") {
        const orgs = await storage.getAllOrganizations();
        res.json(orgs);
      } else {
        if (req.organization) {
          res.json([req.organization]);
        } else {
          res.json([]);
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/current", isAuthenticated, async (req, res) => {
    try {
      if (req.organization) {
        res.json(req.organization);
      } else {
        res.status(404).json({ message: "No organization found" });
      }
    } catch (error) {
      console.error("Error fetching current organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.patch("/api/organizations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      const org = await storage.updateOrganization(req.params.id, validatedData);
      res.json(org);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid organization data", errors: error.errors });
      }
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // Admin: Get all organizations with stats
  app.get("/api/admin/organizations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgs = await storage.getAllOrganizationsWithStats();
      res.json(orgs);
    } catch (error) {
      console.error("Error fetching organizations with stats:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Admin: Create new organization with admin user
  app.post("/api/admin/organizations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1, "Nombre requerido"),
        slug: z.string().min(1, "Slug requerido"),
        adminEmail: z.string().email("Email inválido"),
        adminFirstName: z.string().min(1, "Nombre del admin requerido"),
        adminLastName: z.string().optional(),
        adminPassword: z.string().min(6, "Contraseña mínimo 6 caracteres"),
      });
      
      const validatedData = schema.parse(req.body);
      
      // Check if slug already exists and make it unique if needed
      let slug = validatedData.slug;
      let existingOrg = await storage.getOrganizationBySlug(slug);
      let counter = 1;
      while (existingOrg) {
        slug = `${validatedData.slug}-${counter}`;
        existingOrg = await storage.getOrganizationBySlug(slug);
        counter++;
      }
      
      const result = await storage.createOrganizationWithAdmin({
        organization: { name: validatedData.name, slug },
        admin: {
          email: validatedData.adminEmail,
          firstName: validatedData.adminFirstName,
          lastName: validatedData.adminLastName,
          password: validatedData.adminPassword,
        },
      });
      
      res.status(201).json({
        organization: result.organization,
        adminUser: {
          id: result.adminUser.id,
          email: result.adminUser.email,
          username: result.adminUser.username,
          firstName: result.adminUser.firstName,
        },
        tempPassword: result.tempPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message.includes("email")) {
          return res.status(409).json({ message: error.message });
        }
      }
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Error al crear la organización" });
    }
  });

  // Admin: Delete organization
  app.delete("/api/admin/organizations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      // Get current user to check if they're trying to delete their own org
      const currentUser = userId ? await storage.getUser(userId) : null;
      if (currentUser?.organizationId === id) {
        return res.status(400).json({ message: "No puedes eliminar tu propia organización activa" });
      }
      
      await storage.deleteOrganization(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Admin: Get single organization with details
  app.get("/api/admin/organizations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const org = await storage.getOrganizationWithDetails(req.params.id);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      console.error("Error fetching organization details:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Admin: Get all players across all organizations
  app.get("/api/admin/players", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const players = await storage.getAllPlayersWithOrganizations();
      res.json(players);
    } catch (error) {
      console.error("Error fetching all players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  // Admin: Get single player with details
  app.get("/api/admin/players/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const player = await storage.getPlayerWithOrganizations(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player details:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  // Admin: Update player
  app.patch("/api/admin/players/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(req.params.id, validatedData);
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  // Admin: Add player to organization
  app.post("/api/admin/player-organizations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const schema = z.object({
        playerId: z.string().min(1, "Player ID is required"),
        organizationId: z.string().min(1, "Organization ID is required"),
        jerseyNumber: z.number().optional(),
        position: z.string().optional(),
      });
      
      const { playerId, organizationId, jerseyNumber, position } = schema.parse(req.body);
      
      // Verify organization exists
      const org = await storage.getOrganization(organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verify player exists (use admin function without org scope)
      const player = await storage.getPlayerWithOrganizations(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Check for duplicate membership (player already in this org)
      const alreadyMember = player.organizations?.some(o => o.id === organizationId);
      if (alreadyMember) {
        return res.status(400).json({ message: "Player is already a member of this organization" });
      }
      
      const result = await storage.addPlayerToOrganization(playerId, organizationId, jerseyNumber, position);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      // Handle unique constraint violation
      if (error instanceof Error && error.message.includes('unique') || 
          (error as any)?.code === '23505') {
        return res.status(409).json({ message: "Player is already a member of this organization" });
      }
      console.error("Error adding player to organization:", error);
      res.status(500).json({ message: "Failed to add player to organization" });
    }
  });

  // Admin: Remove player from organization
  app.delete("/api/admin/player-organizations/:playerId/:organizationId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { playerId, organizationId } = req.params;
      
      if (!playerId || !organizationId) {
        return res.status(400).json({ message: "Player ID and Organization ID are required" });
      }
      
      // Verify organization exists
      const org = await storage.getOrganization(organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verify player exists
      const player = await storage.getPlayerWithOrganizations(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Check if player is actually a member of this org
      const isMember = player.organizations?.some(o => o.id === organizationId);
      if (!isMember) {
        return res.status(400).json({ message: "Player is not a member of this organization" });
      }
      
      await storage.removePlayerFromOrganization(playerId, organizationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing player from organization:", error);
      res.status(500).json({ message: "Failed to remove player from organization" });
    }
  });

  // Admin: Update player organization settings (jersey number, position per team)
  app.patch("/api/admin/player-organizations/:playerId/:organizationId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { playerId, organizationId } = req.params;
      const schema = z.object({
        jerseyNumber: z.number().min(1).max(99).optional(),
        position: z.string().optional(),
      });
      const data = schema.parse(req.body);
      
      const updated = await storage.updatePlayerOrganization(playerId, organizationId, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error updating player organization:", error);
      res.status(500).json({ message: "Failed to update player organization" });
    }
  });

  // User's organizations (for org selector - multi-team support)
  app.get("/api/user/organizations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userOrgs = await storage.getUserOrganizations(userId);
      
      // Also include the current organization if not in the list
      const currentOrgId = (req.user as any).organizationId;
      const currentOrg = req.organization;
      
      // Check if current org is already in the list
      const hasCurrentOrg = userOrgs.some(uo => uo.organizationId === currentOrgId);
      
      if (!hasCurrentOrg && currentOrg) {
        // Add current org to the list
        userOrgs.push({
          id: 'current',
          userId,
          organizationId: currentOrgId,
          role: (req.user as any).role || 'user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: currentOrg,
        });
      }
      
      res.json(userOrgs);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ message: "Failed to fetch user organizations" });
    }
  });

  // Switch user's active organization
  app.post("/api/user/switch-organization", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { organizationId } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      // Verify the organization exists
      const org = await storage.getOrganization(organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Update user's current organization
      const updatedUser = await storage.switchUserOrganization(userId, organizationId);
      
      // Also add to user_organizations if not already there
      await storage.addUserToOrganization(userId, organizationId, updatedUser.role || 'user');
      
      res.json({ success: true, user: updatedUser, organization: org });
    } catch (error) {
      console.error("Error switching organization:", error);
      res.status(500).json({ message: "Failed to switch organization" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const stats = await storage.getDashboardStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Player routes
  app.get("/api/players", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const players = await storage.getPlayers(orgId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const player = await storage.getPlayer(req.params.id, orgId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.get("/api/players/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const orgId = getOrgId(req);
      const player = await storage.getPlayerByUserId(userId, orgId);
      if (!player) {
        return res.status(404).json({ message: "Player not found for this user" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player by user ID:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.post("/api/players", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData, orgId);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error creating player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.patch("/api/players/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      console.log(`Updating player ${req.params.id} with data:`, req.body);
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      const currentPlayer = await storage.getPlayer(req.params.id, orgId);
      if (!currentPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      const player = await storage.updatePlayer(req.params.id, validatedData, orgId);
      if (validatedData.name && currentPlayer.email) {
        const user = await storage.getUserByEmail(currentPlayer.email);
        if (user) {
          const nameParts = validatedData.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          await storage.updateUser(user.id, { firstName, lastName });
          console.log(`🔄 Synced name to user: ${firstName} ${lastName}`);
        }
      }
      console.log(`✅ Player updated successfully:`, player);
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete("/api/players/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      await storage.deletePlayer(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  app.post("/api/players/cleanup/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const orgId = getOrgId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const allPlayers = await storage.getPlayers(orgId);
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const duplicates = allPlayers.filter(p => p.name === userFullName);
      if (duplicates.length > 1) {
        const sorted = duplicates.sort((a, b) => new Date(b.updatedAt || b.createdAt || Date.now()).getTime() - new Date(a.updatedAt || a.createdAt || Date.now()).getTime());
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        for (const player of toDelete) {
          await storage.deletePlayer(player.id, orgId);
          console.log(`Deleted duplicate player: ${player.id}`);
        }
        res.json({ message: `Cleaned up ${toDelete.length} duplicate players`, keptPlayer: toKeep, deletedCount: toDelete.length });
      } else {
        res.json({ message: "No duplicates found", player: duplicates[0] });
      }
    } catch (error) {
      console.error("Error cleaning up players:", error);
      res.status(500).json({ message: "Failed to cleanup players" });
    }
  });

  // Match routes
  app.get("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const matches = await storage.getMatches(orgId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const match = await storage.getMatch(req.params.id, orgId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  app.post("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData, orgId);
      try {
        const players = await storage.getPlayers(orgId);
        const attendancePromises = players.map(player => 
          storage.createOrUpdateAttendance({ matchId: match.id, userId: player.id, status: "pending" }, orgId)
        );
        await Promise.all(attendancePromises);
        console.log(`Auto-convocated ${players.length} players for match ${match.id}`);
      } catch (error) {
        console.warn('Failed to auto-convocate players:', error);
      }
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  app.patch("/api/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertMatchSchema.partial().parse(req.body);
      const match = await storage.updateMatch(req.params.id, validatedData, orgId);
      res.json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  app.delete("/api/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      await storage.deleteMatch(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting match:", error);
      res.status(500).json({ message: "Failed to delete match" });
    }
  });

  // Monthly payments routes
  app.get("/api/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payments = await storage.getMonthlyPayments(orgId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching monthly payments:", error);
      res.status(500).json({ message: "Failed to fetch monthly payments" });
    }
  });

  app.get("/api/players/:playerId/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payments = await storage.getPlayerMonthlyPayments(req.params.playerId, orgId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching player monthly payments:", error);
      res.status(500).json({ message: "Failed to fetch player monthly payments" });
    }
  });

  app.get("/api/monthly-payments/player/:playerId", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payments = await storage.getPlayerMonthlyPayments(req.params.playerId, orgId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching monthly payments for player:", error);
      res.status(500).json({ message: "Failed to fetch monthly payments for player" });
    }
  });

  app.post("/api/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertMonthlyPaymentSchema.parse(req.body);
      const payment = await storage.createMonthlyPayment(validatedData, orgId);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating monthly payment:", error);
      res.status(500).json({ message: "Failed to create monthly payment" });
    }
  });

  app.patch("/api/monthly-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertMonthlyPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateMonthlyPayment(req.params.id, validatedData, orgId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating monthly payment:", error);
      res.status(500).json({ message: "Failed to update monthly payment" });
    }
  });

  app.delete("/api/monthly-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      await storage.deleteMonthlyPayment(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting monthly payment:", error);
      res.status(500).json({ message: "Failed to delete monthly payment" });
    }
  });

  app.post("/api/monthly-payments/create-month", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { month: requestedMonth, year: requestedYear } = req.body;
      
      const now = new Date();
      const year = requestedYear ? parseInt(requestedYear) : now.getFullYear();
      const month = requestedMonth ? parseInt(requestedMonth) : (now.getMonth() + 1);
      const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
      
      const players = await storage.getPlayers(orgId);
      const activePlayers = players.filter(player => player.isActive);
      const config = await storage.getTeamConfig(orgId);
      const monthlyFee = config?.monthlyFee || 15.00;
      const paymentDueDay = config?.paymentDueDay || 15;
      const daysInMonth = new Date(year, month, 0).getDate();
      const safeDay = Math.min(paymentDueDay, daysInMonth);
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
      const existingPayments = await storage.getMonthlyPayments(orgId);
      const existingPlayerIds = new Set(existingPayments.filter(payment => payment.month === targetMonth).map(payment => payment.playerId));
      const paymentsToCreate = activePlayers.filter(player => !existingPlayerIds.has(player.id));
      let createdCount = 0;
      for (const player of paymentsToCreate) {
        await storage.createMonthlyPayment({
          playerId: player.id,
          month: targetMonth,
          amount: monthlyFee.toString(),
          dueDate: dueDate,
          status: "pending",
          paymentMethod: "",
          notes: `Pago automático generado para ${targetMonth}`,
        }, orgId);
        createdCount++;
      }
      res.json({ count: createdCount, month: targetMonth, totalPlayers: activePlayers.length, existingPayments: existingPlayerIds.size });
    } catch (error) {
      console.error("Error creating current month payments:", error);
      res.status(500).json({ message: "Failed to create current month payments" });
    }
  });

  // Championship payments routes
  app.get("/api/championship-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payments = await storage.getChampionshipPayments(orgId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching championship payments:", error);
      res.status(500).json({ message: "Failed to fetch championship payments" });
    }
  });

  app.post("/api/championship-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertChampionshipPaymentSchema.parse(req.body);
      const payment = await storage.createChampionshipPayment(validatedData, orgId);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating championship payment:", error);
      res.status(500).json({ message: "Failed to create championship payment" });
    }
  });

  app.patch("/api/championship-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertChampionshipPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateChampionshipPayment(req.params.id, validatedData, orgId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating championship payment:", error);
      res.status(500).json({ message: "Failed to update championship payment" });
    }
  });

  app.delete("/api/championship-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      await storage.deleteChampionshipPayment(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting championship payment:", error);
      res.status(500).json({ message: "Failed to delete championship payment" });
    }
  });

  // Team configuration routes
  app.get("/api/team-config", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const config = await storage.getTeamConfig(orgId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching team config:", error);
      res.status(500).json({ message: "Failed to fetch team configuration" });
    }
  });

  app.post("/api/team-config", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertTeamConfigSchema.parse(req.body);
      const config = await storage.updateTeamConfig(validatedData, orgId);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid config data", errors: error.errors });
      }
      console.error("Error updating team config:", error);
      res.status(500).json({ message: "Failed to update team configuration" });
    }
  });

  // Users management (admin only)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const orgId = getOrgId(req);
      const allUsers = await storage.getAllUsers(orgId);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const userId = req.params.id;
      const orgId = getOrgId(req);
      if (currentUser.role !== "admin" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (req.body.firstName || req.body.lastName) {
        const player = await storage.getPlayerByUserId(userId, orgId);
        if (player) {
          const fullName = `${req.body.firstName || updatedUser.firstName || ''} ${req.body.lastName || updatedUser.lastName || ''}`.trim();
          if (fullName && fullName !== player.name) {
            await storage.updatePlayer(player.id, { name: fullName }, orgId);
            console.log(`🔄 Synced name from user to player: ${fullName}`);
          }
        }
      }
      const { password, ...userWithoutPassword } = updatedUser as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Other payments routes
  app.get("/api/other-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payments = await storage.getOtherPayments(orgId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching other payments:", error);
      res.status(500).json({ message: "Failed to fetch other payments" });
    }
  });

  app.get("/api/other-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const payment = await storage.getOtherPayment(req.params.id, orgId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching other payment:", error);
      res.status(500).json({ message: "Failed to fetch other payment" });
    }
  });

  app.post("/api/other-payments", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertOtherPaymentSchema.parse(req.body);
      const payment = await storage.createOtherPayment(validatedData, orgId);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating other payment:", error);
      res.status(500).json({ message: "Failed to create other payment" });
    }
  });

  app.patch("/api/other-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertOtherPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateOtherPayment(req.params.id, validatedData, orgId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating other payment:", error);
      res.status(500).json({ message: "Failed to update other payment" });
    }
  });

  app.delete("/api/other-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      await storage.deleteOtherPayment(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting other payment:", error);
      res.status(500).json({ message: "Failed to delete other payment" });
    }
  });

  // Match attendance routes
  app.get("/api/matches/:matchId/attendances", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const attendances = await storage.getMatchAttendances(req.params.matchId, orgId);
      res.json(attendances);
    } catch (error) {
      console.error("Error fetching match attendances:", error);
      res.status(500).json({ message: "Failed to fetch attendances" });
    }
  });

  app.get("/api/attendances/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const attendances = await storage.getUserAttendances(req.params.userId, orgId);
      res.json(attendances);
    } catch (error) {
      console.error("Error fetching user attendances:", error);
      res.status(500).json({ message: "Failed to fetch user attendances" });
    }
  });

  app.post("/api/attendances", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const userId = currentUser?.id;
      const orgId = getOrgId(req);
      console.log('User ID:', userId);
      console.log('Request body:', req.body);
      const player = await storage.getPlayerByUserId(userId, orgId);
      if (!player) {
        console.log('No player found for user:', userId);
        return res.status(404).json({ message: "Player profile not found for this user" });
      }
      console.log('Player found:', player.id);
      const attendanceData = { matchId: req.body.matchId, status: req.body.status, userId: player.id };
      console.log('Creating attendance with data:', attendanceData);
      const attendance = await storage.createOrUpdateAttendance(attendanceData, orgId);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/attendances/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertMatchAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, validatedData, orgId);
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  app.post("/api/admin/attendances", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const orgId = getOrgId(req);
      const { matchId, playerId, status } = req.body;
      if (!matchId || !playerId || !status) {
        return res.status(400).json({ message: "matchId, playerId, and status are required" });
      }
      if (!['confirmed', 'absent', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'confirmed', 'absent', or 'pending'" });
      }
      console.log('Admin updating attendance:', { matchId, playerId, status });
      const attendanceData = { matchId, status, userId: playerId };
      const attendance = await storage.createOrUpdateAttendance(attendanceData, orgId);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error updating attendance (admin):", error);
      res.status(500).json({ message: "Failed to update attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Object storage routes
  const { ObjectStorageService } = await import("./objectStorage");
  
  app.post("/api/upload/url", isAuthenticated, async (req, res) => {
    try {
      const { fileName, contentType, purpose } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "fileName and contentType are required" });
      }
      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL(fileName, contentType, purpose);
      res.json({ uploadURL: result.uploadURL, objectPath: result.objectPath, publicURL: result.objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(404).json({ error: "Object not found" });
    }
  });

  // Liga Hesperides integration routes
  app.post("/api/liga-hesperides/import-matches", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const config = await storage.getTeamConfig(orgId);
      if (!config?.ligaHesperidesMatchesUrl) {
        return res.status(400).json({ message: "Liga Hesperides URL de partidos no configurada. Configúrala en la página de configuración." });
      }
      const allowedDomains = ['ligahesperides.mygol.es', 'ligahesperides.com'];
      const url = new URL(config.ligaHesperidesMatchesUrl);
      if (!allowedDomains.includes(url.hostname)) {
        return res.status(400).json({ message: "URL no permitida. Solo se permiten URLs de Liga Hesperides oficial." });
      }
      console.log(`📄 Attempting to fetch Liga Hesperides matches...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(config.ligaHesperidesMatchesUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      console.log(`📊 Downloaded ${html.length} characters from Liga Hesperides`);
      const hasMatchesData = html.includes('Jornada') || html.includes('SOBRADILLO') || html.includes('partido') || html.includes('match') || /AF[\.\s]*Sobradillo/i.test(html);
      if (!hasMatchesData) {
        throw new Error('🚧 Liga Hesperides es una Single Page Application (SPA) que requiere JavaScript para mostrar los partidos. La importación automática no funciona desde el servidor en este entorno limitado. \n\n📱 Solución móvil:\n1. Abre Liga Hesperides en tu móvil/tablet\n2. Espera a que carguen los partidos\n3. Usa "Importar desde Página Abierta"\n\n✅ Esta solución funciona perfectamente desde dispositivos móviles.');
      }
      console.log("✅ Found some matches data, attempting simplified extraction...");
      res.json({ success: true, message: "Liga Hesperides partidos detectado correctamente. Para importar datos reales, usa la solución móvil descrita en el error.", importedCount: 0, updatedCount: 0, skippedCount: 0, url: config.ligaHesperidesMatchesUrl, note: "La importación automática requiere un navegador completo. Usa el proceso manual desde móviles." });
    } catch (error) {
      console.error("Error importing matches from Liga Hesperides:", error);
      res.status(500).json({ message: "Error al importar partidos desde Liga Hesperides", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/liga-hesperides/import-standings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const config = await storage.getTeamConfig(orgId);
      if (!config?.ligaHesperidesStandingsUrl) {
        return res.status(400).json({ message: "Liga Hesperides URL de clasificación no configurada. Configúrala en la página de configuración." });
      }
      const allowedDomains = ['ligahesperides.mygol.es', 'ligahesperides.com'];
      const url = new URL(config.ligaHesperidesStandingsUrl);
      if (!allowedDomains.includes(url.hostname)) {
        return res.status(400).json({ message: "URL no permitida. Solo se permiten URLs de Liga Hesperides oficial." });
      }
      console.log(`📄 Attempting to fetch Liga Hesperides standings...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(config.ligaHesperidesStandingsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      console.log(`📊 Downloaded ${html.length} characters from Liga Hesperides`);
      const hasClassificationData = html.includes('Clasificaci') || html.includes('Puntos') || html.includes('table') || html.includes('standings') || /AF[\.\s]*Sobradillo/i.test(html);
      if (!hasClassificationData) {
        throw new Error('🚧 Liga Hesperides es una Single Page Application (SPA) que requiere JavaScript para mostrar los datos. La importación automática no funciona desde el servidor en este entorno limitado. \n\n📱 Solución móvil:\n1. Abre Liga Hesperides en tu móvil/tablet\n2. Espera a que carguen los datos\n3. Usa "Importar desde Página Abierta"\n\n✅ Esta solución funciona perfectamente desde dispositivos móviles.');
      }
      console.log("✅ Found some classification data, attempting extraction...");
      res.json({ success: true, message: "Liga Hesperides detectado correctamente. Para importar datos reales, usa la solución móvil descrita en el error.", importedTeams: 0, updatedTeams: 0, savedLogos: 0, url: config.ligaHesperidesStandingsUrl, note: "La importación automática requiere un navegador completo. Usa el proceso manual desde móviles." });
    } catch (error) {
      console.error("Error importing standings from Liga Hesperides:", error);
      res.status(500).json({ message: "Error al importar clasificación desde Liga Hesperides", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Screenshot import routes using Gemini AI
  app.post("/api/liga-hesperides/import-standings-screenshot", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { imageBase64, mimeType } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Se requiere una imagen" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      const prompt = `Analiza esta captura de pantalla de una tabla de clasificación de fútbol.
Extrae los datos de todos los equipos visibles en formato JSON.

Para cada equipo, extrae:
- teamName: nombre del equipo
- position: posición en la tabla (número)
- played: partidos jugados (PJ)
- won: partidos ganados (G)
- drawn: partidos empatados (E)
- lost: partidos perdidos (P)
- goalsFor: goles a favor (GF)
- goalsAgainst: goles en contra (GC)
- goalDifference: diferencia de goles (puede calcularse)
- points: puntos totales

Responde SOLO con un JSON válido en este formato exacto:
{
  "teams": [
    {
      "teamName": "Nombre del Equipo",
      "position": 1,
      "played": 8,
      "won": 6,
      "drawn": 1,
      "lost": 1,
      "goalsFor": 25,
      "goalsAgainst": 8,
      "goalDifference": 17,
      "points": 19
    }
  ]
}

Si no puedes extraer los datos, responde: {"error": "No se pudieron extraer los datos de la imagen"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || "image/png", data: imageBase64 } }
          ]
        }]
      });

      // Get text from response - try multiple access methods
      let responseText = "";
      if (response.text) {
        responseText = response.text;
      } else if (response.candidates && response.candidates.length > 0) {
        // Iterate all candidates and parts to collect full text
        for (const candidate of response.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                responseText += part.text;
              }
            }
          }
        }
      }
      console.log("Gemini response for standings:", responseText);

      // Extract JSON from response
      if (!responseText) {
        console.error("Gemini response (no text):", response);
        return res.status(400).json({ message: "No se obtuvo respuesta de la IA. Intenta con otra imagen." });
      }
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(400).json({ message: "No se pudo extraer JSON de la respuesta de IA", rawResponse: responseText.substring(0, 200) });
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (parsedData.error) {
        return res.status(400).json({ message: parsedData.error });
      }

      if (!parsedData.teams || !Array.isArray(parsedData.teams)) {
        return res.status(400).json({ message: "Formato de datos inválido" });
      }

      // Get team config to identify our team name
      const config = await storage.getTeamConfig(orgId);
      const ourTeamName = config?.teamName?.toLowerCase() || "";

      // Save standings to database and create opponents
      let imported = 0;
      let updated = 0;
      let opponentsCreated = 0;
      
      for (const team of parsedData.teams) {
        try {
          const existingStandings = await storage.getStandings(orgId);
          const existing = existingStandings.find((s: any) => 
            s.team?.toLowerCase() === team.teamName?.toLowerCase()
          );

          const standingData = {
            team: team.teamName,
            position: team.position || 0,
            matchesPlayed: team.played || 0,
            wins: team.won || 0,
            draws: team.drawn || 0,
            losses: team.lost || 0,
            goalsFor: team.goalsFor || 0,
            goalsAgainst: team.goalsAgainst || 0,
            goalDifference: team.goalDifference || (team.goalsFor - team.goalsAgainst) || 0,
            points: team.points || 0,
          };

          if (existing) {
            await storage.updateStanding(existing.id, standingData, orgId);
            updated++;
          } else {
            await storage.createStanding(standingData, orgId);
            imported++;
          }

          // Create opponent if this is not our team
          const teamNameLower = team.teamName?.toLowerCase() || "";
          if (teamNameLower && teamNameLower !== ourTeamName && !ourTeamName.includes(teamNameLower) && !teamNameLower.includes(ourTeamName)) {
            const existingOpponent = await storage.getOpponentByName(team.teamName, orgId);
            if (!existingOpponent) {
              await storage.createOpponent({ name: team.teamName }, orgId);
              opponentsCreated++;
            }
          }
        } catch (err) {
          console.error("Error saving standing:", err);
        }
      }

      res.json({ 
        success: true, 
        message: `Clasificación importada: ${imported} nuevos, ${updated} actualizados. ${opponentsCreated} contrincantes creados.`,
        importedTeams: imported,
        updatedTeams: updated,
        opponentsCreated: opponentsCreated,
        teams: parsedData.teams
      });
    } catch (error) {
      console.error("Error importing standings from screenshot:", error);
      res.status(500).json({ message: "Error al procesar la captura de pantalla", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/liga-hesperides/import-matches-screenshot", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { imageBase64, mimeType } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Se requiere una imagen" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      const prompt = `Analiza esta captura de pantalla de partidos de fútbol.
Extrae los datos de todos los partidos visibles en formato JSON.

Para cada partido, extrae:
- date: fecha del partido en formato YYYY-MM-DD
- time: hora del partido en formato HH:MM (si está disponible)
- homeTeam: nombre del equipo local
- awayTeam: nombre del equipo visitante
- homeScore: goles del equipo local (null si no se ha jugado)
- awayScore: goles del equipo visitante (null si no se ha jugado)
- venue: lugar/estadio (si está disponible)
- competition: nombre de la competición (si está visible)

Responde SOLO con un JSON válido en este formato exacto:
{
  "matches": [
    {
      "date": "2025-01-15",
      "time": "19:00",
      "homeTeam": "Equipo Local",
      "awayTeam": "Equipo Visitante",
      "homeScore": 2,
      "awayScore": 1,
      "venue": "Estadio Municipal",
      "competition": "Liga"
    }
  ]
}

Si no puedes extraer los datos, responde: {"error": "No se pudieron extraer los datos de la imagen"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || "image/png", data: imageBase64 } }
          ]
        }]
      });

      // Get text from response - try multiple access methods
      let responseText = "";
      if (response.text) {
        responseText = response.text;
      } else if (response.candidates && response.candidates.length > 0) {
        // Iterate all candidates and parts to collect full text
        for (const candidate of response.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                responseText += part.text;
              }
            }
          }
        }
      }
      console.log("Gemini response for matches:", responseText);

      // Extract JSON from response
      if (!responseText) {
        console.error("Gemini response (no text):", response);
        return res.status(400).json({ message: "No se obtuvo respuesta de la IA. Intenta con otra imagen." });
      }
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(400).json({ message: "No se pudo extraer JSON de la respuesta de IA", rawResponse: responseText.substring(0, 200) });
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (parsedData.error) {
        return res.status(400).json({ message: parsedData.error });
      }

      if (!parsedData.matches || !Array.isArray(parsedData.matches)) {
        return res.status(400).json({ message: "Formato de datos inválido" });
      }

      // Get team config to identify our team
      const config = await storage.getTeamConfig(orgId);
      const teamName = config?.teamName || "";

      let imported = 0;
      let skipped = 0;

      for (const match of parsedData.matches) {
        try {
          // Determine if we're home or away
          const teamNameLower = teamName.toLowerCase();
          const homeTeamLower = match.homeTeam?.toLowerCase() || "";
          const awayTeamLower = match.awayTeam?.toLowerCase() || "";
          
          const isHomeGame = homeTeamLower.includes(teamNameLower) || teamNameLower.includes(homeTeamLower);
          const opponentName = isHomeGame ? match.awayTeam : match.homeTeam;

          // Check for or create opponent
          let opponent = await storage.getOpponentByName(opponentName, orgId);
          if (!opponent && opponentName) {
            opponent = await storage.createOpponent({ name: opponentName }, orgId);
          }

          // Build date with time
          let matchDate: Date;
          const dateStr = match.date || new Date().toISOString().split('T')[0];
          const timeStr = match.time || "12:00";
          try {
            matchDate = new Date(`${dateStr}T${timeStr}:00`);
            if (isNaN(matchDate.getTime())) {
              matchDate = new Date(dateStr);
            }
          } catch {
            matchDate = new Date();
          }

          // Calculate scores based on home/away
          let ourScore = null;
          let opponentScore = null;
          if (match.homeScore !== null && match.awayScore !== null) {
            ourScore = isHomeGame ? match.homeScore : match.awayScore;
            opponentScore = isHomeGame ? match.awayScore : match.homeScore;
          }

          // Create match with correct field names
          const matchData = {
            date: matchDate,
            opponent: opponentName || "Rival",
            venue: match.venue || "Por definir",
            competition: match.competition || "Liga",
            ourScore: ourScore,
            opponentScore: opponentScore,
            status: (ourScore !== null) ? "played" : "scheduled",
            isHomeGame: isHomeGame,
            opponentId: opponent?.id || null,
          };

          console.log("Creating match:", matchData);
          await storage.createMatch(matchData as any, orgId);
          imported++;
        } catch (err) {
          console.error("Error saving match:", err);
          skipped++;
        }
      }

      res.json({ 
        success: true, 
        message: `Partidos importados: ${imported} nuevos, ${skipped} omitidos`,
        importedCount: imported,
        skippedCount: skipped,
        matches: parsedData.matches
      });
    } catch (error) {
      console.error("Error importing matches from screenshot:", error);
      res.status(500).json({ message: "Error al procesar la captura de pantalla", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Import logos from screenshot using AI
  app.post("/api/liga-hesperides/import-logos-screenshot", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { imageBase64, mimeType } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Se requiere una imagen" });
      }

      const { GoogleGenAI, Modality } = await import("@google/genai");
      
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      // Step 1: Analyze the screenshot to identify teams and describe their logos
      const analysisPrompt = `Analiza esta captura de pantalla de fútbol.
Identifica TODOS los equipos visibles y describe sus escudos/logos en detalle.

Para cada equipo, proporciona:
- teamName: nombre exacto del equipo como aparece en la imagen
- logoDescription: descripción detallada del escudo (colores, símbolos, forma, texto, elementos visuales)

Responde SOLO con un JSON válido en este formato:
{
  "teams": [
    {
      "teamName": "Nombre del Equipo",
      "logoDescription": "Escudo circular con fondo rojo, un águila dorada en el centro, borde blanco con el nombre del equipo"
    }
  ]
}

Si no puedes identificar los equipos o escudos, responde: {"error": "No se pudieron identificar los escudos"}`;

      const analysisResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: analysisPrompt },
            { inlineData: { mimeType: mimeType || "image/png", data: imageBase64 } }
          ]
        }]
      });

      // Get text from response
      let responseText = "";
      if (analysisResponse.text) {
        responseText = analysisResponse.text;
      } else if (analysisResponse.candidates && analysisResponse.candidates.length > 0) {
        for (const candidate of analysisResponse.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                responseText += part.text;
              }
            }
          }
        }
      }

      console.log("Logo analysis response:", responseText);

      if (!responseText) {
        return res.status(400).json({ message: "No se obtuvo respuesta de la IA" });
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(400).json({ message: "No se pudo extraer JSON de la respuesta" });
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (parsedData.error) {
        return res.status(400).json({ message: parsedData.error });
      }

      if (!parsedData.teams || !Array.isArray(parsedData.teams)) {
        return res.status(400).json({ message: "Formato de datos inválido" });
      }

      // Get team config to identify our team
      const config = await storage.getTeamConfig(orgId);
      const ourTeamName = config?.teamName?.toLowerCase() || "";

      let logosGenerated = 0;
      let skipped = 0;
      const results: Array<{ team: string; logoUrl: string | null; status: string }> = [];

      // Step 2: For each team (except ours), generate a logo and save it
      for (const team of parsedData.teams) {
        try {
          const teamNameLower = team.teamName?.toLowerCase() || "";
          
          // Skip our own team
          if (ourTeamName && (teamNameLower.includes(ourTeamName) || ourTeamName.includes(teamNameLower))) {
            results.push({ team: team.teamName, logoUrl: null, status: "skipped (own team)" });
            continue;
          }

          // Check if opponent exists
          const opponent = await storage.getOpponentByName(team.teamName, orgId);
          if (!opponent) {
            results.push({ team: team.teamName, logoUrl: null, status: "opponent not found" });
            skipped++;
            continue;
          }

          // Skip if opponent already has a logo
          if (opponent.logoUrl) {
            results.push({ team: team.teamName, logoUrl: opponent.logoUrl, status: "already has logo" });
            continue;
          }

          // Generate logo using AI
          const generatePrompt = `Genera un escudo de fútbol profesional para el equipo "${team.teamName}".
Descripción del escudo original: ${team.logoDescription}

Requisitos:
- Diseño de escudo de fútbol estilo profesional
- Incluir el nombre del equipo o sus iniciales
- Colores basados en la descripción
- Fondo transparente o sólido
- Estilo vectorial limpio
- Dimensiones cuadradas`;

          const imageResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ role: "user", parts: [{ text: generatePrompt }] }],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          const candidate = imageResponse.candidates?.[0];
          const imagePart = candidate?.content?.parts?.find(
            (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
          );

          if (!imagePart?.inlineData?.data) {
            results.push({ team: team.teamName, logoUrl: null, status: "failed to generate image" });
            skipped++;
            continue;
          }

          // Try to upload to object storage, fall back to data URL if it fails
          let logoUrl: string;
          const mimeType = imagePart.inlineData.mimeType || "image/png";
          
          try {
            const { uploadBase64Image, isStorageConfigured } = await import("./replit_integrations/object_storage");
            
            if (isStorageConfigured()) {
              const fileName = `${team.teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.png`;
              logoUrl = await uploadBase64Image(imagePart.inlineData.data, fileName, mimeType);
            } else {
              logoUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
            }
          } catch (uploadError) {
            console.warn("Object storage upload failed, using data URL:", uploadError);
            logoUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
          }

          // Update opponent with logo URL
          await storage.updateOpponent(opponent.id, { logoUrl }, orgId);
          
          results.push({ team: team.teamName, logoUrl, status: "success" });
          logosGenerated++;
        } catch (err) {
          console.error(`Error generating logo for ${team.teamName}:`, err);
          results.push({ team: team.teamName, logoUrl: null, status: "error" });
          skipped++;
        }
      }

      res.json({ 
        success: true, 
        message: `Escudos generados: ${logosGenerated}, omitidos: ${skipped}`,
        logosGenerated,
        skipped,
        results
      });
    } catch (error) {
      console.error("Error importing logos from screenshot:", error);
      res.status(500).json({ message: "Error al procesar la captura de pantalla", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Import players from screenshot using Gemini AI
  app.post("/api/liga-hesperides/import-players-screenshot", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { imageBase64, mimeType } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Se requiere una imagen" });
      }

      // Get image dimensions using Sharp for bounding box calculations
      const sharp = (await import("sharp")).default;
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const imageMetadata = await sharp(imageBuffer).metadata();
      const imageWidth = imageMetadata.width || 1000;
      const imageHeight = imageMetadata.height || 1000;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      const prompt = `Analiza esta captura de pantalla de una lista de jugadores de fútbol.
Extrae los datos de todos los jugadores visibles en formato JSON.

Para cada jugador, extrae:
- name: nombre completo del jugador
- jerseyNumber: número de camiseta (número, puede ser null si no aparece)
- position: posición del jugador (Portero, Defensa, Centrocampista, Delantero, o abreviaciones como PT, DEF, MC, DEL)
- photoRegion: coordenadas del bounding box de la foto del jugador (si es visible)
  - x: coordenada X del borde izquierdo (0.0 a 1.0 relativo al ancho de la imagen)
  - y: coordenada Y del borde superior (0.0 a 1.0 relativo al alto de la imagen)
  - width: ancho del bounding box (0.0 a 1.0 relativo al ancho de la imagen)
  - height: alto del bounding box (0.0 a 1.0 relativo al alto de la imagen)

Normaliza las posiciones a estas opciones:
- "Portero" o "PT" → "Portero"
- "Defensa" o "DEF" → "Defensa"  
- "Centrocampista" o "MC" o "MED" → "Mediocampista"
- "Delantero" o "DEL" → "Delantero"

Responde SOLO con un JSON válido en este formato exacto:
{
  "players": [
    {
      "name": "Nombre del Jugador",
      "jerseyNumber": 10,
      "position": "Mediocampista",
      "photoRegion": {
        "x": 0.05,
        "y": 0.1,
        "width": 0.15,
        "height": 0.12
      }
    }
  ]
}

Si un jugador no tiene foto visible, omite el campo photoRegion para ese jugador.
Si no puedes extraer los datos, responde: {"error": "No se pudieron extraer los datos de la imagen"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || "image/png", data: imageBase64 } }
          ]
        }]
      });

      // Get text from response - try multiple access methods
      let responseText = "";
      if (response.text) {
        responseText = response.text;
      } else if (response.candidates && response.candidates.length > 0) {
        for (const candidate of response.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                responseText += part.text;
              }
            }
          }
        }
      }
      console.log("Gemini response for players:", responseText);

      if (!responseText) {
        console.error("Gemini response (no text):", response);
        return res.status(400).json({ message: "No se obtuvo respuesta de la IA. Intenta con otra imagen." });
      }
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(400).json({ message: "No se pudo extraer JSON de la respuesta de IA", rawResponse: responseText.substring(0, 200) });
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (parsedData.error) {
        return res.status(400).json({ message: parsedData.error });
      }

      if (!parsedData.players || !Array.isArray(parsedData.players)) {
        return res.status(400).json({ message: "Formato de datos inválido" });
      }

      // Get existing players to avoid duplicates
      const existingPlayers = await storage.getPlayers(orgId);
      const existingPlayerKeys = new Set(
        existingPlayers.map(p => `${p.name.toLowerCase().trim()}_${p.jerseyNumber || ''}`)
      );

      let imported = 0;
      let skipped = 0;
      const results: { name: string; status: string }[] = [];

      for (const player of parsedData.players) {
        try {
          const playerName = player.name?.trim();
          if (!playerName) {
            skipped++;
            continue;
          }

          // Coerce jerseyNumber to number or null
          let jerseyNumber: number | null = null;
          if (player.jerseyNumber !== null && player.jerseyNumber !== undefined) {
            const parsed = parseInt(String(player.jerseyNumber), 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
              jerseyNumber = parsed;
            }
          }

          // Check for duplicate by name + jersey number combination
          const playerKey = `${playerName.toLowerCase()}_${jerseyNumber || ''}`;
          if (existingPlayerKeys.has(playerKey)) {
            results.push({ name: playerName, status: "ya existe" });
            skipped++;
            continue;
          }

          // Normalize position to canonical values used by the UI filter
          // Canonical values: Portero, Defensa, Mediocampista, Delantero
          let position: string | null = null;
          const posRaw = player.position || "";
          const posLower = posRaw.toLowerCase().trim();
          
          if (posLower.includes("porter") || posLower === "pt" || posLower === "gk") {
            position = "Portero";
          } else if (posLower.includes("defens") || posLower === "def" || posLower === "df" || posLower === "lateral") {
            position = "Defensa";
          } else if (
            posLower.includes("centrocampist") || 
            posLower.includes("mediocampist") ||
            posLower.includes("medio") ||
            posLower === "mc" || 
            posLower === "med" ||
            posLower === "mf" ||
            posLower === "interior" ||
            posLower === "pivote"
          ) {
            position = "Mediocampista";
          } else if (
            posLower.includes("delanter") || 
            posLower === "del" || 
            posLower === "fw" || 
            posLower === "st" ||
            posLower === "extremo" ||
            posLower === "punta"
          ) {
            position = "Delantero";
          }
          
          // Skip players with unrecognized positions to maintain data integrity
          if (!position) {
            results.push({ name: playerName, status: `posición no reconocida: ${posRaw || 'vacía'}` });
            skipped++;
            continue;
          }

          // Process photo if region is provided
          let profileImageUrl: string | undefined = undefined;
          
          if (player.photoRegion && 
              typeof player.photoRegion.x === 'number' && 
              typeof player.photoRegion.y === 'number' &&
              typeof player.photoRegion.width === 'number' &&
              typeof player.photoRegion.height === 'number') {
            try {
              // Convert normalized coordinates to pixel values
              const cropX = Math.round(player.photoRegion.x * imageWidth);
              const cropY = Math.round(player.photoRegion.y * imageHeight);
              const cropWidth = Math.round(player.photoRegion.width * imageWidth);
              const cropHeight = Math.round(player.photoRegion.height * imageHeight);

              // Validate crop dimensions
              if (cropWidth > 10 && cropHeight > 10 && 
                  cropX >= 0 && cropY >= 0 &&
                  cropX + cropWidth <= imageWidth && 
                  cropY + cropHeight <= imageHeight) {
                
                // Crop the player photo from the screenshot
                const croppedBuffer = await sharp(imageBuffer)
                  .extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight })
                  .resize(200, 200, { fit: 'cover' })
                  .png()
                  .toBuffer();

                // Try to upload to object storage
                try {
                  const { uploadBuffer, isStorageConfigured } = await import("./replit_integrations/object_storage");
                  
                  if (isStorageConfigured()) {
                    const fileName = `player_${playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.png`;
                    profileImageUrl = await uploadBuffer(croppedBuffer, fileName, "image/png");
                  } else {
                    // Fallback to data URL if object storage not configured
                    profileImageUrl = `data:image/png;base64,${croppedBuffer.toString('base64')}`;
                  }
                } catch (uploadError) {
                  console.warn("Object storage upload failed, using data URL:", uploadError);
                  profileImageUrl = `data:image/png;base64,${croppedBuffer.toString('base64')}`;
                }
              }
            } catch (cropError) {
              console.warn(`Failed to crop photo for ${playerName}:`, cropError);
              // Continue without photo - not a critical error
            }
          }

          // Build player data object
          const playerData: Record<string, any> = {
            name: playerName,
            jerseyNumber: jerseyNumber,
            position: position,
            isActive: true,
          };
          
          if (profileImageUrl) {
            playerData.profileImageUrl = profileImageUrl;
          }

          // Validate with schema before inserting
          const validationResult = insertPlayerSchema.safeParse(playerData);
          if (!validationResult.success) {
            console.error(`Schema validation failed for ${playerName}:`, validationResult.error);
            results.push({ name: playerName, status: "datos inválidos" });
            skipped++;
            continue;
          }

          await storage.createPlayer(validationResult.data, orgId);

          existingPlayerKeys.add(playerKey);
          results.push({ name: playerName, status: "importado" });
          imported++;
        } catch (err) {
          console.error(`Error importing player ${player.name}:`, err);
          results.push({ name: player.name || "unknown", status: "error" });
          skipped++;
        }
      }

      res.json({ 
        success: true, 
        message: `Jugadores importados: ${imported}, omitidos: ${skipped}`,
        imported,
        skipped,
        results
      });
    } catch (error) {
      console.error("Error importing players from screenshot:", error);
      res.status(500).json({ message: "Error al procesar la captura de pantalla", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Opponents routes
  app.get("/api/opponents", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const opponentsList = await storage.getOpponents(orgId);
      res.json(opponentsList);
    } catch (error) {
      console.error("Error fetching opponents:", error);
      res.status(500).json({ message: "Failed to fetch opponents" });
    }
  });

  app.post("/api/opponents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const validatedData = insertOpponentSchema.parse(req.body);
      const newOpponent = await storage.createOpponent(validatedData, orgId);
      res.status(201).json(newOpponent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating opponent:", error);
      res.status(500).json({ message: "Failed to create opponent" });
    }
  });

  app.patch("/api/opponents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const validatedData = insertOpponentSchema.partial().parse(req.body);
      const updatedOpponent = await storage.updateOpponent(id, validatedData, orgId);
      res.json(updatedOpponent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating opponent:", error);
      res.status(500).json({ message: "Failed to update opponent" });
    }
  });

  app.delete("/api/opponents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      await storage.deleteOpponent(id, orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opponent:", error);
      res.status(500).json({ message: "Failed to delete opponent" });
    }
  });

  // Standings routes
  app.get("/api/standings", isAuthenticated, async (req, res) => {
    try {
      const orgId = getOrgId(req);
      const standingsList = await storage.getStandings(orgId);
      if (standingsList.length === 0) {
        const sampleStandings = [
          { position: 1, team: "AF. Sobradillo", matchesPlayed: 10, wins: 8, draws: 1, losses: 1, goalsFor: 25, goalsAgainst: 8, goalDifference: 17, points: 25 },
          { position: 2, team: "Real Sociedad B", matchesPlayed: 10, wins: 7, draws: 2, losses: 1, goalsFor: 22, goalsAgainst: 10, goalDifference: 12, points: 23 },
          { position: 3, team: "Athletic Club B", matchesPlayed: 10, wins: 6, draws: 3, losses: 1, goalsFor: 18, goalsAgainst: 9, goalDifference: 9, points: 21 }
        ];
        res.json(sampleStandings);
      } else {
        res.json(standingsList);
      }
    } catch (error) {
      console.error("Error fetching standings:", error);
      res.status(500).json({ message: "Failed to fetch standings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
