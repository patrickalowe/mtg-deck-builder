"""Copy the latest completed/reviewed C17 batch into replay inputs; no Forge runs."""
from pathlib import Path
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[1];replay=ROOT/'replay';series=ROOT/'gauntlet/versions/wakanda/c17-paired-five-rounds'
rounds=[]
for n in range(1,6):
 p=series/f'round-{n}'
 if (p/'batch.json').exists() and (p/'review.json').exists():
  r=json.loads((p/'review.json').read_text())
  if r.get('reviewed') is True:rounds.append(n)
assert rounds,'No completed reviewed round available'
n=max(rounds);batch=json.loads((series/f'round-{n}/batch.json').read_text());dest=replay/'logs';dest.mkdir(exist_ok=True)
p=replay/'imported-games.json';meta=json.loads(p.read_text()) if p.exists() else {};counts={};excluded=[]
for arm,key in [('before','beforeSummary'),('installed','installedSummary')]:
 summarypath=ROOT/batch[key];s=json.loads(summarypath.read_text());source=summarypath.parent/'logs';count=0
 for trial in s['trials']:
  if trial['suspect']:
   excluded.append({'arm':arm,'trial':trial['id'],'reason':'suspect/timeout'});continue
  stem=f'wakanda-{s["version"]}-smart-politics-c17r{n}-{trial["id"]}-g1'
  log=source/f'{trial["id"]}-g1.log';assert log.exists()
  for suffix in ['.log','.hand.jsonl','.state.jsonl']:
   src=source/f'{trial["id"]}-g1{suffix}'
   if src.exists():shutil.copy2(src,dest/(stem+suffix))
  meta[stem+'.log']={'series':'tchalla-c17','batch':n,'trial':trial['id'],'arm':arm,'label':f'T’Challa · C17 batch {n} · '+('Installed 11 upgrades' if arm=='installed' else 'Before swaps'),'winner':'P' if trial['win'] else trial.get('winner'),'source':str(log.relative_to(ROOT)),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()};count+=1
 counts[arm]=count
p.write_text(json.dumps(meta,indent=2)+'\n');report={'batch':n,'imported':counts,'excluded':excluded};(replay/'latest-tchalla-batch.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
