"""Add the separately supplied VW-3100 demo kit and its five embedded photos.

Run after build_data.py and attach_photos.py, from the project directory.
"""
from pathlib import Path
from io import BytesIO
import json,re,openpyxl
from PIL import Image

root=Path(__file__).parent
source=next((root/'../upload').glob('VW-3100 Demo-unit List.xlsx'))
data_path=root/'data/inventory.json'
data=json.loads(data_path.read_text(encoding='utf-8'))
data['groups']=[g for g in data['groups'] if g['id']!='vw3100-demo-kit']
sheet=openpyxl.load_workbook(source,data_only=True).active

def clean(value):return re.sub(r'\s+',' ',str(value or '')).strip().strip('"')

items=[]
for row_num in list(range(3,18))+list(range(20,28)):
 row=[sheet.cell(row_num,col).value for col in range(7,12)]
 _checkbox,model,name,_serial,maker=row
 name=clean(name);model=clean(model)
 if model in ('↑','-'):model=''
 if name.startswith('AX-501') and not model:model='AX-501'
 qty=2 if '× 2' in name else 8 if '×8' in name else 1 if '×1' in name else ''
 # Preserve the listed item text, including quantity cues and preinstalled media.
 items.append({'no':str(len(items)+1),'name':name,'model':model,'serial':'',
  'asset':'','qty':str(qty) if qty else '', 'status':'',
  'remark':f'ผู้ผลิต: {clean(maker)}' if clean(maker) not in ('','-','ONO SOKKI') else '',
  'owner':'','location':'','source':f'デモ品!{row_num}'})

group={'id':'vw3100-demo-kit','year':'ชุดเพิ่มเติม','number':'VW-3100',
 'name':'VW-3100 Portable Vibration Meter Demo Kit','demo':'','asset':'',
 'model':'VW-3100','serial':'250701285T','qty':'1','status':'',
 'note':'Serial No. อ่านจากภาพป้ายหลังเครื่อง; ช่อง Serial Number ในตารางว่าง และช่องตรวจนับยังไม่ทำเครื่องหมาย',
 'remark':'ชุดอุปกรณ์ตาม VW-3100 Demo-unit List; ยังไม่ยืนยันผลตรวจนับ',
 'owner':'','location':'','items':items,'checkCount':0,'checkNg':0,
 'source':'デモ品!1–27','photoSource':source.name}

photo_dir=root/'photos';photo_dir.mkdir(exist_ok=True)
photos=[]
for im_num,caption in [(2,'VW-3100 และอุปกรณ์ทั้งหมด'),
                       (3,'ป้ายหลังเครื่อง VW-3100 · S/N 250701285T'),
                       (0,'เครื่องและอุปกรณ์ในกระเป๋า'),
                       (1,'เอกสาร สาย AX-501 และอุปกรณ์เสริม'),
                       (4,'VW-0360 Vibration Diagnosis Assist Tool')]:
 image=sheet._images[im_num]
 path=photo_dir/f'vw3100-{im_num}.webp'
 with Image.open(BytesIO(image._data())) as original:
  original=original.convert('RGB');original.thumbnail((1200,1200),Image.Resampling.LANCZOS)
  original.save(path,'WEBP',quality=80,method=6)
 photos.append({'src':f'photos/{path.name}','caption':caption,'model':'VW-3100' if im_num in (2,3) else '',
                'serial':'250701285T' if im_num==3 else '',
                'source':f'デモ品!image {im_num+1}'})

group['cover']=photos[0]['src'];group['photos']=photos
for item in items:
 if item['model']=='VW-0360':item['photo']=photos[4]['src']
data['groups'].append(group)
data['meta']['groups']=len(data['groups'])
data['meta']['items']=sum(len(g['items']) for g in data['groups'])
data['meta']['photos']=sum(len(g.get('photos',[])) for g in data['groups'])
data['meta']['additionalSource']=source.name
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
data_path.write_text(payload,encoding='utf-8')
(root/'data/inventory.js').write_text('window.DEMO_INVENTORY = '+payload+';\n',encoding='utf-8')
print(f'groups={data["meta"]["groups"]} items={data["meta"]["items"]} photos={data["meta"]["photos"]}')
