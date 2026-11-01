var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};
var S={n:0,user:null,sub:false,hist:[],marks:[]};
try{var raw=localStorage.getItem('ss');if(raw)S=Object.assign(S,JSON.parse(raw))}catch(e){}
function save(){try{localStorage.setItem('ss',JSON.stringify(S))}catch(e){}}
function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(function(){t.classList.remove('on')},2200)}
var OCC=['Student','Teacher','Lecturer','Developer','Nurse','Accountant','Other'],FIELD=['History','IT','Life Sciences','Commerce','Law','Mathematics'];
var PROT=['profile','student','teacher','rooms'];
function esc(s){return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}

/* routing */
function show(v){
  if(v==='dash')v=S.user&&S.user.role==='teacher'?'teacher':'student';
  if(PROT.indexOf(v)>-1&&!S.user){toast('Pop in your details first and then we can go there');v='signin'}
  $$('.view').forEach(function(e){e.classList.toggle('on',e.id===v)});
  $$('#nav button').forEach(function(b){b.setAttribute('aria-current',b.dataset.go===v)});
  window.scrollTo(0,0);try{history.replaceState(null,'','#'+v)}catch(e){}
  if(v==='guest')renderLeft();if(v==='profile')fillProfile();if(v==='student')renderStudent();if(v==='teacher')renderTeacher();if(v==='rooms')renderRooms();afterShow(v);
  $('#authBtn').textContent=S.user?'Profile':'Sign in';
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b)show(b.dataset.go)});
$('#authBtn').onclick=function(){show(S.user?'profile':'signin')};

/* static blocks */
var PL='<div class="card price"><h3>Guest</h3><div class="amt">Free</div><ul><li>5 summaries</li><li>No sign-up needed</li></ul><button class="btn ghost" data-go="guest">Try now</button></div><div class="card price pop"><span class="tag">Most popular</span><h3>Student</h3><div class="amt">R50<small style="font-size:15px;font-weight:500"> /month</small></div><ul><li>Unlimited summaries</li><li>Predicted questions</li><li>Saved history</li><li>Talk rooms</li></ul><button class="btn" data-sub="1">Subscribe</button></div><div class="card price"><h3>Teacher</h3><div class="amt">R50<small style="font-size:15px;font-weight:500"> /month</small></div><ul><li>Memo-based marking</li><li>Marking history</li><li>Talk rooms</li></ul><button class="btn" data-sub="1">Subscribe</button></div>';
$('#plans').innerHTML=PL;$('#plans2').innerHTML=PL;
document.addEventListener('click',function(e){if(e.target.closest('[data-sub]'))subscribe()});
function subscribe(){if(!S.user){toast('Sign in first, then subscribe');show('signin');return}S.sub=true;save();$('#pay').classList.remove('on');toast('Subscribed (demo). Unlimited access on.');show('profile')}

/* AI summariser (runs in your browser, demo) */
var STOP='the and that with this from have they were which their there about would could should into than then also been being what when where will your more some such only other these those because while through over each very just'.split(' ');
function analyse(text){
  var t=text.replace(/\s+/g,' ').trim();if(t.length<80)return null;
  var ss=(t.match(/[^.!?]+[.!?]*/g)||[t]).map(function(x){return x.trim()}).filter(function(x){return x.length>25});if(!ss.length)ss=[t];
  var f={};t.toLowerCase().replace(/[^a-z\s]/g,'').split(' ').forEach(function(w){if(w.length>3&&STOP.indexOf(w)<0)f[w]=(f[w]||0)+1});
  var sc=ss.map(function(s,i){var w=s.toLowerCase().replace(/[^a-z\s]/g,'').split(' '),v=0;w.forEach(function(x){v+=f[x]||0});return {i:i,s:s,v:v/Math.pow(w.length,.6)}});
  var k=Math.min(4,Math.max(1,Math.ceil(ss.length/3)));
  var top=sc.slice().sort(function(a,b){return b.v-a.v}).slice(0,k).sort(function(a,b){return a.i-b.i});
  var kw=Object.keys(f).sort(function(a,b){return f[b]-f[a]}).slice(0,5);
  var qs=kw.slice(0,3).map(function(w,i){return ['What is '+w+', and why does it matter in this topic?','Explain the role of '+w+' using an example.','Discuss '+w+' and how it links to the other key ideas.'][i]});
  return {pts:top.map(function(x){return x.s}),kw:kw,qs:qs};
}
function resHTML(r){return '<h4>Summary</h4><ul>'+r.pts.map(function(p){return '<li>'+esc(p)+'</li>'}).join('')+'</ul><h4>Key terms</h4><div class="chips">'+r.kw.map(function(k){return '<span>'+esc(k)+'</span>'}).join('')+'</div><h4>Predicted questions</h4><ul>'+r.qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ul>'}
function canUse(){if(S.sub)return true;if(S.n>=5){openPay();return false}return true}
function used(){if(!S.sub)S.n++;save();renderLeft()}
function renderLeft(){$('#left').textContent=S.sub?'Unlimited (subscribed)':Math.max(0,5-S.n)+' of 5 free summaries left'}
function openPay(){
  $('#pD').textContent=S.user?'Subscribe for R50 a month to keep going. Unlimited summaries, marking and talk rooms.':'Sign in and subscribe for R50 a month to keep going. Unlimited summaries, marking and talk rooms.';
  $('#pGo').textContent=S.user?'Subscribe for R50/month':'Sign in to subscribe';$('#pay').classList.add('on');$('#pGo').focus()}
$('#pGo').onclick=function(){$('#pay').classList.remove('on');if(S.user)subscribe();else{S.next='pay';show('signin')}};
$('#pX').onclick=function(){$('#pay').classList.remove('on')};

/* guest chat */
function addMsg(c,h){var d=document.createElement('div');d.className='m '+c;d.innerHTML=h;$('#msgs').appendChild(d);$('#msgs').scrollTop=1e9;return d}
addMsg('a','Hi there! Paste your notes or drop in a file (PDF, Word, PowerPoint, Excel, even a photo) and I&rsquo;ll turn it into the note type you pick above.');
function send(){
  var t=$('#inp').value.trim();if(!t)return;if(!canUse())return;
  addMsg('u',esc(t.length>400?t.slice(0,400)+'\u2026':t));$('#inp').value='';
  var th=addMsg('a',loadMsg());
  setTimeout(function(){API.summarise(t,S.mode).then(function(r){if(!r){th.innerHTML='That\u2019s a bit short. Paste a few more sentences (about 80 characters) and I\u2019ll take it from there.';return}th.innerHTML=resHTML(r)+actionsHTML();used()}).catch(function(){th.innerHTML='Hmm, something went wrong on our side. Please try again in a moment.'})},900);
}
$('#send').onclick=send;$('#inp').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
$('#attach').onclick=function(){$('#file').click()};
$('#file').onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){$('#inp').value=String(r.result).slice(0,6000);toast('File loaded')};r.readAsText(f)};

/* sign in */
var up=false;
function setMode(){$('#aT').textContent=up?'Create your account':'Sign in';$('#nameWrap').style.display=up?'block':'none';$('#swap').textContent=up?'I have an account':'Create an account'}
setMode();$('#swap').onclick=function(){up=!up;setMode()};
function login(name,email){S.user=S.user||{role:null,occ:'Student',field:'History',inst:''};S.user.name=name;S.user.email=email;save();$('#authBtn').textContent='Profile';
  if(!S.user.role)show('role');else if(!S.sub&&S.n>=5)show('pricing');else show('dash')}
$('#google').onclick=function(){login('Amava','amava@gmail.com')};
$('#go').onclick=function(){var e=$('#em').value.trim();if(!e){toast('Enter your email');return}login($('#nm').value.trim()||e.split('@')[0],e)};
$$('#role [data-r]').forEach(function(b){b.onclick=function(){S.user.role=b.dataset.r;S.user.occ=b.dataset.r==='teacher'?'Teacher':'Student';save();show('profile')}});

/* profile */
function opts(a,v){return a.map(function(x){return '<option'+(x===v?' selected':'')+'>'+x+'</option>'}).join('')}
function fillProfile(){var u=S.user;$('#pn').value=u.name||'';$('#pe').value=u.email||'';$('#pr').value=u.role||'student';$('#po').innerHTML=opts(OCC,u.occ);$('#pf').innerHTML=opts(FIELD,u.field);$('#pi').value=u.inst||'';
  $('#plan').textContent=S.sub?'Subscribed (R50/month)':'Free';$('#planNote').textContent=S.sub?'Unlimited access.':Math.max(0,5-S.n)+' free summaries left. Subscribe for unlimited access.'}
$('#saveP').onclick=function(){var u=S.user;u.name=$('#pn').value;u.role=$('#pr').value;u.occ=$('#po').value;u.field=$('#pf').value;u.inst=$('#pi').value;save();toast('Profile saved')};
$('#out').onclick=function(){S.user=null;save();$('#authBtn').textContent='Sign in';show('home')};

/* rooms */
var RM=[['Grade 12 History Study Group','Student','History',128],['Lecturers: History Teaching','Lecturer','History',41],['IT Students Hub','Student','IT',214],['Developers in Durban','Developer','IT',77],['Life Sciences Revision','Student','Life Sciences',96],['Teachers: Life Sciences','Teacher','Life Sciences',53],['Commerce and Accounting','Student','Commerce',88],['Accountants Network','Accountant','Commerce',35],['Nurses and Health Studies','Nurse','Life Sciences',29]];
var RC={},cur=null,fo='All',ff='All';
function chips(el,list,val,fn){$(el).innerHTML=['All'].concat(list).map(function(x){return '<button aria-pressed="'+(x===val)+'">'+x+'</button>'}).join('');$$(el+' button').forEach(function(b){b.onclick=function(){fn(b.textContent);renderRooms()}})}
function renderRooms(){
  chips('#f1',OCC.slice(0,6),fo,function(v){fo=v});chips('#f2',FIELD,ff,function(v){ff=v});
  var L=RM.filter(function(r){return (fo==='All'||r[1]===fo)&&(ff==='All'||r[2]===ff)});
  $('#rl').innerHTML=L.length?L.map(function(r){var i=RM.indexOf(r);return '<button data-i="'+i+'" aria-current="'+(cur===i)+'"><b>'+r[0]+'</b><small>'+r[1]+' \u00b7 '+r[2]+' \u00b7 '+r[3]+' members</small></button>'}).join(''):'<p class="note">No rooms match. Try another filter.</p>';
  $$('#rl button').forEach(function(b){b.onclick=function(){openRoom(+b.dataset.i)}})}
function openRoom(i){cur=i;var r=RM[i];if(!RC[i])RC[i]=[['Thandi','Anyone got notes for Monday\u2019s test?'],['Sipho','I\u2019ll share my summary in a bit.']];$('#rt').textContent=r[0];$('#rm').textContent=r[3]+' members';drawRoom();renderRooms()}
function drawRoom(){$('#rmsgs').innerHTML=RC[cur].map(function(m){var me=m[0]==='You';return '<div class="m '+(me?'u':'a')+'"><small class="note">'+esc(m[0])+'</small><br>'+esc(m[1])+'</div>'}).join('');$('#rmsgs').scrollTop=1e9}
function rsend(){var t=$('#rin').value.trim();if(!t)return;if(cur===null){toast('Pick a room first');return}RC[cur].push(['You',t]);$('#rin').value='';drawRoom()}


/* ===== note types ===== */
S.mode=S.mode||'simple';
var MODES=[['simple','Simple notes'],['slides','Slides'],['exam','Exam notes'],['test','Test notes'],['extended','Extended notes']];
function drawModes(){$$('.modebar').forEach(function(el){el.innerHTML='<span class="note" style="margin-right:6px">Note type:</span>'+MODES.map(function(m){return '<button aria-pressed="'+(S.mode===m[0])+'" data-m="'+m[0]+'">'+m[1]+'</button>'}).join('')})}
document.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(b){S.mode=b.dataset.m;save();drawModes()}});
drawModes();
function analyse(text){
 var mode=S.mode||'simple',t=text.replace(/\s+/g,' ').trim();if(t.length<80)return null;
 var ss=(t.match(/[^.!?]+[.!?]*/g)||[t]).map(function(x){return x.trim()}).filter(function(x){return x.length>25});if(!ss.length)ss=[t];
 var f={};t.toLowerCase().replace(/[^a-z\s]/g,'').split(' ').forEach(function(w){if(w.length>3&&STOP.indexOf(w)<0)f[w]=(f[w]||0)+1});
 var sc=ss.map(function(s,i){var w=s.toLowerCase().replace(/[^a-z\s]/g,'').split(' '),v=0;w.forEach(function(x){v+=f[x]||0});return {i:i,s:s,v:v/Math.pow(w.length,.6)}});
 var N={simple:4,slides:12,exam:6,test:5,extended:12,quiz:8,mock:8}[mode],k=Math.max(1,Math.min(N,Math.ceil(ss.length*.7)));
 var pts=sc.slice().sort(function(a,b){return b.v-a.v}).slice(0,k).sort(function(a,b){return a.i-b.i}).map(function(x){return x.s});
 var kw=Object.keys(f).sort(function(a,b){return f[b]-f[a]}).slice(0,8);
 var w=function(i){return kw[i%Math.max(kw.length,1)]||'this topic'};
 var T=['What is '+w(0)+', and why does it matter?','Explain the role of '+w(1)+' using an example.','Compare '+w(0)+' with '+w(2)+'.','Define '+w(3)+' in your own words.','Discuss how '+w(4)+' links to '+w(1)+'.','Why is '+w(2)+' important?'];
 var qn={simple:2,slides:0,exam:5,test:3,extended:3,quiz:0,mock:4}[mode];
 var grp=function(n){var g=[];for(var i=0;i<pts.length;i+=n){var c=pts.slice(i,i+n),ti=kw.filter(function(x){return c.join(' ').toLowerCase().indexOf(x)>-1})[0]||'Part '+(g.length+1);g.push({h:ti.charAt(0).toUpperCase()+ti.slice(1),c:c})}return g};
 var quiz=[];
 pts.forEach(function(s,ix){if(quiz.length>=5)return;var low=s.toLowerCase(),a=kw.filter(function(x){return new RegExp('\\b'+x+'\\b').test(low)})[0];if(!a)return;
  var o=[a].concat(kw.filter(function(x){return x!==a}).slice(0,3)).map(function(x,i){return {t:x,i:(i*5+a.length+ix)%7}}).sort(function(p,q){return p.i-q.i||p.t.localeCompare(q.t)}).map(function(x){return x.t});
  quiz.push({s:s.replace(new RegExp('\\b'+a+'\\b','i'),'_____'),a:a,o:o})});
 return {mode:mode,quiz:quiz,pts:pts,kw:kw,qs:T.slice(0,qn),groups:mode==='slides'?grp(3):mode==='extended'?grp(4):null};
}
function resHTML(r){
 var li=function(a){return '<ul>'+a.map(function(p){return '<li>'+esc(p)+'</li>'}).join('')+'</ul>'},
 ch=function(){return '<div class="chips">'+r.kw.map(function(k){return '<span>'+esc(k)+'</span>'}).join('')+'</div>'},
 q=function(h){return r.qs.length?'<h4>'+h+'</h4>'+li(r.qs):''},
 lab={simple:'Simple notes',slides:'Slides',exam:'Exam notes',test:'Test notes',extended:'Extended notes',quiz:'Quiz',mock:'Mock exam'}[r.mode||'simple'],o='<span class="tag">'+lab+'</span>';
 switch(r.mode){
  case 'slides':return o+r.groups.map(function(g,i){return '<div class="slide"><small class="note">Slide '+(i+1)+'</small><h4>'+esc(g.h)+'</h4>'+li(g.c)+'</div>'}).join('');
  case 'exam':return o+'<h4>Must-know points</h4>'+li(r.pts)+'<h4>Key terms</h4>'+ch()+q('Predicted exam questions')+'<p class="note">Exam tip: use the key terms in your answers and match the length to the marks.</p>';
  case 'test':return o+'<h4>Revision checklist</h4>'+li(r.pts.map(function(p){return '\u2610 '+p}))+q('Quick test');
  case 'extended':return o+r.groups.map(function(g){return '<h4>'+esc(g.h)+'</h4><p>'+esc(g.c.join(' '))+'</p>'}).join('')+'<h4>Key terms</h4>'+ch()+q('Think about it');
  case 'quiz':return o+(r.quiz&&r.quiz.length?'<div class="quizbox"><p class="note">Pick the missing word. Score: <b class="qsc">0</b>/'+r.quiz.length+'</p>'+r.quiz.map(function(x,i){return '<div class="qz"><b>'+(i+1)+'. '+esc(x.s)+'</b><div class="opts">'+x.o.map(function(t){return '<button class="opt" data-ok="'+(t===x.a?1:0)+'">'+esc(t)+'</button>'}).join('')+'</div></div>'}).join('')+'</div>':'<p>Add a longer text to build a quiz.</p>');
  case 'mock':{var A=r.quiz||[],tot=A.length+4*r.qs.length+10;return o+'<div class="slide"><h4>Mock exam</h4><p class="note">Total: '+tot+' marks. Suggested time: '+Math.max(30,tot*2)+' minutes.</p></div><h4>Section A: multiple choice ('+A.length+' marks)</h4>'+A.map(function(x,i){return '<p><b>'+(i+1)+'.</b> '+esc(x.s)+'<br>'+x.o.map(function(t,j){return 'ABCD'[j]+') '+esc(t)}).join(' &nbsp; ')+'</p>'}).join('')+'<h4>Section B: short questions (4 marks each)</h4>'+li(r.qs)+'<h4>Section C: essay (10 marks)</h4><p>Discuss '+esc(r.kw[0]||'the topic')+', '+esc(r.kw[1]||'its causes')+' and '+esc(r.kw[2]||'its effects')+', using examples from your notes.</p><details><summary>Memo</summary><p>Section A: '+A.map(function(x,i){return (i+1)+'='+'ABCD'[x.o.indexOf(x.a)]}).join(', ')+'</p><p>Marking guide:</p>'+li(r.pts)+'</details>'}
  default:return o+'<h4>Summary</h4>'+li(r.pts)+'<h4>Key terms</h4>'+ch()+q('Predicted questions');
 }}
/* ===== articles and comments ===== */
function ensureArts(i){S.arts=S.arts||{};if(!S.arts[i]){var r=RM[i];S.arts[i]=[{t:'How I revise '+r[2]+' in 20 minutes a day',a:'Thandi',d:'2 days ago',b:'I turn each chapter into five questions and answer them from memory. It is quicker than rereading and I remember more.',c:[{a:'Sipho',t:'Trying this tonight, thanks!'}]}]}}
function openRoom(i){cur=i;ensureArts(i);var r=RM[i];$('#rt').textContent=r[0];$('#rm').textContent=' \u00b7 '+r[3]+' members';$('#newArt').style.display='block';drawFeed();renderRooms()}
function drawFeed(){if(cur===null){$('#feed').innerHTML='<p class="note">Pick a room to read and post articles.</p>';return}ensureArts(cur);
 $('#feed').innerHTML=S.arts[cur].map(function(a,i){return '<div class="card art"><h3>'+esc(a.t)+'</h3><small class="note">by '+esc(a.a)+' \u00b7 '+esc(a.d)+'</small><p style="white-space:pre-wrap">'+esc(a.b)+'</p><b>'+a.c.length+' comment'+(a.c.length===1?'':'s')+'</b>'+a.c.map(function(c){return '<div class="cmt"><b>'+esc(c.a)+'</b> '+esc(c.t)+'</div>'}).join('')+'<div class="cm"><input aria-label="Comment" placeholder="Write a comment\u2026" id="ci'+i+'"><button class="btn sm" data-cb="'+i+'">Comment</button></div></div>'}).join('')}
var _rr=renderRooms;renderRooms=function(){_rr();drawFeed()};
document.addEventListener('click',function(e){var b=e.target.closest('[data-cb]');if(!b)return;var i=+b.dataset.cb,t=$('#ci'+i).value.trim();if(!t)return;S.arts[cur][i].c.push({a:S.user.name||'You',t:t});save();drawFeed()});
$('#apost').onclick=function(){var t=$('#at').value.trim(),b=$('#ab').value.trim();if(!t||b.length<20){toast('Add a title and at least 20 characters');return}ensureArts(cur);S.arts[cur].unshift({t:t,a:S.user.name||'You',d:'Just now',b:b,c:[]});save();$('#at').value='';$('#ab').value='';drawFeed();toast('Article posted')};
/* ===== quiz, mock exam, home ===== */
MODES=[['simple','Simple notes'],['slides','Slides'],['exam','Exam notes'],['test','Test notes'],['extended','Extended notes'],['quiz','Quiz'],['mock','Mock exam']];drawModes();
document.addEventListener('click',function(e){var b=e.target.closest('.opt');if(!b)return;var q=b.closest('.qz');if(q.dataset.done)return;q.dataset.done=1;var ok=b.dataset.ok==='1';b.classList.add(ok?'good':'bad');if(!ok){var c=q.querySelector('[data-ok="1"]');if(c)c.classList.add('good')}var bx=q.closest('.quizbox');if(ok)bx.dataset.s=(+bx.dataset.s||0)+1;bx.querySelector('.qsc').textContent=bx.dataset.s||0});
var SAM={'Arts & Humanities':'The Industrial Revolution began in Britain in the late eighteenth century. New machines, such as the spinning jenny and the steam engine, transformed how goods were produced. Factories replaced cottage industries, and people moved from villages into rapidly growing cities. Working conditions were often dangerous, which led to reforms and the rise of trade unions. The revolution later spread to Europe and North America, changing economies and societies.',
'Business':'Supply and demand explains how prices are set in a market. Demand is the quantity of a product that consumers are willing to buy at a given price, and it usually falls as the price rises. Supply is the quantity producers are willing to sell, and it usually rises as the price rises. The equilibrium price is where supply equals demand, and the market clears. A shortage pushes the price up, while a surplus pushes the price down.',
'Health Sciences':'The heart pumps blood through two circuits. In the pulmonary circuit, the right ventricle sends deoxygenated blood to the lungs, where it picks up oxygen. In the systemic circuit, the left ventricle pumps oxygenated blood through the aorta to the rest of the body. Valves between the chambers prevent blood from flowing backwards. Blood pressure is highest in the arteries and lowest in the veins.',
'Law':'A valid contract in South African law requires consensus between the parties. The parties must have contractual capacity, which means they are legally able to enter an agreement. The performance promised must be lawful, possible and determinable. Some contracts must also comply with formalities, such as being in writing. If one of these requirements is missing, the contract may be void or voidable.',
'Social Sciences':'Socialisation is the process through which people learn the norms and values of their society. Primary socialisation takes place in the family during early childhood. Secondary socialisation happens through schools, peer groups, religion and the media. Sociologists argue that socialisation shapes identity, behaviour and beliefs. Agents of socialisation can reinforce or challenge one another.',
'STEM':'Photosynthesis is the process plants use to turn light energy into chemical energy. It takes place in the chloroplasts, where chlorophyll absorbs sunlight. In the light-dependent stage, water is split and oxygen is released, producing ATP and NADPH in the thylakoid membranes. In the Calvin cycle, which happens in the stroma, the enzyme RuBisCO fixes carbon dioxide into glucose. Light intensity, temperature and carbon dioxide concentration all limit the rate of photosynthesis.'};
var selA='STEM';
function drawAreas(){$('#areas').innerHTML=Object.keys(SAM).map(function(k){return '<button aria-pressed="'+(k===selA)+'" data-a="'+esc(k)+'">'+esc(k)+'</button>'}).join('');$('#sampleTxt').textContent=SAM[selA]}
drawAreas();
document.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(b){selA=b.dataset.a;drawAreas()}});
$('#useSample').onclick=function(){show('guest');$('#inp').value=SAM[selA];toast('Sample loaded. Press Summarise.')};
var dz=$('#dz');
function goFiles(fl){if(!fl.length)return;show('guest');handleFiles(fl,$('#inp'),$('#gFiles'))}
dz.onclick=function(){$('#hFile').click()};
dz.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#hFile').click()}};
['dragenter','dragover'].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.add('over')})});
['dragleave','drop'].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.remove('over')})});
dz.addEventListener('drop',function(e){goFiles(e.dataTransfer.files)});
$('#hFile').onchange=function(e){goFiles(e.target.files);e.target.value=''};
var FQ=[['What is StudySense?','A study assistant that turns your notes into summaries, slides, quizzes and mock exams. Teachers can also mark papers against a memo.'],['How do the free attempts work?','Guests get 5 free summaries. On the 6th attempt you sign in and subscribe for R50 a month to keep going.'],['Which files can I upload?','PDF, Word, PowerPoint, Excel, CSV and text files, plus photos or scans of paper. We read photos with OCR, and printed text works best.'],['What note types are there?','Simple notes, slides, exam notes, test notes, extended notes, a quiz and a mock exam with a memo.'],['Is this cheating?','No. StudySense is for studying. Use your own notes, follow your institution\u2019s rules and do not upload material you have no right to share.'],['How does marking work?','Teachers paste a memo and the student\u2019s answers. Each answer is checked against the memo and the teacher can override any mark.'],['Is my data safe?','This demo keeps data in your own browser. The full version will include a privacy policy, consent on sign-up and a way to delete your data, in line with POPIA.']];
$('#faq').innerHTML=FQ.map(function(f){return '<details class="faq"><summary>'+esc(f[0])+'</summary><p>'+esc(f[1])+'</p></details>'}).join('');
