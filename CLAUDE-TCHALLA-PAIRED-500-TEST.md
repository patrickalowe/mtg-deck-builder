# T’Challa five-batch paired comparison — Patrick request, November 4, 2026

## Status: modeled lists ready; unattended launch preflight cannot pass in Codex’s current environment

Patrick confirmed pre-swap versus installed11 as the comparison and authorized **assuming Divine Visitation is present**. We use the original Panther Idol/Mind’s Eye cut for Forsaken Monument as an explicit assumption; actual physical cut remains unknown. No repeated inventory question is needed for this modeled experiment. It does not certify the physical inventory.

Five rounds ×100 games PER DECK =500perdeck /1,000total. Locked arms:

- Before: `v1.7-c17-before` (historical pre-swap modeled100).
- Installed: `v1.8-c17-installed` (eleven additions; Smithy removes Selesnya Signet; Forsaken removes assumed Panther Idol/Mind’s Eye).
- Divine Visitation is retained in BOTH; both have37lands, Arcane Signet and Mining Mech. No Reconnaissance/Kutzil/Ghostly Prison added.

Deck files, hash validation, flags, group files and100individual-game trial schedules per group are locked in `gauntlet/versions/wakanda/c17-paired-five-rounds/manifest.json`. All cards exist in the local Forge DB; counts/land multisets/cached colors checked. A full live bracket/combo audit has not been performed.

**Supervisor:** `python3 gauntlet/tchalla-paired-series.py --check` checks authenticated CLIs, immutable files and the shared process budget without starting games. Omit `--check` to run Claude round1 → Codex review → round2 and so on. Current preflight reports Claude not authenticated and OS-denied process inventory; it started0games. Codex CLI login is available. Use Claude’s working authenticated terminal/environment to perform the preflight and launch, without bypass flags or changing the modeled decks.

The Python supervisor validates each scheduled trial’s completed log or genuine600second timeout evidence, exact decks and group schedules, and matching build fingerprints. It validates the structured Codex reviewed/continue checkpoint before next-round invocation. The automatic model cycle is implemented but cannot be tested live or launched until preflight succeeds. No progress should be claimed from shared notes alone.

## Five rounds and comparison controls

Use `gauntlet/gauntlet-b1.json` through `gauntlet-b5.json` respectively, providing five distinct opponent groups as in Patrick’s recent preference. In each round BOTH arms use the same group, seed sequence, starting seat and flags. Do not pool the two decks or compare unmatched progress.

Baseline runtime proposal: `--smart --politics`, matching prior T’Challa custom pilot support. Do NOT apply Jace-only flags, `--keeptokens`, pilot-v3/v4 or extra tactics flags automatically. Prior T’Challa safeattack/artifactsfirst test had many stalls. Freeze and hash code/card/runtime before round1. Any necessary behavior change creates a new cohort for BOTH arms; no mid-series silent tuning.

**Trial scheduling:** each `trials-bN.json` predeclares100single-game PodSim trials (20pods ×5seeds) for BOTH arms. Use a series-specific wrapper owned by Claude, with a real600second wall timeout on each owned subprocess. Trial seed = basepod.seed + (case−1)*10000000; these are different from the older sequential5-game pod seeds and are paired only within C17. Do not use the ordinary5-games-per-pod gauntlet command for this series. Copy the trial file byte-for-byte to each run’s `trials.json`; use tags from the trial IDs. Preserve stdout and explicit timeout markers. No changes to frozen engine/card files.

Check TOTAL machine load across Claude and Codex first: <=4 simultaneous Forge games. Use <=2 per arm if both run together. Never kill processes belonging to another agent. If process inventory cannot be read, do not assume zero load.

## Timeout / quality prerequisite

The Jace series had55suspects/500, including batch5games lasting hours after the nominal600second cutoff. Verify a genuine wall-clock cutoff for EACH newly owned game process before this long series. Claude may implement the necessary isolated/off-by-default runner behavior and document it, without changing another in-flight runtime or process. Do not count a forced or internally stalled result as a legitimate win. Do not remove Sisay/Círdan simply to improve results; report stall concentration and sensitivity slices. Preserve logs and mark invalid/aborted runs consistently.

## Checkpoint after EACH paired round

Finish and close both100-game arms, write the manifest and `gauntlet/RUNS.md`, then **STOP before launching the next round**. Codex must produce that round’s review and a `reviewed` checkpoint before continuation. This is a data-quality/review gate, not a new permission question for Patrick.

A shared markdown note is not an automatic scheduler. For unattended progression, configure and verify a real runner capable of invoking Claude for the game work and Codex for the read-only review, then consuming the review artifact. Both CLIs are installed locally. The supervisor is implemented; preflight currently fails due to missing Claude authentication/process inventory, so no round or live review has run. If no working runner exists, clearly report the checkpoint and use the next Codex/Claude resume to progress; do not claim continuous model review while idle.

Review output per round:

- Both runIDs, deck hashes, runtime/flags, opponent group/seeds, valid completed counts.
- Corrected wins/all starts, raw wins, suspect/draw counts and clean-only sensitivity; paired shared non-suspect outcomes with nominal95%intervals and McNemar comparison. Pod dependence and stall-related seed drift limit inference.
- T’Challa cast/recast timing, survivability, attacks and combat damage getting through, chump blocks/evasion, artifact/Vibranium development and actual mana issues where recorded.
- Which new cards were seen/cast/used effectively, stranded or AI-mishandled. Card-conditioned wins are associations, not individual causal effects.
- At least two specific decision/outcome examples and any engine/pilot/replay artifact. Do not diagnose a missing blocker without checking legal blocking and evasion. Do not infer exact mana payment from mana-option text.
- Cumulative matched comparison through the completed rounds, while retaining each opponent group separately.
- `reviewed: true`, issues requiring repair if any, and `continue` or `needs-fix` status. A loss/weak gain is not a reason to repeat seeds or tune a deck during the fixed comparison.

After round5, Codex writes a final summary: whether the installed changes measurably improve the deck, main drivers/limitations, and practical next-game guidance. Do not equate absence of significance with proof of equality. No additional purchase recommendation or physical swap is assumed installed.
