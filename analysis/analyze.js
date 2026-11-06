// Analyzes recorded Forge games (logs/<deck>/*.log + .state.jsonl): why T'Challa wins or loses per opponent.
// Usage: node analyze.js [deck=tchalla-proposed]
const fs = require('fs');
const path = require('path');

const DECK = process.argv[2] ?? 'tchalla-proposed';
const DIR = path.join(__dirname, 'logs', DECK);
const B3 = path.join(__dirname, '../sim/data/bracket3');
const commanderOf = id => { try { return JSON.parse(fs.readFileSync(path.join(B3, `${id}.json`), 'utf8')).data.commander[0].name.split(',')[0]; } catch { return id; } };

const REMOVAL = ['Path to Exile', 'Swords to Plowshares', 'Beast Within', 'Generous Gift', 'Dispatch', 'Winds of Abandon', 'Vanquish the Horde', "King Solomon's Frogs", 'Vigorbloom Charm', 'Hatut Zeraze Strike Force',
  'Wrath of God', 'Austere Command', 'Fateful Absence', 'Get Lost', "Council's Judgment", 'Oblivion Ring',
  // Jace
  'Cyclonic Rift', "Chandra's Ignition", 'Overwrite the Multiverse', 'Sunfall', 'Martial Coup', "Lich's Relic", 'Aetherize', 'Divergent Transformations', 'Fatehold Charm', 'Massacre Wurm'];
const WIPES = ['Vanquish the Horde', 'Wrath of God', 'Austere Command', 'Overwrite the Multiverse', 'Sunfall', 'Martial Coup', "Chandra's Ignition"];
const COMMANDER = DECK.startsWith('jace') ? 'Jace, Multiverse Architect' : "T'Challa";

function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const statePath = file.replace(/\.log$/, '.state.jsonl');
  const states = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const g = {
    win: /Ai\(1\)-[^ ]+ has won/.test(lines.find(l => l.startsWith('Game Result')) ?? ''),
    turn: 0, round: 0, mulligans: 0, landsByRound: {}, spellsByRound: {}, tchallaRound: null, tchallaCasts: 0,
    damageToMe: {}, damageToOpp: {}, myCasts: [], oppCasts: [], removal: [], lifeByRound: {}, wipeCast: false,
    oppTokenPeak: 0, myCreaturePeak: 0, oppPowerPeak: 0, firstHitRound: null, lossReason: '', winCon: '',
  };
  let active = 'P', life = { P: 40, O: 40 }, lands = 0, spells = 0;
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if ((m = l.match(/^Turn: Turn (\d+) \((Ai\((\d)\))/))) { g.turn = +m[1]; g.round = Math.ceil(g.turn / 2); active = m[3] === '1' ? 'P' : 'O'; }
    if (/^Mulligan: Ai\(1\).*mulliganed/.test(l)) g.mulligans++;
    if (/^Land: Ai\(1\)/.test(l)) { lands++; g.landsByRound[g.round] = lands; }
    if ((m = l.match(/^Add To Stack: Ai\((\d)\)\S* cast (.+?)(?: targeting \[(.*)\])?$/))) {
      const who = m[1] === '1' ? 'P' : 'O';
      (who === 'P' ? g.myCasts : g.oppCasts).push({ round: g.round, name: m[2] });
      if (who === 'P') {
        spells++; g.spellsByRound[g.round] = spells;
        if (m[2].startsWith(COMMANDER)) { g.tchallaCasts++; g.tchallaRound ??= g.round; }
        if (REMOVAL.includes(m[2])) g.removal.push({ round: g.round, name: m[2], target: (m[3] ?? '').replace(/ \(\d+\)/g, '') });
        if (WIPES.includes(m[2])) g.wipeCast = true;
      }
    }
    if ((m = l.match(/^Damage: (.+?) \(\d+\) deals (\d+) (?:combat )?damage to Ai\((\d)\)/))) {
      const bucket = m[3] === '1' ? g.damageToMe : g.damageToOpp;
      bucket[m[1]] = (bucket[m[1]] ?? 0) + +m[2];
      if (m[3] === '1' && g.firstHitRound == null) g.firstHitRound = g.round;
    }
    if ((m = l.match(/^Life: Life: Ai\((\d)\)\S* (-?\d+) > (-?\d+)/))) { life[m[1] === '1' ? 'P' : 'O'] = +m[3]; g.lifeByRound[g.round] = { ...life }; }
    if ((m = l.match(/^Game Outcome: Ai\(1\)\S* has lost (.*)$/))) g.lossReason = m[1];
  }
  // Board peaks from the recorder's state stream.
  const board = new Map();
  for (const s of states) {
    if (!s.id) continue;
    board.set(s.id, s);
    let oppTok = 0, myCr = 0, oppPow = 0;
    for (const c of board.values()) {
      const opp = /Ai\(2\)/.test(c.ctrl);
      if (opp && c.tok) oppTok++;
      if (!opp && c.p != null) myCr++;
      if (opp && c.p != null) oppPow += Math.max(0, c.p);
    }
    g.oppTokenPeak = Math.max(g.oppTokenPeak, oppTok);
    g.myCreaturePeak = Math.max(g.myCreaturePeak, myCr);
    g.oppPowerPeak = Math.max(g.oppPowerPeak, oppPow);
  }
  // Zone changes tell us when cards leave; approximate "still on board" by ignoring leaves (peaks only).
  return g;
}

const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

const byOpp = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.log'))) {
  const id = f.match(/b3-(\d+)-/)[1];
  (byOpp[id] ??= []).push(parse(path.join(DIR, f)));
}

const all = Object.values(byOpp).flat();
console.log(`${DECK}: ${all.filter(g => g.win).length}/${all.length} wins across ${Object.keys(byOpp).length} opponents\n`);

const split = (gs, f) => [avg(gs.filter(g => g.win).map(f).filter(x => x != null)), avg(gs.filter(g => !g.win).map(f).filter(x => x != null))];
const rows = [
  ['Commander first cast (round)', g => g.tchallaRound],
  ['Lands by round 4', g => g.landsByRound[4] ?? Math.max(0, ...Object.entries(g.landsByRound).filter(([r]) => r <= 4).map(([, v]) => v))],
  ['Spells cast by round 4', g => Math.max(0, ...Object.entries(g.spellsByRound).filter(([r]) => r <= 4).map(([, v]) => v))],
  ['Removal spells cast', g => g.removal.length],
  ['Round first damaged', g => g.firstHitRound],
  ['My life after round 5', g => Object.entries(g.lifeByRound).filter(([r]) => r <= 5).pop()?.[1].P ?? 40],
  ['Opp token peak', g => g.oppTokenPeak],
  ['Opp board power peak', g => g.oppPowerPeak],
  ['My creature peak', g => g.myCreaturePeak],
  ['Mulligans', g => g.mulligans],
];
console.log('ALL TOUGH OPPONENTS — wins vs losses');
for (const [label, f] of rows) { const [w, l] = split(all, f); console.log(`  ${label.padEnd(30)} win ${String(w).padStart(5)}   loss ${String(l).padStart(5)}`); }

for (const [id, gs] of Object.entries(byOpp)) {
  const w = gs.filter(g => g.win).length;
  const losses = gs.filter(g => !g.win);
  const dmg = {}; for (const g of losses) for (const [k, v] of Object.entries(g.damageToMe)) dmg[k] = (dmg[k] ?? 0) + v;
  const oppCards = {}; for (const g of losses) for (const c of new Set(g.oppCasts.map(c => c.name))) oppCards[c] = (oppCards[c] ?? 0) + 1;
  const rem = {}; for (const g of gs) for (const r of g.removal) rem[`${r.name} → ${r.target || '(no target)'}`] = (rem[`${r.name} → ${r.target || '(no target)'}`] ?? 0) + 1;
  console.log(`\n=== vs ${commanderOf(id)} (${id}): ${w}/${gs.length} wins | avg loss round ${avg(losses.map(g => g.round))} | first hit round ${avg(losses.map(g => g.firstHitRound).filter(x => x))}`);
  console.log(`  loss reasons: ${top(losses.reduce((o, g) => ((o[g.lossReason] = (o[g.lossReason] ?? 0) + 1), o), {}), 3).map(([k, v]) => `${k} ×${v}`).join('; ')}`);
  console.log(`  damage to me in losses (top sources): ${top(dmg, 6).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  opp cards cast in most losses: ${top(oppCards, 8).map(([k, v]) => `${k} (${v}/${losses.length})`).join(', ')}`);
  console.log(`  ${COMMANDER.split(',')[0]} first cast: wins ${split(gs, g => g.tchallaRound)[0]} / losses ${split(gs, g => g.tchallaRound)[1]} | opp token peak wins ${split(gs, g => g.oppTokenPeak)[0]} / losses ${split(gs, g => g.oppTokenPeak)[1]}`);
  console.log(`  my removal: ${top(rem, 6).map(([k, v]) => `${k} ×${v}`).join('; ') || 'none'}`);
}

// Which of my cards show up early in wins vs losses (cast by round 4).
const early = {};
for (const g of all) for (const c of new Set(g.myCasts.filter(c => c.round <= 4).map(c => c.name))) { (early[c] ??= { w: 0, l: 0 }); early[c][g.win ? 'w' : 'l']++; }
const W = all.filter(g => g.win).length, L = all.length - W;
console.log('\nMy cards cast by round 4 — share of wins vs share of losses (min 8 games):');
Object.entries(early).filter(([, v]) => v.w + v.l >= 8).map(([k, v]) => [k, v.w / W - v.l / L, v]).sort((a, b) => b[1] - a[1])
  .forEach(([k, d, v]) => console.log(`  ${k.padEnd(32)} ${(d >= 0 ? '+' : '') + (100 * d).toFixed(0)} pts  (wins ${v.w}, losses ${v.l})`));
