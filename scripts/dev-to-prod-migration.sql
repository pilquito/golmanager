-- Script de migración COMPLETA de datos de desarrollo a producción
-- Generado el: 2026-01-14T21:10:47.778Z
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

-- ============================================
-- ORGANIZACIONES (8)
-- ============================================
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('default-org', 'Equipo Principal', 'equipo-principal', NULL, true, '2026-01-14T15:47:57.103Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('7c8e2001-5a1d-4c36-bcf3-5ef748476899', 'Test Team 8ONDKk', 'test-team-8ondkk', NULL, true, '2026-01-14T16:14:27.839Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('948abd71-7a17-4acb-a24b-b8a05426c25a', 'Test Team 8n3Aaj', 'test-team-8n3aaj', NULL, true, '2026-01-14T16:17:07.184Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('9c3baaaf-926c-40c5-a3ae-00ae447d1015', 'Test Team _2Fs9j', 'test-team-2fs9j', NULL, true, '2026-01-14T16:17:34.058Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('4bc821f9-c5be-4b9b-b67b-3b3baae5f381', 'Test Team Mtw5oDs8', 'test-team-mtw5ods8', NULL, true, '2026-01-14T16:19:41.649Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('5a7386d9-9b16-4bfe-b107-a33190469842', 'New Team MbOru2j3', 'new-team-mboru2j3', NULL, true, '2026-01-14T16:23:04.478Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('04e75a67-4586-48a8-8a8e-821a01587b49', 'Test Org YqN_gl', 'test-org-yqn-gl', NULL, true, '2026-01-14T18:28:17.192Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO organizations (id, name, slug, logo_url, is_active, created_at) VALUES 
('f03fb94e-371b-4050-8c44-c1c7e795a5e6', 'TestTeam1Dua', 'testteam1dua', NULL, true, '2026-01-14T18:56:41.647Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USUARIOS (21)
-- ============================================
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('f7d846b3-3de6-4fc3-a777-7cc8720ab169', 'admin', 'admin@sobrado.com', '$2b$10$1kGsAYzzZ..l5RytfXf2H.NYO1e1MWFRMTv4aUujU2OnSG5ACWIRW', 'admin', 'default-org', 'Admin', 'System', NULL, true, '2026-01-14T18:44:26.384Z', '2025-09-05T23:25:10.522Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('066a5529-8092-4475-9058-69d4fe48b3e9', 'oscar', 'oscar.omservice@gmail.com', '$2b$10$Q7CKyCrQTKFjT2CXO44hh.VuPoXlje/KFfTvnJx04b/r2X1rpwNdu', 'user', 'default-org', 'Oscar', 'Martín', 'data:image/jpeg;base64,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', true, '2025-09-07T22:55:36.924Z', '2025-09-05T23:06:55.372Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('6dc746fa-d310-4879-8066-ea610d7c9137', 'carlos.fernndez', 'carlos.fernandez@email.com', '$2b$10$MSJzUYQYvdLVAFjZdkkm5e5InG2/enu9Lg8HEBlA3hkuXi5hSkr/S', 'user', 'default-org', 'Carlos', 'Fernández', NULL, true, NULL, '2025-09-07T22:24:16.615Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('e1cf856a-c2e7-4b02-a689-2ef32f403bf2', 'miguel.rodrguez', 'miguel.rodriguez@email.com', '$2b$10$jfeKCjSLtGoNvBBU8nTtSeNfw6SylyoS/mWQ36FJ/XajMLGDhKwsu', 'user', 'default-org', 'Miguel', 'Rodríguez', NULL, true, NULL, '2025-09-07T22:24:16.745Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('4222c3fa-ae1f-4ad9-b6db-3824a2540bd9', 'alejandro.martn.reyes', 'alejandro.martín.reyes@email.com', '$2b$10$sU4cX4M3WJTh4.VX9VFr6eX.Iroa0flekSsnp44Ne1SgOMMPw/eWu', 'user', 'default-org', 'Alejandro', 'Martín Reyes', NULL, true, NULL, '2025-09-07T22:24:16.872Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('2615fa51-7b80-410b-9a1d-84ed56b8b645', 'antonio.javier.yanes.guallarte', 'antonio.javier.yanes.guallarte@email.com', '$2b$10$O3MTlOiZtuFOAmVTtjg1buur0sbeTb7eq1V5IW3NlDU6hqgLGRpJ6', 'user', 'default-org', 'Antonio', 'Javier Yanes Guallarte', NULL, true, NULL, '2025-09-07T22:24:17.002Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('9efb18df-3b00-4872-84e9-fae3cd9e9caa', 'benaylio.cruz.mendoza', 'benaylio.cruz.mendoza@email.com', '$2b$10$LIkYChkmj71juN7kmn2EqOC/ZrFxbQJ68GXu5JhbRFUmRG7/Vw6WS', 'user', 'default-org', 'Benaylio', 'Cruz Mendoza', NULL, true, NULL, '2025-09-07T22:24:17.135Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('6bacc9ee-380b-48b6-a4bd-f0f0213c6b9a', 'oliver.gonzlez.bustamacurt', 'oliver.gonzález.bustamacurt@email.com', '$2b$10$3pgpy/vNQ/jYCSm8lX/W7ueCuf2W0EmvvQh0HyGwgybLjyCdXFoci', 'user', 'default-org', 'Oliver', 'González Bustamacurt', NULL, true, NULL, '2025-09-07T22:24:17.269Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('f6897e4a-7d42-41a3-b44f-46a74069b0ef', 'yeray.rodrguez.marrero', 'yeray.rodríguez.marrero@email.com', '$2b$10$Nbr89vm94A4t0ZYDMqiXyuaczWuDFpV/ZuUJ1GUFavkT20ldmtrMy', 'user', 'default-org', 'Yeray', 'Rodríguez Marrero', NULL, true, NULL, '2025-09-07T22:24:17.404Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('1b7bab72-1235-4e26-947d-2ab4973dbd53', 'egobar.alexander.gallardo.medina', 'egobar.alexander.gallardo.medina@email.com', '$2b$10$qUZMbiE8ejIQk7QlyEQG8uqt5lrwxWywxxbe90XfdO6hmWIxCRvKm', 'user', 'default-org', 'Egobar', 'Alexander Gallardo Medina', NULL, true, NULL, '2025-09-07T22:24:17.532Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('ccfc73c1-4381-432a-a3cf-66d1d6484a1d', 'daniel.csar.vera.vobsa', 'daniel.césar.vera.ávobsa@email.com', '$2b$10$IY.CvorZRt1x30X/z0PFUOTxtZxm1XdalwZNqwiuWIdJoBSnw6nv.', 'user', 'default-org', 'Daniel', 'César Vera Ávobsa', NULL, true, NULL, '2025-09-07T22:24:17.665Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('a0a00fb8-68ed-47a3-a829-b7456cd0b7d5', 'scar.jess.martn.castiola', 'óscar.jesús.martín.castiola@email.com', '$2b$10$L9QK1j72uRSlhHUiUAN1f.k498KDi/DKFGIDX0fda8FA63srJI8li', 'user', 'default-org', 'Óscar', 'Jesús Martín Castiola', NULL, true, NULL, '2025-09-07T22:24:17.793Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('0f02b122-306f-4dff-bac2-689e15dc1c5d', 'johny.zebenzui.marn.socorro', 'johny.zebenzui.marón.socorro@email.com', '$2b$10$gvXGGz.CtFidL7GHAfzpt.C5g70pIOnGhL8FQSty00f8trqIGdR8u', 'user', 'default-org', 'Johny', 'Zebenzui Marón Socorro', NULL, true, NULL, '2025-09-07T22:24:17.925Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('26c97310-8777-41b6-9d86-80d30dc22a5a', 'santiago.delgado.fleitas', 'santiago.delgado.fleitas@email.com', '$2b$10$6u1rDRaZgLTsHYS9gi.jM.ehVj8r5Lw5Nm4GIFhWusXXPNjXQtFAC', 'user', 'default-org', 'Santiago', 'Delgado Fleitas', NULL, true, NULL, '2025-09-07T22:24:18.065Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('c46c227c-75f5-4384-a1ec-aecc01fae254', 'nicols.yeray.fernndez.rodrguez', 'nicolás.yeray.fernández.rodríguez@email.com', '$2b$10$ImqhnIfu92m/ol0zF3pqQOa4lr5h6ubFLn/PW1G3UrmwFGFJg7xZ.', 'user', 'default-org', 'Nicolás', 'Yeray Fernández Rodríguez', NULL, true, NULL, '2025-09-07T22:24:18.195Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('292762b7-27bd-4e08-8162-a01d034b99ef', 'zebenzui.aguilar.yanes', 'zebenzui.aguilar.yanes@email.com', '$2b$10$1h8pYU8lLmE10uM/x6GksefrW3jj/tWmbpYG7AwbGIRJ3pHka3rvW', 'user', 'default-org', 'Zebenzui', 'Aguilar Yanes', NULL, true, NULL, '2025-09-07T22:24:18.334Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('f85452aa-b618-454a-bcd8-7fbde428f645', 'rayco.plasencia', 'rayco.plasencia@email.com', '$2b$10$gC0dEsuEfumgiBbOW3PmvO5HAXZRela1rmi5dGI23m1YVAHDooM5u', 'user', 'default-org', 'Rayco', 'Plasencia', NULL, true, NULL, '2025-09-07T22:24:18.474Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('9aba9649-4776-4748-8832-02909bf50a6d', 'david.aluzey.fuentes.chvez', 'david.aluzey.fuentes.chávez@email.com', '$2b$10$GCzpRSMGjff.7PeZUt6S3uAvB1dZD9I1SaFPRN7F1Ke7MDbf49zmu', 'user', 'default-org', 'David', 'Aluzey Fuentes Chávez', NULL, true, NULL, '2025-09-07T22:24:18.628Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('c3c5ec08-1a7a-473b-8ff5-5d73e28deea5', 'tinerfe.miguel.palmero.hernndez', 'tinerfe.miguel.palmero.hernández@email.com', '$2b$10$ICJ2Tpml41zYF10LkBSPs.EyXKqxg4ROYNhkvMZQr/1rvyHm1gy9y', 'user', 'default-org', 'Tinerfe', 'Miguel Palmero Hernández', NULL, true, NULL, '2025-09-07T22:24:18.776Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('434d579c-f787-47a8-963d-2a4bce2eb5c4', 'admin.jugador.temporal', 'admin@temp.com', '$2b$10$GT/KftWbalcs/UF71Qn.zedMpjASP1dMfGnq3OelG8NViwHPYpt82', 'user', 'default-org', 'Admin', 'Jugador (Temporal)', NULL, true, NULL, '2025-09-07T22:24:18.904Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, email, password, role, organization_id, first_name, last_name, profile_image_url, is_active, last_access, created_at) VALUES 
('e3b1ad44-f301-4802-8d96-7335dc439e9a', 'diego.febles', 'diego@afsobradillo.com', '$2b$10$NsUr6Sxq5fPtts.xOGcbPOq45lEDhumSFs26RdXC.h9l7X1kD0liq', 'user', 'default-org', 'Diego', 'Febles', NULL, true, NULL, '2025-09-27T09:05:00.199Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEAM_CONFIG (4)
-- ============================================
INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id, created_at, updated_at) VALUES 
('team_config', 'AF. SOBRADILLO', '#dc2626,#ffffff', '/objects/uploads/logos_1757111557958_324694511.jpg', '15.00', 5, '', '', '/objects/uploads/backgrounds_1757110973407_317966097.png', false, false, '11', 'https://ligahesperides.mygol.es/tournaments/21/matches', 'https://ligahesperides.mygol.es/tournaments/21', 'default-org', '2025-09-05T20:25:55.567Z', '2025-09-05T20:25:55.567Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id, created_at, updated_at) VALUES 
('7793ff63-894a-4690-ae38-880741af3d41', 'New Team MbOru2j3', '#dc2626,#ffffff', NULL, '15.00', 1, NULL, NULL, '/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png', true, true, '11', NULL, NULL, '5a7386d9-9b16-4bfe-b107-a33190469842', '2026-01-14T16:23:04.627Z', '2026-01-14T16:23:04.627Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id, created_at, updated_at) VALUES 
('369128cc-4c5d-424a-b8e6-e209fff4e2ac', 'Test Org YqN_gl', '#dc2626,#ffffff', NULL, '15.00', 1, NULL, NULL, '/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png', true, true, '11', NULL, NULL, '04e75a67-4586-48a8-8a8e-821a01587b49', '2026-01-14T18:28:17.337Z', '2026-01-14T18:28:17.337Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO team_config (id, team_name, team_colors, logo_url, monthly_fee, payment_due_day, contact_email, contact_phone, background_image_url, player_stats_enabled, my_competition_enabled, football_type, liga_hesperides_matches_url, liga_hesperides_standings_url, organization_id, created_at, updated_at) VALUES 
('e16e3df7-be07-47dc-8e1e-f571909fb906', 'TestTeam1Dua', '#dc2626,#ffffff', NULL, '15.00', 1, NULL, NULL, '/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png', true, true, '11', NULL, NULL, 'f03fb94e-371b-4050-8c44-c1c7e795a5e6', '2026-01-14T18:56:41.805Z', '2026-01-14T18:56:41.805Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- JUGADORES (20)
-- ============================================
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('6bf3eaca-7de3-4221-8164-819093903e8f', 'default-org', 'Carlos Fernández', 'carlos.fernandez@email.com', NULL, 'Mediocampista', 10, NULL, NULL, NULL, NULL, '2025-09-05T16:31:40.769Z', '2025-09-05T16:31:40.769Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('17a390f6-35b6-4282-b25f-0855ee7bf83b', 'default-org', 'Miguel Rodríguez', 'miguel.rodriguez@email.com', NULL, 'Delantero', 7, NULL, NULL, NULL, NULL, '2025-09-05T16:31:42.601Z', '2025-09-05T16:31:42.601Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('1b5df72d-0f62-48f4-bee8-fc73be776789', 'default-org', 'Alejandro Martín Reyes', 'alejandro.martín.reyes@email.com', NULL, 'Delantero', 14, NULL, NULL, NULL, NULL, '2025-09-05T16:56:26.628Z', '2025-09-05T16:56:26.628Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('8f4182d4-42d3-46af-897d-c8c0286be938', 'default-org', 'Antonio Javier Yanes Guallarte', 'antonio.javier.yanes.guallarte@email.com', NULL, 'Defensa', 15, NULL, NULL, NULL, NULL, '2025-09-05T16:56:27.208Z', '2025-09-05T16:56:27.208Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('ff6fa071-978e-4d44-8a8a-237905815347', 'default-org', 'Benaylio Cruz Mendoza', 'benaylio.cruz.mendoza@email.com', NULL, 'Defensa', 6, NULL, NULL, NULL, NULL, '2025-09-05T16:56:27.907Z', '2025-09-05T16:56:27.907Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('18611de3-b1c7-4d67-9aab-ab2b965d8e11', 'default-org', 'Oliver González Bustamacurt', 'oliver.gonzález.bustamacurt@email.com', NULL, 'Portero', 1, NULL, NULL, NULL, NULL, '2025-09-05T16:56:28.461Z', '2025-09-05T16:56:28.461Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('a0b67d97-1e4f-439d-ba61-f2290cdab9e2', 'default-org', 'Yeray Rodríguez Marrero', 'yeray.rodríguez.marrero@email.com', NULL, 'Defensa', 3, NULL, NULL, NULL, NULL, '2025-09-05T16:56:29.206Z', '2025-09-05T16:56:29.206Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('a93d56d5-c909-4c97-84b3-f6d9ac9e303d', 'default-org', 'Egobar Alexander Gallardo Medina', 'egobar.alexander.gallardo.medina@email.com', NULL, 'Mediocampista', 19, NULL, NULL, NULL, NULL, '2025-09-05T16:56:29.838Z', '2025-09-05T16:56:29.838Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('92cf4ad8-ee32-47de-ac06-63d20d56b1f1', 'default-org', 'Daniel César Vera Ávobsa', 'daniel.césar.vera.ávobsa@email.com', NULL, 'Delantero', 12, NULL, NULL, NULL, NULL, '2025-09-05T16:56:30.465Z', '2025-09-05T16:56:30.465Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('29ba728b-f652-42c2-a070-f6fd213a2a55', 'default-org', 'Óscar Jesús Martín Castiola', 'óscar.jesús.martín.castiola@email.com', NULL, 'Delantero', 9, NULL, NULL, NULL, NULL, '2025-09-05T16:56:31.036Z', '2025-09-05T16:56:31.036Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('da65e576-d0fe-43b1-9726-54a2ccc0cc41', 'default-org', 'Johny Zebenzui Marón Socorro', 'johny.zebenzui.marón.socorro@email.com', NULL, 'Mediocampista', 4, NULL, NULL, NULL, NULL, '2025-09-05T16:56:31.678Z', '2025-09-05T16:56:31.678Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('06d927a3-0e07-469a-a7af-6579950ab69a', 'default-org', 'Santiago Delgado Fleitas', 'santiago.delgado.fleitas@email.com', NULL, 'Delantero', 10, NULL, NULL, NULL, NULL, '2025-09-05T16:56:32.261Z', '2025-09-05T16:56:32.261Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('70df465f-ca44-419a-95fb-73ae25d036e1', 'default-org', 'Nicolás Yeray Fernández Rodríguez', 'nicolás.yeray.fernández.rodríguez@email.com', NULL, 'Mediocampista', 11, NULL, NULL, NULL, NULL, '2025-09-05T16:56:32.854Z', '2025-09-05T16:56:32.854Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('b3422b8f-47d6-46e4-9dbc-0da8da0a5abf', 'default-org', 'Zebenzui Aguilar Yanes', 'zebenzui.aguilar.yanes@email.com', NULL, 'Mediocampista', 7, NULL, NULL, NULL, NULL, '2025-09-05T16:56:33.441Z', '2025-09-05T16:56:33.441Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('d5566bfb-7900-44ed-b574-7c6241e40e15', 'default-org', 'Rayco Plasencia', 'rayco.plasencia@email.com', NULL, 'Defensa', 5, NULL, NULL, NULL, NULL, '2025-09-05T16:56:34.022Z', '2025-09-05T16:56:34.022Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('6008fd6b-d22c-4fc2-9533-c5ad2a8fbd86', 'default-org', 'David Aluzey Fuentes Chávez', 'david.aluzey.fuentes.chávez@email.com', NULL, 'Delantero', 16, NULL, NULL, NULL, NULL, '2025-09-05T16:56:34.641Z', '2025-09-05T16:56:34.641Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('b18dc9ab-93b8-49b0-b697-8fb3fc04a38d', 'default-org', 'Tinerfe Miguel Palmero Hernández', 'tinerfe.miguel.palmero.hernández@email.com', NULL, 'Defensa', 2, NULL, NULL, NULL, NULL, '2025-09-05T16:56:35.207Z', '2025-09-05T16:56:35.207Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('f7d846b3-3de6-4fc3-a777-7cc8720ab169', 'default-org', 'Admin Jugador (Temporal)', 'admin@temp.com', NULL, 'Mediocampista', 99, NULL, NULL, NULL, NULL, '2025-09-07T17:50:35.133Z', '2025-09-07T17:50:35.133Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('47156a55-fb9c-4f6c-8455-b64c365992a1', 'default-org', 'Diego Febles', 'diego@afsobradillo.com', NULL, 'Portero', 1, NULL, 'Lleven perras pa las cañas', NULL, NULL, '2025-09-27T09:05:00.061Z', '2025-09-27T09:05:00.061Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO players (id, organization_id, name, email, phone, position, jersey_number, status, tagline, is_captain, user_id, created_at, updated_at) VALUES 
('8e0b6483-ff44-432d-8dce-e191c82b174c', 'default-org', 'Oscar Martín', 'oscar.omservice@gmail.com', NULL, 'Delantero', 8, NULL, NULL, NULL, NULL, '2025-09-05T16:56:25.875Z', '2025-09-05T16:56:25.875Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PARTIDOS (1)
-- ============================================
INSERT INTO matches (id, organization_id, date, opponent, home_score, away_score, status, competition, is_home, notes, location, created_at, updated_at) VALUES 
('548e3f22-69cb-4c88-bd79-8d654c09bc9a', 'default-org', '2025-09-15T18:00:00.000Z', 'Real Deportivo', NULL, NULL, 'scheduled', 'Liga Local', NULL, 'Primer partido de la temporada', NULL, '2025-09-05T16:32:19.635Z', '2025-09-05T16:32:19.635Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PAGOS MENSUALES (20)
-- ============================================
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('d0f83f8f-7f8a-4aa8-ac73-b56454fce184', 'default-org', '47156a55-fb9c-4f6c-8455-b64c365992a1', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:04.936Z', '2026-01-14T13:36:04.936Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('744e12b9-252d-4299-8b3e-f2c8e17196de', 'default-org', 'f7d846b3-3de6-4fc3-a777-7cc8720ab169', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:04.969Z', '2026-01-14T13:36:04.969Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('72753964-0fe6-4423-b5c0-512d7d29b0c1', 'default-org', 'b18dc9ab-93b8-49b0-b697-8fb3fc04a38d', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:04.993Z', '2026-01-14T13:36:04.993Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('92314124-1f2c-4fa4-bd63-cbd3137789ba', 'default-org', '6008fd6b-d22c-4fc2-9533-c5ad2a8fbd86', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.017Z', '2026-01-14T13:36:05.017Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('bff793d6-ef19-4ca7-8a4e-d48005983bab', 'default-org', 'd5566bfb-7900-44ed-b574-7c6241e40e15', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.041Z', '2026-01-14T13:36:05.041Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('f71a5707-5548-4a66-9c72-6d0d9adcbda3', 'default-org', 'b3422b8f-47d6-46e4-9dbc-0da8da0a5abf', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.066Z', '2026-01-14T13:36:05.066Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('81524c7a-b28b-4877-88bb-23442686d5ca', 'default-org', '70df465f-ca44-419a-95fb-73ae25d036e1', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.089Z', '2026-01-14T13:36:05.089Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('c242add4-de2f-4535-9b16-c0a0cbd48db8', 'default-org', '06d927a3-0e07-469a-a7af-6579950ab69a', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.113Z', '2026-01-14T13:36:05.113Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('751cef4b-163f-4077-bccf-8f8a31eaa7c5', 'default-org', 'da65e576-d0fe-43b1-9726-54a2ccc0cc41', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.137Z', '2026-01-14T13:36:05.137Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('f43d55dc-43e3-40b8-b54d-200b9d5cf6ec', 'default-org', '29ba728b-f652-42c2-a070-f6fd213a2a55', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.161Z', '2026-01-14T13:36:05.161Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('5284fa75-3e6e-42f2-9b57-d89b7a40de86', 'default-org', '92cf4ad8-ee32-47de-ac06-63d20d56b1f1', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.184Z', '2026-01-14T13:36:05.184Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('91160c62-97b5-4ecd-b821-8b0011db729f', 'default-org', 'a93d56d5-c909-4c97-84b3-f6d9ac9e303d', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.207Z', '2026-01-14T13:36:05.207Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('bbe2d7db-fa13-49c5-925f-bf07eccc33ea', 'default-org', 'a0b67d97-1e4f-439d-ba61-f2290cdab9e2', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.229Z', '2026-01-14T13:36:05.229Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('be8820fe-5fab-41b5-80c5-27ea02c17c7d', 'default-org', '18611de3-b1c7-4d67-9aab-ab2b965d8e11', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.251Z', '2026-01-14T13:36:05.251Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('c86f4f2c-b801-407c-95e2-d51f5070b425', 'default-org', 'ff6fa071-978e-4d44-8a8a-237905815347', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.274Z', '2026-01-14T13:36:05.274Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('34e7d54f-3f72-41b6-8581-bd70951c4639', 'default-org', '8f4182d4-42d3-46af-897d-c8c0286be938', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.298Z', '2026-01-14T13:36:05.298Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('555405f2-f03b-4388-8055-b4e397d6848b', 'default-org', '1b5df72d-0f62-48f4-bee8-fc73be776789', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.321Z', '2026-01-14T13:36:05.321Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('3b068074-39e0-4afa-a955-c189eb5aa260', 'default-org', '8e0b6483-ff44-432d-8dce-e191c82b174c', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.344Z', '2026-01-14T13:36:05.344Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('bc85b282-fbae-4507-b53f-8443d141f868', 'default-org', '17a390f6-35b6-4282-b25f-0855ee7bf83b', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.368Z', '2026-01-14T13:36:05.368Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO monthly_payments (id, organization_id, player_id, month, year, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('f68f7639-aa7a-463c-aebd-f925cdd53c26', 'default-org', '6bf3eaca-7de3-4221-8164-819093903e8f', '2026-01', NULL, '15.00', 'pending', NULL, 'Pago automático generado para 2026-01', '2026-01-14T13:36:05.391Z', '2026-01-14T13:36:05.391Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PAGOS CAMPEONATO (1)
-- ============================================
INSERT INTO championship_payments (id, organization_id, player_id, championship_name, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('c6d10ec7-0fa7-4b30-a3f5-79f396b7a995', 'default-org', NULL, NULL, '50.00', 'paid', NULL, 'Pago inscripción partido vs Real Deportivo', '2025-09-05T16:32:31.624Z', '2025-09-05T16:32:31.624Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- OTROS PAGOS (1)
-- ============================================
INSERT INTO other_payments (id, organization_id, player_id, concept, amount, status, paid_at, notes, created_at, updated_at) VALUES 
('d299919b-a217-4897-8e02-cdb6227434ba', 'default-org', NULL, 'Compra de balones', '25.00', NULL, NULL, 'Compra de 2 balones de fútbol para entrenamientos', '2025-09-05T16:32:34.059Z', '2025-09-05T16:32:34.059Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ASISTENCIAS A PARTIDOS (18)
-- ============================================
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('860dd75a-157f-4257-a6a7-b464ec44f955', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '6008fd6b-d22c-4fc2-9533-c5ad2a8fbd86', '2025-09-07T19:08:58.513Z', '2025-09-06T10:27:17.807Z', '2025-09-07T19:08:58.513Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('bb8a54df-4a9c-46cf-b785-e6fac9baf035', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'b3422b8f-47d6-46e4-9dbc-0da8da0a5abf', '2025-09-07T19:08:59.069Z', '2025-09-06T10:27:20.840Z', '2025-09-07T19:08:59.069Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('5cbd908b-6732-4d2d-83e7-66925ce48cbe', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'd5566bfb-7900-44ed-b574-7c6241e40e15', '2025-09-07T19:08:59.856Z', '2025-09-06T10:27:19.194Z', '2025-09-07T19:08:59.856Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('8e9c3b94-226d-4420-8177-91345c3139b0', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '70df465f-ca44-419a-95fb-73ae25d036e1', '2025-09-07T19:09:00.412Z', '2025-09-06T10:27:22.023Z', '2025-09-07T19:09:00.412Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('8cb6da08-474b-4d17-aa7e-3ae504ae43fa', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '06d927a3-0e07-469a-a7af-6579950ab69a', '2025-09-07T19:09:01.049Z', '2025-09-06T10:27:23.151Z', '2025-09-07T19:09:01.049Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('678ca3e7-6d6e-4c56-a29c-7961cc5ad882', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'da65e576-d0fe-43b1-9726-54a2ccc0cc41', '2025-09-07T19:09:02.156Z', '2025-09-06T10:27:24.075Z', '2025-09-07T19:09:02.156Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('d4eef737-3711-435e-a990-1ec2b1162f71', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '29ba728b-f652-42c2-a070-f6fd213a2a55', '2025-09-07T19:09:02.582Z', '2025-09-06T10:41:15.272Z', '2025-09-07T19:09:02.582Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('dcd980e7-a25d-4507-9891-0446eb066531', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '92cf4ad8-ee32-47de-ac06-63d20d56b1f1', '2025-09-07T19:09:03.030Z', '2025-09-06T10:41:11.727Z', '2025-09-07T19:09:03.030Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('cc90b5aa-f1a8-43e2-9d30-4f1c77a9be89', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'confirmed', '17a390f6-35b6-4282-b25f-0855ee7bf83b', '2025-09-06T10:41:03.313Z', '2025-09-06T10:41:03.325Z', '2025-09-06T10:41:03.325Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('96e1a301-6ae0-4000-9b53-19692effaf3a', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'confirmed', '1b5df72d-0f62-48f4-bee8-fc73be776789', '2025-09-06T10:41:04.804Z', '2025-09-06T10:41:04.815Z', '2025-09-06T10:41:04.815Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('67c46b42-cf3d-4ecd-9f4e-6b1dec5f4ded', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'confirmed', '8f4182d4-42d3-46af-897d-c8c0286be938', '2025-09-06T10:41:06.395Z', '2025-09-06T10:41:06.407Z', '2025-09-06T10:41:06.407Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('ea990765-ec87-4542-94a3-1fc067fa3c3b', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'a93d56d5-c909-4c97-84b3-f6d9ac9e303d', '2025-09-07T19:09:04.535Z', '2025-09-06T10:41:10.776Z', '2025-09-07T19:09:04.535Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('044ec60c-fea9-4d11-bbcf-915990644f27', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'a0b67d97-1e4f-439d-ba61-f2290cdab9e2', '2025-09-07T19:09:05.650Z', '2025-09-06T10:41:09.462Z', '2025-09-07T19:09:05.650Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('21b8f4ff-495c-4152-9be2-fa816f33382e', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', '18611de3-b1c7-4d67-9aab-ab2b965d8e11', '2025-09-07T19:09:06.151Z', '2025-09-06T10:41:08.560Z', '2025-09-07T19:09:06.151Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('ee81b006-299a-41f4-a784-32502c86dfc3', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'ff6fa071-978e-4d44-8a8a-237905815347', '2025-09-07T19:09:07.314Z', '2025-09-06T10:41:07.274Z', '2025-09-07T19:09:07.314Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('a9a52e8e-bc36-4f73-822f-7953d762ad62', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'confirmed', '8e0b6483-ff44-432d-8dce-e191c82b174c', '2025-09-07T22:55:32.434Z', '2025-09-05T23:15:37.688Z', '2025-09-07T22:55:32.434Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('8fa50c7b-9a20-4c47-b8a5-fd99779ea982', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'confirmed', '6bf3eaca-7de3-4221-8164-819093903e8f', '2025-09-06T13:36:09.915Z', '2025-09-06T10:41:02.062Z', '2025-09-06T13:36:09.915Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO match_attendances (id, organization_id, match_id, player_id, status, user_id, confirmed_at, created_at, updated_at) VALUES 
('33a45243-2789-4889-8271-7971a5cb5349', 'default-org', '548e3f22-69cb-4c88-bd79-8d654c09bc9a', NULL, 'pending', 'b18dc9ab-93b8-49b0-b697-8fb3fc04a38d', '2025-09-07T19:08:45.103Z', '2025-09-06T10:27:12.022Z', '2025-09-07T19:08:45.103Z')
ON CONFLICT (id) DO NOTHING;


COMMIT;

-- ============================================
-- Script completado exitosamente
-- ============================================
