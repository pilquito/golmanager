# GolManager

Sistema de gestión para equipos de fútbol amateur con arquitectura multi-tenant.

## Características

- **Multi-Tenant**: Múltiples equipos/organizaciones con aislamiento completo de datos
- **Gestión de Jugadores**: Roster con posiciones, estadísticas, fotos y contacto
- **Partidos**: Programación, resultados, asistencia y alineaciones
- **Pagos**: Control de cuotas mensuales, pagos de campeonatos y otros pagos
- **Importación Liga Hesperides**: Análisis de capturas de pantalla con IA para importar datos
- **Panel de Administración**: Gestión de organizaciones, usuarios y base de datos

## Tecnologías

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: Email/password con sesiones seguras
- **Almacenamiento**: Object Storage compatible con S3

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- (Opcional) S3-compatible storage para archivos

## Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/golmanager.git
cd golmanager

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
npm run db:push

# Iniciar servidor de desarrollo
npm run dev
```

## Despliegue en VPS

Ver [DEPLOY.md](./DEPLOY.md) para instrucciones completas de despliegue con Docker.

## Estructura del Proyecto

```
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilidades
├── server/              # Backend Express
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Capa de acceso a datos
│   └── auth.ts          # Autenticación
├── shared/              # Código compartido
│   └── schema.ts        # Esquema de base de datos y tipos
└── docker-compose.yml   # Configuración Docker
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

### Jugadores
- `GET /api/players` - Listar jugadores
- `POST /api/players` - Crear jugador
- `PATCH /api/players/:id` - Actualizar jugador
- `DELETE /api/players/:id` - Eliminar jugador

### Partidos
- `GET /api/matches` - Listar partidos
- `POST /api/matches` - Crear partido
- `PATCH /api/matches/:id` - Actualizar partido
- `DELETE /api/matches/:id` - Eliminar partido

### Pagos
- `GET /api/monthly-payments` - Pagos mensuales
- `GET /api/championship-payments` - Pagos de campeonatos
- `GET /api/other-payments` - Otros pagos

### Administración
- `GET /api/admin/organizations` - Listar organizaciones
- `GET /api/admin/database/stats` - Estadísticas de BD
- `GET /api/admin/database/export` - Exportar backup

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `SESSION_SECRET` | Secreto para sesiones (generar con `openssl rand -hex 32`) |
| `S3_ENDPOINT` | Endpoint de almacenamiento S3 |
| `S3_ACCESS_KEY` | Clave de acceso S3 |
| `S3_SECRET_KEY` | Clave secreta S3 |
| `S3_BUCKET` | Nombre del bucket |

## Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

MIT - Ver [LICENSE](./LICENSE)
