# Reviewer follow-up from X5, 2026-10-29

The active watcher was not restarted or changed during this review.

- `jaceLoss` currently matches only `has lost because`, missing `has lost due to effect of spell` and `has lost due to accumulation of 21 damage from generals`. Examples: baseline current C1 run pod07-g5, pod08-g5, pod17-g2. Parse the full original outcome and add regression coverage in a future watcher maintenance pass. The new detailed Codex review uses the original lines and labels these correctly.
- Never infer elimination solely from a zero/negative life transition: v0.6 current C1 pod16-g4 shows Darksteel Angel preventing a loss at -1, followed by Jace winning.
- Non-damage life loss can dominate the actual elimination even if the damage table is small: v0.6 pod17-g1 dies to The One Ring upkeep, not combat.

These are reviewer interpretation issues; no shared Forge engine edits are requested by this file.

## Additional case from the later review

Owned-engine `2026-10-300254-smart-politics-keeptokens-100/pod20-g1.log` ends in a consistent Jace win at 353,401 ms but contains 2,578 copies of the can’t-lose replacement message. First clear survival event: 24 combat damage moves Jace from 19 to -5. Audit whether repeated state-based loss checks are merely logging noise or distort engine progress; do not automatically discard a below-timeout game without evidence.

Loss-reason parsing should also cover `has lost trying to draw cards from empty library`, seen in owned-engine pod20-g2 after Memnarch’s attack draw.

## C16 filename coverage gap (2026-10-30)

review-watch.js discovery accepts only podNN-gN.log, so b1podNN–b5podNN completed C16 games are not indexed even while status polling is healthy. Codex analysis/baseline500-review.py and baseline500-five-pass.py scan them directly. Watcher was not modified/restarted; this does not invalidate Forge runs. Do not interpret feed inactivity as no simulation progress.
