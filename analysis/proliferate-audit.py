"""C13 audit: for each proliferate resolution in full-state replays, which of player 1's permanents with counters
were eligible and which actually gained a counter. Usage: python3 analysis/proliferate-audit.py replay/logs/<glob>.log ..."""
import sys, json, re, collections
tot = collections.Counter(); per_src = collections.defaultdict(collections.Counter); examples = []
for logf in sys.argv[1:]:
    L = open(logf, errors='ignore').read().split('\n')
    states = [json.loads(l) for l in open(logf[:-4] + '.state.jsonl') if l.strip()]
    cards = [s for s in states if 'id' in s]
    def at(a):  # latest snapshot of every card at log position <= a
        cur = {}
        for s in cards:
            if s['a'] > a: break
            cur[s['id']] = s
        return cur
    me = re.search(r'Ai\(1\)-\S+', ''.join(L[:40])).group(0)
    # State stamps count log ENTRIES; continuation lines (e.g. "Ai(2)... didn't block") belong to the previous entry.
    entry = []; n = 0
    for l in L:
        if re.match(r'^[A-Z][A-Za-z ]*: ', l): n += 1
        entry.append(n)
    for i, l in enumerate(L, start=1):
        m = re.match(r'^Resolve Stack: (Whenever you cast a noncreature spell, proliferate|Whenever a player casts their second spell each turn, proliferate|.*Proliferate)', l)
        if not m: continue
        src = 'Flux Channeler' if 'noncreature' in l else 'Dreamtide Whale' if 'second spell' in l else ('other: ' + l[15:45])
        twice = 'proliferate twice' in ' '.join(L[i-4:i])
        e = entry[i - 1]
        # Changes made while an ability resolves are stamped a = (entry index − 1), i.e. before the Resolve line.
        before, after = at(e - 2), at(e - 1)
        for cid, b in before.items():
            if b.get('ctrl') != me or not b.get('c'): continue
            a = after.get(cid, b)
            gained = {k: a.get('c', {}).get(k, 0) - v for k, v in b['c'].items()}
            ok = any(g > 0 for g in gained.values())
            kind = 'walker' if 'Loyalty' in b['c'] else 'whale/time' if 'Time' in b['c'] else 'other'
            tot[(kind, ok)] += 1; per_src[src][(kind, ok)] += 1
            if not ok and len(examples) < 8: examples.append(f"{logf.split('-pod')[1][:6]} line {i} {src}: {b['name']} {b['c']} unchanged (Tekuthal twice={twice})")
print('eligible friendly permanents (had counters) → gained a counter?')
for (k, ok), n in sorted(tot.items()): print(f'  {k:7s} {"YES" if ok else "no "}: {n}')
for s, c in per_src.items(): print(' ', s, dict(c))
print('examples of eligible-but-unchanged:'); print('\n'.join('  ' + e for e in examples))
