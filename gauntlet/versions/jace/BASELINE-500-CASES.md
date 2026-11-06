# C16 case review — first batch, 2026-10-30

Three confirmed loss mechanisms, not a ranked frequency estimate. Sources below are in the valid first C16 pilot-v4 b1 run `2026-10-30211001-rtcombo-jacereal-jacecombo-safewalkers-pilotv3-pilotv4-b1-smart-politics-commanderfirst-keeptokens-100/logs/`.

- **Flying army, b1pod01-g2:** Angel tokens, Angel of Jubilation, Valkyrie Harbinger and Giada dealt combat damage; Patrick’s life fell 20 → −24. This supports preserving flying blockers and answering the army. It does not establish that available blockers could have prevented lethal.
- **Single huge attacker, b1pod04-g4:** Thromok was declared attacking Patrick, was unblocked, and dealt 64 combat damage (36 → −28 life). Verify blockers/evasion and available interaction before calling it a blocking mistake. This is a spot-removal or combat-response problem, not merely a count of small tokens.
- **Noncombat engine, b1pod09-g2:** Last Laugh repeatedly dealt damage during the game and the final recorded point reduced Patrick from 1 → 0. Ordinary blocking cannot prevent that damage. Some prevention replacements also appear; their controllers/protected objects require identity tracing before claiming a rules bug.

## Measurement correction found during this review

The summaries have empty decline maps under pilot v4, but the `jace_plus1` events preserve a `because` field. At the frozen 190-game snapshot (173 non-suspect), 77 games have at least one `no_tokens_or_targets` fallback, covering 152 unique game/personal-turn pairs. These are observed shortages when the custom +1 policy intervened—not a complete denominator of all Jace-ready turns. They contradict any interpretation that empty summary decline maps mean no shortage.

These cases do not identify a new purchase or establish a swap benefit. First-batch matchup results differ from the older gauntlet because the opponents changed. Further work remains on Jace survival, controller-attributed finishing damage, mulligans/colors and the other batches.
