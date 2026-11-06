// Game-level patterns for a T'Challa deck version: what wins have in common, what kills you, who wins.
// Usage: node insights.js <run logs dir> [<run logs dir>...]
const fs = require('fs');
const path = require('path');

const gauntlet = JSON.parse(fs.readFileSync(path.join(__dirname, 'gauntlet.json'), 'utf8'));
const deckName = id => gauntlet.decks[id]?.split(' (')[0] ?? id;

function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const g = { win: false, winner: null, rounds: 0, mulligans: 0, tchallaRound: null, tchallaDeaths: 0, counters: 0, landsR4: 0, rampR3: 0, lifeLow: 40, killedBy: {} };
  let round = 0, lands = 0, ownTurn = false;
  for (const l of lines) {
    const t = l.match(/^Turn: Turn (\d+) \((Ai\((\d)\))/);
    if (t) { round = Math.ceil(+t[1] / 4); ownTurn = t[3] === '1'; }
    if (/^Mulligan: Ai\(1\).*mulliganed down to [0-6] cards/.test(l)) g.mulligans++;
    if (/^Land: Ai\(1\)/.test(l)) { lands++; if (round <= 4) g.landsR4 = lands; }
    if (/^Add To Stack: Ai\(1\)\S* cast (Sol Ring|Arcane Signet|Selesnya Signet|Birds of Paradise|Nature's Lore|Thran Dynamo|Sword of the Animist)/.test(l) && round <= 3) g.rampR3++;
    if (/^Resolve Stack: T'Challa, the Black Panther - Creature/.test(l)) g.tchallaRound ??= round;
    if (/^Zone Change: T'Challa, the Black Panther \(\d+\) was put into \w+ from Battlefield/.test(l)) g.tchallaDeaths++;
    if (/put two \+1\/\+1 counters on T'Challa/.test(l)) g.counters++;
    const life = l.match(/^Life: Life: Ai\(1\)\S* -?\d+ > (-?\d+)/);
    if (life) g.lifeLow = Math.min(g.lifeLow, +life[1]);
    const dmg = l.match(/^Damage: .* deals (\d+) (?:combat )?damage to Ai\(1\)/);
    const src = l.match(/^Damage: (.+?) \(\d+\) deals/);
    if (dmg && src) g.killedBy[src[1]] = (g.killedBy[src[1]] ?? 0) + +dmg[1];
    const w = l.match(/^Game Result: .* (Ai\((\d)\)-(\S+)) has won/);
    if (w) { g.win = w[2] === '1'; g.winner = w[3]; }
  }
  g.rounds = round;
  return g;
}

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
const rate = gs => `${gs.filter(g => g.win).length}/${gs.length} (${pct(gs.filter(g => g.win).length, gs.length)})`;
const avg = (gs, f) => (gs.length ? (gs.reduce((s, g) => s + (f(g) ?? 0), 0) / gs.length).toFixed(1) : '-');

for (const dir of process.argv.slice(2)) {
  const games = fs.readdirSync(dir).filter(f => f.endsWith('.log')).map(f => parse(path.join(dir, f)));
  const wins = games.filter(g => g.win), losses = games.filter(g => !g.win);
  console.log(`\n=== ${dir.split('/').slice(-4, -2).join(' ')}: ${rate(games)}`);
  console.log(`  T'Challa cast at all:         ${rate(games.filter(g => g.tchallaRound))} win rate | never cast: ${rate(games.filter(g => !g.tchallaRound))}`);
  console.log(`  T'Challa by round 3:          ${rate(games.filter(g => g.tchallaRound && g.tchallaRound <= 3))} | round 4+: ${rate(games.filter(g => g.tchallaRound > 3))}`);
  console.log(`  T'Challa never died:          ${rate(games.filter(g => g.tchallaRound && !g.tchallaDeaths))} | died at least once: ${rate(games.filter(g => g.tchallaDeaths))}`);
  console.log(`  Counter triggers 3+:          ${rate(games.filter(g => g.counters >= 3))} | 0–2: ${rate(games.filter(g => g.counters < 3))}`);
  console.log(`  Kept 7 (no mulligan):         ${rate(games.filter(g => !g.mulligans))} | mulliganed: ${rate(games.filter(g => g.mulligans))}`);
  console.log(`  4+ lands by round 4:          ${rate(games.filter(g => g.landsR4 >= 4))} | fewer: ${rate(games.filter(g => g.landsR4 < 4))}`);
  console.log(`  Ramp cast by round 3:         ${rate(games.filter(g => g.rampR3))} | none: ${rate(games.filter(g => !g.rampR3))}`);
  console.log(`  Avg game length: wins round ${avg(wins, g => g.rounds)}, losses round ${avg(losses, g => g.rounds)}; avg T'Challa deaths in losses ${avg(losses, g => g.tchallaDeaths)}`);
  const winners = {};
  for (const g of losses) { const id = g.winner?.replace('b3-', ''); winners[deckName(id)] = (winners[deckName(id)] ?? 0) + 1; }
  console.log(`  Who wins when you lose: ${Object.entries(winners).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const dmg = {};
  for (const g of losses) for (const [k, v] of Object.entries(g.killedBy)) dmg[k] = (dmg[k] ?? 0) + v;
  console.log(`  Biggest damage sources in losses: ${Object.entries(dmg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
