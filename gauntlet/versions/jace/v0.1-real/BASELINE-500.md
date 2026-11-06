# Jace current-deck baseline — final 500-game review

Completed November 3, 2026. Patrick’s physical v0.1-real deck was unchanged; five groups of different opponents used the same frozen pilot v4. This report evaluates those simulations and their limitations.

**Corrected result: 159/500 wins (31.8%).** Nominal Wilson 95% interval: 27.9–36.0%. Raw winner lines credited 179 wins, but 55 suspect games are scored as draws, removing 20 apparent wins. Excluding suspect games entirely gives 159/445 (35.7%); that excludes difficult/stall-prone games and is not an unbiased replacement headline.

The deck wins regularly in these simulated four-player pods. The baseline does not prove its real-world win rate, maximum power or a card upgrade. The 25% even-share reference does not mean all four decks/pilots in every pod were equally strong.

## Batch results and stall sensitivity

| Opponent group | Wins / started | Raw wins | Suspect | Wins / non-suspect |
|---|---:|---:|---:|---:|
| 1 | 43/100 | 48 | 12 | 43/88 |
| 2 | 34/100 | 38 | 8 | 34/92 |
| 3 | 30/100 | 32 | 5 | 30/95 |
| 4 | 27/100 | 29 | 2 | 27/98 |
| 5 | 25/100 | 32 | 28 | 25/72 |

**Batch five requires caution:** the stalled games are not distributed randomly. Captain Sisay and Círdan appear in overlapping pods; their counts cannot be added. Presence is an association, not a verified explanation for the underlying engine stall.

| Sensitivity slice | Corrected wins / started | Suspect | Wins / non-suspect |
|---|---:|---:|---:|
| Batches 1–4 | 134/400 | 27 | 134/373 |
| Batch 5 with Sisay | 7/30 | 15 | 7/15 |
| Batch 5 without Sisay | 18/70 | 13 | 18/57 |
| Batch 5 with Círdan | 7/30 | 11 | 7/19 |
| All groups, excluding batch-5 Sisay pods | 152/470 | 40 | 152/430 |

These slices change the opponent mix; they are a sensitivity check, not grounds to delete unfavorable matchups. Some batch-five logs run several hours beyond the nominal 600-second cutoff. Raw results are not reliable. Nominal intervals assume independent games; shared pods and sequential seeds create dependence, so they do not capture every source of uncertainty.

## Setup, tokens and loyalty

- Among 445 non-suspect games, **208 (46.7%)** had a custom Jace +1 fallback because no expendable target was available; 432 distinct game/personal-turn pairs. This is a repeatable pilot-level bottleneck, not proof that the deck never made a token or that an additional token maker wins more.
- Median first Jace cast: personal turn 6; median first −3: turn 7. These medians use games where the event happened; they are not paired delays.
- 21 games never cast Jace; 117 had no resolved −3.
- 843 resolved −3s; 758 recorded hit events; 1339 custom +1 selections. Missing hit events prevent naming every payoff. Summary decline maps are empty under v4 interception, so the fallback reason events are used instead.

- Turn 4 start-main snapshots: mean 2.99 lands; any creature token in 68/445. This is not the full first-token timeline or a count of all legal creature/planeswalker fodder.
- Turn 5 start-main snapshots: mean 3.92 lands; any creature token in 121/445. This is not the full first-token timeline or a count of all legal creature/planeswalker fodder.
- Turn 6 start-main snapshots: mean 4.75 lands; any creature token in 126/444. This is not the full first-token timeline or a count of all legal creature/planeswalker fodder.

## Jace exposure and blocking

To avoid counting a blink as death, this check follows resolved normal-cast intervals through the next observed Patrick turn, skips explicit immediate blink returns and identifies the first remaining battlefield exit. It censors intervals with no next turn because the game ended. A permanent that leaves and returns later has still suffered an exit. This is a text-log proxy: copied commanders, missing zone changes and replacement effects limit exact identity tracking.

- no recorded exit before next turn: 349.
- graveyard during combat after being attacked: 213.
- censored at game end: 130.
- graveyard outside attributed combat (removal/other unverified): 261.
- graveyard immediately after own targeted activation: 2.
- Exile exit without confirmed immediate return: 8.

Custom token-block assignments: 220; unblocked diagnostic events: 659. These are not all block opportunities; repeated callbacks and evasion/player-lethal constraints prevent reading every unblocked event as a mistake. The combat attribution above requires an attack aimed at Jace and a death during a combat damage phase; Forge does not consistently print damage-to-walker amounts. No-exit means no recorded exit, not proof of exact survival.

## What wins and what ends losses

The Aminatou/Bolas/Ajani assembly was recorded in 11/445 clean games; actual loop steps occurred in 5 games (24 total steps). Most wins therefore occur without an executed loop. Assembly or loop execution is not by itself proof of a combo-caused victory.

Observed Jace hits (counts, not card win-rate rankings):

- Ajani Unrelenting: 45 hit events in 45 games.
- Avacyn, Angel of Hope: 44 hit events in 44 games.
- Jhoira, Weatherlight Corsair: 42 hit events in 42 games.
- Nissa, Leyline Tamer: 41 hit events in 41 games.
- Avacyn, Angel of Horror: 39 hit events in 38 games.
- Silver Surfer, Galactus's Herald: 39 hit events in 39 games.
- Memnarch, the Warden: 37 hit events in 37 games.
- The Theorist, Jace Beleren: 37 hit events in 37 games.

Largest sources of **verified Patrick-attacker combat damage to opposing players** (only IDs declared attacking by Patrick in that combat; excludes end-step life loss, noncombat effects, other controllers and unowned sources):

- Galactus, Devourer of Worlds: 2668 damage across 105 games.
- Cadet: 2562 damage across 86 games.
- Serra's Emissary: 1983 damage across 103 games.
- Avacyn, Angel of Horror: 1738 damage across 81 games.
- Avacyn, Angel of Hope: 1623 damage across 79 games.
- Dreamtide Whale: 1571 damage across 98 games.
- Triplicate Titan: 1115 damage across 57 games.
- Archfiend of Despair: 952 damage across 69 games.

Damage totals depend on game length, power boosts and opportunity. They do not establish which single card caused more wins. Archfiend-style life loss is not damage and is excluded from that table.

Loss patterns below classify the last recorded life-depletion sequence in non-suspect losses. They are descriptive endpoints; they do not prove the earlier strategic mistake or that a different card would have prevented the loss. Some combat deaths show only small final hits after a large army, so endpoint sizes are not army sizes.

| Final recorded loss sequence | Games | Example |
|---|---:|---|
| combat: smaller final hit | 180 | b1pod01-g2 |
| life depletion without nearby logged damage | 34 | b1pod06-g5 |
| combat: large final hit (10+) | 26 | b1pod04-g4 |
| noncombat damage at final depletion | 25 | b1pod05-g4 |
| unclassified / alternate loss | 21 | b1pod09-g1 |

Authoritative outcome reasons across all 286 non-suspect losses:

- because life total reached 0: 265; example `b1pod01-g2`.
- due to accumulation of 21 damage from generals: 7; example `b1pod17-g3`.
- trying to draw cards from empty library: 6; example `b2pod04-g3`.
- because of obtaining 10 poison counters: 4; example `b3pod05-g4`.
- due to effect of spell 'Angel of Destiny': 2; example `b2pod02-g2`.
- because an opponent has won by spell 'Revel in Riches': 1; example `b1pod09-g1`.
- due to effect of spell 'Strixhaven Stadium': 1; example `b3pod19-g4`.

**Life-management candidate:** 9 losses have Jhoira’s life-loss text immediately beside the final recorded depletion. Direct example b1pod06-g5: own Jace −3 exiles a Jace token, Jhoira entry triggers and Patrick goes from 2 to −2 life. This is evidence of a dangerous life-loss interaction, not proof each preceding activation was a mistake (the reveal may have been unknown and alternatives may have been worse). Audit known-top setup and voluntary attacks/trigger risks at low life before recommending more cards.

Three directly checked mechanisms: **flying army** in b1pod01-g2 (Giada/Angels, life 20→−24); **giant unblocked attacker** in b1pod04-g4 (Thromok,64 damage,36→−28); **noncombat engine** in b1pod09-g2 (Last Laugh,final1→0). Ground token count alone does not answer all three. See [checked cases](../BASELINE-500-CASES.md).

## Mulligans and mana

- Kept 5 cards: 40 games.
- Kept 6 cards: 70 games.
- Kept 7 cards: 335 games.

Opening land counts were reconstructed only where the final pre-turn hand snapshot matches the logged kept-hand size:

- 0 lands: 1 games.
- 1 lands: 2 games.
- 2 lands: 22 games.
- 3 lands: 259 games.
- 4 lands: 161 games.

0 clean games have unavailable/mismatched opening-hand reconstruction. A seven-card keep is not automatically good; a five-card keep is not automatically a mistake. Average lands do not show color availability. These logs lack exact mana-pool/payment choices, so **no reliable color-screw rate or benefit from cutting a land can be established**. The replay mana line lists an ability’s options, not necessarily the selected color.

## Practical recommendation

Keep the current physical deck as the reference. No purchase or permanent swap is demonstrated by this baseline. The prior isolated Dreadhorde trial was 22/100 versus 30/100 under the same older pilot; this broader baseline does not overturn it or prove that a land cut helps. A personal owned-card trial remains a reversible experiment rather than an established upgrade.

Next useful work is a short audit of concrete ready-Jace turns: was a token maker in hand and affordable, were blockers actually legal, was a +1/reset/top-deck line preferable, and would protecting Jace compromise Patrick’s survival? Select from completed games; validate legal alternatives before changing policy. Additional bulk baseline games would add little compared with resolving those decisions. Recovery/mill and purchase proposals remain deferred.

## Evidence and reproducibility

All five saved summaries match independent log scoring. Same build across all batches: classes ce0882f5d8fec03b, cards 7ccc339dd1f04e00, deck df7a4a3fefd8106f. Raw logs and simulation assets were not modified. Regenerate with `python3 analysis/finalize-baseline500.py`.

[Full opponent/pod tables and snapshot totals](BASELINE-500-TABLES.md). [Machine-readable records](BASELINE-500.json). [Additional audit metrics](BASELINE-500-FINAL-AUDIT.json).

The background watcher still omits bNpod filenames; direct logs are the source here. Replay display fixes change presentation, not simulated decisions or game outcomes. Missing full-state data prevents proving every tactical alternative or first-token event; these are documented limitations rather than zero counts.
