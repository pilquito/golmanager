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
          storage.createMatchAttendance({
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
      res.status(500).json({ message: "Failed to create attendance", error: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
