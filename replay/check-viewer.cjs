// Regression checks for replay combat parsing and state, without launching Forge.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const root = __dirname;
const builder = fs.readFileSync(path.join(root, 'build.js'), 'utf8').split('// ---------- main ----------')[0];
const parser = { require, __dirname: root, console };
vm.createContext(parser);
vm.runInContext(builder + '\nglobalThis.parse = parseGame;', parser);
const commanders = { P: { name: 'Jace, Multiverse Architect', deck: new Set(['Jace, Multiverse Architect', 'Soldier Token']) }, O: { name: 'Opponent', deck: new Set(['Attacker', 'Other Attacker']) } };
const cardData = { 'Jace, Multiverse Architect': { type: 'Legendary Planeswalker' }, Attacker: { type: 'Creature' }, 'Other Attacker': { type: 'Creature' } };
const log = [
 'Turn: Turn 1 (Ai(1)-jace-v0.1-real)',
 'Combat: Ai(2)-b3-1 assigned Attacker (20) to attack Jace, Multiverse Architect (100).',
 'Combat: Ai(1)-jace-v0.1-real assigned Soldier Token (30) and Soldier Token (31) to block Attacker (20).',
 'Combat: Ai(2)-b3-1 assigned Other Attacker (21) to attack Ai(1)-jace-v0.1-real.',
 "Combat: Ai(1)-jace-v0.1-real didn't block Other Attacker (21).",
];
const ev = parser.parse(log, new Set(['Jace, Multiverse Architect', 'Attacker', 'Other Attacker', 'Soldier Token']), cardData, commanders);
assert.equal(ev.find(e => e.t === 'attack').defenderTarget, '100');
assert.equal(ev.filter(e => e.t === 'attack')[1].defender, 'P');
assert.equal(ev.find(e => e.t === 'block').blockers.length, 2);
assert.equal(ev.find(e => e.t === 'unblocked').attacker, '21');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
new vm.Script(js);
const ui = { window: { REPLAY: { games: [], cards: cardData } }, document: { getElementById: () => null } };
vm.createContext(ui);
vm.runInContext(js.split('// ---------- wiring ----------')[0] + `\nglobalThis.api = { fresh, apply, counterDescription, attackDescription, setGame(g) { game = g; names = new Map([['20','Attacker'],['21','Other Attacker'],['100','Jace, Multiverse Architect'],['30','Soldier Token'],['31','Soldier Token']]); } };`, ui);
ui.api.setGame({ seats: { P: 'Jace, Multiverse Architect', O: 'Opponent' } });
const state = ui.api.fresh();
for (const [player, id, name] of [['P','100','Jace, Multiverse Architect'],['O','20','Attacker'],['O','21','Other Attacker'],['P','30','Soldier Token'],['P','31','Soldier Token']]) ui.api.apply(state, {t:'enter', player, id, name}, false);
for (const e of ev.filter(e => ['attack','block','unblocked'].includes(e.t))) ui.api.apply(state, e, false);
assert.equal(state.combat.length, 2);
assert.equal(state.combat[0].blockers.length, 2);
assert.equal(state.combat[1].declaredUnblocked, true);
assert.match(ui.api.attackDescription(ev.find(e => e.t==='attack')), /Jace, Multiverse Architect/);
ui.api.apply(state, {t:'stats', id:'100', loyalty:6, counters:{Loyalty:6,Shield:1}}, false);
assert.equal(state.P.bf[0].loyalty, 6);
assert.match(ui.api.counterDescription(state.P.bf[0]), /Loyalty 6.*Shield ×1/);
assert.equal(ui.api.counterDescription({counters:{Time:1}}), 'Time ×1');
ui.api.apply(state, {t:'phase',phase:'End of Combat Step'}, false);
assert.equal(state.combat.length, 0);
assert.equal(state.O.bf[0].attacking, false);
console.log('PASS: player/walker targets, multi-blocks, unblocked attacks, loyalty/counter labels, combat cleanup, viewer syntax');
// Verify the fast gauntlet recording path: separate .hand.jsonl must reach the built replay.
const built = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/games.js'),'utf8'), built);
let handOnlyChecked = 0;
for (const g of built.window.REPLAY.games) {
  const file = path.join(root,'logs', g.id + '.hand.jsonl');
  if (!fs.existsSync(file) || fs.existsSync(file.replace('.hand.jsonl','.state.jsonl'))) continue;
  const handRows = fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean);
  const hands = g.events.filter(e=>e.t==='hand' && e.player==='P');
  assert.equal(hands.length,handRows.length,`Missing hand snapshots: ${g.id}`);
  if (handRows.length > 20) assert.ok(g.events.some(e=>e.t==='draw' && e.player==='P'),`Missing draws: ${g.id}`);
  handOnlyChecked++;
}
assert.ok(handOnlyChecked > 0,'No hand-only recording checked');
ui.api.apply(state,{t:'hand',player:'P',cards:[{id:'45',name:'Plains'}]},false);
assert.equal(state.P.handCards[0].name,'Plains');
assert.ok(state.P.newIds.has('45'));
assert.match(html,/class="handbar handbar-player"/);
assert.match(html,/\.table > \.handbar-player \{ grid-row: 6/);
console.log(`PASS: ${handOnlyChecked} hand-only recordings retain hand snapshots/draws; NEW-card state and dedicated hand row`);
// Recorder positions count GameLogEntry objects, including entries with continuation lines.
const timingLog = [
 'Turn: Turn 1 (Ai(1)-jace-v0.1-real)',
 'Combat: Ai(2)-b3-1 assigned Attacker (20) to attack Ai(1)-jace-v0.1-real.',
 "Ai(1)-jace-v0.1-real didn't block Attacker (20).",
 "Phase: Ai(1)-jace-v0.1-real's Main phase, postcombat",
 'Mana: Attacker (20) - Sacrifice a Goblin: Add {R}.',
 'Mana: Other Attacker (21) - {T}: Add {U}.',
];
const timing = parser.parse(timingLog, new Set(['Attacker','Other Attacker']), cardData, commanders, [
 {a:0,hands:{'Ai(1)-jace-v0.1-real':[['45','Plains']]}},
 {a:2,hands:{'Ai(1)-jace-v0.1-real':[['45','Plains'],['46','Island']]}},
]);
const handUpdate=timing.findIndex(e=>e.t==='hand' && e.cards.length===2);
assert.ok(handUpdate > timing.findIndex(e=>e.t==='unblocked'), 'Hand update must not jump ahead of a continuation line');
assert.ok(!timing.some(e=>e.t==='tap' && e.id==='20'),'Sacrifice mana ability must not tap source');
assert.ok(timing.some(e=>e.t==='tap' && e.id==='21'),'Tap mana ability must tap source');
assert.equal(timing.filter(e=>e.t==='mana').length,2);
console.log('PASS: multiline log-entry anchors, sacrifice-vs-tap mana costs, visible mana ability evidence');
// Single-game C17 trial IDs must keep their case suffix; otherwise 100 trials collide.
const importReport=path.join(root,'latest-tchalla-batch.json');
if(fs.existsSync(importReport)) {
  const report=JSON.parse(fs.readFileSync(importReport,'utf8'));
  const imported=built.window.REPLAY.games.filter(g=>g.replayImport?.series==='tchalla-c17' && g.replayImport.batch===report.batch);
  assert.equal(imported.length,Object.values(report.imported).reduce((a,b)=>a+b,0));
  assert.equal(new Set(imported.map(g=>g.id)).size,imported.length,'Imported replay ID collision');
  for(const g of imported){
    assert.match(g.id,/-c\d+-g1$/);
    assert.ok(g.events.some(e=>e.t==='hand' && e.player==='P'),'Imported hand missing: '+g.id);
    assert.ok(!report.excluded.some(e=>e.arm===g.replayImport.arm && e.trial===g.replayImport.trial),'Suspect game imported');
  }
  console.log(`PASS: ${imported.length} latest-batch replays have unique trial IDs, recorded hands and no excluded suspects`);
}
