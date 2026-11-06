'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {parseGame,refs}=require('./review-watch');
const result='Game Result: ended in 1000 ms. Ai(1)-jace-test has won!\n';
test('incomplete log is never a finished game',()=>{
 assert.equal(parseGame('Turn: Turn 1 (Ai(1)-jace-test)\n'),null);
 assert.equal(parseGame(result.trimEnd()),null);
});
test('timeout and contradictory winners are held out, not counted as clean wins',()=>{
 const r=parseGame('Game Outcome: Ai(1)-jace-test has won because all opponents have lost\nGame Outcome: Ai(2)-b3-test has won because all opponents have lost\nGame Result: ended in 600010 ms. Ai(1)-jace-test has won!\n');
 assert.equal(r.disposition,'suspect_result');assert.equal(r.reportedWin,true);assert.equal(r.multipleWinners,true);assert.equal(r.timeoutSuspected,true);
});
test('minus three separates cost evidence from unknown hit and handles duplicate casts',()=>{
 const r=parseGame('Turn: Turn 9 (Ai(1)-jace-test)\nAdd To Stack: Ai(1)-jace-test cast Jace, Multiverse Architect\nAdd To Stack: Ai(1)-jace-test cast Jace, Multiverse Architect\nZone Change: Spirit Token (420) was put into Exile from Battlefield.\nAdd To Stack: Ai(1)-jace-test activated Jace, Multiverse Architect\nResolve Stack: Jace, Multiverse Architect (100) - Ai(1)-jace-testreveals cards from their library until revealing a creature or planeswalker card.\nAdd To Stack: Ai(1)-jace-test triggered Archon of Cruelty targeting [Ai(2)-b3-test]\n'+result,'',{},['Archon of Cruelty']);
 assert.equal(r.jace.casts,2);assert.equal(r.jace.recasts,1);assert.equal(r.jace.minus3Uses,1);assert.equal(r.jace.minus3[0].exiled[0].card,'Spirit Token');assert.equal(r.jace.minus3[0].hit,null);assert.equal(r.jace.minus3[0].hitCandidates[0].card,'Archon of Cruelty');
});
test('combat counts only own assigned tokens and does not infer owner from a death',()=>{
 assert.equal(refs('Archon of Cruelty (75), Nissa, Leyline Tamer (57) and Spirit Token (410)').length,3);
 const r=parseGame('Combat: Ai(1)-jace-test assigned Nissa, Leyline Tamer (57) and Spirit Token (410) to attack Ai(2)-b3-test.\nCombat: Ai(2)-b3-test assigned Spirit Token (411) to attack Ai(1)-jace-test.\nAi(1)-jace-test assigned Zombie Army Token (412) to block Goblin Token (500).\nZone Change: Spirit Token (410) was put into Graveyard from Battlefield.\nZone Change: Spirit Token (411) was put into Graveyard from Battlefield.\nZone Change: Spirit Token (999) was put into Graveyard from Battlefield.\n'+result);
 assert.equal(r.tokens.attacks,1);assert.equal(r.tokens.blocks,1);assert.equal(r.tokens.knownControlledDeaths,1);assert.equal(r.tokens.unknownOwnerDeaths,1);assert.equal(r.tokens.allPlayersDeaths,3);
});
test('hand exposure, final hand, casts and lands stay separate',()=>{
 const r=parseGame('Add To Stack: Ai(1)-jace-test cast Brainstorm\nLand: Ai(1)-jace-test played Plains (1)\n'+result,JSON.stringify({a:1,hand:[['1','Plains'],['2','Brainstorm'],['3','Sunfall']]})+'\n'+JSON.stringify({a:4,hand:[['3','Sunfall']]})+'\n');
 assert.deepEqual(r.cards.seenNeverCastOrPlayed,['Sunfall']);assert.deepEqual(r.cards.lastRecordedHand,[{id:'3',card:'Sunfall'}]);assert.equal(r.aiReviewCandidates[0].card,'Sunfall');
});
test('polling skips partial and invalid runs, indexes later completion once, recovers seen from feed',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'jace-watch-test-'));
 try{
  const versions=path.join(temp,'versions'),out=path.join(temp,'reviews'),logs=path.join(versions,'v-test','runs','r-test','logs');fs.mkdirSync(logs,{recursive:true});
  const file=path.join(logs,'pod01-g1.log');fs.writeFileSync(file,'Turn: Turn 1 (Ai(1)-jace-test)\n');
  const run=()=>execFileSync(process.execPath,[path.join(__dirname,'review-watch.js'),'--once','--versions',versions,'--output',out],{encoding:'utf8'});
  run();assert.equal(fs.existsSync(path.join(out,'feed.jsonl')),false);
  fs.appendFileSync(file,result);run();assert.equal(fs.readFileSync(path.join(out,'feed.jsonl'),'utf8').trim().split('\n').length,1);
  fs.writeFileSync(path.join(out,'seen.txt'),'');run();assert.equal(fs.readFileSync(path.join(out,'feed.jsonl'),'utf8').trim().split('\n').length,1);assert.match(fs.readFileSync(path.join(out,'seen.txt'),'utf8'),/pod01-g1/);
  fs.writeFileSync(path.join(logs,'pod01-g2.log'),result);fs.writeFileSync(path.join(logs,'..','INVALID.txt'),'Invalid test');run();assert.equal(fs.readFileSync(path.join(out,'feed.jsonl'),'utf8').trim().split('\n').length,1);assert.match(fs.readFileSync(path.join(out,'SUMMARY.md'),'utf8'),/0 currently eligible; 1 excluded/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
