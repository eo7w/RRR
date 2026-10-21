import json, sys, os, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8786/'
out=Path(os.environ.get('TEST_ARTIFACT_DIR') or tempfile.mkdtemp(prefix='trade-picker-'));out.mkdir(parents=True,exist_ok=True)
checks={}
with sync_playwright() as p:
 browser=p.chromium.launch(**({'executable_path':os.environ['CHROMIUM_PATH']} if os.environ.get('CHROMIUM_PATH') else {}),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base,wait_until='domcontentloaded');page.wait_for_timeout(1800)
 control=page.get_by_role('button',name='اختيار الأصل',exact=True)
 checks['initial_symbol']=control.inner_text()
 page.screenshot(path=str(out/'asset-control-mobile.png'))
 control.click();page.wait_for_timeout(600)
 checks['opens']=page.locator('.sheet--assets').is_visible()
 checks['tabs']=page.get_by_role('tab').all_text_contents()
 checks['trading_rows']=page.locator('[data-asset-symbol]').all_text_contents()[:6]
 page.screenshot(path=str(out/'asset-picker-trading-mobile.png'))
 page.get_by_role('tab',name='الأسهم',exact=True).click();page.wait_for_timeout(200)
 checks['stock_rows']=page.locator('[data-asset-symbol]').all_text_contents()[:6]
 page.screenshot(path=str(out/'asset-picker-stocks-mobile.png'))
 search=page.get_by_role('searchbox',name='البحث في الأصول')
 search.fill('AAPL');checks['search_AAPL']=page.locator('[data-asset-symbol]').count()==1
 search.fill('');page.get_by_role('button',name='تفضيل Apple',exact=True).click()
 page.get_by_role('button',name='الأصول المفضلة',exact=True).click()
 checks['favorites_AAPL']=page.locator('[data-asset-symbol="AAPL"]').is_visible()
 page.get_by_role('button',name='الأصول المفضلة',exact=True).click()
 page.get_by_role('button',name='إغلاق اختيار الأصل',exact=True).click();page.wait_for_timeout(500)
 checks['handle_closes']=page.locator('.sheet--assets').count()==0
 control.click();page.wait_for_timeout(500)
 page.get_by_role('button',name='اختيار EUR / USD',exact=True).click();page.wait_for_timeout(500)
 checks['selection_closes']=page.locator('.sheet--assets').count()==0
 checks['selection_updates']='EUR / USD' in control.inner_text()
 control.click();page.wait_for_timeout(450);page.keyboard.press('Escape');page.wait_for_timeout(450)
 checks['escape_closes']=page.locator('.sheet--assets').count()==0
 control.click();page.wait_for_timeout(450);page.locator('.backdrop').click(position={'x':20,'y':90});page.wait_for_timeout(450)
 checks['backdrop_closes']=page.locator('.sheet--assets').count()==0
 checks['no_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 checks['broken_images']=page.locator('img').evaluate_all('(imgs)=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)')
 checks['errors']=errors
 for height in [666,780]:
  page.set_viewport_size({'width':390,'height':height});control.click();page.wait_for_timeout(450)
  checks['layout_'+str(height)]=page.locator('.sheet--assets').evaluate('(el)=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,scroll:el.scrollHeight,height:el.clientHeight})')
  page.keyboard.press('Escape');page.wait_for_timeout(450)
 browser.close()
(out/'asset-picker-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(json.dumps(checks,ensure_ascii=False,indent=2))
assert all(checks[k] for k in ['opens','search_AAPL','favorites_AAPL','handle_closes','selection_closes','selection_updates','escape_closes','backdrop_closes','no_horizontal_overflow'])
assert not errors and not checks['broken_images']
