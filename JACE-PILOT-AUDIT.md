# Jace pilot audit (RESUME C13–C15)

Audits use completed runs only (no new simulations unless stated). Evidence paths are relative to the project root.

## C13 — +loyalty and proliferate play (2026-10-30)

**Sources:** frozen pilot-v3 baseline `gauntlet/versions/jace/v0.1-real/runs/*-pilotv3-*-100` (100 games, text logs + telemetry)
and the 20 full-state pilot-v3 replays in `replay/logs/jace-v1.{0,1}-*-g1.{log,state.jsonl}`. Script:
`analysis/proliferate-audit.py`.

### Dreamtide Whale "adds no counters" — replay display bug, not an engine bug

- Diagnostic runtime `forge/replaysim/classes-diag` (`PROLIF_DEBUG=1` logs every proliferate decision). Fixture
  `gauntlet/fixtures/jace/f13-whale-proliferate.state`: the Whale trigger asked player 1, offered Jace + Whale, and the
  AI **chose both**; full state shows Jace 2 → 3 loyalty and Whale 2 → 3 time counters.
- Root cause: counter changes made while an ability resolves are stamped with the log position *before* its
  "Resolve Stack" line. The viewer applied them one step early (on the "triggered" line), so the resolution looked
  empty. **Fixed** in `replay/build.js` (resolution-time snapshots now show after the Resolve line). The first audit
  pass had the same off-by-one; corrected numbers below.
- Corrected, across 20 full-state games: **Dreamtide Whale proliferate added counters to 59 of 62** eligible friendly
  permanents (walkers 31/33, Whale time counters 20/20); **Flux Channeler 36 of 49** (most "misses" are back-to-back
  triggers the window can't separate). Tekuthal's "proliferate twice" replacement fired 20 times in the baseline.

### Planeswalker activation use (100-game v3 baseline)

| Walker | Activations | My turns it started on battlefield | Turns left unused |
|---|---|---|---|
| Jace, Multiverse Architect | 406 | 256 | **58** |
| Aminatou | 53 | 40 | 13 |
| Nicol Bolas | 36 | 21 | 4 |
| Ajani Unrelenting | 51 | 23 | 2 |
| Elspeth | 65 | 35 | 2 |
| Teferi | 59 | 31 | 6 |
| Saheeli | 12 | 56 | 49 (expected: her only ability is −2 copy) |
| The Theorist | 74 | 46 | 2 |

(Nissa, Leyline Tamer is a creature, not a planeswalker — Scryfall and Forge agree; earlier notes calling her a walker were wrong.)

### Verified omissions (candidates for an opt-in pilot v4; not applied to frozen v3)

1. **Jace idle turns (58/256).** The −3 was correctly declined (per-turn: no fodder 110, only valuable pieces 55,
   would kill Jace at 3 loyalty 40) but Forge's stock Draw AI often also skipped **+1** (draw 2, put 1 on bottom).
   +1 adds loyalty, digs, and lifts Jace off the 3-loyalty trap. Policy: if Jace is fresh and the −3 is declined, +1.
2. **Staff of Compleation proliferate never used** (modes used: draw 41, untap 12, destroy own permanent 1 — it
   destroyed Patrick's own Nissa once). Candidate: pay 3 life to proliferate when it (a) takes Jace from 3 → 4 so the
   −3 is safe, or (b) adds loyalty to ≥ 2 walkers, with a life floor (e.g. ≥ 15) and no better Staff mode.
3. **"Proliferate before −3 at exactly 3"**: Flux Channeler / Whale triggers from casting a noncreature spell first
   can also lift Jace 3 → 4; sequence spells before the −3 when available.
4. Blink vs build: Aminatou resetting a high-loyalty walker returns it at printed loyalty; v3 only resets *spent* Jace
   (1 loyalty) or pre-resets below 4, so no high-loyalty walker was wastefully reset in the audit. No change needed.

Not verified / out of scope: Staff "destroy own permanent" intent (one case), opponent proliferate choices.

## C14 — Jace readiness and blocking for planeswalkers (2026-10-30)

**Exposed Jace (100-game v3 baseline, text logs):** 228 Jace casts; activated the turn he was cast 187 (82%);
**died before Patrick's next turn 113 (49%)** — combat 81, removal/other 31, own −3 1. So Patrick's replay
observation holds: commander-first casts Jace into boards where he gets attacked off.

**Blocking for walkers (20 full-state v3 games):** walkers attacked 58 times by 78 attackers; **21 attackers blocked**.
44 attacks happened while Patrick had ≥ 1 untapped creature token; in **29 of those no block was assigned**. Some are
legitimate (e.g. ground Soldiers vs flying Yennett), but examples include four untapped flying Insect tokens letting
Tyvar + Selvala hit Jace unblocked. The analysis can't yet separate evasion from missed blocks precisely; the v4
fixture/screen will log block decisions with reasons.

**Pilot v4 plan (opt-in `JACE_PILOT_V4`, separate runtime `classes-v4`; v3 stays frozen):**
1. Jace +1 when the −3 is declined (C13 #1), but never draw away a planned top card.
2. Staff of Compleation proliferate (pay 3 life, life ≥ 15) to lift Jace 3 → 4 before a −3 when no blinker (C13 #2/#3).
3. Conditional Jace casting: hold when no fodder and the visible attack threat would kill a +1 Jace through available
   blockers; never hold more than 2 of Patrick's turns in a row; other commanders unchanged.
4. Chump-block attackers of Patrick's planeswalkers with expendable creature tokens when the attacker would kill the
   walker, unless trample makes it pointless or blockers are needed to survive lethal damage to Patrick.

## C15 — combo-guide coverage (2026-10-30)

Each `JACE-COMBO-GUIDE.md` entry, marked separately for: explicit pilot policy (JaceCombo v3/v4), stock Forge AI
behaviour, staged fixture proof, and natural occurrences in the 100-game frozen-v3 baseline (unchanged physical deck).
"Natural" counts are observed log events, not proof of correct strategic use.

| § | Line | Explicit policy | Stock AI | Fixture | Natural (100 games) |
|---|---|---|---|---|---|
| 1 | Aminatou + Bolas + Ajani Cadet loop → haste | Yes (v2+) | — | f1 PASS; f2a/f2b negatives | Assembled 2×, loop not needed (army already ≥ goal); 0 loop steps |
| 2 | Ajani (or Elspeth) makes fodder before −3 | Yes (v2 Ajani; v3 Elspeth) | Elspeth used 65× | f3, f11a/b PASS | seed_fodder 4×; Elspeth double 0× (pieces never together) |
| 3 | Way of the Healer / Jace tokens as fodder | Yes (PW tokens in fodder) | Way −2 by stock AI | — | Jace-token targets ~8–10 per 100 (C7) |
| 4 | Saheeli Servo before Jace resolves | No explicit sequencing | Incidental | — | Saheeli trigger on Jace cast 10× (9 games) |
| 5 | Stack top (Aminatou +1 / Brainstorm / Brainsurge / Loyal Tutor) → −3 | Yes (Aminatou +1, top choice, tutor) | Brainstorm cast 41× | f6 PASS | top_setup 2×, tutor picks 29×; **two-hit Brainstorm ordering with Aminatou reserved: not implemented** |
| 6 | Aminatou resets Jace for a 2nd −3 | Yes (v2 reset; v3 pre-reset) | — | f7, f11a/d/f PASS | resets 21× (13 games), pre-resets 14× |
| 7 | Aminatou blinks ETB creatures (Archon, Galactus, Memnarch, Overlord) | Yes (4 targets) | — | — | 0× (always a better use); **impending Overlord → blink: not implemented** (Overlord cast 10×) |
| 8 | Cursed Mirror copies Archon / Emissary | No | Stock copy choice | — | Mirror cast 14×; copy target not verified |
| 9 | Avacyn, Angel of Hope + destroy wipes | No | Stock | — | ~3 destroy wipes cast after Avacyn appeared (board presence unverified) |
| 10 | Staff of Compleation + Avacyn of Horror + Titan | No | Stock | — | 0× |
| 11 | Flux Channeler + Tekuthal double proliferate | v4 uses Staff proliferate only | Stock triggers; selections correct (C13) | f13 (diag) | Tekuthal doubled 20× (10 games) |
| 12 | Synthetic Destiny converts tokens | No | Stock almost never casts | — | 0× cast |
| 13 | Saheeli copies Archfiend (end-step life loss) | No | Stock | — | 0× |
| 14 | Nissa + Fabled Passage landfall on two turns | No | Stock | — | Not measured (landfall text pattern unverified) |
| 15 | Staff of the Storyteller tokens → draws | No | Stock | — | 20 draws (13 games) |
| 16 | Serra's Emissary + Avacyn, Angel of Hope | No | Stock | — | Not measured |

**Priorities by opportunity × impact** (no new mass implementation): readiness/blocking (C14 v4, under test) first;
then Brainstorm two-hit ordering with Aminatou reserved (§5) and impending-Overlord blink (§7), which come up in ~10–40%
of games. Rare lines (§10, §12, §13) aren't worth AI work now — judge them in Patrick's real games. Synthetic Destiny
remains a documented human line; Forge's AI support is unproven.
