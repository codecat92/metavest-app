# Metavest — Dark Mode Design System Documentation

> Generated: 24 June 2026  
> Source: `src/theme/colors.ts`, `src/theme/spacing.ts`, `src/theme/typography.ts`, `src/components/*.tsx`

---

## 1. Color Palette — Dark Mode

### Backgrounds
| Token | Hex/RGBA | Usage |
|-------|----------|-------|
| `colors.bg.primary` | `#0E1439` | Main screen background |
| `colors.bg.deep` | `#060910` | Tab bar shell, deepest background |
| `colors.bg.elevated` | `#131B4A` | Elevated surfaces (not widely used) |

### Accent
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.accent.gold` | `#D4AF37` | Gold accent: icons, badges, academy card border |
| `colors.accent.goldLight` | `#F7E8B0` | Light gold: academy card text |
| `colors.accent.purple` | `#8B5CF6` | Primary purple: buttons, icons, avatar bg, active tabs |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.text.primary` | `#F8FAFC` | Headings, body text, prices |
| `colors.text.secondary` | `#94A3B8` | Captions, labels, descriptions |
| `colors.text.muted` | `#64748B` | Extra muted: portfolio labels, stat labels |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.semantic.positive` | `#22C55E` | Gains, success badges, buy signals |
| `colors.semantic.negative` | `#EF4444` | Losses, danger badges, sell signals |
| `colors.semantic.warning` | `#F59E0B` | Warning badges, medium risk |
| `colors.semantic.info` | `#3B82F6` | Info badges |

### Glass (Card Backgrounds)
| Elevation | Token | Value | Usage |
|:--:|-------|-------|-------|
| 1 | `colors.glass.g1` | `rgba(255,255,255,0.06)` | Lightest glass card |
| 2 | `colors.glass.g2` | `rgba(255,255,255,0.08)` | Default card background |
| 3 | `colors.glass.g3` | `rgba(255,255,255,0.12)` | Elevated cards (HomeScreen Portfolio) |
| 4 | `colors.glass.g4` | `rgba(255,255,255,0.15)` | Heaviest glass card |

### Glass Borders
| Elevation | Token | Value |
|:--:|-------|-------|
| 1-2 | `colors.glass.border` | `rgba(255,255,255,0.12)` |
| 3-4 | `colors.glass.borderStrong` | `rgba(255,255,255,0.18)` |

### Overlays
| Token | Value | Usage |
|-------|-------|-------|
| `colors.overlay.modal` | `rgba(6,9,16,0.90)` | Modal backdrop |
| `colors.overlay.backdrop` | `rgba(6,9,16,0.60)` | Light backdrop |

---

## 2. Typography

| Token | Size | Line Height | Weight | Letter Spacing | Family |
|-------|:--:|:--:|:--:|:--:|--------|
| `h1` | 36 | 44 | 800 | -1 | Manrope-Bold |
| `h2` | 24 | 32 | 800 | — | Manrope-Bold |
| `h3` | 20 | 28 | 700 | — | Manrope-Bold |
| `h4` | 18 | 24 | 700 | — | Manrope-Bold |
| `body` | 15 | 22 | 400 | — | DMSans |
| `bodyBold` | 15 | 22 | 600 | — | DMSans-SemiBold |
| `caption` | 13 | 18 | 500 | — | DMSans |
| `captionBold` | 13 | 18 | 600 | — | DMSans-Bold |
| `label` | 11 | 16 | 600 | — | DMSans-Bold |
| `price` | 36 | 44 | 800 | -1 | Manrope-Bold |
| `priceSmall` | 22 | 28 | 800 | — | Manrope-Bold |

### Font Families
| Token | Family | Usage |
|-------|--------|-------|
| `fonts.heading` | Manrope | Headings, prices, names |
| `fonts.body` | DMSans | Body text, captions, labels |

---

## 3. Spacing Tokens

| Token | px |
|-------|:--:|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 20 |
| `2xl` | 24 |
| `3xl` | 32 |
| `4xl` | 40 |

---

## 4. Border Radius Tokens

| Token | px |
|-------|:--:|
| `sm` | 10 |
| `md` | 14 |
| `lg` | 18 |
| `xl` | 24 |
| `full` | 9999 |

---

## 5. Component Styling — Dark Mode

### 5.1 GlassCard

| Elevation | Background | Border |
|:--:|-----------|--------|
| 1 | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.12)` |
| 2 (default) | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` |
| 3 | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.18)` |
| 4 | `rgba(255,255,255,0.15)` | `rgba(255,255,255,0.18)` |

**Default props:** `elevation=2`, `padding=20px`, `borderRadius=18px`, `borderWidth=1px`

### 5.2 AppButton

| Variant | Background | Border | Text Color |
|---------|-----------|--------|-----------|
| `primary` | `#8B5CF6` | transparent | `#F8FAFC` |
| `secondary` | `#D4AF37` | transparent | `#0E1439` |
| `danger` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.25)` | `#EF4444` |
| `ghost` | transparent | `rgba(255,255,255,0.12)` | `#94A3B8` |

### 5.3 Badge

| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| `success` | `rgba(34,197,94,0.12)` | `rgba(34,197,94,0.30)` | `#22C55E` |
| `danger` | `rgba(239,68,68,0.12)` | `rgba(239,68,68,0.30)` | `#EF4444` |
| `warning` | `rgba(245,158,11,0.12)` | `rgba(245,158,11,0.30)` | `#F59E0B` |
| `info` | `rgba(139,92,246,0.12)` | `rgba(139,92,246,0.30)` | `#8B5CF6` |
| `neutral` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | `#94A3B8` |

**Style:** `fontSize=11`, `fontWeight=700`, `fontFamily=DMSans-Bold`, `borderRadius=10`, `paddingH=12`, `paddingV=4`

### 5.4 AppInput

| Property | Value |
|----------|-------|
| Background | `rgba(255,255,255,0.06)` |
| Border (default) | `rgba(255,255,255,0.12)` |
| Border (error) | `#EF4444` |
| BorderRadius | 14px |
| Text color | `#F8FAFC` |
| Placeholder | `#94A3B8` |

### 5.5 BackgroundGlow (HomeScreen)

Two `RadialGradient` SVG layers:
| Gradient | Center | Radius | Color |
|----------|--------|--------|-------|
| `glowTopRight` | cx=100%, cy=0% | 60% | `rgba(42,14,66,0.35)` → `rgba(42,14,66,0)` |
| `glowBottomLeft` | cx=0%, cy=100% | 60% | `rgba(42,14,66,0.15)` → `rgba(42,14,66,0)` |

**Only shown in dark mode.** Hidden via `{isDark && <BackgroundGlow />}`.

### 5.6 Skeleton Loading

| Property | Value |
|----------|-------|
| Background | `rgba(255,255,255,0.06)` |
| Animation | Pulse opacity 0.3 ↔ 1.0 (1600ms cycle) |
| Default height | 20px |
| Default borderRadius | 14px (radius.md) |

### 5.7 MetavestAlert (Modal)

| Property | Value |
|----------|-------|
| Overlay background | `rgba(6,9,16,0.90)` |
| Card background | `#0E1439` |
| Card border | `rgba(255,255,255,0.18)` |
| Card borderRadius | 18px |

### 5.8 EmptyState

| Property | Value |
|----------|-------|
| Icon color | `#94A3B8` |
| Title color | `#94A3B8` |
| Subtitle color | `#64748B` |

### 5.9 AppHeader

| Property | Value |
|----------|-------|
| Back button bg | `rgba(255,255,255,0.06)` |
| Back button border | `rgba(255,255,255,0.12)` |
| Title color | `#F8FAFC` |

---

## 6. Screen-Specific Card Styles — Dark Mode

### 6.1 HomeScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Portfolio Card | GlassCard elevation=3 | `rgba(255,255,255,0.18)` | Gold-tinted stats |
| Quick Action buttons | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.12)` | Gold glow on active |
| Market Carousel cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | 150xW, borderRadius=18 |
| Feature Cards | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | Min height 160px |
| Academy Card | GlassCard elevation=3, gold tint | `rgba(212,175,55,0.25)` | Gold icon + border |
| News Feed cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | Height 72px, borderRadius=18 |
| MP Badge | `rgba(212,175,55,0.12)` | `rgba(212,175,55,0.35)` | Gold badge |
| Bell Button | `rgba(255,255,255,0.06)` | `rgba(139,92,246,0.20)` | Purple border |
| Sparkline SVG | Stroke: semantic | — | 122×36px |

### 6.2 PAMMScreen (Trade Menu)

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Banner Carousel | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.18)` | Height=220, borderRadius=15 |
| Broker Cards | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | Logo avatar 44px |
| Dots indicator (active) | `#8B5CF6` | — | Width=20, height=8 |
| Dots indicator (inactive) | `rgba(139,92,246,0.2)` | — | Width=8, height=8 |

### 6.3 PAMMDetailScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Info Card | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | |
| License Cards | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | Gold medal icon |
| Hero Avatar | `rgba(139,92,246,0.12)` | `rgba(139,92,246,0.25)` | 80px circle |
| Gold Buttons | `#D4AF37` | — | Dark text `#1A1A2E` |

### 6.4 SignalScreen / SignalDetailScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Signal Cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | Outer card |
| Price Card | `rgba(14,20,57,0.85)` | `rgba(139,92,246,0.20)` | Entry/TP/SL |
| Stats Grid cards | `rgba(14,20,57,0.85)` | `rgba(139,92,246,0.12)` | 2-column grid |
| Notes Card | `rgba(139,92,246,0.08)` | `rgba(139,92,246,0.15)` | Purple tint |
| Type Badge | `rgba(47,239,196,0.12)` buy / `rgba(255,75,110,0.12)` sell | Color-matched border | |
| Copy Trade Button | `#8B5CF6` | — | Full width |
| Action buttons | `rgba(255,255,255,0.05)` | — | Like/Share |

### 6.5 MarketScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Chart Card | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | 200px height |
| Stats Grid cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | Open/High/Low/Close |
| Pair buttons | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.12)` | Active: purple |
| Timeframe buttons | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.12)` | Active: `rgba(139,92,246,0.25)` |
| Chart area gradient | accent color, 0.35→0 opacity | — | SVG LinearGradient |

### 6.6 ForumScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Post Cards | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | |
| Comment Input | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.18)` | |
| Like/Reply buttons | — | — | Icon: `#94A3B8` |
| Modal Card (new post) | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | |

### 6.7 ProfileScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| Profile Card | GlassCard elevation=3 | `rgba(255,255,255,0.18)` | |
| Avatar | `#8B5CF6` | — | 72px circle |
| Camera Badge | `#22C55E` | `#0E1439` 2px | 28px circle |
| Settings Cards | GlassCard elevation=2 | `rgba(255,255,255,0.12)` | |
| Settings Icon | `rgba(139,92,246,0.12)` | — | 32px circle |
| Rank Badge | `rgba(139,92,246,0.15)` | `rgba(139,92,246,0.30)` | |
| Logout Button | `rgba(239,68,68,0.08)` | `rgba(239,68,68,0.20)` | Red border |
| Theme Toggle (active) | `#8B5CF6` | — | 52×28 pill |

### 6.8 CopyTradeScreen

| Component | Background | Border | Notes |
|-----------|-----------|--------|-------|
| MT5 Account Card | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | |
| Stat Cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | Balance/Equity/Margin |
| Position Cards | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | |
| Form Card | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | |
| Disconnect Button | `rgba(239,68,68,0.08)` | `rgba(239,68,68,0.20)` | Red text |

### 6.9 Other Screens

| Screen | Card Style |
|--------|-----------|
| **NewsScreen** | Cards: `rgba(255,255,255,0.08)` with `rgba(255,255,255,0.12)` border |
| **AcademyScreen** | Cards: GlassCard elevation=2 |
| **TradersScreen** | Cards: GlassCard elevation=2 |
| **PortfolioScreen** | Cards: GlassCard elevation=2 |
| **LoginScreen** | Input bg: `rgba(105,105,105,0.6)` (admin panel style) |
| **OTPScreen** | Code input: `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.18)` |
| **EconomicsCalendarScreen** | Event Cards: GlassCard elevation=2 |
| **BrokersScreen** | Cards: GlassCard elevation=2 |
| **NotificationsScreen** | Cards: GlassCard elevation=2 |

---

## 7. Navigation / Shell — Dark Mode

| Component | Color | Notes |
|-----------|-------|-------|
| Tab Bar background | `rgba(255,255,255,0.06)` | With blur |
| Tab Bar active tint | `#D4AF37` | Gold |
| Tab Bar inactive tint | `#94A3B8` | Gray |
| Tab Bar height | 68px | |
| Status Bar style | `light` | White icons/text |
| Screen header background | `transparent` | `headerShown: false` |

---

## 8. Chart & SVG Colors

| Element | Color |
|---------|-------|
| Chart line (up) | `#22C55E` |
| Chart line (down) | `#EF4444` |
| Chart area gradient | Accent color, 0.35 → 0 opacity |
| Tooltip background | `rgba(14,20,57,0.9)` |
| Tooltip text | Accent color |
| Grid lines (tooltip) | Accent color, dashed |
| Sparkline area (up) | `#22C55E` 0.3 → 0 |
| Sparkline area (down) | `#EF4444` 0.3 → 0 |

---

## 9. Quick Reference — Most Common Values

| Context | Value |
|---------|-------|
| Page background | `#0E1439` |
| Card background (default) | `rgba(255,255,255,0.08)` |
| Card border | `rgba(255,255,255,0.12)` |
| Card border (elevated) | `rgba(255,255,255,0.18)` |
| Card padding | 20px |
| Card borderRadius | 18px |
| Heading text | `#F8FAFC` |
| Body text | `#F8FAFC` |
| Caption text | `#94A3B8` |
| Muted label text | `#64748B` |
| Primary button | `#8B5CF6` |
| Secondary button | `#D4AF37` |
| Success/Green | `#22C55E` |
| Danger/Red | `#EF4444` |
| Warning/Amber | `#F59E0B` |
| Purple accent | `#8B5CF6` |
| Gold accent | `#D4AF37` |
| Modal overlay | `rgba(6,9,16,0.90)` |
| Page horizontal padding | 24px |
