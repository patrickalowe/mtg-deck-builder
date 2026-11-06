# T’Challa C17 matched comparison

Five rounds ×100 games per arm =1,000games. `manifest.json` freezes deck versions, assumptions, flags, runtime files and opponent groups. Patrick authorized modeling Divine Visitation as present; Forsaken’s original Panther Idol cut is an explicit assumption. This test compares those modeled lists and does not certify physical inventory.

Runner: `python3 gauntlet/tchalla-paired-series.py --check` for preflight; omit `--check` to run Claude’s batch then Codex’s review and resume sequentially. Authentication and machine-budget checks must succeed. No bypass flags are used. No games start during `--check`.

## Claude runner + launch (2026-11-04 15:37)

- `gauntlet/c17-round.py` (sha256 ae37d38643cc…): runs one paired round — both arms, the round's 100 predeclared single-game
  trials each, frozen legacy runtime (app-custom + replaysim/classes; `SMART_AI` + `POLITICS` only), 2+2 games at
  once (≤ 4 machine-wide), **610 s wall-clock kill per game** (process group) with `logs/<trial>-timeout.json` evidence.
  Self-test PASS (real game killed at 20 s, no leftover JVM); one full game scored correctly; build fingerprints match
  `expectedBuild`. Runner hash is recorded in `runner.json` at round 1 and enforced for later rounds.
- `tchalla-paired-series.py` now calls the runner directly for the game work (a headless Claude session can't block
  through a ~1 h round). Codex's review step is unchanged: `codex exec --sandbox read-only` must return
  `reviewed: true, decision: continue` before the next round. Codex's original is kept as
  `tchalla-paired-series.codex-original.py`.
- Preflight (`--check`) PASS from Claude's environment: both CLIs authenticated, process inventory readable, all hashes match.
