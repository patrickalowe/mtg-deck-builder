"""Import a deck list exported from Moxfield (or Archidekt / plain text) into a gauntlet version folder.

Moxfield: deck page → Export → copy text (or download .txt), then:
  python3 gauntlet/import-deck.py <deck-key> <version> <file.txt|->  [--commander "Name"]
e.g.  python3 gauntlet/import-deck.py tchalla v0.1-real ~/Downloads/deck.txt
      pbpaste | python3 gauntlet/import-deck.py tchalla v0.1-real -

Understands: "1 Name", "1x Name", "1 Name (SET) 123", foil/etched marks (*F*, *E*), headers such as Commander/
Deck/Mainboard/Sideboard/Maybeboard/Companion/Considering (with or without counts or colons), "SIDEBOARD:" and
MTGO-style blank-line commander blocks. Sideboard/maybeboard/considering cards are listed but NOT put in the deck.
Card names are matched against Forge's local card database (exact, then case/punctuation-insensitive, then close
suggestions). Writes versions/<deck>/<version>/{deck.dck, pasted-list.txt, import-report.md}; never overwrites an
existing deck.dck. Run check-deck.js afterwards for bracket and mana checks.
"""
import argparse, difflib, re, sys, unicodedata, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARDS_ZIP = ROOT / 'forge/app-custom/res/cardsfolder/cardsfolder.zip'
SECTIONS = {'commander': 'commander', 'commanders': 'commander', 'companion': 'skip', 'deck': 'main', 'main': 'main',
            'mainboard': 'main', 'main deck': 'main', 'sideboard': 'skip', 'maybeboard': 'skip', 'considering': 'skip',
            'tokens': 'skip', 'attractions': 'skip', 'stickers': 'skip'}


def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def forge_names():
    names = {}
    with zipfile.ZipFile(CARDS_ZIP) as z:
        for n in z.namelist():
            if not n.endswith('.txt'):
                continue
            m = re.search(r'^Name:(.+)$', z.read(n).decode('utf8', 'ignore'), re.M)
            if m:
                names[m.group(1).strip()] = True
    return list(names)


def parse(text):
    section, entries, blank_after_main = 'main', [], False
    lines = [l.rstrip() for l in text.splitlines()]
    for i, raw in enumerate(lines):
        line = raw.strip()
        if not line or line.startswith('//') or line.startswith('#'):
            # MTGO export: a blank line before a final short block = commander(s)
            if not line and entries and section == 'main':
                rest = [l for l in lines[i + 1:] if l.strip()]
                if 0 < len(rest) <= 2 and all(re.match(r'^\d+x?\s', l.strip()) for l in rest):
                    section = 'commander'
            continue
        head = re.sub(r'\s*\(\d+\)\s*$', '', line).rstrip(':').strip().lower()
        if head in SECTIONS:
            section = SECTIONS[head]
            continue
        m = re.match(r'^(\d+)x?\s+(.+?)$', line)
        if not m:
            entries.append({'qty': 1, 'raw': line, 'section': section})
            continue
        name = m.group(2)
        name = re.sub(r'\s+\*[A-Z]+\*\s*$', '', name)                 # *F* foil, *E* etched
        name = re.sub(r'\s+\([A-Za-z0-9]{2,6}\)(\s+[\w\-★]+)?\s*$', '', name)  # (SET) 123
        name = re.sub(r'\s+#\S+.*$', '', name).strip()                  # tags
        if ' // ' in name:
            name = name.split(' // ')[0]
        entries.append({'qty': int(m.group(1)), 'raw': name, 'section': section})
    return entries


def resolve(entries, known):
    exact = set(known)
    by_norm = {}
    for n in known:
        by_norm.setdefault(norm(n), n)
    out = []
    for e in entries:
        r = e['raw']
        if r in exact:
            e.update(name=r, how='exact')
        elif norm(r) in by_norm:
            e.update(name=by_norm[norm(r)], how='normalized')
        else:
            close = difflib.get_close_matches(r, known, n=3, cutoff=0.75)
            e.update(name=None, how='unresolved', suggestions=close)
        out.append(e)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('deck'); ap.add_argument('version'); ap.add_argument('source')
    ap.add_argument('--commander', action='append', default=[])
    a = ap.parse_args()
    text = sys.stdin.read() if a.source == '-' else Path(a.source).expanduser().read_text(errors='ignore')
    entries = resolve(parse(text), forge_names())
    for c in a.commander:
        hit = [e for e in entries if e.get('name') == c or e['raw'] == c]
        for e in hit:
            e['section'] = 'commander'
    cmd = [e for e in entries if e['section'] == 'commander']
    main_ = [e for e in entries if e['section'] == 'main']
    skipped = [e for e in entries if e['section'] == 'skip']
    bad = [e for e in entries if e['how'] == 'unresolved' and e['section'] != 'skip']
    total = sum(e['qty'] for e in cmd + main_)
    out = ROOT / f'gauntlet/versions/{a.deck}/{a.version}'
    report = [f'# Import report — {a.deck} {a.version}', '',
              f'Commander: {", ".join(e.get("name") or e["raw"] for e in cmd) or "NOT FOUND — rerun with --commander"}',
              f'Cards counted (commander + main): {total} {"(OK)" if total == 100 else "(expected 100)"}',
              f'Skipped sections (sideboard/maybeboard/considering/companion): {sum(e["qty"] for e in skipped)}', '']
    fixed = [e for e in entries if e['how'] == 'normalized' and e['raw'] != e['name']]
    if fixed:
        report += ['Name fixes:'] + [f'- {e["raw"]} → {e["name"]}' for e in fixed] + ['']
    if bad:
        report += ['**Unresolved names (fix and rerun):**'] + [f'- {e["raw"]}' + (f' — did you mean: {", ".join(e["suggestions"])}?' if e['suggestions'] else '') for e in bad] + ['']
    print('\n'.join(report))
    if bad or not cmd:
        print('Not written: resolve the issues above first.')
        return 1
    out.mkdir(parents=True, exist_ok=True)
    if (out / 'deck.dck').exists():
        print(f'Not written: {out / "deck.dck"} already exists (choose a new version name).')
        return 1
    dck = ['[metadata]', f'Name={a.deck}-{a.version}', '[Commander]'] + [f'{e["qty"]} {e["name"]}' for e in cmd] + ['[Main]'] + [f'{e["qty"]} {e["name"]}' for e in main_]
    (out / 'deck.dck').write_text('\n'.join(dck) + '\n')
    (out / 'pasted-list.txt').write_text(text)
    (out / 'import-report.md').write_text('\n'.join(report) + '\n')
    print(f'Wrote {out.relative_to(ROOT)}/deck.dck — next: node gauntlet/check-deck.js {a.deck} {a.version}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
