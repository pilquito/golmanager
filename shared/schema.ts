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

// Organizations table - MULTITENANT CORE
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  username: varchar("username"),
  password: varchar("password"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: varchar("role").default("user"),
  isActive: boolean("is_active").default(true),
  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Organizations - Many-to-Many relationship for users in multiple teams
export const userOrganizations = pgTable("user_organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: varchar("role").default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Players table
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  jerseyNumber: integer("jersey_number"),
  position: varchar("position").notNull(),
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  birthDate: date("birth_date"),
  tagline: varchar("tagline"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  opponent: varchar("opponent").notNull(),
  venue: varchar("venue").notNull(),
  competition: varchar("competition").notNull(),
  ourScore: integer("our_score"),
  opponentScore: integer("opponent_score"),
  status: varchar("status").default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly payments table
export const monthlyPayments = pgTable("monthly_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  month: varchar("month").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paymentDate: date("payment_date"),
  status: varchar("status").default("pending"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Championship payments table
export const championshipPayments = pgTable("championship_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  matchId: varchar("match_id").references(() => matches.id, { onDelete: "cascade" }),
  concept: varchar("concept").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paymentDate: date("payment_date"),
  status: varchar("status").default("pending"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opponents (rival teams) table
export const opponents = pgTable("opponents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  shortName: varchar("short_name"),
  logoUrl: text("logo_url"),
  city: varchar("city"),
  stadium: varchar("stadium"),
  foundedYear: integer("founded_year"),
  website: varchar("website"),
  colors: varchar("colors"),
  ligaHesperidesId: varchar("liga_hesperides_id"),
  source: varchar("source").default("manual"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team configuration table - NOW PER ORGANIZATION
export const teamConfig = pgTable("team_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).unique(),
  teamName: varchar("team_name").default("GolManager FC"),
  teamColors: varchar("team_colors").default("#dc2626,#ffffff"),
  logoUrl: varchar("logo_url"),
  backgroundImageUrl: varchar("background_image_url").default("/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default("15.00"),
  paymentDueDay: integer("payment_due_day").default(1),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  footballType: varchar("football_type").default("11"),
  playerStatsEnabled: boolean("player_stats_enabled").default(true),
  myCompetitionEnabled: boolean("my_competition_enabled").default(true),
  ligaHesperidesMatchesUrl: varchar("liga_hesperides_matches_url"),
  ligaHesperidesStandingsUrl: varchar("liga_hesperides_standings_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Match attendances table
export const matchAttendances = pgTable("match_attendances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  matchId: varchar("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("pending"),
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Other payments table
export const otherPayments = pgTable("other_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  concept: varchar("concept").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type").notNull(),
  paymentDate: date("payment_date"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Standings table
export const standings = pgTable("standings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
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
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  userOrganizations: many(userOrganizations),
  players: many(players),
  matches: many(matches),
  monthlyPayments: many(monthlyPayments),
  championshipPayments: many(championshipPayments),
  otherPayments: many(otherPayments),
  matchAttendances: many(matchAttendances),
  opponents: many(opponents),
  standings: many(standings),
  teamConfig: one(teamConfig),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userOrganizations: many(userOrganizations),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
}));

export const playersRelations = relations(players, ({ many, one }) => ({
  monthlyPayments: many(monthlyPayments),
  organization: one(organizations, {
    fields: [players.organizationId],
    references: [organizations.id],
  }),
}));

export const monthlyPaymentsRelations = relations(monthlyPayments, ({ one }) => ({
  player: one(players, {
    fields: [monthlyPayments.playerId],
    references: [players.id],
  }),
  organization: one(organizations, {
    fields: [monthlyPayments.organizationId],
    references: [organizations.id],
  }),
}));

export const matchesRelations = relations(matches, ({ many, one }) => ({
  championshipPayments: many(championshipPayments),
  attendances: many(matchAttendances),
  organization: one(organizations, {
    fields: [matches.organizationId],
    references: [organizations.id],
  }),
}));

export const championshipPaymentsRelations = relations(championshipPayments, ({ one }) => ({
  match: one(matches, {
    fields: [championshipPayments.matchId],
    references: [matches.id],
  }),
  organization: one(organizations, {
    fields: [championshipPayments.organizationId],
    references: [organizations.id],
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
  organization: one(organizations, {
    fields: [matchAttendances.organizationId],
    references: [organizations.id],
  }),
}));

export const opponentsRelations = relations(opponents, ({ one }) => ({
  organization: one(organizations, {
    fields: [opponents.organizationId],
    references: [organizations.id],
  }),
}));

export const standingsRelations = relations(standings, ({ one }) => ({
  organization: one(organizations, {
    fields: [standings.organizationId],
    references: [organizations.id],
  }),
}));

export const otherPaymentsRelations = relations(otherPayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [otherPayments.organizationId],
    references: [organizations.id],
  }),
}));

export const teamConfigRelations = relations(teamConfig, ({ one }) => ({
  organization: one(organizations, {
    fields: [teamConfig.organizationId],
    references: [organizations.id],
  }),
}));

// Schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
  id: true,
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

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
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
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
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
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;
