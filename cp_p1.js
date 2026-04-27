// ============================================================
// P1.JS — AUTH, NAVIGATION, HELPERS — CleanPro TX
// ============================================================
var sb = supabase.createClient(
  'https://yfqoncqoerleoaqxvaie.supabase.co',
  'sb_publishable_cbrrFqLqJMkUXJ4icNOn9g_lEv4NneF'
);

// ---- FORMAT HELPERS ----
function fmt(v){ return '$'+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtD(d){ return d?new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'--'; }
function fmtT(t){ if(!t)return '--'; var p=t.split(':'),h=parseInt(p[0]),m=p[1]; return (h%12||12)+':'+m+(h<12?' AM':' PM'); }

function bdg(s){
  var map={
    'Scheduled':'b-scheduled','In progress':'b-progress','Completed':'b-completed',
    'Paid':'b-paid','Invoiced':'b-invoiced','Overdue':'b-overdue','Draft':'b-draft',
    'Sent':'b-sent','Cancelled':'b-cancelled','New':'b-new','new':'b-new',
    'Active':'b-active','Inactive':'b-inactive','Approved':'b-completed',
    'Declined':'b-cancelled','Expired':'b-cancelled','Awaiting':'b-progress',
    'accepted':'b-active','declined':'b-cancelled','converted':'b-completed',
    'pending':'b-new','To confirm':'b-progress','trial':'b-new'
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
  var res = await sb.from('businesses').select('id,business_name,plan,owner_name').limit(1).single();
  if(res.data){
    _bizId = res.data.id;
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
  getBizId();
  if(id==='schedule')    loadSchedule();
  else if(id==='calendar')   {}
  else if(id==='leads')      loadLeads();
  else if(id==='clients')    loadClients();
  else if(id==='jobs')       loadJobs();
  else if(id==='quotes')     loadQuotes();
  else if(id==='invoices')   loadInvoices();
  else if(id==='payments')   loadPayments();
  else if(id==='expenses')   loadExpenses();
  else if(id==='accounting') loadReports();
  else if(id==='acct')       loadAcct();
  else if(id==='marketing')  {}
  else if(id==='settings')   loadSettings();
  else if(id==='gallery')    loadGallery();
  else if(id==='timesheets') loadTimesheets();
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
