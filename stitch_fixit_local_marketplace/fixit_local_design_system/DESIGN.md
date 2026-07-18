---
name: FixIt Local Design System
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3e4947'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#475266'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f6a7f'
  on-tertiary-container: '#e2ebff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The brand personality is rooted in reliability, efficiency, and community trust. This design system employs a **Modern Corporate** aesthetic that leans into high-utility SaaS patterns to convey professional-grade service management. 

The visual narrative prioritizes clarity and ease of use, ensuring that both service providers and homeowners feel a sense of calm and control. The style utilizes generous whitespace to reduce cognitive load, precise geometry to suggest order, and subtle tactile cues like soft shadows to make the interface feel approachable yet sturdy. The emotional response should be one of "solved problems" and "guaranteed quality."

## Colors
The palette is anchored by a deep teal to establish authority and trust, paired with a warm orange accent used exclusively for high-intent actions and primary conversions. 

- **Primary (Teal):** Used for headers, primary navigation states, and brand-defining elements.
- **Accent (Orange):** Reserved for "Book Now," "Submit," or "Confirm" actions to drive visual urgency.
- **Background:** An off-white stone tint (#FAFAF9) is used to reduce screen glare and provide a softer canvas than pure white.
- **Status Colors:** Functional colors are used with high saturation to ensure state changes (e.g., from Pending to Accepted) are immediately recognizable. Use these colors for badges and progress indicators.

## Typography
This design system utilizes **Inter** across all levels to maintain a systematic, utilitarian feel. The hierarchy is strictly enforced through weight variations rather than just size. 

- **Headlines:** Use Semi-Bold (600) or Bold (700) with slight negative letter spacing to create a compact, modern appearance.
- **Body:** Standardized at 16px for optimal readability in data-heavy service descriptions.
- **Labels:** Small caps or uppercase transformations are used for "Pill Badges" and "Table Headers" to distinguish metadata from content.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **single-column vertical stack** for mobile. 

- **Spacing Rhythm:** Use a 4px baseline grid. All margins and paddings should be multiples of 8px (8, 16, 24, 32, 48, 64) to maintain mathematical harmony.
- **Sidebar:** On desktop, a 280px fixed-width navigation sidebar sits on the left. On mobile, this transitions to a bottom navigation bar for primary actions or a hamburger overlay.
- **Sticky Elements:** Mobile views must utilize a sticky bottom action area for "Book Now" or "Contact" buttons to ensure thumb-reachability at all times.

## Elevation & Depth
This design system uses **Ambient Shadows** to create a sense of physical layering without looking dated. 

- **Level 0 (Flat):** Used for the main background.
- **Level 1 (Subtle):** Used for cards and input fields. `Shadow: 0px 1px 3px rgba(0,0,0,0.05)`.
- **Level 2 (Raised):** Used for hover states on interactive cards and navigation items. `Shadow: 0px 10px 15px -3px rgba(0,0,0,0.08)`.
- **Level 3 (Overlay):** Used for modals and dropdown menus. `Shadow: 0px 20px 25px -5px rgba(0,0,0,0.1)`.

Avoid heavy borders; use light grey (#E7E5E4) outlines only when necessary to define boundaries on white-on-white layouts.

## Shapes
The shape language is "Friendly Professional." Surfaces use a **Rounded** logic (8px default) to soften the professional aesthetic and make the UI feel modern and safe. 

- **Standard Elements:** Buttons, cards, and input fields use an 8px (0.5rem) radius.
- **Large Elements:** Stats cards and hero sections may scale up to 16px (1rem) for a more pronounced "app-like" feel.
- **Pills:** Badges and tags always use a full pill radius (999px) to contrast against the more geometric buttons.

## Components
- **Input Fields:** Use floating labels that transition to a smaller size at the top of the field on focus. Use a 2px Teal border for the active state.
- **Buttons:** 
    - *Primary:* Solid Teal with white text.
    - *CTA:* Solid Orange with white text.
    - *Secondary:* Ghost style with Teal border and text.
- **Pill Badges:** Used for status (Pending, Completed). Backgrounds should be 10% opacity of the status color with 100% opacity text for high legibility.
- **Stats Cards:** These should feature a large `headline-lg` number, a `label-md` description, and a subtle icon in the top right corner.
- **Navigation Sidebar:** Uses a clean list of icons and text. The active state is indicated by a vertical teal bar on the far left and a light teal background tint.
- **Sticky Mobile Button:** Full-width button housed in a white container with a top-only Level 3 shadow, anchored to the bottom of the viewport.