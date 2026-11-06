import json,subprocess,time,urllib.parse
from pathlib import Path
p=Path(__file__).resolve().parent
collection=json.loads((p/'collection.json').read_text());assert not collection.get('not_found')
output=[]
for c in collection['data']:
 query=urllib.parse.urlencode({'q':f'oracleid:{c["oracle_id"]} game:paper','unique':'prints','order':'usd','dir':'asc'})
 url='https://api.scryfall.com/cards/search?'+query;cards=[];page=0
 while url:
  time.sleep(.15);page+=1
  file=p/f'{c["oracle_id"]}-{page}.json'
  if not file.exists():subprocess.run(['curl','-fsSL','-A','mtg-commander/1.0.0',url,'-o',str(file)],check=True)
  data=json.loads(file.read_text());cards+=data['data'];url=data.get('next_page') if data.get('has_more') else None
 choices=[]
 for card in cards:
  if card.get('digital') or card.get('lang')!='en' or card.get('legalities',{}).get('commander')!='legal' or card.get('border_color') in ['gold','silver']:continue
  for finish,field in [('nonfoil','usd'),('foil','usd_foil'),('etched','usd_etched')]:
   value=card.get('prices',{}).get(field)
   if value is not None:choices.append((float(value),finish,card))
 assert choices,c['name']
 price,finish,card=min(choices,key=lambda x:(x[0],x[1]!='nonfoil'))
 nf=[x for x in choices if x[1]=='nonfoil'];nonfoil=min(nf,key=lambda x:x[0]) if nf else None
 r={'name':c['name'],'usd':price,'finish':finish,'set':card['set'],'set_name':card['set_name'],'collector_number':card['collector_number'],'url':card['scryfall_uri'].split('?')[0],'id':card['id'],'game_changer':c.get('game_changer',False),'nonfoil':{'usd':nonfoil[0],'set':nonfoil[2]['set'],'collector_number':nonfoil[2]['collector_number'],'url':nonfoil[2]['scryfall_uri'].split('?')[0]} if nonfoil else None,'printings_checked':len(cards)}
 output.append(r);print(c['name'],price,finish,card['set'],flush=True)
(p/'cheapest.json').write_text(json.dumps(output,indent=2)+'\n')
print('Total',round(sum(x['usd'] for x in output),2),'without Rift',round(sum(x['usd'] for x in output if x['name']!='Cyclonic Rift'),2))
