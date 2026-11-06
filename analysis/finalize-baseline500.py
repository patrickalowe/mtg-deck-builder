"""Finalize X7 from completed frozen C16 logs; never modifies simulation assets."""
from pathlib import Path
import collections as C, json, re, statistics, zipfile, runpy, math, hashlib
R=Path(__file__).resolve().parents[1];B=R/'gauntlet/versions/jace/v0.1-real'
rendered=runpy.run_path(str(R/'analysis/baseline500-review.py'))
base_text=(B/'BASELINE-500.md').read_text();x=json.loads((B/'BASELINE-500.json').read_text());rows=x['records'];assert len(rows)==500
assert len({r['source'] for r in rows})==500
clean=[r for r in rows if not r['suspect']];W=sum(r['win'] for r in rows);S=sum(r['suspect'] for r in rows)
M='Ai(1)-jace-v0.1-real';land_names=set();names={}
with zipfile.ZipFile(R/'forge/app-custom/res/cardsfolder/cardsfolder.zip') as z:
 for f in z.namelist():
  if not f.endswith('.txt'):continue
  t=z.read(f).decode(errors='replace');n=re.search(r'^Name:(.+)$',t,re.M);ty=re.search(r'^Types:(.+)$',t,re.M)
  if n and ty:
   names[n[1]]=ty[1]
   if 'Land' in ty[1].split():land_names.add(n[1])
keeps=C.Counter();opening_lands=C.Counter();opening_mismatch=0;survival=C.Counter();survival_cases={};endpoints=C.Counter();endpoint_examples={};outdamage=C.Counter();outgames=C.defaultdict(set);hits=C.Counter();hitgames=C.defaultdict(set);intervals=[]
for r in clean:
 ls=(R/r['source']).read_text().splitlines();kept=None;firstturn=None;entry=0
 for line in ls:
  if re.match(r'^[A-Z][A-Za-z ]*: ',line):entry+=1
  if line.startswith('Mulligan: '+M+' has kept a hand of '):kept=int(re.search(r'hand of (\d+)',line)[1])
  if line.startswith('Turn:'):
   firstturn=entry-1;break
 if kept is not None:keeps[kept]+=1
 handpath=(R/r['source']).with_suffix('.hand.jsonl')
 if handpath.exists() and firstturn is not None:
  hs=[json.loads(l) for l in handpath.read_text().splitlines() if l.strip()];opening=next((h['hand'] for h in reversed(hs) if h['a']<=firstturn),None)
  if opening is not None and len(opening)==kept:opening_lands[sum(n in land_names for _,n in opening)]+=1
  else:opening_mismatch+=1
 events=[json.loads(l) for l in (R/r['source']).with_suffix('.jace.jsonl').read_text().splitlines() if l.strip()]
 for e in events:
  if e.get('ev')=='minus3_hit':hits[e['card']]+=1;hitgames[e['card']].add(r['source'])
 ownturns=[i for i,l in enumerate(ls) if l.startswith('Turn:') and f'({M})' in l];pending=False
 for i,line in enumerate(ls):
  if line.startswith('Add To Stack: '+M+' cast Jace, Multiverse Architect'):pending=True
  if pending and line=='Resolve Stack: Jace, Multiverse Architect':
   pending=False;end=next((j for j in ownturns if j>i),None)
   if end is None:survival['censored at game end']+=1;continue
   phase='';attackers_jace=False;label='no recorded exit before next turn';last_own3=-100
   for j in range(i+1,end):
    l=ls[j]
    if l.startswith('Turn:'):phase='';attackers_jace=False
    if l.startswith('Phase:'):
     phase=l
     if 'Beginning of Combat' in phase:attackers_jace=False
    if re.match(r'Combat: Ai\(\d\)\S* assigned .+ to attack Jace, Multiverse Architect \(\d+\)\.',l):attackers_jace=True
    if l.startswith('Add To Stack: '+M+' activated Jace, Multiverse Architect targeting'):last_own3=j
    leave=re.match(r'Zone Change: Jace, Multiverse Architect \((\d+)\) was put into (\w+) from Battlefield\.',l)
    if not leave:continue
    zone=leave[2]
    if zone=='Exile' and any('Replacement Effect: Jace, Multiverse Architect enters with' in q for q in ls[j+1:min(end,j+7)]):continue
    if zone=='Graveyard':
     if 'Damage Step' in phase and attackers_jace:label='graveyard during combat after being attacked'
     elif j-last_own3<=8:label='graveyard immediately after own targeted activation'
     else:label='graveyard outside attributed combat (removal/other unverified)'
    else:label=f'{zone} exit without confirmed immediate return'
    survival_cases.setdefault(label,{'source':r['source'],'line':j+1});break
   survival[label]+=1;intervals.append({'source':r['source'],'castResolveLine':i+1,'nextOwnTurnLine':end+1,'label':label})
 # Classify only final recorded life depletion; raw outcome remains authoritative.
 active=None;phase='';own_attack_ids=set();recent_damage=[];depletions=[]
 for i,l in enumerate(ls):
  tm=re.match(r'Turn: Turn \d+ \(Ai\((\d)\)',l)
  if tm:active=tm[1];own_attack_ids=set();recent_damage=[]
  if l.startswith('Phase:'):
   phase=l
   if 'Beginning of Combat' in l:own_attack_ids=set();recent_damage=[]
  if l.startswith('Combat: '+M+' assigned ') and ' to attack ' in l:
   own_attack_ids.update(re.findall(r'\((\d+)\)',l.split(' assigned ',1)[1].split(' to attack ',1)[0]))
  dm=re.match(r'Damage: (.+?) \((\d+)\) deals (\d+) (combat|non-combat) damage to (.+)\.',l)
  if dm:
   if dm[5]==M:recent_damage.append({'source':dm[1],'amount':int(dm[3]),'kind':dm[4],'line':i+1})
   elif active=='1' and dm[4]=='combat' and dm[2] in own_attack_ids and re.match(r'Ai\([234]\)',dm[5]):
    outdamage[dm[1]]+=int(dm[3]);outgames[dm[1]].add(r['source'])
  lm=re.match(r'Life: Life: '+re.escape(M)+r' (-?\d+) > (-?\d+)',l)
  if lm and int(lm[2])<=0:depletions.append({'from':int(lm[1]),'to':int(lm[2]),'line':i+1,'damage':recent_damage[-8:]})
 if not r['win']:
  label='unclassified / alternate loss';dep=depletions[-1] if depletions else None
  if dep:
   near=[d for d in dep['damage'] if dep['line']-d['line']<=8]
   last=near[-1] if near else None
   if last:
    label='combat: large final hit (10+)' if last['kind']=='combat' and last['amount']>=10 else 'combat: smaller final hit' if last['kind']=='combat' else 'noncombat damage at final depletion'
   else:label='life depletion without nearby logged damage'
  endpoints[label]+=1;endpoint_examples.setdefault(label,{'source':r['source'],'life':dep,'reason':r['lossReason']})
# Ensure all five summaries agree with direct rescoring and frozen build identity.
builds=[]
for i,run in x['runs'].items():
 summary=json.loads((B/'runs'/run/'summary.json').read_text());rr=[r for r in rows if r['batch']==int(i)]
 assert summary['wins']==sum(r['win'] for r in rr);assert summary['suspect']==sum(r['suspect'] for r in rr)
 builds.append(summary['build'])
assert len({json.dumps(b,sort_keys=True) for b in builds})==1
cfg5=json.loads((R/'gauntlet/gauntlet-b5.json').read_text());sisay=next(k for k,v in cfg5['decks'].items() if v=='Captain Sisay');cirdan=next(k for k,v in cfg5['decks'].items() if v.startswith('Círdan'))
def stats(rr):return {'n':len(rr),'wins':sum(r['win'] for r in rr),'raw':sum(r['rawWin'] for r in rr),'suspect':sum(r['suspect'] for r in rr)}
sensitivity={'all':stats(rows),'batches1to4':stats([r for r in rows if r['batch']<5]),'batch5':stats([r for r in rows if r['batch']==5]),'batch5_without_sisay':stats([r for r in rows if r['batch']==5 and sisay not in r['opponents']]),'batch5_with_sisay':stats([r for r in rows if r['batch']==5 and sisay in r['opponents']]),'batch5_with_cirdan':stats([r for r in rows if r['batch']==5 and cirdan in r['opponents']]),'all_without_sisay_b5':stats([r for r in rows if not(r['batch']==5 and sisay in r['opponents'])])}
shortage_games=sum(r['shortageTurns']>0 for r in clean);shortage_turns=sum(r['shortageTurns'] for r in clean)
ss=[r['summary'] for r in clean];sums=C.Counter()
for r in clean:sums.update(r['events'])
combo_games=sum(s.get('combo_assembled',-1)>=0 for s in ss);loop_games=sum(s.get('loop_steps',0)>0 for s in ss)
loss_reasons=C.Counter(r['lossReason'] for r in clean if not r['win'])
life_risk=[]
for r in clean:
 if r['win']:continue
 ls=(R/r['source']).read_text().splitlines();depleted=[i for i,l in enumerate(ls) if re.match(r'Life: Life: '+re.escape(M)+r' -?\d+ > (?:0|-\d+)$',l)]
 if depleted:
  i=depleted[-1];context='\n'.join(ls[max(0,i-4):i+3])
  if 'Jhoira' in context and 'lose life equal' in context:life_risk.append({'source':r['source'],'line':i+1,'context':context})
N=len(rows);nominal=rendered['interval']
# The prior renderer produces tables; keep them as a reproducible appendix.
(B/'BASELINE-500-TABLES.md').write_text((B/'BASELINE-500.md').read_text())
lines=['# Jace current-deck baseline — final 500-game review','', 'Completed November 3, 2026. Patrick’s physical v0.1-real deck was unchanged; five groups of different opponents used the same frozen pilot v4. This report evaluates those simulations and their limitations.','',f'**Corrected result: {W}/500 wins (31.8%).** Nominal Wilson 95% interval: {nominal(W,500)}. Raw winner lines credited 179 wins, but 55 suspect games are scored as draws, removing 20 apparent wins. Excluding suspect games entirely gives 159/445 (35.7%); that excludes difficult/stall-prone games and is not an unbiased replacement headline.','', 'The deck wins regularly in these simulated four-player pods. The baseline does not prove its real-world win rate, maximum power or a card upgrade. The 25% even-share reference does not mean all four decks/pilots in every pod were equally strong.','', '## Batch results and stall sensitivity','', '| Opponent group | Wins / started | Raw wins | Suspect | Wins / non-suspect |','|---|---:|---:|---:|---:|']
for i in range(1,6):
 st=stats([r for r in rows if r['batch']==i]);lines.append(f'| {i} | {st["wins"]}/{st["n"]} | {st["raw"]} | {st["suspect"]} | {st["wins"]}/{st["n"]-st["suspect"]} |')
lines+=['', '**Batch five requires caution:** the stalled games are not distributed randomly. Captain Sisay and Círdan appear in overlapping pods; their counts cannot be added. Presence is an association, not a verified explanation for the underlying engine stall.','', '| Sensitivity slice | Corrected wins / started | Suspect | Wins / non-suspect |','|---|---:|---:|---:|']
for title,key in [('Batches 1–4','batches1to4'),('Batch 5 with Sisay','batch5_with_sisay'),('Batch 5 without Sisay','batch5_without_sisay'),('Batch 5 with Círdan','batch5_with_cirdan'),('All groups, excluding batch-5 Sisay pods','all_without_sisay_b5')]:
 st=sensitivity[key];lines.append(f'| {title} | {st["wins"]}/{st["n"]} | {st["suspect"]} | {st["wins"]}/{st["n"]-st["suspect"]} |')
lines+=['', 'These slices change the opponent mix; they are a sensitivity check, not grounds to delete unfavorable matchups. Some batch-five logs run several hours beyond the nominal 600-second cutoff. Raw results are not reliable. Nominal intervals assume independent games; shared pods and sequential seeds create dependence, so they do not capture every source of uncertainty.','', '## Setup, tokens and loyalty','',f'- Among {len(clean)} non-suspect games, **{shortage_games} ({100*shortage_games/len(clean):.1f}%)** had a custom Jace +1 fallback because no expendable target was available; {shortage_turns} distinct game/personal-turn pairs. This is a repeatable pilot-level bottleneck, not proof that the deck never made a token or that an additional token maker wins more.',f'- Median first Jace cast: personal turn {statistics.median(s["first_jace_cast"] for s in ss if s["first_jace_cast"]>=0):g}; median first −3: turn {statistics.median(s["first_minus3"] for s in ss if s["first_minus3"]>=0):g}. These medians use games where the event happened; they are not paired delays.',f'- {sum(s["first_jace_cast"]<0 for s in ss)} games never cast Jace; {sum(s["minus3_resolved"]==0 for s in ss)} had no resolved −3.',f'- {sum(s["minus3_resolved"] for s in ss)} resolved −3s; {sums["minus3_hit"]} recorded hit events; {sums["jace_plus1"]} custom +1 selections. Missing hit events prevent naming every payoff. Summary decline maps are empty under v4 interception, so the fallback reason events are used instead.','']
for turn in [4,5,6]:
 sp=[s for r in clean for s in r['snapshots'] if s.get('pt')==turn];lines.append(f'- Turn {turn} start-main snapshots: mean {statistics.mean(s["lands"] for s in sp):.2f} lands; any creature token in {sum(s.get("creature_tokens",0)>0 for s in sp)}/{len(sp)}. This is not the full first-token timeline or a count of all legal creature/planeswalker fodder.')
lines+=['','## Jace exposure and blocking','', 'To avoid counting a blink as death, this check follows resolved normal-cast intervals through the next observed Patrick turn, skips explicit immediate blink returns and identifies the first remaining battlefield exit. It censors intervals with no next turn because the game ended. A permanent that leaves and returns later has still suffered an exit. This is a text-log proxy: copied commanders, missing zone changes and replacement effects limit exact identity tracking.','']
for k,v in survival.items():lines.append(f'- {k}: {v}.')
lines += ['',f'Custom token-block assignments: {sums["walker_block"]}; unblocked diagnostic events: {sums["walker_unblocked"]}. These are not all block opportunities; repeated callbacks and evasion/player-lethal constraints prevent reading every unblocked event as a mistake. The combat attribution above requires an attack aimed at Jace and a death during a combat damage phase; Forge does not consistently print damage-to-walker amounts. No-exit means no recorded exit, not proof of exact survival.', '', '## What wins and what ends losses','',f'The Aminatou/Bolas/Ajani assembly was recorded in {combo_games}/{len(clean)} clean games; actual loop steps occurred in {loop_games} games ({sums["loop_step"]} total steps). Most wins therefore occur without an executed loop. Assembly or loop execution is not by itself proof of a combo-caused victory.','', 'Observed Jace hits (counts, not card win-rate rankings):','']
for card,n in hits.most_common(8):lines.append(f'- {card}: {n} hit events in {len(hitgames[card])} games.')
lines+=['', 'Largest sources of **verified Patrick-attacker combat damage to opposing players** (only IDs declared attacking by Patrick in that combat; excludes end-step life loss, noncombat effects, other controllers and unowned sources):','']
for card,n in outdamage.most_common(8):lines.append(f'- {card}: {n} damage across {len(outgames[card])} games.')
lines+=['', 'Damage totals depend on game length, power boosts and opportunity. They do not establish which single card caused more wins. Archfiend-style life loss is not damage and is excluded from that table.','', 'Loss patterns below classify the last recorded life-depletion sequence in non-suspect losses. They are descriptive endpoints; they do not prove the earlier strategic mistake or that a different card would have prevented the loss. Some combat deaths show only small final hits after a large army, so endpoint sizes are not army sizes.','', '| Final recorded loss sequence | Games | Example |','|---|---:|---|']
for cat,n in endpoints.most_common():lines.append(f'| {cat} | {n} | {Path(endpoint_examples[cat]["source"]).stem} |')
lines+=['', 'Authoritative outcome reasons across all 286 non-suspect losses:','']
for reason,n in loss_reasons.most_common():
 example=next(r for r in clean if not r['win'] and r['lossReason']==reason)
 lines.append(f'- {reason}: {n}; example `{example["game"]}`.')
lines+=['',f'**Life-management candidate:** {len(life_risk)} losses have Jhoira’s life-loss text immediately beside the final recorded depletion. Direct example b1pod06-g5: own Jace −3 exiles a Jace token, Jhoira entry triggers and Patrick goes from 2 to −2 life. This is evidence of a dangerous life-loss interaction, not proof each preceding activation was a mistake (the reveal may have been unknown and alternatives may have been worse). Audit known-top setup and voluntary attacks/trigger risks at low life before recommending more cards.']
lines+=['', 'Three directly checked mechanisms: **flying army** in b1pod01-g2 (Giada/Angels, life 20→−24); **giant unblocked attacker** in b1pod04-g4 (Thromok,64 damage,36→−28); **noncombat engine** in b1pod09-g2 (Last Laugh,final1→0). Ground token count alone does not answer all three. See [checked cases](../BASELINE-500-CASES.md).','', '## Mulligans and mana','']
for k,v in sorted(keeps.items()):lines.append(f'- Kept {k} cards: {v} games.')
lines+=['', 'Opening land counts were reconstructed only where the final pre-turn hand snapshot matches the logged kept-hand size:','']
for k,v in sorted(opening_lands.items()):lines.append(f'- {k} lands: {v} games.')
lines += ['',f'{opening_mismatch} clean games have unavailable/mismatched opening-hand reconstruction. A seven-card keep is not automatically good; a five-card keep is not automatically a mistake. Average lands do not show color availability. These logs lack exact mana-pool/payment choices, so **no reliable color-screw rate or benefit from cutting a land can be established**. The replay mana line lists an ability’s options, not necessarily the selected color.','', '## Practical recommendation','', 'Keep the current physical deck as the reference. No purchase or permanent swap is demonstrated by this baseline. The prior isolated Dreadhorde trial was 22/100 versus 30/100 under the same older pilot; this broader baseline does not overturn it or prove that a land cut helps. A personal owned-card trial remains a reversible experiment rather than an established upgrade.','', 'Next useful work is a short audit of concrete ready-Jace turns: was a token maker in hand and affordable, were blockers actually legal, was a +1/reset/top-deck line preferable, and would protecting Jace compromise Patrick’s survival? Select from completed games; validate legal alternatives before changing policy. Additional bulk baseline games would add little compared with resolving those decisions. Recovery/mill and purchase proposals remain deferred.','', '## Evidence and reproducibility','',f'All five saved summaries match independent log scoring. Same build across all batches: classes {builds[0]["classesSha"]}, cards {builds[0]["cardsSha"]}, deck {builds[0]["deckSha"]}. Raw logs and simulation assets were not modified. Regenerate with `python3 analysis/finalize-baseline500.py`.','', '[Full opponent/pod tables and snapshot totals](BASELINE-500-TABLES.md). [Machine-readable records](BASELINE-500.json). [Additional audit metrics](BASELINE-500-FINAL-AUDIT.json).','', 'The background watcher still omits bNpod filenames; direct logs are the source here. Replay display fixes change presentation, not simulated decisions or game outcomes. Missing full-state data prevents proving every tactical alternative or first-token event; these are documented limitations rather than zero counts.']
(B/'BASELINE-500.md').write_text('\n'.join(lines)+'\n')
(B/'BASELINE-500-FINAL-AUDIT.json').write_text(json.dumps({'sensitivity':sensitivity,'lossReasons':dict(loss_reasons),'jhoiraLifeRiskCases':life_risk,'survivalProxy':dict(survival),'survivalExamples':survival_cases,'castIntervals':intervals,'lossEndpoints':dict(endpoints),'lossEndpointExamples':endpoint_examples,'keeps':dict(keeps),'openingLands':dict(opening_lands),'openingMismatch':opening_mismatch,'verifiedAttackerDamage':dict(outdamage),'jaceHits':dict(hits),'shortageGames':shortage_games,'shortageTurns':shortage_turns,'builds':builds},indent=2))
(R/'gauntlet/versions/jace/BASELINE-500.md').write_text('# Final Jace 500-game evaluation\n\n159/500 corrected wins (31.8%);179 raw wins;55 suspect games scored as draws.\n\n[Read the final evaluation, sensitivity checks, tactics and opponent/pod tables](v0.1-real/BASELINE-500.md).\n')
print('FINAL',W,S,'shortage',shortage_games,shortage_turns,'survival',dict(survival),'endpoints',dict(endpoints),'sensitivity',sensitivity)
