# Jace, Multiverse Architect: game plan

Patrick's strategy for his **current deck** (`gauntlet/versions/jace/v0.1-real`). It combines the combo lines in
`JACE-COMBO-GUIDE.md` (rules-checked against Oracle text 2026-10-29) with what ~900 simulated 4-player games showed.
Agents: treat the "Keep" list below as a constraint when proposing swaps.

## The big picture

1. **Your deck is already above average.** Played your way (tokens home), it wins ~30% of 4-player pods (25% is a fair
   share). No 17-card swap package beat it over 100 games (v0.6 31%, v0.7 36%, neither a significant gain).
2. **The simulator can't play this deck's best lines.** Forge's AI never ran the Aminatou/Bolas loop, never cast
   Sunfall or Overwrite the Multiverse (0 casts each), cast Synthetic Destiny once in 34 draws, and fires removal at the
   first target it sees. So in your hands the deck is stronger than its sim number, and cards that look "dead" in the
   sim are often combo pieces.
3. **Win plan:** build a planeswalker engine, use cheap fodder for Jace's −3, control what the −3 reveals, and
   protect the board. Removal is for the threats that actually beat you, not the first thing you see.

## Keep: the deck's engine (don't cut these)

| Role | Cards | Why (guide section) |
|---|---|---|
| Planeswalker engine | Aminatou, Nicol Bolas, Ajani Unrelenting, Saheeli, Way of the Healer | Aminatou + Bolas = repeatable blink; + Ajani = any number of Cadets, then haste (§1). Ajani/Saheeli/Way make fodder (§2–4). |
| Find the pieces | **Loyal Tutor**, Brainstorm, Brainsurge | Loyal Tutor fetches Aminatou, Bolas or Ajani to the top, then Jace's −3 or a draw gets it (§5). |
| Value combos | Cursed Mirror + Archon/Serra's Emissary, Staff of Compleation + Avacyn (Horror) + Triplicate Titan, Archfiend + Saheeli, Flux Channeler + Tekuthal | §7, §8, §10, §11, §13 |
| Protected wipes | Avacyn, Angel of Hope + Martial Coup / White Sun's Twilight / Elspeth −3 | Destroy wipes that leave your board standing (§9) |
| Board conversion | Synthetic Destiny | Turn 5 tokens into 5 creatures, or dodge a wipe (§12). The AI never casts it, but you can. |
| Patrick's picks | Dreamtide Whale, Massacre Wurm (if bought), Triplicate Titan | |

Earlier sim-based proposals cut Cursed Mirror, Staff of Compleation, Staff of the Storyteller, Synthetic Destiny, Martial Coup
and White Sun's Twilight. **The guide shows those are synergy pieces; that's part of why those packages didn't beat your deck.**

## Fodder for Jace's −3 (you already have plenty)

- Ajani: every loyalty activation (any walker) makes a Cadet. If you have no fodder, Ajani +1 first, then Jace −3.
- Saheeli: every noncreature spell makes a Servo. Casting Jace himself triggers her, so the Servo is ready for his first −3.
- Way of the Healer / Plan for All Outcomes / Fatehold Charm: a Jace **planeswalker token** is legal fodder too, and
  Way gives every walker a −2 that makes a Cadet.
- Lingering Souls, Secure the Wastes, Grand Crescendo, Elspeth: tokens that also block.
- Owned spares if you want more: Dreadhorde Invasion (one growing Army; can block), Skrelv's Hive (1/1 every upkeep;
  can't block).

Real-life rule (the sim is stricter): Jace's −3 can exile **any** creature or planeswalker you control, e.g. a spent
Elspeth, a Jace token, or Triplicate Titan's 3/3 Golems.

## Sequences to practice

1. **Fodder → stack the top → Jace −3.** Ajani or Saheeli makes the fodder; Aminatou +1, Brainstorm/Brainsurge or Loyal
   Tutor puts the payoff on top; then −3. You choose what enters for free.
2. **Aminatou resets Jace for a second −3** (§6): Jace −3 (stays at 1), Aminatou −1 blinks Jace (back to 4), −3 again.
   Needs two fodder. Use Brainstorm for the top-deck setup so Aminatou is free to blink.
3. **The Cadet loop** (§1): with Aminatou, Bolas and Ajani all out on your main phase, loop the blinks for as many Cadets
   as you want, then haste. You can also spend the last fresh activation to reset Jace for another −3.
   Bracket note: it's a 3-card late-game line, fine for bracket 3, but tell your pod it's in the deck.
4. **Overlord of the Mistmoors for 4 mana** (§7): pay the impending cost, get 2 Insects, then Aminatou blinks it back
   as a full creature with 2 more Insects.

## Removal: hold it for what actually beats you

The same opponents beat every version in testing: **Ghalta / big tramplers, Yennett (control), wide token swarms
(Lathril, Krenko, Chatterfang), and unblockable threats (Sauron + Artful Dodge).** The AI used its exile removal 47
times and never on Ghalta. In real games:

- **Save Swords to Plowshares / Path to Exile / Despark for the big trampler** rather than the first creature you see.
- Against swarms: your blockers plus a wipe. Cast **destroy** wipes with Avacyn, Angel of Hope out; cast wipes
  **before** making new tokens.
- Don't run exile wipes (Sunfall, Overwrite the Multiverse) while relying on Avacyn, Angel of Hope: exile ignores
  indestructible.

## Card changes worth considering (small, cheap, tested in pieces)

- **Overwrite the Multiverse → Darksteel Angel (owned, free).** Overwrite was never cast in testing and clashes with
  Avacyn, Angel of Hope; Darksteel Angel won 5 of 7 games where it was cast and is a great free hit off Jace's −3.
  Being tested now in `v0.8-codex-owned-engine` (100 games).
- **One weak mana rock → Dreadhorde Invasion (owned, free)** if you want more fodder that can block. You run 39 lands
  plus 12 rocks, so one rock is the cheapest slot.
- **Mill defense (proposal):** Elixir of Immortality, then Liliana, Death's Majesty (see `JACE-MILL-DEFENSE.md`).
- Don't buy the full v0.6 list (~$52); nothing in it proved itself over 100 games.

## What the simulator can and can't tell you

- **It can:** catch broken cards and color problems, and compare fair "cast things and attack" play over 100+ games.
- **It can't:** run combo lines, stack the library for the −3, hold removal for the right target, or keep mana up for
  instants. Judge combo pieces and reactive cards by real games and the guide, not by sim win rates.
