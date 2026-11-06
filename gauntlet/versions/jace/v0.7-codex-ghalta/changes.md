# Jace v0.7-codex-ghalta — two cheap exile answers

Built by Codex 2026-10-29 from v0.6-precon-engine. Untested; ready for Lane C3.

## Swaps

| Out | In | Reason |
|---|---|---|
| Fateful Absence | Despark | Two-mana exile for a permanent with mana value 4+. Answers Ghalta even if indestructible; no Clue. Patrick already owns it in v0.1-real. Cannot answer low-mana creatures, even if huge. |
| Toxic Deluge | Reality Shift | Two-mana instant exile for any targetable creature. Deluge is strong in human hands but Forge barely casts it; this tests a usable targeted answer. Costs a board wipe, so monitor wide boards. |

Dreamtide Whale, Massacre Wurm, Triplicate Titan, Loyal Tutor, token makers, top-deck cards, and all lands retained. Wrath of God, Austere Command and Chandra’s Ignition remain.

## Three candidates researched

- **Despark (WB):** selected. Local Forge script `d/despark.txt` uses ChangeZone to Exile, restricted to mana value 4+. No AI:RemoveDeck or special AI restriction. Owned, so no purchase needed. A commander exiled this way can return to the command zone and be recast.
- **Reality Shift (1U):** selected. `r/reality_shift.txt` uses ChangeZone to Exile then Manifest. AI targets mana value >=3 OR power >=3, covering Ghalta. No AI:RemoveDeck flag. Opponent receives a face-down 2/2 that could later turn face up; it is not always harmless. Scryfall current representative nonfoil price $0.26, not a cheapest-printing audit: https://scryfall.com/card/soc/199/reality-shift . Live API checked 2026-10-29; Commander legal, blue identity, not a Game Changer.
- **Resculpt (1U):** reserve option. `r/resculpt.txt` exiles a creature or artifact and creates a 4/4 Elemental; AILogic=Pongify, no AI:RemoveDeck. The guaranteed 4/4 is a larger blocker/attacker to leave behind, so prefer Reality Shift first. Low-cost printing references around $0.25–$0.34: https://spellrack.com/cards/814e321d-16fd-4f7b-a8d8-2b089be76f2c . Not included in this list; live Game Changer/legality field not fetched for reserve candidate.

Exile does not bypass hexproof, shroud, or relevant protection. These cards remove one threat, not the whole Ghalta board. Forge support does not establish good timing: AI may spend removal before the critical attack and rarely holds mana.

## Validation

- 100 total cards including commander; singleton except Plains; WUBR identities for both additions.
- Ran requested `node gauntlet/check-deck.js jace v0.7-codex-ghalta --vs v0.6-precon-engine`; ordinary invocation fails because Node cannot resolve external API hosts.
- Retrieved Reality Shift via curl from Scryfall and added its actual response fields to the existing card cache. Despark was already cached (not a Game Changer).
- Re-ran the unchanged checker with temporary network fallback `/private/tmp/jace-check-offline.cjs`, reporting the unavailable Spellbook check explicitly. Available checks PASS: one Game Changer (Cyclonic Rift), no mass land destruction, no extra turns, 39 lands, average nonland MV 4.15 → 4.13; same mana sources and one extra blue pip. **Online two-card combo review remains incomplete.** The checker’s PASS is not a completed combo audit.
- No engine files changed; no Forge games started by Codex.

## Hand-off to C3

Run 10 games with `--smart --politics --keeptokens`; choose parallelism from the shared process budget. Compare with v0.6 on matching pods, especially Ghalta pods. Record draws/casts of Despark and Reality Shift, whether they actually exile Ghalta or another huge threat, and deaths to wide boards after removing Deluge. A 10-game win-rate gap cannot establish an improvement.

Suggested command (Claude owns execution):
`node gauntlet/gauntlet.js jace v0.7-codex-ghalta 10 --smart --politics --keeptokens --par=2`
