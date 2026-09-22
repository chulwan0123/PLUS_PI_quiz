# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Project decisions

- Target display is LG StanbyME 2 in portrait orientation with a 9:16 central canvas.
- Landscape browsers show the white 9:16 canvas centered on a gray-100 background.
- Use the color tokens and supplied assets from `/Users/hanwha/Documents/GitHub/plus-design-system`.
- This prototype has no audio, analytics, backend, database, or personal-data collection.
- Home features the original character extracted from `PI 수리.ai`, holding viewer-left O and viewer-right X signs with alternating silent animation. Preserve the supplied character's original colors.
- Result levels use the same original Suri body extracted from `PI 수리.ai` without the O/X sign layers.
- Result score 2 uses `pi-suri-score-02.png`; scores 0, 1, 3, 4, and 5 currently share `pi-suri-score-00.png` until dedicated variants are supplied.
- Quiz questions include a `힌트보기 〉` action below the O/X choices; it opens a modal that currently contains only the `힌트` title.
- Suri blinks naturally on the home screen with an occasional quick double blink, offset from the paddle motion.
- The home start button uses the same 90.47% width and 4.765% side inset as the quiz question card; its height is 80% of an O/X answer button.
- The `시작하기` label uses 80% of the home `OX퀴즈` title's font-size ratio.
- The home tagline uses the exact two-line copy `앞서가는 부모들의 / 자산공식` in an oversized, angled brush-lettering treatment inspired by the supplied fourth reference, rendered as deterministic SVG in PLUS orange.
