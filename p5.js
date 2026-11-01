/* ============================================================
   p5.js — CleanPro TX · Finance (Enterprise plan)
   Each pro manages THEIR OWN business money:
   bank accounts, statement upload (CSV / Excel), real profit,
   owner draws, debts + payoff plan, loan contracts.
   Data: fin_accounts, fin_tx, fin_rules, fin_debts (+ bucket fin-contracts)
   RLS only lets an Enterprise owner (trial/active) see their own rows.
   ============================================================ */
var FIN = { acc: [], tx: [], rules: [], debts: [], unpaid: 0, month: null, method: 'avalanche', extra: 0, docCounts: {} };

var FIN_OUT = ['Supplies','Payroll','Contractors','Fuel','Vehicle','Insurance','Rent','Phone & Internet','Software','Marketing','Equipment','Meals','Bank fees','Taxes','Loan payment','Card payment','Owner draw','Transfer','Other expense'];
var FIN_IN  = ['Client payment','Loan received','Owner contribution','Refund','Transfer','Other income'];
var FIN_NOT_EXPENSE = ['Loan payment','Card payment','Owner draw','Transfer'];
var FIN_NOT_REVENUE = ['Loan received','Owner contribution','Transfer'];

var FIN_KW_OUT = [
  ['Transfer', ['online transfer to','transfer to sav','transfer to chk','internal transfer']],
  ['Card payment', ['payment thank','autopay','credit card pmt','card payment','capital one','amex epayment','american express','discover e-payment','citi card','chase card','epay']],
  ['Loan payment', ['loan','fundbox','expansion capital','ondeck','bluevine','kabbage','financing','lending','sba ','credibly','national funding']],
  ['Payroll', ['payroll','gusto','adp ','paychex']],
  ['Fuel', ['shell','exxon','chevron','valero','conoco','phillips 66','murphy','quiktrip','allsup','toot n totum','stripes','fuel','gas station','racetrac','circle k']],
  ['Supplies', ['walmart','wal-mart','sam\'s','sams club','costco','home depot','lowe','dollar general','family dollar','dollar tree','target','amazon','amzn','janitorial','hd supply','zoro','uline']],
  ['Software', ['quickbooks','intuit','google','microsoft','adobe','jobber','canva','squarespace','wix','godaddy','apple.com','dropbox','zoom']],
  ['Phone & Internet', ['verizon','at&t','att ','t-mobile','tmobile','spectrum','suddenlink','cricket','comcast','xfinity']],
  ['Insurance', ['insurance','geico','progressive','state farm','allstate','next insur','hiscox','thimble']],
  ['Marketing', ['facebook','facebk','meta ','google ads','yelp','thumbtack','angi','nextdoor','vistaprint','homeadvisor']],
  ['Bank fees', ['service charge','overdraft',' nsf ','monthly fee','maintenance fee','atm fee','wire fee']],
  ['Taxes', ['irs ','usataxpymt','comptroller','tax pymt','state tax']],
  ['Meals', ['mcdonald','starbucks','chick-fil','whataburger','sonic drive','taco','restaurant','doordash','uber eats','subway','burger']],
  ['Vehicle', ['autozone','o\'reilly','oreilly','jiffy','tire','car wash','dmv','registration','parts']],
  ['Rent', ['rent','storage','u-haul','public storage']]
];
var FIN_KW_IN = [
  ['Loan received', ['fundbox','expansion capital','ondeck','bluevine','kabbage','loan proceeds','advance','credibly']],
  ['Refund', ['refund','return','reversal','credit adj']],
  ['Transfer', ['online transfer from','transfer from sav','transfer from chk','internal transfer']],
  ['Client payment', ['stripe','square','zelle from','venmo','cash app','cashapp','mobile deposit','paypal','deposit','ach credit','remote deposit']]
];

function finEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function finYM(d){ return String(d).slice(0,7); }
function finToday(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function finMonthLabel(ym){ var p=ym.split('-'); return new Date(+p[0], +p[1]-1, 1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
function finShiftMonth(ym, n){ var p=ym.split('-'); var d=new Date(+p[0], +p[1]-1+n, 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function finIsPremium(){ var b=window._biz||{}; return b.plan==='Enterprise' && ['trial','trialing','active'].indexOf(String(b.status||''))>=0; }

/* ---------------- Entry ---------------- */
async function loadFinance(){
  await getBizId();
  var root = document.getElementById('fin-root');
  if(!root) return;
  if(!finIsPremium()){ root.innerHTML = finLockHtml(); return; }
  if(!FIN.month) FIN.month = finYM(finToday());
  root.innerHTML = '<div class="loading" style="padding:40px;text-align:center;">Loading your finances…</div>';
  try{
    var r = await Promise.all([
      sb.from('fin_accounts').select('*').order('created_at'),
      finFetchAllTx(),
      sb.from('fin_rules').select('*'),
      sb.from('fin_debts').select('*').order('created_at'),
      sb.from('pro_invoices').select('balance,status')
    ]);
    if(r[0].error) throw r[0].error;
    FIN.acc = r[0].data||[]; FIN.tx = r[1]; FIN.rules = r[2].data||[]; FIN.debts = r[3].data||[];
    FIN.unpaid = (r[4].data||[]).filter(function(i){ return !/paid|void|cancel/i.test(i.status||''); })
      .reduce(function(a,i){ return a+Number(i.balance||0); },0);
    await finLoadDocCounts();
    finRender();
  }catch(e){
    root.innerHTML = '<div class="card" style="padding:24px;color:var(--red);">Could not load finances: '+finEsc(e.message||e)+'</div>';
  }
}
async function finFetchAllTx(){
  var all=[], from=0;
  while(true){
    var r = await sb.from('fin_tx').select('*').order('tx_date',{ascending:false}).range(from, from+999);
    if(r.error) throw r.error;
    all = all.concat(r.data||[]);
    if(!r.data || r.data.length<1000) break;
    from += 1000;
  }
  return all;
}

function finLockHtml(){
  var feats = [
    ['Know where you stand','Cash in the bank, real profit and what is left after bills, every month.'],
    ['Upload bank statements','Drop a CSV or Excel export from any bank. Duplicates are skipped and expenses are sorted for you.'],
    ['Owner draws vs. business','See what you paid yourself apart from what the business spent.'],
    ['Get out of debt','List loans and cards, pick avalanche or snowball, and see your debt-free date.'],
    ['Loan contracts in one place','Keep each contract attached to its loan.'],
    ['Tax-ready export','Download a categorized CSV for your accountant.']
  ];
  return '<div class="card" style="max-width:720px;margin:0 auto;padding:32px 28px;text-align:center;">'
    +'<div style="display:inline-block;background:var(--amber-light);color:#92400E;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;letter-spacing:.05em;">ENTERPRISE</div>'
    +'<h2 style="font-size:22px;margin:12px 0 6px;">Business Finance</h2>'
    +'<p style="color:var(--tx2);margin-bottom:22px;">Take control of your business money, not just your jobs.</p>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;text-align:left;margin-bottom:24px;">'
    + feats.map(function(f){ return '<div style="border:1px solid var(--border);border-radius:12px;padding:14px;"><div style="font-weight:600;margin-bottom:4px;">'+f[0]+'</div><div style="font-size:13px;color:var(--tx2);">'+f[1]+'</div></div>'; }).join('')
    +'</div>'
    +'<button class="btn btn-primary" onclick="openBillingPortal(this)">Upgrade to Enterprise</button>'
    +'<div style="font-size:12px;color:var(--tx3);margin-top:10px;">Your current plan: '+finEsc((window._biz&&window._biz.plan)||'Basic')+'</div>'
    +'</div>';
}

/* ---------------- Math ---------------- */
function finMonthTx(ym){ return FIN.tx.filter(function(t){ return finYM(t.tx_date)===ym; }); }
function finTotals(list){
  var o={rev:0, exp:0, loans:0, draws:0, cashIn:0, cashOut:0, cats:{}};
  list.forEach(function(t){
    var a=Number(t.amount||0), c=t.category||(t.direction==='in'?'Other income':'Other expense');
    if(t.is_transfer || c==='Transfer') return;
    if(t.direction==='in'){
      o.cashIn+=a;
      if(FIN_NOT_REVENUE.indexOf(c)<0) o.rev+=a;
    }else{
      o.cashOut+=a;
      if(c==='Owner draw') o.draws+=a;
      else if(c==='Loan payment'||c==='Card payment') o.loans+=a;
      else { o.exp+=a; o.cats[c]=(o.cats[c]||0)+a; }
    }
  });
  o.profit=o.rev-o.exp; o.left=o.cashIn-o.cashOut;
  return o;
}
function finCash(){ return FIN.acc.filter(function(a){ return a.kind!=='credit'; }).reduce(function(s,a){ return s+Number(a.balance||0); },0); }
var FIN_FREQ = { weekly: 52/12, biweekly: 26/12, monthly: 1 };
function finDebtList(){
  var L = FIN.debts.map(function(d){ return { id:d.id, name:d.name, lender:d.lender, bal:d.balance==null?null:Number(d.balance), apr:Number(d.apr||0), pay:Number(d.payment||0), freq:d.frequency||'monthly', monthly:Number(d.payment||0)*(FIN_FREQ[d.frequency]||1), src:d }; });
  FIN.acc.filter(function(a){ return a.kind==='credit' && Number(a.balance||0)>0; }).forEach(function(a){
    L.push({ id:'acc-'+a.id, name:a.name+(a.last4?' ••'+a.last4:''), lender:'Credit card', bal:Number(a.balance), apr:0, pay:0, freq:'monthly', monthly:0, card:true });
  });
  return L;
}
function finCapacity(){
  var cur = finYM(finToday()), vals=[];
  for(var i=1;i<=3;i++){
    var t = finTotals(finMonthTx(finShiftMonth(cur,-i)));
    if(t.cashIn||t.cashOut) vals.push(t.rev - t.exp - t.draws);
  }
  if(!vals.length) return null;
  return vals.reduce(function(a,b){ return a+b; },0)/vals.length;
}
function finSimulate(L, extra, method){
  var ds = L.filter(function(d){ return d.bal!=null && d.bal>0; }).map(function(d){
    return { name:d.name, bal:d.bal, r:d.apr/1200, min:Math.max(d.monthly, d.card? Math.max(25, d.bal*0.02):0) };
  });
  if(!ds.length) return null;
  var month=0, interest=0, order=[];
  while(ds.some(function(d){ return d.bal>0.005; }) && month<600){
    month++;
    var pool = extra;
    ds.forEach(function(d){ if(d.bal<=0.005){ pool+=d.min; } });
    ds.forEach(function(d){
      if(d.bal<=0.005) return;
      var i=d.bal*d.r; interest+=i; d.bal+=i;
      var p=Math.min(d.min, d.bal); d.bal-=p;
    });
    var live = ds.filter(function(d){ return d.bal>0.005; });
    live.sort(method==='snowball' ? function(a,b){ return a.bal-b.bal; } : function(a,b){ return b.r-a.r || a.bal-b.bal; });
    for(var k=0;k<live.length && pool>0.005;k++){ var p2=Math.min(pool, live[k].bal); live[k].bal-=p2; pool-=p2; }
    ds.forEach(function(d){ if(d.bal<=0.005 && !d.done){ d.done=true; d.bal=0; order.push({name:d.name, month:month}); } });
  }
  return { months:month, interest:interest, order:order, stuck: month>=600 };
}

/* ---------------- Render ---------------- */
function finRender(){
  var root = document.getElementById('fin-root');
  var ym = FIN.month, t = finTotals(finMonthTx(ym));
  var debtTotal = finDebtList().reduce(function(s,d){ return s+(d.bal||0); },0);
  var noData = !FIN.acc.length && !FIN.tx.length;
  var h = '';
  h += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;">'
    +'<div style="display:flex;align-items:center;gap:6px;">'
    +'<button class="btn btn-outline btn-sm" onclick="finGoMonth(-1)">‹</button>'
    +'<div style="font-weight:700;min-width:140px;text-align:center;">'+finMonthLabel(ym)+'</div>'
    +'<button class="btn btn-outline btn-sm" onclick="finGoMonth(1)">›</button></div>'
    +'<div style="flex:1"></div>'
    +'<button class="btn btn-outline btn-sm" onclick="finExportCSV()">Export for taxes</button>'
    +'<button class="btn btn-outline btn-sm" onclick="finOpenTx()">+ Transaction</button>'
    +'<button class="btn btn-primary btn-sm" onclick="finOpenUpload()">Upload statement</button>'
    +'</div>';

  if(noData){
    h += '<div class="card" style="padding:22px;margin-bottom:16px;background:var(--purple-light);border:1px solid var(--purple);">'
      +'<div style="font-weight:700;margin-bottom:6px;">Let\'s get started</div>'
      +'<ol style="margin-left:18px;color:var(--tx2);font-size:13px;line-height:1.8;">'
      +'<li>Add your business bank account (name and current balance).</li>'
      +'<li>Download your statement from your bank\'s website as <b>CSV or Excel</b> and upload it here.</li>'
      +'<li>Review the categories. Mark what you paid yourself as <b>Owner draw</b>.</li></ol>'
      +'<button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="finOpenAccount()">+ Add bank account</button></div>';
  }

  h += '<div class="kpis">'
    + finKpi('Cash in bank', fmt(finCash()), 'var(--tx)', FIN.acc.filter(function(a){return a.kind!=='credit';}).length+' account(s)')
    + finKpi('Money in', fmt(t.rev), 'var(--green)', 'Client payments & other income')
    + finKpi('Real profit', finMoney(t.profit), t.profit>=0?'var(--green)':'var(--red)', 'Money in − business expenses')
    + finKpi('Left over', finMoney(t.left), t.left>=0?'var(--green)':'var(--red)', 'After loans, cards & owner draws')
    + '</div>';
  h += '<div class="kpis">'
    + finKpi('Business expenses', fmt(t.exp), 'var(--red)', '')
    + finKpi('Loan & card payments', fmt(t.loans), 'var(--amber)', t.rev? Math.round(t.loans/t.rev*100)+'% of money in':'')
    + finKpi('Owner draws', fmt(t.draws), 'var(--blue)', 'What you paid yourself')
    + finKpi('Unpaid invoices', fmt(FIN.unpaid), 'var(--purple-dark)', 'Money coming from clients')
    + '</div>';

  var alerts = finAlerts(t, debtTotal);
  if(alerts.length) h += '<div class="card" style="padding:14px 18px;margin-bottom:16px;border-left:4px solid var(--amber);">'+alerts.map(function(a){ return '<div style="font-size:13px;padding:3px 0;">'+a+'</div>'; }).join('')+'</div>';

  h += '<div class="two">' + finHistoryCard() + finCatsCard(t) + '</div>';
  h += finTxCard(ym);
  h += '<div class="two">' + finAccountsCard() + finDebtsCard(debtTotal) + '</div>';
  root.innerHTML = h;
  finRenderPlan();
}
function finMoney(v){ v=Number(v||0); return (v<0?'−':'')+fmt(Math.abs(v)); }
function finKpi(l,v,c,s){ return '<div class="kpi"><div class="kpi-lbl">'+l+'</div><div class="kpi-val" style="color:'+c+';">'+v+'</div>'+(s?'<div style="font-size:11px;color:var(--tx3);margin-top:6px;">'+s+'</div>':'')+'</div>'; }
function finAlerts(t, debtTotal){
  var a=[];
  if(t.rev && t.loans/t.rev>0.35) a.push('⚠️ Loan and card payments are <b>'+Math.round(t.loans/t.rev*100)+'%</b> of what came in this month. Above 35% gets risky.');
  if(t.left<0) a.push('⚠️ More money went out than came in this month ('+finMoney(t.left)+').');
  var avgOut = 0, n=0, cur=finYM(finToday());
  for(var i=1;i<=3;i++){ var x=finTotals(finMonthTx(finShiftMonth(cur,-i))); if(x.cashOut){ avgOut+=x.cashOut; n++; } }
  if(n){ avgOut/=n; var weeks = avgOut? finCash()/(avgOut/4.33):0; if(FIN.acc.length && weeks<4) a.push('⚠️ Your cash covers about <b>'+weeks.toFixed(1)+' weeks</b> of normal spending. Aim for at least 4.'); }
  var unc = finMonthTx(FIN.month).filter(function(x){ return !x.category; }).length;
  if(unc) a.push('📝 '+unc+' transaction(s) this month need a category.');
  var stale = FIN.acc.filter(function(x){ return x.balance_date && (Date.now()-new Date(x.balance_date+'T12:00:00'))/864e5>35; });
  if(stale.length) a.push('🕒 Update the balance of: '+stale.map(function(x){return finEsc(x.name);}).join(', ')+'.');
  return a;
}
function finHistoryCard(){
  var rows='', cur=FIN.month;
  for(var i=5;i>=0;i--){
    var ym=finShiftMonth(cur,-i), t=finTotals(finMonthTx(ym));
    if(!t.cashIn && !t.cashOut) continue;
    rows += '<tr><td>'+finMonthLabel(ym).split(' ')[0].slice(0,3)+' '+ym.slice(2,4)+'</td>'
      +'<td style="color:var(--green);">'+fmt(t.rev)+'</td><td style="color:var(--red);">'+fmt(t.exp)+'</td>'
      +'<td style="color:'+(t.profit>=0?'var(--green)':'var(--red)')+'"><b>'+finMoney(t.profit)+'</b></td>'
      +'<td>'+fmt(t.loans)+'</td><td>'+fmt(t.draws)+'</td></tr>';
  }
  return '<div class="card"><div class="card-header"><div class="card-title">Last 6 months</div></div><div style="overflow-x:auto;"><table><thead><tr><th>Month</th><th>In</th><th>Expenses</th><th>Profit</th><th>Loans/cards</th><th>Draws</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="6" class="empty">Upload a statement to see your history</td></tr>')+'</tbody></table></div></div>';
}
function finCatsCard(t){
  var c = Object.entries(t.cats).sort(function(a,b){ return b[1]-a[1]; });
  var max = c.length? c[0][1]:1;
  var body = c.length ? c.map(function(x){
    return '<div style="padding:8px 18px;"><div style="display:flex;justify-content:space-between;font-size:13px;"><span>'+finEsc(x[0])+'</span><b>'+fmt(x[1])+'</b></div>'
      +'<div style="height:6px;background:var(--border2);border-radius:4px;margin-top:4px;"><div style="height:6px;border-radius:4px;background:var(--purple);width:'+Math.max(3,x[1]/max*100)+'%"></div></div></div>';
  }).join('') : '<div class="empty" style="padding:24px;">No expenses this month</div>';
  return '<div class="card"><div class="card-header"><div class="card-title">Where the money went</div></div><div style="padding:6px 0 12px;">'+body+'</div></div>';
}
function finCatOptions(dir, sel){
  var list = dir==='in'?FIN_IN:FIN_OUT;
  return '<option value="">— Choose —</option>'+list.map(function(c){ return '<option'+(c===sel?' selected':'')+'>'+c+'</option>'; }).join('');
}
function finTxCard(ym){
  var q = (FIN.q||'').toLowerCase();
  var list = finMonthTx(ym).filter(function(t){ return !q || (t.description||'').toLowerCase().indexOf(q)>=0 || (t.category||'').toLowerCase().indexOf(q)>=0; });
  var accName = {}; FIN.acc.forEach(function(a){ accName[a.id]=a.name; });
  var rows = list.map(function(t){
    var inn = t.direction==='in';
    return '<tr><td style="white-space:nowrap;">'+fmtD(t.tx_date)+'</td>'
      +'<td><div style="font-weight:500;">'+finEsc(t.description||'--')+'</div><div style="font-size:11px;color:var(--tx3);">'+finEsc(accName[t.account_id]||'')+'</div></td>'
      +'<td><select class="filter-select" style="max-width:170px;'+(t.category?'':'border-color:var(--amber);')+'" onchange="finSetCat(\''+t.id+'\',this.value)">'+finCatOptions(t.direction, t.category)+'</select></td>'
      +'<td style="white-space:nowrap;text-align:right;color:'+(inn?'var(--green)':'var(--tx)')+'"><b>'+(inn?'+':'−')+fmt(t.amount)+'</b></td>'
      +'<td style="white-space:nowrap;"><button class="btn btn-outline btn-xs" onclick="finOpenTx(\''+t.id+'\')">Edit</button></td></tr>';
  }).join('');
  return '<div class="card" style="margin-bottom:16px;"><div class="card-header" style="gap:10px;flex-wrap:wrap;"><div class="card-title">Transactions · '+finMonthLabel(ym)+'</div>'
    +'<input class="form-input" style="max-width:220px;padding:6px 10px;" placeholder="Search…" value="'+finEsc(FIN.q||'')+'" oninput="FIN.q=this.value;finRefreshTx()"/></div>'
    +'<div style="font-size:12px;color:var(--tx3);padding:0 18px 8px;">Changing a category also teaches it for similar transactions.</div>'
    +'<div style="overflow-x:auto;" id="fin-tx-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right;">Amount</th><th></th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="5" class="empty">No transactions this month</td></tr>')+'</tbody></table></div></div>';
}
function finRefreshTx(){
  var tmp=document.createElement('div'); tmp.innerHTML=finTxCard(FIN.month);
  var w=document.getElementById('fin-tx-wrap'), nw=tmp.querySelector('#fin-tx-wrap');
  if(w&&nw) w.innerHTML=nw.innerHTML;
}
function finAccountsCard(){
  var kinds={checking:'Checking',savings:'Savings',cash:'Cash',credit:'Credit card'};
  var rows = FIN.acc.map(function(a){
    return '<tr><td><div style="font-weight:500;">'+finEsc(a.name)+(a.last4?' <span style="color:var(--tx3);">••'+finEsc(a.last4)+'</span>':'')+'</div><div style="font-size:11px;color:var(--tx3);">'+kinds[a.kind]+(a.balance_date?' · as of '+fmtD(a.balance_date):'')+'</div></td>'
      +'<td style="text-align:right;"><b style="color:'+(a.kind==='credit'?'var(--red)':'var(--tx)')+'">'+(a.balance==null?'--':fmt(a.balance))+'</b></td>'
      +'<td><button class="btn btn-outline btn-xs" onclick="finOpenAccount(\''+a.id+'\')">Edit</button></td></tr>';
  }).join('');
  return '<div class="card"><div class="card-header"><div class="card-title">Bank accounts & cards</div><button class="btn btn-outline btn-xs" onclick="finOpenAccount()">+ Add</button></div>'
    +'<div style="overflow-x:auto;"><table><tbody>'+(rows||'<tr><td colspan="3" class="empty">No accounts yet</td></tr>')+'</tbody></table></div></div>';
}
function finDebtsCard(total){
  var L = finDebtList();
  var freqL={weekly:'/week',biweekly:'/2 weeks',monthly:'/month'};
  var rows = L.map(function(d){
    var docs = FIN.docCounts[d.id]||0;
    return '<tr><td><div style="font-weight:500;">'+finEsc(d.name)+'</div><div style="font-size:11px;color:var(--tx3);">'+finEsc(d.lender||'')+(d.apr?' · '+d.apr+'% APR':'')+(d.pay?' · '+fmt(d.pay)+freqL[d.freq]:'')+'</div></td>'
      +'<td style="text-align:right;"><b>'+(d.bal==null?'<span style="color:var(--amber);font-size:12px;">balance?</span>':fmt(d.bal))+'</b></td>'
      +'<td style="white-space:nowrap;">'+(d.card?'':'<button class="btn btn-outline btn-xs" onclick="finOpenDebt(\''+d.id+'\')">Edit</button> <button class="btn btn-outline btn-xs" onclick="finShowDocs(\''+d.id+'\')">📄 '+docs+'</button>')+'</td></tr>';
  }).join('');
  var monthly = L.reduce(function(s,d){ return s+d.monthly; },0);
  return '<div class="card"><div class="card-header"><div class="card-title">Debts · '+fmt(total)+'</div><button class="btn btn-outline btn-xs" onclick="finOpenDebt()">+ Add loan</button></div>'
    +(monthly?'<div style="font-size:12px;color:var(--tx2);padding:0 18px 6px;">Fixed loan payments: <b>'+fmt(monthly)+'</b> per month</div>':'')
    +'<table><tbody>'+(rows||'<tr><td colspan="3" class="empty">No debts. 🎉</td></tr>')+'</tbody></table>'
    +'<div style="border-top:1px solid var(--border);padding:16px 18px;">'
    +'<div style="font-weight:600;margin-bottom:8px;">Debt-free plan</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">'
    +'<button class="btn btn-xs '+(FIN.method==='avalanche'?'btn-primary':'btn-outline')+'" onclick="FIN.method=\'avalanche\';finRender()">Avalanche (highest APR first)</button>'
    +'<button class="btn btn-xs '+(FIN.method==='snowball'?'btn-primary':'btn-outline')+'" onclick="FIN.method=\'snowball\';finRender()">Snowball (smallest first)</button></div>'
    +'<label class="form-label">Extra per month toward debt</label>'
    +'<input class="form-input" type="number" min="0" step="50" value="'+(FIN.extra||'')+'" placeholder="0" oninput="FIN.extra=Number(this.value)||0;finRenderPlan()"/>'
    +'<div id="fin-plan-hint" style="font-size:12px;color:var(--tx2);margin-top:6px;"></div>'
    +'<div id="fin-plan" style="margin-top:10px;font-size:13px;"></div></div></div>';
}
function finRenderPlan(){
  var el=document.getElementById('fin-plan'), hint=document.getElementById('fin-plan-hint');
  if(!el) return;
  var L=finDebtList(), cap=finCapacity();
  var fixed = L.reduce(function(s,d){ return s+d.monthly; },0);
  if(hint){
    if(cap==null) hint.textContent='Upload a few months of statements to see how much you can put toward debt.';
    else { var free = cap-fixed; hint.innerHTML = 'Average left after expenses and draws: <b>'+finMoney(cap)+'</b>/month. After fixed loan payments: <b style="color:'+(free>=0?'var(--green)':'var(--red)')+'">'+finMoney(free)+'</b>.'
      +(free<(FIN.extra||0)?'<div style="color:var(--red);margin-top:4px;">Your recent months don\'t leave enough to cover '+(FIN.extra?'this extra amount':'these payments')+'. Cut expenses or draws, or raise prices, to make this plan real.</div>':''); }
  }
  var missing = L.filter(function(d){ return d.bal==null; });
  var sim = finSimulate(L, FIN.extra||0, FIN.method);
  var h='';
  if(!sim) h = '<span style="color:var(--tx3);">Add balances to your debts to build the plan.</span>';
  else if(sim.stuck) h = '<span style="color:var(--red);">With these payments the debt doesn\'t go down. Add an extra amount or check the APR and payments.</span>';
  else {
    var d=new Date(); d.setMonth(d.getMonth()+sim.months);
    h = '<div style="font-size:15px;">Debt-free by <b>'+d.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</b> ('+sim.months+' months)</div>'
      +'<div style="color:var(--tx2);">Estimated interest: '+fmt(sim.interest)+'</div>'
      +'<ol style="margin:8px 0 0 18px;">'+sim.order.map(function(o){ var dd=new Date(); dd.setMonth(dd.getMonth()+o.month); return '<li>'+finEsc(o.name)+' — '+dd.toLocaleDateString('en-US',{month:'short',year:'numeric'})+'</li>'; }).join('')+'</ol>';
  }
  if(missing.length) h += '<div style="color:var(--amber);margin-top:8px;font-size:12px;">Missing balance: '+missing.map(function(m){return finEsc(m.name);}).join(', ')+'. Check the contract or your lender\'s app.</div>';
  el.innerHTML=h;
}
function finGoMonth(n){ FIN.month=finShiftMonth(FIN.month,n); finRender(); }

/* ---------------- Modal ---------------- */
function finModal(title, body, onSave, saveLabel, extraBtn){
  var m=document.getElementById('fin-modal');
  if(!m){ m=document.createElement('div'); m.id='fin-modal'; m.className='modal-bg'; document.body.appendChild(m);
    m.addEventListener('click',function(e){ if(e.target===m) finClose(); }); }
  m.innerHTML='<div class="modal" style="width:560px;"><div class="modal-hd"><div class="modal-title">'+title+'</div><button class="modal-close" onclick="finClose()">✕</button></div>'
    +'<div class="modal-body">'+body+'</div><div class="modal-footer">'+(extraBtn||'')+'<div style="flex:1"></div><button class="btn btn-outline btn-sm" onclick="finClose()">Cancel</button>'
    +(onSave?'<button class="btn btn-primary btn-sm" id="fin-save">'+(saveLabel||'Save')+'</button>':'')+'</div></div>';
  m.classList.add('open');
  if(onSave) document.getElementById('fin-save').onclick=async function(){
    var b=this; b.disabled=true; var l=b.textContent; b.textContent='Saving…';
    try{ var ok=await onSave(); if(ok!==false) finClose(); }
    catch(e){ showAlert('Error: '+(e.message||e)); }
    b.disabled=false; b.textContent=l;
  };
}
function finClose(){ var m=document.getElementById('fin-modal'); if(m) m.classList.remove('open'); }
function finV(id){ var e=document.getElementById(id); return e?e.value.trim():''; }
function finNum(v){ if(v===''||v==null) return null; var n=Number(String(v).replace(/[$,\s]/g,'')); return isNaN(n)?null:n; }

/* ---------------- Accounts ---------------- */
function finOpenAccount(id){
  var a = FIN.acc.find(function(x){ return x.id===id; }) || {kind:'checking', balance_date:finToday()};
  var body = '<div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="fa-name" value="'+finEsc(a.name||'')+'" placeholder="e.g. Chase Business Checking"/></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Type</label><select class="form-input" id="fa-kind">'
    +[['checking','Checking'],['savings','Savings'],['cash','Cash'],['credit','Credit card']].map(function(k){ return '<option value="'+k[0]+'"'+(a.kind===k[0]?' selected':'')+'>'+k[1]+'</option>'; }).join('')+'</select></div>'
    +'<div class="form-group"><label class="form-label">Last 4 digits</label><input class="form-input" id="fa-last4" maxlength="4" value="'+finEsc(a.last4||'')+'"/></div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Current balance <span style="color:var(--tx3);">(card: what you owe)</span></label><input class="form-input" id="fa-bal" type="number" step="0.01" value="'+(a.balance==null?'':a.balance)+'"/></div>'
    +'<div class="form-group"><label class="form-label">As of</label><input class="form-input" id="fa-date" type="date" value="'+(a.balance_date||finToday())+'"/></div></div>';
  var del = id?'<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red);" onclick="finDelAccount(\''+id+'\')">Delete</button>':'';
  finModal(id?'Edit account':'Add bank account', body, async function(){
    var row={ business_id: await getBizId(), name:finV('fa-name'), kind:finV('fa-kind'), last4:finV('fa-last4')||null, balance:finNum(finV('fa-bal')), balance_date:finV('fa-date')||null };
    if(!row.name){ showAlert('Please enter a name.'); return false; }
    var r = id? await sb.from('fin_accounts').update(row).eq('id',id) : await sb.from('fin_accounts').insert(row);
    if(r.error) throw r.error;
    loadFinance();
  }, 'Save', del);
}
async function finDelAccount(id){
  var n = FIN.tx.filter(function(t){ return t.account_id===id; }).length;
  if(!confirm('Delete this account'+(n?' and its '+n+' transactions':'')+'? This cannot be undone.')) return;
  var r = await sb.from('fin_accounts').delete().eq('id',id);
  if(r.error) return showAlert('Error: '+r.error.message);
  finClose(); loadFinance();
}

/* ---------------- Transactions ---------------- */
function finOpenTx(id){
  var t = FIN.tx.find(function(x){ return x.id===id; }) || {direction:'out', tx_date:finToday()};
  var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Type</label><select class="form-input" id="ft-dir" onchange="document.getElementById(\'ft-cat\').innerHTML=finCatOptions(this.value,\'\')"><option value="out"'+(t.direction==='out'?' selected':'')+'>Money out</option><option value="in"'+(t.direction==='in'?' selected':'')+'>Money in</option></select></div>'
    +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" id="ft-date" value="'+t.tx_date+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Description</label><input class="form-input" id="ft-desc" value="'+finEsc(t.description||'')+'"/></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Amount</label><input class="form-input" type="number" step="0.01" min="0" id="ft-amt" value="'+(t.amount||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Category</label><select class="form-input" id="ft-cat">'+finCatOptions(t.direction,t.category)+'</select></div></div>'
    +'<div class="form-group"><label class="form-label">Account</label><select class="form-input" id="ft-acc"><option value="">— None —</option>'+FIN.acc.map(function(a){ return '<option value="'+a.id+'"'+(a.id===t.account_id?' selected':'')+'>'+finEsc(a.name)+'</option>'; }).join('')+'</select></div>';
  var del = id?'<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red);" onclick="finDelTx(\''+id+'\')">Delete</button>':'';
  finModal(id?'Edit transaction':'Add transaction', body, async function(){
    var amt=finNum(finV('ft-amt'));
    if(!amt || amt<0){ showAlert('Enter a valid amount.'); return false; }
    var row={ business_id: await getBizId(), direction:finV('ft-dir'), tx_date:finV('ft-date'), description:finV('ft-desc'), amount:amt, category:finV('ft-cat')||null, account_id:finV('ft-acc')||null };
    row.is_transfer = row.category==='Transfer';
    var r = id? await sb.from('fin_tx').update(row).eq('id',id) : await sb.from('fin_tx').insert(Object.assign({source:'manual'},row));
    if(r.error) throw r.error;
    loadFinance();
  }, 'Save', del);
}
async function finDelTx(id){
  if(!confirm('Delete this transaction?')) return;
  var r=await sb.from('fin_tx').delete().eq('id',id);
  if(r.error) return showAlert('Error: '+r.error.message);
  finClose(); loadFinance();
}
function finPattern(desc){
  return String(desc||'').toLowerCase().replace(/\d{3,}/g,' ').replace(/[#*]/g,' ').replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ');
}
async function finSetCat(id, cat){
  var t = FIN.tx.find(function(x){ return x.id===id; }); if(!t) return;
  var r = await sb.from('fin_tx').update({category:cat||null, is_transfer:cat==='Transfer'}).eq('id',id);
  if(r.error) return showAlert('Error: '+r.error.message);
  t.category=cat||null; t.is_transfer=cat==='Transfer';
  var p = finPattern(t.description), n=0;
  if(cat && p.length>=4){
    await sb.from('fin_rules').upsert({ business_id: await getBizId(), pattern:p, category:cat }, { onConflict:'business_id,pattern' });
    var same = FIN.tx.filter(function(x){ return x.id!==id && x.direction===t.direction && !x.category && finPattern(x.description)===p; });
    if(same.length){
      var ids = same.map(function(x){ return x.id; });
      var u = await sb.from('fin_tx').update({category:cat, is_transfer:cat==='Transfer'}).in('id', ids);
      if(!u.error){ same.forEach(function(x){ x.category=cat; x.is_transfer=cat==='Transfer'; }); n=same.length; }
    }
    var ex = FIN.rules.find(function(x){ return x.pattern===p; }); if(ex) ex.category=cat; else FIN.rules.push({pattern:p, category:cat});
  }
  finRender();
  if(n) showAlert('Also set '+n+' similar transaction(s) to "'+cat+'".');
}
function finGuessCat(desc, dir){
  var d = ' '+String(desc||'').toLowerCase()+' ';
  var p = finPattern(desc);
  var rule = FIN.rules.find(function(r){ return r.pattern===p; }) || FIN.rules.find(function(r){ return r.pattern.length>=4 && d.indexOf(r.pattern)>=0; });
  if(rule && (dir==='in'?FIN_IN:FIN_OUT).indexOf(rule.category)>=0) return rule.category;
  var map = dir==='in'?FIN_KW_IN:FIN_KW_OUT;
  for(var i=0;i<map.length;i++) for(var j=0;j<map[i][1].length;j++) if(d.indexOf(map[i][1][j])>=0) return map[i][0];
  return null;
}

/* ---------------- Statement upload ---------------- */
var FINUP = null;
function finOpenUpload(){
  if(!FIN.acc.length){ showAlert('First add the bank account or card this statement belongs to.'); finOpenAccount(); return; }
  var body = '<p style="font-size:13px;color:var(--tx2);margin-bottom:12px;">On your bank\'s website, open the account → <b>Download / Export transactions</b> → choose <b>CSV</b> or <b>Excel</b>. Then pick the file here. Transactions you already uploaded are skipped.</p>'
    +'<div class="form-group"><label class="form-label">Account</label><select class="form-input" id="fu-acc" onchange="finUpPreview()">'+FIN.acc.map(function(a){ return '<option value="'+a.id+'">'+finEsc(a.name)+'</option>'; }).join('')+'</select></div>'
    +'<div class="form-group"><label class="form-label">Statement file (.csv, .xlsx, .xls)</label><input class="form-input" type="file" id="fu-file" accept=".csv,.txt,.xlsx,.xls" onchange="finUpRead(this.files[0])"/></div>'
    +'<div id="fu-preview"></div>';
  FINUP=null;
  finModal('Upload bank statement', body, finUpSave, 'Import');
}
function finLoadXLSX(){
  return new Promise(function(res,rej){
    if(window.XLSX) return res();
    var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=function(){ res(); }; s.onerror=function(){ rej(new Error('Could not load the Excel reader')); };
    document.head.appendChild(s);
  });
}
function finParseCSV(text){
  var rows=[], row=[], f='', q=false;
  text = text.replace(/^﻿/,'');
  var delim = (text.split('\n')[0].split(';').length > text.split('\n')[0].split(',').length) ? ';' : ',';
  for(var i=0;i<text.length;i++){
    var c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else if(c==='"') q=true;
    else if(c===delim){ row.push(f); f=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(f); rows.push(row); row=[]; f=''; }
    else f+=c;
  }
  if(f||row.length){ row.push(f); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(x){ return String(x).trim()!==''; }); });
}
async function finUpRead(file){
  if(!file) return;
  var pv=document.getElementById('fu-preview'); pv.innerHTML='<div class="loading">Reading…</div>';
  try{
    var rows;
    if(/\.xlsx?$/i.test(file.name)){
      await finLoadXLSX();
      var wb = XLSX.read(await file.arrayBuffer(), {type:'array', cellDates:false});
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw:true, defval:''});
      rows = rows.filter(function(r){ return r.some(function(x){ return String(x).trim()!==''; }); });
    }else rows = finParseCSV(await file.text());
    FINUP = { rows: rows, cols: finDetect(rows), flip: false };
    var acc = FIN.acc.find(function(a){ return a.id===finV('fu-acc'); });
    FINUP.flip = !!(acc && acc.kind==='credit' && FINUP.cols.amount>=0);
    finUpPreview();
  }catch(e){ pv.innerHTML='<div style="color:var(--red);">Could not read the file: '+finEsc(e.message||e)+'</div>'; }
}
function finDetect(rows){
  var c={header:-1, date:-1, desc:-1, amount:-1, debit:-1, credit:-1, type:-1};
  for(var i=0;i<Math.min(rows.length,15);i++){
    var h = rows[i].map(function(x){ return String(x).toLowerCase().trim(); });
    var di = h.findIndex(function(x){ return /^(transaction |posting |post |trans\.? )?date$|^posted|^fecha|date$/.test(x); });
    if(di<0) continue;
    c.header=i; c.date=di;
    c.desc = h.findIndex(function(x){ return /desc|memo|payee|details|narrative|name|concepto|merchant/.test(x); });
    c.debit = h.findIndex(function(x){ return /debit|withdraw|cargo|money out|payments?$/.test(x); });
    c.credit = h.findIndex(function(x){ return /credit|deposit|abono|money in/.test(x) && !/card/.test(x); });
    c.amount = h.findIndex(function(x){ return /^amount|^monto|amount$|^importe/.test(x); });
    c.type = h.findIndex(function(x){ return /^(type|transaction type|cr\/dr|dr\/cr)$/.test(x); });
    if(c.debit>=0 && c.credit>=0) c.amount=-1;
    break;
  }
  if(c.header<0){
    var r=rows[0]||[]; c.header=-1;
    r.forEach(function(v,i){ if(c.date<0 && finDate(v)) c.date=i; else if(c.amount<0 && finAmt(v)!=null && i!==c.date) c.amount=i; else if(c.desc<0 && isNaN(Number(v))) c.desc=i; });
  }
  return c;
}
function finDate(v){
  if(v===''||v==null) return null;
  if(typeof v==='number'){ if(v>20000 && v<80000){ var d=new Date(Math.round((v-25569)*864e5)); return d.toISOString().slice(0,10); } return null; }
  var s=String(v).trim(), m;
  if((m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  if((m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/))){ var y=m[3].length===2?'20'+m[3]:m[3]; return y+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0'); }
  var t=Date.parse(s); if(!isNaN(t)){ var dd=new Date(t); return dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0'); }
  return null;
}
function finAmt(v){
  if(v===''||v==null) return null;
  if(typeof v==='number') return v;
  var s=String(v).trim(), neg=/^\(.*\)$/.test(s)||/^-/.test(s)||/-$/.test(s)||/\bDR\b/i.test(s);
  s=s.replace(/[^\d.]/g,''); if(!s) return null;
  var n=Number(s); if(isNaN(n)) return null;
  return neg?-n:n;
}
function finUpParsed(){
  if(!FINUP) return [];
  var c=FINUP.cols, out=[], start=c.header+1, acc=finV('fu-acc'), seen={};
  for(var i=start;i<FINUP.rows.length;i++){
    var r=FINUP.rows[i], date=finDate(r[c.date]); if(!date) continue;
    var amt=null;
    if(c.amount>=0){ amt=finAmt(r[c.amount]); if(amt!=null && c.type>=0 && /debit|dr|withdraw/i.test(String(r[c.type]))) amt=-Math.abs(amt); }
    else { var d=finAmt(r[c.debit]), cr=finAmt(r[c.credit]); if(d) amt=-Math.abs(d); else if(cr) amt=Math.abs(cr); }
    if(amt==null || amt===0) continue;
    if(FINUP.flip) amt=-amt;
    var desc=String(c.desc>=0?r[c.desc]:'').trim().replace(/\s+/g,' ');
    var dir=amt>0?'in':'out', base=acc+'|'+date+'|'+amt.toFixed(2)+'|'+desc.toLowerCase().slice(0,60);
    seen[base]=(seen[base]||0)+1;
    out.push({ account_id:acc, tx_date:date, description:desc, amount:Math.abs(amt), direction:dir, category:finGuessCat(desc,dir), dedupe_key:base+'|'+seen[base], source:'statement' });
  }
  var have={}; FIN.tx.forEach(function(t){ if(t.dedupe_key) have[t.dedupe_key]=1; });
  out.forEach(function(o){ o.dup=!!have[o.dedupe_key]; });
  return out;
}
function finUpPreview(){
  var pv=document.getElementById('fu-preview'); if(!pv||!FINUP) return;
  var c=FINUP.cols;
  if(c.date<0 || (c.amount<0 && (c.debit<0||c.credit<0) && c.debit<0)){
    pv.innerHTML='<div style="color:var(--red);font-size:13px;">I couldn\'t find the date and amount columns in this file. Try the CSV export from your bank.</div>'; return;
  }
  var L=finUpParsed(), nw=L.filter(function(x){ return !x.dup; });
  var inn=nw.filter(function(x){return x.direction==='in';}).reduce(function(s,x){return s+x.amount;},0);
  var out=nw.filter(function(x){return x.direction==='out';}).reduce(function(s,x){return s+x.amount;},0);
  var unc=nw.filter(function(x){return !x.category;}).length;
  var dates=L.map(function(x){return x.tx_date;}).sort();
  pv.innerHTML = '<div style="background:var(--bg);border-radius:10px;padding:12px;font-size:13px;">'
    +'<div><b>'+nw.length+'</b> new · '+(L.length-nw.length)+' already uploaded'+(dates.length?' · '+fmtD(dates[0])+' – '+fmtD(dates[dates.length-1]):'')+'</div>'
    +'<div style="margin-top:4px;"><span style="color:var(--green);">In '+fmt(inn)+'</span> · <span style="color:var(--red);">Out '+fmt(out)+'</span>'+(unc?' · <span style="color:var(--amber);">'+unc+' to categorize after</span>':'')+'</div>'
    +'<label style="display:flex;gap:6px;align-items:center;margin-top:8px;font-size:12px;"><input type="checkbox" '+(FINUP.flip?'checked':'')+' onchange="FINUP.flip=this.checked;finUpPreview()"/> Swap in/out (use if charges show as money in)</label></div>'
    +'<div style="max-height:220px;overflow:auto;margin-top:10px;"><table style="font-size:12px;"><tbody>'
    + nw.slice(0,30).map(function(x){ return '<tr><td style="padding:6px 8px;">'+fmtD(x.tx_date)+'</td><td style="padding:6px 8px;">'+finEsc(x.description)+'</td><td style="padding:6px 8px;color:var(--tx3);">'+(x.category||'')+'</td><td style="padding:6px 8px;text-align:right;color:'+(x.direction==='in'?'var(--green)':'var(--tx)')+'">'+(x.direction==='in'?'+':'−')+fmt(x.amount)+'</td></tr>'; }).join('')
    +'</tbody></table>'+(nw.length>30?'<div style="font-size:12px;color:var(--tx3);padding:6px;">…and '+(nw.length-30)+' more</div>':'')+'</div>';
}
async function finUpSave(){
  if(!FINUP){ showAlert('Choose a file first.'); return false; }
  var nw=finUpParsed().filter(function(x){ return !x.dup; });
  if(!nw.length){ showAlert('Nothing new to import.'); return false; }
  var bid=await getBizId();
  var rows=nw.map(function(x){ return { business_id:bid, account_id:x.account_id, tx_date:x.tx_date, description:x.description, amount:x.amount, direction:x.direction, category:x.category, is_transfer:x.category==='Transfer', source:'statement', dedupe_key:x.dedupe_key }; });
  for(var i=0;i<rows.length;i+=500){
    var r=await sb.from('fin_tx').upsert(rows.slice(i,i+500), { onConflict:'business_id,dedupe_key', ignoreDuplicates:true });
    if(r.error) throw r.error;
  }
  var last=nw.map(function(x){return x.tx_date;}).sort().pop();
  FIN.month = finYM(last);
  loadFinance();
  setTimeout(function(){ showAlert('Imported '+rows.length+' transactions. Remember to update the account balance to match your statement.'); }, 300);
}

/* ---------------- Debts & contracts ---------------- */
function finOpenDebt(id){
  var d = FIN.debts.find(function(x){ return x.id===id; }) || {frequency:'monthly'};
  var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="fd-name" value="'+finEsc(d.name||'')+'" placeholder="e.g. Truck loan"/></div>'
    +'<div class="form-group"><label class="form-label">Lender</label><input class="form-input" id="fd-lender" value="'+finEsc(d.lender||'')+'"/></div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Balance owed</label><input class="form-input" type="number" step="0.01" id="fd-bal" value="'+(d.balance==null?'':d.balance)+'" placeholder="Unknown"/></div>'
    +'<div class="form-group"><label class="form-label">APR %</label><input class="form-input" type="number" step="0.01" id="fd-apr" value="'+(d.apr==null?'':d.apr)+'"/></div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;"><div class="form-group"><label class="form-label">Payment</label><input class="form-input" type="number" step="0.01" id="fd-pay" value="'+(d.payment==null?'':d.payment)+'"/></div>'
    +'<div class="form-group"><label class="form-label">How often</label><select class="form-input" id="fd-freq">'+[['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly']].map(function(f){ return '<option value="'+f[0]+'"'+(d.frequency===f[0]?' selected':'')+'>'+f[1]+'</option>'; }).join('')+'</select></div>'
    +'<div class="form-group"><label class="form-label">Ends</label><input class="form-input" type="date" id="fd-end" value="'+(d.end_date||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="fd-notes" value="'+finEsc(d.notes||'')+'"/></div>';
  var del = id?'<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red);" onclick="finDelDebt(\''+id+'\')">Delete</button>':'';
  finModal(id?'Edit loan':'Add loan', body, async function(){
    var row={ business_id:await getBizId(), name:finV('fd-name'), lender:finV('fd-lender')||null, balance:finNum(finV('fd-bal')), apr:finNum(finV('fd-apr')), payment:finNum(finV('fd-pay')), frequency:finV('fd-freq'), end_date:finV('fd-end')||null, notes:finV('fd-notes')||null, updated_at:new Date().toISOString() };
    if(!row.name){ showAlert('Please enter a name.'); return false; }
    var r = id? await sb.from('fin_debts').update(row).eq('id',id) : await sb.from('fin_debts').insert(row);
    if(r.error) throw r.error;
    loadFinance();
  }, 'Save', del);
}
async function finDelDebt(id){
  if(!confirm('Delete this loan and its contracts?')) return;
  var bid=await getBizId();
  var l=await sb.storage.from('fin-contracts').list(bid+'/'+id);
  if(l.data && l.data.length) await sb.storage.from('fin-contracts').remove(l.data.map(function(f){ return bid+'/'+id+'/'+f.name; }));
  var r=await sb.from('fin_debts').delete().eq('id',id);
  if(r.error) return showAlert('Error: '+r.error.message);
  finClose(); loadFinance();
}
async function finLoadDocCounts(){
  FIN.docCounts={};
  var bid=await getBizId();
  await Promise.all(FIN.debts.map(async function(d){
    var l=await sb.storage.from('fin-contracts').list(bid+'/'+d.id);
    FIN.docCounts[d.id]=(l.data||[]).filter(function(f){ return f.name && f.name!=='.emptyFolderPlaceholder'; }).length;
  }));
}
async function finShowDocs(id){
  var d=FIN.debts.find(function(x){ return x.id===id; }); if(!d) return;
  var bid=await getBizId(), path=bid+'/'+id;
  var l=await sb.storage.from('fin-contracts').list(path,{sortBy:{column:'created_at',order:'desc'}});
  var files=(l.data||[]).filter(function(f){ return f.name && f.name!=='.emptyFolderPlaceholder'; });
  var body='<p style="font-size:13px;color:var(--tx2);margin-bottom:10px;">Contracts, statements or payoff letters for <b>'+finEsc(d.name)+'</b>. Only you can see them.</p>'
    +'<div style="margin-bottom:12px;">'+(files.length?files.map(function(f){
      var nice=f.name.replace(/^\d+-/,'');
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border2);"><span style="flex:1;font-size:13px;word-break:break-all;">📄 '+finEsc(nice)+'</span>'
        +'<button class="btn btn-outline btn-xs" onclick="finOpenDoc(\''+path+'/'+encodeURIComponent(f.name)+'\')">Open</button>'
        +'<button class="btn btn-outline btn-xs" style="color:var(--red);" onclick="finDelDoc(\''+id+'\',\''+path+'/'+encodeURIComponent(f.name)+'\')">✕</button></div>';
    }).join(''):'<div class="empty" style="padding:12px;">No files yet</div>')+'</div>'
    +'<input type="file" class="form-input" id="fdoc-file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"/>'
    +'<div id="fdoc-msg" style="font-size:12px;color:var(--tx3);margin-top:6px;">PDF or photos, up to 25 MB each.</div>';
  finModal('Contracts · '+finEsc(d.name), body, async function(){
    var fl=document.getElementById('fdoc-file').files;
    if(!fl.length){ showAlert('Choose a file.'); return false; }
    for(var i=0;i<fl.length;i++){
      var safe=fl[i].name.replace(/[^\w.\-]+/g,'_');
      var r=await sb.storage.from('fin-contracts').upload(path+'/'+Date.now()+'-'+safe, fl[i], {upsert:false});
      if(r.error) throw r.error;
    }
    await finLoadDocCounts(); finRender(); finShowDocs(id); return false;
  }, 'Upload');
}
async function finOpenDoc(p){
  var w=window.open('', '_blank');
  var r=await sb.storage.from('fin-contracts').createSignedUrl(decodeURIComponent(p), 300);
  if(r.error){ if(w) w.close(); return showAlert('Error: '+r.error.message); }
  if(w) w.location=r.data.signedUrl; else location.href=r.data.signedUrl;
}
async function finDelDoc(id,p){
  if(!confirm('Delete this file?')) return;
  var r=await sb.storage.from('fin-contracts').remove([decodeURIComponent(p)]);
  if(r.error) return showAlert('Error: '+r.error.message);
  await finLoadDocCounts(); finRender(); finShowDocs(id);
}

/* ---------------- Export ---------------- */
function finExportCSV(){
  var yr=FIN.month.slice(0,4);
  var accName={}; FIN.acc.forEach(function(a){ accName[a.id]=a.name; });
  var list=FIN.tx.filter(function(t){ return String(t.tx_date).slice(0,4)===yr; }).sort(function(a,b){ return a.tx_date<b.tx_date?-1:1; });
  var q=function(s){ return '"'+String(s==null?'':s).replace(/"/g,'""')+'"'; };
  var lines=[['Date','Description','Account','Type','Category','Amount'].join(',')];
  list.forEach(function(t){ lines.push([t.tx_date,q(t.description),q(accName[t.account_id]||''),t.direction==='in'?'Money in':'Money out',q(t.category||'Uncategorized'),(t.direction==='in'?'':'-')+Number(t.amount).toFixed(2)].join(',')); });
  lines.push(''); lines.push('Summary '+yr);
  var tot=finTotals(list);
  lines.push('Revenue,'+tot.rev.toFixed(2)); lines.push('Business expenses,'+tot.exp.toFixed(2)); lines.push('Net profit,'+tot.profit.toFixed(2));
  lines.push('Loan & card payments,'+tot.loans.toFixed(2)); lines.push('Owner draws,'+tot.draws.toFixed(2));
  lines.push(''); lines.push('Expenses by category');
  Object.entries(tot.cats).sort(function(a,b){return b[1]-a[1];}).forEach(function(c){ lines.push(q(c[0])+','+c[1].toFixed(2)); });
  var blob=new Blob([lines.join('\n')],{type:'text/csv'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='finance-'+yr+'.csv'; document.body.appendChild(a); a.click(); a.remove();
}
