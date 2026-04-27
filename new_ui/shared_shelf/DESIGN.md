---
name: Shared Shelf
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#4a4455'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#7b7486'
  outline-variant: '#ccc3d7'
  surface-tint: '#7331df'
  primary: '#5300b7'
  on-primary: '#ffffff'
  primary-container: '#6d28d9'
  on-primary-container: '#dac5ff'
  inverse-primary: '#d3bbff'
  secondary: '#a43073'
  on-secondary: '#ffffff'
  secondary-container: '#fc79bd'
  on-secondary-container: '#76014e'
  tertiary: '#51239a'
  on-tertiary: '#ffffff'
  tertiary-container: '#693fb3'
  on-tertiary-container: '#dbc6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5b00c5'
  secondary-fixed: '#ffd8e7'
  secondary-fixed-dim: '#ffafd3'
  on-secondary-fixed: '#3d0026'
  on-secondary-fixed-variant: '#85145a'
  tertiary-fixed: '#ebdcff'
  tertiary-fixed-dim: '#d3bbff'
  on-tertiary-fixed: '#260059'
  on-tertiary-fixed-variant: '#572ba0'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is built for a collaborative planning environment that balances high-energy inspiration with focused productivity. The brand personality is vibrant, organized, and sophisticated. It utilizes a "Dual-Layer" philosophy: a deep, immersive "App Chrome" (navigation and backgrounds) contrasted against "Clean Canvas" content areas. 

The aesthetic leans into **Glassmorphism** for the structural layers—using deep violet gradients and frosted overlays—while maintaining a **Minimalist** approach for the functional task-management areas to ensure maximum legibility and reduced cognitive load. The emotional response is one of clarity and creative momentum.

## Colors

The palette revolves around a high-vibrancy violet core. The **Primary** color is a vivid violet used for interactive states and branding. The **Secondary** pink acts as a soft accent for highlights, progress indicators, and call-outs. 

The UI uses a dark-themed "Chrome" (sidebar, top navigation, and app background) featuring a deep violet-to-indigo gradient. Content surfaces are rendered on a "Light Canvas" (near-white violet) with **Slate/Black** text for maximum readability. A specific **Pink Focus Ring** is mandated for all keyboard and active states to ensure high-contrast accessibility against both light and dark backgrounds.

## Typography

This design system uses a pairing of **Epilogue** for headings and **Manrope** for functional text. 

- **Epilogue** provides a contemporary, slightly editorial look for page titles and section headers, giving the "Shelf" a distinctive personality.
- **Manrope** is used for all body text, task lists, and calendar entries due to its exceptional legibility and balanced proportions. 
- Tracking is slightly tightened for large headlines and loosened for small uppercase labels to maintain a modern, clean appearance.

## Layout & Spacing

The system employs a **Fluid Grid** within a fixed-width container for desktop layouts. It follows an 8px base unit rhythm.

- **App Chrome:** The sidebar navigation is fixed at 280px, utilizing a glassmorphic blur over the primary deep gradient.
- **Content Area:** Content lives in a central white "Canvas" with generous margins (48px+) to evoke the feeling of a clean desk.
- **Gaps:** Use a 24px gutter for grid-based items like media cards or calendar tiles.

## Elevation & Depth

Hierarchy is established through a combination of **Tonal Layering** and **Glassmorphism**:

1.  **Level 0 (Base):** The deep violet gradient app background.
2.  **Level 1 (Chrome):** Sidebars and navigation bars with 20% opacity white overlays and a 20px backdrop blur.
3.  **Level 2 (Canvas):** Pure white or high-light violet surfaces with soft, diffused violet-tinted shadows (0px 4px 20px rgba(109, 40, 217, 0.08)).
4.  **Level 3 (Interactive):** Floating action buttons or active cards with a more pronounced shadow and a 1px soft pink border.

## Shapes

The design system utilizes **Rounded** geometry to feel approachable and modern. 
- **Standard UI elements** (Inputs, Buttons) use a 0.5rem (8px) radius.
- **Large containers** (Cards, Content Panels) use a 1rem (16px) radius.
- **Media items** and profile avatars use a 1.5rem radius or full circles to contrast against the structured grid of the task lists.

## Components

### Navigation
The sidebar uses semi-transparent glass blocks. Active links are indicated by a solid white background with 10% opacity and a high-vibrancy pink vertical "indicator" pill on the left edge.

### Calendar
The calendar grid uses 1px slate-200 borders. Current day is highlighted with a soft pink background wash (#FDF2F8) and a bold violet date number. Events are rendered as pill-shaped chips with subtle violet backgrounds.

### Task Lists
Tasks use a clean row-based layout. Checkboxes are custom: a 20px square with a 4px radius. When checked, they transition from a slate outline to a solid violet fill with a white checkmark. High-priority tasks are accented with a thin pink left-border.

### Media Cards
Cards feature a top-heavy layout with the image/media filling the upper 60%. The bottom section uses a clean white background with Epilogue headings. On hover, the card should lift slightly (elevation increase) and the focus ring (pink) should appear if navigated via keyboard.

### Input Fields & Focus Rings
Inputs use a slate-100 fill and a 1px slate-200 border. On focus, the border color changes to primary violet, and a secondary 3px pink glow (focus ring) surrounds the element with 2px of offset.