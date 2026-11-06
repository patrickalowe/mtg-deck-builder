# MTG Deck Builder — deck workflow

How Patrick, Claude Code and Codex take a new deck from list to tested upgrades. Patrick drives everything from chat
("new deck", "resume", "show me replays"). Claude runs simulations and owns the simulator/engine code; Codex does
research, analysis and reviews. The shared task board is `RESUME.md`; rules for both agents are in `AGENTS.md`.

## 1. Load the deck (~10 min)

- **Patrick:** on Moxfield, Export → copy text (or download the `.txt`) and paste it in chat with the deck's name.
  Say which spare cards you own. (Moxfield links can't be fetched: no public API, and it blocks outside access.)
- **Claude:**
  - `python3 gauntlet/import-deck.py <deck> v0.1-real <file|->  [--commander "Name"]` — parses Moxfield/Archidekt/
    plain text (set codes, foil marks, sections), keeps sideboard/maybeboard out of the deck, fixes name punctuation
    against Forge's card database, stops on real typos with suggestions, never overwrites an existing deck.
  - `node gauntlet/check-deck.js <deck> v0.1-real` — bracket 3 (Game Changers, mass land destruction, extra turns,
    two-card combos) and mana check.
- **Output:** `gauntlet/versions/<deck>/v0.1-real/` = the exact physical baseline (never edited afterwards).
  Maybeboard cards make a ready-made swap-candidate list.

## 2. Baseline — how good is it now? (1–5 h)

1. **10-game smoke test** — dead cards, color problems, crashes.
2. **100-game baseline** on the standard 12-opponent gauntlet (`gauntlet/gauntlet.json`, 20 pods):
   `node gauntlet/gauntlet.js <deck> v0.1-real 100 --smart --politics --par=4` (+ deck-specific pilot flags).
3. **Optional 500-game baseline** across 5 different opponent groups (`--gauntlet=b1` … `b5`, 58 bracket-3 decks,
   disjoint groups) for a stable number. Reference: Jace 31.8% (159/500); 25% = fair share in a 4-player pod.
- **Codex:** baseline report — win rate with uncertainty, who beats the deck, how the commander's games go, loss
  patterns with example games, and anything that looks like a simulator quirk.

## 3. Diagnose — is the simulator playing it like Patrick would?

Forge's AI misplays some decks badly (it never exiled its own permanents with Jace's −3, wiped its own winning board,
didn't block for planeswalkers, cast the commander into exposed boards). So:

- **Watch replays** (`replay/index.html`). Full recordings (`FULL_STATE=1`) show counters, loyalty, combat arrows,
  blockers and hands; log-only copies show plays and life totals.
- **Codex writes a combo/play guide** from the list and audits which lines the AI actually executes.
- **Claude adds deck-specific pilot rules** as opt-in flags, each proven by fixtures (staged board positions,
  `gauntlet/fixtures/`), in its own frozen runtime. Examples: T'Challa-first, keep tokens home, Jace pilots v2–v4.
- **Output:** a pilot you trust + a list of cards the simulator can't judge (evaluate those in real games).

## 4. Propose changes

- **Codex:** small packages of 1–3 swaps, each aimed at one loss pattern; owned cards first, then cheap buys;
  respects Patrick's keep list. Buy lists with current prices on request.
- **Claude:** builds each as a new version folder (`versions/<deck>/v1.x-...`) and runs `check-deck.js`.

## 5. Test changes — in increasing stages

1. **10-game screen:** does the new card get cast and do its job? (Not for ranking — 10 games is mostly luck.)
2. **Matched 100-game run:** same pods/seeds as the baseline; compare on identical games (paired).
3. **Paired five-round test** for real candidates (the C17 design): baseline vs candidate on the same 100 predeclared
   games per round across opponent groups b1–b5 = 1,000 games, a hard 610-second kill per game
   (`gauntlet/c17-round.py` pattern), and a supervisor that has **Codex review each round** (`codex exec`, read-only)
   before the next one starts. Example result: T'Challa + 11 swaps 117/500 vs 84/500, paired p ≈ 0.009.

Decide on the paired result. Don't rerun to chase a better number; inconclusive stays inconclusive.

## 6. Decide and confirm in real games

- **Patrick:** buy/install only what tested well. Log 5–10 real games (opening hand, first token turn, commander
  timing, what killed it) so we can check that the simulator matches the table.

## Forge replays — available at any step, on request

Patrick can ask for replays at any point. They open in the local viewer (`replay/index.html`, Chrome) at the top of
the list, labeled by deck version and pilot.

**What to say** (examples): "show me the last 10 games" · "replay the games Codex highlighted" · "show me a win and a
loss against Ghalta" · "replay b5pod07-c2" · "full detail please".

**What Claude does:**

1. **Pick the games.** The last N finished, specific games by id, or examples from Codex's reviews (`round-N/review.md`,
   `FINAL-REVIEW.md`, `gauntlet/reviews/`). Say which deck version, opponents and result each one is.
2. **Choose the fidelity:**
   - **Full recording (preferred when the machine has a free slot):** replay the exact game with `FULL_STATE=1` so the
     viewer shows counters, loyalty, power/toughness, combat arrows/blocker panel, mana and hands. A game reproduces
     exactly when it's a single-game trial (C17-style ids like `b5pod07-c2`) or the **first** game of a pod; use the
     same deck file, runtime (classes dir + card DB), flags and seed as the test. Scripts: `replay/record-v3.sh
     <version>` (Jace pilot v3 screens) or the per-trial pattern in the C17 replays.
   - **Log-only (instant, no machine time):** copy the finished game's `.log` + `.hand.jsonl` into `replay/logs/`.
     Shows plays, attacks, blocks, life and hands, but no counter/loyalty badges. Use when the machine is busy, the
     game isn't reproducible (a later game in a pod after a stall), or Patrick wants many games quickly.
3. **Name files so they don't collide:** `<forge deck name>-<flags>-<pod or trial id>-g<N>` (e.g.
   `wakanda-v1.8-c17-installed-smart-politics-b5pod07-c2-g1`). New deck versions need a label in `replay/build.js`
   (`DECK_LABELS`) and an entry at the front of `ORDER` in `replay/index.html`.
4. **Build and check:** `cd replay && node build.js && node check-viewer.cjs`, then `open -a "Google Chrome" index.html`.
5. **Report honestly:** confirm each re-recorded game has the same winner as the test; flag any that drifted (Forge's
   time-based AI cutoffs) as "a different game from the test". Flag stalled games (they score as draws).

**Rules:** respect the ≤ 4-games-at-once budget (record 4 at a time; queue behind running tests, or briefly cap a
single recording's memory with `-Xmx1536m`); never record into a run folder (use `replay/logs/`); a replay is
evidence about one game, not a win rate.

## Solo mode — Claude only (no Codex)

Everything above works with Claude alone. Where this file says **Codex**, Claude does that work in the same session
(research, buy lists, play guides, analysis reports). The only automated Codex step is the per-round review in a
paired five-round test; in solo mode the supervisor runs that review as a **separate, read-only headless Claude
session**, so the reviewer still doesn't share context with the session that ran the games:

    python3 gauntlet/tchalla-paired-series.py --check --reviewer claude   # preflight (no Codex login needed)
    python3 gauntlet/tchalla-paired-series.py --reviewer claude           # rounds → independent Claude review → continue

The reviewer gets read-only tools (Read/Glob/Grep) and must return `reviewed: true` and `decision: continue` before the
next round starts, exactly like Codex. Verified 2026-11-05 on C17 round 5: same verdict as Codex. With one agent,
skip the `RESUME.md` lane split; keep using it as a log so a later session can pick up.

## Timing

100 games ≈ 1 h · 500 ≈ 5 h · paired five-round test ≈ 6 h. Keep the Mac awake and plugged in (sleep inflates game
times and turns games into draws). At most 4 Forge games run at once across both agents.

## Lessons learned (avoid repeating these)

- Some cards the AI can't or won't play (Toxic Deluge, Mass Polymorph, Brainstone, Soothsaying, Chainer): judge
  them in real games, not by simulated win rate.
- Change the pilot **or** the cards in a comparison, never both. Freeze each pilot version (own compiled runtime).
- Fixed seeds replay the same games. For fresh data use new opponent groups (`--gauntlet=bN`) or `--seedoffset=N`.
- Stalled games (≥ 600 s, conflicting winners, or killed by the wall timeout) count as **draws**, never wins.
  Some decks stall Forge often (e.g. Captain Sisay, Círdan) — report them, don't silently drop them.
- zsh doesn't split `$VARS`: pass every flag separately (`gauntlet.js` refuses a combined "--a --b" argument).
- Replays reproduce exactly only from a pod's first game (or a single-game trial); Forge's time-based AI cutoffs can
  make a later game drift.
- Card-conditioned win rates ("won X% when cast") are associations, not proof a card is good or bad.

## Key files

`gauntlet/import-deck.py` · `gauntlet/check-deck.js` · `gauntlet/gauntlet.js` (+ `gauntlet.json`, `gauntlet-b1..b5.json`,
`gauntlet-mill.json`) · `gauntlet/c17-round.py` + `gauntlet/tchalla-paired-series.py` (paired five-round test) ·
`gauntlet/fixtures/` · `forge/replaysim/src/forge/view/` (PodSim, SmartAi, JaceCombo) · `forge/custom/CHANGELOG.md` ·
`gauntlet/RUNS.md` · `RESUME.md` · `replay/` (viewer, `record-v3.sh`).
