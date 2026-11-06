# Forge results (2026-10-26)

Forge 2.0.15 (full rules engine, AI vs. AI), Java 21 via Homebrew. `node run-forge.js 500 tchalla-proposed 4`.

## T'Challa (14 swaps) — 500 games, 1v1 vs. random bracket-3 decks

**252 wins, 248 losses, 0 draws — 50.4%** (95% margin of error about ±4.4 points).

- Opponents: 58 real bracket-3 Commander decks from Archidekt (`decks/b3-*.dck`, source links in `../sim/data/bracket3/`). Two decks from the original 60 were dropped because Forge doesn't support one card in each.
- Every card in Patrick's deck is supported by Forge. Lands are still the precon stand-in; Herald's Post / Vibranium Cache are stood in by Trading Post / Conduit of Worlds.
- Games last ~10 rounds (each player gets ~10 turns; Forge's "Turn N" in the game outcome counts rounds). 157 of 248 losses happened by round 10.
- How T'Challa lost: life total 224, commander damage 19, alternate wins 3 (Angel of Destiny ×2, Strixhaven Stadium), poison 1, decking 1.

| Toughest opponents | T'Challa record | Easiest opponents | T'Challa record |
|---|---|---|---|
| Thranduil, the Elvenking | 0/7 | Wilhelt, the Rotcleaver | 7/7 |
| Giada, Font of Hope | 1/9 | Jon Irenicus, Shattered One | 9/9 |
| Ghalta, Primal Hunger | 1/6 | Iroh, Grand Lotus | 9/11 |
| Arcades, the Strategist | 1/6 | Ghoulcaller Gisa | 8/10 |
| Captain Sisay | 2/11 | Baba Lysaga, Night Witch | 7/9 |
| Meren of Clan Nel Toth | 2/10 | Emry, Lurker of the Loch | 7/9 |
| Krenko, Mob Boss | 2/9 | | |
| Massacre Girl, Known Killer | 2/8 | | |

Per-opponent records are 6–11 games each — indicative, not precise.

## Caveats

- Forge's AI is a competent but imperfect pilot for both sides; it logs that it uses a generic fallback for some choices (e.g. Mirrormind Crown). It doesn't do politics or long-term planning.
- 1v1 at 40 life with 21 commander damage, not a 4-player pod.
- Raw logs: `runs/tchalla-proposed-500/*.log` (one per opponent).

## Jace (9 swaps) — 500 games, 1v1 vs. random bracket-3 decks

**267 wins, 233 losses, 0 draws — 53.4%** (±4.4). Same 58-deck pool. All Jace cards supported by Forge; Stroke of Midnight left out to reach 100; lands are the modeled baseline + Haunted Ridge.

- Toughest: Sidisi 1/8, Lathril 1/6, Ghalta 3/14, Meren 2/8, Giada 2/7 and 3/10 (two decks), Yennett 2/7, Tom, Bert, and William 4/13.
- Easiest: Kilo 8/8, Thromok 8/9, Lyse Hext 7/8, Emry 6/7, Baba Lysaga 6/7.
- Losses: life total 215, commander damage 13, poison 4, Strixhaven Stadium 1. Avg length: wins 11.4 rounds, losses 10.0.
- Ghalta, Giada and Meren are among the toughest for **both** Jace and T'Challa.
