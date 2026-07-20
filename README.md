# Content Studio 🎨

Content Studio is a responsive Vue 3 + TypeScript web application designed to help creators generate platform-ready, high-resolution social media graphics (infographics, quote cards, stat highlights) and post captions instantly without requiring manual design tools.

---

## Key Features

* 📱 **Multi-Format Aspect Ratios**: Automatically generates and scales layout dimensions for Instagram (1:1, 4:5, 9:16), YouTube (16:9), X/Twitter (16:9), and LinkedIn (1:1, 1.91:1).
* 🎨 **Visual Themes**: Out-of-the-box professional color pairings (Midnight, Cream, Neon, Pastel, Mono, Ocean) with fine-tuning overrides for custom Accent, Background, and Text colors.
* 🚀 **Advanced Canvas Backgrounds**:
  * **Background Options**: Choose between Solid Color, Linear Gradient (with angle slider), or Radial Gradient.
  * **Ambient Glow**: Toggle modern glowing background blobs in the canvas.
  * **Geometric Patterns**: Draw customizable overlay grids, dots, stripes, noise grain, or waves, complete with color pickers and density/opacity adjustment sliders.
* ✒️ **Rich Text Canvas Engine**:
  * Auto-fits text size dynamically to prevent canvas overflows.
  * Support for asterisk-based accent styling: text wrapped in `*asterisks*` or words prefixed with `#` (hashtags) are drawn in the theme's active accent color and bold font.
* 📸 **Real-Time Live Social Feed Mockups**:
  * View your designs inside simulated device frames (Phone screen, browser address bar, social media post card).
  * Toggle a simulated Reels/Stories overlay UI on the phone frame to preview how overlay graphics will render in real platforms.
* 💾 **Draft Saving & Swatches**: Save designs locally to retrieve later and keep a quick history of recently picked colors.

---

## Canvas Rich Text Syntax

To highlight specific words in the canvas in your theme's accent color:
* Wrap words in asterisks: `Create *stunning* graphics with *zero* design skills.`
* Write hashtags or tags: `Introducing #ContentStudio`

---

## Project Structure

* `src/App.vue`: Main Single File Component containing the app state, canvas drawing pipeline, inputs, and UI layout.
* `src/utils/textHelper.ts`: Pure utility functions for canvas text wrapping and auto font-fitting.
* `src/__tests__/App.spec.ts`: Unit tests verifying multi-line split behavior and automatic word wrapping.
* `bunfig.toml`: Configuration file telling `bun test` to skip E2E test discovery.
* `.github/workflows/ci.yml`: GitHub Actions pipeline configuration.

---

## Installation & Setup

1. **Install Dependencies**:
   ```sh
   bun install
   ```

2. **Run Development Server**:
   ```sh
   bun dev
   ```

3. **Type-Check & Build**:
   ```sh
   bun run build
   ```

4. **Run Unit Tests**:
   ```sh
   bun test:unit
   ```

5. **Run End-to-End Tests**:
   ```sh
   bun test:e2e
   ```

---

## CI/CD Pipeline

The project features a GitHub Actions workflow `.github/workflows/ci.yml` that automatically:
* Installs dependencies via Bun.
* Lints code using ESLint & Oxlint.
* Executes unit test cases with Vitest.
* Builds the production bundle with Vite.
