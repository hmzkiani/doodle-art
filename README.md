# Doodle Land 4.0

Doodle Land is a private, offline-friendly art studio for children aged 3–10. It uses React, TypeScript, Vite, HTML Canvas, local SVG art, and IndexedDB. It has no account, backend, ads, tracking, paid API, or remote image dependency.

## Start on Windows

1. Install Node.js if it is not already installed.
2. Open PowerShell in the `DoodleLand` folder.
3. Install dependencies once (or after dependency changes):

   ```powershell
   npm install
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open <http://localhost:5173>. Keep PowerShell open while using the development server.

Edit files in `src` and save. Vite hot reload updates the browser. To create a production build, run `npm run build`. To preview that build, run `npm run preview` and open the address it prints.

## What is in the app

- The Doodle Land logo, favicon, mascot, “Little Artist, Big Ideas” tagline, and “by Hmzkiani” attribution.
- Ten original categories and 105 local vector coloring pages. Every category card and every page card renders a small preview from the same vector scene used by the editor.
- Drawing with mouse and pointer-compatible touch/stylus input; twenty distinct brushes, large color palettes, custom colors, recent colors, undo/redo, zoom, and fit-to-page.
- Safe region coloring with the original line art on its own layer. Erasing user marks does not erase the original outlines. Shapes, stickers, and backgrounds are separate saved actions.
- Twenty geometric shape tools, five starter compositions, original SVG stickers, sticker move/size/rotation controls, ten paper backgrounds, and a step-by-step drawing mode.
- A separate tracing practice area for lines, shapes, numbers, uppercase and lowercase letters, and simple pictures.
- Optional local badges with no streaks or locked tools.
- A local artwork gallery with open, rename, duplicate, favorite, search, delete confirmation, and PNG export. The editor also has high-resolution PNG, blank coloring-page export, and print controls.
- Responsive home, library, editor, gallery, learning, rewards, Settings, and About screens.
- The production service worker refreshes the HTML when connected and falls back to the cached app shell offline. It caches hashed JavaScript/CSS bundles and local brand assets; the page catalog, illustrations, stickers, tutorials, and tools are included in the local JavaScript bundle. A versioned update must cache a complete new shell before replacing the prior one, and never accesses the IndexedDB artwork database. The development server still needs to be running on the computer.

Saved pictures use IndexedDB in this browser on this device. Changing browsers or installing the Android app does not automatically move drawings between installations. Use PNG export to keep an image copy.

## Check production offline support

Offline caching is enabled in the production build, rather than the Vite development server.

1. Run `npm run build`, then `npm run preview` and open <http://localhost:4173>.
2. Leave the page open until the service worker finishes installing, then reload once so it controls the page.
3. In browser developer tools, confirm the page is controlled by `/sw.js`, then switch the Network panel to **Offline**.
4. Reload. The app should open with an offline notice. Browse coloring pages, draw, save, reopen, and export a PNG.
5. Switch the Network panel back to **Online** when finished. User artwork stays in IndexedDB across app cache updates.

On browsers without a service worker or persistent browser storage, offline launch or local artwork storage depends on that browser's support. Offline status is indicated when the browser reports its network connection as unavailable.

## Android packaging later

Capacitor core and CLI are already in `package.json`. `capacitor.config.ts` uses app name `Doodle Land`, package ID `com.hamza.doodleland`, and web output folder `dist`. The Android project has not been generated yet.

1. Build the web app:

   ```powershell
   npm run build
   ```

2. Install the Android platform package:

   ```powershell
   npm install @capacitor/android
   ```

3. Add Android once, then sync the built app:

   ```powershell
   npx cap add android
   npx cap sync android
   ```

   After later web changes, run `npm run build` and `npx cap sync android` again.

4. Open the project in Android Studio:

   ```powershell
   npx cap open android
   ```

5. In Android Studio, select **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio, the Android SDK, and Gradle tooling are needed for this step.

## Project map

- `src/App.tsx` — screens, navigation, gallery, rewards, and editor controls.
- `src/components/DrawingCanvas.tsx` — pointer input, vector page rendering, fill regions, layer composition, and saved actions.
- `src/components/PageThumbnail.tsx` — catalog thumbnails rendered from actual page artwork.
- `src/components/TracingCanvas.tsx` — dotted practice canvas.
- `src/data/drawingObjects.ts` — geometry, local sticker SVGs, and paper backgrounds.
- `src/data/brushes.ts` and `src/data/palette.ts` — brush rendering and color groups.
- `src/data/pages.ts` and `src/data/illustrations.ts` — original catalog data and vector scenes.
- `src/data/learning.ts` — local step-by-step drawing lessons.
- `src/lib/artworkDb.ts` and `src/lib/rewards.ts` — local picture storage and optional progress.
- `src/styles.css` — design system and responsive styles.
- `public/sw.js` — production offline cache.
- `public/doodle-land-logo.svg` and `public/favicon.svg` — original brand marks.
- `capacitor.config.ts` — future Android wrapper identity.
