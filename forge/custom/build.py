"""Builds ../app-custom: a test copy of Forge whose card database = Forge's original cards + every script in
custom/cards/ (same path as inside cardsfolder.zip). Forge's own install (../app) is never modified.
Usage: python3 custom/build.py [--out app-jace-real --exclude upcoming/jace_multiverse_architect.txt]
  (run from the forge/ folder). --out builds a separately named runtime; --exclude keeps Forge's original script
  for that card (app-jace-real = real-card Jace for the JACE_REAL_RULES test arm)."""
import os, shutil, zipfile, argparse
_ap = argparse.ArgumentParser()
_ap.add_argument('--out', default='app-custom')
_ap.add_argument('--exclude', action='append', default=[])
_args = _ap.parse_args()
FORGE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP, OUT, CUSTOM = os.path.join(FORGE, 'app'), os.path.join(FORGE, _args.out), os.path.join(FORGE, 'custom', 'cards')
ORIG = os.path.join(APP, 'res/cardsfolder/cardsfolder.zip.orig')
if not os.path.exists(ORIG): ORIG = os.path.join(APP, 'res/cardsfolder/cardsfolder.zip')

overrides = {}
for root, _, files in os.walk(CUSTOM):
    for f in files:
        if f.endswith('.txt'):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, CUSTOM)
            if rel not in _args.exclude:
                overrides[rel] = open(full, 'rb').read()

# Link everything from the real install except the card database.
os.makedirs(os.path.join(OUT, 'res', 'cardsfolder'), exist_ok=True)
for name in os.listdir(APP):
    if name != 'res' and not os.path.lexists(os.path.join(OUT, name)):
        os.symlink(os.path.join(APP, name), os.path.join(OUT, name))
for name in os.listdir(os.path.join(APP, 'res')):
    if name != 'cardsfolder' and not os.path.lexists(os.path.join(OUT, 'res', name)):
        os.symlink(os.path.join(APP, 'res', name), os.path.join(OUT, 'res', name))

src = zipfile.ZipFile(ORIG)
names = set(src.namelist())
missing = [k for k in overrides if k not in names]
assert not missing, f'custom scripts with no matching Forge card: {missing}'
tmp = os.path.join(OUT, 'res', 'cardsfolder', 'cardsfolder.zip.new')
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
    for info in src.infolist():
        out.writestr(info, overrides.get(info.filename, src.read(info.filename)))
os.replace(tmp, os.path.join(OUT, 'res', 'cardsfolder', 'cardsfolder.zip'))
print(f'{_args.out} built with {len(overrides)} custom card scripts: ' + ', '.join(sorted(overrides)))
