# Content Studio 📰🎨

**Content Studio** is a responsive, high-performance Vue 3 + TypeScript web application built for content creators, news outlets, and meme brands in Bangladesh and beyond. It enables creators to instantly generate platform-ready, high-resolution social media graphics (Bangladeshi news cards, quote cards, statistics, and minimal statements) alongside copy-ready captions without requiring complex manual design software.

---

## 🌟 Major Modes & Features

### 📰 1. News Post Studio Mode (`/news`)
Built specifically for repurposing real news/event photos into branded broadcast-style graphic cards (matching Channel 24, Jamuna TV, and Daily Campus card layouts):
* ✨ **Auto Theme Mode (Photo Extracted)**: Automatically extracts a live 4-color palette from the uploaded image via canvas pixel sampling (Dominant edge color, Dark background, Contrast text, Accent highlight).
* 👁️ **Automated Luminance Contrast**: Uses `(R*299 + G*587 + B*114)/1000 >= 128` luminance threshold to automatically select pure white or dark text for 100% text readability.
* 🌊 **6-Stop Multi-Stage Seam Blend**: Multi-stop linear gradient spanning across the photo boundary into the banner zone, eliminating hard cuts or dark shadow bands.
* 🏷️ **Interactive Word Token Chips**: Interactive clickable chips to toggle `*accent highlighted*` words in headlines without manually typing asterisks.
* 🏅 **Brand Logo Badge**: Positionable circular brand logo badge with 8 anchor points (`seam-center`, `top-left`, `bottom-right`, etc.) and fine X/Y offset sliders.
* ✍️ **Copyright Footer Strip**: Copyright attribution strip with 1-click **Use Handle** and **Append Date** auto-fill tools.

---

### 📝 2. Normal Post Studio Mode (`/`)
Built for quote cards, tip lists, numeric callouts, and minimal statements:
* 🎯 **4 Layout Templates**: Quote Card, Tip / List, Stat Highlight, and Minimal Statement.
* 🎨 **Curated Theme Palettes**: 12 curated color palettes (Midnight Gold, Channel 24 Red, Jamuna Broadcast, Emerald Times, Cyber OLED, Editorial Cream, Soft Pastel) plus custom background, accent, and text pickers.
* 🔤 **Dynamic Typography Engine**: Auto-fits text sizing to prevent canvas overflow with font pairings (Outfit, Plus Jakarta Sans, Syne, Space Grotesk, Playfair, JetBrains Mono).
* ⚡ **Multi-Format Batch Export**: Live preview grid showing all aspect ratios simultaneously with 1-click batch download.

---

### 🎨 3. System Design Token Architecture (`src/assets/tokens.css`)
* 🖤 **Broadcast Newsroom Aesthetic**: Dark tactical console (`#0B0D12` / `#141720`) with broadcast red (`#E63946`) and amber (`#FFB703`) active highlights.
* 📐 **Radius Language**: Sharp `4px` inputs, `10px` surface cards, `16px` dialog drawers, and `9999px` pills.
* 📱 **Mobile-First Responsive Control Drawer**: On screens `<1024px`, the control sidebar reflows into a bottom sheet drawer, keeping the live canvas centered and visible.
* ♿ **Accessibility & Touch Target Standards**: Minimum `44×44px` touch targets for all interactive controls, visible focus rings (`:focus-visible`), keyboard navigation, ARIA landmarks, and `#main-content` skip links.
* 🚀 **SEO Foundations**: Open Graph, Twitter Card tags, `sitemap.xml`, and `robots.txt`.

---

## 🛠️ Canvas Rich Text Syntax

To highlight specific words on the canvas in your active accent color:
* **Asterisk Wrap**: `এখানে আপনার সংবাদ *শিরোনাম* লিখুন`
* **Word Chips**: Tap any word chip in the sidebar editor to toggle highlight state interactively.

---

## 📂 Project Structure

```
content-studio/
├── public/
│   ├── robots.txt              # Search engine crawler directives
│   └── sitemap.xml             # XML sitemap for route indexing
├── src/
│   ├── assets/
│   │   └── tokens.css          # Centralized Design Token System
│   ├── components/
│   │   └── TopNav.vue          # Broadcast Studio top navigation bar
│   ├── router/
│   │   └── index.ts            # Vue Router (/ and /news mapping)
│   ├── utils/
│   │   ├── newsCardCanvas.ts   # News Card rendering pipeline & color sampling
│   │   └── textHelper.ts       # Text wrapping, auto font fitting & word tokenization
│   ├── views/
│   │   ├── NewsPostView.vue    # Dedicated News Post Studio view
│   │   └── NormalPostView.vue  # Dedicated Normal Post Studio view
│   ├── App.vue                 # Root shell component
│   └── main.ts                 # Vue application entry point
├── src/__tests__/
│   └── App.spec.ts             # Vitest unit test suite (8/8 tests)
└── README.md
```

---

## 💻 Installation & Local Setup

1. **Install Dependencies**:
   ```sh
   bun install
   ```

2. **Run Development Server**:
   ```sh
   bun dev
   ```

3. **Code Quality & Linting**:
   ```sh
   bun run lint
   ```

4. **Type-Check & Build Production Bundle**:
   ```sh
   bun run build
   ```

5. **Run Unit Test Suite**:
   ```sh
   bun test:unit
   ```

---

## 🤖 CI/CD Pipeline

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically:
* Installs dependencies via Bun.
* Executes lint checks (`oxlint` & `eslint`).
* Runs the Vitest unit test suite (8/8 passing).
* Executes TypeScript type-checks (`vue-tsc --build`).
* Builds the Vite production bundle.
