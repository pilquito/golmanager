import { db } from "../server/db";
import { 
  organizations, 
  users, 
  userOrganizations,
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
import * as fs from "fs";

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

async function exportAllData() {
  console.log("Exportando TODOS los datos de la base de datos de desarrollo...\n");
  
  let sql = `-- Script de migración COMPLETA de datos de desarrollo a producción
-- Generado el: ${new Date().toISOString()}
-- IMPORTANTE: Ejecutar este script en la base de datos de producción
-- ADVERTENCIA: Este script insertará datos, no los reemplazará (usa ON CONFLICT DO NOTHING)

BEGIN;

-- Limpiar datos existentes (descomentar si quieres reemplazar TODO)
-- DELETE FROM match_attendances;
-- DELETE FROM monthly_payments;
-- DELETE FROM championship_payments;
-- DELETE FROM other_payments;
-- DELETE FROM matches;
-- DELETE FROM players;
-- DELETE FROM standings;
-- DELETE FROM opponents;
-- DELETE FROM team_config;
-- DELETE FROM user_organizations;
-- DELETE FROM users;
-- DELETE FROM organizations;

`;

  // 1. Exportar organizaciones
  const allOrgs = await db.select().from(organizations);
  console.log(`Organizaciones: ${allOrgs.length}`);
  if (allOrgs.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- ORGANIZACIONES (${allOrgs.length})\n`;
    sql += `-- ============================================\n`;
    for (const org of allOrgs) {
      sql += `INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES (${formatValue(org.id)}, ${formatValue(org.name)}, ${formatValue(org.slug)}, ${formatValue(org.logoUrl)}, ${formatValue(org.isActive)}, ${formatValue(org.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 2. Exportar usuarios (excluyendo usuarios de test)
  const allUsers = await db.select().from(users);
  const realUsers = allUsers.filter(u => 
    !u.username?.startsWith('e2e_') && 
    !u.username?.startsWith('user_') &&
    !u.username?.startsWith('test') &&
    !u.email?.includes('example.com')
  );
  console.log(`Usuarios: ${realUsers.length} (de ${allUsers.length} total, excluidos test)`);
  
  if (realUsers.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- USUARIOS (${realUsers.length})\n`;
    sql += `-- ============================================\n`;
    for (const user of realUsers) {
      sql += `INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES (${formatValue(user.id)}, ${formatValue(user.username)}, ${formatValue(user.email)}, ${formatValue(user.password)}, ${formatValue(user.role)}, ${formatValue(user.organizationId)}, ${formatValue(user.firstName)}, ${formatValue(user.lastName)}, ${formatValue(user.profileImageUrl)}, ${formatValue(user.isActive)}, ${formatValue(user.lastAccess)}, ${formatValue(user.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 3. Exportar user_organizations
  const allUserOrgs = await db.select().from(userOrganizations);
  const realUserOrgs = allUserOrgs.filter(uo => 
    realUsers.some(u => u.id === uo.userId)
  );
  console.log(`User-Organizations: ${realUserOrgs.length}`);
  
  if (realUserOrgs.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- USER_ORGANIZATIONS (${realUserOrgs.length})\n`;
    sql += `-- ============================================\n`;
    for (const uo of realUserOrgs) {
      sql += `INSERT INTO user_organizations (id, user_id, organization_id, role, is_active, created_at) VALUES (${formatValue(uo.id)}, ${formatValue(uo.userId)}, ${formatValue(uo.organizationId)}, ${formatValue(uo.role)}, ${formatValue(uo.isActive)}, ${formatValue(uo.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 4. Exportar configuración del equipo
  const allConfigs = await db.select().from(teamConfig);
  console.log(`Team Configs: ${allConfigs.length}`);
  
  if (allConfigs.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- TEAM_CONFIG (${allConfigs.length})\n`;
    sql += `-- ============================================\n`;
    for (const config of allConfigs) {
      sql += `INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id, created_at, updated_at) VALUES (${formatValue(config.id)}, ${formatValue(config.teamName)}, ${formatValue(config.teamColors)}, ${formatValue(config.logoUrl)}, ${formatValue(config.monthlyFee)}, ${formatValue(config.paymentDueDay)}, ${formatValue(config.contactEmail)}, ${formatValue(config.contactPhone)}, ${formatValue(config.backgroundImageUrl)}, ${formatValue(config.playerStatsEnabled)}, ${formatValue(config.myCompetitionEnabled)}, ${formatValue(config.footballType)}, ${formatValue(config.ligaHesperidesMatchesUrl)}, ${formatValue(config.ligaHesperidesStandingsUrl)}, ${formatValue(config.organizationId)}, ${formatValue(config.createdAt)}, ${formatValue(config.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 5. Exportar jugadores
  const allPlayers = await db.select().from(players);
  console.log(`Jugadores: ${allPlayers.length}`);
  
  if (allPlayers.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- JUGADORES (${allPlayers.length})\n`;
    sql += `-- ============================================\n`;
    for (const player of allPlayers) {
      sql += `INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES (${formatValue(player.id)}, ${formatValue(player.organizationId)}, ${formatValue(player.name)}, ${formatValue(player.email)}, ${formatValue(player.phone)}, ${formatValue(player.position)}, ${formatValue(player.jerseyNumber)}, ${formatValue(player.status)}, ${formatValue(player.tagline)}, ${formatValue(player.isCaptain)}, ${formatValue(player.userId)}, ${formatValue(player.createdAt)}, ${formatValue(player.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 6. Exportar oponentes
  const allOpponents = await db.select().from(opponents);
  console.log(`Oponentes: ${allOpponents.length}`);
  
  if (allOpponents.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- OPONENTES (${allOpponents.length})\n`;
    sql += `-- ============================================\n`;
    for (const opp of allOpponents) {
      sql += `INSERT INTO opponents (id, organization_id, name, logo_url, notes, created_at, updated_at) VALUES (${formatValue(opp.id)}, ${formatValue(opp.organizationId)}, ${formatValue(opp.name)}, ${formatValue(opp.logoUrl)}, ${formatValue(opp.notes)}, ${formatValue(opp.createdAt)}, ${formatValue(opp.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 7. Exportar partidos
  const allMatches = await db.select().from(matches);
  console.log(`Partidos: ${allMatches.length}`);
  
  if (allMatches.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- PARTIDOS (${allMatches.length})\n`;
    sql += `-- ============================================\n`;
    for (const match of allMatches) {
      sql += `INSERT INTO matches (id, organization_id, date, opponent, home_score, away_score, status, competition, is_home, notes, location, created_at, updated_at) VALUES (${formatValue(match.id)}, ${formatValue(match.organizationId)}, ${formatValue(match.date)}, ${formatValue(match.opponent)}, ${formatValue(match.homeScore)}, ${formatValue(match.awayScore)}, ${formatValue(match.status)}, ${formatValue(match.competition)}, ${formatValue(match.isHome)}, ${formatValue(match.notes)}, ${formatValue(match.location)}, ${formatValue(match.createdAt)}, ${formatValue(match.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 8. Exportar standings
  const allStandings = await db.select().from(standings);
  console.log(`Standings: ${allStandings.length}`);
  
  if (allStandings.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- STANDINGS (${allStandings.length})\n`;
    sql += `-- ============================================\n`;
    for (const standing of allStandings) {
      sql += `INSERT INTO standings (id, organization_id, team_name, position, points, played, won, drawn, lost, goals_for, goals_against, goal_difference, form, updated_at, created_at) VALUES (${formatValue(standing.id)}, ${formatValue(standing.organizationId)}, ${formatValue(standing.teamName)}, ${formatValue(standing.position)}, ${formatValue(standing.points)}, ${formatValue(standing.played)}, ${formatValue(standing.won)}, ${formatValue(standing.drawn)}, ${formatValue(standing.lost)}, ${formatValue(standing.goalsFor)}, ${formatValue(standing.goalsAgainst)}, ${formatValue(standing.goalDifference)}, ${formatValue(standing.form)}, ${formatValue(standing.updatedAt)}, ${formatValue(standing.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 9. Exportar pagos mensuales
  const allMonthlyPayments = await db.select().from(monthlyPayments);
  console.log(`Pagos mensuales: ${allMonthlyPayments.length}`);
  
  if (allMonthlyPayments.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- PAGOS MENSUALES (${allMonthlyPayments.length})\n`;
    sql += `-- ============================================\n`;
    for (const payment of allMonthlyPayments) {
      sql += `INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES (${formatValue(payment.id)}, ${formatValue(payment.organizationId)}, ${formatValue(payment.playerId)}, ${formatValue(payment.month)}, ${formatValue(payment.year)}, ${formatValue(payment.amount)}, ${formatValue(payment.status)}, ${formatValue(payment.paidAt)}, ${formatValue(payment.notes)}, ${formatValue(payment.createdAt)}, ${formatValue(payment.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 10. Exportar pagos de campeonato
  const allChampPayments = await db.select().from(championshipPayments);
  console.log(`Pagos campeonato: ${allChampPayments.length}`);
  
  if (allChampPayments.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- PAGOS CAMPEONATO (${allChampPayments.length})\n`;
    sql += `-- ============================================\n`;
    for (const payment of allChampPayments) {
      sql += `INSERT INTO championship_payments (id, organization_id, player_id, championship_name, amount, status, paid_at, notes, created_at, updated_at) VALUES (${formatValue(payment.id)}, ${formatValue(payment.organizationId)}, ${formatValue(payment.playerId)}, ${formatValue(payment.championshipName)}, ${formatValue(payment.amount)}, ${formatValue(payment.status)}, ${formatValue(payment.paidAt)}, ${formatValue(payment.notes)}, ${formatValue(payment.createdAt)}, ${formatValue(payment.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 11. Exportar otros pagos
  const allOtherPayments = await db.select().from(otherPayments);
  console.log(`Otros pagos: ${allOtherPayments.length}`);
  
  if (allOtherPayments.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- OTROS PAGOS (${allOtherPayments.length})\n`;
    sql += `-- ============================================\n`;
    for (const payment of allOtherPayments) {
      sql += `INSERT INTO other_payments (id, organization_id, player_id, concept, amount, status, paid_at, notes, created_at, updated_at) VALUES (${formatValue(payment.id)}, ${formatValue(payment.organizationId)}, ${formatValue(payment.playerId)}, ${formatValue(payment.concept)}, ${formatValue(payment.amount)}, ${formatValue(payment.status)}, ${formatValue(payment.paidAt)}, ${formatValue(payment.notes)}, ${formatValue(payment.createdAt)}, ${formatValue(payment.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  // 12. Exportar asistencias a partidos
  const allAttendances = await db.select().from(matchAttendances);
  console.log(`Asistencias: ${allAttendances.length}`);
  
  if (allAttendances.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- ASISTENCIAS A PARTIDOS (${allAttendances.length})\n`;
    sql += `-- ============================================\n`;
    for (const att of allAttendances) {
      sql += `INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES (${formatValue(att.id)}, ${formatValue(att.organizationId)}, ${formatValue(att.matchId)}, ${formatValue(att.playerId)}, ${formatValue(att.status)}, ${formatValue(att.userId)}, ${formatValue(att.confirmedAt)}, ${formatValue(att.createdAt)}, ${formatValue(att.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  sql += `
COMMIT;

-- ============================================
-- Script completado exitosamente
-- ============================================
`;

  // Guardar archivo
  const filename = `scripts/dev-to-prod-migration.sql`;
  fs.writeFileSync(filename, sql);
  
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Script de migración generado: ${filename}`);
  console.log(`${"=".repeat(50)}`);
  console.log(`\nPara restaurar la base de datos de producción:`);
  console.log(`1. Abre el panel "Database" en Replit`);
  console.log(`2. Selecciona la base de datos de PRODUCCIÓN`);
  console.log(`3. Ve a "SQL Runner" o "Query"`);
  console.log(`4. Copia y pega el contenido del archivo: ${filename}`);
  console.log(`5. Ejecuta el script`);
}

exportAllData().catch(console.error);
