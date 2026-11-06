# Wakanda Replays

Local replay viewer for Forge AI games (T'Challa vs. bracket-3 decks). Open `index.html` in a browser — no server needed.

- `./record.sh [games per opponent] [archidekt deck ids...]` — records Forge games into `logs/` (default: 2 games each vs. Thranduil, Giada, Ghalta, Krenko, Wilhelt, Octavia). Uses `../forge/replaysim` (`ReplayRecorder`), which plays exactly like `forge sim` and also writes `*.state.jsonl`: live power/toughness, counters, loyalty, tapped state, controller, exact hand contents and hand/library sizes after every game event. To rebuild it after a Forge update: `javac -cp ../app/forge-gui-desktop-2.0.15-jar-with-dependencies.jar -d classes src/forge/view/ReplayRecorder.java` in `../forge/replaysim`.
- `node build.js` — parses `logs/*.log` into `data/games.js` and downloads card images into `img/` (cached).
- Controls: space = play/pause, ← / → = step, click any log line to jump, hover a card for a large preview. Deep link: `index.html#game=313935-1&step=112`.

## What's rebuilt from the log (and what isn't)

Shown: lands, permanents and tokens entering and leaving, tapped state, attacks (red) and blocks (blue, with lines to the attacker), spell targets (gold), damage and life changes, **live power/toughness** (green = above printed, red = below), **counters** (gold badges, e.g. `+1/+1 ×9`), planeswalker loyalty, **both players' hands** (newly drawn cards marked NEW, every draw listed in the play-by-play), hand/library/graveyard/exile counts, commander zone, the winner.

## Counters and combat (2026-10-30)

Cards show live loyalty as `L 4` and named counter badges such as `Time ×3`, `Story ×2` or `+1/+1 ×1`. Hover a card for a larger image and its current counter values. Counter changes have their own play-by-play steps. Values come from recorded full-state data; older recordings without it cannot reconstruct every counter reliably.

During combat, a summary lists the attacking player, each creature, its defending player or planeswalker, and named blockers. Red arrows lead toward the attack destination; blue dashed lines join blockers to attackers. The panel distinguishes explicit “Unblocked” declarations from “No blocker recorded yet.” Assignments remain through combat and clear at its end.

Refresh `index.html` to load an updated build. Rebuild finished recordings with `node replay/build.js`; recordings without a Game Result are skipped so active recordings are not parsed halfway through. Regression checks: `node replay/check-viewer.cjs`.

Fast gauntlet recordings without full-state data now load Patrick’s separate `.hand.jsonl`: opening hand, hand changes and draw steps are retained. The hand has a dedicated row beneath Patrick’s battlefield, including during combat.

## Action timing and mana evidence

Recorder snapshots are synchronized by log-entry count, not physical line count (one combat entry may have multiple lines). Mana activations are now visible in play-by-play with the recorded ability text; an ability without a tap cost no longer marks its source tapped. The text can list several color options; it does not record which option was chosen or prove the exact mana spent on a spell. Casting labels distinguish printed cost from actual payment, and resolved abilities show their effect text. Battlefield entries are not labeled as additional casts. The log notes whether a recording has full card-state data or only reconstructed board details.

## Latest T’Challa comparison batch

`python3 replay/import-latest-tchalla.py` copies the latest completed/reviewed C17 batch’s valid logs and hand streams into the viewer, without running Forge or modifying source runs. It skips suspect/timeout results, records provenance in imported-games.json, preserves per-case trial IDs and sorts imported batches before the archive. Run `node replay/build.js` afterward. Current imported batch3:100before,98installed;2suspect installed trials excluded. These gauntlet recordings lack full-state snapshots, so exact live counters/power/toughness are not available for every permanent.
