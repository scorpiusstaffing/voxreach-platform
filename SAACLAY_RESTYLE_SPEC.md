# SaaClay Dark Theme Restyle Specification for VoxReach

## Design Reference: SaaClay Template
- Deep dark navy/black background (#0A0E17, #0D1117)
- Bright cyan/blue accents (#00B4D8, #0EA5E9, #06B6D4)
- Atmospheric blue glow effects (radial gradients)
- White text for headings, muted gray for body (#E5E7EB, #9CA3AF)
- Subtle card borders with dark gradients
- Premium SaaS/AI aesthetic

## Color Palette

### Background Colors
- `bg-dark-primary`: #0A0E17 (main background)
- `bg-dark-secondary`: #0D1117 (cards, elevated surfaces)
- `bg-dark-tertiary`: #161B22 (hover states, nested elements)
- `bg-dark-border`: #21262D (borders, dividers)

### Accent Colors (Cyan/Blue)
- `accent-primary`: #00B4D8 (buttons, primary actions)
- `accent-secondary`: #0EA5E9 (links, secondary accents)
- `accent-glow`: rgba(0, 180, 216, 0.3) (glow effects)
- `accent-hover`: #22D3EE (hover states)

### Text Colors
- `text-primary`: #FFFFFF (headings, important text)
- `text-secondary`: #E5E7EB (body text)
- `text-muted`: #9CA3AF (descriptions, placeholders)
- `text-disabled`: #6B7280 (disabled states)

### Status Colors (adjust for dark theme)
- Success: #10B981 (green) with dark backgrounds
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)

## Global Effects

### Glow Effects (CSS)
```css
/* Ambient glow background */
.glow-bg {
  background: radial-gradient(ellipse at bottom, rgba(0, 180, 216, 0.15) 0%, transparent 50%);
}

/* Button glow */
.btn-glow {
  box-shadow: 0 0 20px rgba(0, 180, 216, 0.3), 0 0 40px rgba(0, 180, 216, 0.1);
}

/* Card glow on hover */
.card-glow:hover {
  box-shadow: 0 0 30px rgba(0, 180, 216, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Gradient border effect */
.gradient-border {
  background: linear-gradient(135deg, rgba(0, 180, 216, 0.3), transparent 50%);
}
```

### Card Styling
- Background: #0D1117 or #161B22
- Border: 1px solid #21262D
- Border radius: 12px (rounded-xl)
- Shadow: subtle dark shadow with optional glow
- Hover: slight border color change to cyan with glow

### Button Styling
- Primary: bg-cyan-500/600, white text, rounded-lg, hover:bg-cyan-400
- Secondary: transparent with cyan border, cyan text
- Ghost: transparent, hover:bg-dark-tertiary

## Files to Update

### 1. Tailwind Config (`packages/frontend/tailwind.config.ts`)
- Extend colors with dark theme palette
- Add custom colors for backgrounds, accents

### 2. Global CSS (`packages/frontend/src/index.css`)
- Add glow effect CSS classes
- Update body background to dark
- Add gradient backgrounds

### 3. Layout Component (`packages/frontend/src/components/Layout.tsx`)
- Dark sidebar with cyan accents
- Update navigation items styling
- Add glow effects to active items

### 4. Pages (all need full restyle):
- `Dashboard.tsx` - Stats cards, charts, tables
- `Agents.tsx` - Agent cards, create/edit modals
- `PhoneNumbers.tsx` - Number cards, provider wizard
- `Calls.tsx` - Call list, detail view
- `Campaigns.tsx` - Campaign cards
- `Login.tsx` - Dark auth page with glow
- `Register.tsx` - Dark auth page with glow
- `Tools.tsx` - Tools list, create/edit
- `Files.tsx` (if exists) - File list

### 5. App Component (`packages/frontend/src/App.tsx`)
- Update any global container backgrounds

## Implementation Notes

1. All backgrounds should be dark (bg-[#0A0E17] or bg-[#0D1117])
2. All text should be white/gray (not black)
3. Primary buttons should be cyan (not blue/purple)
4. Cards should have subtle borders and optional glow
5. Inputs should have dark backgrounds with cyan focus rings
6. Tables should have dark row backgrounds
7. Modals should be dark with cyan accents
8. Add atmospheric glow background to main content areas

## Specific Component Changes

### Sidebar (Layout.tsx)
- Background: #0D1117
- Active item: cyan accent line + cyan text
- Inactive items: gray text, hover shows white
- Logo area: white text with cyan dot accent

### Cards (all pages)
- Background: #161B22
- Border: 1px solid #21262D
- Hover: border-cyan-500/30 + subtle glow
- Rounded corners: 12px

### Buttons
- Primary: bg-cyan-500, hover:bg-cyan-400, shadow-glow
- Secondary: border-cyan-500, text-cyan-400, hover:bg-cyan-500/10
- Danger: bg-red-500/20, text-red-400, border-red-500/30

### Inputs
- Background: #0D1117
- Border: #21262D
- Focus: border-cyan-500, ring-cyan-500/20
- Text: white
- Placeholder: #6B7280

### Tables
- Header: #161B22 background
- Rows: #0D1117 with #161B22 hover
- Borders: #21262D
- Text: white/gray

### Modals
- Overlay: bg-black/70
- Content: #0D1117 background
- Border: #21262D
- Shadow: large with cyan glow option

## Test Pages
After restyling, verify these pages look good:
1. /login - Dark auth page
2. /dashboard - Stats and cards
3. /agents - Agent list and modals
4. /phone-numbers - Number list and wizard
5. /calls - Call history
6. /campaigns - Campaign management
7. /tools - Tools configuration

## Git Commit Message
```
feat: complete SaaClay dark theme restyle

- New dark navy color palette (#0A0E17, #0D1117)
- Cyan accent colors (#00B4D8) with glow effects
- Restyled all pages: Dashboard, Agents, Phone Numbers, Calls, Campaigns, Login, Register, Tools
- Updated Layout with dark sidebar and cyan navigation
- Added atmospheric glow backgrounds
- Premium SaaS aesthetic matching SaaClay template
```
