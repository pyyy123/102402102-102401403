import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the exact classic script loaded by index.html, without duplicating its logic.
function setup(){
  const nodes = new Map();
  const handlers = {};
  const document = {
    querySelector(selector){
      if(selector==='[data-form="publish"]')return null;
      if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',open:false,showModal(){this.open=true},close(){this.open=false}});
      return nodes.get(selector);
    },
    addEventListener(name,fn){(handlers[name]??=[]).push(fn)}
  };
  const store=new Map();
  const context=vm.createContext({document,window:{scrollTo(){},addEventListener(){}},location:{hash:''},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,Date,FormData:class{constructor(form){this.data=form.values||{}}[Symbol.iterator](){return Object.entries(this.data)[Symbol.iterator]()}},navigator:{}});
  vm.runInContext(fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),context);
  return {run:s=>vm.runInContext(s,context),nodes,handlers};
}
test('12 named pages render with page title and no runtime exceptions',()=>{
 const t=setup();for(const page of ['home','map','search','detail','publish','success','profile','bind','verify','progress','return','thanks']){
   t.run(`go('${page}')`);assert.ok(t.nodes.get('#app').innerHTML.length>300,page);
 }
});
test('all four status stars appear on homepage with accessible text',()=>{
 const t=setup();const html=t.nodes.get('#app').innerHTML;for(const name of ['寻找中','待认领','已找回','已归还'])assert.ok(html.includes(`aria-label="${name}"`));
});
test('detail escapes user supplied HTML',()=>{const t=setup();t.run(`items[0].title='<img src=x onerror=alert(1)>';go('detail')`);assert.ok(t.nodes.get('#app').innerHTML.includes('&lt;img'));assert.ok(!t.nodes.get('#app').innerHTML.includes('<img src=x'));});
test('unverified detail hides phone and approved detail reveals it',()=>{const t=setup();t.run(`go('detail')`);assert.ok(!t.nodes.get('#app').innerHTML.includes('13800000001'));t.run(`user.verification='approved';render()`);assert.ok(t.nodes.get('#app').innerHTML.includes('13800000001'));});
test('search combines keyword, area, category and date',()=>{const t=setup();assert.equal(t.run(`filter={keyword:'耳机',area:'图书馆',category:'电子产品',date:'2026-10-03'};filtered().length`),1);assert.equal(t.run(`filter.date='2026-10-04';filtered().length`),0);});
test('rose requires completed handover and recipient; duplicate is blocked',()=>{const t=setup();assert.equal(t.run(`canThank(items[0])`),false);assert.equal(t.run(`canThank(items[2])`),true);assert.equal(t.run(`items[2].rose={message:'谢谢'};canThank(items[2])`),false);});
test('non-owner never sees state update control',()=>{const t=setup();t.run(`selected='s2';go('return')`);assert.ok(!t.nodes.get('#app').innerHTML.includes('data-action="finish"'));});
test('verification supports pending, approved and rejected states',()=>{const t=setup();for(const state of ['pending','approved','rejected']){t.run(`user.verification='${state}';go('progress')`);assert.ok(t.nodes.get('#app').innerHTML.includes(t.run('verificationName()')));}});
test('publish guard redirects unbound user and retains draft',()=>{const t=setup();t.run(`draft={title:'蓝色水杯',category:'其他',area:'教学区',date:'2026-10-01',type:'lost',description:'蓝色',contact:'13800000001'}`);const values=t.run('draft');t.handlers.submit[0]({preventDefault(){},target:{dataset:{form:'publish'},values}});assert.equal(t.run('route'),'bind');assert.equal(t.run('draft.title'),'蓝色水杯');});
test('empty publication shows error and creates no item',()=>{const t=setup();t.handlers.submit[0]({preventDefault(){},target:{dataset:{form:'publish'},values:{}}});assert.equal(t.run('items.length'),5);assert.ok(t.nodes.get('#modal-body').innerHTML.includes('表单需要补充'));});
test('map asset is bundled locally',()=>assert.ok(fs.statSync(new URL('../assets/campus-night.png',import.meta.url)).size>10000));
test('rose random selection covers six colors and records date',()=>{const t=setup();for(const [i,color] of ['red','blue','yellow','pink','orange','purple'].entries()){assert.equal(t.run(`Math.random=()=>${(i+.5)/6};makeRose('谢谢','同学').color`),color);}assert.ok(!Number.isNaN(Date.parse(t.run(`makeRose('谢谢','同学').receivedAt`))));});
test('received rose keeps its color and date through saves and rerenders',()=>{const t=setup();t.run(`items[4].rose=makeRose('谢谢你的帮助','小面包');save();go('profile')`);const gift=t.run('JSON.stringify(items[4].rose)');assert.ok(t.nodes.get('#app').innerHTML.includes('assets/avatar-nova.svg'));assert.ok(t.nodes.get('#app').innerHTML.includes('赠送日期：'));assert.ok(t.nodes.get('#app').innerHTML.includes('谢谢你的帮助'));t.run(`go('home');go('profile')`);assert.equal(t.run('JSON.stringify(items[4].rose)'),gift);assert.equal(t.run(`JSON.stringify(read('pickstar-v2-items',[])[4].rose)`),gift);});
test('legacy undated gifts are marked honestly and never invent a date',()=>{const t=setup();assert.equal(t.run(`roseDate({message:'旧祝福'})`),'日期未记录');});
test('index loads classic local JavaScript for direct file opening',()=>{const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('<script src="app.js">'));assert.ok(!html.includes('type="module"'));});
test('seven constellation entries reach seven distinct pages; map is only in homepage',()=>{const t=setup();assert.equal(t.run('navigationStars.length'),7);assert.equal(t.run('new Set(navigationStars.map(x=>x[0])).size'),7);const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(!html.includes('data-go="map"'));assert.ok(t.nodes.get('#app').innerHTML.includes('data-go="map"'));});
test('notes show supplied photos and details do not duplicate them',()=>{const t=setup();for(const file of ['earbuds','card-holder','bottle','notebook']){assert.ok(t.nodes.get('#app').innerHTML.includes(`assets/${file}.jpg`));assert.ok(fs.statSync(new URL(`../assets/${file}.jpg`,import.meta.url)).size>1000);}assert.ok(t.nodes.get('#app').innerHTML.includes('note-description'));t.run(`go('detail')`);assert.ok(!t.nodes.get('#app').innerHTML.includes('<img'));});
test('completed notes are stationary but still openable',()=>{const t=setup();const html=t.nodes.get('#app').innerHTML;assert.ok(html.includes('class="note settled" data-item="s3"'));assert.ok(html.includes('class="note active-note" data-item="s1"'));});
test('core workflow publishes, searches, opens contact, and updates status',async()=>{
 const t=setup();const submit=(kind,values)=>t.handlers.submit[0]({preventDefault(){},target:{dataset:{form:kind},values}});
 const click=async dataset=>{await t.handlers.click[0]({target:{closest:()=>({dataset})}})};
 t.run(`user.bound=true;user.phone='13800000001';draft={title:'流程测试水杯',category:'其他',area:'教学区',date:'2026-10-01',type:'lost',description:'测试蓝色水杯',contact:'13800000001'}`);
 submit('publish',t.run('draft'));assert.equal(t.run('route'),'success');assert.equal(t.run('items.length'),6);
 submit('search',{keyword:'流程测试水杯'});assert.equal(t.run('filtered().length'),1);
 await click({item:t.run('items[0].id')});assert.equal(t.run('route'),'detail');
 await click({action:'contact-auth'});assert.equal(t.run('route'),'verify');
 await click({review:'approved'});t.run(`go('detail')`);assert.ok(t.nodes.get('#app').innerHTML.includes('13800000001'));
 await click({action:'copy'});assert.ok(t.nodes.get('#modal-body').innerHTML.includes('请手动复制'));
 await click({go:'return'});await click({action:'finish'});assert.equal(t.run('current().status'),'seeking');
 t.nodes.get('#handover-account') || t.run(`$('#handover-account')`);t.nodes.get('#handover-account').value='小面包';
 await click({action:'confirm-finish'});assert.equal(t.run('current().status'),'found');t.run(`go('home')`);assert.ok(t.nodes.get('#app').innerHTML.includes('note settled'));
});
test('three accounts have separate verification and publication ownership',()=>{const t=setup();t.run(`user.bound=true;user.verification='approved';switchAccount('小面包')`);assert.equal(t.run('user.bound'),false);assert.equal(t.run('isOwner(items[0])'),false);assert.equal(t.run('isOwner(items[1])'),true);t.run(`switchAccount('星星同学')`);assert.equal(t.run('items.filter(isOwner).length'),0);t.run(`switchAccount('Nova')`);assert.equal(t.run('user.verification'),'approved');assert.equal(t.run(`read('pickstar-active-account','')`),'Nova');});
test('found item sends one rose from Nova to the finder account',()=>{const t=setup();t.run(`selected='s4';go('return')`);assert.ok(t.nodes.get('#app').innerHTML.includes('赠人玫瑰'));t.handlers.submit[0]({preventDefault(){},target:{dataset:{form:'thanks'},values:{message:'谢谢小面包'}}});assert.equal(t.run('current().rose.from'),'Nova');assert.equal(t.run('canThank(current())'),false);t.run(`switchAccount('小面包')`);assert.ok(t.nodes.get('#app').innerHTML.includes('谢谢小面包'));assert.ok(t.nodes.get('#app').innerHTML.includes('<b>1</b>收到的玫瑰'));t.run(`switchAccount('星星同学')`);assert.ok(!t.nodes.get('#app').innerHTML.includes('谢谢小面包'));});
test('non-owner cannot finish another account item even by dispatching action',async()=>{const t=setup();t.run(`switchAccount('星星同学');selected='s1'`);await t.handlers.click[0]({target:{closest:()=>({dataset:{action:'confirm-finish'}})}});assert.equal(t.run('current().status'),'seeking');});
test('unbound contact path continues from binding to verification',async()=>{const t=setup();await t.handlers.click[0]({target:{closest:()=>({dataset:{action:'contact-auth'}})}});assert.equal(t.run('route'),'bind');t.run('codeSent=true');t.handlers.submit[0]({preventDefault(){},target:{dataset:{form:'bind'},values:{phone:'13800000001',code:'123456'}}});assert.equal(t.run('route'),'verify');});
