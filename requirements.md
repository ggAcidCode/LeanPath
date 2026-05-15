# LeanPath

**Product Requirements Document**

*An AI-powered calorie deficit weight loss app*

Version 1.0 | May 2026

---

## 1. Executive summary

LeanPath is a mobile-first weight loss application built around the calorie deficit principle. It removes the single biggest friction in calorie tracking — manual food entry — by combining a curated food database with AI-powered photo recognition and natural language meal description.

Users set a goal weight and select how aggressive their deficit should be. The app calculates a personalized daily calorie target, continuously projects when the goal will be reached based on actual adherence, and adjusts for calories burned through steps and workouts. The UI is designed to make logging a meal take under 10 seconds.

### 1.1 Problem statement

- Existing calorie tracking apps require manual entry of every ingredient, which causes drop-off within the first two weeks of use.
- Users lack confidence in their daily targets and have no clear sense of how their behavior translates to actual progress.
- Activity and nutrition data live in separate apps, requiring mental math to reconcile.

### 1.2 Goals

- Reduce average meal logging time to under 10 seconds.
- Achieve a 60 percent day-30 retention rate (industry average is roughly 25 percent).
- Provide a personalized, continuously updated goal projection that users find trustworthy.
- Lay foundations for future integration with wearables and fitness platforms.

### 1.3 Non-goals (v1)

- Meal planning, grocery lists, or recipe generation.
- Social features, friend feeds, or community forums.
- Medical-grade nutrition advice or condition-specific diet plans.
- Live coaching or human dietitian access.

---

## 2. Target users and personas

### Persona 1: The busy professional

Age 28 to 45. Has tried MyFitnessPal but gave up because logging took too long. Wants weight loss without the manual data entry. Eats out frequently, often does not know exact ingredients. Owns a smartphone, may or may not own a wearable.

### Persona 2: The first-time tracker

Age 22 to 60. Has never tracked calories before. Intimidated by macro calculations and food databases. Needs the app to do the work and explain the why. Trusts AI assistance and prefers visual feedback over numbers.

### Persona 3: The returning dieter

Age 30 to 55. Has lost weight before and regained it. Knows calorie tracking works but burned out. Needs low-friction logging and ongoing motivation through visible progress projections.

---

## 3. Design principles

1. Logging must be effortless. Every meal can be entered four ways: photo, natural language description, search, or barcode scan.
2. Numbers tell a story. Every screen connects daily actions to long-term goal progression.
3. Honest projections. The app does not flatter the user — it adjusts goal dates based on actual adherence, not optimistic assumptions.
4. Calm by default. No streak shaming, no aggressive notifications, no fasting trackers or red warnings for going over budget.
5. Inclusive defaults. Imperial and metric units, multiple cuisine databases, accessible color contrasts.

---

## 4. Functional requirements

### 4.1 Onboarding and goal setting

#### FR-1.1 User profile setup

During first launch, the user provides:

- Sex assigned at birth (used for BMR calculation only)
- Age, height, current weight
- Activity level (sedentary, lightly active, moderately active, very active)
- Goal weight
- Preferred unit system (imperial or metric)

#### FR-1.2 Deficit aggressiveness selector

The user chooses how aggressive their calorie deficit should be. Each option shows the expected weekly weight change and an honest tradeoff label:

| Level | Daily deficit | Weekly loss | Note |
|---|---|---|---|
| Gentle | 250 kcal | ~0.5 lb | Sustainable; minimal hunger |
| Moderate | 500 kcal | ~1.0 lb | Most common; recommended default |
| Aggressive | 750 kcal | ~1.5 lb | May affect energy and workouts |
| Maximum | 1000 kcal | ~2.0 lb | Short-term only; harder to maintain |

- System must prevent the daily target from dropping below 1200 kcal for women and 1500 kcal for men, regardless of selection.
- User can change aggressiveness at any time from settings; goal projection recalculates immediately.

#### FR-1.3 Daily calorie target calculation

Daily target = TDEE − selected deficit, where:

- BMR is calculated using the Mifflin-St Jeor equation.
- TDEE is BMR multiplied by an activity factor (1.2 to 1.725).
- Target is recalculated weekly based on the latest weigh-in to account for metabolic adaptation.

### 4.2 Food logging

#### FR-2.1 Search and select from database

- Searchable database of at least 1 million foods, including branded products and common restaurant items.
- Recent foods and most-frequent foods appear at the top of the search results for one-tap re-logging.
- Each food entry shows calories, macros (protein, carbs, fat), and serving size options.
- User can save custom foods and combine them into multi-item meals.

#### FR-2.2 Photo-based meal logging (AI)

The user takes or uploads a photo of their meal. The system:

1. Sends the image to a multimodal LLM with a structured prompt asking it to identify foods, estimate portion sizes, and return calories plus macros.
2. Returns a list of detected items with editable confidence scores.
3. Lets the user adjust quantities, add missing items, or remove false positives before saving.
4. Stores the photo with the meal entry for future reference.

Acceptance criteria:

- Median analysis time under 4 seconds end to end.
- System always displays an estimation disclaimer when AI is used.
- User can correct AI estimates; corrections are used to improve future suggestions.

#### FR-2.3 Natural language meal logging (AI)

The user types or speaks a free-form description such as "grilled chicken sandwich with fries and a coke from chick-fil-a". The system:

- Parses the description with an LLM into structured items with calories and macros.
- Recognizes restaurant names and dish names from common chains where possible.
- Defaults to standard portion sizes when not specified; user can adjust.
- Returns results in a single editable list, same format as photo logging.

#### FR-2.4 Barcode scanning

- Scan UPC, EAN, and standard food packaging barcodes.
- Auto-populate calories and macros from product database.
- Fallback to manual entry if barcode is not recognized.

#### FR-2.5 Meal categorization

- Default meal slots: breakfast, lunch, dinner, snacks.
- System auto-suggests the meal slot based on time of day, but the user can override.
- Each meal can have multiple items; items can be reordered and copied between meals.

### 4.3 Activity tracking

#### FR-3.1 Manual step entry

- User can enter total steps for the day in a single field.
- System estimates calories burned from steps using user weight and a standard MET formula.
- Step entry can be edited at any time until end of day.

#### FR-3.2 Workout logging

Two entry modes:

- Select from a curated list of workouts (running, cycling, weightlifting, yoga, swimming, etc.) with duration and intensity inputs.
- Describe the workout in natural language ("45 minute moderate intensity spin class") and let the AI estimate calories burned.

Workout entries include type, duration, intensity, and estimated calories. The user can override the estimate.

#### FR-3.3 Future integration points (v2+)

- Apple HealthKit and Google Fit for steps and workouts.
- Fitbit, Garmin Connect, Whoop, Oura, and Strava.
- When a connected source is present, manual entry is hidden by default and the connected source is the source of truth.

### 4.4 Goal projection engine

#### FR-4.1 Daily energy balance

For each day:

Net calories = consumed − (BMR + activity from steps and workouts)
Daily deficit/surplus = TDEE − net intake

#### FR-4.2 Goal date projection

- System maintains a rolling 14-day average of daily deficit.
- Projects goal date by dividing remaining weight to lose by the average weekly loss rate.
- Projection updates after every logged meal or workout.
- Three projection bands are shown: optimistic (best 7 days), realistic (14-day average), conservative (worst 7 days).

#### FR-4.3 Adherence feedback

- Each day is labeled as "on track", "light deficit", "maintenance", or "surplus".
- If user is consistently over budget for 7+ days, the app suggests either adjusting the deficit or revisiting the goal.
- No streak-breaking notifications or guilt-based copy.

### 4.5 Dashboard and visualization

#### FR-5.1 Today screen

Single-screen view containing:

- Calorie budget ring (consumed of target)
- Remaining calories number, prominent
- Macro breakdown bar (protein, carbs, fat)
- Quick log actions: snap photo, describe, search, scan
- Meal list (breakfast, lunch, dinner, snacks)
- Activity summary (steps, workouts, calories burned)
- Projected goal date card with current pace

#### FR-5.2 Trend views

- Weekly view: daily deficit bar chart, weight trend line, average daily intake.
- Monthly view: weight trajectory vs projected trajectory.
- All-time view: total pounds lost, longest streak of on-track days, average daily deficit.

---

## 5. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | App cold start under 2 seconds. Meal log save under 500 ms after AI response. |
| AI accuracy | Photo-based calorie estimates within +/- 20 percent of ground truth in 80 percent of cases (measured against a curated benchmark set). |
| Availability | 99.5 percent uptime for AI inference services. Local caching ensures the app remains usable offline for search and manual entry. |
| Privacy | All food photos encrypted at rest and in transit. Photos can be deleted by the user at any time. Aggregated, anonymized data only for model improvement, with explicit opt-in. |
| Security | OAuth 2.0 for third-party integrations. Biometric lock optional for app access. |
| Accessibility | WCAG 2.1 AA compliance. Dynamic type support. Voice input for natural language logging. VoiceOver and TalkBack compatibility. |
| Localization | English at launch. Spanish, French, German in v1.1. Unit system independent of language. |
| Platforms | iOS 16 plus and Android 11 plus at launch. Web companion in v2. |

---

## 6. UI and UX requirements

### 6.1 Visual language

- Clean, flat, surface-driven design. No gradients, no heavy shadows.
- Primary accent: a calm teal/green that signals progress without aggression.
- Generous whitespace. Numbers and progress indicators are the visual focus, not decorations.
- Two type weights only: regular for body, medium for emphasis. Sentence case throughout.
- Dark mode supported on day one.

### 6.2 Information hierarchy on the Today screen

1. Calorie ring and remaining-calories number (largest, top of screen).
2. Quick log row (4 large tap targets: photo, describe, search, scan).
3. Today's meals list.
4. Activity summary.
5. Goal projection card.

### 6.3 Logging UX requirements

- Camera and description options accessible in two taps from any screen.
- AI confidence is visible but not alarming — show estimated values with a subtle "AI estimate" tag.
- Every AI estimate is editable before saving. Confirmation is one tap.
- Recently logged meals are one-tap re-loggable from a Recents drawer.

### 6.4 Empty and error states

- First-time users see a welcoming onboarding flow with example meals.
- AI failures (timeout, unrecognized food) fall back gracefully to manual entry with the photo or text preserved.
- Offline mode shows a banner and queues entries for sync.

---

## 7. Data model overview

| Entity | Key attributes |
|---|---|
| User | id, email, sex, age, height, current weight, goal weight, activity level, deficit level, unit preference, created at |
| Food item | id, name, brand, serving sizes, calories per serving, protein, carbs, fat, source (database / user / AI) |
| Meal entry | id, user id, date, meal slot, food items with quantities, total calories, total macros, input method (search / photo / description / barcode), photo url |
| Workout entry | id, user id, date, type, duration, intensity, calories burned, input method |
| Step entry | id, user id, date, step count, calories burned, source |
| Weight entry | id, user id, date, weight |
| Projection snapshot | id, user id, date, projected goal date, daily target, weekly average deficit |

---

## 8. AI and LLM integration

### 8.1 Model selection

- Multimodal model required for photo analysis (vision plus text reasoning).
- Text-only model acceptable for natural language meal parsing and workout estimation.
- Provider abstraction layer so models can be swapped without app changes.

### 8.2 Prompt structure

All AI calls must:

- Return structured JSON with a defined schema (items array, each with name, quantity, unit, calories, protein, carbs, fat, confidence).
- Include a confidence score per item so the UI can flag uncertain estimates.
- Default to conservative (higher) calorie estimates when ambiguous, to avoid undershooting.
- Be cached per image hash and per text input to avoid duplicate inference cost.

### 8.3 Cost and rate limits

- Free tier: 10 AI-assisted logs per day. Paid tier: unlimited.
- Inference timeout: 10 seconds. On timeout, fall back to manual entry with photo preserved.

### 8.4 Safety and disclaimers

- Every AI-generated calorie estimate is labeled as such.
- App includes a permanent disclaimer that estimates are not medical advice.
- If a user logs a daily intake below 800 kcal, the app shows a non-judgmental check-in suggesting they speak with a healthcare provider.

---

## 9. Phased roadmap

| Phase | Scope | Target |
|---|---|---|
| MVP (v1.0) | Onboarding, manual food search, photo logging, description logging, manual steps and workouts, today screen, weekly trend, goal projection | Launch |
| v1.1 | Barcode scanner, additional languages, custom foods and meals, dark mode polish | + 2 months |
| v1.2 | Apple HealthKit and Google Fit integration for steps and workouts | + 4 months |
| v2.0 | Fitbit, Garmin, Strava, Whoop, Oura connectors. Web companion. Macro target customization | + 7 months |
| v2.1 | Recipe import from URLs, restaurant menu lookups, meal planning suggestions | + 10 months |

---

## 10. Success metrics

| Metric | Target |
|---|---|
| Day-30 retention | ≥ 60 percent |
| Median meal log time | < 10 seconds |
| Percentage of meals logged via AI (photo or description) | ≥ 40 percent |
| Average daily logging frequency at day 30 | ≥ 2.5 meals per active user |
| User-reported satisfaction with goal projection accuracy | ≥ 4.0 out of 5 |
| AI cost per active user per month | < $0.50 |

---

## 11. Open questions

- Should the app collect a starting body fat percentage estimate for more accurate TDEE, or is that an unnecessary onboarding friction?
- How should the app handle alcohol logging — separate category or absorbed into macros?
- Do we support water tracking in v1, or defer to v1.1?
- What is the right cadence for weight check-ins — daily, weekly, or user-configurable with a default?
- Should the AI ever proactively suggest a smaller portion ("consider eating half and saving the rest"), or is that paternalistic?