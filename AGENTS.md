# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Project decisions

- On result entry, show a centered white rounded gift popup with PNG particles bursting upward: mixed candy images for 0–1 correct answers, tarpaulin bags for 2. Match the hint popup's white/black visual style; particles are 182% of the original size, fall to the bottom, bounce once, then exit below the screen. Its button counts down from 10 seconds and dismisses immediately on tap; auto-dismiss at zero. Use supplied `game_icon` assets.

- Target display is LG StanbyME 2 in portrait orientation with a 9:16 central canvas.
- Landscape browsers show the white 9:16 canvas centered on a gray-100 background.
- Use the color tokens and supplied assets from `/Users/hanwha/Documents/GitHub/plus-design-system`.
- This prototype has no audio or analytics. Quiz content management uses Supabase Auth, Postgres, and Storage when the public Supabase environment variables are configured; the hardcoded question pool remains as a safe local fallback.
- Home features the original character extracted from `PI 수리.ai`, holding viewer-left O and viewer-right X signs with alternating silent animation. Preserve the supplied character's original colors.
- The full home O/X mascot SVG is offset 10px to the left without changing its size or internal paddle animation.
- Result levels use six silent, looping MP4 character animations—Coin, Sprout, Explorer, Calculator, Asset Doctor, and Pi Master—cropped through the same square mask used by the `/suri-review` page.
- Result level labels are `파이 첫걸음`, `파이 새싹`, `파이 탐험가`, `파이 계산왕`, `파이 자산박사`, and `파이 마스터`; `코인 수리` is the character name for `파이 첫걸음`, not the level label.
- Quiz questions include a `힌트보기 〉` action below the O/X choices; it opens a modal with the admin-authored hint copy and optional image.
- `/admin` is the question-management surface. Google-authenticated users with a verified `@hanwha.plus` address can add, edit, activate, deactivate, and delete questions and upload hint images. Database and Storage RLS enforce the same domain restriction.
- Every quiz round always contains exactly two randomly selected active questions; question-count configuration is intentionally excluded from the admin.
- Each quiz round randomly selects two questions from the full question pool and avoids repeating the exact previous pair. Result heroes omit numeric points: one correct answer selects among Coin/Sprout/Explorer Suri levels, while two correct answers select among Calculator/Asset Doctor/Pi Master levels; zero correct answers uses Coin Suri.
- Quiz progress represents completed questions: question 1 starts at 0%, question 2 appears at 50%, and answering question 2 fills the bar to 100% over 650ms before the result screen appears.
- Result-level introduction messages are explicitly balanced across two lines and use a font size 130% of the previous result-message size.
- `/suri-review` is a temporary local review page for comparing all six result-character MP4s inside identical square masks and interactively tuning per-video scale and X/Y object positions.
- Suri video scale baselines: Coin 0.90, Sprout 0.92, Explorer 1.19, Calculator 1.27, Asset Doctor 1.23, Pi Master 1.10; their X/Y centers remain 50/50.
- The result-page Suri video mask is 72% of the portrait canvas width (120% of its former 60% width) with 3% vertical margins.
- Suri blinks naturally on the home screen with an occasional quick double blink, offset from the paddle motion.
- The home start button uses the same 90.47% width and 4.765% side inset as the quiz question card; its height is 80% of an O/X answer button.
- The `시작하기` label uses 80% of the home `OX퀴즈` title's font-size ratio.
- The home tagline uses the exact two-line copy `앞서가는 부모들의 / 자산공식` in an oversized, angled brush-lettering treatment inspired by the supplied fourth reference, rendered as deterministic SVG in PLUS orange.
