# Marveto Center

A Poki-inspired game discovery experience with **16 original playable browser games**, original SVG cover art, and Marveto branding.

## Play

https://marvetogames.github.io/center/

## Gameplay polish benchmark

**Neon Breaker: Reactor Run** is the first quality benchmark: five designed chambers, aimed serves, armor, explosive cores, charged piercing shots, combo scoring, upgrades, medals, chamber practice, sound/mute, and automatic pause on focus loss.

[Play the benchmark](https://marvetogames.github.io/center/#breaker). The other 15 games retain their first-release gameplay while the owner reviews the benchmark. See [GAMEPLAY-REVIEW.md](GAMEPLAY-REVIEW.md) for the assessment and prioritized plan.

```sh
node --test neon-breaker.test.cjs
```

## Features

- Responsive mosaic of game tiles, search, six categories, and random game selection.
- Favorites, recent games, and personal bests saved on this device.
- Fullscreen game panels, restart controls, keyboard controls, and touch controls.
- No external assets, dependencies, accounts, advertisements, or analytics.
- Storage failure falls back to session-only play.

## Games

Jungle Snake, Midnight Drift, 2048 Pop, Cloud Hopper, Matcha Match, Neon Breaker, Four Together, Treasure Field, Pocket Pong, Star Catcher, X Meets O, Color Echo, Bubble Burst, Slide Quest, Mole Patrol, and Quick Spark.

Four Together and X Meets O are local two-player games; Pocket Pong plays against a computer opponent. The other games are solo.

## Run locally

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. The portal and original games are in `index.html`; the benchmark uses `neon-breaker.js` and `neon-breaker.css`. No build step is required.

## Deploy

In GitHub Settings → Pages, select **Deploy from a branch**, **main**, and **/ (root)**. The website is served at `/center/`. Relative resources and hash game links support this subdirectory.

## Implementation

The HTML file contains the portal, SVG artwork, catalog, and the original game engines. Neon Breaker has a separate simulation/rendering module and stylesheet. `startGame()` owns the lifecycle of each game and cancels timers, animation frames, and event listeners on restart or close. Saved state uses `marveto-center-v1` in local storage.

The interface takes inspiration from Poki's colorful, varied-size grid. No Poki game code, game thumbnails, logo, or proprietary assets are included.

## Verification

- All 16 game panels launched in Chrome without console errors.
- Search and no-results state checked.
- Favorites persisted through a page reload.
- Tic-tac-toe and Connect Four win paths checked.
- Minesweeper first reveal and 2048 keyboard/touch controls checked.
- Desktop and 390-pixel mobile layouts visually reviewed.

Long-session difficulty balancing and broader device compatibility remain areas for continued playtesting.
