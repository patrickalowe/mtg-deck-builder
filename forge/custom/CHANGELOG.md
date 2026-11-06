# Custom Forge changes (test-only)

Forge's own install (`../app`) is never modified. `python3 custom/build.py` builds `../app-custom` from Forge's original
card database plus the scripts in `custom/cards/`. Custom AI logic lives in `../replaysim/src/forge/view/SmartAi.java`
and only applies to player 1 (Patrick's deck) when `SMART_AI=1`.

## Card scripts (`custom/cards/`)

| Date | Card | Change | Why |
|---|---|---|---|
| 2026-10-26 | Jace, Multiverse Architect | −3 rewritten: exile is a cost, limited to a non-land creature with power ≤ 2 | Forge's AI never targets its own permanents with exile (0 of 163 activations). Patrick's rule: feed it tokens/small creatures. Side effect: opponents can't respond between exile and dig. |
| 2026-10-26 | Lim-Dûl's Vault | removed `AI:RemoveDeck:All` | Flag stopped the AI from ever considering it; SmartAi now casts it at an opponent's end step. Script still has `UnlessAI$ Never` (AI won't pay life to dig deeper). |
| 2026-10-27 | Greater Good | removed `AI:RemoveDeck:All` | Never cast in 80 games; SmartAi casts it with 2+ creatures and sacrifices threatened creatures. |
| 2026-10-27 | Reconnaissance | removed `AI:RemoveDeck:All` | Never cast in 80 games; Forge's RemoveFromCombat AI is hard-coded "disabled for the AI"; SmartAi handles it. |
| 2026-10-27 | Azorius Signet | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Beast Within | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Cauldron of Souls | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Dimir Signet | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Dispatch | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Fetid Heath | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Izzet Signet | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Mystic Gate | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Proteus Staff | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Rakdos Signet | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Sungrass Prairie | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Sunken Ruins | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Selesnya Signet | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (same as the other Signets). In Patrick's real Wakanda list. |
| 2026-10-27 | Synthetic Destiny | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |
| 2026-10-27 | Trading Post | removed `AI:RemoveDeck` flag | Forge told its AI never to play it (0% cast in sims). Verify cast rate on the next run; if still misplayed, mark "AI can't pilot". |

## Custom AI logic (`SmartAi.java`, player 1 only)

| Date | Card | Logic |
|---|---|---|
| 2026-10-26 | Aetherize | Cast once an opponent declares attackers at you for 6+ damage or lethal. |
| 2026-10-26 | Clever Concealment | Cast in response to threats; phase out every threatened nonland permanent. |
| 2026-10-26 | Lim-Dûl's Vault | Cast at an opponent's end step. |
| 2026-10-27 | Swiftfoot Boots | Cast only in main phase 2 once you control your commander or a creature worth protecting. |
| 2026-10-27 | Mirrormind Crown | Equip the best non-legendary creature (token copies survive the legend rule). |
| 2026-10-27 | Reconnaissance | Cast with 2+ creatures; remove blocked attackers that would die; untap attackers after damage. |
| 2026-10-27 | Greater Good | Cast with 2+ creatures; activate when a creature with power ≥ 3 is threatened. |
| 2026-10-28 | Midnight Angel Armor | Cast when affordable (after a waiting T'Challa); equip it to T'Challa whenever he's out and not already wearing it. Patrick asked: in 100 games the AI cast it in only 14 of 26 draws (round 8.4) and moved it onto T'Challa just twice. |
| 2026-10-27 | T'Challa, the Black Panther | When T'Challa is in the command zone and affordable, recast him first; hold artifacts with MV 4+ until he's out. Patrick spotted it in a replay: the AI left T'Challa in the command zone for 5 rounds while casting 5 big artifacts (10 counters lost). |

Known limit: Forge's AI never holds mana open on its own turn, so reactive instants still under-perform vs. a human.

## Mulligan rule (`PodSim.java`, every player)

Keep a 7-card hand only with 3 or 4 lands; Commander's free first mulligan applies; a hand is kept once it would drop to 4 cards.

## 2026-10-27 — PodSim ARTIFACTS_FIRST=1 (gauntlet `--artifactsfirst`)
Player 1 only, with SMART_AI. In main phase 1 with T'Challa on the battlefield, cast the most expensive affordable
artifact with MV 4+ before combat, so his +1/+1 counters and the Rhino trigger land before he attacks.
Why: in v1.3 games ~27% of T'Challa's own-turn counter triggers came after combat. Smoke test (pod03, seed 777):
cast Helm of the Host before combat.

| 2026-10-29 | Jace, Multiverse Architect | −3 exile cost now also accepts another planeswalker you control with loyalty ≤ 2 | Real card allows exiling a planeswalker; Patrick uses spent walkers as fodder. Old rule (creatures power ≤ 2 only) left −3 dead after a wipe. |
| 2026-10-29 | Jace, Multiverse Architect | REVERTED the planeswalker-fodder change above | With it the AI used −3 only ~20 times per 100 games (vs 117 before); results from those runs (v0.2-six 35%, v0.3-titan 17%) are invalid and marked INVALID in their run folders. |

## 2026-10-29 — PodSim KEEP_TOKENS=1 (gauntlet `--keeptokens`)
Player 1 only, with SMART_AI. Creature tokens with power ≤ 2 are pulled out of attacks (including politics gang-ups)
unless the attack is lethal to the defender, so they stay home to block and as exile fodder for Jace's −3.
Why: Patrick's play pattern. In the v0.5 10-game run 22 of his attack declarations included tokens and 106 tokens died.
Result (10 games, pods 1–10): token attacks 22→2, token blocks 6→11, Jace −3 uses 12→16, wins 3/10 → 3/10 (same winner in every pod).
Smoke test (pod04, seed 400000): kept Spirit tokens home 5 times, tokens blocked 5 times, −3 used 4 times, win.

## 2026-10-29 — gauntlet.js: stalled games count as draws (RESUME C5)
Games that hit Forge's 600 s limit, or whose `Game Result` and `Game Outcome` lines name different winners, are now
"suspect" and scored as draws (summary.json adds `rawWins` and `suspect`). Before this, some stalls were credited as
wins (found by Codex, X2). Runs before this change keep their old summaries; re-score them with the clean rule when
comparing (e.g. v0.7 100: raw 37/100, clean 35/96).

## 2026-10-29 — C7 Jace combo-power test support (separate runtime; nothing shared changed)
- `forge/app-jace-real/`: `python3 custom/build.py --out app-jace-real --exclude upcoming/jace_multiverse_architect.txt`
  = app-custom with Forge's ORIGINAL real-card Jace script (−3 targets any other creature/planeswalker you control;
  exile on resolution). app-custom (legacy power ≤ 2 cost-exile Jace) untouched.
- `forge/replaysim/classes-combo/`: compiled from src incl. new `JaceCombo.java`; shared `classes/` NOT recompiled.
- New opt-in env (all player 1 only, off by default): `JACE_REAL_RULES` (legal −3 targeting policy), `JACE_COMBO_AI`
  (Aminatou/Bolas/Ajani Cadet loop, fodder seeding, top-deck setup, Jace reset, ETB blinks, Loyal Tutor piece choice),
  `JACE_TELEMETRY` (<game>.jace.jsonl), `FIXTURE` (diagnostic GameState; results labeled "not scored").
- gauntlet.js flags: `--runtime=combo`, `--jacerealrules`, `--jacecombo` (requires real rules); run IDs carry seconds
  and labels; summary.json records flags + build/card/deck hashes.
- Stage 1 fixtures: 10/10 PASS — `gauntlet/fixtures/RESULTS.md`.

## 2026-10-30 — C8 pilot v2 (separate runtime classes-combo; opt-in)
- `JACE_SAFE_WALKERS=1` (gauntlet `--safewalkers`): player 1 won't fire Ajani Unrelenting's −3 (or Bolas borrowing it)
  when it would kill more of our own nontoken creature value than opponents' (needs opponents' loss ≥ 2× ours). C7 saw
  this self-wipe 26–31 times per 100 games. Fixture f9: guard blocks it (telemetry `safe_walker_block`).
- `COMMANDER_FIRST` fix: it checked the commander's plain spell ability, which is never castable from the command zone
  (the "Commander Effect" may-play permission lives on the castable copies). Now uses `getAllPossibleAbilities()`.
  It had never fired before (no runs used `--commanderfirst`). Natural pod12-g1 (Jace never cast in C7): Jace cast on
  turn 5 and recast. Fixture f10 can't test this (GameState-created commanders lack the Commander Effect link).

## 2026-10-30 — C11 pilot v3 (separate runtime `replaysim/classes-v3`; flag `JACE_PILOT_V3` / gauntlet `--pilotv3`)
- Exactly-3-loyalty fix: −3 at 3 kills Jace before any blink (pilot v2 wrongly treated a fresh Aminatou/Bolas as a rescue).
  v3: only a deliberate one-shot onto a payoff it put on top; otherwise blink Jace first (→ 4), then −3.
- Elspeth double −3: Jace ≥ 4 + fresh blinker + < 2 fodder → Elspeth +1 (3 Soldiers) → −3 → reset → −3, one Soldier left.
  Elspeth +1 also seeds a single −3 when there's no fodder.
- Aminatou/Bolas/Ajani are never routine −3 fodder in v3.
- Fixtures: 6 new + 10 regression, all PASS (gauntlet/fixtures/RESULTS.md). Frozen v3 classes sha256 ac2cf6906041dc9c….

## 2026-10-30 — C13/C14 pilot v4 (separate runtime `replaysim/classes-v4`; `JACE_PILOT_V4` / gauntlet `--pilotv4`)
- Jace +1 when the −3 is declined (C13: Jace idle on 58/256 turns in the v3 baseline). Never draws away a planned top card.
- Staff of Compleation proliferate (pay 3 life, life ≥ 15) to lift Jace 3 → 4 before a −3 when no blinker (Staff proliferate was never used).
- Conditional Jace cast: hold in the command zone when no fodder and the visible attack (after one blocker per untapped
  creature) ≥ 5; at most 2 turns in a row (C14: Jace died before Patrick's next turn on 49% of casts).
- Chump-block attackers of our planeswalkers with the cheapest legal token when the attacker would kill the walker,
  unless trample still kills it or blockers are needed against lethal damage to Patrick (C14: 29/44 walker attacks with
  tokens available got no block). Telemetry: walker_block / walker_unblocked (with reason), jace_plus1, staff_proliferate, jace_hold.
- replay/build.js: resolution-time state changes now display after the Resolve line (Dreamtide Whale proliferate looked empty).
- Frozen v4 classes sha256 a731aa7146681ace…; v3 (classes-v3) unchanged.
