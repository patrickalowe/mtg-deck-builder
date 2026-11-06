# T'Challa vs. its toughest bracket-3 opponents (2026-10-26)

All games: Forge 2.0.15, 1v1 Commander, AI vs. AI. Opponents are the 8 decks T'Challa did worst against in the 500-game run: Ghalta, Krenko, Thranduil, Giada, Arcades, Captain Sisay, Meren, Massacre Girl.

## Why T'Challa loses (80 recorded games, `node analyze.js`)

- **Token swarms** (Krenko, Thranduil, Meren, Sisay): opponent token peak ~7.5 in losses vs. ~1 in wins. Krenko's goblin tokens dealt 304 damage across the losses; Krenko himself 49.
- **One huge threat** (Ghalta, cast round 4–8): 180 damage across the losses; exiled only twice in 10 games.
- **Fliers** (Giada's angels): nothing in the deck blocks or sweeps them.
- **Thranduil** wins with an infinite combo (damage totals in the hundreds of thousands).
- Early **Swiftfoot Boots** = strongest loss signal (−20 pts); early **T'Challa** = strongest win signal (+19 pts).

## Is it the play or the cards?

**Play style** (same deck, 4 Forge AI profiles, 160 games each): Reckless 39%, Experimental 39%, Default 36%, Cautious 33% — within noise. No play style rescues these matchups.

**Cards** (same Default play style, 80 games per opponent):

| Opponent | Original (14 swaps) | Tuned v2 | Change |
|---|---|---|---|
| Captain Sisay | 27/80 | 48/80 | **+21** |
| Arcades | 21/80 | 39/80 | **+18** |
| Ghalta | 17/80 | 26/80 | +9 |
| Krenko | 32/80 | 33/80 | +1 |
| Thranduil | 40/80 | 41/80 | +1 |
| Meren | 42/80 | 42/80 | 0 |
| Giada | 27/80 | 24/80 | −3 |
| Massacre Girl | 40/80 | 37/80 | −3 |
| **Total** | **246/640 (38%)** | **290/640 (45%)** | **+7 pts (z = 2.5)** |

Tuned v2 = original + these 6 swaps: Swiftfoot Boots → Wrath of God, Reconnaissance → Austere Command, Clever Concealment → Fateful Absence, Mirrormind Crown → Get Lost, Ingenious Smith → Council's Judgment, Greater Good → Oblivion Ring.

Tuned v1 had Settle the Wreckage and Kenrith's Transformation instead of Austere Command and Oblivion Ring; Forge's AI **never cast either** (0 of 17 draws), so v1 tested the AI, not the cards. Both are good in human hands.

## What Forge's AI does that a human shouldn't

- Never holds up Settle the Wreckage for the opponent's attack; never casts Kenrith's Transformation.
- Spends Fateful Absence / Get Lost on opposing commanders, which return from the command zone for 2 more.
- Casts Swiftfoot Boots before developing the board.
- Can't use Mirrormind Crown properly.

Forge win rates are a floor for a human pilot, not a ceiling.

## Still unsolved after v2

- **Giada 30%** — fliers. Candidates: Whirlwind (destroy all fliers; nearly one-sided here), a reach blocker like Arasta of the Endless Web.
- **Ghalta 33%** — Candidate: Conclave Tribunal (cheap Oblivion Ring). In human play: hold Settle the Wreckage for Ghalta's attack.
- Tuned v3 (v2 + Loyal Retainers → Whirlwind, Ancestral Communion → Conclave Tribunal): **166/400 (42%) vs. v2's 45% — no improvement** (Giada 24%, Ghalta 34%). In 12 recorded games Whirlwind was drawn once and not cast; Conclave Tribunal was cast 2 of 3 times without changing the Ghalta result.
- **Recommendation: v2** (6 cards, ~$8–10). Giada and Ghalta stay the hardest matchups; the best remaining answers (Settle the Wreckage held for the attack, removal saved for non-commander threats) depend on human play Forge can't test.

Deck files: `../forge/decks/tchalla-tuned2.dck`, `tchalla-tuned3.dck`. Re-run: `node tune.js 50 tchalla-tuned2:Default,tchalla-tuned3:Default <opponent ids>`.

## Current deck vs. the 14 swaps vs. the 6 upgrades (2×2, 80 games per opponent each, Default play style)

| Opponent | Current | + 6 upgrades | + 14 swaps | Both (v2) |
|---|---|---|---|---|
| Ghalta | 26% | 33% | 21% | 33% |
| Krenko | 35% | 44% | 40% | 41% |
| Thranduil | 38% | 48% | 50% | 51% |
| Giada | 23% | 24% | 34% | 30% |
| Arcades | 31% | 43% | 26% | 49% |
| Captain Sisay | 40% | 50% | 34% | 60% |
| Meren | 43% | 43% | 53% | 53% |
| Massacre Girl | 45% | 48% | 50% | 46% |
| **Total** | **35.0%** | **41.3%** | **38.4%** | **45.3%** |

- Upgrades alone: +6.3 pts (z 2.3). Swaps alone: +3.4 (z 1.3, suggestive). Both: +10.3 (z 3.8). Roughly additive; they help different matchups (swaps → Giada/Meren/Thranduil, upgrades → Arcades/Sisay/Krenko/Ghalta).
- Patrick already **owns** the 14 swap cards (bought 2026-10-26). Recommendation: play 12 of them, bench Clever Concealment and Reconnaissance, buy the 6 upgrades (~$8–10) → v2.

# Jace, Multiverse Architect (9 swaps) — same method

Forge 500 games vs. random bracket-3: **53.4%**. Toughest 8: Sidisi, Lathril, Ghalta, Meren, Giada (two decks: 11650077, 3370911), Yennett, Tom Bert & William.

**Why Jace loses (80 recorded games, 30–50):** slow (Jace cast round 6.6 in losses vs. 5.7 in wins; casting Jace by round 4 = +20 pts); thin board in losses (creature peak 5 vs. 10.6); Giada's angels (0/10 vs. deck 3370911). AI mistakes: Swords/Path spent on mana elves vs. Ghalta, Chandra's Ignition on a token.

**Forge AI blind spots for Jace:**
- Never casts the guild Signets (Rakdos, Azorius, Dimir, Izzet) — but swapping them for castable rocks didn't change the win rate (43% → 43%).
- Never casts Sunfall or Overwrite the Multiverse (0 of ~45 draws); never casts Clever Concealment, Lim-Dûl's Vault, Synthetic Destiny, Proteus Staff.
- **Never uses Jace's −3** (0 of 163 activations): Forge's AI won't exile its own permanents. Test copy `../forge/app-jace-minus3/` rewrites the −3 so the exile is a cost limited to a non-land creature with power ≤ 2 (Patrick's rule: feed it tokens/small creatures, dig for bombs). With it, the AI uses −3 about as often as +1, e.g. Spirit token → Archon of Cruelty, Zombie token → Memnarch, Servo → Silver Surfer.

**Play style** (20 games/opponent): Default 43%, Experimental 42%, Cautious 39%, Reckless 34%.

**Cards** (Default, 40 games/opponent):

| Opponent | Fair mana | Tuned |
|---|---|---|
| Sidisi | 19/40 | 18/40 |
| Lathril | 16/40 | 27/40 |
| Ghalta | 14/40 | 13/40 |
| Meren | 23/40 | 28/40 |
| Giada (11650077) | 14/40 | 25/40 |
| Yennett | 17/40 | 23/40 |
| Giada (3370911) | 15/40 | 13/40 |
| Tom, Bert & William | 20/40 | 25/40 |
| **Total** | **43%** | **54% (+11, z ≈ 2.7)** |

Fair = 4 guild Signets → Talisman of Hierarchy, Talisman of Conviction, Mind Stone, Fellwar Stone (Forge-only fairness fix; you'd cast your Signets).
Tuned = fair + Clever Concealment → Wrath of God, Lim-Dûl's Vault → Austere Command, Synthetic Destiny → Toxic Deluge, Proteus Staff → Fateful Absence, Aetherize → Infernal Grasp, Cursed Mirror → Anguished Unmaking.
Still unsolved for Jace: Ghalta and Giada (3370911) — the same two that beat T'Challa.

**Jace's −3 (Patrick's rule: exile a token or creature with power ≤ 2, dig for a threat)** — tuned deck, Forge test copy `app-jace-minus3`, 40 games/opponent:

| Opponent | Tuned | Tuned + −3 rule |
|---|---|---|
| Ghalta | 13/40 | 24/40 |
| Giada (3370911) | 13/40 | 25/40 |
| Sidisi | 18/40 | 27/40 |
| Lathril | 27/40 | 26/40 |
| Meren | 28/40 | 26/40 |
| Giada (11650077) | 25/40 | 26/40 |
| Yennett | 23/40 | 23/40 |
| Tom, Bert & William | 25/40 | 24/40 |
| **Total** | **54%** | **63% (+9, z ≈ 2.3)** |

The −3 fixes Ghalta and Giada (3370911) — the matchups no card change fixed for either deck — by turning 1/1 tokens into Serra's Emissary, Archon of Cruelty, Galactus etc. Caveat: in the test copy the exile is a cost (no opponent response window), so the real card is slightly weaker than tested.

**Jace summary:** current 43% → +6 cards 54% → +6 cards and −3 rule 63% vs. its 8 toughest bracket-3 opponents.

**Smart AI (`../forge/replaysim/src/forge/view/SmartAi.java`)** teaches Forge's AI Aetherize, Clever Concealment and Lim-Dûl's Vault (and, for T'Challa, Swiftfoot Boots, Mirrormind Crown, Reconnaissance, Greater Good), for Patrick's side only. Limit: Forge's AI never holds mana open on its own turn, so reactive instants still under-perform vs. a human.

**Keep vs. cut (smart AI + −3 rule, 40 games/opponent):** cutting Aetherize/Clever Concealment/Lim-Dûl's Vault = 188/320 (59%); keeping them and cutting Triplicate Titan/Martial Coup/Sunfall instead = 185/320 (58%). Tie → **keep Patrick's 3 cards.**

**Final Jace recommendation:** Synthetic Destiny → Toxic Deluge, Proteus Staff → Fateful Absence, Cursed Mirror → Anguished Unmaking, Triplicate Titan → Wrath of God, Martial Coup → Austere Command, Sunfall → Infernal Grasp. Keep all 9 earlier swaps and the guild Signets (the Signet swap was a Forge-only fairness fix and changed nothing). Use the −3 on 1/1 tokens / small creatures.

# T'Challa — keep the 6 cards? (smart AI, 40 games/opponent)

Smart AI for T'Challa's side: Swiftfoot Boots (only once there's a creature worth protecting, main phase 2), Mirrormind Crown (equip best non-legendary creature), Reconnaissance (cast with 2+ creatures; save blocked attackers that would die, untap attackers after damage), Greater Good (sacrifice threatened creatures), Clever Concealment (respond to threats). Greater Good and Reconnaissance had Forge's "AI:RemoveDeck:All" flag removed in the test copy; Forge's own code had Reconnaissance's effect "disabled for the AI".

| Opponent | v2 (cuts the 6) | Keep 6 |
|---|---|---|
| Ghalta | 12/40 | 10/40 |
| Krenko | 15/40 | 15/40 |
| Thranduil | 15/40 | 16/40 |
| Giada | 13/40 | 15/40 |
| Arcades | 13/40 | 12/40 |
| Captain Sisay | 21/40 | 17/40 |
| Meren | 17/40 | 13/40 |
| Massacre Girl | 20/40 | 20/40 |
| **Total** | **126/320 (39%)** | **118/320 (37%)** — tie |

Control (v2, normal Forge, no smart AI): 136/320 (43%). Smart setup is clean; pooled v2 estimate across 1,280 games ≈ 43%.

**Final T'Challa recommendation:** play 12 of the 14 bought cards *plus* Clever Concealment and Reconnaissance if preferred (keep-6 ties v2). Keep-6 version = current deck + all 14 swaps + Wrath of God, Austere Command, Fateful Absence, Get Lost, Council's Judgment, Oblivion Ring, cutting Vanquish the Horde, Overwhelming Stampede, Kimoyo Beads, Vibranium Mining Mech, Loyal Retainers, Ancestral Communion (keeps Swiftfoot Boots, Reconnaissance, Clever Concealment, Mirrormind Crown, Ingenious Smith, Greater Good). Deck file: `../forge/decks/tchalla-keep6.dck`.
