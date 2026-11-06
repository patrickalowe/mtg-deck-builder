# Jace current-deck power report (C7)

Task: `CLAUDE-JACE-COMBO-POWER-TEST.md`. Deck: Patrick's exact physical list, `gauntlet/versions/jace/v0.1-real/deck.dck`,
sha256 `df7a4a3fefd8106f67f708ca5464163334c130a81d23c8fdd0d046795f1c0e50` (matches the handoff; no swaps, no spares).

## Plain-language summary

- **Your deck is a bit stronger than the old 30% sim number, but not dramatically.** With Jace's −3 working like the
  real card, it won **35 of 100** four-player games; with a smarter, combo-aware pilot, **36 of 100** (25% is a fair
  share). On the same games, the real-rules pilots won 34–36 vs 28–29 for the old rules. That's a consistent lean,
  not a proven gain (best p = 0.13).
- **The Aminatou + Bolas + Ajani combo is real but rare.** The pilot can execute it legally (proven in a test
  position: 7 blinks, 8 hasty Cadets, one opponent from 10 to −11). In 200 natural games it assembled **once** (your
  turn 10, put together by Jace's own −3 revealing Bolas and then Ajani), and the board was already big enough that the
  loop wasn't needed. Don't plan around it; it's a bonus.
- **Your deck's real engine is Jace + tokens, and the recurring problem is having fodder when Jace is ready.** Jace
  usually lands on your turn 6. On turn 6 only ~31% of games had any creature token. When the pilot passed on −3, the
  top reason was **no tokens or targets (67–68 times per 100 games)**, then "only valuable pieces available" (29–31).
  So your token-free game was not just bad luck; it's a pattern in this list.
- **How you pilot matters a little; avoiding self-damage matters a lot.** The new pilot used −3 more (142 vs 120 per
  100 games), reset Jace with Aminatou/Bolas 12 times, fetched combo pieces with Loyal Tutor 24 times, and declined 25
  −3s that would have killed Jace with no reset. But Forge's standard AI also fired **Ajani's −3 ("4 damage to each
  creature except your tokens") 26–31 times per 100 games**, often wiping your own Avacyn/Serra's Emissary/Memnarch.
  In your hands that's an easy mistake to avoid, so the deck is likely somewhat better than any number here.

## Results

Same deck, same 12 opponents, 20 pods, fixed seeds, `--smart --politics --keeptokens`. Suspect games (Forge's 600 s
limit or conflicting winner lines) count as draws (C5 scoring).

| Arm | Setting | All started games (suspects = draws) | Raw "Game Result" wins | Suspect | 95% CI |
|---|---|---|---|---|---|
| A | Legacy Jace script (power ≤ 2 cost-exile), stock pilot — C1 | **30 / 100** | 30 | 3 | 22–40% |
| B | Real-card Jace rules (`--jacerealrules`), base fodder policy | **35 / 100** | 38 | 7 | 26–45% |
| C | Real rules + combo-aware pilot (`--jacecombo`) | **36 / 100** | 44 | 9 | 27–46% |

Paired, non-suspect games only (exact McNemar):

| Comparison | Paired games | Wins | Discordant | p |
|---|---|---|---|---|
| B vs A (real rules) | 91 | 34 vs 29 | B-only 13, A-only 8 | 0.38 |
| C vs B (combo pilot) | 89 | 36 vs 33 | C-only 9, B-only 6 | 0.61 |
| C vs A (both) | 90 | 36 vs 28 | C-only 15, A-only 7 | 0.13 |

Notes: games within a pod share seeds, so they aren't fully independent. A small non-significant difference does not
prove the arms are equal either. The rise in suspect games for B/C (7–9 vs 3) is real: several ran 13–47 minutes (Forge's
time limit didn't stop them), and C's raw count would have credited 8 of them as wins. Treat raw numbers as unreliable.

Stage 2 calibration (10 games each, pods 1–10 g1): A 3, B 2, C 3; **A reproduced the historical C1 games exactly in all
10 pods** (same runtime, switches off), 0 non-timeout exceptions, 0 telemetry errors, loop safety limit never hit.

## Telemetry: when things happen (100 games per arm)

| | B (real rules) | C (combo pilot) |
|---|---|---|
| Jace cast at all | 87 | 90 |
| Personal turn Jace is first cast (quartiles) | 5 / 6 / 7 | 5 / 6 / 7 |
| Games with any resolved −3 | 63 | 69 |
| First −3 turn (quartiles) | 5 / 7 / 9 | 5 / 7 / 9 |
| −3 resolved, total | 120 | 142 |
| Games with zero −3 | 37 | 31 |
| −3 targets: creature token / Jace PW token / small creature / planeswalker | 104 / 8 / 8 / 0 | 120 / 10 / 10 / 2 |
| −3 hits: creature / planeswalker | 66 / 40 | 84 / 46 |
| −3 declined: no tokens or targets / only valuable pieces / would kill Jace | 67 / 29 / — | 68 / 31 / 25 |
| Combo assembled (Aminatou, Bolas, Ajani all on battlefield) | 0 | 1 (turn 10) |
| Cadet loop steps executed | 0 | 0 (board already over the goal) |
| Pilot actions: Jace reset / Loyal Tutor fetched a loop piece / top-deck setups / fodder seeding | — | 12 / 24 / 3 / 3 |

Board snapshots at the start of your main phase (both arms nearly identical):

| Your turn | Lands (avg) | Jace on battlefield | Any creature token |
|---|---|---|---|
| 4 | 3.0 | 0% | 14–15% |
| 5 | 3.9 | 10–12% | 26–27% |
| 6 | 4.7–4.8 | 18% | 31% |

Who beats the deck (clean wins): A — Giada 11, Lathril 10, Yennett 9, Chatterfang 8; B — Yennett 10, Giada 9, Sidisi 7,
Lathril 7; C — Yennett 10, Giada 9, Meren 6, Lathril 6. Real-rules piloting shaved Lathril (elf swarm) a little;
Yennett (control) and Giada (angels) remain the top threats. All recorded losses were to life total reaching 0.

## Answers to the six questions

1. **Can the AI legally execute the Aminatou/Bolas/Ajani line?** Yes — fixture f1 (real Forge rules, real objects,
   Ajani's trigger per activation, Ajani +1 haste, real combat). Missing Ajani / low loyalty correctly produce no loop
   (f2a, f2b). Not fixture-tested: opponents removing a piece in response (their AI can't be forced to respond).
2. **Does fodder creation and top-deck planning reduce "Jace ready but can't use −3" turns?** Slightly: games with zero
   −3 fell from 37 to 31 and total −3 rose from 120 to 142. "No tokens or targets" declines didn't fall (67 → 68), because
   seeding fodder needs Ajani or Way of the Healer on the battlefield, which is rare.
3. **Is the token-free game variance or a supply problem?** A recurring supply problem: only ~31% of games have any
   creature token on turn 6, and "no fodder" is the #1 reason −3 goes unused in both arms. Mana is also slow (3 lands
   on turn 4 on average, and Jace costs 5 in four colors), so it's mainly **drawing/affording fodder at the right time**,
   not losing it or the pilot not using it.
4. **How often do the engines assemble?** Cadet loop: 1 in 200 games (turn 10). Jace resets via Aminatou/Bolas: 12 per
   100 games. Loyal Tutor finding Aminatou/Bolas/Ajani: 24 per 100. The engine that matters is Jace + any token.
5. **What does a strategy-aware pilot change vs the same rules without it?** +1 win in 100 (36 vs 35); paired 36 vs 33
   (p = 0.61). Most of the measurable gain over the old sim came from real Jace rules, not from combo play.
6. **What remains unmeasured?** See limitations. A sim win rate is not a human prediction, and none of this is a bracket
   rating.

## Supported / partial / unsupported pilot behaviors

| Behavior (combo guide §) | Status |
|---|---|
| Real-card Jace −3 targeting (any creature/PW, exile on resolution, response window kept) | **Supported** (Forge's original script + targeting policy; f3, f4, f4b) |
| Aminatou ⇄ Bolas blink loop + Ajani Cadets + haste finish (§1) | **Supported** (f1, f2a, f2b); bounded, logged |
| Ajani seeds fodder before −3; Cadet created by the activation can't be the target (§2) | **Supported** (f3) |
| Jace planeswalker tokens as fodder (§3) | **Supported** (natural games: 8–10 per 100) |
| Saheeli Servo before Jace resolves (§4) | Partial — natural Forge behavior; not specifically piloted |
| Aminatou +1 / Brainstorm / Brainsurge put a payoff on top; Loyal Tutor picks the missing loop piece (§5) | **Supported** (f6; 3 setups, 24 tutor picks per 100) |
| Aminatou resets Jace for a 2nd −3 (§6) | **Supported** (f7; 12 per 100) |
| Aminatou blinks entry-effect creatures, incl. impending Overlord (§7) | Implemented; 0 natural uses (never the best option when available) |
| Cursed Mirror copies, Avacyn + destroy wipes, Staff of Compleation + Titan + Avacyn of Horror, Flux Channeler/Tekuthal, Synthetic Destiny, Saheeli/Archfiend, Nissa/Passage (§8–16) | **Unsupported** — left to Forge's stock AI |
| Preventing self-damaging Ajani −3 (and Bolas borrowing it) | **Unsupported** — 26–31 such activations per 100 games |
| Holding removal for the right threat (e.g. Ghalta) | Unsupported |
| Casting Jace promptly (Forge AI left him uncast in 10–13% of games) | Not in this test (`--commanderfirst` exists) |

## Recommendations (practice first, swaps separate)

1. **Practice the fodder-first habit.** Before casting Jace, have a token or a spent planeswalker ready, or have Ajani /
   Saheeli / Way of the Healer out. Jace planeswalker tokens (Way of the Healer, Plan for All Outcomes, Fatehold Charm)
   count as fodder.
2. **Use Aminatou/Bolas to reset Jace** for a second −3 (the most common engine play: 12 per 100 games).
3. **Use Loyal Tutor on Aminatou/Bolas/Ajani** when two are already out; Jace's own −3 can reveal the rest (that's how
   the one natural assembly happened).
4. **Never fire Ajani's −3 (directly or via Bolas) with your own nontoken creatures out** unless it's clearly worth it.
5. **Card changes are a separate question** and must respect the Keep list in `JACE-STRATEGY.md`. The best-tested free
   change remains Overwrite the Multiverse → Darksteel Angel; the fodder shortage above argues for one cheap,
   repeatable token source in a mana-rock slot (Dreadhorde Invasion is owned). Not part of this power test.

## Replays (in the viewer, `replay/index.html`, label "real Jace rules + combo pilot")

- **Engine working — `jace-v0.1-real-smart-politics-jacecombo-pod04-g4`** (natural game, WIN). Re-recorded from game 1
  of the pod; every one of Jace's actions is identical to the C test game. Jace −3 exiles a spent Teferi to hit
  Memnarch; Loyal Tutor fetches Aminatou; Jace −3 hits Bolas; Aminatou resets Jace; −3 again hits Tekuthal; later
  Aminatou puts Elspeth on top and −3 delivers it.
- **Informative failure — `jace-v0.1-real-smart-politics-jacecombo-pod12-g1`** (natural game, LOSS; all 26 of Jace's
  actions identical to the test game). **Jace is never cast** despite 9 lands and 3 rocks covering all four colors —
  Forge's AI keeps choosing other spells (Tekuthal, Silver Surfer, Lingering Souls, Ajani) — and then Ajani's −3 also
  kills your own Silver Surfer. Jace went uncast in 10–13 of 100 games per arm; the existing `--commanderfirst` rule
  (recast/cast the commander as soon as affordable) was not part of this test and is a natural next pilot fix.
- The pod 8 game where the combo assembled (described above) could not be re-recorded identically: earlier games in that
  pod hit Forge's time limit, and Forge's AI decisions have time-based cutoffs, so later games diverge. Exact replay is
  only reliable for games whose pod has no stalls before them.
- Fixture logs (not natural games): `gauntlet/fixtures/out/f1-loop-legal-g1.log` shows the full Cadet loop.

## Limitations

- Pilots are Forge AI with added rules; opponents use stock Forge AI. Human play (holding removal, avoiding self-wipes,
  bluffing, politics) is not modeled. No claim that a human would win more or less.
- Several guide lines are unsupported (table above). Suspect/timeout games rose under real rules; results are reported
  both ways. Fixed-seed pods limit independence.
- Not a bracket or numeric power rating. Bracket fit should be judged from consistency/speed and official guidance.

## Reproduce

- Fixtures: `sh gauntlet/fixtures/run-fixtures.sh` → `gauntlet/fixtures/RESULTS.md` (10/10 pass).
- Arms: `node gauntlet/gauntlet.js jace v0.1-real 100 --smart --politics --keeptokens --jacerealrules [--jacecombo] --par=2`
  (A = historical C1 `2026-10-300032-smart-politics-keeptokens-100`; calibration A used `--runtime=combo`).
- Runs: B `versions/jace/v0.1-real/runs/2026-10-30042916-rtcombo-jacereal-smart-politics-keeptokens-100`,
  C `…/2026-10-30042918-rtcombo-jacereal-jacecombo-smart-politics-keeptokens-100`; per-game telemetry `logs/*.jace.jsonl`.
- Frozen build (in each summary.json): classes-combo `82b6e23a468f0b53`, app-jace-real cards `7ccc339dd1f04e00`,
  deck `df7a4a3fefd8106f`. Code: `forge/replaysim/src/forge/view/JaceCombo.java`, `PodSim.java`; changes logged in
  `forge/custom/CHANGELOG.md`.
