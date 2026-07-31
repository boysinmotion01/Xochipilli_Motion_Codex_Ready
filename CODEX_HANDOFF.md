# Codex Handoff: Parametric Growth Generator

## Goal
Refactor the current single file browser generator into a fast, reliable projection tool for desktop and mobile. Preserve the current visual identity, black background, presets, touch input, uploaded imagery, automatic growth, mirror mode, fullscreen, still export, and loop recording.

## Primary problem
The interface works, but animation becomes slow because rendering cost grows too quickly.

## Confirmed performance bottlenecks
1. Canvas renders at device pixel ratio up to 2 across the full screen.
2. Every agent uses shadowBlur and repeated save and restore calls.
3. The animation loop allocates a new array every frame with agents.filter(step).
4. Agent population can reach 6500 while every agent updates every frame.
5. Automatic growth emits new agents continuously without adapting to frame rate.
6. Branching can create exponential population growth.
7. Flowers, grids, particles, and uploaded image stamps create multiple drawing operations per agent.
8. Recording requests 60 frames per second at a high bitrate while the same canvas is under full simulation load.
9. Simulation speed is frame based, so behavior changes when frame rate changes.

## Required refactor
1. Use delta time from requestAnimationFrame.
2. Add a frame rate monitor and adaptive quality system.
3. Add quality modes: Mobile, Balanced, Projection.
4. Cap device pixel ratio by quality mode. Mobile 1.0, Balanced 1.25, Projection 1.5.
5. Replace agents.filter(step) with in place compaction or object pooling.
6. Add a strict live agent budget based on mode and quality.
7. Throttle auto seeding by elapsed milliseconds, not frame count.
8. Reduce branching automatically near the agent budget.
9. Cache parsed colors and update them only when color inputs change.
10. Minimize canvas save and restore calls.
11. Disable or reduce shadow blur automatically when frame rate drops.
12. Separate simulation resolution from display resolution when possible.
13. Add a visible FPS and agent count diagnostic toggle.
14. Pause simulation when the browser tab is hidden.
15. Add a deterministic seeded random option for repeatable loops.
16. Add an exact loop duration control and reset simulation at loop start.
17. Record at 30 frames per second by default, with 60 as an optional desktop setting.
18. Add recording resolution choices: 1280 by 720, 1920 by 1080, current canvas.
19. Keep uploaded imagery local. Do not add servers or external dependencies unless necessary.
20. Split the project into index.html, styles.css, app.js, renderer.js, simulation.js, presets.js, and export.js.

## Visual behavior to preserve
1. Roots should branch organically and accumulate.
2. Cracks should change direction sharply and remain structurally legible.
3. Flowers should appear as growth events, not on every frame.
4. Particles should remain luminous on pure black.
5. Grid marks should remain visible and geometric.
6. Uploaded images should accumulate as fragments without obvious repeated stamping.
7. Mirror mode should preserve symmetry around the vertical center.
8. Fullscreen should hide all controls cleanly.

## Reliability requirements
1. No silent failures.
2. Every unsupported browser feature must produce a visible message.
3. Safari and iPhone should use a screen recording fallback when direct canvas recording is unavailable.
4. Validate uploaded file type and handle failed image decoding.
5. Prevent memory leaks from object URLs and media streams.
6. Stop all recording tracks when recording ends.
7. Keep the interface usable by touch.
8. Avoid experimental APIs unless guarded by feature detection.

## Acceptance tests
1. Runs for ten minutes without progressive slowdown in Balanced mode.
2. Maintains at least 45 FPS on a modern desktop at 1920 by 1080 with automatic growth active.
3. Maintains at least 30 FPS on a recent phone in Mobile mode.
4. Agent count never exceeds the selected performance budget.
5. Clear immediately releases active agents.
6. Pause stops simulation work.
7. Tab switching pauses simulation and resumes cleanly.
8. Recording exports a playable WebM where supported.
9. Unsupported recording displays the fallback instruction.
10. Uploaded images remain local and render without blocking the interface.

## Current source
Use index.html in this folder as the behavioral reference. Refactor without changing the approved feature set unless a change directly improves performance or reliability.
