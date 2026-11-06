// Breaks down a results file: seat, game length, how Patrick loses, and card win-rate deltas.
const file = process.argv[2];
const { results } = require(`./${file}`);
const n = results.length;
const won = r => r.patrickFinish === 'won';
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : '-');

console.log(`${file}: ${results.filter(won).length}/${n} wins (${pct(results.filter(won).length, n)}), timeouts ${results.filter(r => r.timeout).length}`);
console.log('\nBy seat:');
for (let s = 1; s <= 4; s++) { const g = results.filter(r => r.patrickSeat === s); console.log(`  seat ${s}: ${g.filter(won).length}/${g.length} (${pct(g.filter(won).length, g.length)})`); }

const wins = results.filter(won), losses = results.filter(r => !won(r));
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`\nAverage game length: wins ${avg(wins.map(r => r.rounds))} rounds, all games ${avg(results.map(r => r.rounds))}`);

const outs = losses.map(r => r.patrickFinish.match(/out R(\d+) \((.*)\)/)).filter(Boolean);
console.log(`Patrick eliminated: avg round ${avg(outs.map(m => +m[1]))}`);
const by = {}; for (const m of outs) by[m[2]] = (by[m[2]] ?? 0) + 1;
console.log('  eliminated by:', Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
const early = outs.filter(m => +m[1] <= 8).length;
console.log(`  eliminated by round 8: ${early} (${pct(early, losses.length)} of losses)`);
console.log('\nWhen Patrick loses, the winner is:', Object.entries(losses.reduce((o, r) => ((o[r.winner] = (o[r.winner] ?? 0) + 1), o), {})).map(([k, v]) => `${k} ${v}`).join(', '));

// Win rate when the card was in Patrick's opening hand or first 8 draws vs. not (avoids survivorship bias:
// expensive cards only get cast in games Patrick survives long enough to cast them).
const field = process.argv[3] ?? 'patrickEarly';
const cards = new Set(results.flatMap(r => r[field]));
const rows = [];
for (const c of cards) {
  const withC = results.filter(r => r[field].includes(c)), without = results.filter(r => !r[field].includes(c));
  if (withC.length < 40 || without.length < 40 || /^(Plains|Forest)$/.test(c)) continue;
  const a = withC.filter(won).length / withC.length, b = without.filter(won).length / without.length;
  rows.push({ c, cast: withC.length, withRate: a, delta: a - b });
}
rows.sort((x, y) => y.delta - x.delta);
const fmt = r => `  ${r.c.padEnd(34)} seen early in ${String(r.cast).padStart(3)} games  win ${(100 * r.withRate).toFixed(0).padStart(3)}%  (${r.delta >= 0 ? '+' : ''}${(100 * r.delta).toFixed(0)} pts vs. not seen)`;
console.log('\nCards most tied to winning:'); rows.slice(0, 10).forEach(r => console.log(fmt(r)));
console.log('\nCards least tied to winning:'); rows.slice(-10).forEach(r => console.log(fmt(r)));
