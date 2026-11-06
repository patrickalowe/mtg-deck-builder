#!/usr/bin/env node
'use strict';
// Reads Forge outputs only. All writes stay in the selected reviews directory.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const JACE = 'Jace, Multiverse Architect';
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const dirNames = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory() && !d.isSymbolicLink()).map(d => d.name).sort() : [];
const invalid = dir => ['INVALID.txt', 'ABORTED.txt'].some(n => fs.existsSync(path.join(dir, n)));
const atomic = (file, text) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); };
const inc = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };
const refs = text => [...text.matchAll(/(?:^|, | and )(.+?) \((\d+)\)(?=, | and |$)/g)].map(m => ({ name: m[1], id: m[2] }));
const tokenName = name => /\bToken\b/.test(name) || ['Kobolds of Kher Keep', 'Cadet'].includes(name);
const esc = text => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
function parseGame(text, handText = '', meta = {}, ownNames = []) {
  const lines = text.split(/\r?\n/);
  const ri = lines.findLastIndex(l => l.startsWith('Game Result:'));
  if (ri < 0 || !text.endsWith('\n')) return null;
  const result = lines[ri];
  const winnerMatch = result.match(/Ai\((\d+)\)-(.+?) has won/);
  if (!winnerMatch && !/Draw/i.test(result)) return null;
  const elapsed = result.match(/(?:ended in |Took )(\d+) ms/);
  const runtimeMs = elapsed ? +elapsed[1] : null;
  const explicitDraw = /Draw/i.test(result);
  const timeoutSuspected = runtimeMs !== null && runtimeMs >= 599000;
  const gameOutcomes = lines.filter(l => l.startsWith('Game Outcome: Ai('));
  const multipleWinners = gameOutcomes.filter(l => l.includes('has won')).length > 1;
  const flags = [];
  if (timeoutSuspected) flags.push('near_600_second_timeout');
  if (multipleWinners) flags.push('multiple_players_reported_winners');
  const suspicious = timeoutSuspected || multipleWinners;
  let turn = 0, round = 0, commanderCasts = 0;
  const casts = [], played = [], minus3 = [], combat = [], zoneDeaths = [], damage = [], knownControllers = new Map();
  const tokens = { attacks: 0, attackDeclarations: 0, blocks: 0, blockDeclarations: 0, knownControlledDeaths: 0, unknownOwnerDeaths: 0, allPlayersDeaths: 0, limitation: 'Token counts use named tokens and IDs visible in logs. Death ownership is known only after logged control evidence; no attack/block count proves power <=2. Counts are appearances/events, not unique creatures.' };
  let ownLoss = null;
  for (let i = 0; i < ri; i++) {
    const line = lines[i];
    let m = line.match(/^Turn: Turn (\d+)/);
    if (m) { turn = +m[1]; round = Math.ceil(turn / 4); }
    m = line.match(/^Add To Stack: Ai\(1\)\S* cast (.+?)(?: targeting \[.*\])?$/);
    if (m) { casts.push({ card: m[1], turn, round, line: i + 1 }); if (m[1] === JACE) commanderCasts++; }
    m = line.match(/^Land: Ai\(1\)\S* played (.+) \((\d+)\)$/);
    if (m) played.push({ card: m[1], id: m[2], turn, round, line: i + 1 });
    if (line.startsWith('Resolve Stack: Jace, Multiverse Architect (') && /Ai\(1\).*reveals cards from their library/.test(line)) {
      const activationIndex = (() => { for (let j = i - 1; j >= Math.max(0, i - 15); j--) if (/^Add To Stack: Ai\(1\).* activated Jace, Multiverse Architect$/.test(lines[j])) return j; return -1; })();
      const exiles = [];
      if (activationIndex >= 0) {
        // Only the immediate cost zone changes before activation are eligible. Do not steal an unrelated removal event.
        for (let j = activationIndex - 1; j >= Math.max(0, activationIndex - 8); j--) {
          const x = lines[j].match(/^Zone Change: (.+) \((\d+)\) was put into Exile from Battlefield\.$/);
          if (!x) break;
          exiles.push({ card: x[1], id: x[2], line: j + 1, attribution: 'adjacent_cost_inference' });
          if (tokenName(x[1])) knownControllers.set(x[2], 1);
        }
      }
      const candidates = [];
      for (let j = i + 1; j < Math.min(ri, i + 14); j++) {
        if (/^(Phase:|Turn:|Combat:|Add To Stack: .* (cast|activated) )/.test(lines[j])) break;
        const trigger = lines[j].match(/^Add To Stack: Ai\(1\)\S* triggered (.+?)(?: targeting \[.*\])?$/);
        const repl = lines[j].match(/^Replacement Effect: (.+?) enters/);
        const c = trigger?.[1] || repl?.[1];
        if (c && c !== JACE && ownNames.includes(c)) candidates.push({ card: c, line: j + 1, inference: 'followup_trigger_or_entry_text_not_proof' });
      }
      minus3.push({ turn, round, line: i + 1, exiled: exiles.length ? exiles : null, hit: null, hitCandidates: candidates, limitation: 'Ordinary Forge text does not reliably log the revealed card. Hit stays null; follow-up triggers are clues only.' });
    }
    m = line.match(/^(?:Combat: )?Ai\((\d+)\)\S* assigned (.+) to (attack|block) (.+)\.$/);
    if (m) {
      const controllers = refs(m[2]);
      for (const c of controllers) knownControllers.set(c.id, +m[1]);
      if (+m[1] === 1) {
        const ts = controllers.filter(c => tokenName(c.name));
        if (ts.length) {
          tokens[m[3] === 'attack' ? 'attacks' : 'blocks'] += ts.length;
          tokens[m[3] === 'attack' ? 'attackDeclarations' : 'blockDeclarations']++;
          combat.push({ action: m[3], tokens: ts, target: m[4], turn, line: i + 1 });
        }
      }
    }
    m = line.match(/^Zone Change: (.+) \((\d+)\) was put into Graveyard from Battlefield\.$/);
    if (m && tokenName(m[1])) {
      const controller = knownControllers.get(m[2]) ?? null;
      tokens.allPlayersDeaths++;
      if (controller === 1) tokens.knownControlledDeaths++;
      else if (controller === null) tokens.unknownOwnerDeaths++;
      zoneDeaths.push({ card: m[1], id: m[2], lastKnownController: controller, turn, line: i + 1 });
    }
    m = line.match(/^Damage: (.+) \((\d+)\) deals (\d+) (combat|non-combat) damage to (.+)\.$/);
    if (m) damage.push({ source: m[1], id: m[2], amount: +m[3], combat: m[4] === 'combat', target: m[5], toJacePlayer: /^Ai\(1\)-/.test(m[5]), sourceLastKnownController: knownControllers.get(m[2]) ?? null, turn, round, line: i + 1 });
    if (/^Game Outcome: Ai\(1\).* has lost because /.test(line)) ownLoss = { reason: line.split(' has lost because ')[1], line: i + 1 };
  }
  const snapshots = [], seen = new Set();
  let malformedHandLines = 0;
  for (const raw of handText.split(/\r?\n/).filter(Boolean)) {
    try { const s = JSON.parse(raw); if (!Array.isArray(s.hand)) throw Error('missing hand'); snapshots.push(s); for (const [, name] of s.hand) seen.add(name); }
    catch { malformedHandLines++; }
  }
  if (malformedHandLines) flags.push('malformed_hand_snapshot');
  if (!snapshots.length) flags.push('hand_snapshots_missing');
  const castCounts = {}; for (const c of casts) inc(castCounts, c.card);
  const playedNames = new Set(played.map(c => c.card));
  const lastHand = snapshots.at(-1)?.hand.map(([id, card]) => ({ id, card })) ?? null;
  const seenNeverCast = [...seen].filter(c => !castCounts[c] && !playedNames.has(c)).sort();
  const incoming = damage.filter(d => d.toJacePlayer);
  const sums = {}; for (const d of incoming) inc(sums, d.source, d.amount);
  const ownDamage = damage.filter(d => d.sourceLastKnownController === 1 && /^Ai\([234]\)-/.test(d.target));
  const dealtSums = {}; for (const d of ownDamage) inc(dealtSums, d.source, d.amount);
  const biggestKnownOwnSources = Object.entries(dealtSums).map(([card,amount]) => ({card,amount})).sort((a,b)=>b.amount-a.amount).slice(0,8);
  const biggestDamageSources = Object.entries(sums).map(([card, amount]) => ({ card, amount })).sort((a,b) => b.amount-a.amount).slice(0, 8);
  const reportedWin = winnerMatch ? +winnerMatch[1] === 1 : false;
  const disposition = suspicious ? 'suspect_result' : explicitDraw ? 'draw' : reportedWin ? 'jace_win' : 'jace_loss';
  const review = [];
  if (suspicious) review.push('Result held out of clean win-rate counts: timeout or conflicting winner records.');
  else if (reportedWin) review.push('Jace is the logged winner; casts and damage are evidence of activity, not proof of which card caused the win.');
  else if (explicitDraw) review.push('Game ended in a logged draw.');
  else review.push(`Jace lost${ownLoss ? ': '+ownLoss.reason : '; exact loss reason unavailable'}.`);
  if (reportedWin && biggestKnownOwnSources.length) review.push('Largest logged damage to opponents from last-known Jace-controlled combat sources: '+biggestKnownOwnSources.slice(0,3).map(d=>`${d.card} ${d.amount}`).join('; ')+'.');
  if (biggestDamageSources.length) review.push('Largest logged damage to Jace: '+biggestDamageSources.slice(0,3).map(d=>`${d.card} ${d.amount}`).join('; ')+'.');
  if (minus3.length) review.push(`Jace -3 resolved ${minus3.length} time(s). Revealed hits are unavailable in ordinary logs; candidates are not confirmations.`);
  else review.push(`No resolved Jace -3 detected; commander cast ${commanderCasts} time(s).`);
  const aiReviewCandidates = [];
  for (const card of ['Toxic Deluge','Sunfall','Synthetic Destiny','Overwrite the Multiverse']) if (seenNeverCast.includes(card)) aiReviewCandidates.push({ card, issue: 'seen_but_never_cast', confidence: 'review_candidate_only', reason: 'Known AI limitation; hand presence does not establish castability or a mistake.' });
  if (lastHand?.some(c=>['Aetherize','Clever Concealment','Swords to Plowshares','Path to Exile','Despark','Reality Shift'].includes(c.card)) && !reportedWin) aiReviewCandidates.push({ issue: 'reactive_card_in_last_hand', confidence: 'review_candidate_only', reason: 'Check mana, targets, timing and prior responses before calling this a misplay.' });
  return { schemaVersion: 2, ...meta, reviewedAt: new Date().toISOString(), resultLine: result, winner: winnerMatch ? { seat:+winnerMatch[1], deck:winnerMatch[2] } : null, disposition, reportedWin, explicitDraw, runtimeMs, timeoutSuspected, multipleWinners, flags, turns: turn, rounds: round, roundMethod: 'ceil(global turn counter / 4), same as gauntlet.js; not exact personal turns after eliminations', jace: { casts: commanderCasts, recasts: Math.max(0, commanderCasts-1), minus3Uses: minus3.length, minus3 }, tokens: { ...tokens, combat, deaths: zoneDeaths }, cards: { castCounts, castEvents: casts, landsPlayed: played, seenInHand: [...seen].sort(), seenNeverCastOrPlayed: seenNeverCast, lastRecordedHand: lastHand, lastNonemptySnapshot: snapshots.findLast(s=>s.hand.length) ?? null, handSnapshots: snapshots.length, malformedHandLines, limitation: 'Last recorded hand may precede elimination. Seen but uncast is not proof of being stranded or misplayed; cheats into play are not casts.' }, damage: { biggestSourcesToJace: biggestDamageSources, biggestKnownJaceSourcesToOpponents: biggestKnownOwnSources, finalKnownOwnDamageEvents: ownDamage.slice(-8), finalIncomingEvents: incoming.slice(-8) }, jaceLoss: ownLoss, automatedReview: review, aiReviewCandidates };
}
function readFeed(file) {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf8');
  const end = data.lastIndexOf('\n') + 1;
  // A killed process may leave one torn append; preserve all complete records only.
  if (end !== data.length) fs.truncateSync(file, Buffer.byteLength(data.slice(0,end)));
  return data.slice(0,end).split('\n').filter(Boolean).map((s,i)=>{ try {return JSON.parse(s);} catch {throw Error(`Corrupt feed record ${i+1}; refusing to hide it`);} });
}
function discover(versions) {
  const out = [];
  for (const version of dirNames(versions)) for (const run of dirNames(path.join(versions, version, 'runs'))) {
    const runDir = path.join(versions, version, 'runs', run);
    if (invalid(runDir)) continue;
    const logs = path.join(runDir,'logs');
    if (!fs.existsSync(logs)) continue;
    for (const ent of fs.readdirSync(logs, {withFileTypes:true})) {
      if (!ent.isFile() || !/^pod\d+-g\d+\.log$/.test(ent.name)) continue;
      const file=path.join(logs,ent.name), m=ent.name.match(/^(pod\d+)-g(\d+)\.log$/);
      out.push({version,run,runDir,file,pod:m[1],game:+m[2],key:`${version}/${run}/${ent.name}`});
    }
  }
  return out.sort((a,b)=>a.key.localeCompare(b.key));
}
function ownCards(versions,version) {
  const file=path.join(versions,version,'deck.dck');
  return fs.existsSync(file) ? fs.readFileSync(file,'utf8').split('\n').map(l=>l.match(/^\d+ (.+)$/)?.[1]).filter(Boolean) : [];
}
function writeSummary(out, records, versions, status) {
  const active=records.filter(r=>!invalid(path.join(versions,r.version,'runs',r.run)));
  const excluded=records.length-active.length;
  const groups=new Map();
  for(const r of active){const key=r.version+'/'+r.run;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  const lines=['# Live Jace game review','',`Updated ${new Date().toISOString()}. Poll every ${status.intervalMs/1000} seconds. Process ${status.pid}.`,'', '**This is an automatically extracted evidence summary, not a continuously running Codex reasoning session.** Detailed Codex reviews are recorded separately in CODEX-REVIEW.md. No simulations or engine edits are performed by this watcher.','',`Indexed ${records.length} completed games; ${active.length} currently eligible; ${excluded} excluded because their run was later marked INVALID/ABORTED. Historical runs are separate cohorts, never pooled into one win rate.`,'','Clean counts below hold suspect timeout/conflicting-winner games out entirely. They are provisional diagnostics, not repaired official results. The final-hand and AI-candidate fields cannot establish castability or a misplay. Standard logs leave Jace hits and some token ownership unknown.','', '| Version / run | Complete logs | Clean W/L/D | Suspect | Jace casts / recasts | Resolved -3 | Token attacks / blocks | Known Jace token deaths (lower bound) |','|---|---|---|---|---|---|---|---|'];
  for(const [key,rs] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
    const counts=Object.fromEntries(['jace_win','jace_loss','draw','suspect_result'].map(x=>[x,rs.filter(r=>r.disposition===x).length]));
    const sum=f=>rs.reduce((s,r)=>s+f(r),0);
    lines.push(`| ${esc(key)} | ${rs.length} | ${counts.jace_win}/${counts.jace_loss}/${counts.draw} | ${counts.suspect_result} | ${sum(r=>r.jace.casts)} / ${sum(r=>r.jace.recasts)} | ${sum(r=>r.jace.minus3Uses)} | ${sum(r=>r.tokens.attacks)} / ${sum(r=>r.tokens.blocks)} | ${sum(r=>r.tokens.knownControlledDeaths)} |`);
  }
  lines.push('', '## Latest completed games', '', 'Ordered by log modification time, not game number. Each game also has a full evidence record in feed.jsonl and a brief in games.md.', '');
  for(const r of [...active].sort((a,b)=>b.sourceMtimeMs-a.sourceMtimeMs).slice(0,20)){
    lines.push(`- **${esc(r.version)} ${r.pod} game ${r.game}** (${r.run}): ${r.disposition}; round ~${r.rounds}; -3 ${r.jace.minus3Uses}. ${r.automatedReview.map(esc).join(' ')}`);
  }
  const issues={};for(const r of active)for(const x of r.aiReviewCandidates)inc(issues,x.card||x.issue);
  lines.push('', '## AI review candidates', '', 'Repeated exposure counts below are not independent trials or proof of weak cards.');
  for(const [card,n]of Object.entries(issues).sort((a,b)=>b[1]-a[1]))lines.push(`- ${esc(card)}: ${n} game(s) flagged for review.`);
  const changed=status.changedSources||[];
  if(changed.length)lines.push('', '## Changed source warning', '', ...changed.map(k=>`- Previously indexed log changed: ${esc(k)}. Existing feed retained; manual reconciliation required.`));
  atomic(path.join(out,'SUMMARY.md'),lines.join('\n')+'\n');
  const briefs=['# Per-game automated evidence reviews','','Generated from feed.jsonl. These are rule-based summaries, not verified causal explanations.',''];
  for(const r of [...active].sort((a,b)=>b.sourceMtimeMs-a.sourceMtimeMs))briefs.push(`## ${esc(r.version)} / ${esc(r.run)} / ${r.pod} game ${r.game}`,'',...r.automatedReview.map(s=>'- '+esc(s)),`- Final recorded hand: ${r.cards.lastRecordedHand?.map(c=>esc(c.card)).join('; ')||'(empty or unavailable; see feed)'}.`,`- AI review candidates: ${r.aiReviewCandidates.map(x=>esc(x.card||x.issue)).join('; ')||'none flagged'}.`,'');
  atomic(path.join(out,'games.md'),briefs.join('\n')+'\n');
}
function isAlive(pid){try{process.kill(pid,0);return true;}catch(e){return e.code==='EPERM';}}
function acquire(out){
  const lock=path.join(out,'watch.lock');
  try{fs.mkdirSync(lock);}catch(e){
    if(e.code!=='EEXIST')throw e;
    let owner;try{owner=JSON.parse(fs.readFileSync(path.join(lock,'owner.json'),'utf8'));}catch{}
    if(owner&&isAlive(owner.pid))throw Error(`Watcher already running (PID ${owner.pid})`);
    if(!owner&&Date.now()-fs.statSync(lock).mtimeMs<10000)throw Error('Another watcher is acquiring the lock');
    fs.rmSync(lock,{recursive:true});fs.mkdirSync(lock);
  }
  const owner={pid:process.pid,startedAt:new Date().toISOString(),script:__filename};
  fs.writeFileSync(path.join(lock,'owner.json'),JSON.stringify(owner));
  return ()=>{try{const cur=JSON.parse(fs.readFileSync(path.join(lock,'owner.json'),'utf8'));if(cur.pid===process.pid)fs.rmSync(lock,{recursive:true});}catch{}};
}
function main(){
  const versions=path.resolve(arg('--versions')||path.join(__dirname,'versions/jace'));
  const out=path.resolve(arg('--output')||path.join(__dirname,'reviews'));
  const intervalMs=Number(arg('--interval')||60)*1000;
  if(!Number.isFinite(intervalMs)||intervalMs<1000)throw Error('Interval must be >=1 second');
  if(out===versions||out.startsWith(versions+path.sep))throw Error('Output must be outside the run/version tree');
  fs.mkdirSync(out,{recursive:true});
  if(process.argv.includes('--start')){
    const ownerFile=path.join(out,'watch.lock/owner.json');
    if(fs.existsSync(ownerFile)){const owner=JSON.parse(fs.readFileSync(ownerFile));if(isAlive(owner.pid))throw Error(`Watcher already running (PID ${owner.pid})`);}
    const log=fs.openSync(path.join(out,'watcher.log'),'a');
    const child=spawn(process.execPath,[__filename,'--versions',versions,'--output',out,'--interval',String(intervalMs/1000)],{cwd:ROOT,detached:true,stdio:['ignore',log,log]});child.unref();fs.closeSync(log);console.log(`Launched watcher PID ${child.pid}; see ${out}/status.json`);return;
  }
  const release=acquire(out);let timer;
  const cleanup=()=>{if(timer)clearInterval(timer);release();};
  process.on('exit',cleanup);for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>process.exit(0));
  const feed=path.join(out,'feed.jsonl'), seenFile=path.join(out,'seen.txt');
  const records=readFeed(feed), seen=new Map(records.map(r=>[r.key,r]));
  // Feed is authoritative after a crash between appending a record and updating seen.txt.
  atomic(seenFile,[...seen.keys()].join('\n')+(seen.size?'\n':''));
  const fingerprints=new Map();let totalPolls=0;
  function tick(){
    if(fs.existsSync(path.join(out,'STOP'))){fs.unlinkSync(path.join(out,'STOP'));console.log('Stop requested');process.exit(0);}
    const errors=[],changedSources=[];let added=0,pending=0;
    for(const g of discover(versions)){
      try{
        const stat=fs.statSync(g.file),signature=`${stat.size}:${stat.mtimeMs}`;
        if(seen.has(g.key)){if(seen.get(g.key).sourceMtimeMs!==stat.mtimeMs||seen.get(g.key).sourceSize!==stat.size)changedSources.push(g.key);continue;}
        if(fingerprints.get(g.key)===signature){pending++;continue;}
        const text=fs.readFileSync(g.file,'utf8');
        fingerprints.set(g.key,signature);
        if(!/^Game Result:/m.test(text)||!text.endsWith('\n')){pending++;continue;}
        const hfile=g.file.replace(/\.log$/,'.hand.jsonl');
        const hand=fs.existsSync(hfile)?fs.readFileSync(hfile,'utf8'):'';
        const hs=fs.existsSync(hfile)?fs.statSync(hfile):null;
        const finalStat=fs.statSync(g.file);
        if(finalStat.size!==stat.size||finalStat.mtimeMs!==stat.mtimeMs){fingerprints.delete(g.key);pending++;continue;}
        const r=parseGame(text,hand,{key:g.key,version:g.version,run:g.run,pod:g.pod,game:g.game,source:path.relative(ROOT,g.file),sourceMtimeMs:stat.mtimeMs,sourceSize:stat.size,sourceSha256:crypto.createHash('sha256').update(text).digest('hex')},ownCards(versions,g.version));
        if(!r){pending++;continue;}
        // Companion hand stream is closed before the .log is written. A malformed tail is retried, never indexed as complete.
        if(r.cards.malformedHandLines){fingerprints.delete(g.key);pending++;continue;}
        if(hs){const after=fs.statSync(hfile);if(after.size!==hs.size||after.mtimeMs!==hs.mtimeMs){fingerprints.delete(g.key);pending++;continue;}}
        if(invalid(g.runDir))continue;
        fs.appendFileSync(feed,JSON.stringify(r)+'\n');records.push(r);seen.set(g.key,r);fs.appendFileSync(seenFile,g.key+'\n');added++;
      }catch(e){errors.push({key:g.key,error:e.message});fingerprints.delete(g.key);}
    }
    const status={pid:process.pid,startedAt:JSON.parse(fs.readFileSync(path.join(out,'watch.lock/owner.json'))).startedAt,lastPollAt:new Date().toISOString(),intervalMs,totalPolls:++totalPolls,totalIndexed:records.length,added,pending,changedSources,errors,mode:process.argv.includes('--once')?'once':'watch'};
    writeSummary(out,records,versions,status);atomic(path.join(out,'status.json'),JSON.stringify(status,null,2)+'\n');
    console.log(`${status.lastPollAt} indexed=${records.length} new=${added} pending=${pending} errors=${errors.length}`);
  }
  tick();if(!process.argv.includes('--once'))timer=setInterval(()=>{try{tick();}catch(e){console.error(new Date().toISOString(),e.stack);}},intervalMs);
}
module.exports={parseGame,refs,tokenName,discover};
if(require.main===module){try{main();}catch(e){console.error(e.stack);process.exitCode=1;}}
