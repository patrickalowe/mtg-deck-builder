import json,zipfile,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];p=ROOT/'analysis/mill-defense'
cards=[]
for suffix in ['0','1','faces']:cards+=json.loads((p/f'scryfall-{suffix}.json').read_text())['data']
db={c['name']:c for c in cards};a=json.loads((p/'archidekt-13344339.json').read_text());exc={c['name'] for c in a['categories'] if not c['includedInDeck']};main=[c for c in a['cards'] if not exc.intersection(c['categories']) and not c.get('deletedAt')];names=[c['card']['oracleCard']['name'] for c in main]
z=zipfile.ZipFile(ROOT/'forge/app-custom/res/cardsfolder/cardsfolder.zip');scripts={}
for f in z.namelist():
 if f.endswith('.txt'):
  s=z.read(f).decode(errors='replace');m=re.search('^Name:(.+)',s,re.M)
  if m:scripts[m[1]]=s
legend=[];nonlegend=[]
for l in (ROOT/'gauntlet/versions/jace/v0.6-precon-engine/deck.dck').read_text().splitlines():
 m=re.match(r'^\d+ (.+)',l)
 if not m:continue
 n=m[1];s=scripts.get(n,'');typ=re.search(r'^Types:(.+)',s,re.M);t=typ[1] if typ else ''
 if 'Legendary' in t:legend.append(n)
 if 'Creature' in t and 'Legendary' not in t:nonlegend.append(n)
text=lambda n:db[n].get('oracle_text','')+'\n'+'\n'.join(f.get('oracle_text','') for f in db[n].get('card_faces',[]))
audit={'mainCount':sum(c['quantity'] for c in main),'commander':[c['card']['oracleCard']['name'] for c in main if 'Commander'in c['categories']],'gameChangers':[n for n in names if db[n].get('game_changer')],'illegal':[n for n in names if db[n]['legalities']['commander']!='legal'],'offColor':[n for n in names if not set(db[n]['color_identity'])<=set('WU')],'extraTurns':[n for n in names if re.search(r'take an extra turn|takes an extra turn',text(n),re.I)],'massLandDestructionTextFlags':[n for n in names if re.search(r'destroy all lands|exile all lands',text(n),re.I)],'v06LegendaryPermanentsIncludingCommander':legend,'v06NonlegendaryCreatures':nonlegend,'aiRemoveAll':[n for n in names if re.search(r'^AI:RemoveDeck:All',scripts.get(n,scripts.get(n.split(' // ')[0],'')),re.M)],'aiRemoveRandom':[n for n in names if re.search(r'^AI:RemoveDeck:Random',scripts.get(n,scripts.get(n.split(' // ')[0],'')),re.M)]}
(p/'audit.json').write_text(json.dumps(audit,indent=2)+'\n');print(json.dumps(audit,indent=2))
for n in ["Primevals' Glorious Rebirth",'Elixir of Immortality',"Liliana, Death's Majesty"]:
 c=db[n];print(n,c['mana_cost'],'GC',c.get('game_changer'),c['oracle_text'],c['scryfall_uri'],c['rulings_uri']);(p/(c['id']+'-script.txt')).write_text(scripts[n])
# A research snapshot only, deliberately outside forge/decks and the gauntlet version tree.
lines=['[metadata]','Name=PROPOSAL-ONLY-Hope-Estheim-13344339','[Commander]']
for c in main:
 if 'Commander' in c['categories']:lines.append(str(c['quantity'])+' '+c['card']['oracleCard']['name'].split(' // ')[0])
lines+=['[Main]']
for c in main:
 if 'Commander' not in c['categories']:lines.append(str(c['quantity'])+' '+c['card']['oracleCard']['name'].split(' // ')[0])
(p/'hope-estheim-PROPOSAL-ONLY.dck').write_text('\n'.join(lines)+'\n')
