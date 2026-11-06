// Win rates for Patrick's deck vs. chosen opponents under different Forge AI profiles (play styles) and deck versions.
// Usage: node tune.js <games per pairing> <deck[:profile],...> <opponent ids...>
//   e.g. node tune.js 20 tchalla-proposed:Default,tchalla-proposed:Reckless 313935 3047743
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const N = +process.argv[2];
const configs = process.argv[3].split(',').map(s => { const [deck, profile = 'Default'] = s.split(':'); return { deck, profile }; });
const opps = process.argv.slice(4);
const PARALLEL = +(process.env.PAR ?? 4);
// FORGE_APP=app-jace-minus3 uses the test copy of Forge where Jace's -3 is rewritten so the AI will use it.
const APP = path.join(__dirname, '../forge', process.env.FORGE_APP ?? 'app');
const B3 = path.join(__dirname, '../sim/data/bracket3');
const name = id => { try { return JSON.parse(fs.readFileSync(path.join(B3, `${id}.json`), 'utf8')).data.commander[0].name.split(',')[0]; } catch { return id; } };

function run(cfg, opp) {
  return new Promise(resolve => {
    // SMART=1 runs Forge through SmartSim, which adds custom AI logic for Aetherize, Clever Concealment and Lim-Dûl's Vault.
    const launch = process.env.SMART
      ? ['-cp', '../replaysim/classes:forge-gui-desktop-2.0.15-jar-with-dependencies.jar', 'forge.view.SmartSim']
      : ['-jar', 'forge-gui-desktop-2.0.15-jar-with-dependencies.jar'];
    const args = ['-Xmx3072m', '-Dio.netty.tryReflectionSetAccessible=true', '-Dfile.encoding=UTF-8', ...launch,
      'sim', '-D', path.join(__dirname, '../forge/decks'), '-d', `${cfg.deck}.dck`, `b3-${opp}.dck`, '-n', String(N), '-f', 'Commander', '-q', '-c', '300', '-a', cfg.profile, 'Default'];
    const p = spawn('/opt/homebrew/opt/openjdk@21/bin/java', args, { cwd: APP });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (out += d));
    p.on('close', () => {
      const results = [...out.matchAll(/Game Result: Game \d+ ended (?:in \d+ ms\. (.*) has won!|in a Draw)/g)];
      if (/Unknown AI profile/.test(out)) console.error(out.match(/Unknown AI profile.*/)[0]);
      resolve({ wins: results.filter(m => m[1]?.startsWith('Ai(1)')).length, games: results.length });
    });
  });
}

(async () => {
  const jobs = configs.flatMap(cfg => opps.map(opp => ({ cfg, opp })));
  const table = {};
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const { cfg, opp } = jobs[next++];
      const r = await run(cfg, opp);
      const key = `${cfg.deck}:${cfg.profile}`;
      (table[key] ??= {})[opp] = r;
      process.stderr.write(`${key} vs ${name(opp)}: ${r.wins}/${r.games}\n`);
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  const header = ['config'.padEnd(36), ...opps.map(o => name(o).slice(0, 10).padStart(11)), '      TOTAL'].join('');
  console.log(header);
  for (const cfg of configs) {
    const key = `${cfg.deck}:${cfg.profile}`;
    const row = table[key];
    const tw = Object.values(row).reduce((s, r) => s + r.wins, 0), tg = Object.values(row).reduce((s, r) => s + r.games, 0);
    console.log([key.padEnd(36), ...opps.map(o => `${row[o].wins}/${row[o].games}`.padStart(11)), `${tw}/${tg} ${(100 * tw / tg).toFixed(0)}%`.padStart(11)].join(''));
  }
  fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'results', `tune-${Date.now()}.json`), JSON.stringify({ N, configs, opps, table }, null, 2));
})();
