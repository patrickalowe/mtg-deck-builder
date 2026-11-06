# Latest review — 2026-10-30-0930

[Twelve new C9 game reviews](REVIEW-2026-10-30-0930.md): two natural Aminatou/Bolas loop executions in candidate wins, ordinary baseline engine wins, early-Jace fuel gaps and token-entry damage losses. Frozen 21 clean matched pairs: five wins each; no candidate advantage established. 105 game keys now reviewed. One 600-second conflicting result excluded.

---

# Latest review — 2026-10-29-2108

[Six new game reviews](REVIEW-2026-10-29-2108.md): observed Dreadhorde fodder, Darksteel survival with a repetitive-log warning, Memnarch self-decking, varied token-source wins and current-deck control cases. 93 total game keys now have Codex notes. Owned-engine’s 40/100 is promising but not established as better; 94 clean matched pairs are 38 versus baseline 29. C7 fixture success remains separate from natural-draw combo performance.

---

# Codex review — latest update 2026-10-29-1824

Reviewed **82 new games** in this batch; 87 game keys now have specific Codex reviews. The initial five-game snapshot is preserved below. Historical games outside those batches remain automated summaries only.

[Read the full new per-game review](REVIEW-2026-10-29-1824.md). The current frozen matched comparison is **25 baseline wins versus 26 v0.6 wins in 73 non-suspect matched games**. No clear improvement established; runs are unfinished.

New concrete findings: Darksteel Angel prevented a loss at negative life; destroying Junji let Meren reanimate Patrick’s Memnarch; Angel of Destiny and commander damage caused losses the parser did not label. No confirmed AI misplay. Watcher still running; deeper reviews remain dated snapshots.

---

# Codex review — initial live snapshot

Reviewed 2026-10-29 at about 17:54 Pacific. This deeper review is a dated snapshot; `SUMMARY.md` and `games.md` continue updating automatically. Historical indexing does not mean Codex deeply reviewed every archived game.

## Current comparison

At the first watcher snapshot, the token-preserving 100-game runs had 12/34 logged wins for the physical baseline and 19/49 for v0.6, with no suspect outcomes among those indexed games. They have completed different sets of pods, so do not compare these interim percentages or call a winner. Check the rolling summary for newer counts.

## v0.6 / pod11 / game 1 — removal cleared a token finish

Source: `versions/jace/v0.6-precon-engine/runs/2026-10-300032-smart-politics-keeptokens-100/logs/pod11-g1.log` (relative to gauntlet).

Jace won without casting the commander. The final sequence is concrete: Anguished Unmaking exiled Yennett, Fateful Absence removed Ancient Cellarspawn, then three Soldier tokens attacked for three damage against Yennett's remaining two life (lines 1489–1514). This supports the usefulness of removal plus a surviving board in this game. It does not prove either removal card alone raised the overall win rate. Attacking with the small tokens at lethal is consistent with the KEEP_TOKENS exception.

## v0.6 / pod10 / game 3 — blockers could not stop unblockable Sauron

Jace was never cast and no -3 resolved. Sauron's player cast Artful Dodge on Sauron, then attacked Jace with Sauron and an Orc Army. Two Spirit tokens blocked the Army, but unblockable Sauron dealt seven against Jace's remaining three life (around lines 933–952). Meren eventually won the pod; **the eventual winner was not the opponent who eliminated Jace**. This is a reason to distinguish elimination evidence from the winner field. The token blockers did their job against the Army; this is not proof of a blocking mistake.

## v0.6 / pod10 / game 2 — removal and payoffs did not guarantee survival

Meren won. Jace cast Infernal Grasp, Swords to Plowshares, Austere Command, Chandra's Ignition, Avacyn, Angel of Hope and Archon of Cruelty, among others, but no -3 resolved. Late recorded incoming damage included Gray Merchant of Asphodel, Stinkweed Imp and Satyr Wayfinder; the full pod continued after Jace's elimination. The opponent's later Protean Hulk/undying/recursion sequence demonstrates a developed engine, but should not be retroactively called the direct cause of Jace's earlier death. A short “Meren won, therefore graveyard recursion killed Jace” summary would overstate the evidence.

## v0.6 / pod10 / game 1 — fodder engine operated through recasts

Jace won after three commander casts and four resolved -3 abilities. Cost-adjacent exile evidence identifies two Spirit tokens and two Kobolds of Kher Keep. Those are observable examples of fodder enabling the commander across recasts. The log does not directly confirm each -3 hit, so none is invented. Darksteel Angel and Galactus participated in later attacks; the final large attack involved Galactus, Serra's Emissary, Archfiend of Despair, Darksteel Angel and tokens. Toxic Deluge, Aetherize and Overwrite remained in the final recorded hand; winning despite unused cards is not proof those cards were bad or unnecessary in other games.

## Baseline / pod08 / game 1 — repeated -3 did not solve the flying board

Baseline Jace lost after five resolved -3 abilities. Logged damage to Jace included Herald of Eternal Dawn (18 total), Akroma, Angel of Wrath (12) and Breathkeeper Seraph (8). This is a useful counterexample to “more -3 activations guarantees a win.” The reveal hits are not directly logged, so the evidence does not establish whether the five hits were weak or whether they were answered.

## Follow-up for Lane C

- Keep the timeout-result issue in view; the watcher holds suspects out of clean counts without altering official results.
- The watcher found multiline combat records with only the first line prefixed `Combat:`. The parser now handles those continuation lines; otherwise token blocks are undercounted. Existing engine/results files were untouched.
- No flagged uncast card has been confirmed as an AI misplay in this initial review. Castability and board-state evidence are needed before changing AI code or cutting cards.
- Continue the same fixed lists/flags until the comprehensive runs finish; these observations are not grounds to change an in-flight deck.
