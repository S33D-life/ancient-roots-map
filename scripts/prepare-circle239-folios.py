#!/usr/bin/env python3
"""Create private candidate derivatives. Never overwrites supplied proofs or public assets.
Requires Pillow 11.3.0 and macOS Georgia fonts; no fonts are redistributed.
Usage: python3 scripts/prepare-circle239-folios.py PROOF_DIRECTORY NEW_OUTPUT_DIRECTORY
"""
import hashlib,json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageOps
import PIL
SOURCE_MANIFEST='8258283ad988961ce72def7cba3c134bb60d720643bad55498314f926ea380cb'
sha=lambda b:hashlib.sha256(b).hexdigest()
source,out=map(Path,sys.argv[1:])
assert source.resolve()!=out.resolve()
assert not out.exists(), 'Use a new output directory; never overwrite review evidence'
assert PIL.__version__=='11.3.0'
manifest_bytes=(source/'MANIFEST.json').read_bytes()
assert sha(manifest_bytes)==SOURCE_MANIFEST
manifest=json.loads(manifest_bytes)
out.mkdir(parents=True)
fonts=Path('/System/Library/Fonts/Supplemental')
fontfiles=['Georgia.ttf','Georgia Italic.ttf','Georgia Bold.ttf']
font=lambda size,style=0:ImageFont.truetype(str(fonts/fontfiles[style]),size)
paper=(247,230,190);green=(49,67,39);gold=(203,167,98)
references=['Sources: RHS · Ancient Yew Group','Sources: Forestry England · Woodland Trust','Sources: RHS · NCCIH','Source: University College Cork Tree Explorers','Sources: Kew · NCCIH · Hong Kong Centre for Food Safety','Source: RHS','Sources: Cambridge University Botanic Garden · Woodland Trust','Sources: FDA · Manaaki Whenua','Source: Swiss Ornithological Institute','Source: Frances Hodgson Burnett, The Secret Garden (1911)']
headers=[
 ('ANCIENT FRIEND of yOur Blooming Week','A living witness','A living witness, holding memory, resilience and the quiet power of deep time.'),
 ('TREE COMPANION of yOur Blooming Week','The golden canopy','A graceful guardian of the woodland, weaving light, life and belonging.'),
 ('PLANT COMPANION of yOur Blooming Week','Hidden fire','REFLECTION: Hidden warmth, quiet growth, a new beginning.'),
 ('SEED COMPANION of yOur Blooming Week','On the wind','A traveller of the air, carrying new life on the breeze.'),
 ('LEAF COMPANION of yOur Blooming Week','An ancient fan','A living fossil, bridging deep time to the present, with a leaf like a golden fan.'),
 ('FLOWER COMPANION of yOur Blooming Week','Autumn’s colour','A flower of abundance, creativity and resilient beauty, bright even as the days grow shorter.'),
 ('FRUIT COMPANION of yOur Blooming Week','Winter’s gift','A wild gift of resilience, renewal and nourishment, carrying summer’s light into winter.'),
 ('FUNGUS COMPANION of yOur Blooming Week','Woodland connections','A wild teacher of connection, transformation and the unseen life of the forest.'),
 ('','A visitor with seeds','A forest guardian of memory, planting tomorrow’s trees and feeding life through winter.'),
 ('BOOK COMPANION of yOur Blooming Week','A garden reborn','EDITORIAL REFLECTION: Behind a closed door, life may still be waiting.'),
]
source_urls=[
 ['https://www.rhs.org.uk/plants/yew','https://www.ancient-yew.org/yew_trees/defynnog-405/','https://medlineplus.gov/ency/article/002877.htm'],
 ['https://www.forestryengland.uk/tree-species/beech','https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/british-trees/a-z-of-british-trees/common-beech/'],
 ['https://www.rhs.org.uk/plants/19233/zingiber-officinale/details','https://www.nccih.nih.gov/health/ginger'],
 ['https://www.ucc.ie/en/tree-explorers/trees/a-z/acerpseudoplatanus/'],
 ['https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:262125-1/general-information','https://www.nccih.nih.gov/health/ginkgo','https://www.cfs.gov.hk/english/multimedia/multimedia_pub/multimedia_pub_fsf_204_02.html'],
 ['https://www.rhs.org.uk/plants/dahlia/growing-guide','https://www.rhs.org.uk/garden-inspiration/plants-we-love/five-top-dahlias-for-pollinators'],
 ['https://www.botanic.cam.ac.uk/the-garden/plant-list/rosa-canina/','https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/dog-rose'],
 ['https://www.fda.gov/food/post-market-determinations-use-substance-not-gras/letter-industry-use-amanita-muscaria-or-its-constituents-food','https://virtualmycota.landcareresearch.co.nz/webforms/vM_Species_Details.aspx?pk=312'],
 ['https://www.vogelwarte.ch/en/projects/dispersal-of-swiss-stone-pine-seeds-by-northern-nutcrackers/'],
 ['https://www.gutenberg.org/ebooks/113'],
]
items=[]
def wrapped(draw,text,f,width):
 lines=[];line=''
 for word in text.split():
  trial=(line+' '+word).strip()
  if draw.textlength(trial,font=f)>width and line:lines.append(line);line=word
  else:line=trial
 if line:lines.append(line)
 return lines
for item in manifest['files']:
 raw=(source/item['image_file']).read_bytes();assert sha(raw)==item['sha256']
 original=Image.open(source/item['image_file']).convert('RGB');assert original.size==(1536,1024)
 im=original.copy();d=ImageDraw.Draw(im);regions=[]
 def patch(box,color=paper):
  regions.append(box);d.rectangle(box,fill=color)
 patch((83,930,1453,955));d.line((83,951,1453,951),fill=gold,width=1)
 footer='Illustration · '+references[item['number']-1]
 d.text((96,932),footer,font=font(14),fill=green)
 changes=['Replace proof-status footer with illustration/source credit; approval remains pending in metadata.']
 if item['number'] in (3,10):
  patch((1305,22,1504,157))
  d.rounded_rectangle((1306,23,1503,156),radius=8,outline=gold,width=1)
  label='EDITORIAL REFLECTION' if item['number']==10 else 'REFLECTION'
  banner='Behind a closed door, life may still be waiting.' if item['number']==10 else 'Hidden warmth, quiet growth, a new beginning.'
  d.text((1404,32),label,font=font(11,2),fill=green,anchor='mt')
  lines=wrapped(d,banner,font(20,1),176)
  assert len(lines)*24<=104
  for j,line in enumerate(lines):d.text((1404,52+j*24),line,font=font(20,1),fill=green,anchor='mt')
  changes.append('Retype top-right banner as explicitly editorial, unquoted reflection.')
 if item['number']==3:
  patch((530,91,1025,116))
  d.text((778,93),'PLANT COMPANION of yOur Blooming Week',font=font(20),fill=green,anchor='mt')
  changes.append('Restore readable Plant role above the existing Hidden fire panel.')
 if item['number']==7:
  patch((105,705,1404,779),original.getpixel((100,700)))
  item['text']['safety_or_source_note']='Do not treat rosehip as a medical treatment. The fine hairs around the seeds can cause irritation. This artwork is not a harvesting guide.'
  lines=wrapped(d,item['text']['safety_or_source_note'],font(28),1280)
  assert len(lines)*34<=75
  for j,line in enumerate(lines):d.text((112,706+j*34),line,font=font(28),fill=green)
  changes.append('Narrow rosehip note to supported irritation claim.')
 if item['number']==9:
  patch((675,228,1100,272))
  d.text((680,232),'THE BIRD COMPANION',font=font(26,2),fill=green)
  d.line((680,269,1100,269),fill=gold,width=1)
  regions.append((89,265,632,585))
  study=original.crop((124,267,632,564));study=ImageOps.contain(study,(544,318),Image.Resampling.LANCZOS)
  d.rectangle((89,265,632,585),fill=paper);im.paste(study,(89,266))
  changes.append('Explicit Bird role; remove stray inherited text from decorative study crop without changing original fronts.')
 mask=Image.new('L',im.size);md=ImageDraw.Draw(mask)
 for box in regions:md.rectangle(box,fill=255)
 difference=ImageChops.difference(im,original)
 assert ImageChops.multiply(difference,ImageChops.invert(mask).convert('RGB')).getbbox() is None
 filename=item['image_file'].replace('TYPESET_REVIEW','FINAL_CANDIDATE')
 im.save(out/filename,compress_level=9)
 entry={**item,'filename':filename,'proofSha256':item['sha256'],'sha256':sha((out/filename).read_bytes()),'dimensions_px':[1536,1024],'changes':changes,'editRegions':regions,'unchangedOutsideEditRegions':True,'status':'CANDIDATE_PENDING_HUMAN_APPROVAL','footer':footer}
 role,essence,banner=headers[item['number']-1]
 parts=['The Council of Life','CIRCLE 239 · 2–8 NOVEMBER 2026']
 if item['number']>2:parts.append('What remains alive when everything appears to be sleeping?')
 parts += [str(item['number'])+' · '+item['name'],role,essence,banner,'THE BIRD COMPANION' if item['number']==9 else 'THE LIVING COMPANION',item['text']['description'],'LIVING SCIENCE & CARE',item['text']['safety_or_source_note'],"THIS WEEK’S REFLECTION",item['text']['reflection'],footer]
 transcript='\n\n'.join(p for p in parts if p)+'\n'
 (out/filename.replace('.png','.txt')).write_text(transcript)
 entry['transcriptSha256']=sha(transcript.encode())
 entry['references']=source_urls[item['number']-1]
 entry['reviewedAt']='2026-11-04'
 entry['humanApproval']=False
 items.append(entry)
receipt={'circle':239,'receiptId':'typeset-candidates-v2','publicationApproved':False,'sourceManifestSha256':SOURCE_MANIFEST,'pillow':PIL.__version__,'fonts':{name:sha((fonts/name).read_bytes()) for name in fontfiles},'items':items}
(out/'MANIFEST.json').write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+'\n')
(out/'SHA256SUMS.txt').write_text(''.join(f"{i['sha256']}  {i['filename']}\n" for i in items))
thumb=Image.new('RGB',(1536,1368),'#eee3c6')
for n,i in enumerate(items):
 im=Image.open(out/i['filename']);im.thumbnail((500,333));thumb.paste(im,((n%3)*512,(n//3)*342))
thumb.save(out/'CONTACT_SHEET.jpg',quality=92)
print('Created ten private candidates; pixel-difference masks passed. Human approval remains pending.')
