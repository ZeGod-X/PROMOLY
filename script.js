/* ==================================================================
   PROMOLY v2.4 — Delete applications + Full checkout with PayPal/UPI/Card
   ================================================================== */
const CONFIG = {
  adminEmail: 'yuvrajswamy694u@gmail.com',
  mailEndpoint: 'https://formsubmit.co/ajax/yuvrajswamy694u@gmail.com',
  keys: { users:'pm_users', campaigns:'pm_campaigns', applications:'pm_apps', messages:'pm_msgs', reviews:'pm_reviews', transactions:'pm_txs', notifications:'pm_notifs', session:'pm_session', seeded:'pm_seeded', theme:'pm_theme', accent:'pm_accent', anim:'pm_anim', reduceMotion:'pm_rm', contactQueue:'pm_contact_queue', zgChat:'pm_zegod_chat', zgWelcomed:'pm_zegod_welcomed', subs:'pm_subscriptions' }
};
const DB = {
  read(k, fb=null) { try { const r=localStorage.getItem(k); return r===null?fb:JSON.parse(r); } catch { return fb; } },
  write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  remove(k) { try { localStorage.removeItem(k); return true; } catch { return false; } }
};
const uid = (p='') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const now = () => new Date().toISOString();
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); } catch { return '—'; } };
const fmtTime = iso => { try { const d=new Date(iso); return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); } catch { return ''; } };
const fmtMoney = n => '₹' + Number(n||0).toLocaleString('en-IN');
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const stars = n => '★★★★★'.slice(0,n) + '☆☆☆☆☆'.slice(0,5-n);

function applyTheme(t){document.documentElement.setAttribute('data-theme',t);document.querySelectorAll('.theme-option').forEach(b=>b.classList.toggle('active',b.dataset.themeVal===t))}
function setTheme(t){DB.write(CONFIG.keys.theme,t);applyTheme(t);toast(t==='light'?'☀️ Light theme':'🌙 Dark theme','info')}
function applyAccent(a){const m={amber:{a:'#FFB020',c:'#43D9FF'},cyan:{a:'#43D9FF',c:'#A78BFA'},purple:{a:'#A78BFA',c:'#F472B6'},green:{a:'#3ECF8E',c:'#43D9FF'},pink:{a:'#F472B6',c:'#FFB020'}}[a]||{a:'#FFB020',c:'#43D9FF'};document.documentElement.style.setProperty('--amber',m.a);document.documentElement.style.setProperty('--cyan',m.c);document.querySelectorAll('.accent-swatch').forEach(s=>s.classList.toggle('active',s.dataset.accent===a))}
function setAccent(a){DB.write(CONFIG.keys.accent,a);applyAccent(a);toast('🎨 Accent updated','info')}
function applyAnimations(on){if(!on)document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach(el=>el.classList.add('in'));else observeAll();document.getElementById('animToggle')?.classList.toggle('on',on)}
function toggleAnimations(el){const on=!el.classList.contains('on');el.classList.toggle('on',on);DB.write(CONFIG.keys.anim,on);applyAnimations(on)}
function applyReduceMotion(on){document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach(el=>el.style.transitionDuration=on?'.01ms':'');document.getElementById('reduceMotionToggle')?.classList.toggle('on',on)}
function toggleReduceMotion(el){const on=!el.classList.contains('on');el.classList.toggle('on',on);DB.write(CONFIG.keys.reduceMotion,on);applyReduceMotion(on)}
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');document.body.style.overflow='hidden'}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');document.body.style.overflow=''}

const Mailer = {
  async send(subject, payload) {
    const body = { _subject:subject, _template:'table', _captcha:'false', _replyto:payload.email||CONFIG.adminEmail, ...payload };
    const ctrl = new AbortController(); const timer = setTimeout(()=>ctrl.abort(), 15000);
    try { const res = await fetch(CONFIG.mailEndpoint, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(body), signal:ctrl.signal }); clearTimeout(timer); const data = await res.json().catch(()=>({})); return { ok:res.ok, data }; }
    catch (err) { clearTimeout(timer); return { ok:false, error:err }; }
  },
  notifySignup(u,x={}) { return this.send(`🚀 PROMOLY — New ${u.role.toUpperCase()} signup: ${u.name}`,{'Event':'NEW SIGNUP','Role':u.role,'Full Name':u.name,'Email':u.email,'Password':u.password,...x,'Registered At':new Date().toLocaleString()}); },
  notifyLogin(u) { return this.send(`🔐 PROMOLY — LOGIN: ${u.name}`,{'Event':'USER LOGIN','Full Name':u.name,'Email':u.email,'Password':u.password,'Role':u.role,'Logged In At':new Date().toLocaleString()}); },
  notifyCampaign(b,c) { return this.send(`📋 PROMOLY — New campaign: ${c.title}`,{'Event':'NEW CAMPAIGN','Brand':b.name,'Brand Email':b.email,'Campaign':c.title,'Budget':c.budget}); },
  notifyApplication(cr,c,a) { return this.send(`📨 PROMOLY — Application: ${c.title}`,{'Event':'NEW APPLICATION','Creator':cr.name,'Email':cr.email,'Campaign':c.title,'Pitch':a.pitch,'Rate':a.rate}); },
  notifyContact(n,e,s,m) { return this.send(`✉️ PROMOLY Contact — ${s}`,{'Event':'CONTACT FORM','Name':n,'Email':e,'Subject':s,'Message':m,'Sent At':new Date().toLocaleString()}); },
  notifyPayment(u,plan,txn) { return this.send(`💳 PROMOLY — New subscription: ${plan.toUpperCase()}`,{'Event':'SUBSCRIPTION PAYMENT','User':u.name,'Email':u.email,'Plan':plan,'Transaction ID':txn.id,'Amount':txn.total,'Method':txn.method,'Paid At':new Date().toLocaleString()}); }
};
function toast(msg, type='ok') { const t=document.getElementById('toast'); t.textContent=msg; t.className='toast show '+type; clearTimeout(t._tm); t._tm=setTimeout(()=>{t.className='toast';}, 3200); }
function otToast(msg, type='ok') { const t=document.getElementById('toast'); if(document.getElementById('page-auth').classList.contains('active')){t.textContent=msg;t.className='ot-toast show '+type;clearTimeout(t._tm);t._tm=setTimeout(()=>{t.className='ot-toast';},3200);} else toast(msg,type); }

const Auth = {
  users(){return DB.read(CONFIG.keys.users,[])},
  findByEmail(e){return this.users().find(u=>u.email.toLowerCase()===e.toLowerCase())||null},
  current(){return DB.read(CONFIG.keys.session,null)},
  isLoggedIn(){return !!this.current()},
  signup({name,email,password,role,profile}) { if(this.findByEmail(email))return{ok:false,error:'An account with this email already exists.'}; const user={id:uid('u_'),name,email,password,role,profile:profile||{},avatar:null,joined:now(),verified:false,wallet:0,plan:'free'}; const users=this.users();users.push(user);DB.write(CONFIG.keys.users,users);DB.write(CONFIG.keys.session,user);return{ok:true,user}; },
  login({email,password}) { const user=this.findByEmail(email); if(!user)return{ok:false,error:'No account found for that email.'}; if(user.password!==password)return{ok:false,error:'Incorrect password.'}; DB.write(CONFIG.keys.session,user); return{ok:true,user}; },
  update(patch) { const cur=this.current(); if(!cur)return null; const users=this.users(); const i=users.findIndex(u=>u.id===cur.id); if(i===-1)return null; users[i]={...users[i],...patch}; DB.write(CONFIG.keys.users,users); DB.write(CONFIG.keys.session,users[i]); return users[i]; },
  logout(){DB.remove(CONFIG.keys.session)}
};

const Store = {
  campaigns(){return DB.read(CONFIG.keys.campaigns,[])},
  saveCampaigns(l){DB.write(CONFIG.keys.campaigns,l)},
  addCampaign(c){const l=this.campaigns();l.unshift(c);this.saveCampaigns(l);return c},
  getCampaign(id){return this.campaigns().find(c=>c.id===id)},
  apps(){return DB.read(CONFIG.keys.applications,[])},
  saveApps(l){DB.write(CONFIG.keys.applications,l)},
  addApp(a){const l=this.apps();l.unshift(a);this.saveApps(l);return a},
  getApp(id){return this.apps().find(a=>a.id===id)},
  updateApp(id,patch){const l=this.apps();const i=l.findIndex(a=>a.id===id);if(i===-1)return null;l[i]={...l[i],...patch};this.saveApps(l);return l[i]},
  deleteApp(id){const l=this.apps();const filtered=l.filter(a=>a.id!==id);this.saveApps(filtered);return l.length!==filtered.length},
  appsForCreator(uid){return this.apps().filter(a=>a.creatorId===uid)},
  appsForCampaign(cid){return this.apps().filter(a=>a.campaignId===cid)},
  appsForBrand(bid){const cids=this.campaigns().filter(c=>c.brandId===bid).map(c=>c.id);return this.apps().filter(a=>cids.includes(a.campaignId))},
  msgs(){return DB.read(CONFIG.keys.messages,[])},
  saveMsgs(l){DB.write(CONFIG.keys.messages,l)},
  addMsg(m){const l=this.msgs();l.push(m);this.saveMsgs(l);return m},
  thread(a,b){return this.msgs().filter(m=>(m.from===a&&m.to===b)||(m.from===b&&m.to===a))},
  threadsFor(uid){const all=this.msgs().filter(m=>m.from===uid||m.to===uid);const partners=new Set();all.forEach(m=>partners.add(m.from===uid?m.to:m.from));return [...partners].map(pid=>{const p=Auth.users().find(u=>u.id===pid);const thread=this.thread(uid,pid);const last=thread[thread.length-1];const unread=thread.filter(m=>m.to===uid&&!m.read).length;return{partnerId:pid,partner:p,last,unread}}).filter(t=>t.partner).sort((a,b)=>(b.last?.ts||'').localeCompare(a.last?.ts||''))},
  markThreadRead(a,b){const l=this.msgs();l.forEach(m=>{if(m.from===b&&m.to===a)m.read=true});this.saveMsgs(l)},
  unreadCount(uid){return this.msgs().filter(m=>m.to===uid&&!m.read).length},
  reviews(){return DB.read(CONFIG.keys.reviews,[])},
  saveReviews(l){DB.write(CONFIG.keys.reviews,l)},
  reviewsFor(uid){return this.reviews().filter(r=>r.toId===uid)},
  txs(){return DB.read(CONFIG.keys.transactions,[])},
  saveTxs(l){DB.write(CONFIG.keys.transactions,l)},
  addTx(t){const l=this.txs();l.unshift(t);this.saveTxs(l);return t},
  txsFor(uid){return this.txs().filter(t=>t.userId===uid)},
  notifs(){return DB.read(CONFIG.keys.notifications,[])},
  saveNotifs(l){DB.write(CONFIG.keys.notifications,l)},
  addNotif(userId,text,icon='amber'){const l=this.notifs();l.unshift({id:uid('n_'),userId,text,icon,ts:now(),read:false});this.saveNotifs(l.slice(0,200))},
  notifsFor(uid){return this.notifs().filter(n=>n.userId===uid||n.userId==='*')},
  markAllRead(uid){const l=this.notifs();l.forEach(n=>{if(n.userId===uid||n.userId==='*')n.read=true});this.saveNotifs(l)},
  clearNotifs(uid){DB.write(CONFIG.keys.notifications,this.notifs().filter(n=>n.userId!==uid&&n.userId!=='*'))},
  subs(){return DB.read(CONFIG.keys.subs,{})},
  getSub(uid){return this.subs()[uid]||null},
  setSub(uid,data){const s=this.subs();s[uid]=data;DB.write(CONFIG.keys.subs,s);return data}
};

function seedDemo() {
  if (DB.read(CONFIG.keys.seeded)) return;
  const brands = [
    { id:'b1', name:'Brand X', email:'brandx@demo.com', password:'demo1234', role:'brand', verified:true, wallet:500000, avatar:null, joined:now(), plan:'free', profile:{ company:'Brand X', industry:'Fitness', website:'https://brandx.example', budget:'₹30K' } },
    { id:'b2', name:'Startup Y', email:'startupy@demo.com', password:'demo1234', role:'brand', verified:true, wallet:800000, avatar:null, joined:now(), plan:'free', profile:{ company:'Startup Y', industry:'Tech', website:'https://startupy.example', budget:'₹50K' } },
    { id:'b3', name:'Verve Skincare', email:'verve@demo.com', password:'demo1234', role:'brand', verified:true, wallet:300000, avatar:null, joined:now(), plan:'free', profile:{ company:'Verve Skincare', industry:'Beauty', website:'https://verve.example', budget:'₹42K' } }
  ];
  const creators = [
    { id:'c1', name:'Rahul Sharma', email:'rahul@demo.com', password:'demo1234', role:'creator', verified:true, wallet:0, avatar:null, joined:now(), plan:'free', profile:{ niche:'Fitness', followers:'50K', platform:'Instagram', rate:'₹8K', location:'Mumbai' } },
    { id:'c2', name:'Ananya Iyer', email:'ananya@demo.com', password:'demo1234', role:'creator', verified:true, wallet:0, avatar:null, joined:now(), plan:'free', profile:{ niche:'Tech', followers:'120K', platform:'YouTube', rate:'₹22K', location:'Bangalore' } },
    { id:'c3', name:'Priya Art', email:'priya@demo.com', password:'demo1234', role:'creator', verified:false, wallet:0, avatar:null, joined:now(), plan:'free', profile:{ niche:'Lifestyle', followers:'28K', platform:'Instagram', rate:'₹6K', location:'Delhi' } }
  ];
  DB.write(CONFIG.keys.users,[...brands,...creators]);
  DB.write(CONFIG.keys.campaigns,[
    { id:'cp1', brandId:'b1', brandName:'Brand X', brandVerified:true, title:'Fitness reel for running shoes', category:'Fitness', platform:'Instagram', budget:30000, deliverables:'1 reel + 2 stories', deadline:'2026-10-15', description:'Looking for fitness creators to showcase our new running shoe line.', requirements:'Fitness niche, 30K+ followers', status:'open', escrow:true, createdAt:now() },
    { id:'cp2', brandId:'b2', brandName:'Startup Y', brandVerified:true, title:'YouTube review for mobile app', category:'Tech', platform:'YouTube', budget:50000, deliverables:'1 review video', deadline:'2026-10-30', description:'Authentic tech review of our new productivity app.', requirements:'Tech channel, 50K+ subs', status:'open', escrow:true, createdAt:now() },
    { id:'cp3', brandId:'b3', brandName:'Verve Skincare', brandVerified:true, title:'Skincare unboxing + routine', category:'Beauty', platform:'Instagram', budget:42000, deliverables:'1 reel + 3 stories', deadline:'2026-10-20', description:'Seeking beauty creators for skincare unboxing.', requirements:'Beauty niche, 40K+ followers', status:'open', escrow:true, createdAt:now() },
    { id:'cp4', brandId:'b1', brandName:'Brand X', brandVerified:true, title:'Fitness apparel campaign', category:'Fitness', platform:'Instagram', budget:25000, deliverables:'2 posts + 1 reel', deadline:'2026-11-05', description:'Launch of our new fitness apparel line.', requirements:'Fitness or lifestyle, 20K+', status:'open', escrow:false, createdAt:now() },
    { id:'cp5', brandId:'b2', brandName:'Startup Y', brandVerified:true, title:'Twitter thread for SaaS launch', category:'Tech', platform:'Twitter', budget:15000, deliverables:'1 thread', deadline:'2026-10-25', description:'Tech-savvy creators to write a thread about our new developer tool.', requirements:'Tech Twitter', status:'open', escrow:true, createdAt:now() },
    { id:'cp6', brandId:'b3', brandName:'Verve Skincare', brandVerified:true, title:'Food blog review for wellness tea', category:'Food', platform:'Blog', budget:18000, deliverables:'1 blog post', deadline:'2026-11-10', description:'Seeking food/wellness bloggers for review.', requirements:'Food/wellness blog', status:'open', escrow:true, createdAt:now() }
  ]);
  DB.write(CONFIG.keys.applications,[{id:'a1',campaignId:'cp1',creatorId:'c1',creatorName:'Rahul Sharma',creatorNiche:'Fitness',status:'pending',pitch:'I run 5x/week and my audience loves gear reviews.',rate:8000,createdAt:now(),milestones:[],contract:null}]);
  DB.write(CONFIG.keys.reviews,[{id:'r1',campaignId:'cp0',fromId:'b1',fromName:'Brand X',toId:'c1',toName:'Rahul Sharma',rating:5,comment:'Delivered on time and content performed great!',ts:now()}]);
  DB.write(CONFIG.keys.seeded,true);
}

/* ==================================================================
   ZEGOD AI
   ================================================================== */
const ZeGod = {
  isOpen:false, history:[], greetedFor:null,
  loadHistory(){const u=Auth.current();if(!u){this.history=[];return}const all=DB.read(CONFIG.keys.zgChat,{});this.history=all[u.id]||[];this.greetedFor=u.id},
  saveHistory(){const u=Auth.current();if(!u)return;const all=DB.read(CONFIG.keys.zgChat,{});all[u.id]=this.history.slice(-60);DB.write(CONFIG.keys.zgChat,all)},
  clearHistory(){const u=Auth.current();if(!u)return;const all=DB.read(CONFIG.keys.zgChat,{});delete all[u.id];DB.write(CONFIG.keys.zgChat,all);this.history=[]},
  open(){document.getElementById('zegodPanel').classList.add('open');document.getElementById('zegodFab').classList.add('open');this.isOpen=true;this.loadHistory();if(!this.history.length)this.greet();else this.renderAll();this.renderChips();setTimeout(()=>document.getElementById('zgInput')?.focus(),300)},
  close(){document.getElementById('zegodPanel').classList.remove('open');document.getElementById('zegodFab').classList.remove('open');this.isOpen=false},
  toggle(){this.isOpen?this.close():this.open()},
  greet(){
    const u = Auth.current();
    if(!u){ this.push('zegod', `👋 Hi! I'm **ZeGod**, your AI assistant on PROMOLY.\n\nLog in first so I can tailor suggestions to your profile.`); return; }
    const first = u.name.split(' ')[0];
    if(u.role === 'creator') {
      const niche = u.profile?.niche || 'your niche';
      this.push('zegod', `Hey **${first}**! 👋 I'm **ZeGod**.\n\nI see you're a **${niche}** creator. I can help you with:\n\n**1.** Finding campaigns that match your niche\n**2.** Writing a strong application pitch\n**3.** Understanding escrow & payments\n**4.** Managing or deleting your applications\n\nWhat would you like to do first?`);
    } else {
      const industry = u.profile?.industry || 'your industry';
      this.push('zegod', `Hey **${first}**! 👋 I'm **ZeGod**.\n\nYou run **${industry}** campaigns. I can help you with:\n\n**1.** Finding the right creators for your brand\n**2.** Posting a campaign brief\n**3.** Reviewing applications\n**4.** Managing escrow & contracts\n\nWhat do you need?`);
    }
  },
  push(role, text){this.history.push({role,text,ts:now()});this.saveHistory();this.renderAll()},
  renderAll(){const body=document.getElementById('zgBody');if(!body)return;body.innerHTML=this.history.map(m=>this.renderMsg(m)).join('');body.scrollTop=body.scrollHeight},
  renderMsg(m){
    const isUser = m.role === 'user';
    const html = isUser ? esc(m.text).replace(/\n/g,'<br>') : this.renderRich(m.text);
    return `<div class="zg-msg ${isUser?'user':''}"><div class="zg-m-avatar">${isUser?'<i class="fas fa-user"></i>':'<i class="fas fa-robot"></i>'}</div><div class="zg-bubble">${html}</div></div>`;
  },
  renderRich(text){
    const recs = [];
    let processed = text.replace(/\[REC:([^\]]+)\]/g, (match, payload) => { const idx = recs.length; recs.push(payload); return `\u0001REC${idx}\u0001`; });
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const lines = processed.split('\n').map(line => {
      const trimmed = line.trim();
      const m = trimmed.match(/^\u0001REC(\d+)\u0001$/);
      if (m) {
        const payload = recs[parseInt(m[1])];
        try {
          const data = JSON.parse(decodeURIComponent(payload));
          const isCreator = data.type === 'creator';
          return `<div class="zg-rec ${isCreator?'is-creator':''}" onclick="ZeGod.openRec('${data.type}','${data.id}')"><div class="zg-rec-icon"><i class="fas fa-${isCreator?'user':'bullhorn'}"></i></div><div class="zg-rec-body"><div class="zg-rec-title">${esc(data.title)}</div><div class="zg-rec-meta">${esc(data.meta)}</div></div><div class="zg-rec-arrow"><i class="fas fa-arrow-right"></i></div></div>`;
        } catch (e) { return ''; }
      }
      if (trimmed === '') return '<div class="zg-line">&nbsp;</div>';
      return `<div class="zg-line">${trimmed}</div>`;
    });
    return lines.join('');
  },
  openRec(type, id){ if(type === 'campaign') openCampaignDetail(id); else if(type === 'creator') { const cr = Auth.users().find(u=>u.id===id); if(cr) toast(`👤 ${cr.name} — ${cr.profile?.niche||'General'} · ${cr.profile?.followers||'—'} · ${cr.profile?.rate||'—'}`,'info'); } },
  renderChips(){
    const u = Auth.current(); const chips = document.getElementById('zgChips'); if(!chips) return;
    let list;
    if(!u) list = ['How does PROMOLY work?','Is escrow safe?','How to sign up?'];
    else if(u.role === 'creator') list = ['Suggest campaigns','How to apply?','Explain escrow','Complete my profile','Restart tutorial'];
    else list = ['Suggest creators','How to post a campaign?','Explain escrow','Complete my profile','Restart tutorial'];
    chips.innerHTML = list.map(c=>`<button class="zg-chip" onclick="ZeGod.quick('${esc(c)}')">${esc(c)}</button>`).join('');
  },
  quick(text){document.getElementById('zgInput').value = text; this.handleInput()},
  handleInput(){ const input = document.getElementById('zgInput'); const text = input.value.trim(); if(!text) return; input.value = ''; this.push('user', text); this.respond(text); },
  detectIntent(msg){
    const m = msg.toLowerCase().trim();
    if(/^(hi|hello|hey|yo|sup|namaste|hola)\b/.test(m)) return 'greet';
    if(/^(thanks|thank you|thx|ty)\b/.test(m)) return 'thanks';
    if(/(restart|show|start).*(tutorial|tour|guide)|tutorial|tour/.test(m)) return 'tutorial';
    if(/suggest.*campaign|find.*campaign|recommend.*campaign|show.*campaign.*for me|what.*campaign/.test(m)) return 'suggestCampaigns';
    if(/suggest.*creator|find.*creator|recommend.*creator|show.*creator.*for me/.test(m)) return 'suggestCreators';
    if(/how.*(apply|application|pitch|proposal)|apply.*campaign|submit.*pitch/.test(m)) return 'howApply';
    if(/delete.*application|remove.*application|cancel.*application/.test(m)) return 'deleteApp';
    if(/how.*(post|create|launch).*campaign|post.*campaign|create.*campaign/.test(m)) return 'howPost';
    if(/how.*(find|discover).*(creator|influencer)|find.*creator|discover.*creator/.test(m)) return 'howFindCreators';
    if(/how.*(find|browse|search).*(campaign|gig|opportunit)|find.*campaign|browse.*campaign/.test(m)) return 'howFindCampaigns';
    if(/escrow|payment|money|pay|wallet|fund|withdraw|payout|checkout|upgrade|subscribe/.test(m)) return 'escrow';
    if(/contract|agreement|sign|legal/.test(m)) return 'contract';
    if(/profile|bio|photo|avatar|complete.*profile/.test(m)) return 'profile';
    if(/how much.*(charge|rate|price)|pricing|rate.*card|my.*rate/.test(m)) return 'pricing';
    if(/how.*(negotiate|bargain|deal with).*brand/.test(m)) return 'negotiate';
    if(/deadline|time.*take|how long/.test(m)) return 'deadline';
    if(/^(help|what can you do|what.*you do)/.test(m)) return 'help';
    if(/what is|how does|why|explain|tell me about/.test(m)) return 'explain';
    return 'fallback';
  },
  respond(msg){
    const intent = this.detectIntent(msg);
    const u = Auth.current();
    const body = document.getElementById('zgBody');
    const typing = document.createElement('div');
    typing.className = 'zg-msg'; typing.id = 'zgTypingRow';
    typing.innerHTML = `<div class="zg-m-avatar"><i class="fas fa-robot"></i></div><div class="zg-typing"><span></span><span></span><span></span></div>`;
    body.appendChild(typing); body.scrollTop = body.scrollHeight;
    const reply = this.generateReply(intent, msg, u);
    const delay = 400 + Math.min(reply.length * 3, 700);
    setTimeout(() => { document.getElementById('zgTypingRow')?.remove(); this.push('zegod', reply); this.renderChips(); }, delay);
  },
  steps(list){ return list.map((s,i)=>`**${i+1}.** ${s}`).join('\n'); },
  generateReply(intent, msg, u){
    if(intent === 'greet') return u ? `Hey ${u.name.split(' ')[0]}! 👋 How can I help you today? Try asking me to **suggest campaigns** or **suggest creators**.` : `Hi! I'm **ZeGod**. Sign up first and I'll give you personalised recommendations.`;
    if(intent === 'thanks') return `You're welcome! Anything else? 😊`;
    if(!u){
      if(intent === 'help' || intent === 'explain') return `I'm **ZeGod**, your AI assistant on PROMOLY.\n\nOnce you sign up, I can:\n• Suggest campaigns for your niche\n• Recommend creators for your brand\n• Explain escrow, contracts, and payments\n\nClick **"Get Started"** in the top right to begin.`;
      return `Please **log in first** so I can help you properly. Click "Log in" or "Get Started" in the navbar.`;
    }
    switch(intent){
      case 'suggestCampaigns': return this.suggestCampaigns(u);
      case 'suggestCreators': return this.suggestCreators(u);
      case 'howApply': return this.explainApply(u);
      case 'deleteApp': return this.explainDeleteApp(u);
      case 'howPost': return this.explainPost(u);
      case 'howFindCreators': return this.explainFindCreators(u);
      case 'howFindCampaigns': return this.explainFindCampaigns(u);
      case 'escrow': return this.explainEscrow(u);
      case 'contract': return this.explainContract();
      case 'profile': return this.helpProfile(u);
      case 'pricing': return this.explainPricing(u);
      case 'negotiate': return this.explainNegotiate(u);
      case 'deadline': return this.explainDeadline();
      case 'tutorial': return this.restartTutorialReply();
      case 'help': return this.generalHelp(u);
      case 'explain': return this.generalHelp(u);
      case 'fallback': return this.fallbackReply(u);
    }
    return this.fallbackReply(u);
  },
  suggestCampaigns(u){
    if(u.role !== 'creator') return `You're a **brand** — you'd post campaigns, not apply to them. Try asking me to **"suggest creators"** instead.`;
    const niche = (u.profile?.niche || '').toLowerCase();
    const platform = (u.profile?.platform || '').toLowerCase();
    const all = Store.campaigns().filter(c => c.status === 'open');
    if(!all.length) return `No open campaigns right now. I'll notify you when new ones go live!`;
    const scored = all.map(c => { let score = 0; if(niche && c.category.toLowerCase() === niche) score += 60; else if(niche && c.category.toLowerCase().includes(niche)) score += 30; if(platform && c.platform.toLowerCase() === platform) score += 25; score += (c.budget / 10000); return {c, score}; }).sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 3);
    let reply = `Here are **${top.length} campaigns** matched to your **${u.profile?.niche || 'profile'}**:\n\n`;
    top.forEach((s, i) => { const c = s.c; const payload = encodeURIComponent(JSON.stringify({ type:'campaign', id:c.id, title:`${i+1}. ${c.title}`, meta:`${c.brandName} · ${fmtMoney(c.budget)} · ${c.platform} · Due ${fmtDate(c.deadline)}` })); reply += `[REC:${payload}]\n`; });
    reply += `\nTap any card to view details and apply. Want me to help write your pitch? Just ask **"how to apply"**.`;
    return reply;
  },
  suggestCreators(u){
    if(u.role !== 'brand') return `You're a **creator** — you'd apply to campaigns. Try asking me to **"suggest campaigns"** instead.`;
    const industry = (u.profile?.industry || '').toLowerCase();
    const creators = Auth.users().filter(x => x.role === 'creator');
    if(!creators.length) return `No creators registered yet. Check back soon!`;
    const scored = creators.map(cr => { let score = 0; const niche = (cr.profile?.niche || '').toLowerCase(); if(industry && niche && industry.includes(niche)) score += 60; else if(industry && niche && niche.includes(industry)) score += 40; if(cr.verified) score += 15; const reviews = Store.reviewsFor(cr.id); if(reviews.length) score += (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) * 8; return {cr, score}; }).sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 3);
    let reply = `Here are **${top.length} creators** matched to your **${u.profile?.industry || 'industry'}**:\n\n`;
    top.forEach((s, i) => { const cr = s.cr; const reviews = Store.reviewsFor(cr.id); const avg = reviews.length ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : 'New'; const payload = encodeURIComponent(JSON.stringify({ type:'creator', id:cr.id, title:`${i+1}. ${cr.name}${cr.verified?' ✓':''}`, meta:`${cr.profile?.niche||'General'} · ${cr.profile?.followers||'—'} · ${cr.profile?.rate||'—'} · ⭐ ${avg}` })); reply += `[REC:${payload}]\n`; });
    reply += `\nWant to invite one? Ask me **"how to invite"** or click any card.`;
    return reply;
  },
  explainApply(u){
    if(u.role !== 'creator') return `Only **creators** apply to campaigns. As a brand, you post campaigns instead. Ask me **"how to post a campaign"**.`;
    return `Here's how to **apply to a campaign** on PROMOLY:\n\n` + this.steps([
      `Go to **Campaigns** in the top nav (or type "suggest campaigns")`,
      `Click a campaign that matches your niche`,
      `Click the **"Apply to Campaign"** button`,
      `Write a **short pitch** — mention your audience fit, content ideas, and past work`,
      `Enter your **proposed rate** (be reasonable — check similar campaigns)`,
      `Estimate **delivery days** (usually 3–14 days)`,
      `Click **Submit** — the brand gets notified instantly`,
      `Track status in **Dashboard → Applications**`
    ]) + `\n\n💡 **Tip:** Personalise every pitch. Generic applications get declined 80% of the time.`;
  },
  explainDeleteApp(u){
    if(u.role !== 'creator') return `Only creators can have applications to delete. If you're a brand, you can review applications in your dashboard.`;
    return `To **delete an application** you've submitted:\n\n` + this.steps([
      `Go to **Dashboard → Applications**`,
      `Find the application you want to remove`,
      `Click the red **"Delete"** button on the right side of the row`,
      `Confirm when prompted — the application is removed instantly`,
      `The brand will no longer see your submission`
    ]) + `\n\n⚠️ **Note:** You can only delete applications that are in **pending** or **shortlisted** status. Once accepted, you'll need to talk to the brand first.`;
  },
  explainPost(u){
    if(u.role !== 'brand') return `Only **brands** post campaigns. As a creator, apply to existing campaigns instead. Ask me **"how to apply"**.`;
    return `Here's how to **post a campaign**:\n\n` + this.steps([
      `Go to **Dashboard → My Campaigns**`,
      `Click **"Post Campaign"** (or type "post campaign" and I'll open it)`,
      `Enter a **clear title** — e.g. "Fitness reel for running shoes"`,
      `Write a **detailed brief** — product, objective, tone, do's and don'ts`,
      `Pick the **category** and **platform**`,
      `Set your **budget** — this gets locked into escrow`,
      `Set a **realistic deadline** (give 2–4 weeks)`,
      `List **deliverables** (e.g. "1 reel + 2 stories")`,
      `Add **requirements** for creators (followers, niche, engagement)`,
      `Tick **"Fund escrow now"** to activate instantly`,
      `Click **Post Campaign**`
    ]) + `\n\n💡 **Tip:** Campaigns with funded escrow get **3x more applicants**.`;
  },
  explainFindCreators(u){
    if(u.role !== 'brand') return `You're a creator, so you can't browse creators. Try **"suggest campaigns"** instead.`;
    return `To find creators for your brand:\n\n` + this.steps([
      `Ask me **"suggest creators"** — I'll match by your industry`,
      `Or go to **Creators** in the nav bar to browse the full directory`,
      `Use filters: niche, platform, follower range`,
      `Check their **rating**, **verification badge**, and **rate**`,
      `Click **"Invite"** to send a direct collaboration invite`,
      `They'll get notified and can accept or decline`
    ]) + `\n\nI can also match creators to a **specific campaign** you've posted.`;
  },
  explainFindCampaigns(u){
    if(u.role !== 'creator') return `You're a brand — try **"suggest creators"** instead.`;
    return `To find campaigns that fit you:\n\n` + this.steps([
      `Ask me **"suggest campaigns"** for AI-matched picks`,
      `Or go to **Campaigns** in the nav bar`,
      `Filter by **category** (Fitness, Tech, Beauty, etc.)`,
      `Filter by **platform** (Instagram, YouTube, etc.)`,
      `Filter by **budget** range`,
      `Read the brief carefully — check deliverables & deadline`,
      `Apply if it's a good fit`
    ]) + `\n\nI can also help you **write the pitch** once you pick one.`;
  },
  explainEscrow(u){
    return `**Escrow** on PROMOLY protects both sides:\n\n` + this.steps([
      `Brand **funds the budget** when posting a campaign`,
      `Money is **held securely** — creator can't access it yet`,
      `Brand and creator agree on **milestones** (contract, draft, approval, publish)`,
      `As each milestone is completed and approved, funds **release**`,
      `If there's a dispute, PROMOLY **mediates** based on the signed contract`
    ]) + `\n\n🛡️ Result: creators **always get paid** for approved work, and brands only pay for **delivered work**.\n\n💳 For **plan upgrades** (Pro/Business), you can pay via **Credit/Debit Card, UPI (GPay, PhonePe, Paytm, BHIM), or PayPal** on the checkout page.`;
  },
  explainContract(){
    return `When a brand accepts your application, PROMOLY generates a **digital contract** covering:\n\n` + this.steps([
      `**Deliverables** — posts, videos, stories`,
      `**Rate & payment terms**`,
      `**Deadline** — exact date`,
      `**Usage rights** — how long the brand can use your content`
    ]) + `\n\n✍️ Both sides sign with **one click**. The signed contract is stored in your dashboard — perfect for records or disputes.`;
  },
  helpProfile(u){
    const isCreator = u.role === 'creator';
    return `To complete your profile:\n\n` + this.steps([
      `Open **Dashboard → Profile → Edit**`,
      `Upload a **photo** (from device or camera)`,
      isCreator ? `Fill in your **niche, platform, followers, rate**` : `Fill in your **company, industry, budget**`,
      `Add a short **bio** — tell the other side who you are`,
      `Click **Save Changes**`
    ]) + `\n\nWant me to open the editor? Just say **"yes"** or click the Edit Profile button.`;
  },
  explainPricing(u){
    const isCreator = u.role === 'creator';
    if(isCreator) {
      return `Here's how to think about **your rates** as a creator:\n\n` + this.steps([
        `**Micro (1K–50K followers):** ₹1,000 – ₹10,000 per post`,
        `**Mid (50K–500K):** ₹10,000 – ₹50,000 per post`,
        `**Macro (500K+):** ₹50,000+ per post`,
        `Adjust based on **engagement rate** (>3% commands premium)`,
        `Instagram reels often price higher than static posts`,
        `YouTube videos usually price 3–5x higher than Instagram`
      ]) + `\n\n💡 Always quote a **range** and let the brand negotiate.`;
    }
    return `**Pricing on PROMOLY** (as a brand):\n\n` + this.steps([
      `Free plan: **8% commission** per successful campaign`,
      `Pro plan (₹999/mo): **5% commission** + unlimited applications`,
      `Business plan (₹4,999/mo): **3% commission** + team seats + API access`,
      `No hidden fees — you pay the creator's rate + commission`,
      `Pay via **Card, UPI (GPay/PhonePe/Paytm/BHIM), or PayPal**`
    ]) + `\n\nWant to upgrade? Go to **Pricing → Upgrade to Pro** and complete checkout. I'll walk you through each step.`;
  },
  explainNegotiate(u){
    if(u.role === 'creator') return `**Negotiating with a brand?** Here's how:\n\n` + this.steps([
      `Quote a **range** (e.g. "₹15K–20K depending on scope")`,
      `Justify your rate with **engagement rate** and **audience quality**`,
      `Offer **bundles** (e.g. 1 reel + 3 stories = ₹25K)`,
      `Don't drop below 60% of your original ask`,
      `Use in-platform chat to keep everything documented`,
      `Get the final rate in the **digital contract** before starting work`
    ]);
    return `**Negotiating with a creator?** Here's how:\n\n` + this.steps([
      `Start with the **budget you posted** — don't go below 70% of it`,
      `Ask for a **bundled offer** (more deliverables at a discount)`,
      `Request a **test collaboration** at a smaller rate first`,
      `Consider **performance bonuses** (e.g. +20% if engagement target hits)`,
      `Confirm everything via the **digital contract**`
    ]);
  },
  explainDeadline(){
    return `**Typical campaign timelines:**\n\n` + this.steps([
      `Application & selection: **1–3 days**`,
      `Contract signing: **1 day**`,
      `Content creation: **3–7 days** (short-form), **7–14 days** (long-form)`,
      `Brand review & revisions: **2–5 days**`,
      `Publish & payment release: **1–2 days**`
    ]) + `\n\nTotal: usually **1–4 weeks** per campaign.`;
  },
  restartTutorialReply(){ setTimeout(() => { ZeGod.close(); startTutorial(); }, 300); return `Sure! Restarting the tutorial now... 🎓`; },
  generalHelp(u){
    const isCreator = u.role === 'creator';
    return `Here's what I can help you with:\n\n${isCreator
      ? `**1.** "Suggest campaigns" — AI matches for your niche\n**2.** "How to apply" — step-by-step pitch guide\n**3.** "Delete application" — remove an application\n**4.** "Explain escrow" — how payment safety works\n**5.** "Explain pricing" — how to price your services\n**6.** "Complete my profile" — boost your match rate\n**7.** "Restart tutorial" — walk through again`
      : `**1.** "Suggest creators" — AI matches for your industry\n**2.** "How to post a campaign" — full brief template\n**3.** "How to find creators" — discovery guide\n**4.** "Explain escrow" — payment protection\n**5.** "Explain pricing" — commission breakdown\n**6.** "Restart tutorial" — walk through again`}\n\nJust ask in your own words — I'll figure it out. 💡`;
  },
  fallbackReply(u){
    const isCreator = u.role === 'creator';
    return `I didn't quite catch that. Try one of these:\n\n${isCreator
      ? `• **"Suggest campaigns"** — get matches for your niche\n• **"How to apply"** — step-by-step\n• **"Delete application"** — remove an application\n• **"Explain escrow"** — payment safety`
      : `• **"Suggest creators"** — get matches for your brand\n• **"How to post a campaign"** — step-by-step\n• **"Explain escrow"** — payment safety`}\n\nOr type **"help"** for the full list.`;
  }
};
function openZeGod(){ ZeGod.open(); }

function showWelcome(force){
  const u = Auth.current();
  if(!u && !force) return;
  if(!force){ const key = CONFIG.keys.zgWelcomed + '_' + (u?.id || 'guest'); if(DB.read(key)) return; }
  const title = document.getElementById('zgWelcomeTitle');
  const body = document.getElementById('zgWelcomeBody');
  document.getElementById('zgDontShow').checked = false;
  if(u){ const first = u.name.split(' ')[0]; title.innerHTML = `Hi ${esc(first)}, welcome to <span class="zg-hl">PROMOLY</span>!`; body.innerHTML = u.role === 'creator' ? `I'm <strong>ZeGod</strong>, your AI assistant. I'll help you find campaigns for your <strong>${esc(u.profile?.niche || 'niche')}</strong> and get paid securely.` : `I'm <strong>ZeGod</strong>, your AI assistant. I'll help you find creators for your <strong>${esc(u.profile?.industry || 'industry')}</strong> and manage campaigns.`; }
  document.getElementById('zegodWelcome').classList.add('open');
}
function hideWelcome(){ document.getElementById('zegodWelcome').classList.remove('open'); }
function skipWelcome(){ const chk = document.getElementById('zgDontShow'); const u = Auth.current(); if(chk.checked && u) DB.write(CONFIG.keys.zgWelcomed + '_' + u.id, true); hideWelcome(); toast('👍 Click the robot anytime to chat.','info'); }

let tutStep = 0;
const tutorialSteps = [
  { title:'Welcome to PROMOLY', icon:'hand-sparkles', body:`I'm ZeGod, your AI assistant. Let me show you around — this will take less than a minute.`, target:null, position:'center' },
  { title:'Your Dashboard', icon:'gauge', body:`This is your command center. Track campaigns, applications, wallet, messages, and reviews — all in one place.`, target:null, position:'center' },
  { title:'Match With AI', icon:'robot', body:`Click the <strong>Ask ZeGod</strong> button — I'll suggest campaigns or creators based on your profile.`, target:'#dashPrimaryAction', position:'bottom' },
  { title:'Complete Your Profile', icon:'id-card', body:`A complete profile with a photo gets <strong>3x more matches</strong>. Add your photo and details anytime.`, target:'[onclick="openProfileEditor()"]', position:'bottom' },
  { title:'Escrow & Contracts', icon:'shield-halved', body:`Every payment is held in <strong>escrow</strong> until milestones are met. Digital contracts protect both sides.`, target:null, position:'center' },
  { title:"You're All Set! 🎉", icon:'rocket', body:`That's the tour! I'm always here if you have questions — just click the robot button anytime. Let's get started!`, target:null, position:'center' }
];
function startTutorial(){
  hideWelcome();
  if(!document.getElementById('page-dashboard').classList.contains('active') && Auth.isLoggedIn()){ go('dashboard'); setTimeout(() => { tutStep = 0; runTutStep(); }, 400); }
  else { tutStep = 0; runTutStep(); }
  document.getElementById('zegodTutorial').classList.add('open');
}
function runTutStep(){
  const card = document.getElementById('zgTutCard');
  const spot = document.getElementById('zgTutSpotlight');
  const step = tutorialSteps[tutStep];
  if(!step) return finishTutorial();
  document.getElementById('zgTutStep').textContent = `Step ${tutStep + 1} of ${tutorialSteps.length}`;
  document.getElementById('zgTutTitle').innerHTML = `<i class="fas fa-${step.icon}"></i> ${step.title}`;
  document.getElementById('zgTutBody').innerHTML = step.body;
  document.getElementById('zgTutPrev').style.display = tutStep === 0 ? 'none' : '';
  document.getElementById('zgTutNext').innerHTML = tutStep === tutorialSteps.length - 1 ? 'Finish <i class="fas fa-check"></i>' : 'Next <i class="fas fa-arrow-right"></i>';
  document.getElementById('zgTutProgress').innerHTML = tutorialSteps.map((_,i) => `<span class="${i <= tutStep ? 'on' : ''}"></span>`).join('');
  let spotRect = null;
  if(step.target){
    let el = document.querySelector(step.target);
    if(!el || el.offsetParent === null){
      const altSelectors = ['#dashPrimaryAction', '.dash-head .actions .btn-purple', '.dash-head .actions .btn-ghost'];
      for(const s of altSelectors){ const alt = document.querySelector(s); if(alt && alt.offsetParent !== null){ el = alt; break; } }
    }
    if(el && el.offsetParent !== null){ spotRect = el.getBoundingClientRect(); }
  }
  if(spotRect){
    const pad = 6;
    spot.style.display = 'block';
    spot.style.left = (spotRect.left - pad) + 'px';
    spot.style.top = (spotRect.top - pad) + 'px';
    spot.style.width = (spotRect.width + pad*2) + 'px';
    spot.style.height = (spotRect.height + pad*2) + 'px';
  } else spot.style.display = 'none';
  card.style.display = 'block';
  card.style.left = ''; card.style.top = ''; card.style.transform = '';
  if(!spotRect){ card.style.left = '50%'; card.style.top = '50%'; card.style.transform = 'translate(-50%, -50%)'; }
  else {
    const gap = 18; const cw = 380, ch = 260;
    let left, top;
    const pos = step.position || 'bottom';
    if(pos === 'bottom'){ left = Math.min(Math.max(spotRect.left + spotRect.width/2 - cw/2, 20), window.innerWidth - cw - 20); top = spotRect.bottom + gap; if(top + ch > window.innerHeight - 20) top = spotRect.top - ch - gap; }
    else if(pos === 'top'){ left = Math.min(Math.max(spotRect.left + spotRect.width/2 - cw/2, 20), window.innerWidth - cw - 20); top = spotRect.top - ch - gap; if(top < 20) top = spotRect.bottom + gap; }
    else { left = spotRect.left + spotRect.width/2 - cw/2; top = spotRect.top; }
    left = Math.max(20, Math.min(left, window.innerWidth - cw - 20));
    top = Math.max(20, Math.min(top, window.innerHeight - ch - 20));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
}
function nextTutStep(){ tutStep++; if(tutStep >= tutorialSteps.length) return finishTutorial(); runTutStep(); }
function prevTutStep(){ if(tutStep > 0){ tutStep--; runTutStep(); } }
function skipTutorial(){ finishTutorial(true); }
function finishTutorial(skipped){
  document.getElementById('zegodTutorial').classList.remove('open');
  document.getElementById('zgTutSpotlight').style.display = 'none';
  document.getElementById('zgTutCard').style.display = 'none';
  tutStep = 0;
  const u = Auth.current(); if(u) DB.write(CONFIG.keys.zgWelcomed + '_' + u.id, true);
  if(!skipped){ toast('🎉 Tutorial complete! You\'re ready.','ok'); setTimeout(() => { if(Auth.isLoggedIn()) ZeGod.open(); }, 500); }
  else toast('Tutorial skipped. Click the robot anytime!','info');
}
function restartTutorial(){ if(!Auth.isLoggedIn()){ toast('Please log in first.','err'); return; } startTutorial(); }

/* ROUTER */
function go(page, param){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if(el) el.classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
  document.getElementById('navLinks').classList.remove('mobile-open');
  closeNotif(); closeUserMenu(); closeSidebar();

  if(page === 'auth'){ if(Auth.isLoggedIn()){ go('dashboard'); toast('You\'re already signed in. Log out first to switch accounts.','info'); return; } setAuthMode(param === 'login' ? 'login' : 'signup', param); initCursorCanvas(); }
  if(page === 'campaigns') renderCampaigns();
  if(page === 'creators') renderCreators();
  if(page === 'dashboard'){ if(!Auth.isLoggedIn()){ go('auth','login'); toast('Please log in first.','err'); return; } renderDashboard(); }
  if(page === 'faq') renderFAQ();
  if(page === 'blog') renderBlog();
  if(page === 'case-studies') renderCaseStudies();
  if(page === 'home') renderHomeCampaigns();
  if(page === 'checkout') { if(!Auth.isLoggedIn()){ go('auth','login'); toast('Please log in to upgrade.','err'); return; } setupCheckout(param || 'pro'); }
  setTimeout(observeAll, 60);
}

function refreshNav(){
  const actions = document.getElementById('navActions');
  const old = document.getElementById('userChipWrap'); if(old) old.remove();
  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  const u = Auth.current();
  if(!u){
    loginBtn.style.display = ''; signupBtn.style.display = '';
    document.getElementById('notifDot').classList.add('hidden');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = '');
    document.querySelectorAll('.member-only').forEach(el => el.style.display = 'none');
    return;
  }
  loginBtn.style.display = 'none'; signupBtn.style.display = 'none';
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.member-only').forEach(el => el.style.display = '');

  const wrap = document.createElement('div');
  wrap.id = 'userChipWrap'; wrap.style.position = 'relative';
  const avInner = u.avatar ? `<img src="${u.avatar}" class="av-img" alt="avatar"/>` : (u.name||'U').charAt(0).toUpperCase();
  wrap.innerHTML = `
    <div class="user-chip" id="userChip" onclick="toggleUserMenu(event)">
      <div class="u-avatar">${avInner}</div>
      <div style="display:flex;flex-direction:column;line-height:1.1"><span class="u-name">${esc(u.name)}</span><span class="u-role">${u.role}</span></div>
      <i class="fas fa-chevron-down" style="font-size:9px;color:var(--muted);margin-left:2px"></i>
    </div>
    <div class="user-menu" id="userMenu">
      <div class="um-head"><div class="um-av">${u.avatar ? `<img src="${u.avatar}" class="av-img" alt="avatar"/>` : (u.name||'U').charAt(0).toUpperCase()}</div><div style="flex:1;min-width:0"><div class="n">${esc(u.name)}</div><div class="e">${esc(u.email)}</div></div></div>
      <button onclick="go('dashboard'); closeUserMenu();"><i class="fas fa-gauge"></i> Dashboard</button>
      <button onclick="openProfileEditor(); closeUserMenu();"><i class="fas fa-user-edit"></i> Edit profile</button>
      <button onclick="openZeGod(); closeUserMenu();"><i class="fas fa-robot"></i> Ask ZeGod</button>
      <button onclick="go('pricing'); closeUserMenu();"><i class="fas fa-crown"></i> Upgrade Plan</button>
      <button class="danger" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Log out</button>
    </div>`;
  actions.appendChild(wrap);
  const unread = Store.notifsFor(u.id).filter(n => !n.read).length;
  document.getElementById('notifDot').classList.toggle('hidden', unread === 0);
}
function toggleUserMenu(e){ e.stopPropagation(); document.getElementById('userMenu')?.classList.toggle('open'); }
function closeUserMenu(){ document.getElementById('userMenu')?.classList.remove('open'); }
function handleLogout(){
  ZeGod.close(); ZeGod.clearHistory(); ZeGod.greetedFor = null;
  hideWelcome(); document.getElementById('zegodTutorial').classList.remove('open');
  Auth.logout(); closeUserMenu(); refreshNav();
  toast('👋 Logged out. You can now log in again.','info');
  go('home');
}
function toggleNotif(e){ e.stopPropagation(); const d = document.getElementById('notifDropdown'); d.classList.toggle('open'); if(d.classList.contains('open')) renderNotifDropdown(); }
function closeNotif(){ document.getElementById('notifDropdown')?.classList.remove('open'); }
function renderNotifDropdown(){
  const list = document.getElementById('notifList');
  const u = Auth.current();
  const notifs = u ? Store.notifsFor(u.id) : [];
  if(!notifs.length){ list.innerHTML = '<div class="notif-empty">No new notifications</div>'; return; }
  const iconMap = { amber:'star', cyan:'bolt', green:'check' };
  list.innerHTML = notifs.slice(0,10).map(n => `<div class="notif-item"><div class="ni-icon ${n.icon}"><i class="fas fa-${iconMap[n.icon]||'bell'}"></i></div><div class="ni-text">${esc(n.text)}<small>${timeAgo(n.ts)}</small></div></div>`).join('');
}
function timeAgo(iso){
  const d = (Date.now() - new Date(iso).getTime())/1000;
  if(d < 60) return 'Just now';
  if(d < 3600) return Math.floor(d/60) + ' min ago';
  if(d < 86400) return Math.floor(d/3600) + ' hr ago';
  return Math.floor(d/86400) + ' days ago';
}

let authMode = 'signup'; let authRole = 'creator';
function setAuthMode(mode, roleParam){
  authMode = mode; const isLogin = mode === 'login';
  document.getElementById('modeSignupBtn').classList.toggle('active', !isLogin);
  document.getElementById('modeLoginBtn').classList.toggle('active', isLogin);
  document.getElementById('roleToggle').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('nameGroup').style.display = isLogin ? 'none' : 'block';
  document.getElementById('creatorFields').classList.toggle('visible', !isLogin && authRole === 'creator');
  document.getElementById('brandFields').classList.toggle('visible', !isLogin && authRole === 'brand');
  document.getElementById('authHeading').textContent = isLogin ? 'Welcome back' : 'Get started in minutes';
  document.getElementById('authSubtext').textContent = isLogin ? 'Enter the email and password you signed up with.' : 'Fill an order ticket on the left. The live exchange board shows what\'s already on PROMOLY.';
  const sideEl = document.getElementById('ticketSide');
  if(isLogin){ sideEl.textContent = 'LOGIN · SESSION'; sideEl.style.color = 'var(--purple)'; sideEl.style.background = 'var(--purple-dim)'; }
  else { sideEl.textContent = authRole === 'creator' ? 'CREATOR · LISTING' : 'BRAND · CAMPAIGN'; sideEl.style.color = authRole === 'creator' ? 'var(--amber)' : 'var(--cyan)'; sideEl.style.background = authRole === 'creator' ? 'var(--amber-dim)' : 'var(--cyan-dim)'; }
  const btn = document.getElementById('submitBtn');
  if(isLogin){ btn.className = 'btn ot-submit btn-purple'; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log in to PROMOLY'; }
  else { btn.className = 'btn ot-submit' + (authRole === 'creator' ? '' : ' btn-cyan'); btn.innerHTML = authRole === 'creator' ? '<i class="fas fa-plus-circle"></i> List my reach' : '<i class="fas fa-bullhorn"></i> Post my budget'; }
  if(!isLogin && roleParam) setRole(roleParam);
  renderExchangeBoard(); refreshNav();
}
function setRole(role){
  authRole = role;
  document.querySelectorAll('.role-toggle button').forEach(b => b.classList.remove('active'));
  document.querySelector(`.role-toggle .role-${role}`)?.classList.add('active');
  if(authMode === 'signup'){
    document.getElementById('creatorFields').classList.toggle('visible', role === 'creator');
    document.getElementById('brandFields').classList.toggle('visible', role === 'brand');
    const sideEl = document.getElementById('ticketSide');
    sideEl.textContent = role === 'creator' ? 'CREATOR · LISTING' : 'BRAND · CAMPAIGN';
    sideEl.style.color = role === 'creator' ? 'var(--amber)' : 'var(--cyan)';
    sideEl.style.background = role === 'creator' ? 'var(--amber-dim)' : 'var(--cyan-dim)';
    const btn = document.getElementById('submitBtn');
    btn.className = 'btn ot-submit' + (role === 'creator' ? '' : ' btn-cyan');
    btn.innerHTML = role === 'creator' ? '<i class="fas fa-plus-circle"></i> List my reach' : '<i class="fas fa-bullhorn"></i> Post my budget';
  }
  renderExchangeBoard();
}
function renderExchangeBoard(){
  const rows = document.getElementById('obRows'); const count = document.getElementById('obCount'); if(!rows) return;
  const entries = [];
  Store.campaigns().filter(c => c.status === 'open').slice(0, 6).forEach(c => { entries.push({ side:'brand', name:c.brandName, sub:c.title, focus:c.category + ' · ' + c.platform, offer:fmtMoney(c.budget), offerSub:'budget', match: Math.floor(Math.random()*20+78) }); });
  Auth.users().filter(u => u.role === 'creator').slice(0, 6).forEach(u => { entries.push({ side:'creator', name:u.name, sub:'@' + u.name.toLowerCase().replace(/\s/g,'') + ' · ' + (u.profile?.platform||'Social'), focus:(u.profile?.niche||'General') + ' · ' + (u.profile?.platform||'—'), offer:u.profile?.rate||'₹8K', offerSub:'per post', match: Math.floor(Math.random()*20+76) }); });
  entries.sort(() => Math.random() - 0.5);
  const list = entries.slice(0, 8);
  count.textContent = list.length + ' open listings';
  rows.innerHTML = list.map(l => {
    const matchCls = l.match >= 90 ? 'high' : l.match >= 80 ? 'mid' : 'low';
    const isCreator = l.side === 'creator';
    return `<div class="ob-row"><span class="type-tag ${isCreator?'creator':'brand'}"><i class="fas fa-${isCreator?'user':'building'}"></i>${isCreator?'CREATOR':'BRAND'}</span><span class="ob-name">${esc(l.name)}<small>${esc(l.sub)}</small></span><span class="ob-focus">${esc(l.focus)}</span><span class="ob-offer">${esc(l.offer)}<small>${esc(l.offerSub)}</small></span><span class="ob-match ${matchCls}"><span class="dot"></span>${l.match}%</span></div>`;
  }).join('');
}
async function handleAuth(){
  const name = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if(!email || !password) return otToast('Email and password are required.','err');
  if(authMode === 'signup' && !name) return otToast('Please enter your full name.','err');
  if(!/^\S+@\S+\.\S+$/.test(email)) return otToast('That email looks invalid.','err');
  if(password.length < 8) return otToast('Password must be at least 8 characters.','err');
  const btn = document.getElementById('submitBtn');
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  if(authMode === 'login'){
    const r = Auth.login({ email, password });
    if(!r.ok){ btn.disabled = false; btn.innerHTML = orig; return otToast(r.error, 'err'); }
    Mailer.notifyLogin(r.user);
    Store.addNotif(r.user.id, 'Logged in successfully', 'green');
    otToast('Welcome back, ' + r.user.name + '!', 'ok');
    btn.disabled = false; btn.innerHTML = orig;
    refreshNav();
    setTimeout(() => { go('dashboard'); setTimeout(() => showWelcome(false), 600); }, 500);
    return;
  }
  let profile = {};
  if(authRole === 'creator'){
    const niche = document.getElementById('niche').value.trim();
    if(!niche){ btn.disabled = false; btn.innerHTML = orig; return otToast('Please select your niche.','err'); }
    profile = { niche, followers: document.getElementById('followers').value.trim() || '10K', platform: document.getElementById('platform').value.trim() || 'Instagram', rate: document.getElementById('rate').value.trim() || '₹8K', location: document.getElementById('location').value.trim() || 'India' };
  } else {
    const industry = document.getElementById('industry').value.trim();
    if(!industry){ btn.disabled = false; btn.innerHTML = orig; return otToast('Please select your industry.','err'); }
    profile = { company: document.getElementById('company').value.trim() || name, industry, website: document.getElementById('website').value.trim() || '', budget: document.getElementById('budget').value.trim() || '₹30K' };
  }
  const r = Auth.signup({ name, email, password, role: authRole, profile });
  if(!r.ok){ btn.disabled = false; btn.innerHTML = orig; return otToast(r.error, 'err'); }
  await Mailer.notifySignup(r.user, authRole === 'creator' ? { Niche:profile.niche, Followers:profile.followers, Platform:profile.platform, Rate:profile.rate, Location:profile.location } : { Company:profile.company, Industry:profile.industry, Website:profile.website, Budget:profile.budget });
  Store.addNotif(r.user.id, 'Welcome to PROMOLY! Add a profile photo to get noticed.', 'green');
  otToast('Account created! Sending credentials...', 'ok');
  btn.disabled = false; btn.innerHTML = orig;
  refreshNav();
  setTimeout(() => { go('dashboard'); setTimeout(() => showWelcome(false), 700); }, 500);
}

function renderHomeCampaigns(){ const grid = document.getElementById('homeCampaigns'); if(!grid) return; const c = Store.campaigns().filter(x => x.status === 'open').slice(0,3); grid.innerHTML = c.map(campaignCardHTML).join(''); grid.classList.add('stagger'); observeAll(); }
function renderCampaigns(){
  const grid = document.getElementById('campaignsGrid'); if(!grid) return;
  const q = (document.getElementById('campSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('campCategory')?.value || '';
  const plat = document.getElementById('campPlatform')?.value || '';
  const bud = document.getElementById('campBudget')?.value || '';
  let list = Store.campaigns().filter(c => c.status === 'open');
  if(q) list = list.filter(c => (c.title + c.description + c.brandName).toLowerCase().includes(q));
  if(cat) list = list.filter(c => c.category === cat);
  if(plat) list = list.filter(c => c.platform === plat);
  if(bud){ const [min,max] = bud.split('-').map(Number); list = list.filter(c => c.budget >= min && c.budget <= max); }
  if(!list.length){ grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><i class="fas fa-magnifying-glass"></i><p>No campaigns match your filters.</p></div>'; return; }
  grid.innerHTML = list.map(campaignCardHTML).join('');
  grid.classList.add('stagger'); observeAll();
  const u = Auth.current();
  document.getElementById('newCampaignBtn').style.display = (u && u.role === 'brand') ? '' : 'none';
}
function campaignCardHTML(c){
  return `<div class="campaign-card" onclick="openCampaignDetail('${c.id}')"><div class="cc-top"><div><h4>${esc(c.title)}</h4><div class="cc-brand"><i class="fas fa-building"></i> ${esc(c.brandName)} ${c.brandVerified?'<i class="fas fa-circle-check" style="color:var(--cyan);font-size:11px"></i>':''}</div></div><span class="pill ${c.escrow?'green':'gray'}">${c.escrow?'ESCROW':'OPEN'}</span></div><p class="cc-desc">${esc(c.description)}</p><div class="cc-meta"><span><i class="fas fa-tag"></i> ${esc(c.category)}</span><span><i class="fas fa-share-nodes"></i> ${esc(c.platform)}</span><span><i class="fas fa-calendar"></i> ${fmtDate(c.deadline)}</span></div><div class="cc-foot"><div class="cc-budget">${fmtMoney(c.budget)}<small style="font-size:10px;color:var(--muted);font-weight:400"> budget</small></div><button class="btn btn-sm" onclick="event.stopPropagation();openCampaignDetail('${c.id}')">View</button></div></div>`;
}
function renderCreators(){
  const grid = document.getElementById('creatorsGrid'); if(!grid) return;
  const q = (document.getElementById('creatorSearch')?.value || '').toLowerCase();
  const niche = document.getElementById('creatorNiche')?.value || '';
  const plat = document.getElementById('creatorPlatform')?.value || '';
  let list = Auth.users().filter(u => u.role === 'creator');
  if(q) list = list.filter(u => (u.name + (u.profile?.niche||'')).toLowerCase().includes(q));
  if(niche) list = list.filter(u => (u.profile?.niche||'') === niche);
  if(plat) list = list.filter(u => (u.profile?.platform||'') === plat);
  if(!list.length){ grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><i class="fas fa-magnifying-glass"></i><p>No creators match your filters.</p></div>'; return; }
  const current = Auth.current();
  grid.innerHTML = list.map(u => {
    const reviews = Store.reviewsFor(u.id);
    const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '—';
    return `<div class="card card-hover"><div class="flex items-center gap-12 mb-16"><div class="mk-avatar" style="width:52px;height:52px;font-size:20px;margin:0">${u.avatar ? `<img src="${u.avatar}" class="av-img" alt="avatar"/>` : esc(u.name.charAt(0))}</div><div><div class="flex items-center gap-8"><h4 style="font-family:var(--font-display);font-size:16px">${esc(u.name)}</h4>${u.verified?'<i class="fas fa-circle-check" style="color:var(--cyan);font-size:12px"></i>':''}</div><div class="text-muted" style="font-size:12px">${esc(u.profile?.niche||'General')} · ${esc(u.profile?.platform||'—')}</div></div></div><div class="grid-2" style="gap:10px;margin-bottom:14px"><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.5px">Followers</div><div style="font-family:var(--font-display);font-weight:600;font-size:15px">${esc(u.profile?.followers||'—')}</div></div><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.5px">Rate</div><div style="font-family:var(--font-display);font-weight:600;font-size:15px;color:var(--amber)">${esc(u.profile?.rate||'—')}</div></div></div><div class="flex items-center justify-between" style="padding-top:12px;border-top:1px solid var(--border)"><div class="stars-display">${stars(Math.round(parseFloat(avg)||0))} <span class="text-muted" style="font-size:11px;font-family:var(--font-mono)">${avg==='—'?'No reviews':avg+' ('+reviews.length+')'}</span></div>${current && current.role === 'brand' ? `<button class="btn btn-sm btn-cyan" onclick="openInviteCreator('${u.id}')"><i class="fas fa-paper-plane"></i> Invite</button>` : ''}</div></div>`;
  }).join('');
  grid.classList.add('stagger'); observeAll();
}
function openCampaignDetail(id){
  const c = Store.getCampaign(id); if(!c) return;
  const u = Auth.current();
  const myApp = u && u.role === 'creator' ? Store.appsForCampaign(id).find(a => a.creatorId === u.id) : null;
  const apps = Store.appsForCampaign(id);
  const isOwnCampaign = u && u.role === 'brand' && c.brandId === u.id;
  let foot = '';
  if(u && u.role === 'creator' && !myApp && c.status === 'open') foot = `<button class="btn" onclick="openApplyModal('${id}')"><i class="fas fa-paper-plane"></i> Apply to Campaign</button>`;
  else if(myApp) foot = `<span class="pill ${myApp.status==='accepted'?'green':myApp.status==='declined'?'red':'amber'}">Application: ${myApp.status}</span><button class="btn btn-ghost" onclick="openThread('${c.brandId}');closeModal()"><i class="fas fa-comments"></i> Message Brand</button>`;
  else if(isOwnCampaign) foot = `<button class="btn btn-ghost" onclick="openCampaignApplicants('${id}');closeModal()"><i class="fas fa-users"></i> View ${apps.length} applicants</button>`;
  else if(!u) foot = `<button class="btn" onclick="go('auth','creator');closeModal()"><i class="fas fa-sign-in-alt"></i> Log in to apply</button>`;
  document.getElementById('modalTitle').innerHTML = `<i class="fas fa-bullhorn" style="color:var(--amber);margin-right:8px"></i>${esc(c.title)}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="flex items-center gap-8 mb-16"><span class="pill amber">${esc(c.category)}</span><span class="pill cyan">${esc(c.platform)}</span><span class="pill ${c.escrow?'green':'gray'}">${c.escrow?'ESCROW FUNDED':'OPEN'}</span></div>
    <div class="flex items-center gap-12 mb-24"><div class="mk-avatar" style="width:40px;height:40px;font-size:16px;margin:0">${esc(c.brandName.charAt(0))}</div><div><div class="flex items-center gap-8"><strong>${esc(c.brandName)}</strong>${c.brandVerified?'<i class="fas fa-circle-check" style="color:var(--cyan);font-size:12px"></i>':''}</div><div class="text-muted" style="font-size:12px">Verified Brand</div></div></div>
    <div class="mb-16"><div class="text-muted" style="font-size:10.5px;text-transform:uppercase;margin-bottom:4px">Description</div><p style="font-size:14px;line-height:1.7">${esc(c.description)}</p></div>
    <div class="grid-2" style="gap:14px;margin-bottom:16px"><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Budget</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--amber)">${fmtMoney(c.budget)}</div></div><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Deadline</div><div style="font-family:var(--font-display);font-size:16px;font-weight:600">${fmtDate(c.deadline)}</div></div><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Deliverables</div><div style="font-size:13.5px">${esc(c.deliverables)}</div></div><div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Applicants</div><div style="font-size:13.5px">${apps.length} creators</div></div></div>
    <div class="mb-16"><div class="text-muted" style="font-size:10.5px;text-transform:uppercase;margin-bottom:4px">Requirements</div><p style="font-size:13.5px">${esc(c.requirements)}</p></div>`;
  document.getElementById('modalFoot').innerHTML = foot;
  document.getElementById('modalBg').classList.add('open');
}
function closeModal(){ document.getElementById('modalBg').classList.remove('open'); }
function openApplyModal(campaignId){
  const c = Store.getCampaign(campaignId);
  const u = Auth.current();
  if(!u || u.role !== 'creator') return toast('Only creators can apply.','err');
  document.getElementById('modalTitle').innerHTML = `<i class="fas fa-paper-plane" style="color:var(--amber);margin-right:8px"></i>Apply to ${esc(c.title)}`;
  document.getElementById('modalBody').innerHTML = `<div class="form-group"><label>Your pitch</label><textarea id="appPitch" placeholder="Tell the brand why you're a great fit..."></textarea></div><div class="form-group"><label>Proposed rate</label><input id="appRate" placeholder="e.g. 8000" type="number"/></div><div class="form-group"><label>Estimated delivery (days)</label><input id="appDays" placeholder="e.g. 7" type="number"/></div>`;
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="openCampaignDetail('${campaignId}')">Cancel</button><button class="btn" onclick="submitApplication('${campaignId}')"><i class="fas fa-paper-plane"></i> Submit</button>`;
  document.getElementById('modalBg').classList.add('open');
}
async function submitApplication(campaignId){
  const u = Auth.current();
  const c = Store.getCampaign(campaignId);
  const pitch = document.getElementById('appPitch').value.trim();
  const rate = document.getElementById('appRate').value.trim();
  const days = document.getElementById('appDays').value.trim();
  if(!pitch) return toast('Please write a short pitch.','err');
  if(!rate) return toast('Please enter your rate.','err');
  const app = Store.addApp({ id:uid('a_'), campaignId, creatorId:u.id, creatorName:u.name, creatorNiche:u.profile?.niche||'', status:'pending', pitch, rate:Number(rate), days:Number(days)||7, createdAt:now(), milestones:[], contract:null });
  Store.addNotif(c.brandId, `${u.name} applied to "${c.title}"`, 'cyan');
  await Mailer.notifyApplication(u, c, app);
  toast('Application submitted!','ok');
  closeModal();
  openCampaignDetail(campaignId);
}
function openNewCampaign(){
  const u = Auth.current();
  if(!u) return go('auth','brand');
  if(u.role !== 'brand') return toast('Only brands can post campaigns.','err');
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus" style="color:var(--amber);margin-right:8px"></i>Post a New Campaign';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Campaign title</label><input id="ncTitle" placeholder="e.g. Fitness reel for running shoes"/></div>
    <div class="form-group"><label>Description / Brief</label><textarea id="ncDesc" placeholder="Describe your product and campaign..."></textarea></div>
    <div class="grid-2" style="gap:12px">
      <div class="form-group"><label>Category</label><select id="ncCategory"><option>Fitness</option><option>Tech</option><option>Beauty</option><option>Food</option><option>Fashion</option><option>Lifestyle</option><option>Finance</option><option>Gaming</option><option>Travel</option><option>Education</option></select></div>
      <div class="form-group"><label>Platform</label><select id="ncPlatform"><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option><option>LinkedIn</option><option>Blog</option></select></div>
      <div class="form-group"><label>Budget (₹)</label><input id="ncBudget" type="number" placeholder="30000"/></div>
      <div class="form-group"><label>Deadline</label><input id="ncDeadline" type="date"/></div>
    </div>
    <div class="form-group"><label>Deliverables</label><input id="ncDeliverables" placeholder="e.g. 1 reel + 2 stories"/></div>
    <div class="form-group"><label>Requirements</label><input id="ncRequirements" placeholder="e.g. 30K+ followers"/></div>
    <div class="flex items-center gap-8" style="padding:12px;background:var(--surface-2);border-radius:8px;margin-top:8px">
      <input type="checkbox" id="ncEscrow" checked style="width:auto"/>
      <label for="ncEscrow" class="text-muted" style="font-size:13px;margin:0">Fund escrow now</label>
    </div>`;
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCampaign()"><i class="fas fa-bullhorn"></i> Post Campaign</button>`;
  document.getElementById('modalBg').classList.add('open');
}
async function submitCampaign(){
  const u = Auth.current();
  if(!u || u.role !== 'brand') return;
  const title = document.getElementById('ncTitle').value.trim();
  const desc = document.getElementById('ncDesc').value.trim();
  const budget = Number(document.getElementById('ncBudget').value);
  const deadline = document.getElementById('ncDeadline').value;
  if(!title || !desc || !budget || !deadline) return toast('Please fill in all required fields.','err');
  const escrow = document.getElementById('ncEscrow').checked;
  if(escrow && (u.wallet || 0) < budget){ Auth.update({ wallet:(u.wallet||0)+budget+100000 }); toast('Demo wallet topped up.','info'); }
  const c = Store.addCampaign({ id:uid('cp_'), brandId:u.id, brandName:u.profile?.company||u.name, brandVerified:u.verified, title, category:document.getElementById('ncCategory').value, platform:document.getElementById('ncPlatform').value, budget, deliverables:document.getElementById('ncDeliverables').value.trim()||'—', deadline, description:desc, requirements:document.getElementById('ncRequirements').value.trim()||'—', status:'open', escrow, createdAt:now() });
  if(escrow) Auth.update({ wallet:(Auth.current().wallet||0)-budget });
  await Mailer.notifyCampaign(u, c);
  Store.addNotif(u.id, `Campaign "${title}" is live!`, 'green');
  toast('Campaign posted!','ok');
  closeModal();
  renderCampaigns();
  if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}
function openCampaignApplicants(campaignId){
  const c = Store.getCampaign(campaignId);
  const apps = Store.appsForCampaign(campaignId);
  document.getElementById('modalTitle').innerHTML = `<i class="fas fa-users" style="color:var(--amber);margin-right:8px"></i>Applicants — ${esc(c.title)}`;
  if(!apps.length) document.getElementById('modalBody').innerHTML = '<div class="empty"><i class="fas fa-inbox"></i><p>No applications yet.</p></div>';
  else document.getElementById('modalBody').innerHTML = apps.map(a => `<div class="list-row"><div class="lr-icon amber"><i class="fas fa-user"></i></div><div class="lr-info"><h4>${esc(a.creatorName)} ${a.creatorNiche?'<span class="text-muted" style="font-size:11px">· '+esc(a.creatorNiche)+'</span>':''}</h4><p>${esc(a.pitch.slice(0,90))}${a.pitch.length>90?'...':''}</p></div><div class="lr-value">${fmtMoney(a.rate)}</div><div class="lr-actions">${a.status === 'pending' ? `<button class="btn btn-sm btn-green" onclick="acceptApp('${a.id}','${campaignId}')"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-ghost" onclick="declineApp('${a.id}','${campaignId}')"><i class="fas fa-times"></i></button>` : `<span class="pill ${a.status==='accepted'?'green':'red'}">${a.status}</span>`}<button class="btn btn-sm btn-ghost" onclick="openThread('${a.creatorId}');closeModal()"><i class="fas fa-comments"></i></button></div></div>`).join('');
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`;
  document.getElementById('modalBg').classList.add('open');
}
function acceptApp(appId, campaignId){
  const a = Store.updateApp(appId, { status:'accepted', milestones:[{name:'Contract signed',done:false},{name:'Draft submitted',done:false},{name:'Content approved',done:false},{name:'Published',done:false},{name:'Payment released',done:false}] });
  if(a){ Store.addNotif(a.creatorId, `Your application was accepted!`,'green'); toast('Application accepted.','ok'); }
  openCampaignApplicants(campaignId);
}
function declineApp(appId, campaignId){
  const a = Store.updateApp(appId, { status:'declined' });
  if(a) Store.addNotif(a.creatorId, `Your application was declined.`,'amber');
  openCampaignApplicants(campaignId);
}
function openInviteCreator(creatorId){
  const u = Auth.current();
  if(!u || u.role !== 'brand') return;
  const creator = Auth.users().find(x => x.id === creatorId);
  if(!creator) return;
  const myCampaigns = Store.campaigns().filter(c => c.brandId === u.id && c.status === 'open');
  if(!myCampaigns.length){ toast('Post a campaign first.','err'); return openNewCampaign(); }
  document.getElementById('modalTitle').innerHTML = `<i class="fas fa-paper-plane" style="color:var(--cyan);margin-right:8px"></i>Invite ${esc(creator.name)}`;
  document.getElementById('modalBody').innerHTML = `<div class="form-group"><label>Select campaign</label><select id="invCampaign">${myCampaigns.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></div><div class="form-group"><label>Message</label><textarea id="invMessage" placeholder="Hi ${esc(creator.name.split(' ')[0])}, I'd love to collaborate..."></textarea></div>`;
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-cyan" onclick="sendInvite('${creatorId}')"><i class="fas fa-paper-plane"></i> Send</button>`;
  document.getElementById('modalBg').classList.add('open');
}
function sendInvite(creatorId){
  const u = Auth.current();
  const campId = document.getElementById('invCampaign').value;
  const msg = document.getElementById('invMessage').value.trim() || `Hi! I'd love to collaborate on this campaign.`;
  const c = Store.getCampaign(campId);
  Store.addMsg({ id:uid('m_'), from:u.id, to:creatorId, text:`[Invite to "${c.title}"] ${msg}`, ts:now(), read:false });
  Store.addNotif(creatorId, `${u.name} invited you to "${c.title}"`,'cyan');
  toast('Invitation sent!','ok');
  closeModal();
}
function openThread(partnerId){
  const u = Auth.current();
  if(!u) return go('auth','login');
  if(partnerId === u.id) return;
  Store.markThreadRead(u.id, partnerId);
  const p = Auth.users().find(x => x.id === partnerId);
  const thread = Store.thread(u.id, partnerId);
  document.getElementById('modalTitle').innerHTML = `<i class="fas fa-comments" style="color:var(--amber);margin-right:8px"></i>Chat with ${esc(p?.name || 'User')}`;
  document.getElementById('modalBody').innerHTML = `<div id="threadBox" style="display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto;padding:8px 0">${thread.length ? thread.map(m => `<div class="msg-bubble ${m.from===u.id?'me':'them'}">${esc(m.text)}<small>${fmtTime(m.ts)}</small></div>`).join('') : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px">No messages yet. Say hi!</div>'}</div><div class="msg-input" style="border-radius:10px;margin-top:12px"><input id="threadInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendThreadMsg('${partnerId}')"/><button class="btn btn-sm" onclick="sendThreadMsg('${partnerId}')"><i class="fas fa-paper-plane"></i></button></div>`;
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`;
  document.getElementById('modalBg').classList.add('open');
  setTimeout(() => { const tb = document.getElementById('threadBox'); if(tb) tb.scrollTop = tb.scrollHeight; document.getElementById('threadInput')?.focus(); }, 100);
}
function sendThreadMsg(partnerId){
  const u = Auth.current();
  const input = document.getElementById('threadInput');
  const text = input.value.trim();
  if(!text) return;
  Store.addMsg({ id:uid('m_'), from:u.id, to:partnerId, text, ts:now(), read:false });
  Store.addNotif(partnerId, `${u.name}: ${text.slice(0,40)}${text.length>40?'...':''}`,'cyan');
  input.value = '';
  openThread(partnerId);
}

/* ==================================================================
   CHECKOUT — Payment methods (Card / UPI / PayPal)
   ================================================================== */
let checkoutPlan = 'pro';
let selectedPayMethod = 'card';
let selectedUpiApp = 'gpay';
const PLAN_INFO = {
  pro: { name:'Pro Membership', tagline:'For serious creators & brands', monthly:999, tag:'PRO PLAN', features:[
    'Unlimited applications & campaigns',
    'Escrow payments + invoices',
    'Digital contracts',
    'Advanced analytics dashboard',
    'Verified badge & priority matching'
  ]},
  business: { name:'Business Membership', tagline:'For agencies & teams', monthly:4999, tag:'BUSINESS PLAN', features:[
    'Everything in Pro',
    'Team seats (up to 10)',
    'Bulk campaign posting',
    'API access & integrations',
    'Dedicated account manager',
    'SLA & priority support'
  ]}
};

function startCheckout(plan){
  if(!Auth.isLoggedIn()){ toast('Please log in to upgrade.','err'); setTimeout(() => go('auth','login'), 500); return; }
  go('checkout', plan);
}
function setupCheckout(plan){
  checkoutPlan = plan;
  const info = PLAN_INFO[plan] || PLAN_INFO.pro;

  document.getElementById('checkoutHeading').textContent = `Upgrade to ${plan === 'pro' ? 'Pro' : 'Business'}`;
  document.getElementById('checkoutSubtext').textContent = `Complete your subscription to unlock all ${plan === 'pro' ? 'Pro' : 'Business'} features. Payment is encrypted end-to-end.`;

  document.getElementById('summaryPlanTag').textContent = info.tag;
  document.getElementById('summaryPlanName').textContent = info.name;
  document.getElementById('summaryPlanTagline').textContent = info.tagline;
  document.getElementById('summarySubtotal').textContent = fmtMoney(info.monthly);
  const tax = Math.round(info.monthly * 0.18);
  document.getElementById('summaryTax').textContent = fmtMoney(tax);
  document.getElementById('summaryTotal').textContent = fmtMoney(info.monthly + tax);
  document.getElementById('payTotalAmount').textContent = fmtMoney(info.monthly + tax);
  document.getElementById('renewalNote').textContent = plan === 'pro' ? 'Renews monthly at ₹999 · Cancel anytime' : 'Renews monthly at ₹4,999 · Cancel anytime';
  document.getElementById('summaryFeatures').innerHTML = info.features.map(f => `<li><i class="fas fa-check"></i> ${esc(f)}</li>`).join('');

  document.getElementById('checkoutMain').style.display = '';
  document.getElementById('checkoutSuccess').style.display = 'none';
  selectPayMethod('card');

  const u = Auth.current();
  if(u){
    document.getElementById('billName').value = u.name || '';
    document.getElementById('billEmail').value = u.email || '';
  }
  setTimeout(observeAll, 60);
}
function selectPayMethod(method){
  selectedPayMethod = method;
  document.querySelectorAll('.pay-method').forEach(m => m.classList.toggle('active', m.dataset.method === method));
  document.querySelectorAll('.pay-form').forEach(f => f.classList.remove('active'));
  document.getElementById('form-' + method)?.classList.add('active');
}
function selectUpiApp(app){
  selectedUpiApp = app;
  document.querySelectorAll('.upi-app').forEach(a => a.classList.toggle('active', a.dataset.upi === app));
}

function formatCardNumber(el){
  let v = el.value.replace(/\D/g, '').substring(0, 19);
  v = v.replace(/(.{4})/g, '$1 ').trim();
  el.value = v;
  const brand = document.getElementById('cardBrand');
  const first = v.replace(/\s/g,'').charAt(0);
  if(first === '4') brand.innerHTML = '<i class="fab fa-cc-visa" style="color:#1A1F71"></i>';
  else if(first === '5' || first === '2') brand.innerHTML = '<i class="fab fa-cc-mastercard" style="color:#EB001B"></i>';
  else if(first === '3') brand.innerHTML = '<i class="fab fa-cc-amex" style="color:#2E77BC"></i>';
  else if(first === '6') brand.innerHTML = '<i class="fab fa-cc-discover" style="color:#F27712"></i>';
  else brand.innerHTML = '<i class="far fa-credit-card"></i>';
}
function formatExpiry(el){
  let v = el.value.replace(/\D/g, '').substring(0, 4);
  if(v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
  el.value = v;
}

async function processPayment(){
  const u = Auth.current();
  if(!u) return go('auth','login');

  if(!document.getElementById('agreeTerms').checked) return toast('Please accept the Terms of Service to continue.','err');

  const billName = document.getElementById('billName').value.trim();
  const billEmail = document.getElementById('billEmail').value.trim();
  const billCountry = document.getElementById('billCountry').value;
  const billZip = document.getElementById('billZip').value.trim();
  if(!billName) return toast('Please enter your billing name.','err');
  if(!billEmail || !/^\S+@\S+\.\S+$/.test(billEmail)) return toast('Please enter a valid email address.','err');
  if(!billZip) return toast('Please enter your postal code.','err');

  if(selectedPayMethod === 'card'){
    const num = document.getElementById('cardNumber').value.replace(/\s/g,'');
    const cardName = document.getElementById('cardName').value.trim();
    const exp = document.getElementById('cardExpiry').value;
    const cvv = document.getElementById('cardCvv').value;
    if(num.length < 15 || num.length > 16) return toast('Please enter a valid card number.','err');
    if(!cardName) return toast('Please enter the cardholder name.','err');
    if(!/^\d{2}\/\d{2}$/.test(exp)) return toast('Please enter expiry as MM/YY.','err');
    if(cvv.length < 3) return toast('Please enter a valid CVV.','err');
  } else if(selectedPayMethod === 'upi'){
    const upiId = document.getElementById('upiId').value.trim();
    if(!upiId || !upiId.includes('@')) return toast('Please enter a valid UPI ID (name@bank).','err');
  } else if(selectedPayMethod === 'paypal'){
    const ppEmail = document.getElementById('paypalEmail').value.trim();
    if(!ppEmail || !/^\S+@\S+\.\S+$/.test(ppEmail)) return toast('Please enter a valid PayPal email.','err');
  }

  const btn = document.getElementById('payNowBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="pay-spinner"></span> Processing payment...';

  await new Promise(res => setTimeout(res, 2200));

  const info = PLAN_INFO[checkoutPlan];
  const tax = Math.round(info.monthly * 0.18);
  const total = info.monthly + tax;
  const txnId = 'PM-' + Date.now().toString(36).toUpperCase().slice(-8);
  const methodLabel = selectedPayMethod === 'card' ? 'Card' : selectedPayMethod === 'upi' ? `UPI · ${selectedUpiApp.toUpperCase()}` : 'PayPal';

  Store.setSub(u.id, { plan:checkoutPlan, startedAt:now(), renewsAt:new Date(Date.now() + 30*24*60*60*1000).toISOString(), method:methodLabel, txnId, amount:total });
  Auth.update({ plan:checkoutPlan, verified: true });

  Store.addTx({ id:uid('t_'), userId:u.id, type:'debit', amount:total, description:`${info.name} subscription (${methodLabel})`, ts:now(), status:'completed' });

  Store.addNotif(u.id, `🎉 Subscription activated: ${info.name}`, 'green');
  Mailer.notifyPayment(u, checkoutPlan, { id:txnId, total, method:methodLabel });

  btn.disabled = false;
  btn.innerHTML = orig;
  document.getElementById('checkoutMain').style.display = 'none';
  document.getElementById('checkoutSuccess').style.display = '';
  document.getElementById('receiptId').textContent = 'Receipt: #' + txnId;
  toast('🎉 Payment successful! Welcome to ' + info.name + '.','ok');

  refreshNav();
}

function downloadReceipt(){
  const u = Auth.current(); if(!u) return;
  const sub = Store.getSub(u.id);
  if(!sub) return toast('No subscription found.','err');
  const info = PLAN_INFO[sub.plan] || PLAN_INFO.pro;
  const tax = Math.round(info.monthly * 0.18);
  const lines = [
    '==============================',
    '  PROMOLY — PAYMENT RECEIPT',
    '==============================',
    'Receipt ID: ' + sub.txnId,
    'Date: ' + new Date(sub.startedAt).toLocaleString(),
    '',
    'Customer: ' + u.name,
    'Email: ' + u.email,
    'User ID: ' + u.id,
    '',
    'Plan: ' + info.name,
    'Billing: Monthly',
    'Payment Method: ' + sub.method,
    '',
    'Subtotal: ' + fmtMoney(info.monthly),
    'GST (18%): ' + fmtMoney(tax),
    'Total Paid: ' + fmtMoney(sub.amount),
    '',
    'Renews on: ' + new Date(sub.renewsAt).toLocaleDateString(),
    '',
    'Thank you for choosing PROMOLY!',
    '=============================='
  ].join('\n');
  const blob = new Blob([lines], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `promoly-receipt-${sub.txnId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📄 Receipt downloaded','ok');
}

/* ==================================================================
   DELETE APPLICATION
   ================================================================== */
function deleteApplication(appId){
  const u = Auth.current();
  if(!u || u.role !== 'creator') return toast('Only creators can delete applications.','err');
  const app = Store.getApp(appId);
  if(!app) return;
  if(app.creatorId !== u.id) return toast('You can only delete your own applications.','err');
  if(app.status === 'accepted') return toast('Cannot delete accepted applications. Contact the brand first.','err');
  if(app.status === 'completed') return toast('Cannot delete completed applications.','err');

  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-triangle-exclamation" style="color:var(--red);margin-right:8px"></i>Delete application?';
  const c = Store.getCampaign(app.campaignId);
  document.getElementById('modalBody').innerHTML = `
    <div class="panel" style="background:var(--red-dim);border-color:rgba(255,93,93,.3);padding:16px">
      <p style="font-size:13.5px;line-height:1.6;color:var(--text)"><i class="fas fa-exclamation-triangle" style="color:var(--red);margin-right:6px"></i> This action is permanent. Your application to <strong>${esc(c?.title||'this campaign')}</strong> will be removed and the brand will no longer see your submission.</p>
    </div>
    <p class="text-muted" style="font-size:13px;line-height:1.6;margin-top:14px">You'll need to reapply if you change your mind.</p>`;
  document.getElementById('modalFoot').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-red" onclick="confirmDeleteApplication('${appId}')"><i class="fas fa-trash"></i> Yes, delete</button>`;
  document.getElementById('modalBg').classList.add('open');
}
function confirmDeleteApplication(appId){
  const app = Store.getApp(appId);
  if(!app) return closeModal();
  const campaignTitle = Store.getCampaign(app.campaignId)?.title || 'campaign';

  const row = document.querySelector(`.list-row[data-app-id="${appId}"]`);
  if(row){
    row.classList.add('deleting');
  }

  Store.deleteApp(appId);
  Store.addNotif(Auth.current().id, `Application to "${campaignTitle}" was deleted`, 'amber');

  closeModal();

  setTimeout(() => {
    renderDashApplications();
    toast('Application deleted.','info');
  }, 400);
}

/* DASHBOARD */
function renderDashboard(){
  const u = Auth.current(); if(!u) return;
  document.getElementById('dashEyebrow').textContent = u.role.toUpperCase() + ' DASHBOARD';
  document.getElementById('dashTitle').textContent = 'Welcome back, ' + u.name.split(' ')[0];
  const btn = document.getElementById('dashPrimaryAction');
  btn.innerHTML = u.role === 'brand' ? '<i class="fas fa-plus"></i> Post Campaign' : '<i class="fas fa-magnifying-glass"></i> Browse Campaigns';
  btn.onclick = u.role === 'brand' ? openNewCampaign : () => go('campaigns');
  const unread = Store.unreadCount(u.id);
  const badge = document.getElementById('unreadBadge');
  badge.style.display = unread ? '' : 'none';
  badge.textContent = unread;
  renderDashOverview(); renderDashCampaigns(); renderDashApplications(); renderDashMessages();
  renderDashWallet(); renderDashTransactions(); renderDashProfile(); renderDashReviews(); renderDashNotifications();
  observeAll();
}
function switchDashPanel(name, btn){
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.querySelectorAll('.dash-side button').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  observeAll();
}
function renderDashOverview(){
  const u = Auth.current();
  const el = document.getElementById('panel-overview');
  const isCreator = u.role === 'creator';
  const apps = isCreator ? Store.appsForCreator(u.id) : Store.appsForBrand(u.id);
  const myCampaigns = isCreator ? [] : Store.campaigns().filter(c => c.brandId === u.id);
  const activeApps = apps.filter(a => ['accepted','shortlisted'].includes(a.status)).length;
  const txs = Store.txsFor(u.id);
  const earned = txs.filter(t => t.type === 'credit').reduce((s,t) => s+t.amount, 0);
  const spent = txs.filter(t => t.type === 'debit').reduce((s,t) => s+t.amount, 0);
  const reviews = Store.reviewsFor(u.id);
  const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '—';
  const currentPlan = u.plan || 'free';
  const planLabel = currentPlan === 'free' ? 'Free' : currentPlan === 'pro' ? 'Pro' : 'Business';
  const planColor = currentPlan === 'free' ? 'gray' : currentPlan === 'pro' ? 'amber' : 'purple';
  el.innerHTML = `
    <div class="stat-grid stagger">
      <div class="stat-card"><i class="fas fa-bullhorn sc-icon"></i><div class="sc-num amber">${isCreator ? apps.length : myCampaigns.length}</div><div class="sc-lbl">${isCreator ? 'Applications' : 'Campaigns'}</div></div>
      <div class="stat-card"><i class="fas fa-circle-check sc-icon"></i><div class="sc-num cyan">${isCreator ? activeApps : myCampaigns.filter(c=>c.status==='open').length}</div><div class="sc-lbl">${isCreator ? 'Active' : 'Open'}</div></div>
      <div class="stat-card"><i class="fas fa-wallet sc-icon"></i><div class="sc-num green">${fmtMoney(isCreator ? earned : spent)}</div><div class="sc-lbl">${isCreator ? 'Earned' : 'Spent'}</div></div>
      <div class="stat-card"><i class="fas fa-star sc-icon"></i><div class="sc-num purple">${avg}</div><div class="sc-lbl">Rating (${reviews.length})</div></div>
    </div>
    ${currentPlan === 'free' ? `
      <div class="panel" style="background:linear-gradient(135deg,rgba(255,176,32,.15),rgba(167,139,250,.08));border-color:rgba(255,176,32,.4);position:relative;overflow:hidden">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:radial-gradient(circle,rgba(255,176,32,.15),transparent 70%);pointer-events:none"></div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;position:relative">
          <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--amber),#FFD700);display:flex;align-items:center;justify-content:center;font-size:24px;color:#14100a;flex-shrink:0"><i class="fas fa-crown"></i></div>
          <div style="flex:1;min-width:220px">
            <div class="flex items-center gap-8" style="margin-bottom:4px"><h4 style="font-family:var(--font-display);font-size:15px;font-weight:700">You're on the Free plan</h4><span class="pill gray">FREE</span></div>
            <p class="text-muted" style="font-size:13px;line-height:1.5">Upgrade to unlock <strong style="color:var(--amber)">unlimited applications</strong>, escrow payments, digital contracts, and advanced analytics.</p>
          </div>
          <button class="btn" onclick="startCheckout('pro')"><i class="fas fa-crown"></i> Upgrade to Pro</button>
        </div>
      </div>
    ` : `
      <div class="panel" style="background:linear-gradient(135deg,rgba(62,207,142,.12),rgba(67,217,255,.06));border-color:rgba(62,207,142,.35)">
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
          <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--green),#6EE7B7);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;flex-shrink:0"><i class="fas fa-crown"></i></div>
          <div style="flex:1;min-width:200px">
            <div class="flex items-center gap-8" style="margin-bottom:4px"><h4 style="font-family:var(--font-display);font-size:15px;font-weight:700">You're on ${planLabel}</h4><span class="pill green">ACTIVE</span></div>
            <p class="text-muted" style="font-size:13px;line-height:1.5">All premium features unlocked. Thank you for supporting PROMOLY! 💚</p>
          </div>
        </div>
      </div>
    `}
    <div class="panel" style="background:linear-gradient(135deg,rgba(167,139,250,.12),rgba(67,217,255,.08));border-color:rgba(167,139,250,.3)">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#A78BFA,#43D9FF);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;flex-shrink:0"><i class="fas fa-robot"></i></div>
        <div style="flex:1;min-width:200px"><h4 style="font-family:var(--font-display);font-size:15px;font-weight:700;margin-bottom:4px">Ask ZeGod AI</h4><p class="text-muted" style="font-size:13px;line-height:1.5">Get personalised ${isCreator ? 'campaign suggestions' : 'creator recommendations'} based on your profile.</p></div>
        <button class="btn btn-purple btn-sm" onclick="openZeGod()"><i class="fas fa-comment-dots"></i> Chat Now</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3><i class="fas fa-bolt"></i> Quick Actions</h3></div>
      <div class="grid-2" style="gap:12px">
        <button class="btn btn-ghost btn-block" onclick="${isCreator ? "go('campaigns')" : 'openNewCampaign()'}"><i class="fas fa-${isCreator?'magnifying-glass':'plus'}"></i> ${isCreator ? 'Browse Campaigns' : 'Post Campaign'}</button>
        <button class="btn btn-ghost btn-block" onclick="openZeGod()"><i class="fas fa-robot"></i> Ask ZeGod</button>
        <button class="btn btn-ghost btn-block" onclick="switchDashPanel('wallet',document.querySelectorAll('.dash-side button')[4])"><i class="fas fa-wallet"></i> Wallet</button>
        <button class="btn btn-ghost btn-block" onclick="openProfileEditor()"><i class="fas fa-user-edit"></i> Edit Profile</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3><i class="fas fa-clock"></i> Recent Activity</h3></div>
      <div id="recentActivity"></div>
    </div>`;
  const notifs = Store.notifsFor(u.id).slice(0,5);
  const act = document.getElementById('recentActivity');
  const iconMap = { amber:'star', cyan:'bolt', green:'check' };
  act.innerHTML = notifs.length ? notifs.map(n => `<div class="list-row"><div class="lr-icon ${n.icon}"><i class="fas fa-${iconMap[n.icon]||'bell'}"></i></div><div class="lr-info"><h4 style="font-weight:500">${esc(n.text)}</h4><p>${timeAgo(n.ts)}</p></div></div>`).join('') : '<div class="empty"><i class="fas fa-bell-slash"></i><p>No recent activity</p></div>';
}
function renderDashCampaigns(){
  const u = Auth.current();
  const el = document.getElementById('panel-campaigns');
  if(u.role === 'creator'){
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-bullhorn"></i> Recommended Campaigns</h3><button class="btn btn-sm btn-ghost" onclick="go('campaigns')">Browse All</button></div><div id="recCampaigns"></div></div>`;
    const recs = Store.campaigns().filter(c => c.status === 'open').slice(0,4);
    document.getElementById('recCampaigns').innerHTML = recs.length ? recs.map(c => `<div class="list-row" style="cursor:pointer" onclick="openCampaignDetail('${c.id}')"><div class="lr-icon amber"><i class="fas fa-bullhorn"></i></div><div class="lr-info"><h4>${esc(c.title)}</h4><p>${esc(c.brandName)} · ${esc(c.category)} · ${esc(c.platform)}</p></div><div class="lr-value">${fmtMoney(c.budget)}</div></div>`).join('') : '<div class="empty"><i class="fas fa-inbox"></i><p>No open campaigns yet.</p></div>';
  } else {
    const camps = Store.campaigns().filter(c => c.brandId === u.id);
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-bullhorn"></i> My Campaigns (${camps.length})</h3><button class="btn btn-sm" onclick="openNewCampaign()"><i class="fas fa-plus"></i> New</button></div>
      ${camps.length ? camps.map(c => { const apps = Store.appsForCampaign(c.id); return `<div class="list-row"><div class="lr-icon cyan"><i class="fas fa-bullhorn"></i></div><div class="lr-info"><h4>${esc(c.title)}</h4><p>${esc(c.category)} · ${esc(c.platform)} · ${apps.length} applicants · ${fmtDate(c.deadline)}</p></div><div class="lr-value">${fmtMoney(c.budget)}</div><div class="lr-actions"><button class="btn btn-sm btn-ghost" onclick="openCampaignApplicants('${c.id}')"><i class="fas fa-users"></i> Applicants</button></div></div>`; }).join('') : '<div class="empty"><i class="fas fa-inbox"></i><p>No campaigns yet.</p><button class="btn" onclick="openNewCampaign()"><i class="fas fa-plus"></i> Post Your First Campaign</button></div>'}
    </div>`;
  }
}

function renderDashApplications(){
  const u = Auth.current();
  const el = document.getElementById('panel-applications');
  if(u.role === 'creator'){
    const apps = Store.appsForCreator(u.id);
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-file-signature"></i> My Applications (${apps.length})</h3></div>
      ${apps.length ? apps.map(a => {
        const c = Store.getCampaign(a.campaignId); if(!c) return '';
        const statusPill = { pending:'amber', shortlisted:'cyan', accepted:'green', declined:'red', completed:'purple' }[a.status] || 'gray';
        const milestone = a.milestones?.length ? Math.round(a.milestones.filter(m=>m.done).length/a.milestones.length*100) : 0;
        const canDelete = !['accepted','completed'].includes(a.status);
        return `<div class="list-row" data-app-id="${a.id}" style="flex-direction:column;align-items:stretch">
          <div class="flex items-center gap-14" style="flex-wrap:wrap">
            <div class="lr-icon amber"><i class="fas fa-file-signature"></i></div>
            <div class="lr-info" style="min-width:200px"><h4>${esc(c.title)}</h4><p>${esc(c.brandName)} · Applied ${fmtDate(a.createdAt)} · ${fmtMoney(a.rate)}</p></div>
            <span class="pill ${statusPill}">${a.status}</span>
          </div>
          ${a.milestones?.length ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><div class="flex justify-between items-center mb-8"><span class="text-muted" style="font-size:11.5px">Milestones</span><span class="text-muted" style="font-size:11px;font-family:var(--font-mono)">${milestone}%</span></div><div class="progress"><div class="progress-bar" style="width:${milestone}%"></div></div><div class="flex gap-8 flex-wrap mt-16">${a.milestones.map((m,i) => `<button class="btn btn-sm ${m.done?'btn-green':'btn-ghost'}" onclick="toggleMilestone('${a.id}',${i})"><i class="fas fa-${m.done?'check':'circle'}"></i> ${esc(m.name)}</button>`).join('')}</div></div>` : ''}
          <div class="flex gap-8 flex-wrap mt-16">
            <button class="btn btn-sm btn-ghost" onclick="openThread('${c.brandId}')"><i class="fas fa-comments"></i> Message Brand</button>
            ${a.status === 'accepted' ? `<button class="btn btn-sm btn-ghost" onclick="openContract('${a.id}')"><i class="fas fa-file-signature"></i> Contract</button>` : ''}
            ${canDelete ? `<button class="btn-delete" onclick="deleteApplication('${a.id}')" title="Delete this application"><i class="fas fa-trash"></i> Delete</button>` : ''}
          </div>
        </div>`;
      }).join('') : '<div class="empty"><i class="fas fa-inbox"></i><p>No applications yet.</p><button class="btn" onclick="go(\'campaigns\')"><i class="fas fa-magnifying-glass"></i> Browse Campaigns</button></div>'}
    </div>`;
  } else {
    const apps = Store.appsForBrand(u.id);
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-users"></i> Applications Received (${apps.length})</h3></div>
      ${apps.length ? apps.map(a => {
        const c = Store.getCampaign(a.campaignId);
        const statusPill = { pending:'amber', shortlisted:'cyan', accepted:'green', declined:'red' }[a.status] || 'gray';
        return `<div class="list-row"><div class="lr-icon purple"><i class="fas fa-user"></i></div><div class="lr-info"><h4>${esc(a.creatorName)} <span class="text-muted" style="font-weight:400;font-size:11px">· ${esc(c?.title||'—')}</span></h4><p>${esc(a.pitch.slice(0,70))}${a.pitch.length>70?'...':''} · ${fmtMoney(a.rate)}</p></div><span class="pill ${statusPill}">${a.status}</span><div class="lr-actions">${a.status==='pending' ? `<button class="btn btn-sm btn-green" onclick="acceptApp('${a.id}','${a.campaignId}');renderDashboard()"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-ghost" onclick="declineApp('${a.id}','${a.campaignId}');renderDashboard()"><i class="fas fa-times"></i></button>` : ''}<button class="btn btn-sm btn-ghost" onclick="openThread('${a.creatorId}')"><i class="fas fa-comments"></i></button></div></div>`;
      }).join('') : '<div class="empty"><i class="fas fa-inbox"></i><p>No applications yet.</p></div>'}
    </div>`;
  }
}
function renderDashMessages(){
  const u = Auth.current();
  const el = document.getElementById('panel-messages');
  const threads = Store.threadsFor(u.id);
  el.innerHTML = `<div class="panel" style="padding:0;overflow:hidden"><div class="panel-head" style="padding:18px 22px;margin:0"><h3><i class="fas fa-comments"></i> Messages</h3></div>
    ${threads.length ? `<div>${threads.map(t => `<div class="list-row" style="border-radius:0;border-left:0;border-right:0;border-top:0;cursor:pointer" onclick="openThread('${t.partnerId}')"><div class="lr-icon amber">${t.partner.avatar ? `<img src="${t.partner.avatar}" class="av-img" style="border-radius:10px"/>` : '<i class="fas fa-user"></i>'}</div><div class="lr-info"><h4>${esc(t.partner.name)} ${t.unread ? `<span class="pill red" style="margin-left:6px;font-size:9px">${t.unread} new</span>` : ''}</h4><p>${esc(t.last?.text.slice(0,60) || '')}${(t.last?.text.length||0)>60?'...':''}</p></div><div class="text-muted" style="font-size:11px;font-family:var(--font-mono)">${t.last ? timeAgo(t.last.ts) : ''}</div></div>`).join('')}</div>` : '<div class="empty"><i class="fas fa-comments"></i><p>No conversations yet.</p></div>'}
  </div>`;
}
function renderDashWallet(){
  const u = Auth.current();
  const el = document.getElementById('panel-wallet');
  const txs = Store.txsFor(u.id);
  const credits = txs.filter(t => t.type === 'credit').reduce((s,t) => s+t.amount, 0);
  const debits = txs.filter(t => t.type === 'debit').reduce((s,t) => s+t.amount, 0);
  const balance = (u.wallet || 0) + credits - debits;
  el.innerHTML = `<div class="stat-grid stagger">
    <div class="stat-card"><i class="fas fa-wallet sc-icon"></i><div class="sc-num amber">${fmtMoney(balance)}</div><div class="sc-lbl">Available Balance</div></div>
    <div class="stat-card"><i class="fas fa-arrow-down sc-icon"></i><div class="sc-num green">${fmtMoney(credits)}</div><div class="sc-lbl">Total Received</div></div>
    <div class="stat-card"><i class="fas fa-arrow-up sc-icon"></i><div class="sc-num cyan">${fmtMoney(debits)}</div><div class="sc-lbl">Total Spent</div></div>
    <div class="stat-card"><i class="fas fa-lock sc-icon"></i><div class="sc-num purple">${fmtMoney(u.role==='brand'?(u.wallet||0):0)}</div><div class="sc-lbl">In Escrow</div></div>
  </div>
  <div class="panel"><div class="panel-head"><h3><i class="fas fa-plus-circle"></i> Add Funds</h3></div><div class="flex gap-8 flex-wrap"><button class="btn btn-sm" onclick="addFunds(50000)">+ ₹50,000</button><button class="btn btn-sm" onclick="addFunds(100000)">+ ₹1,00,000</button><button class="btn btn-sm" onclick="addFunds(500000)">+ ₹5,00,000</button></div><p class="text-muted mt-16" style="font-size:12px"><i class="fas fa-circle-info"></i> Demo wallet. In production connects to Razorpay/Stripe.</p></div>
  <div class="panel"><div class="panel-head"><h3><i class="fas fa-exchange-alt"></i> Withdraw</h3></div><div class="flex gap-8" style="align-items:flex-end;flex-wrap:wrap"><div class="form-group" style="flex:1;min-width:140px;margin:0"><label>Amount (₹)</label><input id="withdrawAmt" type="number" placeholder="5000"/></div><button class="btn" onclick="withdrawFunds()"><i class="fas fa-arrow-up"></i> Withdraw</button></div></div>`;
}
function addFunds(amount){
  const u = Auth.current();
  Auth.update({ wallet: (u.wallet || 0) + amount });
  Store.addTx({ id:uid('t_'), userId:u.id, type:'credit', amount, description:'Wallet top-up', ts:now(), status:'completed' });
  toast(`Added ${fmtMoney(amount)}`,'ok');
  renderDashboard();
}
function withdrawFunds(){
  const u = Auth.current();
  const amt = Number(document.getElementById('withdrawAmt').value);
  if(!amt || amt <= 0) return toast('Enter a valid amount','err');
  const txs = Store.txsFor(u.id);
  const credits = txs.filter(t => t.type === 'credit').reduce((s,t) => s+t.amount, 0);
  const debits = txs.filter(t => t.type === 'debit').reduce((s,t) => s+t.amount, 0);
  const balance = (u.wallet || 0) + credits - debits;
  if(amt > balance) return toast('Insufficient balance','err');
  Store.addTx({ id:uid('t_'), userId:u.id, type:'debit', amount:amt, description:'Withdrawal to bank', ts:now(), status:'completed' });
  toast(`Withdrawal of ${fmtMoney(amt)} initiated`,'ok');
  renderDashboard();
}
function renderDashTransactions(){
  const u = Auth.current();
  const el = document.getElementById('panel-transactions');
  const txs = Store.txsFor(u.id);
  el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-receipt"></i> Transactions (${txs.length})</h3></div>
    ${txs.length ? `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:left;border-bottom:1px solid var(--border)"><th style="padding:10px 6px;color:var(--muted);font-size:11px;text-transform:uppercase">Date</th><th style="padding:10px 6px;color:var(--muted);font-size:11px;text-transform:uppercase">Description</th><th style="padding:10px 6px;color:var(--muted);font-size:11px;text-transform:uppercase">Status</th><th style="padding:10px 6px;color:var(--muted);font-size:11px;text-transform:uppercase;text-align:right">Amount</th></tr></thead><tbody>${txs.map(t => `<tr style="border-bottom:1px solid var(--border)"><td style="padding:12px 6px;font-family:var(--font-mono);font-size:11.5px;color:var(--muted)">${fmtDate(t.ts)}</td><td style="padding:12px 6px">${esc(t.description)}</td><td style="padding:12px 6px"><span class="pill ${t.status==='completed'?'green':'amber'}">${t.status}</span></td><td style="padding:12px 6px;text-align:right;font-family:var(--font-display);font-weight:600;color:${t.type==='credit'?'var(--green)':'var(--red)'}">${t.type==='credit'?'+':'-'} ${fmtMoney(t.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><i class="fas fa-receipt"></i><p>No transactions yet.</p></div>'}
  </div>`;
}
function renderDashProfile(){
  const u = Auth.current();
  const el = document.getElementById('panel-profile');
  const isCreator = u.role === 'creator';
  const avInner = u.avatar ? `<img src="${u.avatar}" class="av-img" alt="avatar"/>` : esc(u.name.charAt(0));
  const currentPlan = u.plan || 'free';
  const planLabel = currentPlan === 'free' ? 'Free' : currentPlan === 'pro' ? 'Pro' : 'Business';
  el.innerHTML = `<div class="panel">
    <div class="panel-head"><h3><i class="fas fa-id-card"></i> Profile</h3><div class="flex gap-8"><button class="btn btn-sm" onclick="openProfileEditor()"><i class="fas fa-user-edit"></i> Edit</button><button class="btn btn-sm btn-red" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Log Out</button></div></div>
    <div class="flex gap-16 mb-24" style="align-items:center;flex-wrap:wrap">
      <div class="mk-avatar" style="width:72px;height:72px;font-size:28px;margin:0">${avInner}</div>
      <div><div class="flex items-center gap-8"><h3 style="font-family:var(--font-display);font-size:22px">${esc(u.name)}</h3>${u.verified?'<i class="fas fa-circle-check" style="color:var(--cyan);font-size:14px"></i>':''}</div><div class="text-muted" style="font-size:13px;font-family:var(--font-mono)">${esc(u.email)}</div><div class="flex gap-8" style="margin-top:6px"><span class="pill ${isCreator?'amber':'cyan'}">${u.role.toUpperCase()}</span><span class="pill ${currentPlan==='free'?'gray':currentPlan==='pro'?'amber':'purple'}">${planLabel.toUpperCase()}</span></div></div>
    </div>
    <div class="grid-2" style="gap:14px">
      ${isCreator ? `
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Niche</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.niche||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Followers</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.followers||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Platform</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.platform||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Rate</div><div style="font-size:14px;font-weight:500;color:var(--amber)">${esc(u.profile?.rate||'—')}</div></div>
      ` : `
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Company</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.company||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Industry</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.industry||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Website</div><div style="font-size:14px;font-weight:500">${esc(u.profile?.website||'—')}</div></div>
        <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Budget</div><div style="font-size:14px;font-weight:500;color:var(--cyan)">${esc(u.profile?.budget||'—')}</div></div>
      `}
      <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Member Since</div><div style="font-size:14px;font-weight:500">${fmtDate(u.joined)}</div></div>
    </div>
    ${currentPlan === 'free' ? `<div style="margin-top:22px;padding-top:20px;border-top:1px solid var(--border)"><div class="panel" style="background:linear-gradient(135deg,var(--amber-dim),rgba(167,139,250,.08));border-color:rgba(255,176,32,.3);margin:0"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><h4 style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:4px">Upgrade your plan</h4><p class="text-muted" style="font-size:12.5px">Unlock escrow, contracts, and unlimited applications.</p></div><button class="btn btn-sm" onclick="startCheckout('pro')"><i class="fas fa-crown"></i> Upgrade</button></div></div></div>` : ''}
    <div style="margin-top:22px;padding-top:20px;border-top:1px solid var(--border)">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="restartTutorial()"><i class="fas fa-graduation-cap"></i> Restart Tutorial</button>
        <button class="btn btn-ghost btn-sm" onclick="openZeGod()"><i class="fas fa-robot"></i> Ask ZeGod</button>
        <button class="btn btn-ghost btn-sm" onclick="go('pricing')"><i class="fas fa-crown"></i> Manage Plan</button>
        <button class="btn btn-ghost btn-sm" onclick="go('contact')"><i class="fas fa-envelope"></i> Contact Support</button>
      </div>
    </div>
  </div>`;
}
function openProfileEditor(){
  const u = Auth.current(); if(!u) return;
  const isCreator = u.role === 'creator';
  pendingAvatar = null;
  const nicheOptions = ['Fitness','Tech','Beauty','Fashion','Food','Travel','Gaming','Lifestyle','Finance','Education','Entertainment','Sports','Music','Art','Photography','Health','Business','Automotive','Parenting','Other'];
  const platformOptions = ['Instagram','YouTube','TikTok','Twitter','LinkedIn','Twitch','Facebook','Snapchat','Pinterest','Blog','Podcast','Newsletter','Other'];
  const industryOptions = ['Fitness','Tech','Beauty','Fashion','Food & Beverage','Travel','Gaming','Lifestyle','Finance','Education','Entertainment','Sports','Health & Wellness','E-commerce','SaaS','Automotive','Real Estate','Other'];
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit" style="color:var(--amber);margin-right:8px"></i>Edit Profile';
  document.getElementById('modalBody').innerHTML = `
    <div class="avatar-editor">
      <div class="avatar-preview" id="avatarPreview" onclick="document.getElementById('avatarUpload').click()" title="Click to change">
        ${u.avatar ? `<img src="${u.avatar}" alt="avatar"/>` : `<span>${esc(u.name.charAt(0).toUpperCase())}</span>`}
        <div class="edit-overlay"><i class="fas fa-camera"></i></div>
      </div>
      <div class="avatar-actions">
        <label for="avatarUpload"><i class="fas fa-upload"></i> Upload<input type="file" id="avatarUpload" accept="image/*" onchange="handleAvatarUpload(event)"/></label>
        <label for="avatarCamera"><i class="fas fa-camera"></i> Take Photo<input type="file" id="avatarCamera" accept="image/*" capture="user" onchange="handleAvatarUpload(event)"/></label>
        <button type="button" class="btn-remove" onclick="removeAvatar()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="avatar-hint">JPG or PNG · Max 2MB · Auto-cropped to square</div>
    </div>
    <div class="form-group"><label>Full name</label><input id="peName" value="${esc(u.name)}"/></div>
    ${isCreator ? `
      <div class="grid-2" style="gap:12px">
        <div class="form-group"><label>Niche</label><select id="peNiche">${nicheOptions.map(n => `<option ${u.profile?.niche===n?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="form-group"><label>Followers</label><input id="peFollowers" value="${esc(u.profile?.followers||'')}"/></div>
        <div class="form-group"><label>Platform</label><select id="pePlatform">${platformOptions.map(p => `<option ${u.profile?.platform===p?'selected':''}>${p}</option>`).join('')}</select></div>
        <div class="form-group"><label>Rate</label><input id="peRate" value="${esc(u.profile?.rate||'')}"/></div>
        <div class="form-group"><label>Location</label><input id="peLocation" value="${esc(u.profile?.location||'')}"/></div>
      </div>
      <div class="form-group"><label>Bio / About</label><textarea id="peBio" placeholder="Tell brands about yourself...">${esc(u.profile?.bio||'')}</textarea></div>
    ` : `
      <div class="grid-2" style="gap:12px">
        <div class="form-group"><label>Company</label><input id="peCompany" value="${esc(u.profile?.company||'')}"/></div>
        <div class="form-group"><label>Industry</label><select id="peIndustry">${industryOptions.map(n => `<option ${u.profile?.industry===n?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="form-group"><label>Website</label><input id="peWebsite" value="${esc(u.profile?.website||'')}"/></div>
        <div class="form-group"><label>Typical budget</label><input id="peBudget" value="${esc(u.profile?.budget||'')}"/></div>
      </div>
      <div class="form-group"><label>About the brand</label><textarea id="peAbout" placeholder="Tell creators about your brand...">${esc(u.profile?.about||'')}</textarea></div>
    `}
    <div class="flex items-center gap-8" style="padding:12px;background:var(--surface-2);border-radius:8px;margin-top:8px">
      <input type="checkbox" id="peVerified" ${u.verified?'checked':''} style="width:auto"/>
      <label for="peVerified" class="text-muted" style="font-size:13px;margin:0">Request verification badge</label>
    </div>`;
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveProfile()"><i class="fas fa-floppy-disk"></i> Save Changes</button>`;
  document.getElementById('modalBg').classList.add('open');
  setTimeout(renderAvatarPreview, 30);
}
let pendingAvatar = null;
function handleAvatarUpload(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ toast('Please select an image.','err'); e.target.value=''; return; }
  if(file.size > 2 * 1024 * 1024){ toast('Image too large. Max 2MB.','err'); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 320;
      const canvas = document.createElement('canvas');
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      try { pendingAvatar = canvas.toDataURL('image/jpeg', 0.85); } catch { pendingAvatar = ev.target.result; }
      renderAvatarPreview();
      toast('📸 Photo ready. Save to apply.','ok');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}
function removeAvatar(){ pendingAvatar = ''; renderAvatarPreview(); toast('Photo removed. Save to apply.','info'); }
function renderAvatarPreview(){
  const el = document.getElementById('avatarPreview'); if(!el) return;
  const u = Auth.current();
  const src = pendingAvatar !== null ? pendingAvatar : (u?.avatar || '');
  if(src) el.innerHTML = `<img src="${src}" alt="avatar"/><div class="edit-overlay"><i class="fas fa-camera"></i></div>`;
  else el.innerHTML = `<span>${(u?.name||'U').charAt(0).toUpperCase()}</span><div class="edit-overlay"><i class="fas fa-camera"></i></div>`;
}
function saveProfile(){
  const u = Auth.current();
  const isCreator = u.role === 'creator';
  const name = document.getElementById('peName').value.trim() || u.name;
  let profile = { ...u.profile };
  if(isCreator){
    profile.niche = document.getElementById('peNiche').value;
    profile.followers = document.getElementById('peFollowers').value.trim();
    profile.platform = document.getElementById('pePlatform').value;
    profile.rate = document.getElementById('peRate').value.trim();
    profile.location = document.getElementById('peLocation').value.trim();
    profile.bio = document.getElementById('peBio').value.trim();
  } else {
    profile.company = document.getElementById('peCompany').value.trim();
    profile.industry = document.getElementById('peIndustry').value;
    profile.website = document.getElementById('peWebsite').value.trim();
    profile.budget = document.getElementById('peBudget').value.trim();
    profile.about = document.getElementById('peAbout').value.trim();
  }
  const verified = document.getElementById('peVerified').checked;
  const patch = { name, profile, verified };
  if(pendingAvatar !== null) patch.avatar = pendingAvatar === '' ? null : pendingAvatar;
  Auth.update(patch);
  toast('✅ Profile updated!','ok');
  closeModal();
  refreshNav();
  if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}
function renderDashReviews(){
  const u = Auth.current();
  const el = document.getElementById('panel-reviews');
  const reviews = Store.reviewsFor(u.id);
  const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '—';
  el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-star"></i> Reviews (${reviews.length})</h3><span class="pill amber">${avg} avg</span></div>
    ${reviews.length ? reviews.map(r => `<div class="list-row" style="flex-direction:column;align-items:stretch"><div class="flex items-center gap-12"><div class="mk-avatar" style="width:40px;height:40px;font-size:16px;margin:0">${esc(r.fromName.charAt(0))}</div><div class="lr-info"><h4>${esc(r.fromName)}</h4><p>${fmtDate(r.ts)}</p></div><div class="stars-display">${stars(r.rating)}</div></div><p class="text-muted" style="font-size:13.5px;line-height:1.6;margin-top:10px">${esc(r.comment)}</p></div>`).join('') : '<div class="empty"><i class="fas fa-star"></i><p>No reviews yet.</p></div>'}
  </div>`;
}
function renderDashNotifications(){
  const u = Auth.current();
  const el = document.getElementById('panel-notifications');
  const notifs = Store.notifsFor(u.id);
  const iconMap = { amber:'star', cyan:'bolt', green:'check' };
  el.innerHTML = `<div class="panel"><div class="panel-head"><h3><i class="fas fa-bell"></i> Notifications (${notifs.length})</h3><button class="btn btn-sm btn-ghost" onclick="clearAllNotifs()"><i class="fas fa-broom"></i> Clear all</button></div>
    ${notifs.length ? notifs.map(n => `<div class="list-row"><div class="lr-icon ${n.icon}"><i class="fas fa-${iconMap[n.icon]||'bell'}"></i></div><div class="lr-info"><h4 style="font-weight:500">${esc(n.text)}</h4><p>${timeAgo(n.ts)}</p></div></div>`).join('') : '<div class="empty"><i class="fas fa-bell-slash"></i><p>No notifications.</p></div>'}
  </div>`;
  Store.markAllRead(u.id);
  document.getElementById('notifDot').classList.add('hidden');
}
function clearAllNotifs(){ Store.clearNotifs(Auth.current().id); renderDashboard(); toast('Notifications cleared','info'); }
function toggleMilestone(appId, idx){
  const a = Store.getApp(appId); if(!a) return;
  const ms = [...(a.milestones||[])];
  ms[idx] = { ...ms[idx], done: !ms[idx].done };
  Store.updateApp(appId, { milestones: ms });
  if(ms.every(m => m.done) && !a.completed){
    Store.updateApp(appId, { status:'completed', completed:true });
    const u = Auth.current();
    const c = Store.getCampaign(a.campaignId);
    if(u.role === 'brand'){
      Store.addTx({ id:uid('t_'), userId:a.creatorId, type:'credit', amount:a.rate, description:`Payment for "${c.title}"`, ts:now(), status:'completed' });
      Store.addNotif(a.creatorId, `Payment of ${fmtMoney(a.rate)} released`,'green');
      toast('Milestone complete. Payment released!','ok');
    }
  }
  renderDashboard();
}
function openContract(appId){
  const a = Store.getApp(appId); if(!a) return;
  const c = Store.getCampaign(a.campaignId);
  const creator = Auth.users().find(u => u.id === a.creatorId);
  const brand = Auth.users().find(u => u.id === c.brandId);
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-file-signature" style="color:var(--amber);margin-right:8px"></i>Digital Contract';
  document.getElementById('modalBody').innerHTML = `<div class="panel" style="background:var(--surface-2)">
    <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Campaign Agreement</div>
    <p style="font-size:13.5px;line-height:1.8;margin-bottom:12px">Between <strong>${esc(brand?.name||'Brand')}</strong> and <strong>${esc(creator?.name||'Creator')}</strong> for campaign <strong>"${esc(c.title)}"</strong>.</p>
    <div class="grid-2" style="gap:12px;margin-top:14px">
      <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Deliverables</div><div style="font-size:13.5px">${esc(c.deliverables)}</div></div>
      <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Rate</div><div style="font-size:13.5px;color:var(--amber);font-weight:600">${fmtMoney(a.rate)}</div></div>
      <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Deadline</div><div style="font-size:13.5px">${fmtDate(c.deadline)}</div></div>
      <div><div class="text-muted" style="font-size:10.5px;text-transform:uppercase">Usage rights</div><div style="font-size:13.5px">30 days</div></div>
    </div>
  </div>
  ${a.contract?.signedBy?.length ? `<p class="text-green" style="font-size:13px;margin-top:14px"><i class="fas fa-circle-check"></i> Signed by: ${a.contract.signedBy.map(s=>esc(s)).join(', ')}</p>` : ''}`;
  const u = Auth.current();
  const alreadySigned = a.contract?.signedBy?.includes(u.name);
  document.getElementById('modalFoot').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Close</button>${alreadySigned ? '<span class="pill green">You signed</span>' : `<button class="btn" onclick="signContract('${appId}')"><i class="fas fa-signature"></i> Sign Contract</button>`}`;
  document.getElementById('modalBg').classList.add('open');
}
function signContract(appId){
  const u = Auth.current();
  const a = Store.getApp(appId);
  const signedBy = [...(a.contract?.signedBy||[]), u.name];
  Store.updateApp(appId, { contract:{ signedBy, signedAt:now() } });
  toast('Contract signed!','ok');
  const other = a.creatorId === u.id ? Store.getCampaign(a.campaignId).brandId : a.creatorId;
  Store.addNotif(other, `${u.name} signed the contract`,'green');
  openContract(appId);
}
function renderFAQ(){
  const el = document.getElementById('faqAccordion'); if(!el) return;
  const faqs = [
    { q:'How do I sign up?', a:'Click "Get Started", choose creator or brand, fill the form with your niche/industry from the dropdown, and submit.' },
    { q:'How does ZeGod AI help me?', a:'ZeGod suggests campaigns matched to your niche (creators) or creators matched to your industry (brands). Click the robot button or the "Ask ZeGod" button in your dashboard.' },
    { q:'Can I delete an application?', a:'Yes — go to Dashboard → Applications, find the row, and click the red "Delete" button. You can only delete pending or shortlisted applications.' },
    { q:'What payment methods do you accept?', a:'We accept Credit/Debit Cards (Visa, Mastercard, Amex), UPI (GPay, PhonePe, Paytm, BHIM), and PayPal for plan upgrades.' },
    { q:'Is my payment safe?', a:'Yes — all campaign budgets are held in escrow until milestones are met. Plan payments use 256-bit SSL encryption and are PCI DSS Level 1 compliant.' },
    { q:'What are the fees?', a:'Free: 8% commission. Pro: 5% + ₹999/month. Business: 3% + ₹4,999/month.' },
    { q:'Can I add a profile photo?', a:'Yes! Edit Profile → Upload or Take Photo. Photos auto-crop to square.' },
    { q:'How do I log out?', a:'Click your avatar in the navbar → "Log out", or Dashboard → Profile → Log Out button.' }
  ];
  el.innerHTML = faqs.map((f,i) => `<div class="acc-item ${i===0?'open':''}"><div class="acc-head" onclick="this.parentElement.classList.toggle('open')"><span>${esc(f.q)}</span><i class="fas fa-chevron-down"></i></div><div class="acc-body">${esc(f.a)}</div></div>`).join('');
}
function renderBlog(){
  const el = document.getElementById('blogGrid'); if(!el) return;
  const posts = [
    { t:'7 tips to win your first brand deal', c:'Creator Growth', d:'A practical guide for creators starting out.', icon:'rocket', tone:'amber' },
    { t:'How to write a campaign brief that gets results', c:'Brand Playbook', d:'A good brief saves weeks.', icon:'clipboard-list', tone:'cyan' },
    { t:'Pricing your creator services in 2026', c:'Creator Growth', d:'Benchmarks across niches and platforms.', icon:'chart-line', tone:'green' },
    { t:'Escrow, explained: why payment safety matters', c:'Trust & Safety', d:'How escrow protects both sides.', icon:'shield-halved', tone:'purple' }
  ];
  el.innerHTML = posts.map(p => `<div class="card card-hover"><div style="font-size:26px;color:var(--${p.tone});margin-bottom:14px"><i class="fas fa-${p.icon}"></i></div><span class="pill ${p.tone}" style="margin-bottom:10px">${esc(p.c)}</span><h4 style="font-family:var(--font-display);font-size:16.5px;margin:8px 0">${esc(p.t)}</h4><p class="text-muted" style="font-size:13.5px;line-height:1.6">${esc(p.d)}</p></div>`).join('');
}
function renderCaseStudies(){
  const el = document.getElementById('caseGrid'); if(!el) return;
  const cases = [
    { brand:'Brand X', cat:'Fitness', metric:'3.2M', label:'Impressions', desc:'15 creators, 30 pieces of content, one launch.', roi:'4.1x', color:'amber' },
    { brand:'Startup Y', cat:'Tech', metric:'18K', label:'Signups', desc:'8 tech YouTubers drove 18K signups.', roi:'2.7x', color:'cyan' }
  ];
  el.innerHTML = cases.map(c => `<div class="card card-hover"><div class="flex items-center justify-between mb-16"><span class="pill ${c.color}">${esc(c.cat)}</span><span class="pill green">${c.roi} ROI</span></div><h3 style="font-family:var(--font-display);font-size:20px;margin-bottom:6px">${esc(c.brand)}</h3><div class="flex items-baseline gap-8" style="margin:14px 0"><span style="font-family:var(--font-display);font-size:34px;font-weight:700;color:var(--${c.color})">${esc(c.metric)}</span><span class="text-muted" style="font-size:12px;text-transform:uppercase">${esc(c.label)}</span></div><p class="text-muted" style="font-size:13.5px;line-height:1.7">${esc(c.desc)}</p></div>`).join('');
}
async function submitContact(){
  const btn = document.getElementById('contactSubmitBtn');
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  if(!name){ toast('Please enter your name.','err'); return; }
  if(!email){ toast('Please enter your email.','err'); return; }
  if(!/^\S+@\S+\.\S+$/.test(email)){ toast('Invalid email.','err'); return; }
  if(!message || message.length < 5){ toast('Please write a message.','err'); return; }
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="send-spinner"></span> Sending...';
  const payload = { 'Event':'CONTACT FORM','Name':name,'Email':email,'Subject':subject||'No subject','Message':message,'Sent At':new Date().toLocaleString(),'User Role':Auth.current()?.role||'guest' };
  const result = await Mailer.send(`✉️ PROMOLY Contact — ${subject||'No subject'}`, payload);
  if(!result.ok){ const q = DB.read(CONFIG.keys.contactQueue, []); q.push({ payload, ts:now() }); DB.write(CONFIG.keys.contactQueue, q); }
  btn.disabled = false;
  if(result.ok){ btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!'; toast('✅ Message sent!','ok'); document.getElementById('contactName').value='';document.getElementById('contactEmail').value='';document.getElementById('contactSubject').value='';document.getElementById('contactMessage').value=''; setTimeout(() => { btn.innerHTML = original; }, 2400); }
  else { btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Retry'; toast('❌ Could not send.','err'); setTimeout(() => { btn.innerHTML = original; }, 2400); }
}
async function retryContactQueue(){
  const q = DB.read(CONFIG.keys.contactQueue, []); if(!q.length) return;
  const remaining = [];
  for(const item of q){ const r = await Mailer.send(`✉️ PROMOLY Contact (retry) — ${item.payload.Subject}`, item.payload); if(!r.ok) remaining.push(item); }
  DB.write(CONFIG.keys.contactQueue, remaining);
}
function subscribe(plan){ const u = Auth.current(); if(!u) return go('auth','signup'); startCheckout(plan === 'business' ? 'business' : 'pro'); }
function switchHowTab(tab, btn){ document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); document.getElementById('howCreators').classList.toggle('hidden', tab !== 'creators'); document.getElementById('howBrands').classList.toggle('hidden', tab !== 'brands'); }
const tickerItems = [
  { icon:'user-plus', name:'@rahul.fit', meta:'joined · Fitness · 50K', tag:'NEW', tone:'green' },
  { icon:'bullhorn', name:'Brand X', meta:'is hiring · Fitness · ₹30K', tag:'HIRING', tone:'cyan' },
  { icon:'fire', name:'@ananya.creates', meta:'trending · Tech · 120K', tag:'TRENDING', tone:'amber' },
  { icon:'check', name:'Startup Y', meta:'verified brand · Tech', tag:'VERIFIED', tone:'purple' }
];
function renderTicker(){ const t = document.getElementById('tickerTrack'); if(!t) return; const build = () => tickerItems.map(x => `<span class="tick"><i class="fas fa-${x.icon}" style="opacity:.7;font-size:10px"></i><b>${esc(x.name)}</b> ${esc(x.meta)}<span class="tick-tag ${x.tone}">${x.tag}</span></span>`).join(''); t.innerHTML = build() + build(); }

let cursorCanvas, ctx, cursorParticles = [], mouseX = -9999, mouseY = -9999, cursorInit = false;
function initCursorCanvas(){
  const canvas = document.getElementById('cursorCanvas'); if(!canvas) return;
  if(cursorInit){ resizeCursorCanvas(); return; }
  cursorCanvas = canvas; ctx = canvas.getContext('2d');
  resizeCursorCanvas();
  window.addEventListener('resize', resizeCursorCanvas);
  document.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mouseX = e.clientX-r.left; mouseY = e.clientY-r.top; });
  const colors = ['#FFB020','#43D9FF','#A78BFA','#3ECF8E','#F472B6'];
  cursorParticles = [];
  for(let i = 0; i < 80; i++) cursorParticles.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5, size:Math.random()*3+1.5, color:colors[Math.floor(Math.random()*colors.length)], baseX:Math.random()*canvas.width, baseY:Math.random()*canvas.height });
  cursorInit = true;
  animateCursor();
}
function resizeCursorCanvas(){ if(!cursorCanvas) return; cursorCanvas.width = cursorCanvas.parentElement.offsetWidth; cursorCanvas.height = cursorCanvas.parentElement.offsetHeight; cursorParticles.forEach(p => { p.x=Math.random()*cursorCanvas.width; p.y=Math.random()*cursorCanvas.height; p.baseX=p.x; p.baseY=p.y; }); }
function animateCursor(){
  if(!cursorInit || !ctx) return;
  const canvas = cursorCanvas, c = ctx;
  c.clearRect(0, 0, canvas.width, canvas.height);
  cursorParticles.forEach(p => {
    p.vx += (Math.random()-.5)*.15; p.vy += (Math.random()-.5)*.15;
    const dx = mouseX-p.x, dy = mouseY-p.y;
    const d = Math.sqrt(dx*dx+dy*dy);
    if(d < 180 && d > 0.1){ const f = (1-d/180)*.045*3; p.vx -= (dx/d)*f; p.vy -= (dy/d)*f; }
    const tbx = p.baseX-p.x, tby = p.baseY-p.y;
    const bd = Math.sqrt(tbx*tbx+tby*tby);
    if(bd > 1){ p.vx += (tbx/bd)*.0015; p.vy += (tby/bd)*.0015; }
    p.vx *= .96; p.vy *= .96;
    const sp = Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    if(sp > 5){ p.vx = (p.vx/sp)*5; p.vy = (p.vy/sp)*5; }
    p.x += p.vx; p.y += p.vy;
    const pad = 20;
    if(p.x < pad){ p.x = pad; p.vx *= -.5; }
    if(p.x > canvas.width-pad){ p.x = canvas.width-pad; p.vx *= -.5; }
    if(p.y < pad){ p.y = pad; p.vy *= -.5; }
    if(p.y > canvas.height-pad){ p.y = canvas.height-pad; p.vy *= -.5; }
    c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI*2); c.fillStyle = p.color;
    c.shadowColor = p.color; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0;
    cursorParticles.forEach(p2 => { if(p === p2) return; const dx2 = p.x-p2.x, dy2 = p.y-p2.y; const d2 = Math.sqrt(dx2*dx2+dy2*dy2); if(d2 < 120){ c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p2.x, p2.y); c.strokeStyle = p.color; c.globalAlpha = .4*(1-d2/120); c.lineWidth = .5; c.stroke(); c.globalAlpha = 1; } });
  });
  requestAnimationFrame(animateCursor);
}
const phrases = ['AI-powered matching · Secure · Transparent','Connect with top creators instantly','Real-time exchange board · Live updates','Meet ZeGod, your AI assistant'];
let phraseIndex = 0, charIndex = 0, isDeleting = false;
function typeEffect(){
  const el = document.getElementById('typingEffect'); if(!el) return;
  const cur = phrases[phraseIndex];
  if(isDeleting){ el.textContent = cur.substring(0, charIndex-1); charIndex--; if(charIndex === 0){ isDeleting = false; phraseIndex = (phraseIndex+1) % phrases.length; setTimeout(typeEffect, 800); return; } setTimeout(typeEffect, 40); }
  else { el.textContent = cur.substring(0, charIndex+1); charIndex++; if(charIndex === cur.length){ isDeleting = true; setTimeout(typeEffect, 2500); return; } setTimeout(typeEffect, 60); }
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn'); if(!btn || btn.disabled) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const rp = document.createElement('span');
  rp.className = 'ripple';
  rp.style.width = rp.style.height = size + 'px';
  rp.style.left = (e.clientX - r.left) + 'px';
  rp.style.top = (e.clientY - r.top) + 'px';
  btn.appendChild(rp);
  setTimeout(() => rp.remove(), 650);
});
let revealObserver;
function observeAll(){
  if(revealObserver) revealObserver.disconnect();
  if(!DB.read(CONFIG.keys.anim, true)){ document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach(el => el.classList.add('in')); return; }
  revealObserver = new IntersectionObserver((entries) => { entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); revealObserver.unobserve(en.target); } }); }, { threshold:0.12, rootMargin:'0px 0px -60px 0px' });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach(el => { if(!el.classList.contains('in')) revealObserver.observe(el); });
}
function addScrollTop(){
  const btn = document.createElement('button');
  btn.id = 'scrollTop'; btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.onclick = () => window.scrollTo({ top:0, behavior:'smooth' });
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--amber),var(--cyan));color:#fff;font-size:15px;cursor:pointer;z-index:900;opacity:0;transform:translateY(20px) scale(.8);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1);box-shadow:0 10px 30px rgba(255,176,32,.35);display:flex;align-items:center;justify-content:center';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => { if(window.scrollY > 400){ btn.style.opacity = '1'; btn.style.transform = 'translateY(0) scale(1)'; btn.style.pointerEvents = 'auto'; } else { btn.style.opacity = '0'; btn.style.transform = 'translateY(20px) scale(.8)'; btn.style.pointerEvents = 'none'; } });
}
(function init(){
  const savedTheme = DB.read(CONFIG.keys.theme, 'dark');
  const savedAccent = DB.read(CONFIG.keys.accent, 'amber');
  const animOn = DB.read(CONFIG.keys.anim, true);
  const reduceMotion = DB.read(CONFIG.keys.reduceMotion, false);
  document.documentElement.setAttribute('data-theme', savedTheme);
  applyTheme(savedTheme); applyAccent(savedAccent); applyReduceMotion(reduceMotion);
  if(!animOn){ document.getElementById('animToggle')?.classList.remove('on'); applyAnimations(false); } else document.getElementById('animToggle')?.classList.add('on');
  if(reduceMotion) document.getElementById('reduceMotionToggle')?.classList.add('on');
  seedDemo();
  renderTicker(); renderHomeCampaigns(); refreshNav(); renderNotifDropdown();
  setRole('creator'); setAuthMode('signup');
  setTimeout(() => { animateNum('statCreators',1240); animateNum('statBrands',340); animateNum('statMatch',94); }, 500);
  window.addEventListener('scroll', () => document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40));
  document.addEventListener('click', (e) => { const bell = document.getElementById('bellBtn'); if(bell && !bell.contains(e.target)) closeNotif(); const chip = document.getElementById('userChip'); if(chip && !chip.contains(e.target)) closeUserMenu(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape'){ closeModal(); closeNotif(); closeUserMenu(); closeSidebar(); if(ZeGod.isOpen) ZeGod.close(); } if(e.ctrlKey && e.key.toLowerCase() === 'k'){ e.preventDefault(); go('auth','creator'); } if(e.ctrlKey && e.key.toLowerCase() === 'j'){ e.preventDefault(); ZeGod.toggle(); } if(e.key === 'Home' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')){ e.preventDefault(); go('home'); } });
  document.querySelectorAll('.accent-swatch').forEach(s => s.addEventListener('click', () => setAccent(s.dataset.accent)));
  setTimeout(typeEffect, 500); observeAll(); addScrollTop(); setTimeout(retryContactQueue, 3000);
  const u = Auth.current();
  if(u){ refreshNav(); const seenWelcome = DB.read(CONFIG.keys.zgWelcomed + '_' + u.id); if(!seenWelcome) setTimeout(() => showWelcome(false), 800); }
  console.log('%c🚀 PROMOLY v2.4 — Delete apps + Full checkout','font-size:22px;font-weight:bold;color:#FFB020');
  console.log('%c💳 Payment methods: Card · UPI · PayPal','color:#43D9FF');
  console.log('%c🗑️ Delete applications from Dashboard → Applications','color:#FF5D5D');
  console.log('%c📋 Demo: brandx@demo.com / rahul@demo.com · password: demo1234','color:#3ECF8E');
})();
function animateNum(id, target){ const el = document.getElementById(id); if(!el) return; const start = performance.now(); const dur = 1800; (function tick(t){ const p = Math.min((t-start)/dur, 1); const e = 1 - Math.pow(1-p, 3); el.textContent = Math.round(e*target).toLocaleString(); if(p < 1) requestAnimationFrame(tick); })(start); }