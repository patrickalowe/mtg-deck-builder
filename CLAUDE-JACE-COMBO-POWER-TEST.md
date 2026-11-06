# Claude handoff: evaluate Patrick’s current Jace deck with its actual combo plan

## Task from Patrick

Evaluate the power and consistency of **the exact deck Patrick currently owns and plays**, accounting for the combinations in `JACE-COMBO-GUIDE.md`. Determine what the existing AI misses, then measure the effects of a validated strategy-aware pilot in the unchanged four-player gauntlet.

This request is for a current-deck assessment. Do not install swaps or substitute a v0.6/v0.7/v0.8 candidate. Dreadhorde Invasion, Skrelv’s Hive, Darksteel Angel and Mass Polymorph are owned spares, not confirmed installed. Massacre Wurm is a proposed addition and is also absent from the physical baseline.

Proceed with the necessary test-support implementation under the project’s rules. All new playing behavior must be opt-in and off by default. This document hands implementation/simulation work to Claude’s Lane C; Codex has not modified the engine or started games for this request.

## Sources and exact deck identity

Read `AGENTS.md`, `RESUME.md` and `gauntlet/RUNS.md`, then:

- Physical baseline: `gauntlet/versions/jace/v0.1-real/deck.dck`.
- Baseline SHA-256 when this handoff was written: `df7a4a3fefd8106f67f708ca5464163334c130a81d23c8fdd0d046795f1c0e50`.
- Real play sequences: `JACE-COMBO-GUIDE.md` (16 combinations).
- Claude’s strategic interpretation: `JACE-STRATEGY.md`; use it as hypotheses, not as proof of human win rate.
- Measured baseline: C1, `2026-10-300032-smart-politics-keeptokens-100`, 30 wins in 100 games. v0.6 was 31/100; 95 shared non-suspect pairs gave baseline 30 wins versus v0.6 31.
- Diagnostics: `gauntlet/reviews/CODEX-REVIEW.md`, `REVIEWER-ISSUES.md`, and `analysis/jace-combos/cards.json`.

A metadata-only deck-name change is acceptable for a separately named test copy; quantities, commander and all 99 main-deck cards must remain identical. Store a normalized card-count comparison/hash in the report. Do not edit the authoritative baseline or any version with active runs.

## What this evaluation must answer

1. Can the AI legally execute the actual Aminatou/Bolas/Ajani token-and-haste line?
2. Does intentional fodder creation and top-deck planning reduce turns where Jace is ready but cannot use −3 profitably?
3. Is Patrick’s token-free game consistent with ordinary draw variance, mana constraints, losing tokens, or a recurring supply problem? One anecdote does not establish which.
4. How often does the current deck naturally assemble its engines/combos, on which **personal turn**, and how often do they convert to wins against interaction?
5. What does a validated strategy-aware pilot change relative to the same deck without that policy?
6. What remains unmeasured? Do not turn an AI win rate into a human prediction or an automatic numeric power/bracket rating.

## Coordinate before touching the runtime

- Claude already has candidate runs in flight. Read the current run log; do not stop/restart any other session’s processes.
- Keep total simultaneous PodSim processes at most four. Use `--par=2` when another session is running games. If process inventory is unavailable, coordinate through RUNS.md rather than assuming free capacity.
- Do not recompile shared `classes/`, rebuild `app-custom/`, or change card resources while in-flight work can start further pods against them. Wait for a clear engine-maintenance window or use a genuinely separate runtime/classpath that cannot affect existing runs.
- Preserve the old runtime/build and record source/build hashes. Log code/card changes in `forge/custom/CHANGELOG.md` and every simulation in `gauntlet/RUNS.md`.
- Keep the current 12 opponents, 20 pods, fixed seeds, seating, mulligans and politics unchanged. This is not a new mill gauntlet or an opponent-list redesign.

## Separate real rules from smarter decisions

The existing custom Jace script is deliberately narrower than the real card: it accepts only small creatures and models exile as a cost. That blocks grown creatures and planeswalker fodder and removes opponents’ normal response window. Correcting those rules and improving decision making are different interventions.

Implement two independently recorded switches; suggested names:

- `JACE_REAL_RULES=1`: accurate Jace target/exile behavior, with the same base pilot otherwise.
- `JACE_COMBO_AI=1`: the strategy-aware choices below. Requires or explicitly records the real-rules setting.

Expose them in the harness as opt-in flags, include them in run folder IDs and summary metadata, and record effective Java environment values. Suggested future CLI flags are `--jacerealrules` and `--jacecombo`; **they do not exist at handoff time**. Do not paste them into a run until implemented and checked. Avoid collisions between same-minute run IDs.

For rules-correct resources, use an isolated selected runtime/card-resource copy or an audited gated runtime implementation. Never globally replace the current in-use Jace script to enable one arm.

Real-card requirements:

- Jace −3 targets another creature OR planeswalker you control, with no power/loyalty ceiling. It cannot target itself, a bare artifact/land, or an opponent’s creature.
- Exiling happens during resolution, not as the activation cost. Loyalty is paid when activating. A sole target becoming illegal can stop the ability from resolving; preserve the real response window.
- Targets are chosen before Ajani’s “loyalty ability activated” trigger creates a new Cadet. The new Cadet cannot retroactively become that activation’s target.
- Jace planeswalker tokens created by empower effects are legal fodder. Empower adds to a Jace **token**, not the nontoken commander.
- Aminatou blinks return a new permanent with starting loyalty and a new activation allowance. Adding loyalty by proliferating does not reset that allowance.
- Preserve ordinary priority, main-phase/empty-stack loyalty restrictions and opponents’ legal responses. No extra free activations, mana, tokens, tutoring, deck knowledge or starting cards.

The previous attempt to broaden Jace fodder sharply reduced −3 use. Test the old behavior and the new legal target selection explicitly; “more targets” alone is not a successful implementation.

## Strategy-aware behavior to implement and validate

### Essential: Aminatou + Nicol Bolas, Dragon-God + Ajani Unrelenting

With all three controlled, during a legal loyalty activation window, and initial usable activations/loyalty:

1. Aminatou −1 blinks Bolas; Ajani’s activation trigger makes a Cadet.
2. Returned Bolas uses Aminatou’s inherited −1 to blink Aminatou; Ajani makes another Cadet.
3. Repeat through fresh objects. Each initial −1 user must survive paying loyalty; fresh Aminatou/Bolas have enough.
4. Finish with original Ajani’s +1 if available, or a fresh Bolas borrowing that +1, granting +1/+0 and haste.
5. Let actual combat and opponents’ responses determine the result. A large army is not an automatic victory against attack taxes, prevention, bounce or removal.

No Oath of Teferi or Spark Double is required for this loop. Bolas inherits loyalty abilities, **not Ajani’s token-making trigger**; original Ajani must remain present to supply that payoff.

Use a bounded execution plan to prevent sim hangs: calculate a reasonable army for the visible board, perform legal activations, grant haste, and attempt combat. A diagnostic safety limit is acceptable, but must be logged. If the limit prevents a real decision, mark the diagnostic as unresolved; do not award a win or silently treat a software loop as an ordinary draw. Do not create tokens or declare lethal by fiat.

### Essential: make fodder before spending Jace

- With Ajani but no existing fodder, use an available useful loyalty activation (e.g. Ajani +1) to make the initial Cadet. An existing Cadet can then be targeted by Jace while Ajani creates its replacement.
- With Saheeli already out, casting Jace or another noncreature spell creates a Servo. Recognize that the Servo resolves before the spell and can supply Jace’s first activation.
- Use Way of the Healer’s granted −2 and existing Jace planeswalker tokens when legal; assess the cost of losing a useful walker versus using expendable fodder.
- Avoid exiling Aminatou/Bolas/Ajani as routine fodder when a functioning or near-term combo should be preserved. This is a board-state choice, not an unconditional “never exile” prohibition.
- Keep Patrick’s small tokens home for blocking/fodder under the existing lethal-attack exception. A truly lethal hasty Cadet attack should remain possible.

### Essential: plan a known top card, then use Jace

- Aminatou +1, Brainstorm and Brainsurge can place a chosen creature/planeswalker from hand on top.
- Loyal Tutor in this deck finds a **planeswalker**, not an ordinary creature. When appropriate, find the missing engine piece and arrange Jace’s hit.
- Aminatou’s top-deck +1 and blink −1 cannot both be used on the same unchanged permanent in one turn. Use another setup spell if reserving Aminatou for a blink.
- Avoid a pointless draw/shuffle that consumes the arranged card before Jace reveals it.
- Select from information the AI is entitled to know: its own hand, a card it deliberately put on top, and revealed information. Do not scan unknown library order or opponents’ hidden hands to select actions.

### Essential: useful blink decisions

- Jace at one loyalty after −3 → Aminatou blinks him → another −3 if another valid target exists.
- Archon/Galactus/Memnarch/Overlord blink repeats its entry effect; compare this with resetting Jace rather than always choosing one.
- Blinking an impending Overlord returns it as a normal creature without the impending counters, with another pair of Insects. Do not grant haste without an actual effect.

### Additional engines: implement where feasible, report coverage honestly

- Cursed Mirror copying Archon for an entry trigger plus a hasty attack; respect legend rules for other copy choices.
- Avacyn, Angel of Hope with destroy wipes; do not count indestructible as protection against Sunfall/Overwrite exile.
- Staff of Compleation destroys Triplicate Titan while Avacyn, Angel of Horror schedules its return; Titan’s death supplies Golems. Exile is not death.
- Flux Channeler/Tekuthal/Whale proliferation for loyalty growth and counters; no extra activation permission from more loyalty.
- Synthetic Destiny converts an existing token/creature board; it does not fix an empty board and does not reveal planeswalkers.
- Saheeli copying Archfiend on an artifact through the end step; two Archfiend triggers compound life loss. No new card-type choice from merely turning an existing artifact into Emissary.
- Nissa/Passage landfalls on different turns; Nissa draws before revealing, and fetch effects shuffle.

Do not claim all 16 guide entries were simulated intelligently if only some policies were implemented. Publish a supported/partial/unsupported behavior table.

## Stage 1 — deterministic rules/sequence fixtures

Create separate diagnostic positions outside the official win-rate series. Supply the needed pieces only in those fixtures; their outcomes do not enter reported deck win rates.

Minimum cases:

1. Legal Aminatou/Bolas/Ajani loop produces repeated Cadets, stops deliberately, grants haste and uses real combat.
2. Missing Ajani, insufficient initial loyalty, spent activations and missing legal targets do not create a fake win or illegal activation. Opposing removal can interrupt the loop.
3. Ajani can seed fodder first; Jace cannot choose the Cadet that does not yet exist at activation.
4. A grown creature and an expendable planeswalker are eligible under real rules; protected/illegal targets are not.
5. A target removed in response has the correct real-card resolution behavior.
6. Arranged top card from hand/tutor is used correctly without hidden-library knowledge.
7. Aminatou resets Jace but cannot +1 and −1 on the same unchanged object; proliferation alone does not reset it.
8. The lethal-attack exception permits an actual hasty Cadet finish, without sending small fodder on routine nonlethal attacks.

Record pass/fail with source logs, not just a printed claim. Freeze the implementation before a comprehensive run. Fix failures and repeat only the affected diagnostics. Do not proceed to a “combo-aware” headline while the essential loop/rules cases fail.

## Stage 2 — 10-game natural-draw calibration

Use the physical baseline, unchanged opponents/seeds, `--smart --politics --keeptokens`, and three distinct policy labels:

- **A: Legacy control:** real-rules OFF, combo AI OFF.
- **B: Real-rules control:** real-rules ON, combo AI OFF.
- **C: Strategy-aware:** real-rules ON, combo AI ON.

Check A against the historical first-game-per-pod control as a reproducibility diagnostic. Unexpected drift needs investigation rather than automatic reuse of old results. Freeze one build; all playing differences must be behind the recorded switches.

The ten-game stage diagnoses action coverage, illegal behavior, target-selection collapse, color problems and performance. No combo naturally assembled in ten games is **not** proof that the combo is irrelevant; the fixture establishes capability, while the natural games estimate availability.

## Stage 3 — comprehensive matched comparison

When calibration passes, run **B and C for 100 natural-draw games each**, five per existing pod. This isolates strategy-aware piloting while both use the same real-card rules. Run a fresh 100-game A control only if drift or another unresolved comparison question justifies it; historical A remains context, not a substitute for a matched B/C comparison.

- Same deck, seeds, seating, mulligans, general opponent behavior, politics, token flag and frozen runtime.
- No guaranteed combo cards, stacked opening hands or forced tutor outcomes.
- Never mix fixture outcomes or old no-KEEP_TOKENS runs into the comparison.
- No behavior edits mid-run. If a material rules/policy bug is found, mark the affected run invalid, retain evidence and start a new labeled run after fixing it.
- Keep the shared resource budget; queue rather than overloading another run.

## Required telemetry

Use companion JSONL/CSV logs rather than modifying historical game logs. For each game record:

- Version, flags, build/resource hashes, pod, seed, seat, raw winner, corrected result, draw/suspect reason, and termination reason.
- Actual personal turn of commander casts, first available fodder, first legal −3, first resolved −3, combo assembly, attempt and win. Global turn/4 is only an approximate secondary measure after players are eliminated.
- Whether Jace is present, has enough loyalty, has an activation available, has a legal fodder target, and why the policy declines to use it. Distinguish “no tokens” from “no legal targets,” “wrong timing,” “saving a valuable piece,” and “insufficient development.”
- Separate creature tokens, planeswalker tokens, nontoken creatures and nontoken walkers; record power/controller and actual chosen fodder.
- Actual revealed Jace hits and entries to the battlefield, including cards not cast. Ordinary text logs often omit hits, so instrument the real event; do not infer confirmed hits from follow-up triggers.
- Top-deck setup source, card known to the player, whether it remained arranged, and whether it became the intended hit.
- Each combo piece drawn/entered/lost; all-three-present opportunities, legally executable opportunities, attempts, successful token-generation sequences, interruptions, haste use and actual combat wins.
- Token creation, blocking, attacking and deaths with reliable controller attribution. A final empty hand after elimination is not proof there were no earlier stranded cards.
- Loss causes, including life loss, commander damage, Angel of Destiny and empty-library draws. A 0/negative-life transition is not necessarily a loss under a can’t-lose effect.
- Wipes/protection actually used; castable opportunities declined; mana held or spent when relevant. Do not call a card a misplay merely because it was seen but uncast.

Suggested turn snapshots: start of main phase on personal turns 4, 5 and 6, plus the first legal post-Jace activation window. Tag any behavior-specific diagnostics without exposing hidden information to the pilot.

## Score and interpret results correctly

Respect C5’s corrected scoring. Audit both timeout thresholds and conflicting/multiple-winner records against original outcomes; do not assume every near-ten-minute finish is a genuine win. Treat timed-out/unresolved engine games consistently in all arms. Report both all-started-game results (suspects as draws) and a paired non-suspect sensitivity analysis, with exact denominators. Do not silently pool unlike scoring cohorts.

Report win rate with 95% intervals, exact paired discordant counts and an appropriate paired test. Repeated fixed-seed pods limit independence; acknowledge that. A small nonsignificant difference does not prove equivalence. Do not infer an individual card’s causal value from “win when cast.”

Power assessment should distinguish:

1. **Measured generic-AI performance:** historical baseline 30/100.
2. **Measured strategy-aware performance:** only the new supported B/C results, if validated.
3. **Demonstrated capability:** fixture-verified combos, which are not natural-game frequency or speed estimates.
4. **Remaining human/AI uncertainty:** unsupported decisions and opponent-pilot limitations.

Do not assume human win rate must be above the AI’s, call 30/100 statistically proven “above average,” or assign an 8/10 rating because an infinite combo exists. For bracket fit, discuss actual consistency/speed and the official guidance rather than card-count shortcuts. Do not promise a bracket upgrade from a higher simulated win rate.

## Deliverables for Patrick

Write `JACE-CURRENT-POWER-REPORT.md` with:

- A short plain-language assessment of the unchanged physical deck.
- A/B calibration and B/C comprehensive results, supported behaviors and limitations.
- Whether the deck’s recurring problem is drawing fodder, affording it, losing it, or the pilot not using it.
- Natural combo assembly/attempt/success rates and turn distributions, with denominators.
- Win/loss patterns and whether improved sequencing helped meaningfully.
- Recommendations to practice existing lines first; any later swap suggestion must respect current keep-constraints and remain separate from this deck-power test.
- At least one replay of a genuine combo/engine sequence and one informative failure. Label fixture replays separately if no natural game assembled the combo.
- Links to raw results, exact commands, flags, build hashes and diagnostic logs.

Update `RESUME.md`, `gauntlet/RUNS.md` and the deck’s notes. If essential AI behavior cannot be implemented reliably, deliver the validated subset and explain the limitation explicitly instead of claiming the current deck’s full combo-aware power has been measured.

## Appendix — exact deck to test

This is the physical baseline at handoff time, included so this file is portable. The on-disk authoritative deck remains the source of truth; investigate a discrepancy rather than silently selecting an upgraded list.

```text
[metadata]
Name=jace-v0.1-real
[Commander]
1 Jace, Multiverse Architect
[Main]
3 Plains
1 Mountain
1 Island
1 Swamp
1 Command Tower
1 Restless Spire
1 Reflecting Pool
1 Sunken Ruins
1 Contaminated Landscape
1 Exotic Orchard
1 Fetid Heath
1 Radiant Summit
1 Perilous Landscape
1 Innovative Commons
1 Turbulent Shore
1 Underground River
1 Turbulent Wetlands
1 Restless Anchorage
1 Isolated Chapel
1 Caves of Koilos
1 Sulfur Falls
1 Room of Refuge
1 Clifftop Retreat
1 Haunted Ridge
1 Kher Keep
1 Mystic Gate
1 Shivan Reef
1 Battlefield Forge
1 Fabled Passage
1 Theorix Annex
1 Drowned Catacomb
1 Theorist's Sanctum
1 Sulfurous Springs
1 Glacial Fortress
1 Path of Ancestry
1 Turbulent Crater
1 Prairie Stream
1 Proteus Staff
1 Staff of the Storyteller
1 Fellwar Stone
1 Arcane Signet
1 Cursed Mirror
1 Lich's Relic
1 Talisman of Indulgence
1 Dimir Signet
1 Talisman of Dominance
1 Talisman of Creativity
1 Sol Ring
1 Staff of Compleation
1 Chromatic Lantern
1 Rakdos Signet
1 Azorius Signet
1 Talisman of Progress
1 Izzet Signet
1 Plan for All Outcomes
1 Way of the Healer
1 Sunfall
1 Overwrite the Multiverse
1 Lingering Souls
1 White Sun's Twilight
1 Martial Coup
1 Occult Epiphany
1 Fatehold Charm
1 Swords to Plowshares
1 Theorix Charm
1 Stroke of Midnight
1 Flawless Maneuver
1 Synthetic Destiny
1 Secure the Wastes
1 Brainstorm
1 Brainsurge
1 Loyal Tutor
1 Despark
1 Grand Crescendo
1 Path to Exile
1 Memnarch, the Warden
1 Tekuthal, Inquiry Dominus
1 Galactus, Devourer of Worlds
1 Avacyn, Angel of Horror
1 Archon of Cruelty
1 Teferi, Hero of Dominaria
1 Nissa, Leyline Tamer
1 Aminatou, the Fateshifter
1 Elspeth, Sun's Champion
1 Saheeli, Sublime Artificer
1 Dreamtide Whale
1 Overlord of the Mistmoors
1 Nicol Bolas, Dragon-God
1 Ajani Unrelenting
1 Silver Surfer, Galactus's Herald
1 The Theorist, Jace Beleren
1 Avacyn, Angel of Hope
1 Jhoira, Weatherlight Corsair
1 Triplicate Titan
1 Serra's Emissary
1 Archfiend of Despair
1 Flux Channeler
```
