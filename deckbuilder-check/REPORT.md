# mtg-deckbuilder check (2026-10-26)

Ran [flegars/mtg-deckbuilder](https://github.com/flegars/mtg-deckbuilder)'s own code — `validateDeck`, `computeDeckStats`, and its Commander Spellbook combo lookup — against the four lists in `../sim/`, without the Electron app. `npx tsx run.ts <deck files>`; raw output in `report.json`. The AI features (Deck Doctor, Suggestions, Synergy) were not run: they need an Anthropic API key and cost money per run.

| | Jace original | Jace updated | Wakanda current | Wakanda proposed |
|---|---|---|---|---|
| Commander-legal, 100 cards | ✅ | ✅ | ✅ | ✅ |
| Avg mana value (nonland) | 3.77 | **4.02** | 3.74 | **3.59** |
| 6+ mana spells | 15 | 17 | 5 | 5 |
| Combos already in the deck | 0 | 0 | 0 | 0 |
| Combos one card away | 40 | 46 | 6 | 9 |

## Color: pips needed vs. sources (app warns only if sources < pips/2 — no warnings)

- Jace original: W 32/22 · U 20/23 · **B 21/15** · R 7/13
- Jace updated: W 29/20 · U 22/21 · **B 23/13** · R 10/11 — black demand up (Massacre Wurm, Lim-Dûl's Vault), black sources down (Fellwar Stone and the Staffs counted as any-color sources).
- Wakanda current: W 27/18 · G 27/23
- Wakanda proposed: W 26/19 · G 24/23

## Notable near-combos

- **Wakanda proposed: Mystic Forge + Foundry Inspector + Sensei's Divining Top = infinite card draw.** Two of the three pieces arrive with the 14 swaps.
- Jace: Aminatou + Nicol Bolas + Oath of Teferi (exile all opponents' permanents and hands); Cursed Mirror + Astral Dragon (infinite hasty tokens); Chandra's Ignition + Blightsteel Colossus (each opponent loses); Avacyn, Angel of Hope + Nevinyrral's Disk or Worldslayer (one-sided lock).
- Wakanda: Hammer of Nazahn + Apex Altisaur; Invisible Woman + Rosie Cotton; Helm of the Host + Enduring Scalelord.

## Quirks in the app's numbers

- "Mana rocks" only counts artifacts costing 3 or less with an `Add {…}` symbol, so Wakanda shows **1** (Sol Ring) — Arcane Signet, Thran Dynamo, Gilded Lotus and Vibranium tokens are missed. "Ramp spells" misses most ramp too.
- Wakanda proposed shows 39 lands because Thousand Moons Smithy's back face is a land; the real count is still 38.
- Wakanda lands are the precon stand-in; Herald's Post / Vibranium Cache are stood in by Trading Post / Conduit of Worlds.
