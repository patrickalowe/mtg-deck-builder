const fs=require('fs');
const Scry=require('scryfall-sdk');
Scry.setAgent('mtg-commander','1.0.0');
const names=['Aetherize','Anguished Unmaking','Austere Command',"Chandra's Ignition",'Clever Concealment','Cyclonic Rift','Fateful Absence','Infernal Grasp','Massacre Wurm','Oath of Gideon','Spectral Procession',"Sram's Expertise",'Toxic Deluge','Wrath of God'];
fs.writeFileSync('analysis/jace-prices/request.json',JSON.stringify({identifiers:names.map(name=>({name}))}));
Scry.Cards.collection(...names.map(n=>Scry.CardIdentifier.byName(n))).waitForAll().then(cards=>{fs.writeFileSync('analysis/jace-prices/collection.json',JSON.stringify({data:cards},null,2));console.log('Fetched',cards.length)}).catch(e=>{console.error('SDK lookup failed:',e.message);process.exitCode=1;});
