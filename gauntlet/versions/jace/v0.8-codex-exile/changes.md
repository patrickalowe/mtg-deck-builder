# v0.8-codex-exile

Built by Codex 2026-10-29 directly from Patrick’s v0.1-real physical baseline. **Untested.** No existing list, engine or run altered.

Isolate two extra instant exile answers against large/recurrent creatures and troublesome nonland engines, keeping owned Despark.

| Out | In | Reason |
|---|---|---|
| Overwrite the Multiverse | Anguished Unmaking | Instant exile of any targetable nonland permanent; Sunfall retained for a full exile reset. |
| Synthetic Destiny | Reality Shift | Two-mana creature exile without the 4+ mana-value restriction of Despark; opponent manifests a 2/2 that may turn face up. |

## Constraints and caveats

Two fewer mass effects; this may lose ground to wide boards. Exile does not prevent a commander returning to the command zone. Does not answer hexproof. Massacre Wurm is not in the physical baseline; this is an isolated alternate diagnostic, while the preferred survival list adds it.

All 39 lands and all baseline mana rocks retained, including Staff of Compleation and Cursed Mirror. Dreamtide Whale, Triplicate Titan, Loyal Tutor and owned Despark retained. No Skrelv’s Hive: its Mites cannot block. Each file contains 100 cards, singleton except basic lands.

New card Forge scripts exist and have no AI:RemoveDeck flag. Reality Shift has a large-creature target preference; Aetherize uses existing SmartAi logic but may be constrained by mana/timing. No new AI flags or logic. Current Scryfall batch confirms all additions are legal in WUBR and not Game Changers.

## Hand-off to Claude C6

`node gauntlet/gauntlet.js jace v0.8-codex-exile 10 --smart --politics --keeptokens --par=2`

Use the shared process budget; do not run this command until the C6 lane chooses a time. Match the physical baseline’s first ten pods/seeds and frozen engine. A 10-game test checks card use, color problems and gross failure, not close win rates. Run the preferred survival package first, then targeted alternatives as needed. Fix/flag timeout scoring in both comparisons.

Record actual casts/activations, incoming combat and life-loss, resolved -3 counts and fodder availability; do not rank payoffs from cast-only win rates. See ../../../../JACE-RECOMMENDATION.md.

Validation: available check-deck bracket/mana checks PASS vs v0.1-real; zero Game Changers, 39 lands, unchanged source counts. Online Commander Spellbook combo audit unavailable (DNS); PASS is limited, not a complete combo certification.
