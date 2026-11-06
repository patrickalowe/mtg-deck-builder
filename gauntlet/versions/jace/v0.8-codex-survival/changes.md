# v0.8-codex-survival

Built by Codex 2026-10-29 directly from Patrick’s v0.1-real physical baseline. **Untested.** No existing list, engine or run altered.

Preferred first three-card trial: early exile interaction, an answer to lethal attacks and the requested anti-swarm payoff.

| Out | In | Reason |
|---|---|---|
| White Sun's Twilight | Massacre Wurm | Twilight needs seven mana to wipe and makes Mites that cannot block; Wurm can shrink opposing small creatures while keeping your tokens and is a Jace hit. |
| Overwrite the Multiverse | Anguished Unmaking | Keep Sunfall as the cheaper exile board wipe; add an instant nonland exile answer for recursive/indestructible threats. Costs 3 life and does not bypass hexproof. |
| Synthetic Destiny | Aetherize | Trade a six-mana delayed transformation spell for a four-mana defensive answer to attacking armies, including unblockable creatures. Cannot undo attack triggers; nontoken creatures can be recast. |

## Constraints and caveats

These are best-fit recommendations to trial, not measured individual upgrades. Losing Synthetic Destiny costs a real protection/polymorph option that Forge underuses. Wurm needs BBB when hard cast and does not sweep already-large tokens.

All 39 lands and all baseline mana rocks retained, including Staff of Compleation and Cursed Mirror. Dreamtide Whale, Triplicate Titan, Loyal Tutor and owned Despark retained. No Skrelv’s Hive: its Mites cannot block. Each file contains 100 cards, singleton except basic lands.

New card Forge scripts exist and have no AI:RemoveDeck flag. Reality Shift has a large-creature target preference; Aetherize uses existing SmartAi logic but may be constrained by mana/timing. No new AI flags or logic. Current Scryfall batch confirms all additions are legal in WUBR and not Game Changers.

## Hand-off to Claude C6

`node gauntlet/gauntlet.js jace v0.8-codex-survival 10 --smart --politics --keeptokens --par=2`

Use the shared process budget; do not run this command until the C6 lane chooses a time. Match the physical baseline’s first ten pods/seeds and frozen engine. A 10-game test checks card use, color problems and gross failure, not close win rates. Run the preferred survival package first, then targeted alternatives as needed. Fix/flag timeout scoring in both comparisons.

Record actual casts/activations, incoming combat and life-loss, resolved -3 counts and fodder availability; do not rank payoffs from cast-only win rates. See ../../../../JACE-RECOMMENDATION.md.

Validation: available check-deck bracket/mana checks PASS vs v0.1-real; zero Game Changers, 39 lands, unchanged source counts. Online Commander Spellbook combo audit unavailable (DNS); PASS is limited, not a complete combo certification.
