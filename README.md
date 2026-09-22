# Marveto Center

A Poki-inspired game discovery experience with **16 original playable browser games**, original SVG cover art, and Marveto branding.

## Play

https://marvetogames.github.io/center/

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

Open http://localhost:4173. The complete application is in `index.html`; no build step is required.

## Deploy

In GitHub Settings → Pages, select **Deploy from a branch**, **main**, and **/ (root)**. The website is served at `/center/`. Relative resources and hash game links support this subdirectory.

## Implementation

The single HTML file contains the responsive styles, original SVG artwork, catalog, and game engines. `startGame()` owns the lifecycle of each game and cancels timers, animation frames, and event listeners on restart or close. Saved state uses `marveto-center-v1` in local storage.

The interface takes inspiration from Poki's colorful, varied-size grid. No Poki game code, game thumbnails, logo, or proprietary assets are included.

## Verification

- All 16 game panels launched in Chrome without console errors.
- Search and no-results state checked.
- Favorites persisted through a page reload.
- Tic-tac-toe and Connect Four win paths checked.
- Minesweeper first reveal and 2048 keyboard/touch controls checked.
- Desktop and 390-pixel mobile layouts visually reviewed.

Long-session difficulty balancing and broader device compatibility remain areas for continued playtesting.
