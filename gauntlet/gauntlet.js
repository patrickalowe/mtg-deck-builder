// Runs one deck version through the fixed 4-player gauntlet and records results + per-card stats.
// Usage: node gauntlet.js <deck> <version> [games=500] [--smart] [--politics] [--holdmana] [--safeattack] [--artifactsfirst] [--commanderfirst] [--keeptokens] [--runtime=combo] [--jacerealrules] [--jacecombo] [--safewalkers] [--pilotv3] [--pilotv4] [--seedoffset=N] [--gauntlet=mill] [--par=4]
//   Deck list: versions/<deck>/<version>/deck.dck. Output: versions/<deck>/<version>/runs/<run id>/
//   (logs/, summary.json, card-stats.csv) and a row in versions/<deck>/history.csv.
//   --smart: test copy of Forge with custom AI logic + script fixes (see ../forge/custom/CHANGELOG.md).
//   --politics: all players gang up on a runaway leader (see ../forge/replaysim/src/forge/view/PodSim.java).
//   --holdmana: (with --smart) keep mana open for protection/removal instants once developed and threatened.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const [deck, version, gamesArg] = process.argv.slice(2);
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
// zsh doesn't word-split $VARS: a single "--a --b" argument would silently drop every flag.
if (process.argv.slice(2).some(a => a.startsWith('--') && a.includes(' '))) { console.error('A flag argument contains a space; pass each flag separately.'); process.exit(1); }
const SMART = flags.includes('--smart');
const POLITICS = flags.includes('--politics');
const HOLD = flags.includes('--holdmana');
const SAFE = flags.includes('--safeattack');
const ARTS = flags.includes('--artifactsfirst');
const CMDR = flags.includes('--commanderfirst');
const TOKENS = flags.includes('--keeptokens');
// C7 Jace test support (separate runtime, see forge/replaysim/src/forge/view/JaceCombo.java):
//   --runtime=combo: replaysim/classes-combo + telemetry (<game>.jace.jsonl); --jacerealrules: real-card Jace script
//   (forge/app-jace-real) + legal −3 targeting; --jacecombo: strategy-aware pilot (requires --jacerealrules).
const JREAL = flags.includes('--jacerealrules');
const JCOMBO = flags.includes('--jacecombo');
const JSAFE = flags.includes('--safewalkers');
// --pilotv3 (C11): pilot v3 (3-loyalty fix + Elspeth double −3) in its own compiled runtime replaysim/classes-v3.
const JV3 = flags.includes('--pilotv3');
if (JV3 && !JCOMBO) { console.error('--pilotv3 requires --jacecombo'); process.exit(1); }
// --pilotv4 (C13/C14): v3 + Jace +1 when −3 declined, Staff proliferate 3→4, conditional Jace cast, blocking for walkers.
const JV4 = flags.includes('--pilotv4');
// --seedoffset=N shifts every pod seed by N*1000 for fresh games (same pods/opponents/seating; 0 = the standard series).
const SEEDOFF = +(flags.find(f => f.startsWith('--seedoffset='))?.split('=')[1] ?? 0);
if (JV4 && !JV3) { console.error('--pilotv4 requires --pilotv3'); process.exit(1); }
if (JCOMBO && !JREAL) { console.error('--jacecombo requires --jacerealrules'); process.exit(1); }
const RUNTIME = JREAL || JCOMBO || JSAFE ? 'combo' : (flags.find(f => f.startsWith('--runtime='))?.split('=')[1] ?? 'default');
const PAR = +(flags.find(f => f.startsWith('--par='))?.split('=')[1] ?? 4);
const GAMES = +(gamesArg && !gamesArg.startsWith('--') ? gamesArg : 500);

const ROOT = __dirname;
const FORGE = path.join(ROOT, '../forge');
const APP = path.join(FORGE, JREAL ? 'app-jace-real' : SMART ? 'app-custom' : 'app');
const CLASSES = JV4 ? '../replaysim/classes-v4' : JV3 ? '../replaysim/classes-v3' : RUNTIME === 'combo' ? '../replaysim/classes-combo' : '../replaysim/classes';
const JAVA = '/opt/homebrew/opt/openjdk@21/bin/java';
// --gauntlet=mill loads gauntlet-mill.json (separate series, C10); default is the main 20-pod gauntlet.json.
const GAUNTLET = flags.find(f => f.startsWith('--gauntlet='))?.split('=')[1] ?? 'main';
const gauntlet = JSON.parse(fs.readFileSync(path.join(ROOT, GAUNTLET === 'main' ? 'gauntlet.json' : `gauntlet-${GAUNTLET}.json`), 'utf8'));
const versionDir = path.join(ROOT, 'versions', deck, version);
const runId = `${new Date().toISOString().slice(0, RUNTIME === 'combo' ? 19 : 16).replace(/[:T]/g, '')}${RUNTIME === 'combo' ? '-rtcombo' : ''}${JREAL ? '-jacereal' : ''}${JCOMBO ? '-jacecombo' : ''}${JSAFE ? '-safewalkers' : ''}${JV3 ? '-pilotv3' : ''}${JV4 ? '-pilotv4' : ''}${SEEDOFF ? `-seed${SEEDOFF}` : ''}${GAUNTLET === 'main' ? '' : `-${GAUNTLET}`}${SMART ? '-smart' : ''}${POLITICS ? '-politics' : ''}${HOLD ? '-holdmana' : ''}${SAFE ? '-safeattack' : ''}${ARTS ? '-artifactsfirst' : ''}${CMDR ? '-commanderfirst' : ''}${TOKENS ? '-keeptokens' : ''}-${GAMES}`;
const runDir = path.join(versionDir, 'runs', runId);
const logDir = path.join(runDir, 'logs');
fs.mkdirSync(logDir, { recursive: true });

// Forge loads decks from one folder, so the version's list is copied there under a unique name.
const forgeDeck = `${deck}-${version}`;
const dck = fs.readFileSync(path.join(versionDir, 'deck.dck'), 'utf8').replace(/^Name=.*$/m, `Name=${forgeDeck}`);
fs.writeFileSync(path.join(FORGE, 'decks', `${forgeDeck}.dck`), dck);

// Quick runs (fewer games than pods) play 1 game in each of the first GAMES pods.
const pods = GAMES < gauntlet.pods.length ? gauntlet.pods.slice(0, GAMES) : gauntlet.pods;
const gamesPerPod = new Map(pods.map((pod, i) => [pod.id,
  Math.floor(GAMES / pods.length) + (i < GAMES % pods.length ? 1 : 0)]));

function runPod(pod) {
  return new Promise(resolve => {
    const args = ['-Xmx3072m', '-Dio.netty.tryReflectionSetAccessible=true', '-Dfile.encoding=UTF-8',
      '-cp', `${CLASSES}:forge-gui-desktop-2.0.15-jar-with-dependencies.jar`, 'forge.view.PodSim',
      path.join(FORGE, 'decks'), logDir, pod.id, String(gamesPerPod.get(pod.id)), String(pod.seed + SEEDOFF * 1000),
      `${forgeDeck}.dck`, ...pod.opponents.map(o => `b3-${o}.dck`)];
    const env = { ...process.env, ...(SMART ? { SMART_AI: '1' } : {}), ...(POLITICS ? { POLITICS: '1' } : {}), ...(HOLD ? { HOLD_MANA: '1' } : {}), ...(SAFE ? { SAFE_ATTACK: '1' } : {}), ...(ARTS ? { ARTIFACTS_FIRST: '1' } : {}), ...(CMDR ? { COMMANDER_FIRST: '1' } : {}), ...(TOKENS ? { KEEP_TOKENS: '1' } : {}), ...(RUNTIME === 'combo' ? { JACE_TELEMETRY: '1' } : {}), ...(JREAL ? { JACE_REAL_RULES: '1' } : {}), ...(JCOMBO ? { JACE_COMBO_AI: '1' } : {}), ...(JSAFE ? { JACE_SAFE_WALKERS: '1' } : {}), ...(JV3 ? { JACE_PILOT_V3: '1' } : {}), ...(JV4 ? { JACE_PILOT_V4: '1' } : {}) };
    const p = spawn(JAVA, args, { cwd: APP, env });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (out += d));
    p.on('close', () => { fs.writeFileSync(path.join(logDir, `${pod.id}.stdout.txt`), out); resolve(); });
  });
}

// Build/resource fingerprints for the run's summary (C7 frozen-build requirement).
function buildInfo() {
  const crypto = require('crypto');
  const h = files => { const x = crypto.createHash('sha256'); for (const f of files) x.update(fs.readFileSync(f)); return x.digest('hex').slice(0, 16); };
  const cdir = path.join(APP, CLASSES, 'forge/view');
  const classes = fs.existsSync(cdir) ? fs.readdirSync(cdir).filter(f => f.endsWith('.class')).sort().map(f => path.join(cdir, f)) : [];
  return { app: path.basename(APP), classes: CLASSES, classesSha: h(classes), cardsSha: h([path.join(APP, 'res/cardsfolder/cardsfolder.zip')]),
    deckSha: h([path.join(versionDir, 'deck.dck')]) };
}

// Wilson score interval for a win rate.
function wilson(w, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = w / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
}

function deckCards() {
  let section = '';
  const cards = [];
  for (const l of dck.split('\n')) {
    if (l.startsWith('[')) { section = l; continue; }
    const m = l.match(/^(\d+) (.+)$/);
    if (m && section === '[Main]') cards.push(m[2]);
  }
  return [...new Set(cards)];
}

function analyze() {
  const games = [];
  for (const f of fs.readdirSync(logDir).filter(f => f.endsWith('.log'))) {
    const lines = fs.readFileSync(path.join(logDir, f), 'utf8').split('\n');
    const result = lines.find(l => l.startsWith('Game Result')) ?? '';
    const players = new Set(lines.map(l => l.match(/Ai\((\d)\)/)?.[1]).filter(Boolean)).size || 4;
    const roundAt = [];
    let round = 0;
    lines.forEach((l, i) => { const m = l.match(/^Turn: Turn (\d+)/); if (m) round = Math.ceil(+m[1] / players); roundAt[i] = round; });
    const handPath = path.join(logDir, f.replace(/\.log$/, '.hand.jsonl'));
    const drawn = new Set();
    if (fs.existsSync(handPath)) for (const l of fs.readFileSync(handPath, 'utf8').split('\n').filter(Boolean)) for (const [, n] of JSON.parse(l).hand) drawn.add(n);
    const castRound = {};
    lines.forEach((l, i) => {
      const m = l.match(/^Add To Stack: Ai\(1\)\S* cast (.+?)(?: targeting \[.*\])?$/) || l.match(/^Land: Ai\(1\)\S* played (.+) \(\d+\)$/);
      if (m && !(m[1] in castRound)) castRound[m[1]] = roundAt[i];
    });
    // A game that hit Forge's 600 s limit, or whose Game Result and Game Outcome name different winners, is a draw (suspect).
    const ms = +(result.match(/ended in (\d+) ms/)?.[1] ?? 0);
    const resultWinner = result.match(/(Ai\(\d\)-\S+) has won/)?.[1];
    const outcomeWinner = lines.find(l => /^Game Outcome: Ai\(\d\)-\S+ has won because/.test(l))?.match(/(Ai\(\d\)-\S+) has won/)?.[1];
    const suspect = ms >= 600000 || Boolean(resultWinner && outcomeWinner && resultWinner !== outcomeWinner);
    const rawWin = /Ai\(1\)-\S+ has won/.test(result);
    games.push({ file: f, win: rawWin && !suspect, rawWin, suspect, draw: /Draw/.test(result) || suspect, rounds: round, drawn, castRound });
  }
  const n = games.length, w = games.filter(g => g.win).length;
  const [lo, hi] = wilson(w, n);
  const summary = { deck, version, run: runId, smart: SMART, politics: POLITICS, holdMana: HOLD, safeAttack: SAFE, artifactsFirst: ARTS, commanderFirst: CMDR, keepTokens: TOKENS, runtime: RUNTIME, jaceRealRules: JREAL, jaceComboAi: JCOMBO, safeWalkers: JSAFE, pilotV3: JV3, pilotV4: JV4, seedOffset: SEEDOFF, gauntlet: GAUNTLET, build: buildInfo(), games: n, wins: w, rawWins: games.filter(g => g.rawWin).length, suspect: games.filter(g => g.suspect).length, draws: games.filter(g => g.draw).length,
    winRate: w / n, ci95: [lo, hi], avgRounds: games.reduce((s, g) => s + g.rounds, 0) / n, baselineNote: '4-player pods: 25% = even share' };
  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const rows = [['card', 'games_drawn', 'games_cast', 'cast_rate_when_drawn', 'avg_round_cast', 'wr_drawn', 'wr_not_drawn', 'wr_cast', 'wr_drawn_not_cast']];
  const wr = gs => (gs.length ? (gs.filter(g => g.win).length / gs.length).toFixed(3) : '');
  for (const c of deckCards()) {
    const d = games.filter(g => g.drawn.has(c) || c in g.castRound);
    const nd = games.filter(g => !(g.drawn.has(c) || c in g.castRound));
    const cast = d.filter(g => c in g.castRound);
    const dnc = d.filter(g => !(c in g.castRound));
    const avgRound = cast.length ? (cast.reduce((s, g) => s + g.castRound[c], 0) / cast.length).toFixed(1) : '';
    rows.push([c, d.length, cast.length, d.length ? (cast.length / d.length).toFixed(2) : '', avgRound, wr(d), wr(nd), wr(cast), wr(dnc)]);
  }
  fs.writeFileSync(path.join(runDir, 'card-stats.csv'), rows.map(r => r.map(x => (/[",]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x)).join(',')).join('\n') + '\n');

  const hist = path.join(ROOT, 'versions', deck, 'history.csv');
  if (!fs.existsSync(hist)) fs.writeFileSync(hist, 'version,run,smart,politics,games,wins,win_rate,ci95_low,ci95_high\n');
  fs.appendFileSync(hist, [version, runId, SMART, POLITICS, n, w, (w / n).toFixed(3), lo.toFixed(3), hi.toFixed(3)].join(',') + '\n');
  console.log(`${deck} ${version}: ${w}/${n} = ${(100 * w / n).toFixed(1)}% (95% CI ${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}%), even share 25%`);
}

(async () => {
  let next = 0, done = 0;
  async function worker() {
    while (next < pods.length) {
      const pod = pods[next++];
      await runPod(pod);
      console.log(`[${++done}/${pods.length}] ${pod.id} done`);
    }
  }
  await Promise.all(Array.from({ length: PAR }, worker));
  analyze();
})();
