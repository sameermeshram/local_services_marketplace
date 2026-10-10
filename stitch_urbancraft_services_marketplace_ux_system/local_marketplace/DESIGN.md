---
name: Local Marketplace
colors:
  surface: '#f3fbf9'
  surface-dim: '#d3dcda'
  surface-bright: '#f3fbf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf5f3'
  surface-container: '#e7f0ee'
  surface-container-high: '#e1eae8'
  surface-container-highest: '#dce4e2'
  on-surface: '#151d1c'
  on-surface-variant: '#3e4947'
  inverse-surface: '#2a3231'
  inverse-on-surface: '#eaf2f0'
  outline: '#6e7977'
  outline-variant: '#bec9c6'
  surface-tint: '#006a61'
  primary: '#00514a'
  on-primary: '#ffffff'
  primary-container: '#006b62'
  on-primary-container: '#96e8dd'
  inverse-primary: '#83d5ca'
  secondary: '#9e4200'
  on-secondary: '#ffffff'
  secondary-container: '#ff8845'
  on-secondary-container: '#6a2a00'
  tertiary: '#05514b'
  on-tertiary: '#ffffff'
  tertiary-container: '#296962'
  on-tertiary-container: '#a7e6dd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff2e6'
  primary-fixed-dim: '#83d5ca'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb691'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#793100'
  tertiary-fixed: '#afefe6'
  tertiary-fixed-dim: '#93d2ca'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#04504a'
  background: '#f3fbf9'
  on-background: '#151d1c'
  surface-variant: '#dce4e2'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes a high-trust, operationally rigorous visual language for an on-demand local services platform. The aesthetic blends modern utilitarian SaaS ergonomics with warm community hospitality, balancing the functional efficiency of TaskRabbit with the polished reliability of Urban Company.

### Aesthetic Principles
- **Reliable Craftsmanship:** Surfaces prioritize structural clarity, restrained 1px divider lines, and clear visual containers over decorative distractions.
- **Calm Utility:** Generous whitespace, precise typography, and disciplined color zoning convey quiet authority, eliminating anxiety from urgent home repair bookings.
- **Dual Accent Discipline:** Deep teal provides an anchor of dependable infrastructure and identity, while burnt orange functions strictly as a transactional focus beacon for high-intent actions.
- **Structured Spatial Economy:** Every view is organized into predictable panels, cards, and structured lists that make service tiers, technician vetting badges, and pricing breakdowns instantaneously legible.

## Colors

The palette employs a dual-chromatic strategy engineered for transactional safety and operational confidence. The teal spectrum delivers institutional reliability, while the warm terracotta-orange accent commands high-conversion interaction paths.

### Color Tokens & Semantics
- **Brand Identity (Teal):**
  - Primary Base (`#006B62`): Navigation shells, brand accents, verification badges, active tab markers, and secondary interactive states.
  - Deep Teal (`#004E48`): Pressed states, high-contrast hero accents, and brand typography accents.
  - Light Teal Surface (`#E5F1EF`): Soft pill backgrounds, category highlight surfaces, and verified provider banner fills.
- **Action Driver (Burnt Orange):**
  - Primary CTA (`#A84700`): Exclusively reserved for primary conversion buttons ("Book Now", "Confirm Service", "Hire Pro"). Never use for ambient decorations.
  - CTA Interactive Hover/Pressed (`#873800`): Darkened state for physical tactile confirmation.
- **Surfaces & Layout:**
  - Page Canvas (`#F7F8F7`): Low-glare, warm off-white canvas that recedes behind active white cards.
  - Base Surface (`#FFFFFF`): Elevated panels, booking sheets, modals, and list row containers.
  - Border System (`#DCE4E1`): Architectural division lines, input perimeters, and card boundaries.
- **Typography & Neutrals:**
  - Ink Primary (`#202827`): Deep mineral graphite ensuring AAA compliance on white and canvas backgrounds.
  - Ink Secondary (`#66716F`): Muted slate for metadata, category labels, timestamps, and placeholder copy.
- **Functional Feedback:**
  - Success (`#238636`): Confirmation states, completed booking receipts, vetted background checks.
  - Warning (`#B7791F`): Pending availability, rescheduling notices, low stock warnings.
  - Error (`#C0392B`): Failed payments, validation errors, technician cancellation alerts.

## Typography

The type system pairs **Plus Jakarta Sans** for prominent headers with **Inter** for transactional legibility and data-dense listings.

### Application Guidelines
- **Headlines & Display:** Plus Jakarta Sans delivers structural warmth and modern geometric personality. Use bold and semi-bold weights for hero headers, service category titles, and modal titles.
- **Body & Dense Interfaces:** Inter resolves dense provider ratings, itemized estimates, work checklists, and form labels with zero perceptual distortion.
- **Numerical Treatment:** Use `label-lg` or `title-md` in semi-bold weights for currency values, service rates, and timeline estimates. Avoid decorative serif styling for numeric billing data.

## Layout & Spacing

The spatial architecture is anchored to an uncompromising 8px baseline rhythm (with a 4px half-step for micro-elements like tags and icons).

### Grid Structure
- **Mobile (< 768px):** 4 columns, 16px (`gutter`) column gaps, 16px (`margin`) outer canvas margin. Sticky bottom action bar on transactional flows.
- **Tablet (768px - 1024px):** 8 columns, 20px column gaps, 32px (`margin-tablet`) outer margins.
- **Desktop (> 1024px):** 12 columns, 24px (`gutter-desktop`) column gaps, 48px (`margin-desktop`) margins, max-width constrained to 1280px centered. Two-column split for checkout: 8-column configuration and 4-column sticky summary rail.

### Layout Philosophy
- Content containers rely on whitespace padding rather than stacked heavy borders.
- Micro gaps (`space-xs`: 8px, `space-sm`: 12px) govern internal control layouts (icon-to-text, label-to-input).
- Structural gaps (`space-lg`: 24px, `space-xl`: 32px) define relations between service description tiers, pricing cards, and review feeds.

## Elevation & Depth

Depth is established via low-contrast structural outlines (`#DCE4E1`) layered with soft, multi-stop ambient shadows. The system avoids deep dramatic drops, maintaining a grounded operational atmosphere.

### Elevation Levels
- **Level 0 (Flat Canvas):** Surfaces rest directly on `#F7F8F7`. Separation is created via a single 1px solid border (`#DCE4E1`). Used for standard table rows, input fields, and category filters.
- **Level 1 (Resting Cards):** `#FFFFFF` surface accompanied by a subtle tinted edge:  
  `box-shadow: 0 1px 3px 0 rgba(32, 40, 39, 0.05), 0 1px 2px -1px rgba(32, 40, 39, 0.05);`  
  Complemented by a 1px border in `#DCE4E1`. Used for provider cards, job overview tiles, and address blocks.
- **Level 2 (Interactive Hover & Flyouts):** Used when cards are hovered or contextual popovers trigger:  
  `box-shadow: 0 4px 12px -2px rgba(32, 40, 39, 0.08), 0 2px 6px -2px rgba(32, 40, 39, 0.04);`
- **Level 3 (Modals & Fixed Action Sheets):** Used for bottom booking sheets, schedule drawers, and lightbox dialogs:  
  `box-shadow: 0 12px 32px -4px rgba(32, 40, 39, 0.12), 0 4px 12px -2px rgba(32, 40, 39, 0.06);`  
  Backed by a neutral scrim: `rgba(32, 40, 39, 0.45)`.

## Shapes

The design system implements a deliberate, proportional rounding hierarchy that subtly expands as element scale increases:

### Scale Hierarchy
- **8px (`border-radius: 8px`):** Standard interactive controls including action buttons, segmented controls, small chips, and checkboxes.
- **10px (`border-radius: 10px`):** Form inputs, dropdown selectors, search bars, and quantity pickers. This slight variation gives form elements an inviting, ergonomic feel without appearing excessively rounded.
- **12px to 16px (`border-radius: 12px` / `16px`):** Container modules. Small components (ratings snippets, service bundle pills) use 12px; primary listing cards, schedule selectors, and modal sheets use 16px.
- **9999px (Pill):** Reserved exclusively for status indicators, counter badges, verified provider flags, and category filter chips.

## Components

### Buttons
- **Primary CTA:** Solid Burnt Orange (`#A84700`), text in `#FFFFFF`, font weight semi-bold (600), 8px border-radius, height 48px (desktop) / 52px (mobile touch target). Hover background `#873800`.
- **Secondary Action:** Solid Light Teal (`#E5F1EF`), text `#004E48`. Hover background tint adjusted by 4% darker.
- **Outlined / Tertiary:** Transparent background, 1px solid border `#DCE4E1`, text `#202827`. Hover background `#F7F8F7`.

### Input Fields & Controls
- **Height & Form Factor:** Height 44px (default) / 48px (search and touch inputs). Border-radius 10px.
- **Border & Focus:** Border 1px solid `#DCE4E1`, background `#FFFFFF`. Active focus state transitions border color to `#006B62` with a 2px outer ring in `rgba(0, 107, 98, 0.15)`. No harsh browser outlines.
- **Labels:** Positioned atop the input using `label-md` (`#66716F`), shifting to `#202827` on field engagement.

### Chips & Filter Pills
- **Filter Chips:** 32px height, 9999px radius (pill). Default state uses `#FFFFFF` fill with 1px `#DCE4E1` border and `#202827` text. Selected state switches to `#006B62` fill with white text and no border.
- **Status Badges:** Compact height (24px), radius 4px or pill. Green fill (`rgba(35, 134, 54, 0.12)`) with `#238636` text for "Verified Pro" and "Completed".

### Service & Listing Cards
- **Base Style:** Background `#FFFFFF`, border-radius 16px, 1px solid `#DCE4E1`, Level 1 ambient elevation.
- **Padding:** 16px internal padding on mobile, 20px or 24px on desktop.
- **Structure:** Clear 3-part internal grid: Header (thumbnail, title, badge), Body (service attributes, star ratings, review count), and Footer (transparent hourly base rate alongside primary booking CTA).

### Checkboxes & Radio Selectors
- **Geometry:** Checkboxes use 6px radius; Radio buttons are circular. Size: 20x20px.
- **States:** Default border 1.5px `#66716F`. Checked state fills `#006B62` with a crisp `#FFFFFF` check mark icon.

### Marketplace Specialized Components
- **Provider Bio Snip:** Row layout with 48px circular avatar, verification badge pinned to avatar lower-right corner, pro title, rating average with `#B7791F` star icon, and distance metadata.
- **Pricing Breakdown Itemizer:** Borderless tabular layout using 12px/16px row padding with alternating transparent rows and a top `#DCE4E1` border above the final bolded total amount.