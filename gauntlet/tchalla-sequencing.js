// Measures T'Challa sequencing in game logs: round he's first cast, and how many artifact spells with MV 4+ were
// cast while he was on the battlefield (two +1/+1 counters each) vs. off it (counters lost).
// Usage: node tchalla-sequencing.js <log dir> [<log dir>...]
const fs = require('fs');
const path = require('path');

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache-cards.json'), 'utf8'));
const bigArtifact = name => { const c = cards[name] ?? cards[name.split(' // ')[0]]; return c && /Artifact/.test(c.type.split(' // ')[0]) && c.cmc >= 4; };

for (const dir of process.argv.slice(2)) {
  let games = 0, firstCastRounds = [], on = 0, off = 0, offWhileAffordableish = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.log'))) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    const players = new Set(lines.map(l => l.match(/Ai\((\d)\)/)?.[1]).filter(Boolean)).size || 4;
    let round = 0, onField = false, first = null;
    for (const l of lines) {
      const t = l.match(/^Turn: Turn (\d+)/);
      if (t) round = Math.ceil(+t[1] / players);
      if (/^Resolve Stack: T'Challa, the Black Panther - Creature/.test(l)) { onField = true; first ??= round; }
      if (/^Zone Change: T'Challa, the Black Panther \(\d+\) was put into \w+ from Battlefield/.test(l)) onField = false;
      const m = l.match(/^Add To Stack: Ai\(1\)\S* cast (.+?)(?: targeting \[.*\])?$/);
      if (m && bigArtifact(m[1])) onField ? on++ : off++;
    }
    games++;
    if (first) firstCastRounds.push(first);
  }
  const avg = a => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : '-');
  console.log(`${path.basename(path.dirname(dir))}/${path.basename(dir)}: ${games} games | T'Challa first cast: round ${avg(firstCastRounds)} (cast in ${firstCastRounds.length}/${games}) | MV4+ artifacts cast with T'Challa out: ${on} (${on * 2} counters), with him off the battlefield: ${off} (${off * 2} counters lost) → ${(100 * on / Math.max(1, on + off)).toFixed(0)}% of triggers landed`);
}
