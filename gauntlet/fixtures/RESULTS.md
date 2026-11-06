# C7 Stage 1 — fixture results

Frozen build: classes-combo sha256 `db65413fea0768a2…` (source JaceCombo+PodSim `3ff6206a731fa6f0…`); card DB app-jace-real `7ccc339dd1f04e00…`
(legacy app-custom `02c2b0e93031edd8…`). Deck v0.1-real sha256 `df7a4a3fefd8106f67f708ca5464163334c130a81d23c8fdd0d046795f1c0e50` (matches the handoff).
Arm: `SMART_AI POLITICS KEEP_TOKENS JACE_REAL_RULES JACE_COMBO_AI JACE_TELEMETRY` + `FIXTURE`. Fixture games are
diagnostics only (result line says "not scored"); they never enter win rates. Re-run: `sh gauntlet/fixtures/run-fixtures.sh`.

| Fixture | Checks | Result | Exceptions | Evidence |
|---|---|---|---|---|
| f1-loop-legal | Legal Aminatou/Bolas/Ajani loop makes Cadets, stops, grants haste, real combat | PASS | 0 | `fixtures/out/f1-loop-legal-g1.log`, `.jace.jsonl` |
| f2a-loop-missing-ajani | No Ajani: no loop attempted | PASS | 0 | `fixtures/out/f2a-loop-missing-ajani-g1.log`, `.jace.jsonl` |
| f2b-loop-low-loyalty | Loyalty 1 Aminatou/Bolas: no loop step, no wasted finish | PASS | 0 | `fixtures/out/f2b-loop-low-loyalty-g1.log`, `.jace.jsonl` |
| f3-ajani-seeds-fodder | Ajani seeds fodder; Jace targets the pre-existing Cadet | PASS | 0 | `fixtures/out/f3-ajani-seeds-fodder-g1.log`, `.jace.jsonl` |
| f4-spent-walker-fodder | Expendable planeswalker is legal fodder (real rules) | PASS | 0 | `fixtures/out/f4-spent-walker-fodder-g1.log`, `.jace.jsonl` |
| f4b-grown-token-fodder | Grown token (power 4) is legal fodder (real rules) | PASS | 0 | `fixtures/out/f4b-grown-token-fodder-g1.log`, `.jace.jsonl` |
| f6-topdeck-setup | Aminatou +1 puts payoff on top; Jace −3 hits it (no hidden-library knowledge) | PASS | 0 | `fixtures/out/f6-topdeck-setup-g1.log`, `.jace.jsonl` |
| f7-aminatou-resets-jace | Aminatou resets Jace for a 2nd −3; no +1 and −1 on the same Aminatou | PASS | 0 | `fixtures/out/f7-aminatou-resets-jace-g1.log`, `.jace.jsonl` |
| f8a-tokens-lethal | Small tokens attack when lethal | PASS | 0 | `fixtures/out/f8a-tokens-lethal-g1.log`, `.jace.jsonl` |
| f8b-tokens-nonlethal | Small tokens stay home when not lethal | PASS | 0 | `fixtures/out/f8b-tokens-nonlethal-g1.log`, `.jace.jsonl` |

**Not fixture-verified (honest gaps):** opponents removing a loop piece or the −3 target in response (Forge's AI
can't be forced to respond; the rules engine handles it — real-card Jace targets on activation, so a removed target
makes it fizzle); proliferation not resetting an activation (engine-enforced, not separately tested).

## C11 — pilot v3 (2026-10-30)

Runtime `forge/replaysim/classes-v3` sha256 `ac2cf6906041dc9c…` (source `563993549754a967…`), card DB app-jace-real, flags
`JACE_REAL_RULES JACE_COMBO_AI JACE_PILOT_V3 JACE_SAFE_WALKERS` (+ fixture env). Pilot v2 runtime `classes-combo` untouched.

| Fixture | Checks | Result |
|---|---|---|
| f11a-elspeth-double | Jace 4 + Aminatou + Elspeth, no fodder → Elspeth +1, −3 Soldier, Aminatou resets Jace, −3 Soldier; Jace blinked once, never died/recast (no tax) | PASS |
| f11b-elspeth-no-blinker | No blinker → Elspeth +1 seeds, single −3 (no fake reset) | PASS |
| f11c-blinker-low-loyalty | Aminatou at 1 can't blink → single −3 on a Soldier; Aminatou NOT exiled as fodder | PASS |
| f11d-jace3-pre-reset | Jace at exactly 3 + fresh Aminatou → blink Jace first (→ 4), then −3; Jace survives | PASS |
| f11e-jace3-no-blinker | Jace at 3, no blinker → declines −3 ("would_kill_jace"), uses +1 | PASS |
| f11f-one-fodder-no-elspeth | One token → −3, reset, second −3 takes the revealed 2/2, not Aminatou | PASS |
| f1–f8 regression under v3 | all 10 original fixtures | 10/10 PASS |

Audit (C11): pilot v2 allowed −3 at exactly 3 loyalty when a blinker was fresh. That's wrong: Jace hits 0 and dies
(state-based) before any sorcery-speed blink. v2 keeps that behavior for reproducibility; v3 fixes it.

## C13/C14 — pilot v4 (2026-10-30)

Runtime `forge/replaysim/classes-v4` sha256 `a731aa7146681ace…`; flags add `JACE_PILOT_V4` (gauntlet `--pilotv4`, requires `--pilotv3`).

| Fixture | Checks | Result |
|---|---|---|
| f13-whale-proliferate (diag runtime) | Whale trigger asks player 1; AI selects Jace + Whale; full state shows +1 loyalty, +1 time | PASS (bug was replay timing; fixed in build.js) |
| f14a-jace-idle-plus1 | No fodder → Jace +1 instead of idling | PASS |
| f14b-staff-proliferate | Jace 3 + Staff + one token, no blinker → Staff proliferate (3 life) → Jace 4 → −3 → survives at 1 | PASS |
| f14c-block-for-jace | Opponent's Craw Wurm attacks Jace (2→3 after +1) → Spirit token chump-blocks; Jace survives | PASS (note: Forge then added a 2nd Spirit to the same block — wasteful) |
| f14d / f14e hold vs cast Jace | Fixture loader removes the command-zone commander, so cast/hold can't be staged | NOT TESTABLE in fixtures — verified in natural games via telemetry (jace_hold / jace_cast_after_hold) |
