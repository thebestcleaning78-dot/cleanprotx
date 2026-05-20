// ============================================================
// P1.JS — AUTH, NAVIGATION, HELPERS — CleanPro TX
// ============================================================
// ---- DUAL SUPABASE CONNECTIONS ----
// CleanPro TX — main database for pros (clients, jobs, invoices, payments)
var sb = supabase.createClient(
  'https://kpahdvgwpeyggilujzsd.supabase.co',
  'sb_publishable_5WdCIgjYNfjJeu1kZpmJQw_Ymt3UjMx'
);

// CleanSaver AI — leads database (read-only for leads)
var sbLeads = supabase.createClient(
  'https://yfqoncqoerleoaqxvaie.supabase.co',
  'sb_publishable_cbrrFqLqJMkUXJ4icNOn9g_lEv4NneF'
);

// ---- FORMAT HELPERS ----
function fmt(v){ return '$'+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtD(d){ if(!d) return '--'; var clean=d.toString().slice(0,10); return new Date(clean+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function fmtT(t){ if(!t)return '--'; var p=t.split(':'),h=parseInt(p[0]),m=p[1]; return (h%12||12)+':'+m+(h<12?' AM':' PM'); }

function bdg(s){
  var map={
    'Scheduled':'b-scheduled','In progress':'b-progress','Completed':'b-completed',
    'Paid':'b-paid','Invoiced':'b-invoiced','Overdue':'b-overdue','Draft':'b-draft',
    'Sent':'b-sent','Cancelled':'b-cancelled','New':'b-new','new':'b-new',
    'Active':'b-active','Inactive':'b-inactive','Approved':'b-completed',
    'Declined':'b-cancelled','Expired':'b-cancelled','Awaiting':'b-progress',
    'accepted':'b-active','declined':'b-cancelled','converted':'b-completed',
    'claimed':'b-active','pending':'b-new','To confirm':'b-progress','trial':'b-new'
  };
  return '<span class="badge '+(map[s]||'b-draft')+'">'+s+'</span>';
}

function mapsBtn(addr){
  if(!addr)return '';
  return '<button onclick="window.open(\'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(addr)+'\')" class="btn btn-outline btn-xs">Map</button>';
}
function smsBtn(id){
  return '<button onclick="doSMS(\''+id+'\')" class="btn btn-outline btn-xs">SMS</button>';
}
function photoBtn(id){
  return '<button onclick="doPhotos(\''+id+'\')" class="btn btn-outline btn-xs">Photos</button>';
}

// ---- GLOBAL STATE ----
var _cur = 'schedule';
var _jobs = [];
var _allClients = [];
var _allQuotes = [];
var _allInvoices = [];
var _allPayments = [];
var _smsJob = {};
var _photoJobId = '';
var _bf = null, _af = null;
var _bizId = null;

// Get business_id for current user
async function getBizId(){
  if(_bizId) return _bizId;
  var res = await sb.from('businesses').select('id,business_name,plan,owner_name,email').limit(1).single();
  if(res.data){
    _bizId = res.data.id;
    window._currentBusinessId = _bizId;
    window._supabase = sb;
    try{ document.querySelector('.logo-text').textContent = res.data.business_name; }catch(e){}
    try{ document.querySelector('.logo-sub').textContent = (res.data.plan||'Basic')+' Plan'; }catch(e){}
    try{
      var greet = new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening';
      var name = res.data.owner_name ? res.data.owner_name.split(' ')[0] : 'there';
      var el = document.getElementById('welcome-msg');
      if(el) el.textContent = greet+', '+name+'!';
    }catch(e){}
  }
  return _bizId;
}

// ---- AUTH ----
sb.auth.getSession().then(function(res){
  if(!res.data.session) window.location.href = '/login.html';
});
sb.auth.getUser().then(function(res){
  var user = res.data.user;
  if(user){
    var name = (user.user_metadata && user.user_metadata.full_name) || user.email || '';
    var initials = name.split(' ').map(function(n){return n[0]||'';}).join('').slice(0,2).toUpperCase()||'P';
    try{ document.getElementById('user-name').textContent = name; }catch(e){}
    try{ document.getElementById('user-av').textContent = initials; }catch(e){}
  }
});

// ---- NAVIGATION ----
function nav(id, el){
  document.querySelectorAll('.sec').forEach(function(s){ s.classList.remove('on'); });
  document.querySelectorAll('.ni').forEach(function(n){ n.classList.remove('on'); });
  var sec = document.getElementById('s-'+id);
  if(sec) sec.classList.add('on');
  if(el) el.classList.add('on');
  _cur = id;
  var titles = {
    schedule:'Dashboard', calendar:'Calendar', leads:'Leads',
    clients:'Clients', jobs:'Jobs', quotes:'Estimates',
    invoices:'Invoices', payments:'Payments', expenses:'Expenses',
    accounting:'Reports', acct:'Accounting', gallery:'Gallery',
    timesheets:'Timesheets', apps:'Apps', marketing:'Marketing',
    settings:'Settings'
  };
  try{ document.getElementById('ptitle').textContent = titles[id] || id; }catch(e){}
  loadSec(id);
}

function loadSec(id){
  // Siempre asegurar que _bizId esté disponible antes de cargar
  if(id==='schedule')    getBizId().then(function(){ loadSchedule(); });
  else if(id==='calendar')   {}
  else if(id==='leads')      getBizId().then(function(){ loadLeads(); });
  else if(id==='clients')    getBizId().then(function(){ loadClients(); });
  else if(id==='jobs')       getBizId().then(function(){ loadJobs(); });
  else if(id==='quotes')     getBizId().then(function(){ loadQuotes(); });
  else if(id==='invoices')   getBizId().then(function(){ loadInvoices(); });
  else if(id==='payments')   getBizId().then(function(){ loadPayments(); });
  else if(id==='expenses')   getBizId().then(function(){ loadExpenses(); });
  else if(id==='accounting') getBizId().then(function(){ loadReports(); });
  else if(id==='acct')       getBizId().then(function(){ loadAcct(); });
  else if(id==='marketing')  {}
  else if(id==='settings')   getBizId().then(function(){ loadSettings(); });
  else if(id==='gallery')    loadGallery();
  else if(id==='timesheets') getBizId().then(function(){ loadTimesheets(); });
}

// ---- LOGOUT ----
async function doLogout(){
  await sb.auth.signOut();
  window.location.href = '/login.html';
}

// ---- FILTERS ----
function filterClients(q){
  document.querySelectorAll('#clients-table tr').forEach(function(r){
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function filterClientStatus(s){ loadClients(s); }
function filterJobs(q){
  document.querySelectorAll('#jobs-table tr').forEach(function(r){
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function filterJobStatus(s){ loadJobs(s); }
function filterInvoices(q){
  document.querySelectorAll('#invoices-table tr').forEach(function(r){
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function filterInvoiceStatus(s){ loadInvoices(s); }
function filterQuoteStatus(s){ loadQuotes(s); }

// ---- REALTIME PAYMENT NOTIFICATIONS ----
var _notifCount = 0;

function initRealtimeNotifications(){
  getBizId().then(function(bid){
    if(!bid) return;

    // Escuchar cambios en invoices — cuando status cambia a Paid
    sb.channel('invoice-payments')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'invoices',
        filter: 'business_id=eq.'+bid
      }, function(payload){
        var newRow = payload.new;
        var oldRow = payload.old;
        // Solo notificar cuando cambia a Paid
        if(newRow.status === 'Paid' && oldRow.status !== 'Paid'){
          showPaymentNotification(newRow.client_name, newRow.amount);
          // Actualizar KPIs si estamos en el dashboard
          if(_cur === 'schedule') loadSchedule();
          if(_cur === 'invoices') loadInvoices();
          if(_cur === 'payments') loadPayments();
        }
      })
      .subscribe();
  });
}

function showPaymentNotification(clientName, amount){
  _notifCount++;
  
  // Mostrar badge en sidebar
  updateNotifBadge();

  // Mostrar toast notification
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#065F46,#10B981);color:#fff;padding:16px 20px;border-radius:14px;box-shadow:0 8px 24px rgba(16,185,129,0.4);z-index:9999;min-width:280px;animation:slideIn 0.3s ease;';
  toast.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">'
    + '<div style="font-size:28px;">💰</div>'
    + '<div>'
    + '<div style="font-size:14px;font-weight:700;margin-bottom:2px;">Payment received!</div>'
    + '<div style="font-size:13px;opacity:0.9;">' + (clientName||'Client') + ' paid <strong>$' + Number(amount||0).toFixed(2) + '</strong></div>'
    + '</div>'
    + '<button onclick="this.parentElement.parentElement.remove()" style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">×</button>'
    + '</div>';
  
  // Agregar animación CSS
  if(!document.getElementById('notif-style')){
    var style = document.createElement('style');
    style.id = 'notif-style';
    style.textContent = '@keyframes slideIn{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}';
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Auto-remover después de 6 segundos
  setTimeout(function(){ 
    if(toast.parentElement) toast.remove(); 
  }, 6000);

  // Sonido de notificación
  try{
    var ctx = new AudioContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }catch(e){}
}

function updateNotifBadge(){
  // Agregar badge al nav de Payments
  var payNav = document.querySelector('.ni[onclick*="payments"]');
  if(payNav){
    var badge = payNav.querySelector('.nbadge') || document.createElement('span');
    badge.className = 'nbadge';
    badge.style.background = '#10B981';
    badge.textContent = _notifCount;
    badge.style.display = 'inline';
    if(!payNav.querySelector('.nbadge')) payNav.appendChild(badge);
  }
}

// Iniciar cuando carga el dashboard
setTimeout(initRealtimeNotifications, 2000);
