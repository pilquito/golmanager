# Overview

GolManager is a **multi-tenant** football (soccer) team management system built for amateur teams. The application provides tools to manage players, matches, monthly payments, championship payments, and team configuration. It features a modern web interface with role-based access control, complete CRUD operations, and **complete data isolation between organizations**.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## January 14, 2026 - Multi-Tenant Architecture Implementation

**MAJOR FEATURE**: Converted entire application from single-tenant to multi-tenant architecture supporting multiple teams/organizations.

### Key Changes:
- **Organizations Table**: New central table with id, name, slug, logoUrl, isActive fields
- **Tenant Scoping**: Added organizationId column to ALL 9 data tables: users, players, matches, monthly_payments, championship_payments, match_attendances, other_payments, opponents, standings
- **Team Config**: Modified to use organizationId as filter key with auto-generated UUID primary key
- **Storage Layer**: All 32+ storage functions now filter by organizationId using AND clauses
- **API Routes**: All 64+ routes pass orgId from authenticated session to storage
- **Registration Flow**: Two-tab system - "Unirse" (join existing) or "Crear Equipo" (create new org)
- **Slug Generation**: Auto-generates from organization name with collision handling

### Security:
- Complete tenant isolation - no cross-organization data access possible
- All database queries enforce organizationId filter
- Session contains organizationId from authenticated user
- Registration atomically creates organization + admin user + team config

### Tested:
- Successfully created multiple test organizations
- Verified empty player list for new org (0 players) while original org retains 20 players
- E2E Playwright test passed for registration flow

## September 27, 2025 - Liga Hesperides Integration Security & Reliability Fixes

**CRITICAL ISSUES RESOLVED** (Architect-approved):
- **Security Vulnerability Fixed**: Removed cookies.txt with session data, enhanced .gitignore protection
- **Puppeteer Dependencies Eliminated**: Both standings and matches imports now use simple fetch() with timeout
- **Mobile-First UX Improved**: Separate clear buttons with proper endpoint alignment
- **Code Quality Enhanced**: Removed 200+ lines of unreliable HTML parsing logic  
- **Error Handling Consistent**: Clear mobile-friendly SPA limitation messaging across all endpoints
- **Timeout Protection**: AbortController with 10-second timeout prevents hanging requests

Liga Hesperides integration now provides secure, reliable mobile-friendly experience that gracefully handles SPA limitations while guiding users toward practical mobile workflows.

## September 7, 2025 - Implemented SportEasy-Style Match Management Interface

Completely redesigned the match management interface to match SportEasy app design:
- Created new SportEasyField component with green football pitch and realistic field markings
- Implemented formation selector with 14 real football formations (4-4-2, 3-5-2, etc.)
- Added MatchTabs component with 4 tabs: Information, Players, Forum, and Lineup
- Integrated saved lineups system with "Mis alineaciones" section
- Updated MatchSheet to use new tabbed interface instead of side-by-side layout
- Maintained all existing functionality while improving visual design and user experience
- Field positions now dynamically adjust based on selected formation
- Added proper SportEasy-style header with opponent information and match details

## September 6, 2025 - Removed Drag & Drop from MatchSheet Component

Removed all drag & drop functionality from the MatchSheet component:
- Removed @dnd-kit imports (DndContext, DragEndEvent, DragOverlay)
- Removed handleDragStart and handleDragEnd functions
- Removed DragOverlay component from JSX
- Removed DndContext wrapper from the component
- Maintained all other functionality including controls, lineup display, and attendance management
- The component now relies on the existing click-based LineSlot interaction system

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation schemas
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with consistent error handling
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage
- **Request Logging**: Custom middleware for API request tracking

## Database Layer
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema changes
- **Validation**: Zod schemas shared between frontend and backend

## Authentication System
- **Provider**: Replit Auth with OIDC discovery
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control (admin/user roles)
- **Security**: HTTP-only cookies with secure settings in production

## Multi-Tenant Architecture
The system uses organization-based multi-tenancy:
- **Organizations**: Central tenant entity with id, name, slug, logoUrl, isActive
- **Tenant Scoping**: All data tables include organizationId column
- **Data Isolation**: Storage layer enforces organizationId filtering on ALL queries
- **Session Context**: User session contains organizationId for request scoping

## Data Models
The system manages the following entities (all scoped by organizationId):
- **Organizations**: Tenant containers with name, slug, logo, active status
- **Users**: Authentication, role management, linked to organization
- **Players**: Team roster with positions, contact info, and status
- **Matches**: Game scheduling with scores and competition tracking
- **Monthly Payments**: Recurring player fees with payment status
- **Championship Payments**: Event-specific payments for tournaments
- **Other Payments**: Additional payment types
- **Match Attendances**: Player attendance tracking per match
- **Opponents**: External teams for match scheduling
- **Standings**: League/competition standings
- **Team Configuration**: Organization-specific settings for fees and team information

## Development Environment
- **Development Server**: Concurrent frontend (Vite) and backend (tsx) processes
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Error Handling**: Runtime error overlay in development
- **Path Aliases**: TypeScript path mapping for clean imports

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless driver with WebSocket support

## Authentication Services
- **Replit Auth**: OAuth/OIDC authentication provider
- **OpenID Client**: Standard OIDC client implementation

## UI and Styling
- **Radix UI**: Comprehensive accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Consistent icon library
- **Google Fonts**: Inter font family for typography

## Development Tools
- **Replit Integration**: Development environment plugins and tooling
- **TypeScript**: Static type checking and enhanced developer experience
- **ESLint/Prettier**: Code quality and formatting (configuration implied)

## Runtime Libraries
- **React Ecosystem**: Core React, React DOM, and related hooks
- **Form Libraries**: React Hook Form with Zod resolvers
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: clsx and tailwind-merge for conditional styling