---
name: Vibrant Kinetic
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#849588'
  outline-variant: '#3b4a40'
  surface-tint: '#00e292'
  primary: '#f7fff6'
  on-primary: '#003921'
  primary-container: '#22ffa7'
  on-primary-container: '#007247'
  inverse-primary: '#006d44'
  secondary: '#ffb68b'
  on-secondary: '#522300'
  secondary-container: '#ff7f1c'
  on-secondary-container: '#602a00'
  tertiary: '#fffcff'
  on-tertiary: '#1500a8'
  tertiary-container: '#dfddff'
  on-tertiary-container: '#4c49ee'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#51ffae'
  primary-fixed-dim: '#00e292'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#ffdbc8'
  secondary-fixed-dim: '#ffb68b'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#753400'
  tertiary-fixed: '#e1dfff'
  tertiary-fixed-dim: '#c1c1ff'
  on-tertiary-fixed: '#09006b'
  on-tertiary-fixed-variant: '#2b20d2'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 48px
---

## Brand & Style

The design system is engineered to transform the weight loss journey from a chore into a high-energy, digital sport. It targets a modern, tech-savvy audience that values speed, motivation, and a non-judgmental atmosphere. The aesthetic is "Hip and Funky" but remains grounded in high-tech precision.

The style is a fusion of **High-Contrast Bold** and **Glassmorphism**. It utilizes vibrant gradients that signify movement and progress, paired with deep, calm dark surfaces to reduce eye strain during frequent daily logging. The emotional response is one of "calm momentum"—the interface feels fast and responsive, while the dark background keeps the user's focus on their personal data without feeling overwhelmed.

**Key Stylistic Pillars:**
- **Dynamic Energy:** Use of neon accents against charcoal backdrops to make data "pop."
- **Approachability:** Softened by "squircle" geometry and playful, rounded typography.
- **High-Tech Humanism:** Thick-stroke iconography and generous whitespace ensure the app feels premium yet accessible.

## Colors

The palette is anchored in a "Calm Dark" theme. Instead of pure black, we use a deep charcoal-navy to create a more sophisticated, "ink-like" depth.

- **Primary (Neon Teal):** Used for primary actions, success states, and progress indicators. It represents vitality and "the path."
- **Secondary (Energetic Orange):** Used for "high-intensity" highlights, warnings, or motivational nudges. It provides a warm contrast to the cool primary.
- **Tertiary (Electric Indigo):** Used for data visualization, secondary buttons, and decorative glass effects.
- **Base (Dark Navy):** The foundational layer (#0F172A). Surface levels should lighten slightly as they "rise" toward the user.

**Gradients:**
- **The Glow:** A linear gradient from Primary to Tertiary (45deg) used for main call-to-action buttons.
- **The Burn:** A linear gradient from Secondary to a lighter coral for streak-based features.

## Typography

This design system uses a dual-type strategy to balance high-energy visuals with readable utility.

- **Sora (Headings):** Selected for its geometric, futuristic, and bold character. It should be used for large numbers, titles, and motivational headlines. 
- **Plus Jakarta Sans (Body):** A soft, modern sans-serif that provides an optimistic and friendly tone for instructional text, food logs, and labels.

**Usage Rules:**
- Use `display` for big "weight lost" numbers or celebratory milestones.
- `label-bold` should always be used for navigation items and category headers to provide a clear information hierarchy.
- For mobile layouts, prioritize `headline-lg-mobile` to ensure titles do not wrap awkwardly.

## Layout & Spacing

The layout philosophy follows a **Fluid Margin Model**. Because weight loss tracking involves many lists and charts, the spacing must be generous to prevent "data claustrophobia."

- **The 8px Grid:** All spacing must be multiples of 8.
- **Safe Zones:** A mandatory 24px horizontal margin on mobile ensures content never feels cramped against the edge of the glass.
- **Vertical Rhythm:** Use `section-gap` (48px) to separate different types of data (e.g., separating "Water Intake" from "Step Count") to allow each metric to breathe.
- **Alignment:** Center-aligned layouts are preferred for "Moment of Celebration" screens; left-aligned for data-heavy logging screens.

## Elevation & Depth

In this design system, depth is communicated through **Glassmorphism and Tonal Layering**.

1.  **Base Layer:** The deepest dark navy (#0F172A).
2.  **Surface Level:** Slightly lighter navy (#1E293B) with a 1px inner stroke of 10% white to define the "squircle" edge.
3.  **Floating Elements (Cards):** Semi-transparent surfaces (80% opacity) with a `24px` background blur. These should have a subtle drop shadow: `0px 12px 24px rgba(0,0,0,0.4)`.
4.  **Accent Elevation:** Primary buttons should have a "neon glow" shadow using a diffused version of the button's own color (e.g., a teal glow for a teal button) to make them appear self-illuminated.

## Shapes

The design system utilizes the **Squircle** (a mathematical hyper-ellipse) as its primary geometric signature. This shape feels more organic and "high-tech" than a standard rounded rectangle.

- **Component Radius:** Buttons and small input fields use a standard `0.5rem` (8px).
- **Container Radius:** Cards and main content blocks use `rounded-xl` (1.5rem / 24px) to create the signature squircle look.
- **Interactive Elements:** Use the squircle logic for progress bars (ensure ends are fully rounded/pill-shaped).
- **Icons:** Must feature rounded terminals (ends) to match the softness of the typography.

## Components

- **Buttons:** Primary buttons use the "Glow" gradient with white or deep indigo text. They should feel "squishy" with a subtle scale-down (0.98) on tap.
- **Cards:** Squircle containers with 24px padding. Backgrounds should be semi-translucent glass with a thin 1px border.
- **Input Fields:** Darker than the surface level, with a Primary-colored glow when focused. Use `body-md` for user input.
- **Chips:** Small, pill-shaped tags used for food categories or activity intensity. High-contrast colors (Teal text on Dark Indigo background).
- **Icons:** 2px or 2.5px stroke weight. Use "bold-rounded" variants. Never use sharp corners.
- **Progress Rings:** Large, thick teal rings with the "display" font in the center for calorie or step counts.
- **Haptic Feedback:** Every button press or successful log should trigger a "light" haptic tap to reinforce the tactile, high-tech feel.