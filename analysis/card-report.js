// Card-by-card report over recorded games (logs/<deck>/*.log + .state.jsonl, from record.sh).
// For each of Patrick's cards: games drawn, how often it got cast once drawn, and win rate when drawn early vs. not.
// Usage: node card-report.js <deck folder> [<deck folder>...]
const fs = require('fs');
const path = require('path');

const EARLY_ROUND = 5;
const folders = process.argv.slice(2);
const games = [];

for (const folder of folders) {
  const dir = path.join(__dirname, 'logs', folder);
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.log'))) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    const statePath = path.join(dir, f.replace(/\.log$/, '.state.jsonl'));
    if (!fs.existsSync(statePath)) continue;
    const states = fs.readFileSync(statePath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    const win = /Ai\(1\)-\S+ has won/.test(lines.find(l => l.startsWith('Game Result')) ?? '');

    // Round at each log line, so state snapshots (anchored to log line counts) can be dated.
    const roundAt = [];
    let round = 0;
    lines.forEach((l, i) => { const m = l.match(/^Turn: Turn (\d+)/); if (m) round = Math.ceil(+m[1] / 2); roundAt[i] = round; });

    const drawnRound = {}; // card name -> first round seen in Patrick's hand
    for (const s of states) {
      if (!s.hands) continue;
      const mine = Object.entries(s.hands).find(([p]) => p.startsWith('Ai(1)'))?.[1] ?? [];
      const r = roundAt[Math.max(0, s.a - 1)] ?? 0;
      for (const [, name] of mine) if (!(name in drawnRound)) drawnRound[name] = r;
    }
    const cast = new Set();
    for (const l of lines) { const m = l.match(/^Add To Stack: Ai\(1\)\S* cast (.+?)(?: targeting \[.*\])?$/); if (m) cast.add(m[1]); }
    for (const l of lines) { const m = l.match(/^Land: Ai\(1\)\S* played (.+) \(\d+\)$/); if (m) cast.add(m[1]); }
    games.push({ folder, win, drawnRound, cast });
  }
}

const total = games.length, wins = games.filter(g => g.win).length;
console.log(`${total} games from ${folders.join(', ')} — ${wins} wins (${(100 * wins / total).toFixed(0)}%)\n`);

const cards = new Set(games.flatMap(g => Object.keys(g.drawnRound)));
const rows = [];
for (const c of cards) {
  if (/^(Plains|Forest)$/.test(c)) continue;
  const drawn = games.filter(g => c in g.drawnRound);
  const castWhenDrawn = drawn.filter(g => g.cast.has(c)).length;
  const early = games.filter(g => c in g.drawnRound && g.drawnRound[c] <= EARLY_ROUND);
  const notEarly = games.filter(g => !(c in g.drawnRound && g.drawnRound[c] <= EARLY_ROUND));
  const wr = a => (a.length ? a.filter(g => g.win).length / a.length : null);
  rows.push({ c, drawn: drawn.length, castRate: castWhenDrawn / drawn.length, early: early.length, delta: early.length >= 8 && notEarly.length >= 8 ? wr(early) - wr(notEarly) : null });
}

const fmt = r => `  ${r.c.padEnd(34)} drawn ${String(r.drawn).padStart(3)}  cast ${String(Math.round(100 * r.castRate)).padStart(3)}%  ${r.delta == null ? '   (too few early draws)' : `drawn by round ${EARLY_ROUND}: ${r.delta >= 0 ? '+' : ''}${Math.round(100 * r.delta)} pts win rate (${r.early} games)`}`;
console.log('Rarely cast once drawn (dead in hand):');
rows.filter(r => r.drawn >= 8 && r.castRate < 0.4).sort((a, b) => a.castRate - b.castRate).forEach(r => console.log(fmt(r)));
console.log('\nMost tied to winning when drawn early:');
rows.filter(r => r.delta != null).sort((a, b) => b.delta - a.delta).slice(0, 12).forEach(r => console.log(fmt(r)));
console.log('\nLeast tied to winning when drawn early:');
rows.filter(r => r.delta != null).sort((a, b) => a.delta - b.delta).slice(0, 12).forEach(r => console.log(fmt(r)));
fs.writeFileSync(path.join(__dirname, 'results', `card-report-${folders.join('+')}.json`), JSON.stringify(rows, null, 2));
