import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  password: varchar("password"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"), // Use text for base64 images
  role: varchar("role").default("user"),
  isActive: boolean("is_active").default(true),
  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Players table
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  jerseyNumber: integer("jersey_number"),
  position: varchar("position").notNull(), // Portero, Defensa, Mediocampista, Delantero
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  birthDate: date("birth_date"),
  tagline: varchar("tagline"), // Campo "deportista" - sub-eslogan
  profileImageUrl: text("profile_image_url"), // Campo para foto del jugador
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  opponent: varchar("opponent").notNull(),
  venue: varchar("venue").notNull(),
  competition: varchar("competition").notNull(),
  ourScore: integer("our_score"),
  opponentScore: integer("opponent_score"),
  status: varchar("status").default("scheduled"), // scheduled, played, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly payments table
export const monthlyPayments = pgTable("monthly_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  month: varchar("month").notNull(), // YYYY-MM format
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paymentDate: date("payment_date"),
  status: varchar("status").default("pending"), // pending, paid, overdue
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Championship payments table
export const championshipPayments = pgTable("championship_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id, { onDelete: "cascade" }),
  concept: varchar("concept").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paymentDate: date("payment_date"),
  status: varchar("status").default("pending"), // pending, paid, overdue
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opponents (rival teams) table
export const opponents = pgTable("opponents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  shortName: varchar("short_name"), // Nombre corto/abreviado
  logoUrl: text("logo_url"), // URL del escudo del equipo
  city: varchar("city"),
  stadium: varchar("stadium"),
  foundedYear: integer("founded_year"),
  website: varchar("website"),
  colors: varchar("colors"), // Colores del equipo
  // Datos específicos de Liga Hesperides
  ligaHesperidesId: varchar("liga_hesperides_id"), // ID único en Liga Hesperides
  source: varchar("source").default("manual"), // Fuente de importación: manual, liga_hesperides, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team configuration table
export const teamConfig = pgTable("team_config", {
  id: varchar("id").primaryKey().default("team_config"),
  teamName: varchar("team_name").default("GolManager FC"),
  teamColors: varchar("team_colors").default("#dc2626,#ffffff"), // Colores principales y secundarios separados por coma
  logoUrl: varchar("logo_url"),
  backgroundImageUrl: varchar("background_image_url").default("/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default("15.00"),
  paymentDueDay: integer("payment_due_day").default(1),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  // Tipo de fútbol: 11 jugadores vs 7 jugadores
  footballType: varchar("football_type").default("11"), // "11" or "7"
  // Configuraciones del modo jugador
  playerStatsEnabled: boolean("player_stats_enabled").default(true), // Mostrar "Estadísticas de jugador"
  myCompetitionEnabled: boolean("my_competition_enabled").default(true), // Mostrar "Mi competición"
  // URLs de Liga Hesperides para importación
  ligaHesperidesMatchesUrl: varchar("liga_hesperides_matches_url"), // URL para importar partidos
  ligaHesperidesStandingsUrl: varchar("liga_hesperides_standings_url"), // URL para importar clasificación
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Match attendances table - para confirmar asistencia de jugadores
export const matchAttendances = pgTable("match_attendances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => players.id, { onDelete: "cascade" }), // Usando players.id directamente
  status: varchar("status").notNull().default("pending"), // pending, confirmed, declined
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Other payments table
export const otherPayments = pgTable("other_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  concept: varchar("concept").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // income, expense
  paymentDate: date("payment_date"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Standings table - clasificación de la liga
export const standings = pgTable("standings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  position: integer("position").notNull(),
  team: varchar("team").notNull(),
  matchesPlayed: integer("matches_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  goalDifference: integer("goal_difference").notNull().default(0),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const playersRelations = relations(players, ({ many }) => ({
  monthlyPayments: many(monthlyPayments),
}));

export const monthlyPaymentsRelations = relations(monthlyPayments, ({ one }) => ({
  player: one(players, {
    fields: [monthlyPayments.playerId],
    references: [players.id],
  }),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  championshipPayments: many(championshipPayments),
  attendances: many(matchAttendances),
}));

export const championshipPaymentsRelations = relations(championshipPayments, ({ one }) => ({
  match: one(matches, {
    fields: [championshipPayments.matchId],
    references: [matches.id],
  }),
}));

export const matchAttendancesRelations = relations(matchAttendances, ({ one }) => ({
  match: one(matches, {
    fields: [matchAttendances.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchAttendances.userId],
    references: [players.id],
  }),
}));

export const opponentsRelations = relations(opponents, ({ many }) => ({
  // No direct relations yet, but can be added later for match history
}));

// Schemas for validation
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyPaymentSchema = createInsertSchema(monthlyPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChampionshipPaymentSchema = createInsertSchema(championshipPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchAttendanceSchema = createInsertSchema(matchAttendances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtherPaymentSchema = createInsertSchema(otherPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamConfigSchema = createInsertSchema(teamConfig).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOpponentSchema = createInsertSchema(opponents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStandingSchema = createInsertSchema(standings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type MonthlyPayment = typeof monthlyPayments.$inferSelect;
export type InsertMonthlyPayment = z.infer<typeof insertMonthlyPaymentSchema>;
export type ChampionshipPayment = typeof championshipPayments.$inferSelect;
export type InsertChampionshipPayment = z.infer<typeof insertChampionshipPaymentSchema>;
export type TeamConfig = typeof teamConfig.$inferSelect;
export type InsertTeamConfig = z.infer<typeof insertTeamConfigSchema>;
export type OtherPayment = typeof otherPayments.$inferSelect;
export type InsertOtherPayment = z.infer<typeof insertOtherPaymentSchema>;
export type MatchAttendance = typeof matchAttendances.$inferSelect;
export type InsertMatchAttendance = z.infer<typeof insertMatchAttendanceSchema>;
export type Opponent = typeof opponents.$inferSelect;
export type InsertOpponent = z.infer<typeof insertOpponentSchema>;
export type Standing = typeof standings.$inferSelect;
export type InsertStanding = z.infer<typeof insertStandingSchema>;
