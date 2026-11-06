# AGENTS.md — MTG Deck Builder

Reference for coding agents (Codex, Claude, etc.) working in this folder. Owner: Patrick Lowe. He has no coding
experience; explain results in plain language, decide and act rather than offering option menus, and never drive his
screen. Not a git repo. If you ever commit anything, author it as Patrick Lowe <patrick.lowe.94@gmail.com> with no AI
co-author trailer.

## "resume"

When Patrick says **resume**, open `RESUME.md` and follow its protocol: Claude Code works Lane C, Codex works
Lane X, both update the board and `gauntlet/RUNS.md`.

## What this project is

Testing and tuning Patrick's two physical Commander decks with the Forge rules engine (headless AI-vs-AI games):

- **Jace, Multiverse Architect** (colors W U B R). The main focus right now.
- **T'Challa, the Black Panther / "Wakanda Forever"** (G W). On hold.

The goal: find card swaps that measurably raise win rate in 4-player bracket-3 pods, then hand Patrick a swap list.

## Sources of truth (read these first)

| What | Where |
|---|---|
| Deck notes (human-readable, authoritative history) | `jace-and-wakanda-current-decks-and-proposed-swaps.md` |
| **Jace baseline = exactly what Patrick owns in the deck** (confirmed 2026-10-29) | `gauntlet/versions/jace/v0.1-real/deck.dck` (`pasted-list.txt` = as he typed it) |
| Wakanda current physical changes (installed 2026-11-04; full inventory reconciliation pending) | `gauntlet/versions/wakanda/CURRENT-DECK.md` |
| Wakanda historical baseline (2026-10-27; preserve for comparisons) | `gauntlet/versions/wakanda/v0.1-real-lands/deck.dck` |
| Every Forge card-script and AI-logic change | `forge/custom/CHANGELOG.md` |
| Results history per deck | `gauntlet/versions/<deck>/history.csv` (header may not match older rows) |

Patrick types card names loosely ("Sierra's Emissary" = Serra's Emissary, "Herald's Post" = Trading Post,
"Vibranium Cache" = Conduit of Worlds). Resolve names against Forge's local card DB first
(`forge/app-custom/res/cardsfolder/cardsfolder.zip`); use Scryfall only after that.

## Layout

```
gauntlet/        4-player test harness (use this for all win rates)
  gauntlet.json    12 bracket-3 opponent decks, 20 balanced pods (each deck in 5 pods), fixed seeds
  gauntlet.js      run one deck version through the pods
  check-deck.js    bracket-3 legality + mana-base check (Scryfall data cached in cache-cards.json)
  insights.js      game patterns (written for T'Challa; general parts work for Jace)
  versions/<deck>/<version>/deck.dck, changes.md, runs/<run id>/{logs/, summary.json, card-stats.csv}
forge/
  app/             Forge 2.0.15, untouched. Original card DB backed up as res/cardsfolder/cardsfolder.zip.orig
  app-custom/      test copy = original cards + forge/custom/cards/*.txt. Rebuild: `python3 custom/build.py` (from forge/)
  custom/          card-script overrides + CHANGELOG.md
  decks/           all .dck files Forge loads (gauntlet copies versions here as <deck>-<version>.dck)
  replaysim/       Java sources (src/forge/view/*.java) compiled to classes/
replay/          local HTML replay viewer (open replay/index.html), build.js, logs/
sim/, analysis/, deckbuilder-check/   older tools; sim/ is a heuristic sim and is NOT reliable — don't quote it
```

Java: `/opt/homebrew/opt/openjdk@21/bin/java` (not on PATH). Node scripts use `scryfall-sdk`; always call
`setAgent('mtg-commander','1.0.0')` first, and batch lookups with `Cards.collection(...)` — Scryfall rate-limits
bursts with a 60 s lockout (HTTP 429).

- **Solo mode:** if Codex isn't available, Claude does Codex's lane too; paired-test reviews run as a separate read-only Claude session (`tchalla-paired-series.py --reviewer claude`). See DECK-WORKFLOW.md.
- **New deck? Follow `DECK-WORKFLOW.md`** (load → baseline → diagnose pilot → propose small packages → staged/paired tests → real-game check; Forge replays on request at any step).
- **Importing a new deck (Moxfield/Archidekt/plain text):** Moxfield has no public API (api2 returns 403), so don't scrape it. Have Patrick use Moxfield's Export (copy text or .txt) and run `python3 gauntlet/import-deck.py <deck> <version> <file|->  [--commander "Name"]` — parses set codes/foil marks/sections, skips sideboard/maybeboard, fixes name punctuation against Forge's DB, refuses to write on unresolved names, never overwrites a deck.dck. Then `node gauntlet/check-deck.js <deck> <version>`.

## Running tests

```sh
cd gauntlet
node gauntlet.js jace v0.5-topdeck-tokens 10 --smart --politics --keeptokens --par=4
node check-deck.js jace v0.5-topdeck-tokens --vs v0.4-keepers
```

- `games` < 20 plays 1 game in each of the first N pods (quick look); 100 = 5 games in each of 20 pods.
- **Patrick's current preference: 10-game quick runs while dialing in cards, then one comprehensive run (100+).**
- At 10 games the 95% CI is roughly ±30 points: use quick runs only to catch dead cards, color problems or a
  collapse, never to rank close decks. Even at 100 games, ~6-point gaps are noise; check significance.
- 4-player games take ~1–2 min each; running several decks in parallel slows each one down.
- Same deck + same code + same pod seed reproduces the same game when run from game 1 of a pod — unless an earlier
  game in that pod hit the 600 s limit (Forge AI decisions have time-based cutoffs, so later games diverge).
- An occasional game stalls and is ended as a draw after 600 s; that's a known Forge quirk.
- Run folders containing `INVALID.txt` or `ABORTED.txt` must be ignored.

Flags (all apply to player 1, i.e. Patrick's deck, and need `--smart`):

| Flag | Env var | Effect |
|---|---|---|
| `--smart` | `SMART_AI=1` | use `app-custom` + `SmartAi.java` card logic |
| `--politics` | `POLITICS=1` | all players gang up on a runaway leader (applies to everyone) |
| `--keeptokens` | `KEEP_TOKENS=1` | tokens with power ≤ 2 don't attack unless lethal (Patrick's Jace play pattern; use for all Jace tests) |
| `--commanderfirst` | `COMMANDER_FIRST=1` | recast any commander from the command zone as soon as cost + tax is payable |
| `--safeattack` | `SAFE_ATTACK=1` | T'Challa won't attack into blockers that can kill him (fires rarely) |
| `--artifactsfirst` | `ARTIFACTS_FIRST=1` | cast MV 4+ artifacts before combat when T'Challa is out |
| `--holdmana` | `HOLD_MANA=1` | hold mana for instants (rarely triggers) |

After editing Java: `cd forge/replaysim && /opt/homebrew/opt/openjdk@21/bin/javac -nowarn -cp ../app-custom/forge-gui-desktop-2.0.15-jar-with-dependencies.jar -d classes src/forge/view/*.java`.
New behavior must be behind an env flag (off by default) so in-flight runs and older results stay comparable.
Log every change in `forge/custom/CHANGELOG.md`.

## Recording replays for the viewer

```sh
cd forge/app-custom
SMART_AI=1 POLITICS=1 KEEP_TOKENS=1 FULL_STATE=1 /opt/homebrew/opt/openjdk@21/bin/java -Xmx3072m \
  -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 \
  -cp ../replaysim/classes:forge-gui-desktop-2.0.15-jar-with-dependencies.jar forge.view.PodSim \
  "$HOME/Projects/mtg-commander/forge/decks" "$HOME/Projects/mtg-commander/replay/logs" \
  <deck>-smart-politics-<podid> <games> <pod seed> <deck>.dck b3-<id>.dck b3-<id>.dck b3-<id>.dck
cd ../../replay && node build.js && open -a "Google Chrome" index.html
```

- Use absolute paths and pass the three opponent decks as separate arguments (zsh doesn't word-split variables).
- Pod seeds and opponents are in `gauntlet/gauntlet.json` (pod01 = seed 100000: Ghalta / Yennett / Thranduil).
- New deck versions need a label in `replay/build.js` (`DECK_LABELS`) and an entry at the front of `ORDER` in
  `replay/index.html`, or their games sort to the bottom of the viewer list.
- `build.js` fails with "Unexpected end of JSON" if a replay is still being recorded; wait and rebuild.

## Working alongside another agent (Claude Code and Codex run in parallel here)

- **Machine budget: 12 cores, 18 GB RAM, each Forge game reserves up to 3 GB.** At most ~4–5 games may run at once
  across BOTH agents. Before starting a run, check `pgrep -fl "forge.view.PodSim" | wc -l`; keep the total ≤ 4, and
  use `--par=2` when the other agent is already running something.
- **Never kill or restart processes you didn't start.** If something is in the way, tell Patrick.
- **Only one agent changes shared engine code at a time** (`forge/replaysim/src`, `forge/custom/`, `gauntlet/gauntlet.js`,
  `replay/build.js`). Recompiling `classes/` or rebuilding `app-custom/` changes behavior for every pod that starts
  afterwards, including the other agent's in-flight runs. New behavior goes behind an env flag (off by default).
- **New deck versions get a new folder name**; never edit a `deck.dck` that has runs in progress. Prefix experimental
  versions with the agent if useful (e.g. `v0.7-codex-…`).
- Log every run you start in `gauntlet/RUNS.md` (one line: time, agent, deck/version, games, flags, purpose) and
  mark it done with the result. Read it first to see what the other agent is doing.
- Results go in the run folder automatically; the per-deck notes (`changes.md`) and this file are the shared memory.

## Custom Forge logic you must know about

- **Jace's −3** (`forge/custom/cards/upcoming/jace_multiverse_architect.txt`): exile is a cost limited to your own
  non-land creature with power ≤ 2 (Forge's AI never exiled its own permanents otherwise). The real card also allows
  exiling a planeswalker; an attempt to allow low-loyalty planeswalkers (2026-10-29) cut −3 usage from ~117 to ~20
  per 100 games and was reverted. Those runs are marked INVALID.
- **`SmartAi.java`**: custom AI for Aetherize, Clever Concealment, Lim-Dûl's Vault, Swiftfoot Boots, Mirrormind Crown,
  Reconnaissance, Greater Good, Midnight Angel Armor; T'Challa-first casting.
- Forge's AI never (or barely) uses some cards; their sim numbers undersell them. Don't judge these on sim data:
  Toxic Deluge (0 casts in 37 draws), Sunfall, Synthetic Destiny, Brainstone, Soothsaying (`AI:RemoveDeck:All`),
  Settle the Wreckage, Kenrith's Transformation, Chainer (`RemoveDeck:All`). The AI also doesn't stack its library
  for Jace's −3 and rarely holds mana for instants.
- Check a new card's Forge `AI:` flags in the card DB before testing it.

## Jace: current state (updated 2026-10-29 evening)

Results are 4-player, `--smart --politics`, vs the 12-deck gauntlet; 25% = even share. **Since 2026-10-29 all Jace
tests use `--keeptokens`** (Patrick's play pattern). Results with and without it are different cohorts — never mix them.

| Version | What | Without `--keeptokens` | With `--keeptokens` |
|---|---|---|---|
| v0.1-real | Patrick's actual deck (baseline) | 28% (100) | **30%** (100; C1) |
| v0-current | older list with the 9 proposed swaps + 4 different lands | 34% (100) | — |
| v0.2-six | v0-current + 6-card removal package | 44% (100; ~40% if 600 s stalls aren't wins) | 32% (50) |
| v0.5-topdeck-tokens | v0.4-keepers + Brainstone, Ponder, Spectral Procession, Sram's Expertise | 3/10 | 36% (50) |
| v0.6-precon-engine | v0.5 + owned precon cards (Skrelv's Hive, Dreadhorde Invasion, Darksteel Angel) | — | 31% (100; C1) — no difference vs baseline |
| v0.7-codex-ghalta | v0.6 + Despark (owned) for Fateful Absence, Reality Shift for Toxic Deluge | — | queued (C3) |

**Main conclusions so far:**
- Played Patrick's way (tokens home), his current deck is ~35%, and **no proposed list has clearly beaten it**. Final C1:
  v0.6 31/100 vs baseline 30/100; paired on 95 clean identical games 31 vs 30 (McNemar p≈1.0).
- The 44% headline was without `--keeptokens` and partly inflated by stalled games; treat it as an outlier.
- How tokens are used was worth ~+7 points for the baseline; no card package has done that reliably.
- Recurring losses for every version: Ghalta (big trample), Yennett (control), wide token swarms (Lathril, Krenko,
  Chatterfang), unblockable threats (Sauron + Artful Dodge).
- Practical advice to Patrick: don't buy the full v0.6 list yet; free changes (owned precon cards, Despark) are fine;
  test small targeted packages (2–3 swaps) against v0.1-real instead of 17 at once.

**Current-deck power test (C7, 2026-10-30):** `JACE-CURRENT-POWER-REPORT.md`. Real-card Jace rules (`--jacerealrules`)
and a combo-aware pilot (`--jacecombo`) exist in a separate runtime; baseline under real rules is 35–36/100 (vs 30 legacy).
Combo assembles ~1/200 games; the #1 limiter is fodder when Jace is ready. Use `--jacerealrules` for future Jace
comparisons (record it; don't mix with legacy-rule runs).

**Data-quality issue (open, Lane C):** games that hit the 600 s limit can be credited as wins in `Game Result`
(conflicting winner lines). `gauntlet.js` counts `Game Result` only. Codex's watcher (`gauntlet/reviews/`) holds these
"suspect" games out; see `gauntlet/versions/jace/ANALYSIS.md` and `gauntlet/reviews/REVIEWER-ISSUES.md`.

**Ownership:** Patrick owns everything in v0.1-real plus precon spares Skrelv's Hive, Dreadhorde Invasion, Darksteel
Angel, Mass Polymorph (Reality Fracture Commander precon). He does NOT own Oath of Teferi, Spark Double, or any of the
9-swap cart cards (Cyclonic Rift, Chandra's Ignition, Oath of Gideon, Clever Concealment, Aetherize, Massacre Wurm, …).
Buy list for v0.6: `JACE-BUY-LIST.md` ($52.09; $21.55 without Cyclonic Rift).

**Game plan and combo constraints:** `JACE-STRATEGY.md` (built on `JACE-COMBO-GUIDE.md`). Its "Keep" list is a hard
constraint for swap proposals: Aminatou, Bolas, Ajani, Saheeli, Way of the Healer, Loyal Tutor, Cursed Mirror, Staff of
Compleation, Staff of the Storyteller, Synthetic Destiny, Martial Coup, White Sun's Twilight, Avacyn (both), Archfiend,
Flux Channeler, Tekuthal are synergy pieces the AI can't pilot; don't cut them on sim stats alone. Weakest real slots:
Overwrite the Multiverse (exile wipe, clashes with Avacyn, Angel of Hope) and surplus mana rocks.

**Patrick's decisions (respect them in any new list):** keep Dreamtide Whale, Massacre Wurm, Triplicate Titan, Loyal
Tutor (stacks Ajani/Aminatou on top for the −3). Tokens are for blocking and −3 fodder, not attacking. Wants more
top-deck manipulation and token makers. Lich's Relic is removal, not a mana rock. Skrelv's Hive Mites can't block.
Dreadhorde Invasion makes one Army that grows (a new 1/1 only after the old one is gone).

**Other notes:** Serra's Emissary and Avacyn, Angel of Horror are top performers. Mill defense proposal in
`JACE-MILL-DEFENSE.md` (Elixir of Immortality first, Liliana, Death's Majesty second; awaiting Patrick).

## Wakanda (on hold)

v0.1-real-lands (his deck) 10% → v1.2-bought14-exact (+ the 14 cards he bought, not yet installed) 22% →
v1.3-proposed-armor 20–23%. Board wipes (v1.4) hurt (they kill T'Challa); tactics flags didn't help. Main issue:
a huge T'Challa gets chump-blocked; needs evasion / ways through. Details in the deck notes and `history.csv`.
