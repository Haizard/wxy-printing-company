# UI Design System — iOS Glassmorphism (Light, Translucent)

## 1. Design intent
The app should feel indistinguishable from a **native iOS app running on a large iPad / macOS-style desktop**, not "a website." Every surface — page background, cards, forms, buttons, modals, nav bars — uses translucent, frosted-glass layers over a soft light background. **No black or dark backgrounds anywhere in the default theme.** A dark-mode variant may exist later but is not part of MVP scope; if built, it must still avoid pure black (`#000`) and use iOS's dark-glass grays instead.

## 2. Color tokens

### Background (never dark/black)
```
--bg-base:        #F2F4F8   /* app canvas, very light cool gray */
--bg-gradient-1:  #EAF1FB   /* soft blue tint, top-left */
--bg-gradient-2:  #F7EFFB   /* soft lavender tint, bottom-right */
--bg-app: linear-gradient(160deg, var(--bg-gradient-1) 0%, var(--bg-base) 45%, var(--bg-gradient-2) 100%);
```
The base app background is always this soft gradient — it's what makes the glass cards "float."

### Glass surface layers
```
--glass-fill:        rgba(255,255,255,0.55)   /* default card */
--glass-fill-strong:  rgba(255,255,255,0.72)   /* modals, sheets, nav bars */
--glass-fill-subtle:  rgba(255,255,255,0.35)   /* nested/secondary cards */
--glass-border:       rgba(255,255,255,0.6)    /* 1px hairline on top edge */
--glass-shadow:        0 8px 32px rgba(31,38,135,0.10)
--glass-blur:           18px                    /* backdrop-filter: blur(var(--glass-blur)) */
```

### Accent / brand
```
--accent-primary:   #FF5A3C   /* WXY red-orange, from source branding */
--accent-secondary: #FFB020   /* WXY gold/amber */
--accent-tertiary:  #2E7DFF   /* iOS system blue, for links/actions/selected states */
--accent-success:   #34C759   /* iOS green */
--accent-warning:   #FF9F0A   /* iOS orange */
--accent-danger:    #FF3B30   /* iOS red */
```

### Text
```
--text-primary:    #1C1C1E   /* near-black, only for text, never as a background */
--text-secondary:  #6E6E73
--text-tertiary:   #A0A0A5
--text-on-accent:  #FFFFFF
```

## 3. Materials (iOS "Vibrancy" layers)
Define reusable CSS classes matching iOS material levels:
- `.material-ultrathin` → blur 8px, fill `rgba(255,255,255,0.25)` — for overlays on images.
- `.material-thin` → blur 14px, fill `rgba(255,255,255,0.45)` — secondary cards.
- `.material-regular` → blur 18px, fill `rgba(255,255,255,0.55)` — **default card material.**
- `.material-thick` → blur 24px, fill `rgba(255,255,255,0.72)` — nav bars, tab bars, sheets/modals.
- `.material-chrome` → blur 30px, fill `rgba(255,255,255,0.85)` — top-level app chrome (header, bottom tab bar) so content scrolling underneath stays legible.

Every glass surface gets: `border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); border-radius: var(--radius-*)`.

## 4. Radius scale (iOS "continuous corner" feel)
```
--radius-sm:  10px   /* chips, small buttons */
--radius-md:  16px   /* inputs, list rows */
--radius-lg:  22px   /* cards */
--radius-xl:  28px   /* modals, sheets, hero cards */
--radius-pill: 999px /* segmented controls, tags, FAB */
```
Use `clip-path`/CSS `corner-shape: squircle` where supported, or approximate with layered border-radius — avoid sharp 4–8px "web" corners entirely.

## 5. Typography
- Font stack: `-apple-system, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif` (Inter as the closest open-source fallback to SF Pro).
- Scale (iOS type scale, approximate):
```
--text-largeTitle: 34px / 700
--text-title1:     28px / 700
--text-title2:     22px / 600
--text-title3:     20px / 600
--text-headline:   17px / 600
--text-body:       17px / 400
--text-callout:    16px / 400
--text-subhead:    15px / 400
--text-footnote:   13px / 400
--text-caption:    12px / 400
```
- Line-height 1.3–1.4. Letter-spacing slightly negative on large titles (`-0.02em`).

## 6. Spacing & grid
```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px  --space-6: 24px  --space-7: 32px  --space-8: 40px
```
- **Mobile / small screens:** all card/product/category grids are **exactly 2 columns**, gutter `--space-3` (12px), outer page margin `--space-4` (16px). This applies to: catalog product grids, dashboard widget grids, inventory item cards, job kanban cards viewed on mobile (stacked-column list still uses 2-col summary chips), chat thread list previews.
- **Tablet (≥768px):** 3–4 columns.
- **Desktop large screen (≥1280px):** content area uses a **macOS/iPadOS-style split layout**: fixed translucent sidebar (leftmost, `.material-thick`) + content canvas with a max content width (~1400px) centered, grids flow to 4–6 columns depending on card min-width (auto-fit `minmax(240px, 1fr)`).

## 7. Core components (behavioral + visual spec)

### Navigation
- **Desktop:** left sidebar, iOS-Settings-app style grouped nav list, `.material-thick`, icons are SF-Symbol-style line icons, active item gets a soft accent-tinted glass pill background (`rgba(255,90,60,0.12)`), not a hard fill.
- **Mobile:** bottom tab bar, `.material-chrome`, 5 tabs max (Home, Catalog, Calculator, Jobs, Chat), floating with rounded top corners and safe-area padding, exactly like iOS tab bar. A translucent top nav bar (`.material-thick`) with large-title-collapsing-to-inline-title on scroll (iOS "large title" pattern).

### Cards
- Base: `.material-regular`, `--radius-lg`, inner padding `--space-4`, subtle `1px` top highlight border to fake glass refraction.
- Product/category card: image top (rounded top corners only), title `--text-headline`, price `--text-body` bold accent color, chevron/arrow at trailing edge (iOS list-row affordance).
- Tapping a card: scale-down micro-interaction (0.97 scale, 100ms) then navigate — iOS press feedback, not a web `:hover` underline.

### Buttons
- **Primary:** filled, accent gradient (`--accent-primary` → darker shade), white text, `--radius-pill` for compact buttons or `--radius-md` for full-width form buttons, subtle inner shadow highlight top edge (glossy iOS look).
- **Secondary/Glass button:** `.material-thin` fill, accent-colored text/icon, border `--glass-border`.
- **Destructive:** `--accent-danger` fill or text.
- All buttons: min-height 44px (iOS tap target), haptic-style press scale animation.

### Forms & Inputs (critical for the price calculator)
- Grouped-list style (like iOS Settings forms): each field is a full-width glass row inside a `.material-thin` rounded container, rows separated by 0.5px hairline dividers (`rgba(60,60,67,0.15)`), first/last row corners rounded to match container.
- Segmented control (iOS `UISegmentedControl` look) for choosing between mutually exclusive options (e.g. "Single sided / Double sided", "Digital / Offset").
- Stepper (`–  qty  +`) for quantity inputs, matching iOS `UIStepper`.
- Dimension input pairs (Width × Height) shown side-by-side with a unit toggle chip (cm/m) — segmented pill.
- Sliders (iOS style, accent-filled track) for GSM/coverage-percentage range selection where the source data uses bands (e.g. 0-20%, 20-50%, 50-100% coverage).
- On focus: field container gets accent-tinted glow border, no harsh blue browser outline.

### Modals / Sheets
- Mobile: bottom sheet sliding up, `.material-thick`, rounded top corners `--radius-xl`, drag handle bar at top (iOS sheet affordance), backdrop dims the base gradient (never turns black — use `rgba(28,28,30,0.25)` max).
- Desktop: centered modal, `.material-thick`, `--radius-xl`, soft shadow, backdrop same translucent dim.

### Price Calculator Result Panel
- A dedicated "glass receipt" card: sticky on desktop (right rail), or expandable bottom sheet on mobile, showing line-by-line breakdown (base price × qty, finishing add-ons, subtotal) with iOS-style right-aligned monospaced-style numerals, and a large total in `--text-title1` accent color.

### Kanban (Jobs)
- Desktop: horizontal-scroll columns, each column header `.material-thin` pill with count badge; cards `.material-regular`.
- Mobile: columns become a segmented-control-selected single list (swipe between statuses), 2-column card grid within.

### Chat
- iOS Messages-style bubbles: own messages accent-filled rounded bubble right-aligned, other party `.material-thin` bubble left-aligned, avatar circles, timestamp caption text, translucent input bar pinned to bottom (`.material-chrome`) with a pill-shaped input field and a circular send button.

### Badges/Tags/Status chips
- `--radius-pill`, small `.material-thin` or accent-tinted fill (`rgba(accent, 0.15)` background + accent text) — used for job status, stock level ("Low stock" in warning tint), quote status.

## 8. Motion
- Standard easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` (iOS default), duration 250–350ms for screen transitions, 120–180ms for micro-interactions.
- Page transitions: horizontal slide-push for drill-down navigation (mirrors iOS `UINavigationController` push/pop), modal sheets slide up/down, tab switches cross-fade.

## 9. Iconography
- Line-style icons, 1.5–2px stroke, rounded caps — visually consistent with SF Symbols (use an icon set like `lucide-react` configured with rounded strokes as the closest open-source match).

## 10. Accessibility & consistency rule
Every new component must be built from the tokens above (colors, radius, spacing, material classes) — no one-off hex values or px radii in component code. A Tailwind config maps all tokens in section 2/4/6 to theme extensions so `bg-glass-regular`, `rounded-xl`, `p-4` etc. are the only way surfaces get styled.
