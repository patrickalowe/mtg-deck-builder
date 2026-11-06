# Jace — analysis of finished runs

Prepared 2026-10-29 by Codex for RESUME X2. These are Forge AI results, not predictions of Patrick’s human win rate. No new games or engine changes.

## What the evidence supports

- Keep the removal-first direction, but do not call the token package a proven upgrade. The directly relevant token-preserving runs are v0.2 16/50 (32%) and v0.5 18/50 (36%); two extra wins do not separate them. v0.6’s 5/10 is only a promising quick check.
- Preserve Patrick’s keepers: Dreamtide Whale, Massacre Wurm, Triplicate Titan and Loyal Tutor. Small samples and AI limitations do not justify reversing those decisions.
- Toxic Deluge, Sunfall, Synthetic Destiny and Overwrite the Multiverse are AI-piloting concerns. Do not describe them as bad real-life cards based on these runs.
- The simulation reporter can label timeout games as wins. Historical headline rates below are reproduced faithfully; the separate sensitivity column removes those ambiguous winner credits by treating the suspect games as non-wins (draws). Claude should investigate before making final purchase claims.

## Cohorts and data quality

| Cohort | Version | Keep tokens | Reported wins | 95% Wilson interval | Suspect timeouts (Jace credits) | Wins if suspect games are draws |
|---|---|---|---|---|---|---|
| A | v0.1-real | no | 28/100 (28%) | 20.1%–37.5% | 1 (0) | 28/100 (28%) |
| B | v0.2-six | no | 44/100 (44%) | 34.7%–53.8% | 4 (4) | 40/100 (40%) |
| C | v0.2-six | yes | 16/50 (32%) | 20.8%–45.8% | 7 (3) | 13/50 (26%) |
| D | v0.5-topdeck-tokens | yes | 18/50 (36%) | 24.1%–49.9% | 2 (0) | 18/50 (36%) |
| E | v0.6-precon-engine | yes | 5/10 (50%) | 23.7%–76.3% | 0 (0) | 5/10 (50%) |

The intervals above are the original nominal binomial intervals. Fixed pods, repeated seeds and AI trajectories limit independence. A 50-game run gives three games in pods 01–10 and two in pods 11–20; a 100-game run gives five in every pod. A 10-game run covers only pods 01–10. Do not pool different deck versions, flags, or nested same-seed quick runs as independent evidence. A/B lack KEEP_TOKENS; older summaries omit the field, and their run names confirm it was absent.

The 44% v0.2 headline becomes 40% in this timeout sensitivity check, while 32% becomes 26% for its token-preserving 50-game run. These are different settings and sample sizes; the gap does not isolate an effect of keeping tokens. C/D become 26% versus 36% under this sensitivity rule, which still does not establish superiority.

Excluded: every run folder with INVALID.txt or ABORTED.txt, including v0.2 35% and v0.3 17% with the reverted Jace planeswalker-fodder change. Other quick runs, unfinished C1 runs and replays are outside this fixed five-cohort analysis. history.csv contains invalid rows and is not sufficient by itself.

### Timeout evidence for Lane C

Threshold for this diagnostic: elapsed runtime >=599,000 ms. This flags suspicious games, not a claim that every long natural finish is invalid. `PodSim.java` sets a 600-second timeout and attempts `setGameOver(Draw)`, but actual log outcomes can contradict that intent. For example B/pod18-g3.log lists all four players as having won, followed by a single Jace winner in Game Result. `gauntlet.js` counts that final line as a Jace win. No source logs or summaries were modified.

- A: pod17-g4.log (opponent credited)
- B: pod01-g1.log (Jace credited); pod04-g1.log (Jace credited); pod14-g1.log (Jace credited); pod18-g3.log (Jace credited)
- C: pod01-g1.log (Jace credited); pod04-g1.log (Jace credited); pod07-g3.log (opponent credited); pod08-g3.log (opponent credited); pod09-g1.log (Jace credited); pod14-g2.log (opponent credited); pod17-g2.log (opponent credited)
- D: pod01-g1.log (opponent credited); pod01-g2.log (opponent credited)

## Card interpretation

“Seen” below means recorded in a hand snapshot OR cast/land-played in the game; it is not the number of draw events. “Cast” means games with at least one cast, not total copies or activations. Jace −3 puts cards onto the battlefield without casting them, so low cast counts for expensive creatures can miss their main job. Win rates conditional on drawing or casting a card are associations: surviving long enough, matchup and board state all affect them.

### Cards to keep watching

- **Serra’s Emissary:** A wins 17/24 games where cast (70.8%); B 16/20 (80%). D is only 3/7 (42.9%). Strong historical signal, but not uniformly strong in every sample.
- **Avacyn, Angel of Horror:** B 14/20 cast games won (70%); D 6/7 (85.7%); E 4/4. Supports keeping the payoff, with tiny later denominators.
- **Cyclonic Rift:** B cast in 28/34 seen games, D 12/12. Forge does use it reliably. The package tests do not isolate its incremental value or prove that its price premium is worthwhile.
- **Wrath of God / Infernal Grasp:** B cast 20/29 and 24/34 respectively; D 12/16 and 11/15. Both are operational in the AI and address the immediate survival problem.
- **Chandra’s Ignition:** B cast 12/39 seen, with 3/12 wins when cast; D 9/21, with 4/9 wins. This is a conditional wipe needing a creature, not a uniformly top-performing card in the requested data. Earlier package-level improvement does not prove this individual card caused it.
- **Dreamtide Whale:** A seen 36/cast 22; D 14/9. D wins 6/9 cast games. No basis for cutting Patrick’s keeper.
- **Massacre Wurm / Triplicate Titan:** D cast 6/19 and 8/20 seen; wins 3/6 and 6/8 cast games. Expensive payoff cast rates are not sufficient cut criteria; Jace hits are not casts.
- **Loyal Tutor:** A 28/40 seen, D 15/23, E 2/3 cast. It is being cast, but logs do not establish that the AI makes Patrick’s intended top-deck setup.
- **Way of the Healer / Plan for All Outcomes:** D cast 8/18 each; neither has a clean repeated failure signal. Review opportunity cost in real play, rather than declaring them cuts from conditional win rates.

### AI limitations: exclude from real-card rankings

- **Toxic Deluge:** cast/seen: B 0/37; C 0/19; D 0/18; E 0/4.
- **Sunfall:** cast/seen: A 0/32.
- **Synthetic Destiny:** cast/seen: A 1/35.
- **Overwrite the Multiverse:** cast/seen: A 0/41; B 0/42; C 0/19; D 0/20; E 0/2.
- **Brainstone:** cast/seen: D 10/17.
- **Clever Concealment:** cast/seen: B 8/34; C 3/16; D 2/19; E 0/2.
- **Aetherize:** cast/seen: B 5/32; C 2/15; D 5/14; E 1/4.

**New finding:** Overwrite the Multiverse has zero casts across all five cohorts (124 game-exposures, not independent trials). Its local script has no RemoveDeck flag; zero use is still a practical piloting failure worth investigating. This is not evidence the real card is weak. Brainstone is actually cast in 10/17 seen games in D, contradicting the blanket “never casts” note. Casting an artifact does not prove the AI uses its draw/top-deck ability correctly. Preserve the limitation on judging its intended strategy until activations and choices are audited. Reactive protection/bounce can also look weak because the AI rarely holds mana; low Aetherize/Clever Concealment cast rates are not clean cut signals.

Cards absent from these five cohorts (Soothsaying, Settle the Wreckage, Kenrith’s Transformation, Chainer) have no new measurements here; retain the known AI caveats from AGENTS.md.

### v0.6 owned-spare package

| Card | Seen | Cast games | First-cast average round | Wins when cast |
|---|---|---|---|---|
| Skrelv's Hive | 2 | 2 | 7.0 | 50% |
| Dreadhorde Invasion | 3 | 1 | 4.0 | 100% |
| Darksteel Angel | 2 | 1 | 14.0 | 100% |

These counts establish very little about package strength. Skrelv’s Hive makes Mites that cannot block: they feed Jace but do not satisfy the blocking half of the token plan. Dreadhorde’s Army grows beyond the current sim’s power-2 exile limit, so its real-life flexibility is understated. Darksteel Angel is a high-cost payoff; check actual entry-to-battlefield logs as well as casting before judging it.

## Who wins against Jace

Each cell is **opponent wins / games that opponent appeared in**. This is a four-player result, not a head-to-head loss rate. Jace can lose to someone else in the same pod. Opponent archetypes come from gauntlet.json. These counts reproduce reported results, including flagged timeouts.

| Opponent | A | B | C | D | E |
|---|---|---|---|---|---|
| Yennett (control) | 9/25 | 14/25 | 5/12 | 5/12 | 1/2 |
| Sidisi (zombies, self-mill) | 3/25 | 3/25 | 1/12 | 3/12 | 0/2 |
| Ghalta (big green stompy) | 8/25 | 3/25 | 3/12 | 6/12 | 1/2 |
| Krenko (goblin tokens) | 4/25 | 4/25 | 4/14 | 3/14 | 0/4 |
| Arcades (walls, toughness) | 6/25 | 7/25 | 6/14 | 3/14 | 0/4 |
| Sauron (spellslinger) | 1/25 | 3/25 | 2/12 | 0/12 | 0/2 |
| Meren (graveyard recursion) | 6/25 | 7/25 | 3/12 | 3/12 | 1/2 |
| Captain Sisay (legends toolbox) | 4/25 | 6/25 | 2/12 | 0/12 | 0/2 |
| Giada (angels, fliers) | 13/25 | 5/25 | 3/12 | 7/12 | 2/2 |
| Chatterfang (squirrel aristocrats) | 7/25 | 2/25 | 3/12 | 2/12 | 0/2 |
| Lathril (elf tokens) | 10/25 | 0/25 | 1/13 | 0/13 | 0/3 |
| Thranduil (elves, infinite combo) | 1/25 | 2/25 | 1/13 | 0/13 | 0/3 |

### How the losses happen

Winner counts alone do not reveal the killing blow. The examples below are log evidence, not an automated attribution of every loss.

- **Ghalta explosive combat:** E/pod03-g1.log records Jace losing to life total zero; Vaultborn Tyrant alone deals 56 combat damage to Jace, Surrak and Goreclaw 48, and Hulking Raptor 48. This is a wide, amplified army as well as a huge-trample problem. A single exile answer may buy time but cannot replace all board wipes.
- **Control:** Yennett wins the most opposing games in B (14) and is second in C (5, behind Arcades’s 6). Its control label describes the deck, not a demonstrated cause for each individual loss. D/pod01-g3.log shows a combat finish with Serra’s Emissary dealing 7, Magister Sphinx 5 and Yennett 3 damage to Jace, who loses to life total zero. D’s leading opposing winner is Giada (7), followed by Ghalta (6) and Yennett (5); the earlier “Yennett always leads upgraded lists” shorthand does not hold for every cohort.
- **Flying pressure:** Giada is the baseline’s most frequent opposing winner (13/25 appearances), and D’s (7/12). D/pod07-g1.log verifies a combat loss: Sigarda’s Vanguard and Angelic Sell-Sword each deal 8 damage to Jace, Serra Paragon 5, Linvala 4 and Giada 2; Jace loses to life total zero. This supports flying-army pressure in that example, not an attribution for every Giada win.
- **No universal worst matchup is established:** Ghalta’s worst-matchup reputation is relevant for targeted testing, but these five winner tables do not prove it is the worst under every list. Pod composition and a different opponent winning complicate such a ranking.

## Full per-card comparison

All cards present in the cohort CSVs, including lands. Cell = **seen / cast-or-played games; win rate when cast-or-played**. “—” means absent from that cohort’s CSV. “n/a” means zero cast games. Land plays appear in the same source column as casts. These are source CSV values, without pooling or causal ranking.

| Card | A | B | C | D | E |
|---|---|---|---|---|---|
| Aetherize | — | 32/5; 80.0% | 15/2; 50.0% | 14/5; 60.0% | 4/1; 0.0% |
| Ajani Unrelenting | 42/30; 26.7% | 34/18; 50.0% | 17/10; 30.0% | 18/15; 40.0% | 3/2; 50.0% |
| Aminatou, the Fateshifter | 24/12; 33.3% | 30/18; 61.1% | 12/7; 0.0% | 13/9; 55.6% | 1/1; 100.0% |
| Anguished Unmaking | — | 23/18; 44.4% | 11/6; 0.0% | 14/10; 20.0% | 1/1; 0.0% |
| Arcane Signet | 30/17; 35.3% | 40/23; 56.5% | 20/9; 33.3% | 16/10; 70.0% | 1/1; 0.0% |
| Archfiend of Despair | 34/17; 41.2% | 28/9; 55.6% | 13/6; 16.7% | 19/5; 40.0% | 2/1; 100.0% |
| Archon of Cruelty | 31/7; 28.6% | 28/10; 50.0% | 14/3; 0.0% | 13/6; 66.7% | 2/0; n/a |
| Austere Command | — | 38/23; 39.1% | 16/13; 15.4% | 16/10; 50.0% | 3/2; 50.0% |
| Avacyn, Angel of Hope | 28/14; 57.1% | 23/12; 58.3% | 7/4; 75.0% | 16/11; 72.7% | 3/1; 100.0% |
| Avacyn, Angel of Horror | 28/5; 40.0% | 47/20; 70.0% | 21/9; 33.3% | 19/7; 85.7% | 4/4; 100.0% |
| Azorius Signet | 24/14; 14.3% | 37/21; 33.3% | 19/13; 15.4% | — | — |
| Battlefield Forge | 26/22; 22.7% | 37/33; 39.4% | 19/15; 33.3% | 18/16; 62.5% | 3/3; 66.7% |
| Brainstone | — | — | — | 17/10; 50.0% | — |
| Brainstorm | 31/20; 45.0% | 27/17; 58.8% | 12/6; 33.3% | 20/17; 41.2% | 2/2; 0.0% |
| Brainsurge | 33/19; 52.6% | 38/26; 57.7% | 17/12; 41.7% | 18/12; 41.7% | 4/1; 100.0% |
| Caves of Koilos | 32/24; 33.3% | 37/30; 60.0% | 15/10; 20.0% | 18/16; 50.0% | 5/4; 50.0% |
| Chandra's Ignition | — | 39/12; 25.0% | 21/5; 40.0% | 21/9; 44.4% | 2/0; n/a |
| Chromatic Lantern | 30/15; 33.3% | 39/20; 65.0% | 19/10; 30.0% | 20/11; 54.5% | 6/3; 66.7% |
| Clever Concealment | — | 34/8; 62.5% | 16/3; 0.0% | 19/2; 50.0% | 2/0; n/a |
| Clifftop Retreat | 31/24; 45.8% | 38/26; 57.7% | 15/11; 27.3% | 13/9; 55.6% | 3/3; 66.7% |
| Command Tower | 27/18; 55.6% | 34/27; 51.9% | 14/12; 33.3% | 22/16; 37.5% | 1/1; 100.0% |
| Contaminated Landscape | 26/10; 40.0% | 33/16; 37.5% | 16/9; 33.3% | 20/7; 28.6% | 1/1; 100.0% |
| Cursed Mirror | 26/12; 58.3% | — | — | — | — |
| Cyclonic Rift | — | 34/28; 57.1% | 16/13; 15.4% | 12/12; 50.0% | 3/3; 33.3% |
| Darksteel Angel | — | — | — | — | 2/1; 100.0% |
| Despark | 22/15; 33.3% | — | — | — | — |
| Dimir Signet | 32/20; 15.0% | 32/19; 57.9% | 15/9; 33.3% | 22/14; 28.6% | 3/2; 50.0% |
| Divergent Transformations | — | 33/25; 48.0% | 10/9; 55.6% | — | — |
| Dreadhorde Invasion | — | 31/15; 33.3% | 12/5; 20.0% | — | 3/1; 100.0% |
| Dreamtide Whale | 36/22; 36.4% | — | — | 14/9; 66.7% | 3/1; 0.0% |
| Drowned Catacomb | 35/24; 25.0% | 39/34; 55.9% | 17/13; 53.8% | 22/17; 41.2% | 2/2; 100.0% |
| Elspeth, Sun's Champion | 37/30; 30.0% | 40/28; 57.1% | 12/7; 14.3% | 16/9; 44.4% | 4/3; 66.7% |
| Exotic Orchard | 36/27; 44.4% | 30/23; 52.2% | 14/11; 54.5% | 14/9; 44.4% | 1/0; n/a |
| Fabled Passage | 34/25; 32.0% | 42/29; 58.6% | 19/15; 46.7% | 15/8; 37.5% | 4/3; 66.7% |
| Fateful Absence | — | 31/24; 45.8% | 13/11; 18.2% | 12/7; 14.3% | 3/3; 66.7% |
| Fatehold Charm | 31/23; 39.1% | 37/29; 65.5% | 13/9; 33.3% | 20/17; 41.2% | 4/4; 25.0% |
| Fellwar Stone | 31/14; 28.6% | — | — | — | — |
| Fetid Heath | 33/28; 25.0% | 36/27; 70.4% | 17/12; 33.3% | 17/13; 15.4% | 4/4; 50.0% |
| Flawless Maneuver | 25/6; 16.7% | — | — | — | — |
| Flux Channeler | 33/21; 23.8% | 38/22; 54.5% | 17/9; 55.6% | 19/13; 30.8% | 2/1; 0.0% |
| Galactus, Devourer of Worlds | 50/14; 35.7% | 59/28; 71.4% | 32/15; 40.0% | 25/10; 60.0% | 5/2; 100.0% |
| Glacial Fortress | 31/25; 36.0% | 30/22; 63.6% | 15/13; 53.8% | 19/15; 80.0% | 4/3; 100.0% |
| Grand Crescendo | 28/15; 40.0% | 33/16; 56.3% | 17/7; 71.4% | 15/6; 66.7% | 0/0; n/a |
| Haunted Ridge | 22/18; 27.8% | 36/29; 62.1% | 17/15; 46.7% | 18/12; 33.3% | 4/3; 100.0% |
| Infernal Grasp | — | 34/24; 58.3% | 12/8; 25.0% | 15/11; 36.4% | 2/0; n/a |
| Innovative Commons | 36/23; 39.1% | — | — | 16/11; 72.7% | 2/2; 100.0% |
| Island | 28/23; 39.1% | 62/52; 57.7% | 30/26; 34.6% | 14/13; 30.8% | 4/4; 75.0% |
| Isolated Chapel | 31/24; 37.5% | 38/29; 51.7% | 15/13; 38.5% | 23/18; 44.4% | 4/2; 0.0% |
| Izzet Signet | 33/20; 30.0% | 36/22; 54.5% | 17/11; 36.4% | — | — |
| Jhoira, Weatherlight Corsair | 39/20; 20.0% | 30/13; 46.2% | 15/6; 33.3% | 19/9; 44.4% | 2/2; 50.0% |
| Kher Keep | 34/26; 42.3% | 38/34; 50.0% | 15/14; 14.3% | 13/13; 38.5% | 7/6; 50.0% |
| Lich's Relic | 32/22; 31.8% | 41/26; 46.2% | 12/6; 16.7% | 18/14; 42.9% | 3/1; 100.0% |
| Lim-Dûl's Vault | — | 29/14; 64.3% | 9/5; 20.0% | — | — |
| Lingering Souls | 35/24; 37.5% | 39/25; 60.0% | 18/11; 27.3% | 20/15; 46.7% | 4/3; 66.7% |
| Loyal Tutor | 40/28; 28.6% | — | — | 23/15; 46.7% | 3/2; 50.0% |
| Martial Coup | 22/3; 0.0% | — | — | — | — |
| Massacre Wurm | — | 37/9; 55.6% | 19/4; 0.0% | 19/6; 50.0% | 2/1; 100.0% |
| Memnarch, the Warden | 25/4; 75.0% | 37/9; 77.8% | 20/4; 25.0% | 14/2; 100.0% | 2/1; 100.0% |
| Mountain | 35/27; 33.3% | 35/28; 60.7% | 12/12; 25.0% | 16/14; 35.7% | 3/2; 100.0% |
| Mystic Gate | 41/32; 34.4% | 28/22; 40.9% | 13/12; 25.0% | 19/13; 46.2% | 3/2; 50.0% |
| Nicol Bolas, Dragon-God | 36/19; 47.4% | 36/19; 68.4% | 13/6; 16.7% | 20/11; 36.4% | 3/1; 100.0% |
| Nissa, Leyline Tamer | 37/20; 40.0% | 33/16; 56.3% | 18/6; 16.7% | 12/4; 50.0% | 4/1; 100.0% |
| Oath of Gideon | — | 35/19; 73.7% | 18/9; 33.3% | 14/5; 20.0% | 2/1; 0.0% |
| Occult Epiphany | 28/19; 42.1% | 35/27; 51.9% | 17/13; 38.5% | 15/11; 27.3% | 2/1; 100.0% |
| Overlord of the Mistmoors | 33/16; 43.8% | 32/22; 45.5% | 17/8; 37.5% | 21/11; 45.5% | 5/3; 33.3% |
| Overwrite the Multiverse | 41/0; n/a | 42/0; n/a | 19/0; n/a | 20/0; n/a | 2/0; n/a |
| Path of Ancestry | 36/24; 16.7% | 29/20; 40.0% | 14/9; 33.3% | 19/13; 38.5% | 2/2; 0.0% |
| Path to Exile | 36/26; 26.9% | 33/24; 54.2% | 14/11; 36.4% | 21/16; 37.5% | 3/3; 100.0% |
| Perilous Landscape | 29/11; 54.5% | 36/16; 37.5% | 14/7; 28.6% | 16/7; 28.6% | 4/3; 66.7% |
| Plains | 66/56; 33.9% | 77/66; 48.5% | 38/33; 30.3% | 28/20; 50.0% | 6/5; 40.0% |
| Plan for All Outcomes | 39/17; 41.2% | 34/19; 47.4% | 13/9; 22.2% | 18/8; 37.5% | 2/1; 0.0% |
| Ponder | — | — | — | 21/15; 46.7% | — |
| Prairie Stream | 28/21; 33.3% | 38/29; 58.6% | 12/11; 18.2% | 16/11; 36.4% | 3/3; 0.0% |
| Proteus Staff | 31/18; 50.0% | — | — | — | — |
| Radiant Summit | 20/13; 61.5% | 35/28; 32.1% | 16/12; 41.7% | 18/14; 35.7% | 4/3; 100.0% |
| Rakdos Signet | 28/20; 20.0% | 34/22; 40.9% | 17/12; 8.3% | — | — |
| Reflecting Pool | 30/22; 36.4% | 31/16; 25.0% | 17/8; 25.0% | 16/14; 50.0% | 3/2; 50.0% |
| Restless Anchorage | 32/20; 35.0% | 29/19; 63.2% | 14/10; 50.0% | 21/15; 33.3% | 4/1; 0.0% |
| Restless Spire | 31/24; 37.5% | 24/17; 35.3% | 11/7; 14.3% | 19/12; 16.7% | 4/2; 50.0% |
| Ripples of Potential | — | 36/30; 50.0% | 16/13; 23.1% | 22/14; 42.9% | — |
| Room of Refuge | 30/22; 36.4% | — | — | 14/8; 50.0% | 2/1; 100.0% |
| Saheeli, Sublime Artificer | 39/26; 34.6% | 34/22; 40.9% | 22/15; 40.0% | 18/14; 42.9% | 2/0; n/a |
| Secure the Wastes | 30/13; 38.5% | 29/19; 63.2% | 9/7; 28.6% | 17/10; 20.0% | 5/3; 33.3% |
| Serra's Emissary | 37/24; 70.8% | 34/20; 80.0% | 18/11; 72.7% | 15/7; 42.9% | 3/2; 50.0% |
| Shivan Reef | 33/26; 46.2% | 24/23; 34.8% | 14/12; 25.0% | 17/15; 66.7% | 4/3; 33.3% |
| Silver Surfer, Galactus's Herald | 35/22; 36.4% | 31/20; 55.0% | 15/10; 40.0% | 16/7; 28.6% | 4/3; 66.7% |
| Skrelv's Hive | — | — | — | — | 2/2; 50.0% |
| Sol Ring | 25/13; 30.8% | 38/20; 55.0% | 14/6; 33.3% | 23/14; 50.0% | 1/0; n/a |
| Spectral Procession | — | — | — | 20/13; 69.2% | 4/1; 100.0% |
| Sram's Expertise | — | — | — | 20/15; 33.3% | 2/1; 100.0% |
| Staff of Compleation | 25/13; 7.7% | — | — | — | — |
| Staff of the Storyteller | 32/14; 28.6% | — | — | — | — |
| Stroke of Midnight | 27/18; 38.9% | — | — | 13/13; 46.2% | 1/1; 100.0% |
| Sulfur Falls | 24/21; 33.3% | 35/27; 44.4% | 22/18; 38.9% | 15/13; 46.2% | 2/1; 100.0% |
| Sulfurous Springs | 27/20; 20.0% | 29/20; 65.0% | 17/13; 30.8% | 15/14; 35.7% | 1/1; 100.0% |
| Sunfall | 32/0; n/a | — | — | — | — |
| Sunken Ruins | 32/29; 24.1% | 30/23; 52.2% | 13/9; 22.2% | 14/12; 50.0% | 4/3; 33.3% |
| Swamp | 37/28; 32.1% | 47/34; 35.3% | 27/21; 28.6% | 16/13; 30.8% | 3/2; 50.0% |
| Swords to Plowshares | 29/25; 40.0% | 35/26; 38.5% | 14/10; 30.0% | 19/15; 33.3% | 2/2; 100.0% |
| Synthetic Destiny | 35/1; 0.0% | — | — | — | — |
| Talisman of Creativity | 33/22; 36.4% | 40/20; 45.0% | 18/10; 40.0% | — | — |
| Talisman of Dominance | 35/20; 35.0% | 33/17; 52.9% | 14/6; 33.3% | 18/12; 25.0% | 3/1; 0.0% |
| Talisman of Indulgence | 23/12; 25.0% | 37/21; 42.9% | 20/11; 27.3% | — | — |
| Talisman of Progress | 33/17; 35.3% | 29/15; 60.0% | 14/10; 50.0% | 20/13; 23.1% | 2/0; n/a |
| Teferi, Hero of Dominaria | 32/18; 55.6% | 35/27; 55.6% | 17/9; 55.6% | 15/14; 42.9% | 2/2; 50.0% |
| Tekuthal, Inquiry Dominus | 32/21; 52.4% | 30/16; 56.3% | 9/4; 100.0% | 15/7; 14.3% | 3/1; 100.0% |
| The Theorist, Jace Beleren | 38/25; 36.0% | 37/27; 44.4% | 17/12; 33.3% | 14/12; 58.3% | 1/0; n/a |
| Theorist's Sanctum | 31/22; 40.9% | — | — | 12/10; 20.0% | 1/1; 0.0% |
| Theorix Annex | 27/17; 47.1% | — | — | 14/11; 63.6% | 3/3; 66.7% |
| Theorix Charm | 37/23; 43.5% | — | — | — | — |
| Toxic Deluge | — | 37/0; n/a | 19/0; n/a | 18/0; n/a | 4/0; n/a |
| Triplicate Titan | 27/9; 55.6% | — | — | 20/8; 75.0% | 3/0; n/a |
| Turbulent Crater | 34/24; 29.2% | 28/20; 70.0% | 16/12; 50.0% | 16/10; 20.0% | 2/2; 100.0% |
| Turbulent Shore | 29/23; 34.8% | 43/35; 54.3% | 16/14; 35.7% | 24/18; 33.3% | 4/3; 33.3% |
| Turbulent Wetlands | 36/30; 20.0% | 37/28; 53.6% | 22/19; 42.1% | 17/16; 37.5% | 5/3; 66.7% |
| Underground River | 40/34; 26.5% | 34/30; 56.7% | 14/11; 36.4% | 18/13; 38.5% | 2/2; 100.0% |
| Way of the Healer | 39/20; 40.0% | 37/15; 46.7% | 18/10; 20.0% | 18/8; 37.5% | 5/2; 50.0% |
| White Sun's Twilight | 37/13; 38.5% | — | — | — | — |
| Wrath of God | — | 29/20; 60.0% | 15/8; 25.0% | 16/12; 41.7% | 3/1; 0.0% |

## Sources and reproducibility

Generated with `python3 analysis/jace-finished-runs.py`. Each input run was checked for invalid/aborted markers, completed summary, exact log count and agreement between logged Jace wins and summary. The source card CSVs retain additional columns: first-cast round and seen/not-seen conditional win rates.

- A: [v0.1-real / 2026-10-291734-smart-politics-100](v0.1-real/runs/2026-10-291734-smart-politics-100/summary.json); [card CSV](v0.1-real/runs/2026-10-291734-smart-politics-100/card-stats.csv).
- B: [v0.2-six / 2026-10-292038-smart-politics-100](v0.2-six/runs/2026-10-292038-smart-politics-100/summary.json); [card CSV](v0.2-six/runs/2026-10-292038-smart-politics-100/card-stats.csv).
- C: [v0.2-six / 2026-10-292338-smart-politics-keeptokens-50](v0.2-six/runs/2026-10-292338-smart-politics-keeptokens-50/summary.json); [card CSV](v0.2-six/runs/2026-10-292338-smart-politics-keeptokens-50/card-stats.csv).
- D: [v0.5-topdeck-tokens / 2026-10-292338-smart-politics-keeptokens-50](v0.5-topdeck-tokens/runs/2026-10-292338-smart-politics-keeptokens-50/summary.json); [card CSV](v0.5-topdeck-tokens/runs/2026-10-292338-smart-politics-keeptokens-50/card-stats.csv).
- E: [v0.6-precon-engine / 2026-10-300012-smart-politics-keeptokens-10](v0.6-precon-engine/runs/2026-10-300012-smart-politics-keeptokens-10/summary.json); [card CSV](v0.6-precon-engine/runs/2026-10-300012-smart-politics-keeptokens-10/card-stats.csv).

Engine interpretation checked against `gauntlet/gauntlet.js`, `forge/replaysim/src/forge/view/PodSim.java`, `forge/custom/CHANGELOG.md` and local Forge card scripts. Recommendations await Claude’s completed C1 comparison and C3 targeted-answer test.
