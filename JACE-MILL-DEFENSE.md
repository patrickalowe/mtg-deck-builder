# Jace mill defense — proposal only

Prepared by Codex, 2026-10-29, for RESUME X4. No candidate slots, shared engine code, current pods or runs have been changed. Ownership of these three cards is unconfirmed; this is not an addition to the buy cart.

**Recommendation:** try Elixir of Immortality first when facing a dedicated mill deck. Liliana, Death's Majesty is the better broad recovery/fodder candidate. Keep Primevals' Glorious Rebirth as a situational option rather than the first mill-defense purchase. None has a measured win-rate benefit here: the current gauntlet does not contain an opponent-focused mill deck.

## The three options

| Card | What it solves | Limitation for this Jace list | Recommendation |
|---|---|---|---|
| [Elixir of Immortality](https://scryfall.com/card/c21/243/elixir-of-immortality) — 1 mana, then 2 and tap | Recycles the whole graveyard into the library; restores milled payoffs and a library buffer, plus 5 life | Must reach the battlefield and activate in time. If Elixir itself is milled, it does nothing from the graveyard. Shuffling undoes deliberate top-deck setup. Does not recover exiled cards. | First narrow anti-mill trial; three total mana to deploy and activate, which can be split across turns. |
| [Liliana, Death's Majesty](https://scryfall.com/card/mic/121/liliana-deaths-majesty) — 3BB | Immediately uses −3 to return a creature from your graveyard, including nonlegendary payoffs; +1 makes a blocking/Jace-fodder Zombie | +1 mills two of your own cards. Does not refill the library or save you from an empty-library draw. Vulnerable to attacks; −7 can destroy your own non-Zombie creatures. | Best general recovery/engine candidate; test independently from Elixir. |
| [Primevals' Glorious Rebirth](https://scryfall.com/card/dmc/165/primevals-glorious-rebirth) — 5WB | Returns all your legendary permanent cards from the graveyard, including planeswalkers, legendary creatures, and a legendary land | Seven mana, and you must already control a legendary creature or planeswalker to cast this legendary sorcery. A legendary land/enchantment alone is not enough. Does not refill the library; misses many key nonlegendary creatures. | Consider for a legend-heavy rebuild or a slow table, not the first dedicated anti-mill slot. |

The local Forge scripts were checked first, then current Scryfall card data. All three are Commander legal, fit Jace's WUBR identity, and are not Game Changers in the fetched Scryfall data. Exact mana/text/legality snapshots are in `analysis/mill-defense/scryfall-{0,1,faces}.json`.

## Why Rebirth is narrower than it sounds

The current v0.6 list has 18 legendary permanents in its main deck, plus its commander. Those include Kher Keep, Way of the Healer and Oath of Gideon, so the count does not mean 18 large creatures. The card can recover Avacyn, Angel of Horror; Avacyn, Angel of Hope; Galactus; Memnarch; Tekuthal; and the planeswalkers, if they are actually in your graveyard. Jace normally lives in the command zone rather than the graveyard, and is not returned from there.

It **cannot** return Serra's Emissary, Archon of Cruelty, Massacre Wurm, Dreamtide Whale, Triplicate Titan, Darksteel Angel, Archfiend of Despair, Overlord of the Mistmoors or Flux Channeler: those creatures are not legendary in the local card database. Liliana can target any of these creature cards in your graveyard. Neither returns dead tokens, which cease to exist after leaving the battlefield.

## Timing matters against mill

Elixir is an activated ability, not an automatic graveyard-shuffle trigger. An untapped noncreature Elixir can activate on the turn it enters, if you can pay the two mana. You need priority before the empty-library draw happens. It does not interrupt a resolving spell between its mill and draw instructions; once a failed draw causes a loss, it is too late to activate it. Simply having zero library cards is not by itself the usual loss event.

The activation does not sacrifice Elixir as a cost. If the artifact is removed after activation, the ability can still shuffle the remaining graveyard when it resolves; what happens to Elixir itself depends on where it moved. Ordinary graveyard exile can remove the cards you intended to recycle. Exile-based library attacks are a different problem and these three choices do not retrieve those exiled cards. These timing distinctions follow the [current card/rulings record](https://scryfall.com/card/c21/243/elixir-of-immortality); raw official-ruling entries are saved in `analysis/mill-defense/elixir-rulings.json`.

## Forge support and what the AI may miss

All three scripts exist in `forge/app-custom/res/cardsfolder/cardsfolder.zip`; none of these three has an `AI:RemoveDeck` flag. No script or AI logic was changed.

| Card script | Supported behavior | Evaluation caveat |
|---|---|---|
| `e/elixir_of_immortality.txt` | Gain life, move Elixir and graveyard to library, then shuffle | No custom anti-mill timing in SmartAi. The AI may activate for life rather than protecting a nearly empty library. A low cast/activation rate is an AI audit signal, not proof the card is weak. |
| `l/liliana_deaths_majesty.txt` | Zombie token plus self-mill, targeted creature reanimation, non-Zombie wipe | Generic planeswalker decisions may differ from Patrick's priorities. Need to inspect +1/−3 usage, returned creatures and token use. |
| `p/primevals_glorious_rebirth.txt` | Return legendary permanents from your graveyard | Seven-mana and legendary-sorcery restrictions can leave it in hand. No evidence yet establishes good AI timing or target value. |

Copied script snapshots and `audit.json` live under `analysis/mill-defense/`. The Jace sim's power-2 exile-cost restriction still applies; Liliana's fresh 2/2 Zombie qualifies, while a grown Army may not. None of these findings justifies editing the shared engine while Claude's runs are in flight.

## Real mill opponent to investigate

**[Hope to deck you out! — Hope Estheim, by Critlander](https://archidekt.com/decks/13344339/hope_to_deck_you_out)** is the proposed source list. The current Archidekt API reports bracket 3 and exactly 100 cards including the commander after excluding Maybeboard entries. Its plan converts bursts of life gain into milling each opponent, with trigger/life-gain multipliers. This is a useful *burst mill* stress test, rather than a claim that it matches Patrick's real opponent.

The fetched main deck has exactly three Scryfall Game Changers: Rhystic Study, Smothering Tithe and The One Ring. All fetched main-deck cards are Commander legal and fit WU. No extra-turn or obvious mass-land-destruction text was found; Archidekt's corresponding flags also report none. Bruvac is in the main deck; Maddening Cacophony is only in Maybeboard, so it was excluded from the saved research list. The author describes a turn-6–7 aim. This is a **bracket-3-labeled candidate with structural checks, not an independently certified combo/timing audit**. The full combination and early-win review is still needed. [Official Commander bracket guidance](https://magic.wizards.com/en/formats/commander) permits up to three Game Changers in bracket 3 and treats brackets as pregame matchmaking guidance.

**Forge readiness:** every main-deck name resolves in the local database, including Hope's life-gain-to-mill trigger. However, eight main-deck cards carry `AI:RemoveDeck:All`: Martyr of Sands, Renounce, Thespian's Stage, Crystal Vein, Riot Control, Gemstone Caverns, Strionic Resonator and Springleaf Drum. Several other cards carry only `RemoveDeck:Random`, which should be distinguished from `All`. Flags alone do not establish actual behavior; some existing project scripts have similar quirks. This opponent needs a card-use pilot before its win rate can measure mill resilience credibly. In particular, a lifegain/trigger deck that fails to use its enablers is not a meaningful mill test. No flags were removed.

Snapshot: `analysis/mill-defense/archidekt-13344339.json`; research-only deck export: `analysis/mill-defense/hope-estheim-PROPOSAL-ONLY.dck`. It has deliberately **not** been copied into `forge/decks` or added to the gauntlet. `audit.py` reproduces the checks from saved data.

Rejected source: [Drawn & Quartered](https://archidekt.com/decks/17740992/drawn_quartered) was described as bracket 3 in an older discussion, but the fetched current API labels it bracket 4. Saved evidence: `archidekt-17740992.json`. Do not use the old description as current bracket confirmation.

## Proposed separate experiment — requires Patrick's decision

Leave `gauntlet/gauntlet.json`, all 20 current pods and their seeds unchanged. Keep mill results in a clearly separate test series; do not mix them into the historical gauntlet win rates.

1. After Claude's current runs, audit the Hope list for early winning combinations and pilot its AI use of mill/lifegain effects. If it cannot execute the deck plan, do not interpret its results as meaningful mill resistance; raise the issue in Lane C rather than quietly changing engine code.
2. Use fixed separate 4-player pods with Hope plus two familiar opponents, with seat/seed choices recorded. Include a mixed combat pod (e.g. Hope/Ghalta/Yennett) and a recursion pod (Hope/Meren/Giada). These are proposed seats, not newly installed pods.
3. Start with a 10-game diagnostic of unchanged v0.6 against that separate mill series. Check that Jace is actually milled, big creatures reach the graveyard, and losses sometimes involve library depletion. A mill-labeled deck that only wins combat is not sufficient validation.
4. Then compare **one change at a time**, each in a fresh version: Overwrite the Multiverse → Elixir; or → Liliana; optionally → Rebirth. This is a tentative test slot, not a recommendation to remove a card from Patrick's physical deck. Overwrite's zero casts in the old runs are an AI limitation and may bias simulation comparisons. Reuse the same mill-series seeds and settings `--smart --politics --keeptokens`.
5. Record library depletion, mill-caused eliminations, defense card draws/casts/activations, actual cards recovered, and fodder created/used. Ten games diagnose behavior; a larger matched comparison is needed before claiming a win-rate improvement. Also check the chosen variant against the unchanged original gauntlet so a narrow anti-mill slot does not hide a general matchup cost.

**Decision recorded on RESUME.md:** authorize the separate mill pilot after current runs, with Elixir as the first defense trial and Liliana as the second? Ownership and actual available copies should be confirmed before any physical swap or purchase.
