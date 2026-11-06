# Game 1 — Updated Jace vs. three precons (2026-10-26)

**Result: Patrick (Jace) wins on his 16th turn.** Ghalta eliminated by Patrick on round 9; Dina eliminated by Captain America on round 14; Captain America eliminated by Patrick on round 16.

## Setup

- Shuffles and draws: real, from `deal.js` (crypto RNG). Full deal saved in `game-deal.json`.
- Card text: Scryfall (Jace deck) and MTGJSON (precons).
- Decisions for all four seats, combat math and rules: played by Claude, not a rules engine. Turn-by-turn play is a judgment call; card draws are not.
- Jace list: `jace-updated.txt` (9 swaps applied; Stroke of Midnight left out to hit 100; lands are the modeled baseline + Haunted Ridge).
- Library order after a shuffle effect (fetch lands, Cultivate, Silver Surfer tutor) kept as dealt; it was random either way.
- Everyone draws on turn 1 (multiplayer rule). 40 life. No mulligans needed.

| Seat | Pilot | Commander | Deck |
|---|---|---|---|
| 1 | Opponent B | Dina, Essence Brewer | Witherbloom Pestilence (SOC precon) |
| 2 | Patrick | Jace, Multiverse Architect | Updated Jace |
| 3 | Opponent A | Captain America, Team Leader | Avengers Assemble (MSC precon) |
| 4 | Opponent C | Ghalta, Primal Hunger | Tramplesaurus Rex (FDC precon) |

Patrick's opening hand: Serra's Emissary, Silver Surfer, Turbulent Shore, Mountain, Sulfurous Springs, Overwrite the Multiverse, Elspeth, Sun's Champion.

## Turn log

**Round 1** — Dina: Forest. Jace: Turbulent Shore (tapped). Cap: Scorched Geyser (tapped). Ghalta: Forest, Fyndhorn Elves.

**Round 2** — Dina: Swamp, holds Witherbloom Charm. Jace: Sulfurous Springs, **Azorius Signet**. Cap: Island, Hero's Blade. Ghalta: Forest, Llanowar Tribe.

**Round 3** — Dina: Woodland Cemetery, Pawn of Ulamog. Jace: Swamp, pass. Cap: Plains, **Captain America** (Hero's Blade attaches → 6/5). Ghalta: no land, **Gigantosaurus** (10/10).

**Round 4** — Dina: Viridescent Bog, **Dina**; Pawn hits Patrick (38). Jace: Mountain, **Jace, Multiverse Architect**, +1 (draw Turbulent Wetlands + Grand Crescendo, bottom Crescendo) → loyalty 5. Cap: pays Jace's {2} tax, Captain America (6/5) kills Jace. Ghalta: **Ghalta for GG**, Commander's Sphere, Birds of Paradise; Gigantosaurus hits Patrick (28).

**Round 5** — Dina: Terramorphic Expanse, Ophiomancer. Jace: Fetid Heath, **Overwrite the Multiverse** — exiles all 9 creatures on the board (Ghalta, Gigantosaurus, Tribe, Elves, Birds, Captain America, Dina, Pawn, Ophiomancer). Cap: Glittering Massif, Relic of Legends. Ghalta: Forest, **Tangleweave Armor** (12/12 Germ — Ghalta's mana value counts from the command zone).

**Round 6** — Dina: **Witherbloom Charm destroys the 12/12 Germ** (token = mana value 0), Nether Traitor pokes Ghalta (39). Jace: Turbulent Wetlands, **Elspeth**, +1 (3 Soldiers). Cap: recasts Captain America. Ghalta: Managorger Hydra.

**Round 7** — Dina: Swamp, **Beledros Witherbloom**; Nether Traitor hits Elspeth (4). Jace: **Serra's Emissary naming Creature** (Patrick and his creatures now have protection from creatures), Elspeth +1 (6 Soldiers). Cap: Island, Iron Man + Hulkbuster Armor; Iron Man hits Ghalta (36). Ghalta: Forest, **Thickest in the Thicket on Hydra → 12/12**, Hydra tramples Dina's board (Dina 30), draws 2.

**Round 8** — Dina: Dina + Haywire Mite; Nether Traitor hits Elspeth (4). Emissary hits Dina (23). Jace: Mystic Gate, Elspeth +1 (9 Soldiers), **holds 8 mana**. Cap: She-Hulk + Talisman; She-Hulk and Iron Man kill Elspeth. Ghalta: Witch's Clinic, Ghalta again for GG, **Kenrith's Transformation on Serra's Emissary** (protection gone), Bite Down kills Beledros, attacks Patrick with a 19/19 Hydra → **Patrick overloads Cyclonic Rift mid-combat**: every nonland permanent his opponents control goes back to hand. Hydra loses all its counters. Patrick keeps Emissary + 9 Soldiers.

**Round 9** — Dina: Creakwood Liege, Dina, Haywire Mite. Jace: Restless Anchorage, **Ajani Unrelenting +1** (all creatures +1/+0 and haste, Cadet token), swings 11 creatures at Ghalta, then **Fatehold Charm (+1/+2)** mid-combat → 40 damage. **Ghalta eliminated.** Cap: Captain America + Metallic Mimic; Mimic hits Ajani (3).

**Round 10** — Dina: Turbulent Fen, Moldervine Reclamation, Nether Traitor; kills Ajani. Jace: swings at Dina (23 → 11 after blocks), then **Chandra's Ignition with Serra's Emissary**: 7 to every other creature and each opponent — wipes both boards (Patrick's Soldiers too). Moldervine refills Dina (+7 life, 5 cards) → Dina 11, Cap 33. Cap: **Swords to Plowshares on Serra's Emissary** (Patrick 35), Hercules.

**Round 11** — Dina: Vernal Fen, Dina, Yahenni, Elvish Mystic; Yahenni hits Patrick (33). Jace: Kher Keep, **recasts Jace** (+1 → 5), **Ripples of Potential** proliferates (6) and phases Jace out to protect it. Cap: She-Hulk; Hercules hits Patrick (29).

**Round 12** — Dina: Ohran Frostfang, Blight Mound, Cultivate; Yahenni + Dina hit Patrick (25). Jace: Jace +1 (7), **Memnarch** (8/9 indestructible + 2 Myr). Cap: Iron Man, Talisman; Hercules attacks Jace, Myr chumps → Jace 3.

**Round 13** — Dina: Trudge Garden; attacks Jace — Memnarch kills Dina, Myr trades with Yahenni. Jace: Sulfur Falls, Jace +1 (4), **Silver Surfer** (tutors Galactus), **Jhoira steals Quicksilver** from Cap's library (Patrick 20); Memnarch attacks, draws 2. Cap: Professor Hulk; Iron Man + Hercules hit Dina (8).

**Round 14** — Dina: Dina again, Awakening Zone, stays home. Jace: Exotic Orchard, Jace +1 (5), **Galactus exiles Hercules**, Rakdos Signet; Silver Surfer hits Dina (4). Cap: Captain America; **Iron Man flies over for 6 — Dina eliminated.**

**Round 15** — Jace: Plains, **Lich's Relic** (destroys Iron Man), **Nicol Bolas −3** (destroys Professor Hulk), Saheeli, Aminatou. Full swing at Cap (34 power) → Cap answers with **Heroic Sacrifice**, redirecting all of it to She-Hulk. Jhoira steals Rescue (Patrick 18); Memnarch draws 6. Cap: Hulkbuster Armor on Captain America (9/9 flier).

**Round 16** — Jace: Bolas +1 (Cap exiles Relic of Legends from hand), **Aminatou −1 flickers Lich's Relic** → destroys Captain America; re-equip Relic. Galactus, Memnarch, Jhoira, Silver Surfer, Quicksilver, Rescue, Servo attack into an empty board for 39. **Captain America eliminated — Patrick wins.**

## How the new cards did

| New card | Drawn? | Impact |
|---|---|---|
| Cyclonic Rift | Yes (R4) | **Game-winning.** Overloaded mid-combat on Ghalta's turn; reset three boards. |
| Chandra's Ignition | Yes (R10) | **Huge.** Two-player wipe + 7 to each opponent off Serra's Emissary. |
| Ripples of Potential | Yes (R11) | Good. Proliferate + phase out protected the recast Jace. |
| Divergent Transformations | Yes (R12) | Bottomed by Jace +1; never needed. |
| Oath of Gideon | Yes (R15) | Drawn late, not cast. |
| Aetherize | Yes (R14) | Drawn late, not cast — Patrick was tapped out on the turns it would have mattered. |
| Massacre Wurm, Clever Concealment, Lim-Dûl's Vault | No | — |

Cards that did the heavy lifting from the existing list: Overwrite the Multiverse, Serra's Emissary, Elspeth, Ajani + Fatehold Charm, Memnarch, Jhoira, Galactus, Lich's Relic + Aminatou.

## Weak spots this game exposed

- **Jace on turn 4 died immediately** to a 6/5 Captain America. The {2} attack tax didn't stop it. Jace did much better recast later behind blockers + Ripples.
- **Patrick's own sweepers hit his board too** (Ignition killed 5 Soldiers). Fine here, but worth remembering.
- **Patrick took ~20 damage from creatures while Serra's Emissary was down.** Kenrith's Transformation and Swords both answered it cheaply.
- Patrick's life total is approximate (~16 at the end): Sulfurous Springs pings weren't tracked exactly.
