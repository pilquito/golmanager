# GolManager Design Guidelines

## Design Approach
**Reference-Based:** SportEasy + TeamSnap aesthetic with professional sports app treatment. Mobile-first utility interface with clean data hierarchy and action-oriented design.

## Typography System
- **Primary Font:** Inter (Google Fonts) - modern, highly legible for data-heavy interfaces
- **Hierarchy:**
  - Hero/Page Headers: text-2xl to text-3xl, font-bold
  - Section Headers: text-lg, font-semibold
  - Body/Data: text-base, font-normal
  - Meta/Labels: text-sm, font-medium
  - Captions: text-xs, font-normal
- **Spanish Language Optimization:** Proper line-height (1.5-1.6) to accommodate Spanish text length variations

## Layout System
**Spacing Units:** Tailwind 4, 6, 8, 12, 16 for primary spacing (p-4, gap-6, mb-8, etc.)
- Mobile: p-4, gap-4 baseline
- Desktop: p-6 to p-8, gap-6 to gap-8
- Component-specific: Use 12 and 16 for cards, sections

## Component Library

### Navigation
**Mobile-first Bottom Tab Bar:**
- Fixed bottom navigation with 4-5 primary actions
- Icons + labels, orange highlight for active state
- Backdrop blur effect (backdrop-blur-lg bg-white/90)

**Top Bar:**
- Organization selector (prominent, easy access)
- Notifications bell
- User avatar/menu
- Sticky positioning on scroll

### Tenant Management Page

**Page Structure:**
1. **Header Section** (no hero image for utility pages)
   - Page title "Gestionar Organizaciones"
   - Quick stats row (total teams, active players, upcoming matches)
   - Primary CTA "Nueva Organización"

2. **Organization Cards Grid**
   - Mobile: Single column, full-width cards
   - Desktop: 2-column grid (grid-cols-1 md:grid-cols-2)
   - Card components include:
     - Organization logo/avatar (left-aligned)
     - Name + role badge
     - Quick stats (teams, members count)
     - Action menu (3-dot icon, right-aligned)
     - Border with orange accent on hover/active

3. **Organization Selector Component**
   - Dropdown/modal hybrid (mobile-friendly)
   - Search bar at top
   - Organization list with:
     - Avatar + name + member count
     - Radio selection indicator
     - Dividers between items
   - "Crear Nueva" option at bottom with plus icon
   - Confirm button with orange background

### Data Display Patterns
**List Items:**
- Avatar/icon left (40px-48px size)
- Primary text + metadata stack
- Action button/chevron right
- Subtle borders, no heavy shadows
- Touch-friendly spacing (min-height: 56px mobile)

**Stats Cards:**
- Icon + number + label vertical stack
- Centered alignment
- Light background (gray-50)
- Orange accent for primary metric

### Forms & Inputs
- Floating labels (Material Design style)
- Orange focus rings (ring-orange-500)
- Helper text below inputs (text-sm text-gray-600)
- Full-width on mobile, constrained on desktop (max-w-md)

### Buttons
**Primary (Orange):**
- bg-orange-500 base
- Rounded corners (rounded-lg)
- Font semibold
- Generous padding (px-6 py-3)

**Secondary:**
- Border with orange outline
- Transparent background
- Same padding as primary

**Icon Buttons:**
- Circular or square with rounded corners
- Tap target minimum 44px × 44px

### Cards
- Rounded corners (rounded-xl)
- Subtle shadow (shadow-sm)
- White background
- Border on hover (border-orange-200)
- Padding: p-4 mobile, p-6 desktop

## Images
**No hero images** for utility pages like tenant management. Use:
- Organization/team logos (user-uploaded, circular avatars)
- Player headshots (circular, 40-48px thumbnails)
- Empty state illustrations (simple, orange-tinted SVG illustrations)
- Icon-based graphics for stats and features

## Interaction Patterns
- **Pull to refresh** on mobile lists
- **Swipe actions** on list items (reveal delete/edit)
- **Slide-up modals** for forms (mobile)
- **Inline editing** for quick updates
- **Optimistic UI updates** for immediate feedback

## Mobile-First Breakpoints
- Base (mobile): < 768px - single column, stacked
- Tablet: 768px - 2 columns where appropriate
- Desktop: 1024px+ - max-w-7xl container, 2-3 column grids

## Empty States
- Icon (gray-300 tint)
- Headline "No hay organizaciones"
- Description text
- Primary CTA "Crear Primera Organización"
- Centered layout with max-w-sm

## Visual Hierarchy Principles
1. Orange draws attention to primary actions only
2. Gray scale for data hierarchy
3. White space separates logical groups
4. Icons reinforce meaning, not decoration
5. Consistent alignment creates scanning patterns