# Marveto Center — gameplay quality review

## Assessment

The first release proved navigation and game launchers worked. It did not establish a high gameplay-quality bar. Most games are compact rule demonstrations: one pattern, minimal feedback, no progression, and nearly identical presentation. This is the central problem; adding more titles or decorative effects would not resolve it.

The reference principle is an accessible mechanic with room for mastery. For example, [Blumgi Ball on Poki](https://poki.com/en/g/blumgi-ball) combines aimed shots with a teleport mechanic, authored levels, and character unlocks. We should apply that level of intentional design to our own games, not copy its assets or mechanics wholesale.

## First benchmark: Neon Breaker / Reactor Run

Replaces the single repeated brick wall with five authored chambers. Paddle impact position controls rebound angle; launch aiming makes the opening shot intentional. Orange cores destroy neighboring bricks, armor takes two hits, and a player-triggered four-second pulse pierces targets after six breaks. Chains between paddle contacts increase scoring. Stage clears grant a life and a choice between a wider paddle and a slower ball.

A full run starts in chamber one. Unlocked chambers support practice; practice runs do not replace the full-run best. Chamber unlocks, medals, best score, and mute preference persist separately from the original portal state. Three stars require no misses and finishing within the displayed stage time. The result screen explains the criterion.

The presentation uses a consistent industrial arcade palette, target-specific markings, a readable ball trail, brief debris, core shockwaves, and distinct synthesized hit/launch/loss sounds. Sound can be muted. Reduced-motion mode removes shake and trails and reduces debris. Hiding the tab or changing window focus pauses play and requires explicit resume.

The implementation separates the DOM-free simulation from rendering, uses 240 Hz physics steps, resolves brick side hits correctly, and cleans up every listener, frame, and audio context on restart or close.

## Prioritized plan for the other 15 games

These are proposed next iterations, not completed features. Preserve each game's core identity, portal entry, and existing favorites.

| Order | Game | Current weakness | Next focused improvement |
|---|---|---|---|
| 1 | Midnight Drift | Random single cars, abrupt lane movement, no track identity | Authored traffic patterns with guaranteed escape lanes, animated lane changes, near-miss scoring, and distinct road sectors. |
| 2 | Cloud Hopper | Familiar one-input clone with an unchanging rhythm | Designed obstacle sequences, generous first encounters, optional risky coin routes, and milestone scenery. |
| 3 | Jungle Snake | Repeated fruit collection on an empty rectangle | Authored gardens, readable obstacles, a buffered turn system, and optional fruit chains that reward routing. |
| 4 | Pocket Pong | One AI pace and rudimentary hits | Three opponent styles, fair reaction delays, intentional paddle-angle shots, and a short match ladder. |
| 5 | Star Catcher | Random stars/meteors without interesting decisions | Readable waves, high-value risky stars, a chain meter, and clear recovery after a miss. |
| 6 | Bubble Burst | Random clicking with little skill structure | Predictable target rhythms, accuracy-based combo scoring, and short escalating rounds. |
| 7 | Mole Patrol | Emoji targets, one repeating spawn rule | Cohesive character animation, warning tells, decoys with distinct silhouettes, and authored wave rhythms. |
| 8 | 2048 Pop | No movement animation, progress disappears on close | Board resume, coherent tile slide/merge animation, one-step undo, and clearly stated personal milestones. Preserve standard merge rules. |
| 9 | Slide Quest | Starts at an arbitrary scramble, no learning curve | Difficulty-selectable boards, scramble depth bands, smooth movement, and personal bests by board size. |
| 10 | Matcha Match | Emoji pairs and a single board | Original card illustrations, staged board sizes, satisfying flips, and best moves per difficulty. |
| 11 | Treasure Field | Minimal affordances and hidden tactical information | Mine counter, timer, desktop right-click flags, touch flag control, chord reveal, and difficulty choices with safe opening. |
| 12 | Color Echo | Bare sequence repetition with no sound cues | Distinct notes and shapes, measured pacing, progress milestones, and clear mistake/retry feedback. |
| 13 | Quick Spark | A single reaction trial, misleading generic score | Five-trial sessions, median reaction time in milliseconds, false-start handling, and a comparable personal best. |
| 14 | Four Together | Local-only board with no animation or opponent | Falling disc animation, highlighted winning line, rematches, and optional computer opponents with real difficulty levels. |
| 15 | X Meets O | Local-only solved game with no match structure | Clear marks/win line, first-to-three match scoring, rematch flow, and an optional honest unbeatable opponent. Keep it a compact classic. |

## Acceptance gate

First, the owner plays Neon Breaker on the device they care about. Assess: Do rebounds feel predictable? Is aiming useful? Are cores and pulse understandable? Does clearing a chamber make another run appealing? Does the presentation feel coherent rather than decorated?

Only after that judgment should the benchmark be extended to the next games. Automated testing cannot establish fun or aesthetic approval. Every subsequent game needs a concrete mechanic/feel improvement, a distinct art direction, readable instructions, suitable audio, a quick retry loop, and relevant regression checks.

## Verification

Run `node --test neon-breaker.test.cjs` for deterministic simulation checks. Tests cover authored level bounds, serving, collision axes, armor, chain reactions, charge/pulse behavior, paddle angles, misses/game over, pause, medals, stage upgrades, practice semantics, and long simulations in every chamber.

Browser checks cover integration with the existing portal, desktop/mobile layout, start/restart/close, keyboard launch, aim slider, pause/resume, mute persistence, and console errors. These checks do not certify subjective difficulty, audio mix quality, or the fun of a complete human-played run.
