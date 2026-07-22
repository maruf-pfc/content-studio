# PR: System-Level Design Rebuild, Dedicated News Post Mode, Auto Photo Palette Extraction & Accessibility

## 📌 Summary of Changes

This Pull Request delivers a comprehensive system-level rebuild of **Content Studio**, transforming it into a high-performance **Broadcast Newsroom & Social Media Graphic Studio**.

---

### 📰 1. Dedicated News Post Studio Mode (`/news`)
- **News Card Layout Pipeline**: Built specifically for repurposing news/event photos into branded Bangladeshi news cards (Channel 24, Jamuna TV, Daily Campus style).
- **Auto Theme Mode (Default)**: Automatically extracts a live 4-color palette from uploaded photos via canvas pixel sampling (`samplePhotoPalette`), providing a live sidebar swatch preview card with individual color overrides.
- **Automated Luminance Contrast**: Uses `(R*299 + G*587 + B*114)/1000 >= 128` luminance threshold to automatically pick pure white or dark text for 100% text readability.
- **6-Stop Multi-Stage Seam Blend**: Multi-stop linear gradient spanning across the photo seam into the text banner zone, eliminating hard cuts or dark shadow bands.
- **Interactive Word Token Chips**: Clickable chip badges allowing creators to toggle `*accent highlighted*` headline words effortlessly.
- **Brand Logo Badge**: Positionable circular logo badge with 8 anchor points (`seam-center`, `top-left`, etc.) and fine X/Y offset sliders.
- **Copyright Footer Strip**: Footer strip with 1-click **Use Handle** and **Append Date** auto-fill tools, featuring dynamic luminance contrast for white backgrounds.

---

### 🎨 2. System Design Token Architecture (`src/assets/tokens.css`)
- **Broadcast Newsroom Aesthetic**: Replaced generic purple/cream AI tells with a dark tactical console theme (`#0B0D12` / `#141720`) with broadcast red (`#E63946`) and amber (`#FFB703`) active highlights.
- **Typography Scale**: **Outfit** (Headlines) + **Plus Jakarta Sans** (Body) + **JetBrains Mono** (Technical/Data).
- **Radius Scale**: `4px` sharp inputs, `10px` surface cards, `16px` dialog drawers, and `9999px` pills.
- **Mobile-First Responsive Control Drawer**: On screens `<1024px`, the control sidebar reflows into a bottom sheet drawer, keeping the live canvas workstation centered and full width.
- **Accessibility & Touch Standards**: Minimum `44×44px` touch targets for all interactive controls, visible focus rings (`:focus-visible`), keyboard navigation, ARIA landmarks, and `#main-content` skip links.
- **SEO Infrastructure**: Open Graph, Twitter Card tags, `sitemap.xml`, and `robots.txt`.

---

### ⚡ 3. Quality & Testing
- **Linting & Code Quality**: 0 errors with `bun run lint` (`oxlint` & `eslint`).
- **TypeScript Type-Check**: 0 errors with `vue-tsc --build`.
- **Unit Test Suite**: 8/8 unit tests passing with Vitest (`bun test:unit`).
- **Production Bundle**: Successfully built with Vite in ~500ms.

---

## 🧪 How to Test

1. **Checkout & Install**:
   ```sh
   git fetch origin
   bun install
   ```

2. **Run Dev Server**:
   ```sh
   bun dev
   ```
   Navigate between **Normal Post** (`/`) and **News Post** (`/news`).

3. **Verify News Post Auto Palette**:
   Upload any photo in News Post mode and observe the live auto-extracted 4-color palette swatches in the sidebar.

4. **Verify Mobile Drawer**:
   Resize viewport below `1024px` and tap `⚡ Open Controls Drawer`.

5. **Run Lint & Tests**:
   ```sh
   bun run lint
   bun run build
   bun test:unit
   ```

---

## 📷 Screenshots & Verification
- ✅ **Clean Lint**: `Found 0 warnings and 0 errors.`
- ✅ **Unit Tests**: `8 pass, 0 fail (Ran 8 tests)`
- ✅ **Type Check & Build**: `built in ~500ms`
