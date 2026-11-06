# v0.8-codex-owned-engine

Built by Codex 2026-10-29 directly from Patrick’s v0.1-real physical baseline. **Untested.** No existing list, engine or run altered.

No-purchase diagnostic: add recurring blocking/fodder capacity and an owned payoff that has visibly prevented a loss.

| Out | In | Reason |
|---|---|---|
| Synthetic Destiny | Dreadhorde Invasion | Two-mana recurring Army source; one Army grows, with a new Army only after the old one is gone. Costs one life each upkeep. |
| Overwrite the Multiverse | Darksteel Angel | Owned indestructible payoff: verified can’t-lose replacement saved a game at -1 life in C1 pod16-g4. |

## Constraints and caveats

A nine-mana card can clog the hand. Army power grows above the current sim’s power-2 Jace exile limit. Removal of two expensive effects is a real tradeoff; no free card is automatically an upgrade. This alternate diagnostic does not buy/install Massacre Wurm; the preferred survival recommendation still includes Patrick’s requested Wurm.

All 39 lands and all baseline mana rocks retained, including Staff of Compleation and Cursed Mirror. Dreamtide Whale, Triplicate Titan, Loyal Tutor and owned Despark retained. No Skrelv’s Hive: its Mites cannot block. Each file contains 100 cards, singleton except basic lands.

New card Forge scripts exist and have no AI:RemoveDeck flag. Reality Shift has a large-creature target preference; Aetherize uses existing SmartAi logic but may be constrained by mana/timing. No new AI flags or logic. Current Scryfall batch confirms all additions are legal in WUBR and not Game Changers.

## Hand-off to Claude C6

`node gauntlet/gauntlet.js jace v0.8-codex-owned-engine 10 --smart --politics --keeptokens --par=2`

Use the shared process budget; do not run this command until the C6 lane chooses a time. Match the physical baseline’s first ten pods/seeds and frozen engine. A 10-game test checks card use, color problems and gross failure, not close win rates. Run the preferred survival package first, then targeted alternatives as needed. Fix/flag timeout scoring in both comparisons.

Record actual casts/activations, incoming combat and life-loss, resolved -3 counts and fodder availability; do not rank payoffs from cast-only win rates. See ../../../../JACE-RECOMMENDATION.md.

Validation: available check-deck bracket/mana checks PASS vs v0.1-real; zero Game Changers, 39 lands, unchanged source counts. Online Commander Spellbook combo audit unavailable (DNS); PASS is limited, not a complete combo certification.
