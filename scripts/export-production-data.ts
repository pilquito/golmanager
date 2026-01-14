import { db } from "../server/db";
import { 
  organizations, 
  users, 
  players, 
  matches, 
  monthlyPayments, 
  championshipPayments, 
  otherPayments,
  matchAttendances,
  teamConfig,
  opponents,
  standings
} from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const ORG_ID = "default-org";

function escapeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return val.toString();
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return escapeString(val.toString());
}

async function exportData() {
  console.log("Exportando datos de producción para organización:", ORG_ID);
  
  let sql = `-- Script de migración de datos para AF. SOBRADILLO
-- Generado el: ${new Date().toISOString()}
-- IMPORTANTE: Ejecutar este script en la base de datos de producción DESPUÉS de que las migraciones hayan creado las tablas

BEGIN;

`;

  // 1. Exportar organización
  const orgs = await db.select().from(organizations).where(eq(organizations.id, ORG_ID));
  if (orgs.length > 0) {
    const org = orgs[0];
    sql += `-- Organización principal
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
(${formatValue(org.id)}, ${formatValue(org.name)}, ${formatValue(org.slug)}, ${formatValue(org.logoUrl)}, ${formatValue(org.isActive)}, ${formatValue(org.createdAt)})
ON CONFLICT (id) DO NOTHING;

`;
  }

  // 2. Exportar configuración del equipo
  const configs = await db.select().from(teamConfig).where(eq(teamConfig.organizationId, ORG_ID));
  if (configs.length > 0) {
    sql += `-- Configuración del equipo\n`;
    for (const config of configs) {
      sql += `INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id) VALUES 
(${formatValue(config.id)}, ${formatValue(config.teamName)}, ${formatValue(config.teamColors)}, ${formatValue(config.logoUrl)}, ${formatValue(config.monthlyFee)}, ${formatValue(config.paymentDueDay)}, ${formatValue(config.contactEmail)}, ${formatValue(config.contactPhone)}, ${formatValue(config.backgroundImageUrl)}, ${formatValue(config.playerStatsEnabled)}, ${formatValue(config.myCompetitionEnabled)}, ${formatValue(config.footballType)}, ${formatValue(config.ligaHesperidesMatchesUrl)}, ${formatValue(config.ligaHesperidesStandingsUrl)}, ${formatValue(config.organizationId)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  // 3. Exportar usuarios (excluyendo usuarios de test)
  const allUsers = await db.select().from(users).where(eq(users.organizationId, ORG_ID));
  const realUsers = allUsers.filter(u => 
    !u.username?.startsWith('e2e_') && 
    !u.username?.startsWith('user_') &&
    !u.email?.includes('example.com')
  );
  
  if (realUsers.length > 0) {
    sql += `-- Usuarios del equipo (${realUsers.length} usuarios reales)\n`;
    for (const user of realUsers) {
      sql += `INSERT INTO users (id, username, email, role, organization_id, first_name, last_name, profile_image_url, created_at) VALUES 
(${formatValue(user.id)}, ${formatValue(user.username)}, ${formatValue(user.email)}, ${formatValue(user.role)}, ${formatValue(user.organizationId)}, ${formatValue(user.firstName)}, ${formatValue(user.lastName)}, ${formatValue(user.profileImageUrl)}, ${formatValue(user.createdAt)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  // 4. Exportar jugadores
  const allPlayers = await db.select().from(players).where(eq(players.organizationId, ORG_ID));
  if (allPlayers.length > 0) {
    sql += `-- Jugadores (${allPlayers.length} jugadores)\n`;
    for (const player of allPlayers) {
      sql += `INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id) VALUES 
(${formatValue(player.id)}, ${formatValue(player.organizationId)}, ${formatValue(player.name)}, ${formatValue(player.email)}, ${formatValue(player.phone)}, ${formatValue(player.position)}, ${formatValue(player.jerseyNumber)}, ${formatValue(player.status)}, ${formatValue(player.tagline)}, ${formatValue(player.isCaptain)}, ${formatValue(player.userId)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  // 5. Exportar partidos
  const allMatches = await db.select().from(matches).where(eq(matches.organizationId, ORG_ID));
  if (allMatches.length > 0) {
    sql += `-- Partidos (${allMatches.length} partidos)\n`;
    for (const match of allMatches) {
      sql += `INSERT INTO matches (id, organization_id, date, opponent, home_score, away_score, status, competition, is_home, notes, location) VALUES 
(${formatValue(match.id)}, ${formatValue(match.organizationId)}, ${formatValue(match.date)}, ${formatValue(match.opponent)}, ${formatValue(match.homeScore)}, ${formatValue(match.awayScore)}, ${formatValue(match.status)}, ${formatValue(match.competition)}, ${formatValue(match.isHome)}, ${formatValue(match.notes)}, ${formatValue(match.location)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  // 6. Exportar pagos mensuales
  const allPayments = await db.select().from(monthlyPayments).where(eq(monthlyPayments.organizationId, ORG_ID));
  if (allPayments.length > 0) {
    sql += `-- Pagos mensuales (${allPayments.length} pagos)\n`;
    for (const payment of allPayments) {
      sql += `INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes) VALUES 
(${formatValue(payment.id)}, ${formatValue(payment.organizationId)}, ${formatValue(payment.playerId)}, ${formatValue(payment.month)}, ${formatValue(payment.year)}, ${formatValue(payment.amount)}, ${formatValue(payment.status)}, ${formatValue(payment.paidAt)}, ${formatValue(payment.notes)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  // 7. Exportar asistencias
  const allAttendances = await db.select().from(matchAttendances).where(eq(matchAttendances.organizationId, ORG_ID));
  if (allAttendances.length > 0) {
    sql += `-- Asistencias a partidos (${allAttendances.length} registros)\n`;
    for (const att of allAttendances) {
      sql += `INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at) VALUES 
(${formatValue(att.id)}, ${formatValue(att.organizationId)}, ${formatValue(att.matchId)}, ${formatValue(att.playerId)}, ${formatValue(att.status)}, ${formatValue(att.userId)}, ${formatValue(att.confirmedAt)})
ON CONFLICT (id) DO NOTHING;

`;
    }
  }

  sql += `
COMMIT;

-- Script completado exitosamente
`;

  // Guardar archivo
  const filename = `scripts/migration-${new Date().toISOString().split('T')[0]}.sql`;
  fs.writeFileSync(filename, sql);
  console.log(`\n✅ Script de migración generado: ${filename}`);
  console.log(`\nEstadísticas:`);
  console.log(`- Organización: 1`);
  console.log(`- Configuración del equipo: ${configs.length}`);
  console.log(`- Usuarios reales: ${realUsers.length}`);
  console.log(`- Jugadores: ${allPlayers.length}`);
  console.log(`- Partidos: ${allMatches.length}`);
  console.log(`- Pagos mensuales: ${allPayments.length}`);
  console.log(`- Asistencias: ${allAttendances.length}`);
}

exportData().catch(console.error);
