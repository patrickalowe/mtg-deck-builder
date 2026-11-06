# Simulation results (2026-10-26)

Patrick's decks vs. three Commander precons: Captain America (Avengers Assemble), Dina (Witherbloom Pestilence), Ghalta (Tramplesaurus Rex). Seats shuffled every game. A fair share in a 4-player pod is **25%**.

## Latest numbers (simulator v2: artifact synergies, monarch, vehicles, Vibranium modeled)

| Deck | 2,000-game win rate | Ghalta | Dina | Captain America |
|---|---|---|---|---|
| **Wakanda — current list** | **28.7%** | 49.8% | 11.3% | 10.4% |
| **Wakanda — with 14 proposed swaps** | **32.8%** | 50.6% | 8.8% | 7.9% |
| Jace — with 9 swaps | 56.1% | 32.0% | 5.9% | 6.1% |
| Jace — original list | 58.9% | 28.4% | 6.1% | 6.7% |

10-game runs: Wakanda current **2/10** (Ghalta 6, Dina 2). Jace updated 7/10 and 5/10 in two earlier runs.

**Margin of error:** about ±1.5 points between two 2,000-game runs. Wakanda's +4.1 points from the swaps is outside that. Jace's −2.8 is borderline, and points the same direction as the first run (−1.6), likely because the model can't see what most of the Jace swaps do (see below).

Simulator v1 (before artifact/monarch modeling) had Wakanda current at 7.5%, which was a modeling failure, not the deck.

## T'Challa 500-game breakdown (wakanda-proposed, `node analyze.js results-wakanda-proposed-500.json`)

- **161/500 wins (32.2%).** Earlier 500-game run: 32.8%. Current list over 500: 29.8%.
- Seat barely matters: 29.6% / 30.9% / 30.5% / 37.3% for seats 1–4 (seat 4 edge is within noise).
- **Ghalta is the problem matchup:** Ghalta wins 244 of 500 games and eliminated Patrick in 226 of his 339 losses (67%).
- Patrick is eliminated around round 10 on average; 29% of his losses happen by round 8.
- Card impact = win rate when the card was in the opening hand or first 8 draws vs. not. Noise at ~65 games per card is about ±12 points; Heroic Intervention (does nothing in this model) shows +13, so only **Wurmcoil Engine (+28)** is clearly real. Bottom of the list (W'Kabi −18, Thran Dynamo −15, Nature's Lore −14) is within noise except possibly W'Kabi, whose Rhino trigger isn't modeled.
- Measuring by "cast" instead of "drawn early" is badly biased: expensive cards only get cast in games Patrick survives, so Overwhelming Stampede (a blank here) showed +20.

## Decklist caveats

- **Jace:** Stroke of Midnight left out to reach 100; lands are the modeled baseline from the notes + Haunted Ridge.
- **Wakanda:** the real 38-card land list isn't recorded anywhere. **The Wakanda Forever precon's 38 lands are used as a stand-in.** Card-name fixes: Huru Tezaze → Hatut Zeraze Strike Force; Marvel names mapped to Thran Dynamo, Sword of the Animist, Mind's Eye, Hammer of Nazahn, Beast Within. **"Herald's Post" and "Vibranium Cache" don't exist on Scryfall** — stood in by Trading Post and Conduit of Worlds (both modeled as blanks, so the guess doesn't move results).

## How it works

`node sim.js [games] [deck file]` — deck files: `jace-updated.txt`, `jace-original.txt`, `wakanda-current.txt`, `wakanda-proposed.txt`.

Every seat is played by the same fixed rules: play a land, cast the most expensive useful spell, removal on the biggest threat, board wipes when they hurt opponents much more than you, planeswalker abilities, attack the opponent who is easiest to kill with creatures that won't die. Defenders make good blocks and chump only when facing lethal.

Modeled specially: Ghalta / affinity / Metalwork Colossus / Vanquish the Horde cost reductions, Vibranium tokens (as colorless mana), T'Challa and Zuri counters on big artifacts, Loyal Guardian, monarch, vehicles (as creatures, no crew), equipment +N/+N, Serra's Emissary, Cyclonic Rift and Winds of Abandon overload, Chandra's Ignition, Massacre Wurm, Ghostly Prison, Divine Visitation, Martial Coup.

## What it does not model (read before trusting the numbers)

- **Colors.** All mana is colorless. Flatters 3–4-color decks.
- **Instant-speed play.** Everything is cast on your own turn. Rift, Aetherize, Clever Concealment, Akroma's Will, Heroic Intervention and counterspells lose most of their value.
- **Cards the text parser can't read are blanks.** Jace swaps that are blanks: Oath of Gideon, Ripples of Potential, Clever Concealment, Lim-Dûl's Vault, Aetherize, Divergent Transformations. Wakanda swaps that are blanks: Akroma's Will, Mystic Forge, Forsaken Monument, Reconnaissance, Clever Concealment, Thousand Moons Smithy's ability, Nettlecyst's germ, Foundry Inspector's cost reduction.
- **Many Wakanda engines:** Helm of the Host, Mirrorworks, Mirrormind Crown, Kimoyo Beads, Bast, Storm, Okoye's double strike, W'Kabi rhinos, Black Panther's Hero triggers, Overwhelming Stampede, Greater Good, Loyal Retainers.
- **Opponent synergies** (Captain America's Hero triggers, Dina's sacrifice engine) are mostly missing, so those two precons are weaker here than in real life. Ghalta (big vanilla creatures) is the deck the model handles best.
- Jace's {2} attack tax, protection besides Serra's Emissary, graveyard recursion and politics are not modeled.

## 1v1 vs. random bracket-3 decks — NOT a usable result (2026-10-26)

Pool: 60 random single-commander, 100-card decks tagged **bracket 3** on Archidekt, from the 215 most-viewed (`node fetch-bracket3.js 60`, saved in `data/bracket3/`, each file links to its source deck). Run: `node sim.js 500 <deck> --bracket3-1v1`.

| Patrick's seat | 500-game 1v1 win rate |
|---|---|
| Wakanda with 14 swaps | 89.6% |
| Wakanda current | 92.4% |
| Jace updated | 92.6% |
| **Stock Wakanda Forever precon (bracket 2)** | **91.0%** |
| **Stock Ghalta precon (bracket 2)** | **90.2%** |

Every deck wins ~90%, including unupgraded precons, so the number measures the simulator, not the deck. Checks:
- Mirror (Ghalta precon vs. itself through the pool path): **50.6%** — no seat or loading bias.
- Archidekt vs. MTGJSON data for 27 shared cards: identical (two subtype orderings differ, which the sim ignores).
- Stock Ghalta precon vs. a bracket-3 Ghalta deck: **precon wins 60%**. The simulator rewards land count and raw creature stats and can't play the engines, tutors, combos and interaction that make a deck bracket 3, so upgraded decks look *worse* than precons.

A real answer needs a full rules engine (Forge: AI-vs-AI Commander sims, needs Java) or hand-played games.
