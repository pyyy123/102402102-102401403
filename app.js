// 教学阶段快照：本阶段仅包含已列出的功能实现。
/* PickStar: classic script supports Chrome file:// without a server. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areas=['图书馆','教学区','生活区','运动场','北门'];
const categories=['电子产品','证件卡包','钥匙','书籍文具','衣物配饰','其他'];
const labels={seeking:'寻找中',claimed:'待认领',found:'已找回',returned:'已归还'};
const coords={'图书馆':[68,39],'教学区':[60,27],'生活区':[28,56],'运动场':[50,80],'北门':[72,12]};
const pages={home:'01 天枢·星图首页',map:'02 校园星图',search:'03 天璇·寻觅星点',detail:'04 天玑·观星识物',publish:'05 天权·登记星启',success:'06 星启发布成功',profile:'07 我的星册',bind:'08 绑定手机',verify:'09 校园实名认证',progress:'10 认证进度与结果',return:'11 开阳·星物归还',thanks:'12 摇光·赠玫瑰致谢'};
const slogans=[['Pick the lost stars, send roses in return.','拾起散落星辰，归还赠以玫瑰。'],['PickStar · Retrieve your lost star.','PickStar · 寻回属于你的星辰。'],['Pick a star, reunite belongings.','拾取星光，物归原主。']];
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const seed=[
 {id:'s1',title:'黑色蓝牙耳机',category:'电子产品',area:'图书馆',date:'2026-10-03',type:'lost',status:'seeking',description:'图书馆二层靠窗座位附近遗失，耳机盒上有一颗小星星贴纸。',contact:'13800000001',owner:true,publisher:'Nova',finder:'小面包',icon:'🎧'},
 {id:'s2',title:'星星卡套里的校园卡',category:'证件卡包',area:'教学区',date:'2026-10-04',type:'found',status:'claimed',description:'在教学楼走廊拾到。请联系时核对卡片姓名和卡套特征。',contact:'13800000002',owner:false,publisher:'小面包',finder:'小面包',icon:'✉'},
 {id:'s3',title:'蓝色保温杯',category:'其他',area:'运动场',date:'2026-10-02',type:'found',status:'returned',description:'已与失主核对并完成线下交接，谢谢每一份善意。',contact:'13800000002',owner:false,publisher:'小面包',finder:'小面包',recipient:'me',icon:'☕'},
 {id:'s4',title:'月亮挂件钥匙串',category:'钥匙',area:'生活区',date:'2026-10-01',type:'lost',status:'found',description:'钥匙已找回，准备向拾主送出一份感谢。',contact:'13800000001',owner:true,publisher:'Nova',finder:'小面包',recipient:'me',icon:'🗝'},
 {id:'s5',title:'一本手写课堂笔记',category:'书籍文具',area:'北门',date:'2026-10-04',type:'found',status:'claimed',description:'米色封面，里面有蓝色墨水笔记。',contact:'13800000001',owner:true,publisher:'Nova',finder:'Nova',icon:'📖'}
];
function read(key,fallback){return fallback}
let items=read('pickstar-v2-items',seed), user=read('pickstar-v2-user',{bound:false,phone:'',verification:'none'});
if(!Array.isArray(items))items=seed;if(!user||typeof user!=='object')user={bound:false,phone:'',verification:'none'};
const accountNames=['Nova','小面包','星星同学'];
let activeAccount=read('pickstar-active-account','Nova');
if(!accountNames.includes(activeAccount))activeAccount='Nova';
const storedAccounts=read('pickstar-accounts',{});
const accounts=Object.fromEntries(accountNames.map(name=>[name,storedAccounts?.[name]|| (name==='Nova'?user:{bound:false,phone:'',verification:'none'})]));
user=accounts[activeAccount];
const accountDrafts={};
function isOwner(item){return item.publisher===activeAccount}
function recipientOf(item){return item.recipient==='me'?'Nova':item.recipient}
function switchAccount(name){
 if(!accountNames.includes(name))return;
 captureDraft();accountDrafts[activeAccount]=draft;accounts[activeAccount]=user;
 activeAccount=name;user=accounts[name];draft=accountDrafts[name]||{};codeSent=false;backTo='profile';mapMode='browse';
 if(save()){$('#modal').close();route='profile';render()}
}
const samplePhotos={s1:'assets/earbuds.jpg',s2:'assets/card-holder.jpg',s3:'assets/bottle.jpg',s5:'assets/notebook.jpg'};
// Add supplied photos to existing demo records without resetting saved status or user uploads.
items.forEach(x=>{if(samplePhotos[x.id]&&!x.photo)x.photo=samplePhotos[x.id]});
let route='home',selected='s1',mapMode='browse',backTo='profile',draft={},filter={keyword:'',category:'',area:'',date:'',status:''},codeSent=false;
function save(){accounts[activeAccount]=user;return true}
function modal(title,body){$('#modal-body').innerHTML=`<h2>${title}</h2>${body}`;if(!$('#modal').open)$('#modal').showModal()}
const star=(status,extra='')=>`<span class="star ${status} ${extra}" aria-label="${labels[status]}">✦</span>`;
const button=(text,go,cls='')=>`<button class="${cls}" data-go="${go}">${text}</button>`;
const dipper=`<svg class="dipper" viewBox="0 0 330 185" aria-hidden="true"><path d="M20 140 L80 110 L140 120 L188 84 L240 100 L290 45 L235 20 L188 84" fill="none" stroke="#9b91c9" stroke-width="1.5" stroke-dasharray="4 5"/>${[[20,140],[80,110],[140,120],[188,84],[240,100],[290,45],[235,20]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#b4a2dc"/><text x="${x-8}" y="${y+7}" fill="#a99cd1" font-size="25">✧</text>`).join('')}</svg>`;
function hero(title,index=0){return `<section class="hero">${dipper}<div class="eyebrow">PICKSTAR / FOLLOW THE BIG DIPPER</div><h1>${title}</h1><p class="english">${slogans[index][0]}</p><p class="art">${slogans[index][1]}</p></section>`}
function options(list,value,first='全部'){return `<option value="">${first}</option>`+list.map(x=>`<option ${value===x?'selected':''}>${esc(x)}</option>`).join('')}
function notes(list){return list.length?`<div class="cards">${list.map(x=>`<button class="note ${['found','returned'].includes(x.status)?'settled':'active-note'}" data-item="${esc(x.id)}">${star(x.status)}<span class="badge">${labels[x.status]}</span><h3>${esc(x.title)}</h3>${x.photo?`<span class="note-window"><img src="${esc(x.photo)}" alt="${esc(x.title)}实物照片" loading="lazy"></span>`:`<p class="note-description">${esc(x.description.slice(0,100))}</p>`}<p class="muted">⌖ ${esc(x.area)} · ${esc(x.date)}</p><small>${x.type==='lost'?'寻物启事':'拾物招领'}　${esc(x.publisher)}</small></button>`).join('')}</div>`:'<p class="empty">✧ 暂时没有找到星星，试着调整筛选条件。</p>'}
function mapView(){return `<div class="map" id="campus-map"><img src="assets/campus-night.png" alt="福州大学校园夜景手绘地图">${items.map(x=>{const p=x.point||coords[x.area]||[50,50];return `<button class="pin" style="left:${p[0]}%;top:${p[1]}%" data-pin="${esc(x.id)}" aria-label="${esc(x.title)} ${labels[x.status]}">${star(x.status)}</button>`}).join('')}</div><div class="map-caption">${Object.entries(labels).map(([k,v])=>`${star(k)} ${v}`).join('　')}</div>`}
function current(){return items.find(x=>x.id===selected)||items[0]}
function filtered(){return items.filter(x=>(!filter.keyword||`${x.title} ${x.description}`.toLowerCase().includes(filter.keyword.toLowerCase().trim()))&&(!filter.category||x.category===filter.category)&&(!filter.area||x.area===filter.area)&&(!filter.date||x.date>=filter.date)&&(!filter.status||x.status===filter.status))}
function fields(){return `<div class="filters"><label>品类<select name="category">${options(categories,filter.category)}</select></label><label>地点<select name="area">${options(areas,filter.area)}</select></label><label>此日期之后<input type="date" name="date" value="${esc(filter.date)}"></label><label>状态<select name="status"><option value="">全部</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${filter.status===k?'selected':''}>${v}</option>`).join('')}</select></label></div>`}
function render(){const x=current();let html='';
 $('#account-menu').innerHTML=`<button data-action="accounts">◉ ${esc(activeAccount)} · 切换账号</button>`;
 if(route==='home')html=hero('天枢 · 星图首页')+`<form class="searchbar" data-form="search"><input name="keyword" aria-label="搜索物品" placeholder="寻一颗星，找一件心爱之物……"><button class="primary">寻觅星点</button><button type="button" data-action="filters">筛选 ☷</button></form><div class="layout"><section class="panel"><div class="section-title"><h2>校园星图</h2>${button('展开地图 ↗','map')}</div>${mapView()}</section><aside class="panel"><p class="eyebrow">A LITTLE LIGHT, A LITTLE KINDNESS</p><h2>每一颗星<br>都在等一个归途。</h2><p class="english">Lost, found,<br>and loved again.</p><p>让寻找有迹可循，让善意被温柔收藏。</p><div class="actions">${button('✦ 我丢失了','publish','primary')}<button class="purple" data-action="found-publish">✦ 我捡到了</button></div></aside></div><div class="section-title"><h2>散落在校园的星星</h2>${button('寻觅全部 →','search')}</div>${notes(items)}`;
 if(route==='map')html=hero('校园星图 · 循光而行',2)+`<section class="panel"><p>${mapMode==='select'?'点击地图任意位置选择发布地点；星点位置仅为示意。':'点击发光星点，查看物品线索。'}</p>${mapView()}<div class="actions"><button data-action="locate">◎ 立即定位（演示）</button><button data-action="manual">⌖ 手动选点</button>${button('返回发布','publish')}</div></section>`;
 if(route==='search')html=hero('天璇 · 寻觅星点',1)+`<form data-form="search" class="panel"><div class="searchbar"><input name="keyword" value="${esc(filter.keyword)}" placeholder="物品名称或特征" aria-label="关键词"><button class="primary">寻找</button><button type="button" data-action="clear-filter">重置</button></div>${fields()}</form><p class="muted">找到 ${filtered().length} 颗星星</p>${notes(filtered())}`;
 if(route==='detail')html=hero('天玑 · 观星识物',1)+`<section class="panel"><h2>${esc(x.title)}</h2>${star(x.status)} <span class="badge">${labels[x.status]}</span><p>${esc(x.description)}</p><div class="facts"><div>地点：${esc(x.area)}</div><div>日期：${esc(x.date)}</div><div>类别：${esc(x.category)}</div><div>发布者：${esc(x.publisher)}</div></div><h2>玉衡 · 星语核验</h2><p>联系前请核对外观、时间和地点；联系方式功能在后续阶段加入。</p></section>`;
 if(route==='publish')html=hero('天权 · 登记星启',2)+`<form data-form="publish" class="panel form" novalidate><div class="two"><label class="notice"><input type="radio" name="type" value="lost" ${draft.type!=='found'?'checked':''}> ${star('seeking')} 我丢失了</label><label class="notice"><input type="radio" name="type" value="found" ${draft.type==='found'?'checked':''}> ${star('claimed')} 我捡到了</label></div><label>物品名称<input name="title" maxlength="60" value="${esc(draft.title)}" placeholder="给这颗星星一个名字"></label><div class="two"><label>物品类别<select name="category">${options(categories,draft.category,'请选择')}</select></label><label>遗失 / 拾取日期<input type="date" name="date" max="${today()}" value="${esc(draft.date||today())}"></label></div><label>登记地点<select name="area">${options(areas,draft.area,'请选择')}</select></label><button type="button" data-action="choose-place">⌖ 到校园星图选点</button><label>物品照片（可选，最大 2MB）<input type="file" name="photo" accept="image/png,image/jpeg,image/webp"></label>${draft.photo?'<p class="muted">照片已保留</p>':''}<label>特征描述<textarea name="description" maxlength="500">${esc(draft.description)}</textarea></label><label>联系手机<input name="contact" inputmode="tel" value="${esc(draft.contact||user.phone)}" maxlength="11"></label><p class="muted">本阶段发布暂存在内存，刷新后恢复示例。</p><button class="primary">✧ 点亮这颗星</button></form>`;
 if(route==='profile'){const mine=items.filter(isOwner);html=hero('我的星册 · 收藏善意')+`<section class="panel profile-identity"><img class="profile-avatar" src="assets/avatar-nova.svg" alt="个人头像"><div><h2>${esc(activeAccount)} 的星册</h2><p>模拟账号 · 我的发布</p></div></section><h2>我的发布（${mine.length}）</h2>${notes(mine)}`;}
 if(!html)html=hero(pages[route]||'拾星')+'<section class="panel"><p>本教学阶段尚未实现此功能，请按阶段说明继续学习。</p></section>';
 $('#app').innerHTML=html;document.title=`${pages[route]} · 拾星`;}
function verificationName(){return '尚未加入认证功能'}
function canThank(){return false}
function go(page){if(!pages[page])page='home';route=page;render();window.scrollTo(0,0)}
function captureDraft(){const form=$('[data-form="publish"]');if(form){const data=Object.fromEntries(new FormData(form));delete data.photo;draft={...draft,...data};}}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.account){switchAccount(b.dataset.account);return}
 if(b.dataset.go){$('#modal').close();go(b.dataset.go);return}if(b.dataset.item){selected=b.dataset.item;go('detail');return}
 if(b.dataset.pin){const x=items.find(i=>i.id===b.dataset.pin);modal(`${star(x.status)} ${esc(x.title)}`,`<p>${esc(x.area)} · ${labels[x.status]}</p><p>${esc(x.description)}</p><button data-preview="${esc(x.id)}">查看详情</button>`);return}
 if(b.dataset.preview){selected=b.dataset.preview;$('#modal').close();go('detail');return}
 const a=b.dataset.action;if(a==='accounts'){modal('模拟登录 · 选择账号',`<p>三个账号共享物品信息，分别保存手机绑定、认证和个人星册。</p><div class="actions">${accountNames.map(name=>`<button data-account="${name}" class="${name===activeAccount?'primary':''}">${name}${name===activeAccount?' · 当前':''}</button>`).join('')}</div><p class="muted">本地演示，无需密码，不连接真实账号服务。</p>`);return}if(a==='filters')modal('筛选星点',`<form data-form="filter">${fields()}<button class="primary">应用筛选</button></form>`);
 if(a==='clear-filter'){filter={keyword:'',category:'',area:'',date:'',status:''};render()}
 if(a==='found-publish'){draft.type='found';go('publish')}
 if(a==='choose-place'){captureDraft();mapMode='select';go('map')}
 if(a==='manual'){mapMode='select';render()}
 if(a==='locate')modal('定位失败 · 星光仍可抵达','<p>当前为模拟地图，未请求真实定位。请手动在校园地图中选择位置。</p><button data-action="resume-map">手动选点</button>');
 if(a==='resume-map'){mapMode='select';$('#modal').close();render()}
});
document.addEventListener('click',e=>{const map=e.target.closest('#campus-map');if(!map||mapMode!=='select'||route!=='map'||e.target.closest('button'))return;const rect=map.getBoundingClientRect();draft.point=[+(100*(e.clientX-rect.left)/rect.width).toFixed(2),+(100*(e.clientY-rect.top)/rect.height).toFixed(2)];modal('选定一颗星的位置',`<form data-form="place"><p>已记录地图选点。请选择该位置所属区域：</p><select name="area">${options(areas,draft.area,'请选择区域')}</select><button class="primary">确认选址，返回发布</button></form>`)});
document.addEventListener('change',e=>{if(e.target.name==='photo'){const f=e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>2*1024*1024){e.target.value='';modal('图片不符合要求','<p>请选择不超过 2MB 的 PNG、JPG 或 WebP 图片。</p>');return}const uploadAccount=activeAccount;const reader=new FileReader();reader.onload=()=>{if(activeAccount===uploadAccount)draft.photo=reader.result};reader.readAsDataURL(f)}});
document.addEventListener('submit',e=>{const form=e.target,kind=form.dataset.form;if(!kind)return;e.preventDefault();const d=Object.fromEntries(new FormData(form));
 if(kind==='search'||kind==='filter'){filter={...filter,...d};$('#modal').close();go('search')}
 if(kind==='place'){if(!areas.includes(d.area))return;draft.area=d.area;mapMode='browse';$('#modal').close();go('publish')}
 if(kind==='publish'){captureDraft();const errors=[];if((d.title||'').trim().length<2)errors.push('物品名称至少填写两个字。');if(!categories.includes(d.category))errors.push('请选择物品类别。');if(!areas.includes(d.area))errors.push('请选择登记地点。');if(!d.date||d.date>today())errors.push('请选择今天或之前的日期。');if(!/^1\d{10}$/.test(d.contact))errors.push('请填写 11 位手机号码。');if(!(d.description||'').trim())errors.push('请填写物品特征描述。');if(errors.length){modal('表单需要补充',`<ul class="error">${errors.map(v=>`<li>${v}</li>`).join('')}</ul>`);return}const x={...draft,id:`star-${Date.now()}`,title:d.title.trim(),description:d.description.trim(),status:d.type==='lost'?'seeking':'claimed',owner:true,publisher:activeAccount,finder:d.type==='found'?activeAccount:'',icon:'✧'};items.unshift(x);if(!save()){items.shift();return}selected=x.id;draft={};go('detail')}
});
const navigationStars=[
 ['home','天枢','星图首页',86,25],['search','天璇','寻觅星点',78,66],
 ['detail','天玑','观星识物',57,61],['publish','天权','登记星启',53,20],
 ['profile','玉衡','我的星册',36,32],['return','开阳','星物归还',22,55],
 ['thanks','摇光','赠玫瑰致谢',8,43]
];
// 连线和按钮共用同一组坐标，星点的中心即连线顶点。
const navigationPath=[0,1,2,3,0,3,4,5,6].map((index,i)=>`${i?'L':'M'}${navigationStars[index][3]} ${navigationStars[index][4]}`).join(' ');
$('#page-links').innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${navigationPath}"/></svg>`+navigationStars.map(([page,name,label,left,top])=>`<button class="nav-star" data-go="${page}" style="left:${left}%;top:${top}%" aria-label="${name}·${label}"><span class="nav-star-icon" aria-hidden="true">✦</span><span class="nav-star-label">${name} · ${label}</span></button>`).join('');
window.addEventListener('hashchange',()=>go(location.hash.slice(1)));go(pages[location.hash.slice(1)]?location.hash.slice(1):'home');
