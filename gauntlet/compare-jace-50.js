// Read-only analysis of the matched 2026-10-29 comparison.
const fs = require('fs');
const path = require('path');
const run = '2026-10-292338-smart-politics-keeptokens-50';
const versions = ['v0.2-six', 'v0.5-topdeck-tokens'];
const all = {};
for (const version of versions) {
  const dir = path.join(__dirname, 'versions/jace', version, 'runs', run, 'logs');
  const games = {};
  const winners = {};
  const casts = {};
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.log'))) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n');
    const result = lines.find(l => l.startsWith('Game Result:'));
    if (!result) throw Error('Missing result: ' + file);
    const win = /Ai\(1\).*has won/.test(result);
    const draw = /Draw/.test(result);
    const winner = result.match(/Ai\(\d\)-(.+) has won/)?.[1] || 'draw';
    winners[winner] = (winners[winner] || 0) + 1;
    let turn = 0, ownTurn = 0, firstJaceTurn = null, minus3 = 0, plus1 = 0;
    const cast = new Set();
    for (const line of lines) {
      const tm = line.match(/^Turn: Turn (\d+)/);
      if (tm) turn = +tm[1];
      if (/^Turn: Turn \d+ \(Ai\(1\)/.test(line)) ownTurn++;
      const cm = line.match(/^Add To Stack: Ai\(1\)\S* cast (.+?)(?: targeting \[.*\])?$/);
      if (cm) {
        cast.add(cm[1]);
        if (cm[1] === 'Jace, Multiverse Architect' && firstJaceTurn === null) firstJaceTurn = ownTurn;
      }
      if (/^Resolve Stack: Jace, Multiverse Architect .*reveals cards from their library until/.test(line)) minus3++;
      if (/^Resolve Stack: Jace, Multiverse Architect .*draws 2 cards/.test(line)) plus1++;
    }
    for (const card of cast) casts[card] = (casts[card] || 0) + 1;
    games[file] = {win, draw, winner, firstJaceTurn, minus3, plus1, turns: turn};
  }
  const values = Object.values(games), n = values.length, w = values.filter(g => g.win).length;
  const d = values.filter(g => g.draw).length;
  const p = w / n, z = 1.96, den = 1 + z*z/n;
  const center = (p + z*z/(2*n))/den;
  const margin = z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
  const jc = values.filter(g => g.firstJaceTurn !== null);
  all[version] = {games, completed:n, wins:w, draws:d, winRate:p,
    ci95:[center-margin,center+margin], jaceCastGames:jc.length,
    avgFirstJaceTurn:jc.reduce((s,g)=>s+g.firstJaceTurn,0)/jc.length,
    minus3:values.reduce((s,g)=>s+g.minus3,0), winners, casts};
}
const [a,b] = versions.map(v=>all[v]);
let onlyA=0, onlyB=0, both=0, neither=0;
for(const key of Object.keys(a.games)) {
  if(!b.games[key]) continue;
  const x=a.games[key].win,y=b.games[key].win;
  if(x&&y) both++; else if(x) onlyA++; else if(y) onlyB++; else neither++;
}
const discordant=onlyA+onlyB;
let exactP=1;
if(discordant) {
  let term=Math.pow(0.5,discordant), cumulative=term;
  for(let k=1;k<=Math.min(onlyA,onlyB);k++){term*= (discordant-k+1)/k;cumulative+=term;}
  exactP=Math.min(1,2*cumulative);
}
console.log(JSON.stringify({run, versions:all, paired:{onlyA,onlyB,both,neither,exactMcNemarP:exactP}},null,2));
