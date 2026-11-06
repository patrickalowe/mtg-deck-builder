# Claude pilot-v3 / Dreadhorde audit — 2026-10-30

Read-only frozen snapshot. No engine, simulation, watcher or run-folder changes. Source snapshot saved alongside this report as JSON. Completed-game counts can advance after this review.

## Assessment

Claude followed Patrick’s reset: mill-defense partial run is ABORTED/excluded, C11 has 6 new diagnostic fixtures plus 10 regression checks, pilot v3 is isolated in classes-v3, and v1.0-dreadhorde-only differs from the physical baseline only by Synthetic Destiny → Dreadhorde Invasion. Functional 10-game screen preceded the current 100-game comparison. The test design is now substantially easier to interpret.

## What is established

The fixture report verifies the Elspeth/Soldier → Jace → Aminatou reset → Jace sequence and correct handling of Jace at exactly three loyalty (blink first, or decline). Those are rules/sequencing improvements, not a demonstrated win-rate increase. The calibration had 2/10 v3 wins versus the board’s 3/10 v2; too small to rank. Claude reports no natural full Elspeth opportunity in that calibration; fixture success is not evidence of frequency in real games.

## New comparison: matched results only

Frozen completed logs: baseline 53 (16 usable wins, 2 suspect), Dreadhorde 28 (7 usable wins, 1 suspect). Unequal progress is not comparable as percentages.

| Metric | Baseline | Dreadhorde only |
|---|---:|---:|
| Clean overlapping games | 27 | 27 |
| Wins | 7 | 7 |
| Resolved Jace −3 | 49 | 48 |
| No-token/target decline events | 23 | 26 |
| Games without a resolved −3 | 2 | 7 |

Five baseline-only wins and five candidate-only wins. No observed win advantage. The small screen’s no-fodder reduction (9→4) has not persisted in this broader matched snapshot. Decline counts are events, not unique turns; differing game length/decision opportunities mean they are not normalized shortage rates. Do not claim Dreadhorde worsens the deck from these early numbers either.

Raw pod01-g1 confirms Dreadhorde was cast, its upkeep amass trigger resolved, and Jace then targeted/exiled Zombie Army Token (930). This verifies the intended mechanism can function; it does not isolate its net benefit.

## Reporting corrections / remaining gaps

- C11 board says v3 calibration −3 increased 34→38. The saved ten-game v3 run 2026-10-30174033 has **28 activated/resolved events**, matching its telemetry summaries. This discrepancy needs correction or an explicitly identified alternative source before any activation-gain claim. Its six jace_reset and three pre_reset events do match the board.
- Staged tests and removal of a known rules mistake do not prove the pilot wins more. Preserve the calibration and historical v2 cohorts separately.
- Current Jace snapshots record turns 4–6, not a comprehensive first-token timeline or all walker death causes. More mechanism instrumentation may be needed for the later protection/recovery stages. Avoid altering the current frozen runtime mid-comparison; collect new metrics in a separately identified future cohort if needed.
- Synthetic Destiny is poorly handled by Forge. Any eventual swap gain applies first to this pilot matchup, not automatically to Patrick’s human use of that card.
- Continue the planned comparison without extra variants or restarting for a favorable result. No purchase, physical swap, protection advantage or reanimation advantage is established by this snapshot.
