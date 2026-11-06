# Jace 500-game baseline — FINAL

Generated 2026-11-03T22:45:28-08:00. Completed logs: **500/500**. Physical deck unchanged; pilot v4. Only completed logs from the five new opponent-group cohorts are included. INVALID/ABORTED runs are excluded.

Corrected wins **159/500** (31.8%; nominal Wilson 95% interval 27.9–36.0%). Raw reported wins 179; suspect games 55, scored as draws. Excluding suspects entirely: 159/445. These are different denominators, not different wins.

## Scope and comparability

Each batch has different opponents. This measures performance across these configured groups; it is not a matched improvement test against the old gauntlet. Deck exports and AI competence are not a verified representative sample of all bracket-3 tables. Opponent group, pod composition and seeds change together, so batch differences cannot identify a single cause. The nominal interval treats games as independent; shared pods/seeds/opponents create clustering, so it understates some uncertainty. Do not extrapolate an incomplete first batch to all 500 games.

| Batch | Completed | Corrected wins | Raw wins | Suspect | Nominal 95% interval |
|---|---:|---:|---:|---:|---|
| 1 | 100/100 | 43 | 48 | 12 | 33.7–52.8% |
| 2 | 100/100 | 34 | 38 | 8 | 25.5–43.7% |
| 3 | 100/100 | 30 | 32 | 5 | 21.9–39.6% |
| 4 | 100/100 | 27 | 29 | 2 | 19.3–36.4% |
| 5 | 100/100 | 25 | 32 | 28 | 17.5–34.3% |

## Jace engine and mana

Telemetry below excludes suspect games. Events are not automatically unique turns or strategic opportunities. Missing summary/snapshot data is not interpreted as zero.

- Telemetry summaries: 445 clean games. First Jace cast median personal turn: 6. First −3 median: 7.
- Games with no Jace cast: 21; no resolved −3: 117.
- Resolved −3: 843; custom +1 policy events: 1339; recorded minus3 hit events: 758. These are not all inferred card casts.
- Summary no-token/target decline events: 0. Coverage is not verified under v4 interception: a zero here DOES NOT establish that no shortage occurred; audit opportunity logging before interpreting it.
- Walker-block policy events: 220; unblocked diagnostic events: 659. Repeated decision callbacks may inflate diagnostics.
- Combo assemblies: 11; loop-step events: 24. Assembly alone is not a loop-caused win.
- Start-main turn 4: 445 snapshots; mean lands 2.99; any creature tokens 68/445. Does not measure first token turn or usable colors.
- Start-main turn 5: 445 snapshots; mean lands 3.92; any creature tokens 121/445. Does not measure first token turn or usable colors.
- Start-main turn 6: 444 snapshots; mean lands 4.75; any creature tokens 126/444. Does not measure first token turn or usable colors.

- Custom +1 fallbacks attributed to no targets: 432; unique personal-turn/game pairs with that reason: 432. This proves observed shortages despite empty summary decline maps; it is a lower bound on opportunities, not all ready turns.

## Opponent and pod results

A win “with opponent present” belongs to the whole pod; it is not a head-to-head win rate. Small per-opponent samples should not be ranked confidently.

| Batch / opponent | Appearances | Jace wins with opponent present | Opponent wins |
|---|---:|---:|---:|
| 1: Pia Nalaar, Consul of Revival | 23 | 13 | 3 |
| 1: The Great Goblin | 21 | 11 | 2 |
| 1: Thromok the Insatiable | 20 | 12 | 3 |
| 1: Sergeant John Benton | 20 | 8 | 4 |
| 1: Marchesa, the Black Rose | 21 | 14 | 0 |
| 1: Vohar, Vodalian Desecrator | 24 | 15 | 6 |
| 1: Giada, Font of Hope | 23 | 7 | 9 |
| 1: Athreos, Shroud-Veiled | 24 | 11 | 5 |
| 1: Oskar, Rubbish Reclaimer | 22 | 12 | 1 |
| 1: Ghoulcaller Gisa | 23 | 8 | 2 |
| 1: Sauron, the Dark Lord | 21 | 9 | 4 |
| 1: Sharuum the Hegemon | 22 | 9 | 6 |
| 2: Kilo, Apogee Mind | 25 | 9 | 1 |
| 2: Dromoka, the Eternal | 22 | 10 | 7 |
| 2: Isperia, Supreme Judge | 24 | 10 | 5 |
| 2: Emry, Lurker of the Loch | 27 | 10 | 1 |
| 2: Ashling, the Limitless | 23 | 7 | 1 |
| 2: Sidisi, Brood Tyrant | 22 | 8 | 5 |
| 2: Sauron, the Dark Lord | 18 | 7 | 7 |
| 2: Giada, Font of Hope | 24 | 8 | 10 |
| 2: Bello, Bard of the Brambles | 22 | 6 | 7 |
| 2: Meria, Scholar of Antiquity | 22 | 11 | 1 |
| 2: Massacre Girl, Known Killer | 29 | 9 | 10 |
| 2: Avatar Kyoshi, Earthbender | 18 | 7 | 3 |
| 3: Thalisse, Reverent Medium | 24 | 7 | 8 |
| 3: Glissa, the Traitor | 23 | 6 | 2 |
| 3: Omnath, Locus of Rage | 23 | 8 | 9 |
| 3: Tom, Bert, and William | 28 | 11 | 8 |
| 3: Shilgengar, Sire of Famine | 25 | 10 | 8 |
| 3: Liesa, Shroud of Dusk | 30 | 11 | 5 |
| 3: Ghalta, Primal Hunger | 20 | 5 | 9 |
| 3: Lyse Hext | 24 | 6 | 2 |
| 3: Wilhelt, the Rotcleaver | 22 | 5 | 1 |
| 3: Iroh, Grand Lotus | 24 | 9 | 2 |
| 3: Zurgo Stormrender | 22 | 7 | 3 |
| 3: Arcades, the Strategist | 20 | 5 | 8 |
| 4: Chatterfang, Squirrel General | 30 | 7 | 3 |
| 4: Aragorn, the Uniter | 24 | 7 | 8 |
| 4: Ashling, the Limitless | 25 | 5 | 5 |
| 4: Thranduil, the Elvenking | 25 | 7 | 6 |
| 4: Jon Irenicus, Shattered One | 29 | 9 | 1 |
| 4: Zimone, Mystery Unraveler | 23 | 10 | 2 |
| 4: Tovolar, Dire Overlord | 30 | 10 | 9 |
| 4: Lathril, Blade of the Elves | 29 | 7 | 11 |
| 4: Malfegor | 25 | 5 | 7 |
| 4: Pia Nalaar, Consul of Revival | 29 | 8 | 9 |
| 4: Krenko, Mob Boss | 25 | 6 | 10 |
| 5: Meren of Clan Nel Toth | 18 | 9 | 4 |
| 5: Raffine, Scheming Seer | 19 | 6 | 7 |
| 5: Captain Sisay | 15 | 7 | 1 |
| 5: Winter, Cynical Opportunist | 18 | 9 | 5 |
| 5: Baba Lysaga, Night Witch | 21 | 6 | 0 |
| 5: Octavia, Living Thesis | 18 | 6 | 1 |
| 5: Mangara, the Diplomat | 22 | 4 | 10 |
| 5: Círdan the Shipwright | 19 | 7 | 2 |
| 5: Vincent, Vengeful Atoner | 23 | 8 | 5 |
| 5: Yennett, Cryptic Sovereign | 20 | 6 | 11 |
| 5: Tetsuko Umezawa, Fugitive | 23 | 7 | 1 |

| Pod | Clean games | Jace wins |
|---|---:|---:|
| b1pod01 | 5 | 2 |
| b1pod02 | 4 | 3 |
| b1pod03 | 5 | 4 |
| b1pod04 | 4 | 2 |
| b1pod05 | 4 | 1 |
| b1pod06 | 4 | 1 |
| b1pod07 | 4 | 2 |
| b1pod08 | 5 | 2 |
| b1pod09 | 5 | 3 |
| b1pod10 | 4 | 0 |
| b1pod11 | 4 | 3 |
| b1pod12 | 5 | 2 |
| b1pod13 | 5 | 2 |
| b1pod14 | 5 | 5 |
| b1pod15 | 5 | 3 |
| b1pod16 | 5 | 2 |
| b1pod17 | 4 | 0 |
| b1pod18 | 3 | 2 |
| b1pod19 | 4 | 3 |
| b1pod20 | 4 | 1 |
| b2pod01 | 4 | 1 |
| b2pod02 | 5 | 2 |
| b2pod03 | 5 | 2 |
| b2pod04 | 5 | 4 |
| b2pod05 | 5 | 2 |
| b2pod06 | 5 | 3 |
| b2pod07 | 4 | 0 |
| b2pod08 | 5 | 1 |
| b2pod09 | 5 | 3 |
| b2pod10 | 4 | 1 |
| b2pod11 | 5 | 3 |
| b2pod12 | 5 | 1 |
| b2pod13 | 5 | 2 |
| b2pod14 | 4 | 3 |
| b2pod15 | 4 | 1 |
| b2pod16 | 5 | 1 |
| b2pod17 | 4 | 2 |
| b2pod18 | 4 | 1 |
| b2pod19 | 4 | 1 |
| b2pod20 | 5 | 0 |
| b3pod01 | 5 | 2 |
| b3pod02 | 5 | 1 |
| b3pod03 | 5 | 1 |
| b3pod04 | 5 | 2 |
| b3pod05 | 5 | 1 |
| b3pod06 | 5 | 2 |
| b3pod07 | 5 | 1 |
| b3pod08 | 5 | 0 |
| b3pod09 | 5 | 2 |
| b3pod10 | 5 | 1 |
| b3pod11 | 5 | 2 |
| b3pod12 | 5 | 3 |
| b3pod13 | 5 | 1 |
| b3pod14 | 4 | 1 |
| b3pod15 | 5 | 2 |
| b3pod16 | 3 | 1 |
| b3pod17 | 5 | 2 |
| b3pod18 | 4 | 2 |
| b3pod19 | 4 | 0 |
| b3pod20 | 5 | 3 |
| b4pod01 | 5 | 1 |
| b4pod02 | 5 | 0 |
| b4pod03 | 4 | 2 |
| b4pod04 | 5 | 2 |
| b4pod05 | 5 | 0 |
| b4pod06 | 5 | 0 |
| b4pod07 | 5 | 1 |
| b4pod08 | 5 | 2 |
| b4pod09 | 5 | 3 |
| b4pod10 | 5 | 1 |
| b4pod11 | 5 | 1 |
| b4pod12 | 5 | 1 |
| b4pod13 | 4 | 1 |
| b4pod14 | 5 | 2 |
| b4pod15 | 5 | 2 |
| b4pod16 | 5 | 2 |
| b4pod17 | 5 | 2 |
| b4pod18 | 5 | 1 |
| b4pod19 | 5 | 1 |
| b4pod20 | 5 | 2 |
| b5pod01 | 5 | 2 |
| b5pod02 | 5 | 2 |
| b5pod03 | 5 | 2 |
| b5pod04 | 4 | 2 |
| b5pod05 | 4 | 2 |
| b5pod06 | 5 | 1 |
| b5pod07 | 5 | 2 |
| b5pod08 | 5 | 1 |
| b5pod09 | 5 | 0 |
| b5pod10 | 5 | 3 |
| b5pod11 | 5 | 2 |
| b5pod12 | 1 | 1 |
| b5pod13 | 5 | 1 |
| b5pod14 | 3 | 1 |
| b5pod15 | 3 | 1 |
| b5pod16 | 3 | 1 |
| b5pod18 | 1 | 0 |
| b5pod19 | 2 | 0 |
| b5pod20 | 1 | 1 |

## Damage and remaining review

Largest logged sources of damage to Patrick (all controllers, includes painlands; damage is not synonymous with the cause of loss):

- Elf Warrior Token: 749 logged damage.
- Goblin Token: 454 logged damage.
- Zombie Token: 344 logged damage.
- Dromoka, the Eternal: 343 logged damage.
- Thromok the Insatiable: 320 logged damage.
- Sergeant John Benton: 252 logged damage.
- Caves of Koilos: 251 logged damage.
- Vincent, Vengeful Atoner: 233 logged damage.
- Old Gnawbone: 213 logged damage.
- Aragorn, the Uniter: 201 logged damage.

Loss outcome examples (not causal categories):

- because life total reached 0: `gauntlet/versions/jace/v0.1-real/runs/2026-10-30211001-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b1-smart-politics-commanderfirst-keeptokens-100/logs/b1pod01-g2.log`.
- because an opponent has won by spell 'Revel in Riches': `gauntlet/versions/jace/v0.1-real/runs/2026-10-30211001-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b1-smart-politics-commanderfirst-keeptokens-100/logs/b1pod09-g1.log`.
- due to accumulation of 21 damage from generals: `gauntlet/versions/jace/v0.1-real/runs/2026-10-30211001-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b1-smart-politics-commanderfirst-keeptokens-100/logs/b1pod17-g3.log`.
- due to effect of spell 'Angel of Destiny': `gauntlet/versions/jace/v0.1-real/runs/2026-10-30224334-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b2-smart-politics-commanderfirst-keeptokens-100/logs/b2pod02-g2.log`.
- trying to draw cards from empty library: `gauntlet/versions/jace/v0.1-real/runs/2026-10-30224334-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b2-smart-politics-commanderfirst-keeptokens-100/logs/b2pod04-g3.log`.

**Not yet established:** first-token timing, Jace survival to next personal turn and precise death attribution, outgoing finisher ownership, color screw and mulligan quality, or three-to-five causal loss patterns. Those require deeper turn/card-identity review; incoming damage totals and outcome lines cannot establish them. Completed per-batch review will supplement this snapshot.

No card swaps or purchases are justified from this baseline alone. Keep all existing human-play/AI limitations in JACE-PILOT-AUDIT.md in view.

Detailed checked cases: [BASELINE-500-CASES.md](../BASELINE-500-CASES.md).
