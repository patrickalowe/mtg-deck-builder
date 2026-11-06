// Runs N Forge AI-vs-AI Commander games: Patrick's deck vs. a random bracket-3 deck each game.
// Usage: node run-forge.js [games=500] [deck=tchalla-proposed] [parallel=4]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const GAMES = +(process.argv[2] ?? 500);
const DECK = process.argv[3] ?? 'tchalla-proposed';
const PARALLEL = +(process.argv[4] ?? 4);
const JAVA = '/opt/homebrew/opt/openjdk@21/bin/java';
// FORGE_APP=app-jace-minus3 + SMART=1: test copy of Forge (Jace -3 fix) with SmartAi's extra card logic.
const APP = path.join(__dirname, process.env.FORGE_APP ?? 'app');
const DECKS = path.join(__dirname, 'decks');
// RUN=2, 3, ... keeps repeat runs from overwriting earlier ones.
const OUT = path.join(__dirname, `runs/${DECK}${process.env.SMART ? '-smart' : ''}-${GAMES}${process.env.RUN ? `-run${process.env.RUN}` : ''}`);
fs.mkdirSync(OUT, { recursive: true });

// Assign each game a random opponent, then batch games per opponent (one JVM launch per opponent).
const pool = fs.readdirSync(DECKS).filter(f => f.startsWith('b3-'));
const counts = {};
for (let i = 0; i < GAMES; i++) { const o = pool[crypto.randomInt(pool.length)]; counts[o] = (counts[o] ?? 0) + 1; }
const jobs = Object.entries(counts);

function runJob([opponent, n]) {
  return new Promise(resolve => {
    const launch = process.env.SMART
      ? ['-cp', '../replaysim/classes:forge-gui-desktop-2.0.15-jar-with-dependencies.jar', 'forge.view.SmartSim']
      : ['-jar', 'forge-gui-desktop-2.0.15-jar-with-dependencies.jar'];
    const args = ['-Xmx3072m', '-Dio.netty.tryReflectionSetAccessible=true', '-Dfile.encoding=UTF-8', ...launch, 'sim', '-D', DECKS, '-d', `${DECK}.dck`, opponent, '-n', String(n), '-f', 'Commander', '-q', '-c', '300'];
    const p = spawn(JAVA, args, { cwd: APP });
    let log = '';
    p.stdout.on('data', d => (log += d));
    p.stderr.on('data', d => (log += d));
    p.on('close', () => {
      fs.writeFileSync(path.join(OUT, opponent.replace('.dck', '.log')), log);
      const games = [...log.matchAll(/Game Result: Game (\d+) ended in (\d+) ms\. (.*)/g)].map(m => ({
        ms: +m[2],
        result: /has won/.test(m[3]) ? (m[3].includes(DECK) ? 'win' : 'loss') : 'draw',
      }));
      const turns = [...log.matchAll(/Game Outcome: Turn (\d+)/g)].map(m => +m[1]);
      games.forEach((g, i) => (g.turn = turns[i] ?? null));
      resolve({ opponent, requested: n, games });
    });
  });
}

(async () => {
  const results = [];
  let next = 0, done = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      const r = await runJob(job);
      results.push(r);
      done += r.games.length;
      const w = results.flatMap(x => x.games).filter(g => g.result === 'win').length;
      console.log(`[${done}/${GAMES}] vs ${r.opponent}: ${r.games.map(g => g.result[0]).join('')} | running total ${w}/${done}`);
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const all = results.flatMap(r => r.games);
  const w = all.filter(g => g.result === 'win').length, l = all.filter(g => g.result === 'loss').length, d = all.filter(g => g.result === 'draw').length;
  console.log(`\nDONE: ${all.length} games — ${w} wins, ${l} losses, ${d} draws/timeouts — win rate ${(100 * w / all.length).toFixed(1)}%`);
})();
