"""Attach verified equipment photos from the picture workbook to inventory.json.

Run build_data.py first. The 2017 and 2023 picture books embed identical images;
the 2023 copy is the sole asset source. Manual mapping uses model / serial, not
picture-book numbers (which differ from inventory numbering in 2016).
"""
from pathlib import Path
from io import BytesIO
import json, re, openpyxl
from PIL import Image

root=Path(__file__).parent
source=next((root/'../upload').glob('DemoUnit Pic*2023*.xlsx'))
data_path=root/'data/inventory.json'
data=json.loads(data_path.read_text(encoding='utf-8'))
by_key={(g['year'],int(g['number'])):g for g in data['groups'] if g['number'].isdigit()}
photo_dir=root/'photos';photo_dir.mkdir(exist_ok=True)

# Picture-book section + printed set number -> inventory year + set number.
mapping={
 ('Demo Unit 2007',1):('2007',1),
 **{('Demo Unit 2013',n):('2013',n) for n in (2,3,5,6,7,8,9,10)},
 ('Demo Unit 2013',4):('photo',4),
 ('Demo Unit 2015',11):('2015',11),('Demo Unit 2015',12):('2015',12),
 ('Demo Unit 2016 ',24):('2016',13),
 **{('Demo Unit 2016 ',n):('2016',14) for n in (25,26,27,28,29,30)},
 ('Demo Unit 2016 ',31):('2016',15),('Demo Unit 2016 ',32):('2016',15),
 ('Demo Unit 2016 ',33):('2016',17),
}

# This physical DS-3000 is missing from the main ledger but is present in the
# picture book and in the 'All List' inspection sheet (Asset 41-020).
ds3000={'id':'photo-ds3000-41-020','year':'2013','number':'4P',
 'name':'DS-3000 Multi-Channel Data Station 4 CH','demo':'','asset':'41-020',
 'model':'DS-3000','serial':'K201308003-01','qty':'1','status':'','note':'จากสมุดภาพและ All List; เป็นคนละเครื่องกับ DS-3104 (41-024)',
 'remark':'','owner':'Golf','location':'Training Room','items':[], 'checkCount':0,'checkNg':0,
 'source':'Demo Unit 2013 / All List!34–42'}
data['groups'].append(ds3000)
by_key[('photo',4)]=ds3000

book=openpyxl.load_workbook(source,data_only=True)
count=0
for sheet in book:
 if not sheet._images:continue
 entries=[]
 for ordinal,im in enumerate(sheet._images):
  anchor=im.anchor._from.row+1
  markers=[(r,sheet.cell(r,2).value) for r in range(max(1,anchor-4),anchor+2)
           if isinstance(sheet.cell(r,2).value,(int,float))]
  if not markers:continue
  marker_row,marker=markers[-1]
  source_group=int(marker)
  target=mapping.get((sheet.title,source_group))
  if target is None:continue
  group=by_key.get(target)
  if group is None:continue
  def field(offset):
   val=sheet.cell(marker_row+offset,7).value
   return re.sub(r'\s+',' ',str(val or '')).strip().strip('-')
  model,name,serial=field(4),field(6),field(8)
  caption=name or model or group['name']
  photo_key=f'{sheet.title.strip().replace(" ","-").lower()}-{anchor:04d}-{ordinal:02d}'
  path=photo_dir/f'{photo_key}.webp'
  with Image.open(BytesIO(im._data())) as pic:
   pic=pic.convert('RGB')
   pic.thumbnail((1050,1050),Image.Resampling.LANCZOS)
   pic.save(path,'WEBP',quality=81,method=6)
  photo={'src':f'photos/{path.name}','caption':caption,'model':model,'serial':serial,
         'source':f'{sheet.title}!B{marker_row}','sort':anchor}
  group.setdefault('photos',[]).append(photo)
  if group is ds3000 and marker!=4:
   ds3000['items'].append({'no':str(marker),'name':caption,'model':model,'serial':serial,
     'asset':'41-020','qty':'1','status':'','remark':'','owner':'Golf','location':'Training Room',
     'source':photo['source'],'photo':photo['src']})
  entries.append(photo)
  count+=1

for group in data['groups']:
 photos=group.get('photos',[])
 photos.sort(key=lambda p:p.pop('sort'))
 if photos:
  # A group-leading photo shows the main unit if there is one.
  group['cover']=photos[0]['src']
  for item in group['items']:
   if item.get('photo'):continue
   candidates=[p for p in photos if p['model'] and item['model'] and
               p['model'].casefold()==item['model'].casefold() and
               (not p['serial'] or not item['serial'] or p['serial']==item['serial'])]
   if len(candidates)==1:item['photo']=candidates[0]['src']

la3560=by_key.get(('2013',5))
if la3560:
 la3560['note']=(la3560['note']+'; ' if la3560['note'] else '') + 'Serial No. ในทะเบียนหลัก 26500532 แต่สมุดภาพ 36500532 (Asset 41-032) — โปรดตรวจหมายเลขที่เครื่อง'

data['meta']['photoSource']=source.name
data['meta']['groups']=len(data['groups'])
data['meta']['items']=sum(len(g['items']) for g in data['groups'])
data['meta']['photos']=count
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
data_path.write_text(payload,encoding='utf-8')
(root/'data/inventory.js').write_text('window.DEMO_INVENTORY = '+payload+';\n',encoding='utf-8')
print(f'groups={len(data["groups"])} items={data["meta"]["items"]} photos={count} photo groups={sum(bool(g.get("photos")) for g in data["groups"])}')
