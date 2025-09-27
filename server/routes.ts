import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, loginUser, registerUser } from "./auth";
import { 
  insertPlayerSchema,
  insertMatchSchema,
  insertMonthlyPaymentSchema,
  insertChampionshipPaymentSchema,
  insertTeamConfigSchema,
  insertOtherPaymentSchema,
  insertMatchAttendanceSchema,
  loginSchema,
  registerSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const user = await loginUser(req.body);
      req.session.userId = user.id;
      
      // Don't send password in response
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
      
      // Don't send password in response
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

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Admin-only endpoint to create users manually
  app.post('/api/auth/register-admin', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = req.body;
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

  // Admin-only endpoint to create users for existing players
  app.post('/api/admin/create-users-for-players', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied - Admin required" });
      }

      console.log(`🔧 Admin ${currentUser.username || currentUser.id} initiating user creation for existing players...`);
      
      await storage.createUsersForAllExistingPlayers();
      
      res.json({ 
        success: true, 
        message: "Users created successfully for all existing players"
      });
    } catch (error) {
      console.error("Error creating users for existing players:", error);
      res.status(500).json({ message: "Failed to create users for existing players" });
    }
  });

  // Emergency endpoint to create/reset admin user (DEVELOPMENT ONLY)
  app.post('/api/emergency/reset-admin', async (req, res) => {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: "Emergency endpoint only available in development" });
    }
    try {
      console.log('🚨 EMERGENCY: Creating/resetting admin user...');
      
      // Check if admin exists
      const existingAdmin = await storage.getUserByEmail('admin@sobrado.com');
      
      if (existingAdmin) {
        // Update existing admin password
        await storage.updateUser(existingAdmin.id, {
          password: await bcrypt.hash('password', 10),
          username: 'admin',
          role: 'admin',
          isActive: true
        });
        console.log('✅ Admin password reset to: password');
        res.json({ 
          success: true, 
          message: 'Admin password reset successfully',
          username: 'admin',
          email: 'admin@sobrado.com',
          password: 'password'
        });
      } else {
        // Create new admin user
        const adminUser = await storage.createUser({
          username: 'admin',
          email: 'admin@sobrado.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Admin',
          lastName: 'System',
          role: 'admin',
          isActive: true
        });
        console.log('✅ Admin user created with password: password');
        res.json({ 
          success: true, 
          message: 'Admin user created successfully',
          username: 'admin',
          email: 'admin@sobrado.com', 
          password: 'password'
        });
      }
    } catch (error) {
      console.error('❌ Error in emergency admin reset:', error);
      res.status(500).json({ message: "Failed to reset admin user" });
    }
  });

  // Change password endpoint
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


  // Serve placeholder profile image
  app.get('/api/placeholder-profile-image/:userId', (req, res) => {
    const userId = req.params.userId;
    // Create a unique color based on user ID
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const colorIndex = userId.length % colors.length;
    const color = colors[colorIndex];
    
    // Return a simple SVG placeholder with user initials if available
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
      // req.user is already populated by isAuthenticated middleware  
      const user = req.user!;
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Player routes
  app.get("/api/players", isAuthenticated, async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", isAuthenticated, async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  // Get player by user ID
  app.get("/api/players/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const player = await storage.getPlayerByUserId(userId);
      
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
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
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
      console.log(`Updating player ${req.params.id} with data:`, req.body);
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      
      // Get current player to find associated user
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Update player data
      const player = await storage.updatePlayer(req.params.id, validatedData);
      
      // If name is being updated, sync it to the user profile too
      if (validatedData.name && currentPlayer.email) {
        const user = await storage.getUserByEmail(currentPlayer.email);
        if (user) {
          const nameParts = validatedData.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          await storage.updateUser(user.id, {
            firstName,
            lastName
          });
          
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
      await storage.deletePlayer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // NUCLEAR OPTION - DELETE ALL OSCAR MARTÍN
  app.post("/api/players/nuke-oscar", async (req, res) => {
    try {
      console.log(`💥 NUCLEAR CLEANUP INITIATED`);
      
      const allPlayers = await storage.getPlayers();
      const oscarCount = allPlayers.filter(p => p.name === "Oscar Martín").length;
      console.log(`Found ${oscarCount} Oscar Martín players - DELETING ALL`);
      
      let deleted = 0;
      for (const player of allPlayers) {
        if (player.name === "Oscar Martín") {
          await storage.deletePlayer(player.id);
          deleted++;
          console.log(`💀 NUKED: ${player.id} - ${player.name} - Jersey: ${player.jerseyNumber}`);
        }
      }
      
      const remaining = await storage.getPlayers();
      const oscarRemaining = remaining.filter(p => p.name === "Oscar Martín").length;
      
      console.log(`✅ NUCLEAR CLEANUP COMPLETE:`);
      console.log(`   - Deleted: ${deleted} Oscar Martín players`);
      console.log(`   - Remaining Oscar Martín: ${oscarRemaining}`);
      console.log(`   - Total players left: ${remaining.length}`);
      
      res.json({ 
        message: `NUCLEAR CLEANUP: Deleted ${deleted} Oscar Martín players`,
        deleted,
        oscarRemaining,
        totalRemaining: remaining.length
      });
    } catch (error) {
      console.error("❌ NUCLEAR CLEANUP ERROR:", error);
      res.status(500).json({ message: "Nuclear cleanup failed" });
    }
  });

  // Clean duplicate players for user
  app.post("/api/players/cleanup/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.user as any;
      
      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find all players with same name
      const allPlayers = await storage.getPlayers();
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const duplicates = allPlayers.filter(p => p.name === userFullName);
      
      if (duplicates.length > 1) {
        // Keep the most recent one, delete the rest
        const sorted = duplicates.sort((a, b) => new Date(b.updatedAt || b.createdAt || Date.now()).getTime() - new Date(a.updatedAt || a.createdAt || Date.now()).getTime());
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        
        for (const player of toDelete) {
          await storage.deletePlayer(player.id);
          console.log(`Deleted duplicate player: ${player.id}`);
        }
        
        res.json({ 
          message: `Cleaned up ${toDelete.length} duplicate players`, 
          keptPlayer: toKeep,
          deletedCount: toDelete.length 
        });
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
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
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
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      
      // Auto-convocate all players (create pending attendances)
      try {
        const players = await storage.getPlayers();
        const attendancePromises = players.map(player => 
          storage.createOrUpdateAttendance({
            matchId: match.id,
            userId: player.id, // Use player ID as user ID
            status: "pending"
          })
        );
        await Promise.all(attendancePromises);
        console.log(`Auto-convocated ${players.length} players for match ${match.id}`);
      } catch (error) {
        console.warn('Failed to auto-convocate players:', error);
        // Don't fail match creation if convocation fails
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
      const validatedData = insertMatchSchema.partial().parse(req.body);
      const match = await storage.updateMatch(req.params.id, validatedData);
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
      await storage.deleteMatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting match:", error);
      res.status(500).json({ message: "Failed to delete match" });
    }
  });

  // Monthly payments routes
  app.get("/api/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getMonthlyPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching monthly payments:", error);
      res.status(500).json({ message: "Failed to fetch monthly payments" });
    }
  });

  app.get("/api/players/:playerId/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPlayerMonthlyPayments(req.params.playerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching player monthly payments:", error);
      res.status(500).json({ message: "Failed to fetch player monthly payments" });
    }
  });

  // Get monthly payments for specific player
  app.get("/api/monthly-payments/player/:playerId", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPlayerMonthlyPayments(req.params.playerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching monthly payments for player:", error);
      res.status(500).json({ message: "Failed to fetch monthly payments for player" });
    }
  });

  app.post("/api/monthly-payments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMonthlyPaymentSchema.parse(req.body);
      const payment = await storage.createMonthlyPayment(validatedData);
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
      const validatedData = insertMonthlyPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateMonthlyPayment(req.params.id, validatedData);
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
      await storage.deleteMonthlyPayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting monthly payment:", error);
      res.status(500).json({ message: "Failed to delete monthly payment" });
    }
  });

  app.post("/api/monthly-payments/create-current-month", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get current date and month using local components to avoid timezone issues
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const currentMonth = `${year}-${String(month).padStart(2, '0')}`; // YYYY-MM format
      
      // Get all active players
      const players = await storage.getPlayers();
      const activePlayers = players.filter(player => player.isActive);
      
      // Get team configuration
      const teamConfig = await storage.getTeamConfig();
      const monthlyFee = teamConfig?.monthlyFee || 15.00;
      const paymentDueDay = teamConfig?.paymentDueDay || 15;
      
      // Calculate due date for current month, safely handling month boundaries
      const daysInMonth = new Date(year, month, 0).getDate(); // Get last day of current month
      const safeDay = Math.min(paymentDueDay, daysInMonth); // Clamp to valid day
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
      
      // Get existing payments for current month
      const existingPayments = await storage.getMonthlyPayments();
      const existingPlayerIds = new Set(
        existingPayments
          .filter(payment => payment.month === currentMonth)
          .map(payment => payment.playerId)
      );
      
      // Create payments for players who don't have one for this month
      const paymentsToCreate = activePlayers.filter(player => !existingPlayerIds.has(player.id));
      
      let createdCount = 0;
      for (const player of paymentsToCreate) {
        await storage.createMonthlyPayment({
          playerId: player.id,
          month: currentMonth,
          amount: monthlyFee.toString(),
          dueDate: dueDate,
          status: "pending",
          paymentMethod: "",
          notes: `Pago automático generado para ${currentMonth}`,
        });
        createdCount++;
      }
      
      res.json({ 
        count: createdCount, 
        month: currentMonth,
        totalPlayers: activePlayers.length,
        existingPayments: existingPlayerIds.size
      });
    } catch (error) {
      console.error("Error creating current month payments:", error);
      res.status(500).json({ message: "Failed to create current month payments" });
    }
  });

  // Championship payments routes
  app.get("/api/championship-payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getChampionshipPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching championship payments:", error);
      res.status(500).json({ message: "Failed to fetch championship payments" });
    }
  });

  app.post("/api/championship-payments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertChampionshipPaymentSchema.parse(req.body);
      const payment = await storage.createChampionshipPayment(validatedData);
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
      const validatedData = insertChampionshipPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateChampionshipPayment(req.params.id, validatedData);
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
      await storage.deleteChampionshipPayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting championship payment:", error);
      res.status(500).json({ message: "Failed to delete championship payment" });
    }
  });

  // Team configuration routes
  app.get("/api/team-config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getTeamConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching team config:", error);
      res.status(500).json({ message: "Failed to fetch team configuration" });
    }
  });

  app.post("/api/team-config", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamConfigSchema.parse(req.body);
      const config = await storage.updateTeamConfig(validatedData);
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
      
      // Return all users for admin
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const userId = req.params.id;
      
      // Users can only update their own profile (unless admin)
      if (currentUser.role !== "admin" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Sync changes back to player data if name was updated
      if (req.body.firstName || req.body.lastName) {
        const player = await storage.getPlayerByUserId(userId);
        if (player) {
          const fullName = `${req.body.firstName || updatedUser.firstName || ''} ${req.body.lastName || updatedUser.lastName || ''}`.trim();
          if (fullName && fullName !== player.name) {
            await storage.updatePlayer(player.id, { name: fullName });
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
      const payments = await storage.getOtherPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching other payments:", error);
      res.status(500).json({ message: "Failed to fetch other payments" });
    }
  });

  // Team configuration routes
  app.get("/api/team-config", async (req, res) => {
    try {
      const config = await storage.getTeamConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching team config:", error);
      res.status(500).json({ message: "Failed to fetch team configuration" });
    }
  });

  // Match attendance routes
  app.get("/api/matches/:matchId/attendances", isAuthenticated, async (req, res) => {
    try {
      const attendances = await storage.getMatchAttendances(req.params.matchId);
      res.json(attendances);
    } catch (error) {
      console.error("Error fetching match attendances:", error);
      res.status(500).json({ message: "Failed to fetch attendances" });
    }
  });

  app.get("/api/attendances/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const attendances = await storage.getUserAttendances(req.params.userId);
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
      
      console.log('User ID:', userId);
      console.log('Request body:', req.body);
      
      // Find the player associated with this user
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        console.log('No player found for user:', userId);
        return res.status(404).json({ message: "Player profile not found for this user" });
      }
      
      console.log('Player found:', player.id);
      
      const attendanceData = {
        matchId: req.body.matchId,
        status: req.body.status,
        userId: player.id
      };
      
      console.log('Creating attendance with data:', attendanceData);
      
      const attendance = await storage.createOrUpdateAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/attendances/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMatchAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, validatedData);
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Admin endpoint to change any player's attendance
  app.post("/api/admin/attendances", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      
      // Verificar que es admin - usar el rol del usuario directamente
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { matchId, playerId, status } = req.body;
      
      if (!matchId || !playerId || !status) {
        return res.status(400).json({ 
          message: "matchId, playerId, and status are required" 
        });
      }

      if (!['confirmed', 'absent', 'pending'].includes(status)) {
        return res.status(400).json({ 
          message: "Status must be 'confirmed', 'absent', or 'pending'" 
        });
      }

      console.log('Admin updating attendance:', { matchId, playerId, status });
      
      const attendanceData = {
        matchId,
        status,
        userId: playerId // playerId is actually the userId in our system
      };
      
      const attendance = await storage.createOrUpdateAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error updating attendance (admin):", error);
      res.status(500).json({ 
        message: "Failed to update attendance", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/other-payments/:id", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.getOtherPayment(req.params.id);
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
      const validatedData = insertOtherPaymentSchema.parse(req.body);
      const payment = await storage.createOtherPayment(validatedData);
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
      const validatedData = insertOtherPaymentSchema.partial().parse(req.body);
      const payment = await storage.updateOtherPayment(req.params.id, validatedData);
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
      await storage.deleteOtherPayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting other payment:", error);
      res.status(500).json({ message: "Failed to delete other payment" });
    }
  });

  // Object storage routes
  const { ObjectStorageService } = await import("./objectStorage");
  
  // Endpoint for getting upload URL
  app.post("/api/upload/url", isAuthenticated, async (req, res) => {
    try {
      const { fileName, contentType, purpose } = req.body;
      
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "fileName and contentType are required" });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL(fileName, contentType, purpose);
      
      res.json({ 
        uploadURL: result.uploadURL,
        objectPath: result.objectPath,
        publicURL: result.objectPath
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint for serving uploaded objects
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


  // Liga Hesperides integration routes - server-side scraping
  app.post("/api/liga-hesperides/import-matches", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get team configuration to retrieve Liga Hesperides URLs
      const teamConfig = await storage.getTeamConfig();
      if (!teamConfig?.ligaHesperidesMatchesUrl) {
        return res.status(400).json({ 
          message: "Liga Hesperides URL de partidos no configurada. Configúrala en la página de configuración." 
        });
      }

      // Security: Validate URL to prevent SSRF attacks
      const allowedDomains = ['ligahesperides.mygol.es', 'ligahesperides.com'];
      const url = new URL(teamConfig.ligaHesperidesMatchesUrl);
      if (!allowedDomains.includes(url.hostname)) {
        return res.status(400).json({
          message: "URL no permitida. Solo se permiten URLs de Liga Hesperides oficial."
        });
      }

      // Fetch matches data directly from Liga Hesperides server
      console.log(`🔍 Fetching matches from: ${teamConfig.ligaHesperidesMatchesUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(teamConfig.ligaHesperidesMatchesUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`📄 Fetched ${html.length} characters of Liga Hesperides data`);
      
      // Enhanced HTML parsing to extract actual match data
      console.log("🔍 Starting match extraction from Liga Hesperides...");
      
      // Liga Hesperides specific extraction function  
      const extractMatchesFromLigaHesperides = (html: string) => {
        const matches: any[] = [];
        
        console.log('⚽ Extracting matches from Liga Hesperides...');
        console.log(`📄 HTML content length: ${html.length} chars`);
        
        // Find all "Jornada X" sections
        const jornadaSectionRegex = /###\s*Jornada\s*(\d+)([\s\S]*?)(?=###|$)/gi;
        let jornadaMatch;
        
        while ((jornadaMatch = jornadaSectionRegex.exec(html)) !== null) {
          const [, jornadaNumber, jornadaContent] = jornadaMatch;
          
          console.log(`📅 Processing Jornada ${jornadaNumber}`);
          
          // Extract match rows from this jornada using the exact Liga Hesperides format:
          // | [27/09/2025 16:30](link) | [EUROPA SANTA CRUZ](link) | ![](logo) | Status | ![](logo) | [AF. SOBRADILLO](link) | @ Location | |
          const matchRowRegex = /\|\s*\[([^\]]+)\][^|]*\|\s*\[([^\]]+)\][^|]*\|\s*[^|]*\|\s*([^|]+)\s*\|\s*[^|]*\|\s*\[([^\]]+)\][^|]*\|\s*([^|]*)\s*\|\s*[^|]*\|/g;
          
          let matchRowMatch;
          while ((matchRowMatch = matchRowRegex.exec(jornadaContent)) !== null) {
            const [, dateTimeStr, homeTeam, statusStr, awayTeam, locationStr] = matchRowMatch;
            
            // Only process matches involving AF. SOBRADILLO
            if (!/AF\.\s*SOBRADILLO|SOBRADILLO/i.test(`${homeTeam} ${awayTeam}`)) {
              continue;
            }
            
            console.log(`⚽ Found AF. SOBRADILLO match: ${homeTeam?.trim()} vs ${awayTeam?.trim()}`);
            
            // Extract match details
            const cleanHomeTeam = homeTeam?.trim();
            const cleanAwayTeam = awayTeam?.trim();  
            const status = statusStr?.trim();
            const location = locationStr?.replace(/^@\s*/, '').trim();
            
            // Determine opponent and home/away status
            let opponent;
            let isHome;
            
            if (/AF\.\s*SOBRADILLO|SOBRADILLO/i.test(cleanHomeTeam)) {
              opponent = cleanAwayTeam;
              isHome = true;
            } else {
              opponent = cleanHomeTeam;
              isHome = false;
            }
            
            // Parse date from format: "27/09/2025 16:30"
            let matchDate = null;
            let matchTime = null;
            
            const dateTimeMatch = dateTimeStr?.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*(\d{1,2}:\d{2})?/);
            if (dateTimeMatch) {
              const [, dateStr, timeStr] = dateTimeMatch;
              const [day, month, year] = dateStr.split('/');
              matchTime = timeStr || '00:00';
              
              try {
                matchDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${matchTime}:00`);
              } catch (error) {
                console.warn(`⚠️  Error parsing date: ${dateTimeStr}`);
                continue;
              }
            }
            
            // Parse status-based scores if match is completed
            let ourScore = null;
            let opponentScore = null;
            
            // Check if status contains score (e.g., "En juego11" might indicate score)
            const statusScoreMatch = status?.match(/(\d+)\s*[-:]\s*(\d+)/);
            if (statusScoreMatch) {
              const homeScore = parseInt(statusScoreMatch[1]);
              const awayScore = parseInt(statusScoreMatch[2]);
              
              ourScore = isHome ? homeScore : awayScore;
              opponentScore = isHome ? awayScore : homeScore;
            }
            
            // Create match record
            if (opponent && matchDate) {
              const matchRecord = {
                date: matchDate.toISOString().split('T')[0],
                time: matchTime,
                opponent: opponent,
                isHome: isHome,
                ourScore,
                opponentScore,
                competition: '1ª División',
                venue: location || "Campo Municipal"
              };
              
              matches.push(matchRecord);
              console.log(`✅ Added match: ${isHome ? 'AF. SOBRADILLO' : opponent} vs ${isHome ? opponent : 'AF. SOBRADILLO'} (${dateTimeStr})`);
            }
          }
        }
        
        console.log(`📊 Total matches found: ${matches.length}`);
        return matches;
      };
      
      let importedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // Use Liga Hesperides specific extraction
      let extractedMatches = [];
      
      try {
        extractedMatches = extractMatchesFromLigaHesperides(html);
        if (extractedMatches.length > 0) {
          console.log(`✅ Found ${extractedMatches.length} matches using Liga Hesperides extraction`);
        } else {
          console.log("❌ No AF. SOBRADILLO matches found in Liga Hesperides data");
        }
      } catch (error) {
        console.log("❌ Error in Liga Hesperides extraction:", error);
      }

      // Process and save extracted matches
      for (const matchData of extractedMatches) {
        try {
          // Check if match already exists (avoid duplicates)
          const existingMatches = await storage.getMatches();
          const duplicate = existingMatches.find(m => 
            m.opponent === matchData.opponent && 
            m.date === matchData.date
          );

          if (duplicate) {
            // Update existing match if needed
            if (matchData.homeScore !== null && matchData.awayScore !== null) {
              const ourScore = matchData.isHome ? matchData.homeScore : matchData.awayScore;
              const opponentScore = matchData.isHome ? matchData.awayScore : matchData.homeScore;
              await storage.updateMatch(duplicate.id, {
                ourScore,
                opponentScore
              });
              updatedCount++;
              console.log(`🔄 Updated match vs ${matchData.opponent} with score`);
            } else {
              skippedCount++;
              console.log(`⏭️  Skipped duplicate match vs ${matchData.opponent}`);
            }
          } else {
            // Create new match
            const ourScore = matchData.homeScore !== null && matchData.awayScore !== null 
              ? (matchData.isHome ? matchData.homeScore : matchData.awayScore) 
              : null;
            const opponentScore = matchData.homeScore !== null && matchData.awayScore !== null 
              ? (matchData.isHome ? matchData.awayScore : matchData.homeScore) 
              : null;
            
            await storage.createMatch({
              date: matchData.date,
              opponent: matchData.opponent,
              venue: matchData.venue || "Campo Municipal",
              competition: matchData.competition || "Liga Hesperides",
              ourScore,
              opponentScore
            });
            importedCount++;
            console.log(`✅ Imported new match vs ${matchData.opponent} on ${matchData.date}`);
          }
        } catch (error) {
          console.error(`❌ Error processing match vs ${matchData.opponent}:`, error);
          skippedCount++;
        }
      }


      const parseDate = (dateStr: string): string | null => {
        try {
          // Handle DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY formats
          const parts = dateStr.split(/[\/\-]/);
          if (parts.length !== 3) return null;
          
          let day, month, year;
          
          // Assume DD/MM/YYYY for European dates
          day = parseInt(parts[0]);
          month = parseInt(parts[1]);
          year = parseInt(parts[2]);
          
          // Handle 2-digit years
          if (year < 100) {
            year += 2000;
          }
          
          const date = new Date(year, month - 1, day);
          return date.toISOString().split('T')[0];
        } catch {
          return null;
        }
      }

      const extractOpponent = (text: string): { opponent: string | null, isHome: boolean } => {
        // Remove AF. Sobradillo variations to find opponent
        const cleanText = text.replace(/AF\.\s*Sobradillo|A\.F\.\s*Sobradillo|Sobradillo/gi, '').trim();
        
        // Look for common opponent patterns
        const opponentPatterns = [
          /vs\s+([A-Z][a-zA-Z\s\.]+)/i,
          /contra\s+([A-Z][a-zA-Z\s\.]+)/i,
          /-\s*([A-Z][a-zA-Z\s\.]+)/,
          /x\s+([A-Z][a-zA-Z\s\.]+)/i,
          /([A-Z][a-zA-Z\s\.]{3,})/
        ];
        
        for (const pattern of opponentPatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            const opponent = match[1].trim();
            if (opponent.length > 2 && !/^\d+$/.test(opponent)) {
              // Determine if home/away based on text position
              const isHome = text.toLowerCase().indexOf('sobradillo') < text.toLowerCase().indexOf(opponent.toLowerCase());
              return { opponent, isHome };
            }
          }
        }
        
        return { opponent: null, isHome: true };
      }

      const extractScore = (text: string): { homeScore: number | null, awayScore: number | null } => {
        const scorePatterns = [
          /(\d+)\s*-\s*(\d+)/,
          /(\d+)\s*:\s*(\d+)/,
          /(\d+)\s+(\d+)/
        ];
        
        for (const pattern of scorePatterns) {
          const match = text.match(pattern);
          if (match) {
            return {
              homeScore: parseInt(match[1]),
              awayScore: parseInt(match[2])
            };
          }
        }
        
        return { homeScore: null, awayScore: null };
      }

      res.json({
        success: true,
        message: `Importación completada. ${importedCount} partidos importados, ${updatedCount} actualizados, ${skippedCount} omitidos`,
        importedCount,
        updatedCount,
        skippedCount
      });

    } catch (error) {
      console.error("Error importing matches from Liga Hesperides:", error);
      res.status(500).json({ 
        message: "Error al importar partidos desde Liga Hesperides",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/liga-hesperides/import-standings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get team configuration to retrieve Liga Hesperides URLs
      const teamConfig = await storage.getTeamConfig();
      if (!teamConfig?.ligaHesperidesStandingsUrl) {
        return res.status(400).json({ 
          message: "Liga Hesperides URL de clasificación no configurada. Configúrala en la página de configuración." 
        });
      }

      // Security: Validate URL to prevent SSRF attacks
      const allowedDomains = ['ligahesperides.mygol.es', 'ligahesperides.com'];
      const url = new URL(teamConfig.ligaHesperidesStandingsUrl);
      if (!allowedDomains.includes(url.hostname)) {
        return res.status(400).json({
          message: "URL no permitida. Solo se permiten URLs de Liga Hesperides oficial."
        });
      }

      // Scrape standings from Liga Hesperides
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(teamConfig.ligaHesperidesStandingsUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Enhanced HTML parsing to extract actual standings data
      console.log("🔍 Starting standings extraction from Liga Hesperides...");
      
      let importedTeams = 0;
      let updatedTeams = 0;
      let savedLogos = 0;

      // Liga Hesperides specific markdown table extraction
      console.log("📊 Parsing Liga Hesperides markdown format...");
      
      const extractStandingsFromLigaHesperides = (html: string) => {
        const standings: any[] = [];
        
        // Liga Hesperides uses markdown table format
        // | Ranking |  | Equipo | Puntos | Partidos jugados | ... |
        console.log(`📄 HTML content length: ${html.length} chars`);
        
        // Look for the classification table
        const classificationMatch = html.match(/###\s*Clasificaci[óo]n([\s\S]*?)(?=###|\n\n|$)/i);
        if (!classificationMatch) {
          console.log("❌ No classification section found");
          return standings;
        }
        
        const classificationContent = classificationMatch[1];
        console.log(`📊 Found classification section (${classificationContent.length} chars)`);
        
        // Extract table rows (markdown format)
        // Pattern: | position | logo | [team name](link) | points | played | wins | draws | losses | goals_for | goals_against | goal_diff |
        const tableRowRegex = /\|\s*(\d+)\s*\|\s*[^|]*\|\s*\[([^\]]+)\][^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(-?\d+)\s*\|/g;
        
        let match;
        let rowCount = 0;
        
        while ((match = tableRowRegex.exec(classificationContent)) !== null) {
          rowCount++;
          const [, position, teamName, points, played, wins, draws, losses, goalsFor, goalsAgainst, goalDiff] = match;
          
          console.log(`📋 Row ${rowCount}: ${teamName} - Pos: ${position}, Pts: ${points}`);
          
          const teamData = {
            position: parseInt(position),
            team: teamName.trim(),
            points: parseInt(points),
            matchesPlayed: parseInt(played),
            wins: parseInt(wins),
            draws: parseInt(draws),
            losses: parseInt(losses),
            goalsFor: parseInt(goalsFor),
            goalsAgainst: parseInt(goalsAgainst),
            goalDifference: parseInt(goalDiff),
            logoUrl: null // Will try to extract logo later
          };
          
          standings.push(teamData);
        }
        
        // Also try to extract team logos from the table
        const logoRegex = /\|\s*\d+\s*\|\s*!\[]\(([^)]+)\)/g;
        let logoMatch;
        let logoIndex = 0;
        
        while ((logoMatch = logoRegex.exec(classificationContent)) !== null && logoIndex < standings.length) {
          const logoUrl = logoMatch[1];
          if (logoUrl && standings[logoIndex]) {
            standings[logoIndex].logoUrl = logoUrl.startsWith('http') ? logoUrl : `https://ligahesperides.mygol.es${logoUrl}`;
            console.log(`🖼️  Found logo for ${standings[logoIndex].team}: ${standings[logoIndex].logoUrl}`);
          }
          logoIndex++;
        }
        
        console.log(`✅ Extracted ${standings.length} teams from Liga Hesperides classification`);
        return standings;
      };

      const extractedStandings = extractStandingsFromLigaHesperides(html);

      // Helper function for downloading and saving team logos
      const downloadAndSaveTeamLogo = async (teamName: string, logoUrl: string) => {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        
        const logoController = new AbortController();
        const logoTimeoutId = setTimeout(() => logoController.abort(), 5000);
        
        const logoResponse = await fetch(logoUrl.startsWith('http') ? logoUrl : `https://ligahesperides.com${logoUrl}`, {
          signal: logoController.signal
        });
        clearTimeout(logoTimeoutId);
        
        if (!logoResponse.ok) throw new Error(`HTTP ${logoResponse.status}`);
        
        const logoBuffer = await logoResponse.arrayBuffer();
        const logoData = Buffer.from(logoBuffer);
        
        const urlPath = new URL(logoUrl).pathname;
        const ext = urlPath.split('.').pop() || 'png';
        const fileName = `team-logos/${teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
        
        const uploadResult = await objectStorageService.getObjectEntityUploadURL(fileName, `image/${ext}`, 'public');
        
        const uploadController = new AbortController();
        const uploadTimeoutId = setTimeout(() => uploadController.abort(), 5000);
        
        const uploadResponse = await fetch(uploadResult.uploadURL, {
          method: 'PUT',
          body: logoData,
          headers: { 'Content-Type': `image/${ext}` },
          signal: uploadController.signal
        });
        clearTimeout(uploadTimeoutId);
        
        if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`);
        
        // Update team with logo
        await storage.createOrUpdateOpponent({
          name: teamName,
          logoUrl: uploadResult.objectPath,
          source: 'liga_hesperides'
        });
      };

      // Process and save extracted standings
      for (const teamData of extractedStandings) {
        try {
          // Save/update team in standings
          const existingStandings = await storage.getStandings();
          const existingTeam = existingStandings.find(s => s.team === teamData.team);

          if (existingTeam) {
            // Update existing team
            await storage.updateStanding(existingTeam.id, {
              position: teamData.position,
              matchesPlayed: teamData.matchesPlayed,
              wins: teamData.wins,
              draws: teamData.draws,
              losses: teamData.losses,
              goalsFor: teamData.goalsFor,
              goalsAgainst: teamData.goalsAgainst,
              goalDifference: teamData.goalDifference,
              points: teamData.points
            });
            updatedTeams++;
            console.log(`🔄 Updated ${teamData.team} standings`);
          } else {
            // Create new team standing
            await storage.createStanding({
              position: teamData.position,
              team: teamData.team,
              matchesPlayed: teamData.matchesPlayed,
              wins: teamData.wins,
              draws: teamData.draws,
              losses: teamData.losses,
              goalsFor: teamData.goalsFor,
              goalsAgainst: teamData.goalsAgainst,
              goalDifference: teamData.goalDifference,
              points: teamData.points
            });
            importedTeams++;
            console.log(`✅ Imported ${teamData.team} to standings`);
          }

          // Also save to opponents table if it's not AF. Sobradillo
          if (teamData.team !== "AF. Sobradillo") {
            await storage.createOrUpdateOpponent({
              name: teamData.team,
              logoUrl: teamData.logoUrl || null,
              source: 'liga_hesperides'
            });
          }

          // Handle logo if available
          if (teamData.logoUrl) {
            try {
              await downloadAndSaveTeamLogo(teamData.team, teamData.logoUrl);
              savedLogos++;
            } catch (logoError) {
              console.warn(`Error saving logo for ${teamData.team}:`, logoError);
            }
          }

        } catch (error) {
          console.error(`❌ Error processing team ${teamData.team}:`, error);
        }
      }

      // Helper functions for different extraction strategies
      const extractStandingsFromTables = (html: string) => {
        const standings: any[] = [];
        const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        
        let tableMatch;
        while ((tableMatch = tableRegex.exec(html)) !== null) {
          const tableContent = tableMatch[0];
          
          // Check if this table looks like a standings table
          if (!/posici[oó]n|posici\u00f3n|equipo|team|puntos|points|pj|mp|played/gi.test(tableContent)) continue;
          
          let rowMatch;
          const tableRows: string[][] = [];
          
          while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
            const rowContent = rowMatch[1];
            
            // Skip header rows that only contain th tags
            if (/<th/i.test(rowContent) && !/<td/i.test(rowContent)) continue;
            
            const cells: string[] = [];
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
              cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
            }
            
            if (cells.length >= 5) { // Minimum columns for standings
              tableRows.push(cells);
            }
          }
          
          // Parse table rows as standings
          for (const row of tableRows) {
            const standing = parseStandingFromRow(row);
            if (standing) standings.push(standing);
          }
        }
        
        return standings;
      };

      const extractStandingsFromDivs = (html: string) => {
        const standings: any[] = [];
        const divRegex = /<div[^>]*class[^>]*(?:standing|position|team)[^>]*>[\s\S]*?<\/div>/gi;
        
        let divMatch;
        while ((divMatch = divRegex.exec(html)) !== null) {
          const divContent = divMatch[0];
          const standing = parseStandingFromDiv(divContent);
          if (standing) standings.push(standing);
        }
        
        return standings;
      };

      const extractStandingsFromLists = (html: string) => {
        const standings: any[] = [];
        const listRegex = /<[uo]l[^>]*>[\s\S]*?<\/[uo]l>/gi;
        const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        
        let listMatch;
        while ((listMatch = listRegex.exec(html)) !== null) {
          const listContent = listMatch[0];
          
          if (!/posici[oó]n|equipo|team|puntos|points/gi.test(listContent)) continue;
          
          let itemMatch;
          while ((itemMatch = itemRegex.exec(listContent)) !== null) {
            const itemContent = itemMatch[1];
            const standing = parseStandingFromText(itemContent);
            if (standing) standings.push(standing);
          }
        }
        
        return standings;
      };

      const parseStandingFromRow = (cells: string[]) => {
        // Common formats: [Pos, Team, PJ, G, E, P, GF, GC, Pts] or similar
        if (cells.length < 5) return null;
        
        const position = parseNumber(cells.find(cell => /^\d+$/.test(cell.trim())));
        if (!position) return null;
        
        const teamName = cells.find(cell => 
          /[a-zA-Z]{3,}/.test(cell) && 
          !/^\d+$/.test(cell) &&
          cell.length > 2
        );
        if (!teamName) return null;
        
        // Extract numeric data (matches played, wins, draws, losses, goals, points)
        const numbers = cells.filter(cell => /^\d+$/.test(cell.trim())).map(Number);
        
        if (numbers.length < 6) return null; // Need at least pos, pj, g, e, p, pts
        
        return {
          position,
          team: teamName.trim(),
          matchesPlayed: numbers[1] || 0,
          wins: numbers[2] || 0,
          draws: numbers[3] || 0,
          losses: numbers[4] || 0,
          goalsFor: numbers[5] || 0,
          goalsAgainst: numbers[6] || 0,
          goalDifference: (numbers[5] || 0) - (numbers[6] || 0),
          points: numbers[numbers.length - 1] || 0,
          logoUrl: null
        };
      };

      const parseStandingFromDiv = (divContent: string) => {
        const text = divContent.replace(/<[^>]*>/g, ' ').trim();
        return parseStandingFromText(text);
      };

      const parseStandingFromText = (text: string) => {
        const positionMatch = text.match(/(\d+)/);
        if (!positionMatch) return null;
        
        const teamMatch = text.match(/([A-Z][a-zA-Z\s\.]{2,})/);
        if (!teamMatch) return null;
        
        const numbers = text.match(/\d+/g);
        if (!numbers || numbers.length < 6) return null;
        
        return {
          position: parseInt(numbers[0]),
          team: teamMatch[1].trim(),
          matchesPlayed: parseInt(numbers[1]) || 0,
          wins: parseInt(numbers[2]) || 0,
          draws: parseInt(numbers[3]) || 0,
          losses: parseInt(numbers[4]) || 0,
          goalsFor: parseInt(numbers[5]) || 0,
          goalsAgainst: parseInt(numbers[6]) || 0,
          goalDifference: (parseInt(numbers[5]) || 0) - (parseInt(numbers[6]) || 0),
          points: parseInt(numbers[numbers.length - 1]) || 0,
          logoUrl: null
        };
      };

      const parseNumber = (str: string | undefined): number | null => {
        if (!str) return null;
        const num = parseInt(str.trim());
        return isNaN(num) ? null : num;
      };

      res.json({
        success: true,
        message: `Clasificación importada. ${importedTeams} equipos nuevos, ${updatedTeams} actualizados, ${savedLogos} escudos descargados`,
        importedTeams,
        updatedTeams,
        savedLogos,
        url: teamConfig.ligaHesperidesStandingsUrl
      });

    } catch (error) {
      console.error("Error importing standings from Liga Hesperides:", error);
      res.status(500).json({ 
        message: "Error al importar clasificación desde Liga Hesperides",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Opponents/Teams routes
  app.get("/api/opponents", isAuthenticated, async (req, res) => {
    try {
      const opponents = await storage.getOpponents();
      res.json(opponents);
    } catch (error) {
      console.error("Error fetching opponents:", error);
      res.status(500).json({ message: "Failed to fetch opponents" });
    }
  });

  // Standings/Classification routes
  app.get("/api/standings", isAuthenticated, async (req, res) => {
    try {
      // TODO: Implement real standings data from imported classification
      // For now, return sample data - this will be replaced with real data from Liga Hesperides import
      const standings = [
        {
          position: 1,
          team: "AF. Sobradillo",
          matches: 10,
          wins: 8,
          draws: 1,
          losses: 1,
          goalsFor: 25,
          goalsAgainst: 8,
          goalDifference: 17,
          points: 25,
          form: ['W', 'W', 'D', 'W', 'W']
        },
        {
          position: 2,
          team: "Real Sociedad B",
          matches: 10,
          wins: 7,
          draws: 2,
          losses: 1,
          goalsFor: 22,
          goalsAgainst: 10,
          goalDifference: 12,
          points: 23,
          form: ['W', 'L', 'W', 'W', 'D']
        },
        {
          position: 3,
          team: "Athletic Club B",
          matches: 10,
          wins: 6,
          draws: 3,
          losses: 1,
          goalsFor: 18,
          goalsAgainst: 9,
          goalDifference: 9,
          points: 21,
          form: ['D', 'W', 'W', 'D', 'W']
        }
      ];
      res.json(standings);
    } catch (error) {
      console.error("Error fetching standings:", error);
      res.status(500).json({ message: "Failed to fetch standings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
