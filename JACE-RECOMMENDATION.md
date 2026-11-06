# Jace — recommendation after reviewing Claude’s work

> **Final baseline update (2026-11-03):** all500completed,159corrected wins(31.8%),55suspect. No new purchase/swap established; physical list remains the reference. Token-target fallback appeared in208/445clean games; inspect setup decisions and low-life Jhoira risks before interpreting it as a card deficit. [Final evaluation](gauntlet/versions/jace/v0.1-real/BASELINE-500.md).

> **Current recommendation for Patrick’s next real game — 2026-10-30 (supersedes the older swap priorities below):** No purchases confirmed. Keep the physical v0.1-real list unchanged for this game. Dreadhorde-only finished 22/100 vs baseline 30/100 (paired 21 vs 29, p=0.17): no adoption from this evidence, not proof of poor human-play fit. Pilot v4 finished 33/100 vs v3 30/100 (paired 33 vs 29, p=0.57): sequencing fixes active but no proven win increase. Clever Concealment screen failed to use it on walkers; not evidence that the card is bad. Whale counters work; replay timing was fixed. Use existing early token sources, cast Jace with a useful immediate plan/survival assessment, use +1 when appropriate, preserve blockers, select beneficial counters, and reserve Aminatou deliberately for setup versus reset. Reanimation remains untested and is not a next-game purchase requirement. Source: JACE-PILOT-AUDIT.md, completed run summaries and shared run log.

**Latest priority update from Patrick’s real game:** he had no tokens available to exile. Investigate recurring fodder first: trial owned Dreadhorde Invasion for Synthetic Destiny, with Skrelv’s Hive as the next fodder-only option (Mites cannot block). Preserve existing token sources and mana rocks; defer the White Sun’s Twilight cut in the earlier survival package until token consistency is checked. Existing simulation files remain unchanged. One game does not establish the cause.

Prepared by Codex, 2026-10-29 evening. Sources: Claude’s deck versions/changes, the completed C1 game logs, per-card CSVs, and the detailed live-game reviews. No simulations or engine changes were made for this recommendation.

**My recommendation: keep your physical deck as the foundation and trial three targeted swaps. Do not buy/install the 17-swap v0.6 package on the strength of these results.** The three swaps below are a practical deck-fit recommendation, not a measured winning package yet.

## The first three changes I would try

| Remove | Add | Why |
|---|---|---|
| White Sun’s Twilight | **[Massacre Wurm](https://scryfall.com/card/fdn/714/massacre-wurm)** | You wanted this payoff kept. It can shrink an opposing small-token army without wiping your own blockers, punishes opposing creature deaths, and is another useful Jace reveal hit. Twilight’s Mites cannot block, and its full wipe needs seven mana. Wurm does not clear creatures that stay above 2 toughness, and hard casting requires BBB. |
| Overwrite the Multiverse | **[Anguished Unmaking](https://scryfall.com/card/pip/209/anguished-unmaking)** | Keep the five-mana Sunfall as your exile board wipe, while gaining three-mana instant exile for a troublesome creature, planeswalker, artifact or enchantment. Exile can prevent death-trigger/reanimation value and handles indestructible. It costs three life and still needs a legal target. |
| Synthetic Destiny | **[Aetherize](https://scryfall.com/card/fdc/59/aetherize)** | Add a four-mana emergency answer to a whole attacking army, including unblockable creatures. It does not target those creatures, and attacking tokens disappear after leaving the battlefield. You retain Lingering Souls, Secure the Wastes, Grand Crescendo, your token-producing walkers and Proteus Staff. |

Aetherize buys time against nontoken armies rather than permanently removing them; creatures with strong entry effects may be dangerous when recast. It does not undo attack triggers. Against a human opponent you must keep four mana available before combat damage. Replacing Synthetic Destiny gives up a real instant-speed protection/transformation option—its poor Forge usage is not proof it is a weak human-play card.

Ready-to-test list: [v0.8-codex-survival](gauntlet/versions/jace/v0.8-codex-survival/deck.dck). All 39 lands and baseline mana rocks are preserved. Dreamtide Whale, Triplicate Titan and Loyal Tutor stay; Massacre Wurm is added. **Keep your owned Despark:** it is already one of your cheap exile answers, not a card you need to buy or restore in this baseline-based list.

## What Claude’s completed comparison actually supports

I independently counted the C1 logs in `2026-10-300032-smart-politics-keeptokens-100`, ignoring invalid/aborted runs and identifying near-600-second/conflicting-winner results:

| List | Completed logs | Reported Jace wins | Suspect results | No commander cast | No resolved Jace −3 |
|---|---|---|---|---|---|
| Physical baseline v0.1-real | 100 | 30 | 3 | 14 | 44 |
| Proposed v0.6-precon-engine | 100 | 31 | 3 | 24 | 47 |

There are **95 common pod/game pairs with neither result suspect: 30 baseline wins versus 31 v0.6 wins**. Baseline-only wins: 18; v0.6-only wins: 19. That is essentially no observed separation. In this latest comparison the suspect games are credited to opponents, so treating them as draws does not change Jace’s raw 30/100 and 31/100 win totals. It does affect how losses/draws and opponent matchups are reported.

These are fixed pods/seeds and a limited AI pilot, not independent real-world tournament trials. “No detected benefit” is not proof that every v0.6 addition is bad. The 17 simultaneous swaps prevent assigning individual causes. Independent count snapshot with every included game key: `analysis/jace-recommendation/comparison-snapshot.json`.

Claude’s move toward small baseline-based packages is sound. Two earlier interpretations need qualification:

- The old v0.2 44% came from a different token-policy cohort and included suspect Jace win credits. It cannot justify buying that package for Patrick’s current play pattern.
- The interim baseline ~35% and claimed ~7-point benefit from keeping tokens were not a completed controlled effect estimate. The latest baseline is 30/100; the old no-KEEP_TOKENS baseline was 28/100. Neither a seven-point causal improvement nor the value of a specific package has been established.

## Claude’s latest v0.7 quick test

Claude has also completed v0.7 at **6/10**, compared with v0.6’s 5/10 quick result, and started a 100-game v0.7 run. I checked its actual casts: Despark was cast in 2/3 games seen; Reality Shift in 4/5. Targets included Karametra, Chatterfang, Krenko, Wirewood Channeler, Harald Unites the Elves and Meren—**neither addition targeted Ghalta in these ten games**. The cards are usable by the AI and can answer other engines, but this is not proof they improved the Ghalta matchup, nor that a one-win difference ranks the lists. Keep the comprehensive run unchanged while testing baseline-based packages separately later.

## Why I would preserve the mana base and acceleration

The v0.6 package removes Fellwar Stone, Cursed Mirror, Staff of Compleation, Azorius Signet, Talisman of Indulgence, Talisman of Creativity, Rakdos Signet and Izzet Signet from the physical baseline. Those are substantial acceleration/fixing cuts; Staff of Compleation really can make mana, while Lich’s Relic is removal and is not counted as a rock.

The existing checker reports baseline sources W25/U31/B25/R25 versus v0.6 W22/U26/B21/R18. These are the checker’s simple production counts, not exact on-curve probabilities. v0.6’s 24 commander-uncast games versus baseline’s 14 are consistent with investigating development problems, but do **not** prove that rock cuts caused them. The new packages preserve the rocks to avoid making the same confounded comparison.

Preserve Proteus Staff and your top-deck tools for now. They fit your real play decisions more closely than the AI’s limited library planning can measure. Keep Sunfall: Forge’s zero casts are a piloting limitation, not a reason to discard an efficient exile wipe in human games.

## What the games establish about individual additions

- **Darksteel Angel:** a concrete verified save in v0.6 pod16-g4. Jace fell from 1 to −1, the log explicitly applied the can’t-lose effect, and Jace later won. That is real observed functionality, not proof that adding the card alone raises win rate.
- **Massacre Wurm:** in C1, seen in 28 games and hard cast in 10; Jace won five of those cast games. Small, conditional samples cannot isolate its effect, and Jace entries are not counted as casts. Its anti-small-creature role and Patrick’s preference justify a focused trial.
- **Anguished Unmaking:** cast in 21 of 28 games seen in C1. The card is usable by Forge. More importantly, v0.6 pod18-g3 shows the danger of destroy removal: Fateful Absence killed Junji; Junji reanimated Patrick’s Memnarch under Meren’s control; Memnarch then attacked Patrick. Exile avoids that particular death-trigger line.
- **Aetherize:** C1 cast it in 10 of 37 seen games, with only one win among those casts. That is **not** a positive statistical signal; it may reflect casting only while already losing, poor mana reservation, limited timing, or genuinely insufficient recovery. I recommend a small trial for its defensive fit, not because the simulator proves it strong.
- **Wrath of God:** C1 cast in 15/25 seen games, with 3/15 wins among casts. Earlier cohorts looked better. It remains a sensible cheaper wipe to test against swarms, but a wipe package is not a proven universal upgrade and it kills your own fodder too.
- **Dreadhorde Invasion:** recurring Army fodder/blocking is attractive and owned; its life loss matters, one Army grows rather than a new independent token appearing each turn, and the sim’s power-2 exile restriction understates later real-life fodder options.

Do not interpret any win-when-cast percentage as a card’s causal win-rate contribution. The same applies to high conditional figures for Darksteel Angel or Clever Concealment.

## Changes I would defer

- **Cyclonic Rift:** defer the expensive purchase. The complete package has not earned its cost on results, and no isolated Rift comparison exists. It remains a strong rules effect; that is different from proving it is the best use of this deck’s budget.
- **Skrelv’s Hive:** not the first token addition for a blocking-focused plan. Mites cannot block. Dreadhorde is the better owned blocking/fodder trial, subject to life-loss and growing-Army limitations.
- **More expensive payoffs:** keep the good existing finishers; ordinary hard-cast scarcity often misses Jace’s role. Do not cut Whale/Titan/Loyal Tutor on that basis.
- **New top-deck purchases:** retain Brainstorm, Brainsurge and Loyal Tutor. The AI does not reproduce Patrick’s intended stack-and-reveal play well enough to rank new top-deck purchases reliably.
- **Mill-specific cards:** keep the separate [mill proposal](JACE-MILL-DEFENSE.md) separate. The existing opponent gauntlet does not establish whether adding a narrow mill slot improves this deck overall.

## Four concrete small packages for Claude C6

Every package is a fresh copy of v0.1-real, not another layer on v0.6. Each has 100 cards, all 39 original lands, all original mana rocks and the existing keepers. Alternate diagnostics that do not add Wurm are not recommendations to remove the Wurm from the preferred final candidate; it was absent from the physical baseline to begin with.

| Priority | Version | Swaps | Main question |
|---|---|---|---|
| 1 | [v0.8-codex-survival](gauntlet/versions/jace/v0.8-codex-survival/changes.md) | Twilight → Wurm; Overwrite → Anguished; Synthetic → Aetherize | Does the preferred three-card survival package help without cutting acceleration? |
| 2 | [v0.8-codex-owned-engine](gauntlet/versions/jace/v0.8-codex-owned-engine/changes.md) | Synthetic → Dreadhorde; Overwrite → Darksteel | Can the owned cards improve fodder/recovery resilience at no purchase cost? |
| 3 | [v0.8-codex-swarms](gauntlet/versions/jace/v0.8-codex-swarms/changes.md) | Twilight → Wurm; Martial Coup → Wrath | Are a four-mana reset and the Wurm better against wide armies than the expensive X-spell slots? |
| 4 | [v0.8-codex-exile](gauntlet/versions/jace/v0.8-codex-exile/changes.md) | Overwrite → Anguished; Synthetic → Reality Shift | Do two more instant exile answers help big/recurrent threats and Yennett-side permanents? |

The packages overlap intentionally and are alternatives, not instructions to combine every change. The no-purchase package can be tried in real games first if Patrick wants to spend nothing.

Validation completed: exact 100-card/singleton counts, preserved lands/rocks/keepers, local Forge scripts and AI flags, current Scryfall legality/identity/Game-Changer fields, and the existing `check-deck.js` comparison versus v0.1-real. Available bracket/mana checks PASS for all four (zero Game Changers). The checker used the documented temporary network fallback because Commander Spellbook DNS is unavailable; **the online two-card combo audit remains incomplete**, and the PASS is limited accordingly. No shared checker/engine code was modified.

Claude owns execution. Start with 10 games of the preferred survival list, with `--smart --politics --keeptokens`, then use matched baseline seeds and inspect behavior before expanding. Avoid declaring a winner from two or three extra wins in a quick run. The existing v0.7 test is still useful, but tests answers on top of the unproven v0.6 package rather than on Patrick’s physical baseline. Its 6/10 quick result does not change the preferred cautious three-card trial.
