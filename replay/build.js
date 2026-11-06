// Turns verbose Forge game logs (logs/*.log) into replay data for index.html.
// Downloads card images from Scryfall into img/ (cached). Usage: node build.js
const fs = require('fs');
const path = require('path');
const Scry = require('scryfall-sdk');
Scry.setAgent('mtg-commander', '1.0.0');

const ROOT = __dirname;
const DECKS = path.join(ROOT, '../forge/decks');
const B3 = path.join(ROOT, '../sim/data/bracket3');
const DECK_LABELS = { 'wakanda-v1.7-c17-before': "T'Challa · C17 · Before swaps", 'wakanda-v1.8-c17-installed': "T'Challa · C17 · Installed 11 upgrades", 'tchalla-proposed': "T'Challa · 14 swaps", 'tchalla-tuned': "T'Challa · Tuned v1", 'tchalla-tuned2': "T'Challa · Tuned v2", 'tchalla-current': "T'Challa · current",
  'jace-updated': 'Jace · 9 swaps', 'jace-fair': 'Jace · fair mana', 'jace-tuned': 'Jace · tuned',
  'tchalla-keep6': "T'Challa · keep 6 · smart AI", 'wakanda-v1-bought14': "T'Challa · v1 (14 swaps)", 'wakanda-v0.1-real-lands': "T'Challa · BASELINE (your current deck)", 'wakanda-v1.3-proposed-armor': "T'Challa · PROPOSED (14 swaps + Midnight Angel Armor)", 'jace-tuned-keep3': 'Jace · keep 3 · smart AI + −3 rule',
  'jace-v0.1-real': 'Jace · BASELINE (your current deck)', 'jace-v0-current': 'Jace · 9 swaps', 'jace-v0.3-titan': 'Jace · 15 swaps, keeps Triplicate Titan',
  'jace-v0.4-keepers': 'Jace · PROPOSED (13 swaps, keeps Whale/Wurm/Titan/Loyal Tutor)', 'jace-v0.5-topdeck-tokens': 'Jace · v0.5 (top-deck + tokens)', 'jace-v1.0-dreadhorde-only': 'Jace · v1.0 Dreadhorde-only (pilot v3)', 'jace-v1.1-protection-concealment': 'Jace · v1.1 Clever Concealment (pilot v3)', 'jace-v0.6-precon-engine': 'Jace · v0.6 CANDIDATE (precon engine)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

function readDeck(file) {
  const lines = fs.readFileSync(path.join(DECKS, file), 'utf8').split('\n');
  let section = '';
  const deck = { commander: null, cards: [] };
  for (const l of lines) {
    if (/^\[/.test(l)) { section = l; continue; }
    const m = l.match(/^(\d+) (.+)$/);
    if (!m) continue;
    if (section === '[Commander]') deck.commander = m[2]; else deck.cards.push(m[2]);
  }
  return deck;
}

function opponentInfo(deckId) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(B3, `${deckId}.json`), 'utf8')).data;
    return { commander: d.commander[0].name.split(' // ')[0], deckName: d.name, source: d.source };
  } catch { return { commander: deckId, deckName: deckId, source: null }; }
}

// ---------- card data + images ----------

async function loadCards(names) {
  const cacheFile = path.join(ROOT, 'data/cards.json');
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const missing = [...names].filter(n => !(n in cache));
  if (missing.length) {
    const found = await Scry.Cards.collection(...missing.map(n => Scry.CardIdentifier.byName(n))).waitForAll();
    for (const c of found) {
      const face = c.card_faces?.[0] ?? c;
      const entry = {
        name: c.name, type: c.type_line, cost: c.mana_cost ?? face.mana_cost ?? '',
        power: face.power ?? null, toughness: face.toughness ?? null, loyalty: face.loyalty ?? null,
        vigilance: (c.keywords ?? []).includes('Vigilance'),
        imageUrl: c.image_uris?.normal ?? face.image_uris?.normal ?? null,
      };
      for (const key of [c.name, c.name.split(' // ')[0]]) cache[key] = entry;
    }
    for (const n of missing) if (!(n in cache)) cache[n] = null;
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1));
  }
  fs.mkdirSync(path.join(ROOT, 'img'), { recursive: true });
  for (const [name, c] of Object.entries(cache)) {
    if (!c?.imageUrl) continue;
    c.img = `img/${slug(c.name)}.jpg`;
    const file = path.join(ROOT, c.img);
    if (fs.existsSync(file)) continue;
    const res = await fetch(c.imageUrl, { headers: { 'User-Agent': 'mtg-commander/1.0' } });
    if (res.ok) fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    await sleep(60);
  }
  return cache;
}

// ---------- log parsing ----------

function splitGames(text) {
  const games = [];
  let cur = [];
  for (const line of text.split('\n')) {
    cur.push(line);
    if (line.startsWith('Game Result:')) { games.push(cur); cur = []; }
  }
  return games;
}

// Seats: Ai(1) = Patrick ('P'); Ai(2) = 'O'; Ai(3) = 'O2'; Ai(4) = 'O3' (4-player pods).
const SEAT_KEYS = { 1: 'P', 2: 'O', 3: 'O2', 4: 'O3' };
const playerOf = s => SEAT_KEYS[(s.match(/^Ai\((\d)\)/) ?? [])[1]] ?? 'O';

function parseGame(lines, knownNames, cards, commanders, states = []) {
  const events = [];
  const board = new Map(); // id -> { name, controller }
  const unbound = []; // permanents that resolved before their id was seen: { name, controller, tmpId }
  let active = 'P', tmp = 0;
  const stack = [];
  const sortedNames = [...knownNames].sort((a, b) => b.length - a.length);

  // Pulls "Card Name (123)" mentions out of a line, using real card names so commas inside names don't split them.
  function mentions(line) {
    const out = [];
    for (const m of line.matchAll(/ \((\d+)\)/g)) {
      const before = line.slice(0, m.index);
      const id = m[1];
      let name = sortedNames.find(n => before.endsWith(n));
      if (!name) { const t = before.match(/([A-Z][\w'’ -]*? Token)$/); name = t ? t[1] : before.split(/, | and |\[|: | to | by /).pop().trim(); }
      out.push({ id, name });
    }
    return out;
  }

  // Makes sure a mentioned id exists on the board; binds resolved-but-unidentified permanents by name.
  function ensure({ id, name }, controllerGuess) {
    if (board.has(id)) return board.get(id);
    const i = unbound.findIndex(u => u.name === name);
    if (i >= 0) {
      const u = unbound.splice(i, 1)[0];
      board.set(id, { name, controller: u.controller });
      events.push({ t: 'bind', tmpId: u.tmpId, id });
      return board.get(id);
    }
    return null;
  }
  function spawnToken(m, controller) {
    if (board.has(m.id)) return;
    board.set(m.id, { name: m.name, controller });
    events.push({ t: 'enter', player: controller, id: m.id, name: m.name, token: true });
  }
  const isToken = n => / Token$/.test(n);
  const owner = n => Object.keys(commanders).find(k => commanders[k].deck.has(n)) ?? null;

  // Recorder state lines are anchored to the number of log entries written so far; replay each one
  // just before the log line with that index so power/toughness and counters change at the right moment.
  let si = 0;
  const counterStates = new Map();
  const fromState = []; // permanents the recorder placed before their log line resolved them
  const hands = { P: new Set(), O: new Set() };
  let sawTurn = false; // opening hands aren't shown as draws
  const flushStates = upTo => {
    for (; si < states.length && states[si].a <= upTo; si++) {
      const r = states[si];
      if (r.hands) {
        for (const [pname, list] of Object.entries(r.hands)) {
          const who = playerOf(pname);
          const cardsInHand = list.map(([id, name]) => ({ id, name }));
          const before = hands[who] ?? new Set();
          // New ids in hand that weren't just on the battlefield are draws (bounced cards keep their id).
          const drawn = cardsInHand.filter(c => !before.has(c.id) && !board.has(c.id)).map(c => c.name);
          hands[who] = new Set(cardsInHand.map(c => c.id));
          events.push({ t: 'hand', player: who, cards: cardsInHand });
          if (drawn.length && sawTurn) events.push({ t: 'draw', player: who, names: drawn });
        }
        continue;
      }
      if (r.zones) {
        const z = {};
        for (const [name, v] of Object.entries(r.zones)) z[playerOf(name)] = { hand: v[0], library: v[1] };
        events.push({ t: 'zones', ...z });
        continue;
      }
      const controller = playerOf(r.ctrl);
      const name = r.tok && !/ Token$/.test(r.name) ? `${r.name} Token` : r.name;
      if (!ensure({ id: r.id, name: r.name }) && !ensure({ id: r.id, name })) {
        board.set(r.id, { name, controller });
        if (!r.tok && !r.land) fromState.push({ id: r.id, name, controller });
        events.push({ t: 'enter', player: controller, id: r.id, name, token: !!r.tok, land: !!r.land, commander: name === commanders[controller].name });
      }
      const b = board.get(r.id);
      if (b && b.controller !== controller) { b.controller = controller; events.push({ t: 'control', id: r.id, player: controller }); }
      const counterKey = JSON.stringify([r.c ?? {}, r.loyalty ?? null]);
      const hasCounters = Object.values(r.c ?? {}).some(n => n > 0) || r.loyalty != null;
      const counterChanged = counterStates.has(r.id) ? counterStates.get(r.id) !== counterKey : hasCounters;
      counterStates.set(r.id, counterKey);
      events.push({ t: 'stats', name, counterChanged, id: r.id, p: r.p ?? null, tt: r.t ?? null, counters: r.c, loyalty: r.loyalty ?? null, tapped: r.tap });
    }
  };

  let logEntry = 0;
  for (const raw of lines) {
    // GameLogEntry can contain continuation lines (combat assignments, multi-card effects).
    // Recorder anchors count entries, not the physical lines written by println(entry).
    if (/^[A-Z][A-Za-z ]*: /.test(raw)) logEntry++;
    const lineNo = logEntry - 1;
    // Changes made while an ability resolves are stamped before its "Resolve Stack" line is logged; show them
    // after that line (C13: Dreamtide Whale's proliferate looked like it did nothing because counters moved early).
    const resolving = /^Resolve Stack:/.test(raw.trim());
    flushStates(resolving ? lineNo - 1 : lineNo);
    const line = raw.trim();
    let m;
    if ((m = line.match(/^Mulligan: (Ai\(\d\)\S*) has (kept a hand of|mulliganed down to) (\d+)/))) {
      events.push({ t: 'note', text: `${commanders[playerOf(m[1])]?.name.split(',')[0] ?? 'Player'} ${m[2]} ${m[3]}` });
    } else if ((m = line.match(/^Turn: Turn (\d+) \((Ai\(\d\)\S*)\)/))) {
      active = playerOf(m[2]);
      sawTurn = true;
      events.push({ t: 'turn', n: +m[1], player: active });
    } else if ((m = line.match(/^Phase: (Ai\(\d\)\S*)'s (.+)$/))) {
      const phase = m[2];
      if (phase === 'Untap step') events.push({ t: 'untap', player: playerOf(m[1]) });
      else if (/Declare Attackers|End of Combat|Main phase|End step/.test(phase)) events.push({ t: 'phase', player: playerOf(m[1]), phase });
    } else if ((m = line.match(/^Land: (Ai\(\d\)\S*) played (.+) \((\d+)\)$/))) {
      const p = playerOf(m[1]);
      const exists = board.has(m[3]);
      board.set(m[3], { name: m[2], controller: p });
      events.push({ t: 'land', player: p, id: m[3], name: m[2], exists });
    } else if (line.startsWith('Replacement Effect:') && /enters tapped/.test(line)) {
      events.push({ t: 'tapLast' });
    } else if ((m = line.match(/^Mana: (.+?) \((\d+)\) - (.+)$/))) {
      let b = ensure({ id: m[2], name: m[1] }, active);
      if (!b && isToken(m[1])) spawnToken({ id: m[2], name: m[1] }, active);
      // Mana abilities such as Skirk Prospector's sacrifice do not tap the source.
      if (/\{T\}/.test(m[3])) events.push({ t: 'tap', id: m[2] });
      events.push({ t: 'mana', id: m[2], name: m[1], ability: m[3] });
    } else if ((m = line.match(/^Add To Stack: (Ai\(\d\)\S*) (cast|activated|triggered) (.+?)(?: targeting \[(.*)\])?$/))) {
      const p = playerOf(m[1]);
      const targets = m[4] ? mentions(`[${m[4]}`).map(x => x.id) : [];
      stack.push({ player: p, kind: m[2], name: m[3] });
      events.push({ t: 'stack', player: p, kind: m[2], name: m[3], targets });
    } else if (line.startsWith('Resolve Stack: ')) {
      const body = line.slice('Resolve Stack: '.length);
      let idx = -1;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].kind === 'cast' && body.startsWith(stack[i].name)) { idx = i; break; }
        if (stack[i].kind !== 'cast' && idx < 0) { idx = i; break; }
      }
      const item = idx >= 0 ? stack.splice(idx, 1)[0] : null;
      if (item?.kind === 'cast') {
        const c = cards[item.name];
        const permanent = c && !/Instant|Sorcery/.test(c.type);
        const placed = fromState.findIndex(x => x.name === item.name && x.controller === item.player);
        if (permanent && placed >= 0) fromState.splice(placed, 1);
        else if (permanent) {
          const tmpId = `t${++tmp}`;
          unbound.push({ name: item.name, controller: item.player, tmpId });
          events.push({ t: 'enter', player: item.player, id: tmpId, name: item.name, commander: item.name === commanders[item.player].name });
        }
        events.push({ t: 'resolve', player: item.player, name: item.name, permanent: !!permanent });
      } else {
        events.push({ t: 'resolve', player: item?.player ?? active, name: item?.name ?? 'ability', ability: true, effect: body });
      }
    } else if ((m = line.match(/^Combat: (Ai\(\d\)\S*) assigned (.+) to attack (.+?)\.?$/))) {
      const p = playerOf(m[1]);
      const ids = mentions(` ${m[2]}`).map(x => { if (!ensure(x, p) && isToken(x.name)) spawnToken(x, p); return x.id; });
      const target = mentions(` ${m[3]}`)[0];
      const defender = /^Ai\(\d\)/.test(m[3]) ? playerOf(m[3]) : (target ? board.get(target.id)?.controller : null);
      events.push({ t: 'attack', player: p, ids, defender, defenderTarget: target?.id ?? null, defenderName: target?.name ?? null });
    } else if ((m = line.match(/^Combat: (Ai\(\d\)\S*) assigned (.+) to block (.+)\.$/))) {
      const p = playerOf(m[1]);
      const blockers = mentions(` ${m[2]}`).map(x => { if (!ensure(x, p) && isToken(x.name)) spawnToken(x, p); return x.id; });
      const attacker = mentions(` ${m[3]}`)[0]?.id;
      events.push({ t: 'block', player: p, blockers, attacker });
    } else if ((m = line.match(/^(?:Combat: )?(Ai\(\d\)\S*) didn't block (.+)\.$/))) {
      const attacker = mentions(` ${m[2]}`)[0]?.id;
      if (attacker) events.push({ t: 'unblocked', player: playerOf(m[1]), attacker });
    } else if ((m = line.match(/^Damage: (.+?) deals (\d+) (combat )?damage to (.+?)\.?$/))) {
      const src = mentions(` ${m[1]}`)[0];
      if (src && !ensure(src, active) && isToken(src.name)) spawnToken(src, active);
      const tgtPlayer = m[4].match(/^Ai\(\d\)/) ? playerOf(m[4]) : null;
      const tgt = tgtPlayer ? null : mentions(` ${m[4]}`)[0];
      if (tgt) ensure(tgt, active === 'P' ? 'O' : 'P');
      events.push({ t: 'damage', src: src?.id ?? null, srcName: src?.name ?? m[1], player: tgtPlayer, target: tgt?.id ?? null, amount: +m[2], combat: !!m[3] });
    } else if ((m = line.match(/^Life: Life: (Ai\(\d\)\S*) (-?\d+) > (-?\d+)/))) {
      events.push({ t: 'life', player: playerOf(m[1]), from: +m[2], to: +m[3] });
    } else if ((m = line.match(/^Zone Change: (.+) \((\d+)\) was put into (\w+) from (\w+)\.$/))) {
      const x = { id: m[2], name: m[1] };
      if (m[4] === 'Battlefield') {
        const b = ensure(x, active);
        events.push({ t: 'leave', id: m[2], name: m[1], to: m[3], player: b?.controller ?? owner(m[1]) ?? active });
        board.delete(m[2]);
      } else if (m[3] === 'Battlefield') {
        const p = owner(m[1]) ?? active;
        board.set(m[2], { name: m[1], controller: p });
        events.push({ t: 'enter', player: p, id: m[2], name: m[1] });
      }
    } else if ((m = line.match(/^Zone Change: (Ai\(\d\)\S*) milled (.+)\.$/))) {
      events.push({ t: 'mill', player: playerOf(m[1]), names: mentions(` ${m[2]}`).map(x => x.name) });
    } else if ((m = line.match(/^Discard: (Ai\(\d\)\S*) discards (.+) \((\d+)\)\.$/))) {
      events.push({ t: 'discard', player: playerOf(m[1]), name: m[2] });
    } else if ((m = line.match(/^Game Outcome: (Ai\(\d\)\S*) has (won|lost) (.*)$/))) {
      events.push({ t: 'outcome', player: playerOf(m[1]), result: m[2], reason: m[3].replace(/\.$/, '') });
    }
    if (resolving) flushStates(lineNo);
  }
  flushStates(Infinity);
  return events;
}

// ---------- main ----------

(async () => {
  const games = [];
  const allNames = new Set();
  const raw = [];
  const importFile = path.join(ROOT, 'imported-games.json');
  const importedGames = fs.existsSync(importFile) ? JSON.parse(fs.readFileSync(importFile, 'utf8')) : {};
  const patrickDecks = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'logs')).filter(f => f.endsWith('.log')).sort()) {
    const text = fs.readFileSync(path.join(ROOT, 'logs', f), 'utf8');
    if (!/^Game Result:/m.test(text)) continue; // A recording still in progress is not a replay yet.
    // Opponents are bracket-3 decks (Ai(n)-b3-<id>) or Patrick's own decks (Ai(n)-<deck name>); 1v1 or 4-player pods.
    const seatNames = {};
    for (const m of text.matchAll(/Ai\((\d)\)-([\w-]+(?:\.[\w-]+)*)/g)) seatNames[m[1]] ??= m[2]; // names may contain dots (v0.1), not a trailing period
    const oppName = seatNames[2];
    const deckId = oppName?.startsWith('b3-') ? oppName.slice(3) : oppName;
    const myDeck = seatNames[1];
    if (!deckId || !myDeck) continue;
    patrickDecks[myDeck] ??= readDeck(`${myDeck}.dck`);
    patrickDecks[myDeck].cards.forEach(n => allNames.add(n));
    allNames.add(patrickDecks[myDeck].commander);
    const oppDecks = {};
    for (const [seat, name] of Object.entries(seatNames)) {
      if (seat === '1') continue;
      const d = readDeck(`${name}.dck`);
      d.cards.forEach(n => allNames.add(n));
      allNames.add(d.commander);
      oppDecks[SEAT_KEYS[seat]] = { deck: d, id: name.startsWith('b3-') ? name.slice(3) : name };
    }
    const oppDeck = oppDecks.O.deck;
    const stateFile = path.join(ROOT, 'logs', f.replace(/\.log$/, '.state.jsonl'));
    const states = fs.existsSync(stateFile) ? fs.readFileSync(stateFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
    // Fast gauntlet replays record Patrick's hand separately even without FULL_STATE.
    // Prefer the full-state hand stream when present to avoid duplicate draw events.
    const handFile = path.join(ROOT, 'logs', f.replace(/\.log$/, '.hand.jsonl'));
    if (!states.some(r => r.hands && Object.keys(r.hands).some(k => playerOf(k) === 'P')) && fs.existsSync(handFile)) {
      const handRows = fs.readFileSync(handFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
      for (const row of handRows) states.push({ a: row.a, hands: { [`Ai(1)-${myDeck}`]: row.hand } });
      states.sort((a, b) => a.a - b.a);
    }
    const fileIndex = +(f.match(/-(\d+)\.log$/) ?? [])[1] || null;
    const podTag = (f.match(/((?:b\d)?pod\d+(?:-c\d+)?)-g\d+/) ?? [])[1];
    splitGames(text).forEach((lines, i) => raw.push({ replayImport: importedGames[f] ?? null, file: f, index: fileIndex ?? (+(f.match(/-g(\d+)\.log$/) ?? [])[1] || i + 1), podTag, deckId, myDeck, oppDeck, oppDecks, lines, states }));
  }
  console.log(`Loading ${allNames.size} cards from Scryfall (cached after the first run)...`);
  const cards = await loadCards(allNames);

  for (const g of raw) {
    const patrickDeck = patrickDecks[g.myDeck];
    const commanders = { P: { name: patrickDeck.commander, deck: new Set(patrickDeck.cards.concat(patrickDeck.commander)) } };
    for (const [k, o] of Object.entries(g.oppDecks)) commanders[k] = { name: o.deck.commander, deck: new Set(o.deck.cards.concat(o.deck.commander)) };
    const known = new Set(Object.values(commanders).flatMap(c => [...c.deck]));
    const events = parseGame(g.lines, known, cards, commanders, g.states);
    const win = events.find(e => e.t === 'outcome' && e.result === 'won');
    const loss = events.find(e => e.t === 'outcome' && e.result === 'lost');
    const turns = Math.max(0, ...events.filter(e => e.t === 'turn').map(e => e.n));
    const opp = DECK_LABELS[g.deckId] ? { commander: g.oppDeck.commander.split(' // ')[0], deckName: DECK_LABELS[g.deckId], source: null } : opponentInfo(g.deckId);
    const seats = Object.fromEntries(Object.entries(commanders).map(([k, c]) => [k, c.name.split(' // ')[0]]));
    const opponents = Object.entries(g.oppDecks).map(([k, o]) => ({ seat: k, ...(DECK_LABELS[o.id] ? { commander: o.deck.commander.split(' // ')[0], deckName: DECK_LABELS[o.id], source: null } : opponentInfo(o.id)) }));
    const podSize = 1 + opponents.length;
    games.push({
      id: g.podTag ? `${g.myDeck}${['smart', 'politics', 'holdmana', 'jacecombo', 'pilotv3', 'pilotv4'].filter(t => g.file.includes(`-${t}-`)).map(t => `-${t}`).join('')}-${g.podTag}-g${g.index}` : `${g.myDeck}-${g.deckId}-${g.index}`, deck: (DECK_LABELS[g.myDeck] ?? g.myDeck) + (podSize > 2 ? ' · 4-player pod' : '') + (/-smart-/.test(g.file) ? ' · smart AI' : '') + (/-politics-/.test(g.file) ? ' · politics' : '') + (/-holdmana-/.test(g.file) ? ' · hold mana' : '') + (/-jacecombo-/.test(g.file) ? ' · real Jace rules + combo pilot' : '') + (/-pilotv4-/.test(g.file) ? ' · pilot v4' : /-pilotv3-/.test(g.file) ? ' · pilot v3' : ''),
      opponent: podSize > 2 ? { commander: opponents.map(o => o.commander.split(',')[0]).join(' / '), deckName: 'pod', source: null } : opp,
      replayImport: g.replayImport,
      fullState: g.states.some(r => r.id != null),
      opponents, seats, podSize, patrickCommander: patrickDeck.commander, opponentCommander: g.oppDeck.commander,
      winner: win?.player ?? null, reason: loss ? `${(seats[loss.player] ?? 'Player').split(',')[0]} lost ${loss.reason}` : '', turns, events,
    });
  }

  const used = new Set(games.flatMap(g => g.events.flatMap(e => [e.name, ...(e.names ?? []), ...(e.cards ?? []).map(c => c.name)]).filter(Boolean)));
  const cardData = Object.fromEntries([...used].filter(n => cards[n]).map(n => [n, { img: cards[n].img, type: cards[n].type, cost: cards[n].cost, power: cards[n].power, toughness: cards[n].toughness, loyalty: cards[n].loyalty, vigilance: cards[n].vigilance }]));
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data/games.js'), `window.REPLAY = ${JSON.stringify({ games, cards: cardData })};\n`);
  console.log(`Wrote ${games.length} games (${games.reduce((s, g) => s + g.events.length, 0)} events) to data/games.js`);
  for (const g of games) console.log(`  ${g.id}: ${g.patrickCommander.split(',')[0]} vs ${g.opponent.commander} — ${g.winner === 'P' ? 'WIN' : 'LOSS'} in ${g.turns} turns (${g.reason})`);
})().catch(e => { console.error(e); process.exit(1); });
