# v0.8-codex-swarms

Built by Codex 2026-10-29 directly from Patrick’s v0.1-real physical baseline. **Untested.** No existing list, engine or run altered.

Isolate a cheaper full creature reset and a one-sided small-creature payoff against Lathril/Krenko/Chatterfang.

| Out | In | Reason |
|---|---|---|
| White Sun's Twilight | Massacre Wurm | Fresh 1/1 and 2/2 armies can die to the entry effect; preserves friendly fodder. Does not handle pumped larger armies by itself. |
| Martial Coup | Wrath of God | Four mana for a full creature wipe instead of requiring X>=5 (seven total mana). |

## Constraints and caveats

Loses two token-making X spells; Wrath kills your own creature board and does not exile or beat indestructible. Sunfall and Overwrite retained. Wurm hard casting raises black requirements.

All 39 lands and all baseline mana rocks retained, including Staff of Compleation and Cursed Mirror. Dreamtide Whale, Triplicate Titan, Loyal Tutor and owned Despark retained. No Skrelv’s Hive: its Mites cannot block. Each file contains 100 cards, singleton except basic lands.

New card Forge scripts exist and have no AI:RemoveDeck flag. Reality Shift has a large-creature target preference; Aetherize uses existing SmartAi logic but may be constrained by mana/timing. No new AI flags or logic. Current Scryfall batch confirms all additions are legal in WUBR and not Game Changers.

## Hand-off to Claude C6

`node gauntlet/gauntlet.js jace v0.8-codex-swarms 10 --smart --politics --keeptokens --par=2`

Use the shared process budget; do not run this command until the C6 lane chooses a time. Match the physical baseline’s first ten pods/seeds and frozen engine. A 10-game test checks card use, color problems and gross failure, not close win rates. Run the preferred survival package first, then targeted alternatives as needed. Fix/flag timeout scoring in both comparisons.

Record actual casts/activations, incoming combat and life-loss, resolved -3 counts and fodder availability; do not rank payoffs from cast-only win rates. See ../../../../JACE-RECOMMENDATION.md.

Validation: available check-deck bracket/mana checks PASS vs v0.1-real; zero Game Changers, 39 lands, unchanged source counts. Online Commander Spellbook combo audit unavailable (DNS); PASS is limited, not a complete combo certification.
