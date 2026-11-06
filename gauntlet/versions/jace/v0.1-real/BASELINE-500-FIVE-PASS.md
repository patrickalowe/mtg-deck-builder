> Superseded by the [final 500-game evaluation](BASELINE-500.md), completed November 3. This intermediate diagnostic uses a different survival proxy; do not substitute its figures for the final report.

# Five-pass C16 review — frozen 500/500 snapshot

Read-only review. This is a supplement, not a finished X7 evaluation. All original logs and frozen pilot builds remain unchanged.

## 1. Results and validity

159 corrected wins / 500 completed games; 55 suspect outcomes excluded from tactical analysis and scored as draws in the baseline result. New opponent pools are not a matched comparison to the old gauntlet. Remaining games and per-pod dependence limit generalization.

**Monitoring gap:** review-watch.js only matches `podNN-gN.log`, not `bNpodNN-gN.log`. Its healthy polling status therefore does not establish coverage of C16. All figures here use direct logs/telemetry. Watcher was not restarted or modified; no feed keys are falsely marked reviewed.

## 2. Setup and loyalty

Observed no-target +1 fallback on 432 distinct game/personal-turn pairs in 208/445 clean games. This establishes recurring lack of an expendable target in the AI’s evaluated policy, not that a new token card would improve net wins. Empty summary decline maps are bypassed by the v4 policy.

Custom +1 reasons (policy events, not all loyalty activations):

- insufficient_loyalty: 537.
- no_tokens_or_targets: 432.
- saving_valuable_pieces: 228.
- would_kill_jace: 142.

## 3. Tactical survival: conservative log check

833 resolved-cast intervals have an observed next Patrick turn and can be checked. Exile/blink is not called death. No-graveyard-loss does not prove survival: exile, bounce, theft and commander replacement are not fully classified. Game-ending intervals are censored rather than called successful survival. A normal-cast resolution could also be misattributed if a same-name opponent copy exists; inspect examples before treating this as a precise survival rate.

- no recorded graveyard loss before next turn: 357.
- other/unknown graveyard loss: 461.
- graveyard after logged damage (combat not established): 14.
- graveyard near own targeted activation (cause unverified): 1.

**Do not compare this conservative proxy directly to Claude’s earlier 49–50% figure**, which used a different definition. Precise cast-to-next-turn survival needs card-identity/zone tracing. It is also not enough to label an unblocked attack a mistake without legal-block/evasion and player-lethal checks.

## 4. Wins and losses

Recent clean fifth-batch wins provide ordinary-engine examples (last attack, not proof of sole cause or exact lethal):

- `b5pod15-g3`: Serra's Emissary (74), Archon of Cruelty (77), Citizen Token (1306) and Illusion Token (1314) to attack Ai(2)-b3-11619336.
- `b5pod16-g1`: Galactus, Devourer of Worlds (9), Triplicate Titan (15), Serra's Emissary (74), Dreamtide Whale (75), Overlord of the Mistmoors (51), Archon of Cruelty (77), Tekuthal, Inquiry Dominus (71), Insect Token (754), Insect Token (755), Insect Token (788) and Insect Token (789) to attack Ai(2)-b3-13868857.
- `b5pod20-g2`: Galactus, Devourer of Worlds (9), Avacyn, Angel of Horror (5), Patron of the Orochi (175), Yoshimaru, Ever Faithful (112), The Capitoline Triad (139), Archfiend of Despair (91), Jhoira, Weatherlight Corsair (3), Kutzil, Malamet Exemplar (150), Illusion Token (548) and Servo Token (551) to attack Ai(2)-b3-11619336.

Three checked loss mechanisms are preserved in [BASELINE-500-CASES.md](../BASELINE-500-CASES.md): flying army (b1pod01-g2, life20→−24), giant unblocked Thromok (b1pod04-g4,64 damage), and Last Laugh noncombat engine (b1pod09-g2,final1→0). These are confirmed examples, not an exhaustive ranked categorization.

Opening kept-hand sizes reported in clean logs:

- 5 cards: 40 games.
- 6 cards: 70 games.
- 7 cards: 335 games.

Kept size alone does not establish mulligan quality. Snapshot land counts do not establish color availability or whether a rock could pay the required colors. Replays now expose mana ability text, but those options are not the actual chosen colors/payments.

## 5. Decision

No purchases or permanent swaps established. Dreadhorde-for-land remains an untested change; preserve baseline mana for comparison. A personal one-card trial is different from a statistically supported upgrade. Finish the cohort, then prioritize a few reconstructed tactical decisions with legal alternatives over another bulk run. Current early-token evidence justifies investigation, not an automatic token-maker recommendation.

Remaining X7 work: final five-batch totals, exact Jace survival and cause attribution, controller-attributed finishing damage, color/mulligan decisions, and a defensible frequency ranking of loss patterns.
