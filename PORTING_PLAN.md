# Y-Hat Hackathon — port v9-snap-demo to Next.js (overnight task)

> **Read this entire document before writing any code.** It contains every decision and constraint from the design phase. You will be working autonomously overnight; no one will be available to clarify questions.

---

## 0. Mission

Translate `/home/mateo/dev/Landing-Yhat/alternatives/v9-snap-demo.html` (standalone HTML/CSS/JS demo, ~1300 lines) into the Next.js production page at `/home/mateo/dev/y-hat-landing/app/hackathon/`. The URL stays `domain/hackathon`.

You are porting **HTML/CSS/JS → React/Next.js/TS**. The demo is the source of truth for visuals, copy, and behavior. Match the demo as closely as you can in the React idiom of this repo.

## 1. Hard constraints — read first

- **DO NOT push to `origin`.** Just commit locally on the existing branch `feat/hackathon-page`. The user has 21 commits ahead and will decide about cleanup + push tomorrow.
- **DO NOT touch the original boceto** at `/home/mateo/dev/Landing-Yhat/index.html` or anywhere in `/home/mateo/dev/Landing-Yhat/`. Different agent owned that workspace; only treat `/home/mateo/dev/Landing-Yhat/alternatives/v9-snap-demo.html` as your read-only source of truth.
- **Mobile (<1024px) keeps native scroll** — no snap, no wheel hijack, no side-nav, no auto-fit-logos. Top ticker + nav are visible on mobile (already in oficial).
- **Respect `prefers-reduced-motion`** — disable wheel hijack and scroll-triggered animations when the user has it on.
- **Use `data/hackathon.json` for content** — update the JSON with any copy changes from the demo. Page reads from JSON.
- **Don't add new dependencies** unless absolutely necessary. The existing stack has `framer-motion`, `lucide-react`, `next/font`. That should be enough.

## 2. Files

### Source (READ ONLY)
- `/home/mateo/dev/Landing-Yhat/alternatives/v9-snap-demo.html` — the full demo
- `/home/mateo/dev/Landing-Yhat/assets/yhat-logo.svg` — verify it matches `/home/mateo/dev/y-hat-landing/public/hackathon/logo-yhat.svg` (likely identical)
- `/home/mateo/dev/Landing-Yhat/assets/sponsors/*.{png,svg}` — already mirrored in `/home/mateo/dev/y-hat-landing/public/hackathon/sponsors/`

### Target (EDIT)
- `/home/mateo/dev/y-hat-landing/app/hackathon/page.tsx` — main component (currently 659 lines)
- `/home/mateo/dev/y-hat-landing/app/hackathon/hackathon.css` — scoped styles (currently 90 lines)
- `/home/mateo/dev/y-hat-landing/app/hackathon/layout.tsx` — metadata + root wrapper (currently 22 lines)
- `/home/mateo/dev/y-hat-landing/data/hackathon.json` — content (currently 201 lines)

### Don't touch
- `/home/mateo/dev/y-hat-landing/app/page.tsx` — main landing
- Any other route or component

## 3. Brand palette + typography

### Palette (CSS vars, mostly already declared in `hackathon.css`)
- `--hk-burgundy: #732C2C` — dominant background
- `--hk-burgundy-deep: #5a2222` — deeper accent (side-nav panel, card hover)
- `--hk-burgundy-edge: #3d1717` — deepest, footer
- `--hk-cream: #FAFAFA` — primary text on burgundy
- `--hk-cream-soft: rgba(250,250,250,.78)` — secondary text
- `--hk-cream-dim: rgba(250,250,250,.55)` — tertiary / dim labels
- `--hk-cream-line: rgba(250,250,250,.22)` — hairlines, borders
- `--hk-cream-faint: rgba(250,250,250,.16)` — softer surfaces
- `--hk-navy: #071E2A` — sticky CTA bg, contrast moments
- `--hk-gold: #e0b574` — **NEW** — accents (active section indicator, in-page emphasis, gradient stops in glows). Add this var if it's not in `hackathon.css`.

### Typography
- Display (h1–h4): **Radley** serif — loaded via `next/font` as `var(--font-radley)`. Already wired.
- Body: **Inter** sans — loaded via `next/font` as `var(--font-inter)`. Already wired.
- Mono labels (kickers, time stamps, sponsor tier names, sticky CTA copy): **JetBrains Mono** — **NEW**, needs adding via `next/font` in `app/layout.tsx` (root) or `app/hackathon/layout.tsx`. Add a CSS variable like `--font-jbm` and use it.

```ts
// In root or hackathon layout
import { JetBrains_Mono } from 'next/font/google';
const jbm = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbm', display: 'swap' });
// then apply jbm.variable to <html> or the relevant wrapper className
```

In CSS, replace any literal `'JetBrains Mono', monospace` with `var(--font-jbm), monospace`.

### Headings rules
- All H2 use Radley regular (400). Italic emphasis on key words via `<em>` with color `var(--hk-cream-soft)` or `var(--hk-gold)`. Examples: "Cuatro fases *en tres días*.", "Tres *tracks*, tres jurados.", "Los *premios*.".
- Subtitles (the `<p>` under each H2): 17px Inter, `var(--hk-cream-soft)`, single line in desktop snap mode (use `white-space: nowrap` + `max-width: none` inside the `@media (min-width:1024px)` block).

## 4. Sections — order and content

> The demo reads top to bottom. Verify each against `v9-snap-demo.html`. If the demo says X and `hackathon.json` says Y, **the demo wins** — update the JSON.

### Section 0: Hero
- `id="top"` on the `<section class="hero">`
- Big Ŷ logo (img from `/hackathon/logo-yhat.svg`) at right side of hero, semi-transparent, decorative.
- H1: "Hackathón" line + "*de Negocios*" line (italic, dimmed) in Radley.
- Tagline below H1: "*La intersección* de la tecnología, la innovación y los negocios." — italic Radley accent on "La intersección" with a gold underline highlight.
- Lede paragraph: "Tres días para transformar descubrimientos científicos e ideas innovadoras en **propuestas de valor concretas y viables**. Mentorías y talleres a lo largo del fin de semana, y un pitch final ante el jurado de cada track."
- 2 CTAs: primary "Inscribirme →" (Luma URL from JSON `meta.ctas.primary.href`); secondary "¿No tenés equipo? Formalo acá ↗" (Luma matchmaking URL from `meta.ctas.secondary.href`).
- Facts strip below: 4 cards: Cuándo (5—7 Junio / 2026 · viernes a domingo), Dónde (0+Infinito / Exactas — UBA · Ciudad Universitaria), Equipos (3 o 4 personas / 3 tracks a elección), **Premios** (USD 4.500 / + USD 90K en créditos AWS).
- **NO badge "Inscripciones abiertas"** at the top. Removed.
- **NO ticker** at the top of the page (the demo has one in HTML but hides it in snap mode via `display:none`). Keep ticker in DOM but ensure it's hidden in snap CSS.
- **NO nav.top** visible on desktop snap (hidden via CSS). Show only on mobile.

### Section 1: Cuatro fases (id="hackathon")
- Sec-head kicker: "— 01 · CÓMO FUNCIONA"
- H2: "Cuatro fases *en tres días*."
- Sub: "Las cuatro etapas que recorre cada equipo durante el evento."
- 4 steps in a row: Inmersión / Formulación / Viabilidad / Narrativa. Each with a circled number (54-56px circle), title in Radley, description in Inter.
- Stagger animation on the 4 steps (data-stagger).
- Narrativa desc must NOT say "comunicación bajo presión". Use: "Armado del pitch para defender el proyecto frente al jurado del track. Tres minutos para condensar todo lo construido."

### Section 2: Tres tracks (id="tracks")
- Sec-head: "— 02 · LAS ÁREAS" / "Tres *tracks*, tres jurados." / "Cada track tiene su propio jurado, mentores y criterio de evaluación. Vas a poder elegir el tuyo al inscribirte."
- 3 track cards in a row.
- **NO emojis** — no "Track A/B/C" labels. The title (h3) and an inline SVG icon share the same row (`.row > h3 + .ix`). H3 flex:1 left, icon flex-shrink:0 right.
- SVG icons (inline in JSX, ~46×46px circular bordered container, stroke=currentColor, switches to gold on hover):
  - **Deep Tech**: atom — central dot + 3 elliptical orbits rotated at 0/60/-60 deg. Path data is in the demo around line 567.
  - **IA**: network — 4 corner dots + 1 center dot + 4 connecting lines. Path data in demo around 580.
  - **Fintech**: chart trend — ascending line with arrow head + 2 small dot markers. Path data in demo around 595.
- Sub-areas updated:
  - Deep Tech: Salud y agro · Clima · Materiales · Biotech · **Espacio** (added)
  - IA: IA aplicada · Visión por computadora · Agentes · **Procesamiento de lenguaje** (replaced "SaaS de datos" / "Robótica")
  - Fintech: Pagos · Lending · Crypto · DeFi · WealthTech (unchanged)
- **NO `.track-prize-summary`** at the end of the section. Removed (premios live in their own section).

### Section 3: Aprendizaje (id="aprendizaje")
- Sec-head: "— 03 · LO QUE VAS A APRENDER" / "Charlas, paneles y *talleres*." / "Charlas, paneles y talleres dictados a lo largo del fin de semana para apoyar lo que tu equipo necesita construir."
- 8 small cards in a 4x2 grid. Items from `learn` array in JSON. Each card: small mono kicker (01–08) + title + short description.
- Title cleanups: titles like "Pitch + oratoria", "Vibecoding + AWS", "Problema → Producto", "Panel: mundo VC" — all in **plain cream**, no `<em>` italic accent within them (we removed those).
- Pitch + oratoria description must NOT contain "bajo presión".
- "Networking" — not "Networking real".

### Section 4: Cronograma (id="cronograma")
- Sec-head: "— 04 · CRONOGRAMA" / "Tres *días*, sin pausa." / "Cronograma del evento: charlas, talleres, cowork y entregas."
- 3 day cards side by side (Viernes / Sábado / Domingo). All cards **uniform** — no `.feat` class on Saturday. No "Día 02 · Central" anywhere. Just "Día 01", "Día 02", "Día 03".
- Inside each day: pill ("Día 0X") + h3 + hours range + ol with `<time>` + description per item.
- Items from `schedule[].items` in JSON. Check that JSON's items match the demo's items.
- Time labels in mono 15px gold-ish dim; activity in cream Inter 15.5px.

### Section 5: Premios (id="premios" — **NOT** `pre-inscripcion` or `inscripcion`)
- Sec-head: "— 05 · PREMIOS" / "Los *premios*." / "USD 4.500 en cash más USD 90.000 en créditos AWS, distribuidos entre los tres tracks."
- 3 prize cards in a row, same aesthetic as track cards (burgundy-deep bg + cream-line border, hover lift + accent line).
- **NO navy panel** anymore (was the old design). Flat into burgundy bg.
- **NO inscription CTAs in this section**. Just the 3 prize cards.
- Cards:
  - 1° de cada track / USD 1.000 / + USD 10.000 en créditos AWS
  - 2° de cada track / USD 500 / + USD 10.000 en créditos AWS
  - 3° de cada track / USD 10K / en créditos AWS
- "uno por track" / "una por track" removed from each card's detail line (redundant since the label already says "de cada track").

### Section 6: Sponsors (id="sponsors")
- Sec-head: "— 06 · SPONSORS" / "Las marcas que *hacen posible* esta edición." (`white-space: nowrap` in snap mode)
- 3 tiers: Main (1 logo), Platinum (7 logos), Gold (7 logos). Data in `sponsors[]` array.
- Tier labels are **Radley italic 20px cream**, with thin gold rules `(::before + ::after)` on either side — not mono uppercase.
- Each tier renders one `.sponsors-row` with all cards flex side-by-side. `flex-wrap: nowrap; align-items: stretch; gap: 8-10px`.
- Sponsor cards: cream bg, rounded 14px, `flex-direction: column; align-items: center; justify-content: center`.
- Layout extends past the `.wrap` constraint (`margin-left:calc(-50vw + 50%)`, etc.) so the row has full viewport width to play with.
- **Logos auto-fit**: a useEffect runs once images load and on resize. See "Sponsors auto-fit" below for the algorithm. Initial inline `style="height:clamp(X,Yvw,Z)"` is a fallback for first paint / mobile.
- Main: Rappi.
- Platinum: Picante / Fardo (use `.invert` to apply `filter:brightness(0)` — it's a white-on-dark logo) / Lovelytics / Complif / Belo / IOL / Ministerio (use `.tight` for shorter logo, smaller clamp).
- Gold: LUCAI / AWS / RedBull / PlusZero / Geonosis / Polo Exactas / CID.
- Below the 3 tiers: CTA row centered. "Quiero ser sponsor ↗" (mailto: `yhat.arg@gmail.com?subject=Sponsorship%20Hackathón%20de%20Negocios%202026`) + "o escribinos a *yhat.arg@gmail.com*". **MAIL CHANGED** from `hola@somosyhat.com` → `yhat.arg@gmail.com`. Apply globally — every reference in the page/data must use the new mail.

### Section 7: FAQ (id="faq")
- Sec-head + 8 `<details>` items from `faq[]` in JSON.
- Container `.faq` has `max-height: 64vh; overflow-y: auto` with a `mask-image: linear-gradient(...)` fade at the bottom so content overflow has a soft indicator.
- Has `[data-inner-scroll]` attribute (or rely on `.faq` selector) so the wheel-hijack JS recognizes it as an inner-scrollable region. See "Wheel-hijack" below.
- Question 2 ("¿Necesito saber programar?") answer still contains "72 horas" — this comes from the JSON. The user said they will do a manual FAQ pass later — **leave the JSON FAQ untouched** beyond what was already there.

### Section 8: Closing CTA (id="cta", element is `<section class="closing">`)
- **Flat, no rounded card, no navy bg.** Used to be a panel; now blends with the burgundy body. Centered content.
- Pill kicker: "★ Y-HAT × FCEN · 2026" (mono gold, with a pulsing dot).
- H2: "El futuro no se *adivina*, se modela." (italic on "adivina", gold).
- Sub: "Las inscripciones cierran el 2 de junio.&lt;br&gt;Confirmamos cupos por mail al cierre del proceso." (with the explicit line break before "Confirmamos").
- 2 CTAs: Inscribirme + ¿No tenés equipo? Formalo acá (same Luma URLs as hero).
- Big Ŷ ghost decoration in the bottom right (as `::after` background image at low opacity).
- This is the **last** snap section.

### Section 9: Footer (NOT a snap target — out of the snap flow)
- Lives below the closing in normal scroll. The wheel-hijack releases when at the last snap (closing) and scrolling down, so the user can reach the footer naturally.
- 4 columns: brand (Y-Hat) + 3 link cols (Hackathón / Sumarse / Y-Hat). Same as oficial.
- Copyright row: "© 2026 Y-Hat" + "FCEN · UBA · Primera Edición". **No "Hecho en Ciudad Universitaria".**

## 5. Floating side-nav (DESKTOP ONLY ≥1024px, prefers-reduced-motion: no-preference)

Replaces the top nav.

- Fixed right edge of viewport, vertically centered.
- 9 dots, one per snap section. Footer is NOT a dot (it's out of snap).
- On hover over the dots area (`.snap-nav:hover` OR `.snap-nav:focus-within`):
  - A single burgundy-deep panel slides in from the right
  - Behind/with the dots, NOT separate pills per label
  - All section labels reveal in **cascade** (top→bottom stagger 30ms per label) via `transition-delay` on `:nth-child`
- Each row contains both the label and the dot, in a single `<button>`. Label on left (Radley italic 15px cream-soft), dot on right (10px circle).
- Active section: label gold + dot gold + scale(1.4).
- Hover on individual row: label cream + dot cream + scale(1.2).
- Click on a row: `goTo(idx)` + `btn.blur()` so the panel collapses after navigation.
- Section labels: `Inicio`, `Programa`, `Tracks`, `Aprendizaje`, `Cronograma`, `Premios`, `Sponsors`, `FAQ`, `Inscripción`. Map from section IDs.

## 6. Wheel-hijack snap navigation (DESKTOP ONLY)

Implement in a `useEffect` (and clean up on unmount).

### State
- `currentIndex` (0..n-1)
- `locked` (bool — during animation)
- `lastInnerScrollTime` (number, timestamp ms)

### Constants
- `DURATION = 420` ms (animation duration)
- `LOCK_HOLD = 450` ms (lock release delay after starting animation)
- `WHEEL_THRESHOLD = 10` (minimum |deltaY| to consider a wheel event)
- `BOUNDARY_HOLD = 600` ms (grace period after hitting inner-scroll boundary before allowing section change)
- Throttle: ignore wheel events within 40 ms of the last accepted one.
- Easing: `easeOutCubic(t) = 1 - (1 - t)^3`

### Animation function
Custom `smoothScrollTo(targetY, duration)` using `requestAnimationFrame` (don't use `window.scrollTo({behavior:'smooth'})` — its timing is not configurable).

### Detection helpers
- `isAtLastSnap()` → `Math.abs(scrollY - lastSnap.offsetTop) < 40`
- `isPastLastSnap()` → `scrollY > lastSnap.offsetTop + 40`
- `consumeInnerScroll(deltaY)` → check the current section for `.faq` or `[data-inner-scroll]`. If it can scroll in the given direction, scroll it via `el.scrollTop += deltaY` and return `'consumed'`. If at boundary, return `'boundary'`. If no inner scroll, return `'none'`. Record `lastInnerScrollTime`.

### Wheel handler (key flow)
1. If not desktop or reduced-motion: return early, native scroll works.
2. If `isPastLastSnap()` → return (let native scroll handle, user is in footer area).
3. If `isAtLastSnap()` AND `deltaY > 0` → return (let native scroll reveal footer).
4. `e.preventDefault()` — block native scroll.
5. If `|deltaY| < WHEEL_THRESHOLD` → return.
6. `consumeInnerScroll(deltaY)`:
   - `'consumed'` → return
   - `'boundary'` → if `now - lastInnerScrollTime < BOUNDARY_HOLD`, return (still grace period). Else fall through.
   - `'none'` → fall through.
7. If `locked` → return.
8. Throttle by 40 ms.
9. `goTo(currentIndex + (deltaY > 0 ? 1 : -1))`.

### Keyboard handler
- `ArrowDown`/`PageDown`/`Space` → `goTo(currentIndex + 1)`
- `ArrowUp`/`PageUp` → `goTo(currentIndex - 1)`
- `Home` → `goTo(0)`
- `End` → `goTo(sections.length - 1)`
- Skip if target is input/textarea/contentEditable.

### Touch handler
- Track `touchStartY`. On `touchend`, `diff = startY - endY`. If `|diff| >= 30`, `goTo(currentIndex + (diff > 0 ? 1 : -1))`.

### Nav anchor hijack
- `document.querySelectorAll('a[href^="#"]')` → on click, find target's section index. If found, `e.preventDefault(); goTo(idx)`.

### Init
- `window.scrollTo(0, 0)` once on mount.
- `if ('scrollRestoration' in history) history.scrollRestoration = 'manual'` (run early in `<head>` via inline script in the layout to avoid FOUC).
- Hide native scrollbar visually: `body { scrollbar-width: none; } body::-webkit-scrollbar { display: none; }` inside the snap-mode media query.

## 7. Scroll-triggered animations (DESKTOP, prefers-reduced-motion: no-preference)

Use IntersectionObserver (lightweight, no Framer Motion needed for these — but you can use motion if it's cleaner).

### Setup
- Inline script in `<head>` (via layout.tsx): `document.documentElement.classList.add('anims-ready');` — runs before any rendering to prevent FOUC.
- CSS rules under `.anims-ready [data-anim]` and `.anims-ready [data-stagger] > *` set initial opacity:0 + transform.

### Animations
- Apply `data-anim="rise"` (default) / `"slide-l"` / `"scale"` / `"fade"` to standalone elements.
- Apply `data-stagger` to grids (no value) or `data-stagger="slide"` (slides children in from left).
- IntersectionObserver with `threshold: 0.12, rootMargin: '0px 0px -50px 0px'`. When entry intersects, add `.in-view` to target, then unobserve.
- CSS: `.anims-ready [data-anim].in-view { opacity: 1; transform: none }` (with the right transform).
- Stagger: `nth-child(1) { transition-delay: 60ms } ... nth-child(8) { transition-delay: 620ms }` under `.in-view`.

### Elements to decorate
- `.hero > .grid > div:first-child` (the text col) → `data-stagger`
- `.hero .ymark` → `data-anim="scale"`
- `.hero .facts` → `data-stagger`
- `.sec-head` (all of them) → `data-anim="rise"`
- `.steps` → `data-stagger`
- `.tracks` → `data-stagger`
- `.learn-grid` → `data-stagger`
- `.days` → `data-stagger="slide"`
- `.prizes` → `data-stagger`
- `.sponsors-block` → `data-stagger`
- `.faq` → `data-stagger`
- `.closing` → `data-anim="scale"`

## 8. Sponsors auto-fit (DESKTOP, after images load + on resize debounced 120ms)

Algorithm:

```ts
function fitRow(rowEl, minH, maxH) {
  const cards = Array.from(rowEl.querySelectorAll('.sponsor-card'));
  const imgs = cards.map(c => c.querySelector('img')).filter(Boolean);
  if (!imgs.every(img => img.naturalWidth > 0 && img.naturalHeight > 0)) return;
  const aspects = imgs.map(img => img.naturalWidth / img.naturalHeight);
  const totalAspect = aspects.reduce((a, b) => a + b, 0);
  const gap = parseFloat(getComputedStyle(rowEl).gap) || 0;
  const padX = cards.map(c => {
    const s = getComputedStyle(c);
    return parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
  });
  const totalPadding = padX.reduce((a, b) => a + b, 0);
  const gapsTotal = gap * (cards.length - 1);
  const available = rowEl.clientWidth;
  // Solve: sum(aspect_i * H) + totalPadding + gapsTotal = available
  const fitH = Math.floor((available - totalPadding - gapsTotal) / totalAspect);
  const finalH = Math.max(minH, Math.min(maxH, fitH));
  imgs.forEach(img => img.style.setProperty('height', finalH + 'px', 'important'));
}
```

Apply to Main (minH=56, maxH=110), Platinum (36–72), Gold (30–60). Wait until all sponsor imgs are loaded (use `complete && naturalWidth > 0` check or `load` events).

## 9. Sticky CTA bar

- Fixed bottom-center pill.
- Hidden by default. Visible when `scrollY > 700 && scrollY < (docHeight - viewportHeight - 500)`.
- Background `var(--hk-navy)`, cream text, gold pulsing dot.
- Content: "● **Inscripciones abiertas** · cierran 2 jun" + "Inscribirme →" rounded button (burgundy hover gold).
- Mobile variant: full-width minus margins, smaller padding.

## 10. Implementation steps (in order)

1. **Read** `/home/mateo/dev/Landing-Yhat/alternatives/v9-snap-demo.html` cover to cover. Cross-reference everything against this plan.
2. **Update `data/hackathon.json`** with the copy changes (especially: track sub-areas, removed "real" / "bajo presión", new mail). DO NOT touch the FAQ array contents (user will pass).
3. **Update `app/hackathon/layout.tsx`** to:
   - Add JetBrains Mono font (`next/font`).
   - Add inline `<script>` in `<head>` for `anims-ready` class + `scrollRestoration = manual`.
4. **Update `app/hackathon/hackathon.css`** with all new styles. Use the demo's CSS as source. Group rules by section. Mobile-first; snap-mode rules inside `@media (min-width: 1024px) and (prefers-reduced-motion: no-preference)`.
5. **Rewrite `app/hackathon/page.tsx`** as a `"use client"` component. Structure:
   - Top: imports (next/link, framer-motion, lucide, data).
   - Section components or inline render — your choice. Inline render is fine if it stays under ~800 lines.
   - `useEffect` block(s) for: wheel-hijack init, side-nav DOM creation/destruction, sponsor auto-fit, sticky CTA scroll listener, scroll-triggered animations IntersectionObserver.
   - Cleanup: remove event listeners on unmount.
6. **Test build**: `cd /home/mateo/dev/y-hat-landing && npm run build`. Fix any TS or build errors.
7. **Spin up dev server** (optional but recommended): `npm run dev`, open localhost:3000/hackathon, scroll, verify the wheel-hijack feels right.
8. **Commit on `feat/hackathon-page`** with a thoughtful message (see below). Do not push.

## 11. Decisions made during design (immutable — don't re-litigate)

- Team size: "3 o 4 personas" (kept the official wording; ignore other phrasings).
- Prize structure: 1° US$1.000 + 10K AWS / 2° US$500 + 10K AWS / 3° 10K AWS only (no cash for 3°).
- Mail: `yhat.arg@gmail.com` (replaced `hola@somosyhat.com` everywhere).
- Time framing: NEVER say "72 horas" — say "tres días" or just date ranges.
- Subtitle copy of every section: 1 line, descriptive, no marketing storytelling.
- No emojis anywhere (replaced with inline SVG line-icons in track cards).
- No "real" qualifier (e.g., "networking" not "networking real").
- No "bajo presión" phrasings (rewrote any that had it).
- No vague "industria del ecosistema" / "ecosistema" phrases.
- Footer: removed "Hecho en Ciudad Universitaria".
- Section 5 id: `premios` (was `pre-inscripcion`).
- Track A/B/C labels removed — title and SVG icon share the same row.
- Sponsor tier labels in **serif italic with gold rules**, not mono uppercase.

## 12. Deferred (do NOT implement)

- Dynamic badge state based on date (TODO comment is in the demo as a hint).
- FAQ content rewriting (user will pass after consulting their team).
- Jurors/mentors section (user will add once they're confirmed).
- Mobile UX testing (user will do in person tomorrow).
- Commit cleanup / interactive rebase (user will decide).
- Push to origin.

## 13. Verification before commit

- `npm run build` succeeds.
- No TypeScript errors.
- `npm run dev` and visual smoke-test:
  - Wheel scroll moves you through the 9 snap sections smoothly.
  - Side-nav appears on hover, labels cascade in.
  - Click a side-nav row → smooth navigation to that section + nav collapses.
  - Sponsors auto-fit fills each row optimally.
  - Sticky CTA appears after scrolling past the hero.
  - FAQ accordion opens/closes; inner scroll works when overflow.
  - Closing section flows naturally into the footer at the end (scrolling down past closing reveals footer).
  - Mobile (resize browser to < 1024px): normal scroll, no snap, ticker + nav visible, side-nav hidden.

## 14. Commit message template

```
feat(hackathon): full-page snap UX + visual overhaul

- Wheel-hijacked navigation with scroll-snap on desktop (mobile keeps native scroll)
- Floating right-edge nav with cascade label panel on hover
- IntersectionObserver-driven scroll-triggered animations
- Sponsor logos auto-fit per tier by aspect ratio (resize-responsive)
- Track cards: SVG line-icons replace emojis; title aligns with icon row
- Standardized prize section: 3 cards matching tracks (no nav panel)
- Footer out of snap, lives naturally below closing CTA
- Copy polish across all sections (no marketing fluff, single-line subs)
- Sub-area updates: Deep Tech adds Espacio; IA "Procesamiento de lenguaje"
- Sponsor email updated to yhat.arg@gmail.com
- Closing CTA: flat full-bleed (no rounded panel), aligned center
- Section IDs: pre-inscripcion → premios

Ports the v9-snap-demo exploration into the production Next.js page.
```

## 15. If you get stuck

- **You cannot ask questions overnight.** Make the call yourself based on this document and the demo. Bias toward following the demo when in doubt.
- If a piece of the demo is impossible to port cleanly (e.g., a CSS technique that doesn't compose with the existing Next.js setup), document the compromise in the commit message and move on.
- Time-box: don't spend more than 30 minutes stuck on a single issue. Cut a smaller scope and keep moving.

Good luck. The user wants this ready for deploy tomorrow.
