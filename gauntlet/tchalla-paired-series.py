"""C17: Claude runs a paired round; Codex reviews; only then continue.
No Forge process is started by this supervisor itself. --check is read-only preflight.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,os,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
SERIES=ROOT/'gauntlet/versions/wakanda/c17-paired-five-rounds'
CLAUDE='/Users/patricklowe/.local/bin/claude'
CODEX='/Users/patricklowe/.npm-global/bin/codex'
def stamp():return datetime.datetime.now().astimezone().isoformat(timespec='seconds')
def save(p,value):
 temp=p.with_suffix(p.suffix+'.tmp');temp.write_text(json.dumps(value,indent=2)+'\n');temp.replace(p)
def check_files(m):
 for a in m['arms'].values():
  assert hashlib.sha256((ROOT/a['deck']).read_bytes()).hexdigest()==a['sha256'],'Deck changed: '+a['deck']
 for p,h in m['frozenFiles'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,'Frozen runtime changed: '+p
 for g in m['groups']:
  assert hashlib.sha256((ROOT/g['file']).read_bytes()).hexdigest()==g['sha256'],'Opponent group changed'
  assert hashlib.sha256((ROOT/g['trialsFile']).read_bytes()).hexdigest()==g['trialsSha256'],'Trial schedule changed'
def preflight(m,reviewer='codex'):
 check_files(m);errors=[]
 c=subprocess.run([CLAUDE,'auth','status'],cwd=ROOT,capture_output=True,text=True,timeout=30)
 try:auth=json.loads(c.stdout).get('loggedIn') is True
 except (json.JSONDecodeError,AttributeError):auth=False
 if not auth:errors.append('Claude CLI reports no authenticated session here.')
 if reviewer=='codex':
  c=subprocess.run([CODEX,'login','status'],cwd=ROOT,capture_output=True,text=True,timeout=30)
  if c.returncode or 'Logged in' not in c.stdout+c.stderr:errors.append('Codex CLI authentication is unavailable (use --reviewer claude for solo mode).')
 try:
  c=subprocess.run(['ps','-axo','args='],cwd=ROOT,capture_output=True,text=True,timeout=10)
  if c.returncode:errors.append('Cannot read machine process inventory; shared Forge budget cannot be verified.')
  else:
   n=sum('forge.view.PodSim' in l for l in c.stdout.splitlines())
   if n>=4:errors.append(f'Shared Forge budget full ({n} games). Try again after a slot frees.')
 except (OSError,subprocess.TimeoutExpired):
  errors.append('Cannot read machine process inventory; shared Forge budget cannot be verified.')
 return errors
BATCH_SCHEMA={'type':'object','properties':{'completed':{'type':'boolean'},'round':{'type':'integer'},'beforeSummary':{'type':'string'},'installedSummary':{'type':'string'},'note':{'type':'string'}},'required':['completed','round','beforeSummary','installedSummary','note'],'additionalProperties':False}
REVIEW_SCHEMA={'type':'object','properties':{'reviewed':{'type':'boolean'},'round':{'type':'integer'},'decision':{'type':'string','enum':['continue','needs-fix']},'summary':{'type':'string'},'findings':{'type':'array','items':{'type':'string'}},'beforeSummary':{'type':'string'},'installedSummary':{'type':'string'}},'required':['reviewed','round','decision','summary','findings','beforeSummary','installedSummary'],'additionalProperties':False}
def local_path(s):
 p=(ROOT/s).resolve();assert p.is_relative_to(ROOT),'Output path outside workspace';return p
def validate_batch(obj,n,m):
 assert obj['completed'] and obj['round']==n,'Claude did not report a complete paired round'
 result=[]
 for arm,key in [('before','beforeSummary'),('installed','installedSummary')]:
  p=local_path(obj[key]);s=json.loads(p.read_text());assert s['games']==100,'Each arm requires 100 scheduled games with outcomes';assert s['version']==m['arms'][arm]['version'],'Wrong deck version'
  assert s['gauntlet']==f'b{n}','Wrong opponent group';assert s['smart'] and s['politics'],'Required flags missing'
  assert all(not s.get(k,False) for k in ['keepTokens','holdMana','safeAttack','artifactsFirst','commanderFirst','jaceRealRules','jaceComboAi','pilotV3','pilotV4']),'Unexpected pilot flags'
  assert s['wins']+s['draws']<=100
  logs=p.parent/'logs';assert logs.is_dir(),'Logs missing'
  group=m['groups'][n-1];trials=json.loads((ROOT/group['trialsFile']).read_text())
  assert (p.parent/'trials.json').read_bytes()==(ROOT/group['trialsFile']).read_bytes(),'Trial schedule differs'
  for trial in trials:
   lf=logs/f'{trial["id"]}-g1.log';tf=logs/f'{trial["id"]}-timeout.json'
   finished=lf.exists() and any(l.startswith('Game Result:') for l in lf.read_text().splitlines())
   if not finished:
    assert tf.exists(),'Unplayed/missing trial: '+trial['id'];timeout=json.loads(tf.read_text())
    assert timeout['trialId']==trial['id'] and timeout['seed']==trial['seed'] and timeout['elapsedSeconds']>=600,'Invalid timeout evidence'
    evidence=local_path(timeout['stdoutFile']);assert evidence.exists(),'Timeout stdout missing'
   for k,h in m['expectedBuild'].items():assert s['build'][k]==h,'Frozen build mismatch: '+k
  assert s['build']['deckSha']==m['arms'][arm]['sha256'][:16],'Deck hash mismatch'
  for mark in ['INVALID.txt','ABORTED.txt']:assert not (p.parent/mark).exists(),'Invalid/aborted arm'
  result.append(s)
 assert result[0]['build']['classesSha']==result[1]['build']['classesSha'],'Different pilot builds'
 assert result[0]['build']['cardsSha']==result[1]['build']['cardsSha'],'Different card DBs'
 return result

def claude_review(prompt,rp,out,err):
 """Solo mode: a fresh headless Claude session with READ-ONLY tools reviews the round (independent of the session
 that ran the games) and returns REVIEW_SCHEMA JSON, saved to rp like Codex's -o output."""
 prompt=prompt.replace('You are the authorized Codex X8 reviewer','You are the authorized independent reviewer (solo mode; Codex unavailable)')
 r=subprocess.run([CLAUDE,'-p','--output-format','json','--json-schema',json.dumps(REVIEW_SCHEMA),'--allowedTools','Read','Glob','Grep'],input=prompt,text=True,capture_output=True,cwd=ROOT)
 out.write(r.stdout);err.write(r.stderr)
 if r.returncode:return r.returncode
 w=json.loads(r.stdout);obj=w.get('structured_output')
 if obj is None:
  raw=w.get('result','');obj=json.loads(raw) if isinstance(raw,str) else raw
 save(rp,obj);return 0

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');ap.add_argument('--reviewer',choices=['codex','claude'],default='codex',help='claude = solo mode: a separate read-only headless Claude session reviews each round');args=ap.parse_args();m=json.loads((SERIES/'manifest.json').read_text())
 try:errs=preflight(m,args.reviewer)
 except Exception as e:errs=[str(e)]
 if errs:
  save(SERIES/'status.json',{'status':'preflight-failed','time':stamp(),'gamesStartedBySupervisor':0,'issues':errs});print('\n'.join(errs));return 2
 if args.check:print('Preflight OK; no models or games started.');return 0
 lock=SERIES/'runner.lock'
 try:fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
 except FileExistsError:print('Series lock already exists. Do not run a duplicate.');return 2
 os.write(fd,str(os.getpid()).encode());os.close(fd)
 try:
  for n in range(1,6):
   folder=SERIES/f'round-{n}';folder.mkdir(exist_ok=True);bp=folder/'batch.json';rp=folder/'review.json'
   check_files(m)
   if not bp.exists():
    errs=preflight(m,args.reviewer)
    if errs:raise RuntimeError('; '.join(errs))
    save(SERIES/'status.json',{'status':'claude-running-round','round':n,'time':stamp()})
    prompt=f'''Patrick explicitly authorized C17. Read AGENTS.md, RESUME.md, CLAUDE-TCHALLA-PAIRED-500-TEST.md and gauntlet/versions/wakanda/c17-paired-five-rounds/manifest.json. Run ONLY round {n}: 100 scheduled games per arm, before vs installed, group b{n}, same frozen runtime/flags/seeds/seating. Use the predeclared trials-b{n}.json from the manifest; each trial is a SINGLE PodSim game with tag trial.id and its exact seed. Copy that JSON verbatim to each run folder as trials.json. Use actual named before/installed deck files, and new run folders. Do not use the ordinary5-games-per-pod scheduling command because it lacks this per-game wall timeout and trial mapping. Every trial needs logs/<trialid>-g1.log with Game Result or logs/<trialid>-timeout.json containing trialId,seed,elapsedSeconds>=600,stdoutFile(relative path to preserved stdout). Preserve captured stderr/stdout. Missing/crashed/unplayed games cannot count as completed. Compute normal build hashes exactly as gauntlet.js does; compare expectedBuild in manifest. Deck assumptions are authorized and fully documented; do not ask again or change lists. Check shared process budget, max4 across agents. Do not touch other agents' processes, open browsers, send messages, buy cards or edit frozen engine/card files. Use an isolated series runner if needed to enforce a true 600-second wall timeout on each owned game (single-game subprocesses with predeclared matching trial seeds are acceptable). Record any wrapper/harness hash and all trial seeds in this series folder before first game, then preserve it for subsequent rounds. Never present unplayed/aborted games as valid results; scheduled timeouts are explicit draws. Implement/check deterministic timeout behavior before launching this long round. Keep both arms' opponent/trial schedules identical. Use new run folders under the locked versions; write summary.json with normal games/wins/rawWins/suspect/draws/version/gauntlet/smart/politics/build fields, and all original logs. If game opportunities cannot be completed or required access is unavailable, return completed:false with explanation; no bypassing sandbox or approval controls. Log work in gauntlet/RUNS.md and leave engine ownership clear. Return the required structured result with paths relative to workspace. Do NOT start round{n+1} or launch Codex yourself; this supervisor does the next review. Total intended series1000games, not1000perarm. Read previous round reviews before work.'''
    runner=ROOT/'gauntlet/c17-round.py'
    if runner.exists():
     # Claude-owned round runner (C17): a headless session can't block for a ~1 h round, so the supervisor calls
     # the tested runner directly (per-game 610 s wall kill, trial mapping, summaries). Original kept in the series folder.
     with (folder/'runner-stdout.log').open('w') as out:
      rc=subprocess.run([sys.executable,str(runner),'--round',str(n)],stdout=out,stderr=subprocess.STDOUT,cwd=ROOT).returncode
     if rc:raise RuntimeError(f'c17-round.py failed round{n}; see round-{n}/runner-stdout.log. No next round started.')
     obj=json.loads((folder/'runner-result.json').read_text())
    else:
     with (folder/'claude-output.json').open('w') as out,(folder/'claude-stderr.log').open('w') as err:
      rc=subprocess.run([CLAUDE,'-p','--output-format','json','--json-schema',json.dumps(BATCH_SCHEMA),'--permission-mode','acceptEdits','--allowedTools','Read','Write','Edit','Bash','Glob','Grep'],input=prompt,text=True,stdout=out,stderr=err,cwd=ROOT).returncode
     if rc:raise RuntimeError(f'Claude failed round{n}; see stderr/log. No next round started.')
     wrapper=json.loads((folder/'claude-output.json').read_text());obj=wrapper.get('structured_output')
     if obj is None:
      raw=wrapper.get('result','');obj=json.loads(raw) if isinstance(raw,str) else raw
    validate_batch(obj,n,m);save(bp,obj)
   batch=json.loads(bp.read_text());validate_batch(batch,n,m);check_files(m)
   if not rp.exists():
    save(SERIES/'status.json',{'status':'codex-reviewing-round','round':n,'time':stamp()});schema=folder/'review-schema.json';save(schema,REVIEW_SCHEMA)
    prompt=f'''You are the authorized Codex X8 reviewer for C17 round{n}. Read AGENTS.md, the C17 brief, manifest and {bp.relative_to(ROOT)}. Read both completed run summaries, logs and hand streams and prior round reviews. Do not run simulations, modify files, make purchases or change engine behavior. Evaluate corrected and raw outcomes, timeouts/suspects, paired shared clean trials and nominal uncertainty, cumulative results by group, actual commander survival/combat/evasion/mana, added-card usage and AI limitations. Trace at least2 concrete cases and distinguish recorded facts from unavailable data. Any timed-out synthetic result must be backed by original stdout/timeout evidence and not reported as an ordinary simulated finish. Verify the same locked decks, runtime hashes and predeclared trial seeds were used in both arms. Return reviewed:true only after completing review, decision:continue if the comparison is valid even if its gains are weak/negative, or needs-fix for a substantive validity issue. Repeat the exact beforeSummary and installedSummary paths from batch.json. Do not mark a favorable result as proven from one batch or rerun to chase significance. Shared markdown notes alone do not drive this process: the supervisor consumes your structured review before continuing.'''
    with (folder/'codex-stdout.jsonl').open('w') as out,(folder/'codex-stderr.log').open('w') as err:
     if args.reviewer=='codex':
      rc=subprocess.run([CODEX,'exec','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--output-schema',str(schema),'-o',str(rp),prompt],cwd=ROOT,stdout=out,stderr=err).returncode
     else:
      rc=claude_review(prompt,rp,out,err)
    if rc:raise RuntimeError(f'{args.reviewer} review failed round{n}; no next round started.')
   review=json.loads(rp.read_text());assert review['reviewed'] is True and review['round']==n
   assert review['beforeSummary']==batch['beforeSummary'] and review['installedSummary']==batch['installedSummary'],'Review points to a different batch'
   (folder/'review.md').write_text(f'# Codex review — round{n}\n\n'+review['summary']+'\n\n'+'\n'.join('- '+f for f in review['findings'])+'\n')
   if review['decision']!='continue':raise RuntimeError(f'Round{n} needs a validity fix; see review.md. No next round started.')
   with (ROOT/'gauntlet/RUNS.md').open('a') as f:f.write(f'\n{stamp()} · C17 supervisor · round{n} reviewed by Codex; continue checkpoint satisfied. See {rp.relative_to(ROOT)}.\n')
  last=json.loads((SERIES/'round-5/review.json').read_text())
  (SERIES/'FINAL-REVIEW.md').write_text('# T’Challa five-round comparison — final review\n\n'+last['summary']+'\n\n'+'\n'.join('- '+f for f in last['findings'])+'\n\n'+'\n'.join(f'[Round {j} review](round-{j}/review.md)' for j in range(1,6))+'\n')
  save(SERIES/'status.json',{'status':'complete','reviewedRounds':5,'scheduledGames':1000,'time':stamp()});print('All five paired rounds completed and reviewed.')
 except Exception as e:
  save(SERIES/'status.json',{'status':'stopped','reason':str(e),'time':stamp()});print(str(e));return 2
 finally:lock.unlink(missing_ok=True)
 return 0
if __name__=='__main__':sys.exit(main())
