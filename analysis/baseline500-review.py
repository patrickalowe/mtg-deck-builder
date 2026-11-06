"""Read completed C16 logs only; write dated interim/final analysis outside run folders."""
from pathlib import Path
import json,re,collections,math,statistics,hashlib,datetime
ROOT=Path(__file__).resolve().parents[1]; BASE=ROOT/'gauntlet/versions/jace/v0.1-real'; OUT=BASE/'BASELINE-500.md'
me='Ai(1)-jace-v0.1-real'
def interval(w,n):
 if not n:return '—'
 z=1.96;p=w/n;d=1+z*z/n;c=(p+z*z/(2*n))/d;h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
 return f'{100*(c-h):.1f}–{100*(c+h):.1f}%'
def med(xs):return f'{statistics.median(xs):g}' if xs else '—'
records=[];batches={};configs={};damage_in=collections.Counter();damage_out=collections.Counter();loss_examples={}
for i in range(1,6):
 cfg=json.loads((ROOT/f'gauntlet/gauntlet-b{i}.json').read_text());configs[i]=cfg
 pods={p['id']:p for p in cfg['pods']}
 for run in sorted((BASE/'runs').glob(f'*-pilotv4-b{i}-*-100')):
  if any((run/n).exists() for n in ['INVALID.txt','ABORTED.txt']):continue
  for log in sorted((run/'logs').glob('*.log')):
   text=log.read_text();lines=text.splitlines();result=[l for l in lines if l.startswith('Game Result:')]
   if not result:continue
   m=re.search(r'ended in (\d+) ms',result[-1]);runtime=int(m[1]) if m else None
   win=me in result[-1] and 'has won' in result[-1];outcomes=[l for l in lines if l.startswith('Game Outcome:') and 'has won' in l]
   suspect=bool(runtime is not None and runtime>=600000) or (bool(outcomes) and win!=(me in outcomes[-1]))
   winner=re.search(r'Ai\((\d)\)-b3-(\d+) has won',result[-1]);pid=log.stem.rsplit('-g',1)[0];pod=pods.get(pid,{})
   ev=[];q=log.with_suffix('.jace.jsonl')
   if q.exists():
    for line in q.read_text().splitlines():
     try:ev.append(json.loads(line))
     except json.JSONDecodeError:pass
   summary=next((e for e in reversed(ev) if e.get('ev')=='summary'),{})
   loss=next((l.split('has lost',1)[1].strip() for l in lines if l.startswith('Game Outcome: '+me+' has lost')),None)
   r={'batch':i,'pod':pid,'game':log.stem,'source':str(log.relative_to(ROOT)),'run':run.name,'win':win and not suspect,'rawWin':win,'suspect':suspect,'runtime':runtime,'opponents':pod.get('opponents',[]),'winnerId':winner[2] if winner else None,'lossReason':loss,'summary':summary,'events':dict(collections.Counter(e['ev'] for e in ev)),'plusReasons':dict(collections.Counter(e.get('because','unknown') for e in ev if e.get('ev')=='jace_plus1')),'shortageTurns':len({e.get('pt') for e in ev if e.get('ev')=='jace_plus1' and e.get('because')=='no_tokens_or_targets'}),'snapshots':[e for e in ev if e.get('ev')=='snapshot']}
   records.append(r)
   if not suspect:
    for line in lines:
     m=re.match(r'Damage: (.+?) \(\d+\) deals (\d+) (combat|non-combat) damage to (.+)',line)
     if not m:continue
     if m[4].startswith(me):damage_in[m[1]]+=int(m[2])
    # Outgoing ownership cannot be established reliably for every source from plain text.
    if loss:loss_examples.setdefault(loss,r['source'])
  batches[i]=run.name
N=len(records);W=sum(r['win'] for r in records);S=sum(r['suspect'] for r in records);raw=sum(r['rawWin'] for r in records)
lines=['# Jace 500-game baseline — '+('FINAL' if N==500 else 'INTERIM'),'',f'Generated {datetime.datetime.now().astimezone().isoformat(timespec="seconds")}. Completed logs: **{N}/500**. Physical deck unchanged; pilot v4. Only completed logs from the five new opponent-group cohorts are included. INVALID/ABORTED runs are excluded.','',f'Corrected wins **{W}/{N}** ({100*W/N:.1f}%; nominal Wilson 95% interval {interval(W,N)}). Raw reported wins {raw}; suspect games {S}, scored as draws. Excluding suspects entirely: {W}/{N-S}. These are different denominators, not different wins.','', '## Scope and comparability','', 'Each batch has different opponents. This measures performance across these configured groups; it is not a matched improvement test against the old gauntlet. Deck exports and AI competence are not a verified representative sample of all bracket-3 tables. Opponent group, pod composition and seeds change together, so batch differences cannot identify a single cause. The nominal interval treats games as independent; shared pods/seeds/opponents create clustering, so it understates some uncertainty. Do not extrapolate an incomplete first batch to all 500 games.','', '| Batch | Completed | Corrected wins | Raw wins | Suspect | Nominal 95% interval |','|---|---:|---:|---:|---:|---|']
for i in range(1,6):
 rr=[r for r in records if r['batch']==i];w=sum(r['win'] for r in rr);lines.append(f'| {i} | {len(rr)}/100 | {w} | {sum(r["rawWin"] for r in rr)} | {sum(r["suspect"] for r in rr)} | {interval(w,len(rr))} |')
lines+=['','## Jace engine and mana','', 'Telemetry below excludes suspect games. Events are not automatically unique turns or strategic opportunities. Missing summary/snapshot data is not interpreted as zero.']
clean=[r for r in records if not r['suspect']];ss=[r['summary'] for r in clean if r['summary']];events=sum((collections.Counter(r['events']) for r in clean),collections.Counter())
lines += ['',f'- Telemetry summaries: {len(ss)} clean games. First Jace cast median personal turn: {med([s["first_jace_cast"] for s in ss if s.get("first_jace_cast",-1)>=0])}. First −3 median: {med([s["first_minus3"] for s in ss if s.get("first_minus3",-1)>=0])}.',f'- Games with no Jace cast: {sum(s.get("first_jace_cast",-1)<0 for s in ss)}; no resolved −3: {sum(s.get("minus3_resolved",0)==0 for s in ss)}.',f'- Resolved −3: {sum(s.get("minus3_resolved",0) for s in ss)}; custom +1 policy events: {events["jace_plus1"]}; recorded minus3 hit events: {events["minus3_hit"]}. These are not all inferred card casts.',f'- Summary no-token/target decline events: {sum(s.get("declines",{}).get("no_tokens_or_targets",0) for s in ss)}. Coverage is not verified under v4 interception: a zero here DOES NOT establish that no shortage occurred; audit opportunity logging before interpreting it.',f'- Walker-block policy events: {events["walker_block"]}; unblocked diagnostic events: {events["walker_unblocked"]}. Repeated decision callbacks may inflate diagnostics.',f'- Combo assemblies: {sum(s.get("combo_assembled",-1)>=0 for s in ss)}; loop-step events: {events["loop_step"]}. Assembly alone is not a loop-caused win.']
for turn in [4,5,6]:
 snaps=[s for r in clean for s in r['snapshots'] if s.get('pt')==turn]
 if snaps:lines.append(f'- Start-main turn {turn}: {len(snaps)} snapshots; mean lands {statistics.mean(s["lands"] for s in snaps):.2f}; any creature tokens {sum(s.get("creature_tokens",0)>0 for s in snaps)}/{len(snaps)}. Does not measure first token turn or usable colors.')
lines += ['', f'- Custom +1 fallbacks attributed to no targets: {sum(r.get("plusReasons",{}).get("no_tokens_or_targets",0) for r in clean)}; unique personal-turn/game pairs with that reason: {sum(r.get("shortageTurns",0) for r in clean)}. This proves observed shortages despite empty summary decline maps; it is a lower bound on opportunities, not all ready turns.']
lines+=['','## Opponent and pod results','', 'A win “with opponent present” belongs to the whole pod; it is not a head-to-head win rate. Small per-opponent samples should not be ranked confidently.','', '| Batch / opponent | Appearances | Jace wins with opponent present | Opponent wins |','|---|---:|---:|---:|']
for i,cfg in configs.items():
 for oid,name in cfg['decks'].items():
  rr=[r for r in clean if r['batch']==i and oid in r['opponents']]
  if rr:lines.append(f'| {i}: {name} | {len(rr)} | {sum(r["win"] for r in rr)} | {sum(r["winnerId"]==oid for r in rr)} |')
lines+=['','| Pod | Clean games | Jace wins |','|---|---:|---:|']
for pod in sorted({r['pod'] for r in clean}):
 rr=[r for r in clean if r['pod']==pod];lines.append(f'| {pod} | {len(rr)} | {sum(r["win"] for r in rr)} |')
lines+=['','## Damage and remaining review','', 'Largest logged sources of damage to Patrick (all controllers, includes painlands; damage is not synonymous with the cause of loss):','']
for card,n in damage_in.most_common(10):lines.append(f'- {card}: {n} logged damage.')
lines+=['','Loss outcome examples (not causal categories):','']
for reason,source in list(loss_examples.items())[:5]:lines.append(f'- {reason}: `{source}`.')
lines+=['','**Not yet established:** first-token timing, Jace survival to next personal turn and precise death attribution, outgoing finisher ownership, color screw and mulligan quality, or three-to-five causal loss patterns. Those require deeper turn/card-identity review; incoming damage totals and outcome lines cannot establish them. Completed per-batch review will supplement this snapshot.','', 'No card swaps or purchases are justified from this baseline alone. Keep all existing human-play/AI limitations in JACE-PILOT-AUDIT.md in view.']
lines += ['', 'Detailed checked cases: [BASELINE-500-CASES.md](../BASELINE-500-CASES.md).']
OUT.write_text('\n'.join(lines)+'\n');OUT.with_suffix('.json').write_text(json.dumps({'records':records,'runs':batches,'planned':500},indent=2));print(f'{N}/500; corrected {W}, raw {raw}, suspect {S}; wrote {OUT}')
