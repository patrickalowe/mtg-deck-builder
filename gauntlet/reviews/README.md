# Jace live game reviewer

The watcher reads completed `.log` and companion `.hand.jsonl` files in `gauntlet/versions/jace/*/runs/*/logs/` every 60 seconds. It starts no games, loads no Java/Forge engine, calls no external model or network service, and writes nothing inside deck versions or run folders.

- `feed.jsonl`: one structured record per completed eligible game, with evidence line numbers and source hash.
- `seen.txt`: indexed relative game keys. Recovered from the feed on restart, preventing duplicate entries.
- `SUMMARY.md`: rolling rule-based summary, grouped by version/run; latest games and AI review candidates.
- `games.md`: rule-based review of each completed eligible game.
- `codex-reviewed.txt`: keys actually covered by the dated deeper Codex review, separate from automated indexing.
- `CODEX-REVIEW.md`: Codex's deeper review at the stated snapshot time. It is not automatically rewritten by the watcher.
- `status.json`: process ID, last poll, new games, pending files and errors.
- `watcher.log`: startup/poll diagnostics.

The background process continues extracting evidence and updating automated summaries while this Codex conversation is idle. It does **not** wake Codex or perform new model reasoning. A later Codex turn can read the feed and update the deeper review. No automatic messages are sent to Claude or anyone else; shared files are the hand-off.

## Start and stop

From the project root:

```sh
node gauntlet/review-watch.js --start
```

This launches a detached, low-load Node process. It survives the command session ending, but not a reboot; it is not installed as a login service. A lock prevents two watchers writing to the same feed.

The project says never to drive Patrick's screen, so this task uses a background process instead of creating/manipulating a Warp tab. To run visibly yourself, use `node gauntlet/review-watch.js` in any terminal after stopping the background instance.

To stop only this watcher, create its stop-request file; it exits at the next poll (within roughly one minute):

```sh
touch gauntlet/reviews/STOP
```

Wait for `gauntlet/reviews/watch.lock` to disappear before restarting. This never signals any Forge/Claude process.

For a one-time refresh when the watcher is stopped:

```sh
node gauntlet/review-watch.js --once
```

Tests: `node --test gauntlet/review-watch.test.js`. Custom `--versions`, `--output` and `--interval` are intended for fixtures; output must stay outside the watched version tree.

## Interpretation limits

Only logs ending with a complete `Game Result` line and newline are eligible. Partial/malformed hand streams are retried. INVALID/ABORTED runs are skipped; if a run gets marked later, its old feed records remain as audit history but are excluded from generated summaries. Changed indexed source files are flagged for manual reconciliation; the existing record is not silently replaced.

Timeout suspects (runtime at least 599 seconds) and contradictory multiple-winner records stay out of clean W/L/D counts. Official summaries are not edited, and a slow natural finish remains possible. Per-run results are kept separate; overlapping seeds and quick runs are never pooled into one win rate.

Jace -3 counts are resolved abilities. Exile-cost attribution uses adjacent log entries and is labeled an inference. Ordinary logs often omit the card put onto the battlefield, so `hit` is null and subsequent triggers are merely candidates. No card-hit rates should be calculated from candidates.

Token attacks/blocks count named-token appearances in declarations, including multiline combat entries. They do not establish token power, unique token count or whether a lethal-attack exception was appropriate. Token death ownership is often absent; known-controller death counts are a lower bound under the last logged controller, and unknown deaths are reported separately. Control changes not recorded in these logs cannot be reconstructed reliably.

Casts, land plays, cards seen in hand, final recorded hand and last nonempty hand snapshot are separate fields. Eliminated players may have their hands emptied before the game ends. Mulligan snapshots can include cards returned before play. An uncast card is not automatically stranded or misplayed: mana, targets, timing, alternative uses and cards cheated into play matter. AI issues are review candidates, never automatic judgments that the physical card is bad.

Damage tables reflect logged damage, not all life loss or all win conditions. Outgoing damage attributed to Jace's side uses last logged combat control; unobserved control changes remain a limitation. Approximate rounds use the existing harness's global-turn/4 convention, not exact personal turns after eliminations.
