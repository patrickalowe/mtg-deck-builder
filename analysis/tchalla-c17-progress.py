"""Read completed/reviewed C17 rounds; never changes runner gates or simulations."""
from pathlib import Path
import json,hashlib,math,re,collections,datetime
R=Path(__file__).resolve().parents[1];S=R/'gauntlet/versions/wakanda/c17-paired-five-rounds';m=json.loads((S/'manifest.json').read_text())
for a in m['arms'].values():assert hashlib.sha256((R/a['deck']).read_bytes()).hexdigest()==a['sha256']
for p,h in m['frozenFiles'].items():assert hashlib.sha256((R/p).read_bytes()).hexdigest()==h,p
pairs=collections.Counter();totals={'before':collections.Counter(),'installed':collections.Counter()};rounds=[];source_issues=[]
for n in range(1,6):
 folder=S/f'round-{n}';bp=folder/'batch.json';rp=folder/'review.json'
 if not bp.exists() or not rp.exists():continue
 batch=json.loads(bp.read_text());review=json.loads(rp.read_text());assert review['reviewed'] is True and review['decision']=='continue' and review['round']==n
 arms={}
 for arm,key in [('before','beforeSummary'),('installed','installedSummary')]:
  assert review[key]==batch[key];p=R/batch[key];summary=json.loads(p.read_text());schedule=json.loads((S/f'trials-b{n}.json').read_text())
  assert (p.parent/'trials.json').read_bytes()==(S/f'trials-b{n}.json').read_bytes()
  assert summary['games']==100 and len(summary['trials'])==100
  assert summary['build']['deckSha']==m['arms'][arm]['sha256'][:16]
  for k,v in m['expectedBuild'].items():assert summary['build'][k]==v
  trials={t['id']:t for t in summary['trials']};assert set(trials)=={t['id'] for t in schedule}
  for t in schedule:
   tr=trials[t['id']];assert tr['seed']==t['seed']
   log=p.parent/'logs'/f'{t["id"]}-g1.log'
   if log.exists():
    text=log.read_text();lines=text.splitlines();result=[l for l in lines if l.startswith('Game Result:')];assert result,log
    rawwin='Ai(1)' in result[-1] and 'has won' in result[-1]
    dur=re.search(r'ended in (\d+) ms',result[-1]);winners=[l for l in lines if re.match(r'^Game Outcome: Ai\(\d\)\S* has won\b',l)]
    suspect=(dur and int(dur[1])>=600000) or len(winners)>1 or (winners and rawwin!=('Ai(1)' in winners[-1]))
    assert bool(tr['suspect'])==bool(suspect),(log,'suspect mismatch')
    assert tr['win']==(rawwin and not suspect),(log,'win mismatch')
   else:
    timeout=p.parent/'logs'/f'{t["id"]}-timeout.json';assert timeout.exists(),log
    evidence=json.loads(timeout.read_text());assert evidence['elapsedSeconds']>=600
    assert not tr['win'] and tr['suspect']
  assert summary['wins']==sum(t['win'] for t in trials.values())
  totals[arm].update({'games':100,'wins':summary['wins'],'rawWins':summary['rawWins'],'suspect':summary['suspect'],'timeouts':summary['timeouts']})
  arms[arm]=trials
  if arm=='before':before=summary
  else:installed=summary
 clean=[k for k in arms['before'] if not arms['before'][k]['suspect'] and not arms['installed'][k]['suspect']]
 pc=collections.Counter((bool(arms['before'][k]['win']),bool(arms['installed'][k]['win'])) for k in clean);pairs.update(pc)
 rounds.append({'round':n,'beforeWins':before['wins'],'installedWins':installed['wins'],'beforeSuspect':before['suspect'],'installedSuspect':installed['suspect'],'cleanPairs':len(clean),'installedOnly':pc[(False,True)],'beforeOnly':pc[(True,False)]})
n=sum(pairs.values());b=pairs[(True,False)];c=pairs[(False,True)];discordant=b+c
pvalue=min(1,2*sum(math.comb(discordant,k) for k in range(min(b,c)+1))/2**discordant) if discordant else 1
lines=['# T’Challa comparison — reviewed progress','',f'Updated {datetime.datetime.now().astimezone().isoformat(timespec="seconds")}. This audit includes only completed rounds with valid Codex continue checkpoints. No simulations or gates were started/modified.','', '| Reviewed round | Before wins /100 | Installed wins /100 | Suspect before / installed | Shared clean trials |','|---|---:|---:|---:|---:|']
for row in rounds:lines.append(f'| {row["round"]} | {row["beforeWins"]} | {row["installedWins"]} | {row["beforeSuspect"]} / {row["installedSuspect"]} | {row["cleanPairs"]} |')
lines+=['', f'**Cumulative:** before {totals["before"]["wins"]}/{totals["before"]["games"]}; installed {totals["installed"]["wins"]}/{totals["installed"]["games"]}. Raw wins: {totals["before"]["rawWins"]} vs {totals["installed"]["rawWins"]}; suspect draws {totals["before"]["suspect"]} vs {totals["installed"]["suspect"]}.','',f'Across {n} shared clean trials, installed-only wins {c}, before-only {b}, both win {pairs[(True,True)]}, neither {pairs[(False,False)]}. Exact two-sided McNemar p={pvalue:.4f}. The observed lead is encouraging but inconclusive; repeated interim inspection, shared pods and AI timing limit nominal inference. Finish the predeclared series without tuning decks or rerunning favorable seeds.','', '## What the existing reviews establish','', '- All eleven installed upgrades received actual casts in the completed rounds. Akroma’s Will can supply useful combat keywords; Mystic Forge can sustain artifact casting; Nettlecyst can scale equipment threats. The bundle comparison cannot isolate which single card caused the improvement.', '- Equipment reassignment, commander protection and combat decisions remain imperfect. In round3 b3pod14-c2, T’Challa attacked, dealt4to Tom,Bert,andWilliam, took5and died; the deck later rebuilt and won. A win does not make every tactical choice optimal.', '- Round3 b3pod07-c5 demonstrates a real army finish through Akroma’s Will double strike after T’Challa had died to negative toughness. It is not proof that the commander survived or that flying bypassed already-declared blockers.', '- One round3 installed duration suspect coincided with system sleep; existing conservative >=600second scoring is retained. Do not call every long result a synthetic timeout. Other suspect games show Forge’s invalid attack-declaration loop; external wall timeout evidence exists for one round2 before trial.', '- Full-state recording is absent, so exact continuous survival, complete legal blocks and exact mana payment cannot be reconstructed. Specific green-access problems are documented, but no general color-screw rate is established.', '- Divine Visitation in both arms and the Forsaken/Panther Idol cut remain authorized modeling assumptions. Ghostly Prison and Reconnaissance are NOT in the locked installed11 arm. Their receipt does not silently change this comparison.','', '## Validation and next step','', 'Source deck hashes, frozen files, trial schedules, builds and all completed-game outcomes were independently checked here; missing completed logs were accepted only with explicit timeout evidence. Per-round read-only Codex reviews remain the official continuation checkpoints. The current round may still be running; this file does not advance or restart it.','', 'Continue the existing supervisor. No purchase recommendation or additional physical swap follows from this interim lead. Jace testing remains closed.']
if len(rounds)==5:
 lines=[line.replace('The observed lead is encouraging but inconclusive; repeated interim inspection, shared pods and AI timing limit nominal inference. Finish the predeclared series without tuning decks or rerunning favorable seeds.', 'The completed series favors the installed package under this Forge pilot; shared pods, repeated interim inspection and AI timing limit nominal inference. No additional runs are scheduled.').replace('The current round may still be running; this file does not advance or restart it.', 'All five rounds and review checkpoints are complete.').replace('Continue the existing supervisor. No purchase recommendation or additional physical swap follows from this interim lead. Jace testing remains closed.', 'The fixed series is complete. See FINAL-REVIEW.md for the detailed conclusion. No additional purchase or physical swap follows automatically. Jace testing remains closed.') for line in lines]
(S/'PROGRESS-REVIEW.md').write_text('\n'.join(lines)+'\n');(S/'PROGRESS-REVIEW.json').write_text(json.dumps({'rounds':rounds,'totals':{k:dict(v) for k,v in totals.items()},'cleanPairs':n,'pairedCounts':{str(k):v for k,v in pairs.items()},'mcnemarP':pvalue},indent=2));print(json.dumps({'rounds':len(rounds),'totals':{k:dict(v) for k,v in totals.items()},'cleanPairs':n,'mcnemarP':pvalue}))
