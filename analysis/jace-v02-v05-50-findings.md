# Jace v0.2 vs v0.5 — 50 games per version

Completed October 29, 2026. Both versions played 50 four-player games against the same 20 opponent pods and seeds. Settings: smart AI, politics, keep small tokens home; two pods in parallel per version. The runner was corrected to schedule exactly 50 games rather than rounding to 60. Deck and engine fingerprints were verified unchanged during the comparison.

| Measure | v0.2-six | v0.5-topdeck-tokens |
|---|---:|---:|
| Games | 50 | 50 |
| Engine-reported wins | 16 (32%) | 18 (36%) |
| Whole-game timeout warnings | 7 | 2 |
| Wins in 42 matched games without whole-game timeout warnings | 13 (31%) | 16 (38%) |
| Games casting Jace | 45 | 44 |
| Average first Jace cast, own turn, among games casting him | 6.2 | 6.5 |
| Jace −3 resolutions | 58 | 74 |

## Interpretation

v0.5 led this sample, but the margin does not establish that it is stronger. The paired comparison of the 42 games without whole-game timeout warnings is not statistically significant (exact McNemar p = 0.678). These are simulations against this opponent pool, not predictions of real-table win rates.

v0.5 produced about 28% more Jace −3 resolutions overall. That is consistent with its token and setup package supporting the commander, but this experiment does not isolate individual swaps. First Jace casting times were similar, and one fewer v0.5 game cast Jace. This does not establish either the presence or absence of mana problems.

The AI never cast Toxic Deluge (seen in 19 v0.2 games and 18 v0.5 games). It cast Clever Concealment in only 3/16 and 2/19 games where seen, respectively. The existing custom Jace script alters his actual targeting rules and timing. Top-deck sequencing remains an AI limitation.

## Timeout audit

The engine recorded zero draws, but stdout reports whole-game timeouts in seven v0.2 games and two v0.5 games while still printing winners. Those winner labels should not be trusted. Eight distinct matched game IDs were affected in either version; excluding those IDs from BOTH lists leaves 42 comparable games. This exclusion is a sensitivity check, not a replacement unbiased 50-game experiment: slow games may differ systematically. Internal AI decision timeouts also occurred (27 v0.2, 22 v0.5).

## Practical recommendation

Keep v0.5 as the working list: it preserves Patrick's chosen cards and did not show a clear performance disadvantage here. Do not claim it is proven stronger, or make further cuts solely from these results. Fix timeout classification before a larger validation run. No deck lists or AI rules were changed during these games.

Detailed per-game outcomes and timeout IDs: `jace-v02-v05-50-comparison.json`.
