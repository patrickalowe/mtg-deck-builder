"""Deeper, conservative companion to baseline500-review.py; no Forge mutations."""
from pathlib import Path
import json,re,collections,statistics
ROOT=Path(__file__).resolve().parents[1];base=ROOT/'gauntlet/versions/jace/v0.1-real';x=json.loads((base/'BASELINE-500.json').read_text());clean=[r for r in x['records'] if not r['suspect']]
M='Ai(1)-jace-v0.1-real';death=collections.Counter();mull=collections.Counter();examples={};plus=collections.Counter();castIntervals=[];finish=[]
for r in clean:
 ls=(ROOT/r['source']).read_text().splitlines();plus.update(r.get('plusReasons',{}))
 for l in ls:
  if l.startswith('Mulligan: '+M+' has kept a hand of '):
   q=re.search(r'hand of (\d+)',l)
   if q:mull[int(q[1])]+=1
 ownTurns=[i for i,l in enumerate(ls) if l.startswith('Turn:') and f'({M})' in l]
 # Only resolved normal casts, not blink resets. Graveyard evidence excludes blink exile.
 pending=False
 for i,l in enumerate(ls):
  if l.startswith('Add To Stack: '+M+' cast Jace, Multiverse Architect'):pending=True
  if pending and l=='Resolve Stack: Jace, Multiverse Architect':
   pending=False;end=next((j for j in ownTurns if j>i),None)
   if end is None:continue # game end censors this cast; no next-turn conclusion
   segment=ls[i+1:end];grave=next((j for j,z in enumerate(segment) if re.match(r'Zone Change: Jace, Multiverse Architect \(\d+\) was put into Graveyard from Battlefield\.',z)),None)
   label='no recorded graveyard loss before next turn'
   if grave is not None:
    prior=segment[max(0,grave-12):grave]
    if any('damage to Jace, Multiverse Architect' in z for z in prior):label='graveyard after logged damage (combat not established)'
    elif any(z.startswith('Add To Stack: '+M+' activated Jace, Multiverse Architect targeting') for z in prior):label='graveyard near own targeted activation (cause unverified)'
    else:label='other/unknown graveyard loss'
    examples.setdefault(label,r['source'])
   death[label]+=1;castIntervals.append({'source':r['source'],'resolveLine':i+1,'nextOwnTurnLine':end+1,'label':label})
 if r['win']:
  attacks=[l for l in ls if l.startswith('Combat: '+M+' assigned ') and ' to attack ' in l]
  if attacks:finish.append({'source':r['source'],'game':r['game'],'lastPatrickAttack':attacks[-1]})
N=len(x['records']);W=sum(r['win'] for r in x['records']);S=sum(r['suspect'] for r in x['records']);ng=sum(r.get('shortageTurns',0)>0 for r in clean);nt=sum(r.get('shortageTurns',0) for r in clean)
lines=[f'# Five-pass C16 review — frozen {N}/500 snapshot','', 'Read-only review. This is a supplement, not a finished X7 evaluation. All original logs and frozen pilot builds remain unchanged.','', '## 1. Results and validity','',f'{W} corrected wins / {N} completed games; {S} suspect outcomes excluded from tactical analysis and scored as draws in the baseline result. New opponent pools are not a matched comparison to the old gauntlet. Remaining games and per-pod dependence limit generalization.','', '**Monitoring gap:** review-watch.js only matches `podNN-gN.log`, not `bNpodNN-gN.log`. Its healthy polling status therefore does not establish coverage of C16. All figures here use direct logs/telemetry. Watcher was not restarted or modified; no feed keys are falsely marked reviewed.','', '## 2. Setup and loyalty','',f'Observed no-target +1 fallback on {nt} distinct game/personal-turn pairs in {ng}/{len(clean)} clean games. This establishes recurring lack of an expendable target in the AI’s evaluated policy, not that a new token card would improve net wins. Empty summary decline maps are bypassed by the v4 policy.','', 'Custom +1 reasons (policy events, not all loyalty activations):','']
for k,v in plus.most_common():lines.append(f'- {k}: {v}.')
lines+=['','## 3. Tactical survival: conservative log check','',f'{len(castIntervals)} resolved-cast intervals have an observed next Patrick turn and can be checked. Exile/blink is not called death. No-graveyard-loss does not prove survival: exile, bounce, theft and commander replacement are not fully classified. Game-ending intervals are censored rather than called successful survival. A normal-cast resolution could also be misattributed if a same-name opponent copy exists; inspect examples before treating this as a precise survival rate.','']
for k,v in death.items():lines.append(f'- {k}: {v}.')
lines+=['', '**Do not compare this conservative proxy directly to Claude’s earlier 49–50% figure**, which used a different definition. Precise cast-to-next-turn survival needs card-identity/zone tracing. It is also not enough to label an unblocked attack a mistake without legal-block/evasion and player-lethal checks.','', '## 4. Wins and losses','', 'Recent clean fifth-batch wins provide ordinary-engine examples (last attack, not proof of sole cause or exact lethal):','']
for f in [f for f in finish if '/b5pod' in f['source']][-3:]:lines.append(f'- `{f["game"]}`: {f["lastPatrickAttack"].split(" assigned ",1)[-1]}')
lines+=['', 'Three checked loss mechanisms are preserved in [BASELINE-500-CASES.md](../BASELINE-500-CASES.md): flying army (b1pod01-g2, life20→−24), giant unblocked Thromok (b1pod04-g4,64 damage), and Last Laugh noncombat engine (b1pod09-g2,final1→0). These are confirmed examples, not an exhaustive ranked categorization.','', 'Opening kept-hand sizes reported in clean logs:','']
for k,v in sorted(mull.items()):lines.append(f'- {k} cards: {v} games.')
lines+=['','Kept size alone does not establish mulligan quality. Snapshot land counts do not establish color availability or whether a rock could pay the required colors. Replays now expose mana ability text, but those options are not the actual chosen colors/payments.','', '## 5. Decision','', 'No purchases or permanent swaps established. Dreadhorde-for-land remains an untested change; preserve baseline mana for comparison. A personal one-card trial is different from a statistically supported upgrade. Finish the cohort, then prioritize a few reconstructed tactical decisions with legal alternatives over another bulk run. Current early-token evidence justifies investigation, not an automatic token-maker recommendation.','', 'Remaining X7 work: final five-batch totals, exact Jace survival and cause attribution, controller-attributed finishing damage, color/mulligan decisions, and a defensible frequency ranking of loss patterns.']
(base/'BASELINE-500-FIVE-PASS.md').write_text('\n'.join(lines)+'\n');(base/'BASELINE-500-FIVE-PASS.json').write_text(json.dumps({'frozenCount':N,'graveyardProxy':dict(death),'castIntervals':castIntervals,'mulliganKeeps':dict(mull),'recentWinningAttacks':finish[-20:],'shortageGames':ng,'shortageTurns':nt},indent=2));print(N,W,S,ng,nt,dict(death),dict(mull))
