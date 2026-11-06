"""C17 round runner (Claude-owned; RESUME C17). Runs ONE paired round of the T'Challa five-round series.

Each arm (before / installed) plays the round's 100 predeclared single-game trials (trials-bN.json: same pods,
opponents, seeds and seating for both arms) on the frozen legacy runtime (forge/app-custom + replaysim/classes,
flags = --smart --politics only). Every game is its own PodSim process with a REAL wall-clock limit: a game still
running after WALL seconds is killed (whole process group) and gets logs/<trial>-timeout.json pointing at its
preserved stdout — a scheduled draw, never a win. Forge's internal 600 s limit is known not to fire reliably.

Writes per arm: versions/wakanda/<version>/runs/<id>/{trials.json (byte copy), logs/, summary.json} and, for the
supervisor, c17-paired-five-rounds/round-N/runner-result.json (BATCH_SCHEMA). Max 4 Forge games machine-wide.

Usage: python3 gauntlet/c17-round.py --round N          (both arms, 2 games each at a time)
       python3 gauntlet/c17-round.py --selftest         (kills one real game after 20 s; checks timeout evidence)
"""
from pathlib import Path
import argparse, concurrent.futures as cf, datetime, hashlib, json, math, os, re, shutil, signal, subprocess, sys, threading, time

ROOT = Path(__file__).resolve().parents[1]
SERIES = ROOT / 'gauntlet/versions/wakanda/c17-paired-five-rounds'
FORGE = ROOT / 'forge'
APP = FORGE / 'app-custom'
CLASSES = '../replaysim/classes'
JAVA = '/opt/homebrew/opt/openjdk@21/bin/java'
WALL = 610          # seconds; just past Forge's nominal 600 s so a game Forge ends itself isn't cut off mid-write
BUDGET = 4          # Forge games machine-wide (Claude + Codex)


def sha(paths):
    x = hashlib.sha256()
    for p in paths:
        x.update(Path(p).read_bytes())
    return x.hexdigest()[:16]


def build_info(version):
    cdir = APP / CLASSES / 'forge/view'
    classes = sorted(p for p in cdir.iterdir() if p.name.endswith('.class'))
    return {'app': 'app-custom', 'classes': CLASSES, 'classesSha': sha(classes),
            'cardsSha': sha([APP / 'res/cardsfolder/cardsfolder.zip']),
            'deckSha': sha([ROOT / f'gauntlet/versions/wakanda/{version}/deck.dck'])}


def forge_games_running():
    out = subprocess.run(['ps', '-axo', 'args='], capture_output=True, text=True, timeout=10).stdout
    return sum('forge.view.PodSim' in l for l in out.splitlines())


def runs_md(line):
    with (ROOT / 'gauntlet/RUNS.md').open('a') as f:
        f.write(line.rstrip('\n') + '\n')


class Slots:
    """At most `own` concurrent games from this runner, and never more than BUDGET machine-wide."""
    def __init__(self, own):
        self.sem = threading.Semaphore(own)
        self.lock = threading.Lock()

    def acquire(self):
        self.sem.acquire()
        while True:
            with self.lock:
                if forge_games_running() < BUDGET:
                    return
            time.sleep(15)

    def release(self):
        self.sem.release()


def play(trial, deck_file, logdir, wall, slots):
    slots.acquire()
    try:
        stdout_path = logdir / f"{trial['id']}.stdout.txt"
        args = [JAVA, '-Xmx3072m', '-Dio.netty.tryReflectionSetAccessible=true', '-Dfile.encoding=UTF-8',
                '-cp', f'{CLASSES}:forge-gui-desktop-2.0.15-jar-with-dependencies.jar', 'forge.view.PodSim',
                str(FORGE / 'decks'), str(logdir), trial['id'], '1', str(trial['seed']), deck_file,
                *[f'b3-{o}.dck' for o in trial['opponents']]]
        env = {**os.environ, 'SMART_AI': '1', 'POLITICS': '1'}
        for k in ('KEEP_TOKENS', 'HOLD_MANA', 'SAFE_ATTACK', 'ARTIFACTS_FIRST', 'COMMANDER_FIRST', 'JACE_REAL_RULES',
                  'JACE_COMBO_AI', 'JACE_TELEMETRY', 'JACE_SAFE_WALKERS', 'JACE_PILOT_V3', 'JACE_PILOT_V4', 'FULL_STATE', 'FIXTURE'):
            env.pop(k, None)
        start = time.time()
        with stdout_path.open('w') as out:
            p = subprocess.Popen(args, cwd=APP, env=env, stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                p.wait(timeout=wall)
                return {'id': trial['id'], 'timeout': False, 'seconds': round(time.time() - start, 1)}
            except subprocess.TimeoutExpired:
                os.killpg(p.pid, signal.SIGKILL)
                p.wait()
                elapsed = round(time.time() - start, 1)
                (logdir / f"{trial['id']}-timeout.json").write_text(json.dumps({
                    'trialId': trial['id'], 'seed': trial['seed'], 'elapsedSeconds': elapsed, 'wallLimitSeconds': wall,
                    'reason': 'wall-clock limit reached; process group killed by c17-round.py',
                    'stdoutFile': str(stdout_path.relative_to(ROOT))}, indent=2) + '\n')
                return {'id': trial['id'], 'timeout': True, 'seconds': elapsed}
    finally:
        slots.release()


def wilson(w, n, z=1.96):
    if not n:
        return [0, 0]
    p = w / n; d = 1 + z * z / n; c = p + z * z / (2 * n); m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [(c - m) / d, (c + m) / d]


def score(trials, logdir):
    rows = []
    for t in trials:
        lf = logdir / f"{t['id']}-g1.log"
        row = {'id': t['id'], 'pod': t['pod'], 'case': t['case'], 'seed': t['seed']}
        text = lf.read_text(errors='ignore') if lf.exists() else ''
        m = re.search(r'^Game Result: ended in (\d+) ms\. (Ai\(\d\)-\S+) has won', text, re.M)
        if (logdir / f"{t['id']}-timeout.json").exists() or not re.search(r'^Game Result:', text, re.M):
            row.update(result='timeout', rawWin=False, win=False, suspect=True)
        elif not m:
            row.update(result='draw', rawWin=False, win=False, suspect=False)
        else:
            outcome = re.search(r'^Game Outcome: (Ai\(\d\)-\S+) has won because', text, re.M)
            suspect = int(m.group(1)) >= 600000 or bool(outcome and outcome.group(1) != m.group(2))
            raw = m.group(2).startswith('Ai(1)')
            row.update(result='suspect' if suspect else ('win' if raw else 'loss'), rawWin=raw, win=raw and not suspect,
                       suspect=suspect, ms=int(m.group(1)), winner=m.group(2))
        rows.append(row)
    return rows


def run_arm(n, arm, manifest, trials_path, wall, own_slots, results):
    a = manifest['arms'][arm]
    version = a['version']
    assert hashlib.sha256((ROOT / a['deck']).read_bytes()).hexdigest() == a['sha256'], f'{arm} deck changed'
    forge_deck = f'wakanda-{version}'
    dck = re.sub(r'^Name=.*$', f'Name={forge_deck}', (ROOT / a['deck']).read_text(), flags=re.M)
    (FORGE / 'decks' / f'{forge_deck}.dck').write_text(dck)
    run_id = datetime.datetime.now().strftime('%Y-%m-%d%H%M%S') + f'-c17-round{n}-b{n}-smart-politics-100'
    run_dir = ROOT / f'gauntlet/versions/wakanda/{version}/runs/{run_id}'
    logdir = run_dir / 'logs'
    logdir.mkdir(parents=True)
    shutil.copyfile(trials_path, run_dir / 'trials.json')
    trials = json.loads(trials_path.read_text())
    slots = Slots(own_slots)
    with cf.ThreadPoolExecutor(max_workers=own_slots) as ex:
        played = list(ex.map(lambda t: play(t, f'{forge_deck}.dck', logdir, wall, slots), trials))
    rows = score(trials, logdir)
    wins = sum(r['win'] for r in rows)
    lo, hi = wilson(wins, len(rows))
    summary = {
        'series': manifest['series'], 'round': n, 'arm': arm, 'deck': 'wakanda', 'version': version, 'run': run_id,
        'gauntlet': f'b{n}', 'smart': True, 'politics': True,
        **{k: False for k in ['holdMana', 'safeAttack', 'artifactsFirst', 'commanderFirst', 'keepTokens', 'jaceRealRules',
                              'jaceComboAi', 'safeWalkers', 'pilotV3', 'pilotV4']},
        'games': len(rows), 'wins': wins, 'rawWins': sum(r['rawWin'] for r in rows),
        'suspect': sum(r['suspect'] for r in rows), 'timeouts': sum(r['result'] == 'timeout' for r in rows),
        'draws': sum(r['result'] in ('draw', 'timeout', 'suspect') for r in rows),
        'winRate': wins / len(rows), 'ci95': [lo, hi], 'build': build_info(version),
        'runner': {'file': 'gauntlet/c17-round.py', 'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   'wallSeconds': wall, 'gamesAtOnce': own_slots},
        'scoring': 'suspect = wall-clock timeout, Forge-reported >= 600 s, or conflicting winner lines; suspects are draws',
        'trials': rows,
    }
    (run_dir / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    results[arm] = run_dir / 'summary.json'
    return summary


def selftest():
    """Kill a real game after 20 s and check the timeout evidence. Writes only to c17-paired-five-rounds/selftest/."""
    m = json.loads((SERIES / 'manifest.json').read_text())
    trial = json.loads((ROOT / m['groups'][0]['trialsFile']).read_text())[0]
    d = SERIES / 'selftest' / datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    d.mkdir(parents=True)
    a = m['arms']['before']
    (FORGE / 'decks' / f"wakanda-{a['version']}.dck").write_text(
        re.sub(r'^Name=.*$', f"Name=wakanda-{a['version']}", (ROOT / a['deck']).read_text(), flags=re.M))
    before = forge_games_running()
    r = play(trial, f"wakanda-{a['version']}.dck", d, 20, Slots(1))
    time.sleep(2)
    after = forge_games_running()
    tf = d / f"{trial['id']}-timeout.json"
    ok = r['timeout'] and tf.exists() and json.loads(tf.read_text())['elapsedSeconds'] >= 20 and after <= before
    print(json.dumps({'selftest': 'PASS' if ok else 'FAIL', 'result': r, 'forgeGamesBefore': before, 'forgeGamesAfter': after,
                      'evidence': str(tf.relative_to(ROOT))}, indent=2))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--round', type=int)
    ap.add_argument('--selftest', action='store_true')
    ap.add_argument('--wall', type=int, default=WALL)
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    n = args.round
    assert n in range(1, 6), '--round 1..5'
    m = json.loads((SERIES / 'manifest.json').read_text())
    group = m['groups'][n - 1]
    trials_path = ROOT / group['trialsFile']
    assert hashlib.sha256(trials_path.read_bytes()).hexdigest() == group['trialsSha256'], 'trial schedule changed'
    for k, v in m['expectedBuild'].items():
        assert build_info(m['arms']['before']['version'])[k] == v, f'frozen build mismatch: {k}'
    rec = SERIES / 'runner.json'
    me = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    if rec.exists():
        assert json.loads(rec.read_text())['runnerSha256'] == me, 'c17-round.py changed since round 1 — new cohort needed'
    else:
        rec.write_text(json.dumps({'runner': 'gauntlet/c17-round.py', 'runnerSha256': me, 'wallSeconds': args.wall,
                                   'gamesAtOnce': {'before': 2, 'installed': 2}, 'flags': ['--smart', '--politics'],
                                   'trialFiles': {g['trialsFile']: g['trialsSha256'] for g in m['groups']},
                                   'recorded': datetime.datetime.now().astimezone().isoformat(timespec='seconds')}, indent=2) + '\n')
    folder = SERIES / f'round-{n}'
    folder.mkdir(exist_ok=True)
    stamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    runs_md(f'| {stamp} | Claude (c17-round.py) | wakanda v1.7-c17-before + v1.8-c17-installed | 100 each | --smart --politics, group b{n}, trials-b{n}.json, 610 s wall limit, 2+2 games at once | C17 round {n} | running |')
    results = {}
    with cf.ThreadPoolExecutor(max_workers=2) as ex:
        futs = {ex.submit(run_arm, n, arm, m, trials_path, args.wall, 2, results): arm for arm in ('before', 'installed')}
        summaries = {futs[f]: f.result() for f in cf.as_completed(futs)}
    b, i = summaries['before'], summaries['installed']
    note = (f"Round {n} (group b{n}): before {b['wins']}/100 clean (raw {b['rawWins']}, suspect {b['suspect']}, timeouts {b['timeouts']}); "
            f"installed {i['wins']}/100 clean (raw {i['rawWins']}, suspect {i['suspect']}, timeouts {i['timeouts']}). Runner c17-round.py sha {me[:12]}.")
    result = {'completed': b['games'] == 100 and i['games'] == 100, 'round': n,
              'beforeSummary': str(results['before'].relative_to(ROOT)), 'installedSummary': str(results['installed'].relative_to(ROOT)),
              'note': note}
    (folder / 'runner-result.json').write_text(json.dumps(result, indent=2) + '\n')
    runs_md(f'| {datetime.datetime.now().strftime("%Y-%m-%d %H:%M")} | Claude (c17-round.py) | C17 round {n} finished | 200 | — | {note} | awaiting Codex review |')
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    sys.exit(main())
