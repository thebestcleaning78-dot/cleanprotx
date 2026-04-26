// ============================================================
// P3.JS — ALL UI FUNCTIONS (MODALS, EDIT, DELETE, PHOTOS, SMS, AI)
// ============================================================

// ---- CUSTOM ALERT / CONFIRM ----
function showAlert(msg, cb){
  var bg = document.getElementById('alert-modal-bg');
  if(!bg){
    bg = document.createElement('div'); bg.id='alert-modal-bg';
    bg.style.cssText='position:fixed;inset:0;background:rgba(17,24,39,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;';
    bg.innerHTML='<div class="alert-box"><div class="alert-msg" id="alert-msg"></div><div class="alert-btns"><button id="alert-ok" class="btn btn-primary" style="width:100%;">OK</button></div></div>';
    document.body.appendChild(bg);
  }
  document.getElementById('alert-msg').textContent = msg;
  bg.style.display='flex';
  document.getElementById('alert-ok').onclick = function(){ bg.style.display='none'; if(cb)cb(); };
}

function showConfirm(msg, onYes, onNo){
  var bg = document.getElementById('confirm-modal-bg');
  if(!bg){
    bg = document.createElement('div'); bg.id='confirm-modal-bg';
    bg.style.cssText='position:fixed;inset:0;background:rgba(17,24,39,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;';
    bg.innerHTML='<div class="alert-box"><div class="alert-msg" id="confirm-msg"></div><div class="alert-btns"><button id="confirm-no" class="btn btn-outline" style="flex:1;">Cancel</button><button id="confirm-yes" class="btn btn-danger" style="flex:1;">Confirm</button></div></div>';
    document.body.appendChild(bg);
  }
  document.getElementById('confirm-msg').textContent = msg;
  bg.style.display='flex';
  document.getElementById('confirm-yes').onclick = function(){ bg.style.display='none'; if(onYes)onYes(); };
  document.getElementById('confirm-no').onclick  = function(){ bg.style.display='none'; if(onNo)onNo(); };
}

// ---- MODAL FORMS ----
var _curM = '';
var _mForms = {
  client:{
    t:'New Client',
    f:'<div class="form-row"><div class="form-group"><label class="form-label">Full name *</label><input class="form-input" id="f-name" placeholder="Client name"/></div>'
     +'<div class="form-group"><label class="form-label">Type</label><select class="form-input" id="f-type"><option>Residential</option><option>Commercial</option></select></div></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="f-phone" type="tel" placeholder="(806) 555-0000"/></div>'
     +'<div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" type="email" placeholder="email@example.com"/></div></div>'
     +'<div class="form-group"><label class="form-label">Service address</label><input class="form-input" id="f-address" placeholder="Street address, Lubbock TX"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Cleaning frequency</label><select class="form-input" id="f-frequency"><option value="Weekly">Weekly — every week</option><option value="Biweekly">Biweekly — every 2 weeks</option><option value="3 Weeks">Every 3 weeks</option><option value="Monthly" selected>Monthly — once a month</option><option value="One-time">One-time only</option></select></div>'
     +'<div class="form-group"><label class="form-label">Price per visit ($)</label><input class="form-input" id="f-price" type="number" step="0.01" placeholder="0.00"/></div></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">First appointment date</label><input class="form-input" id="f-start-date" type="date"/></div>'
     +'<div class="form-group"><label class="form-label">Appointment time</label><input class="form-input" id="f-start-time" type="time" value="09:00"/></div></div>'
     +'<div class="form-group"><label class="form-label">Notes (optional)</label><input class="form-input" id="f-notes" placeholder="Internal notes..."/></div>'
  },
  job:{
    t:'New Job',
    f:'<div class="form-group"><label class="form-label">Client name *</label><input class="form-input" id="f-client" placeholder="Client name"/></div>'
     +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" placeholder="e.g. Regular cleaning"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" step="0.01" placeholder="0.00"/></div>'
     +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status"><option>Scheduled</option><option>In progress</option><option>To confirm</option><option>Completed</option></select></div></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date"/></div>'
     +'<div class="form-group"><label class="form-label">Time</label><input class="form-input" id="f-time" type="time"/></div></div>'
     +'<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" placeholder="Street address"/></div>'
     +'<div class="form-group"><label class="form-label">Repeat</label><select class="form-input" id="f-recur"><option value="none">Does not repeat</option><option value="weekly">Every week</option><option value="biweekly">Every 2 weeks</option><option value="3weeks">Every 3 weeks</option><option value="monthly">Every month</option><option value="yearly">Every year</option></select></div>'
     +'<div id="f-recur-end-row" style="display:none;"><div class="form-group"><label class="form-label">Repeat for</label><select class="form-input" id="f-recur-end"><option value="6">6 months</option><option value="12" selected>12 months</option><option value="18">18 months</option><option value="24">24 months</option><option value="36">3 years</option></select></div></div>'
     +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" placeholder="Internal notes..."/></div>'
  },
  quote:{
    t:'New Estimate',
    f:'<div class="form-group"><label class="form-label">Client name *</label><input class="form-input" id="f-client" placeholder="Client name"/></div>'
     +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" placeholder="e.g. Deep cleaning"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($) *</label><input class="form-input" id="f-amount" type="number" step="0.01" placeholder="0.00"/></div>'
     +'<div class="form-group"><label class="form-label">Expiry date</label><input class="form-input" id="f-date" type="date"/></div></div>'
     +'<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" placeholder="Service address"/></div>'
     +'<div class="form-group"><label class="form-label">Notes / Terms</label><input class="form-input" id="f-notes" placeholder="Terms and conditions..."/></div>'
  },
  invoice:{
    t:'New Invoice',
    f:'<div class="form-group"><label class="form-label">Client name *</label><input class="form-input" id="f-client" placeholder="Client name"/></div>'
     +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" placeholder="e.g. Regular Cleaning"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($) *</label><input class="form-input" id="f-amount" type="number" step="0.01" placeholder="0.00"/></div>'
     +'<div class="form-group"><label class="form-label">Due date</label><input class="form-input" id="f-due" type="date"/></div></div>'
     +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" placeholder="Thank you for your business!"/></div>'
  },
  payment:{
    t:'Record Payment',
    f:'<div class="form-group"><label class="form-label">Client name *</label><input class="form-input" id="f-client" placeholder="Client name"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($) *</label><input class="form-input" id="f-amount" type="number" step="0.01" placeholder="0.00"/></div>'
     +'<div class="form-group"><label class="form-label">Method</label><select class="form-input" id="f-method"><option>Card</option><option>Cash</option><option>Zelle</option><option>Venmo</option><option>Check</option><option>ACH</option></select></div></div>'
     +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date"/></div>'
  },
  expense:{
    t:'Add Expense',
    f:'<div class="form-group"><label class="form-label">Description *</label><input class="form-input" id="f-desc" placeholder="e.g. Cleaning supplies"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Category</label><select class="form-input" id="f-cat"><option>Supplies</option><option>Transportation</option><option>Equipment</option><option>Marketing</option><option>Insurance</option><option>Other</option></select></div>'
     +'<div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" step="0.01" placeholder="0.00"/></div></div>'
     +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date"/></div>'
  },
  timesheet:{
    t:'Log Time',
    f:'<div class="form-group"><label class="form-label">Employee *</label><input class="form-input" id="f-emp" value="Maria Mendoza"/></div>'
     +'<div class="form-group"><label class="form-label">Job description</label><input class="form-input" id="f-job" placeholder="e.g. House cleaning"/></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date"/></div>'
     +'<div class="form-group"><label class="form-label">Hours</label><input class="form-input" id="f-hours" type="number" step="0.5" placeholder="0"/></div></div>'
     +'<div class="form-row"><div class="form-group"><label class="form-label">Start time</label><input class="form-input" id="f-start" type="time"/></div>'
     +'<div class="form-group"><label class="form-label">End time</label><input class="form-input" id="f-end" type="time"/></div></div>'
  }
};

function openModal(type){
  _curM = type;
  var c = _mForms[type]; if(!c) return;
  document.getElementById('modal-title').textContent = c.t;
  document.getElementById('modal-body').innerHTML = c.f;
  document.getElementById('modal-save').onclick = saveModal;
  document.getElementById('modal-bg').classList.add('open');
  // Show/hide recur end for jobs
  if(type==='job'){
    var rsel = document.getElementById('f-recur');
    if(rsel) rsel.addEventListener('change', function(){
      var row = document.getElementById('f-recur-end-row');
      if(row) row.style.display = this.value==='none'?'none':'block';
    });
  }
}
function closeModal(){
  document.getElementById('modal-bg').classList.remove('open');
}

async function saveModal(){
  var btn = document.getElementById('modal-save');
  btn.textContent='Saving...'; btn.disabled=true;
  function g(id){ var el=document.getElementById(id); return el?el.value:''; }
  var tbl, dat;
  try{
    if(_curM==='client'){
      var freq=g('f-frequency')||'Monthly', cname=g('f-name'), cphone=g('f-phone');
      var startDate=g('f-start-date')||new Date().toISOString().slice(0,10);
      var startTime=g('f-start-time')||'09:00';
      var price=parseFloat(g('f-price'))||0;
      tbl='clients';
      dat={name:cname,type:g('f-type'),phone:cphone,email:g('f-email'),address:g('f-address'),frequency:freq,price_per_visit:price,status:'Active',notes:g('f-notes')};
      if(freq && freq!=='One-time'){
        setTimeout(async function(){ await autoScheduleJobs(cname,cphone,g('f-address'),freq,startDate,startTime,price); }, 800);
      }
    }
    else if(_curM==='job'){
      var recur=g('f-recur')||'none';
      var jRes=await sb.from('jobs').select('job_number').order('job_number',{ascending:false}).limit(1);
      var jn=(jRes.data&&jRes.data.length?(jRes.data[0].job_number||0):0)+1;
      tbl='jobs';
      dat={job_number:jn,client_name:g('f-client'),service:g('f-service'),amount:parseFloat(g('f-amount'))||0,scheduled_date:g('f-date')||null,scheduled_time:g('f-time')||null,address:g('f-address'),status:g('f-status')||'Scheduled',notes:g('f-notes')};
      // Handle recurrence
      if(recur!=='none' && g('f-date')){
        var endMonths=parseInt(g('f-recur-end'))||12;
        setTimeout(async function(){
          await createRecurringJobs(dat, recur, endMonths, jn);
        }, 800);
      }
    }
    else if(_curM==='quote'){
      var qRes=await sb.from('quotes').select('quote_number').order('quote_number',{ascending:false}).limit(1);
      var qn=(qRes.data&&qRes.data.length?(qRes.data[0].quote_number||0):0)+1;
      tbl='quotes';
      dat={quote_number:qn,client_name:g('f-client'),service:g('f-service'),amount:parseFloat(g('f-amount'))||0,expiry_date:g('f-date')||null,address:g('f-address'),status:'Draft',notes:g('f-notes')};
    }
    else if(_curM==='invoice'){
      var iRes=await sb.from('invoices').select('invoice_number').order('invoice_number',{ascending:false}).limit(1);
      var invN=(iRes.data&&iRes.data.length?(iRes.data[0].invoice_number||0):0)+1;
      var dd=new Date(); dd.setDate(dd.getDate()+7);
      tbl='invoices';
      dat={invoice_number:invN,client_name:g('f-client'),service:g('f-service'),description:g('f-service'),amount:parseFloat(g('f-amount'))||0,balance:parseFloat(g('f-amount'))||0,due_date:g('f-due')||dd.toISOString().slice(0,10),issue_date:new Date().toISOString().slice(0,10),status:'Draft',tax_rate:0,discount:0,notes:g('f-notes')};
    }
    else if(_curM==='payment'){
      tbl='payments';
      dat={client_name:g('f-client'),amount:parseFloat(g('f-amount'))||0,method:g('f-method'),payment_date:g('f-date')||new Date().toISOString().slice(0,10),status:'Paid'};
    }
    else if(_curM==='expense'){
      tbl='expenses';
      dat={description:g('f-desc'),category:g('f-cat'),amount:parseFloat(g('f-amount'))||0,expense_date:g('f-date')||new Date().toISOString().slice(0,10)};
    }
    else if(_curM==='timesheet'){
      tbl='timesheets';
      dat={employee_name:g('f-emp'),job_description:g('f-job'),work_date:g('f-date')||null,start_time:g('f-start')||null,end_time:g('f-end')||null,duration_hours:parseFloat(g('f-hours'))||0};
    }
    if(tbl){
      // Add business_id to all inserts
      var bid = await getBizId();
      if(bid) dat.business_id = bid;
      var res = await sb.from(tbl).insert([dat]);
      if(res.error) throw res.error;
      closeModal();
      loadSec(_cur);
    }
  }catch(err){ showAlert('Error: '+err.message); }
  btn.textContent='Save'; btn.disabled=false;
}

// ---- RECURRING JOBS ----
async function createRecurringJobs(baseJob, recur, endMonths, baseJobNum){
  var intervalDays = recur==='weekly'?7:recur==='biweekly'?14:recur==='3weeks'?21:0;
  var startDate = new Date(baseJob.scheduled_date+'T12:00:00');
  var endDate = new Date(startDate); endDate.setMonth(endDate.getMonth()+endMonths);
  var rjobs=[], nextJn=baseJobNum+1;

  if(recur==='monthly'||recur==='yearly'){
    var mStep=recur==='monthly'?1:12;
    var nxt=new Date(startDate); nxt.setMonth(nxt.getMonth()+mStep);
    while(nxt<=endDate){
      var d=nxt.getFullYear()+'-'+String(nxt.getMonth()+1).padStart(2,'0')+'-'+String(nxt.getDate()).padStart(2,'0');
      rjobs.push(Object.assign({},baseJob,{job_number:nextJn++,scheduled_date:d}));
      nxt.setMonth(nxt.getMonth()+mStep);
    }
  } else if(intervalDays>0){
    var nxt2=new Date(startDate); nxt2.setDate(nxt2.getDate()+intervalDays);
    while(nxt2<=endDate){
      var d2=nxt2.getFullYear()+'-'+String(nxt2.getMonth()+1).padStart(2,'0')+'-'+String(nxt2.getDate()).padStart(2,'0');
      rjobs.push(Object.assign({},baseJob,{job_number:nextJn++,scheduled_date:d2}));
      nxt2.setDate(nxt2.getDate()+intervalDays);
    }
  }
  if(rjobs.length){
    for(var b=0;b<rjobs.length;b+=50) await sb.from('jobs').insert(rjobs.slice(b,b+50));
    showAlert('Created '+rjobs.length+' recurring appointments!');
  }
}

async function autoScheduleJobs(clientName, phone, address, frequency, startDate, startTime, price){
  if(!frequency||frequency==='One-time') return;
  var intervalDays=frequency==='Weekly'?7:frequency==='Biweekly'?14:frequency==='3 Weeks'?21:0;
  startDate=startDate||new Date().toISOString().slice(0,10);
  startTime=startTime||'09:00';
  price=price||0;
  var dates=[], cur=new Date(startDate+'T12:00:00');
  var end=new Date(cur); end.setMonth(end.getMonth()+12);
  var jRes=await sb.from('jobs').select('job_number').order('job_number',{ascending:false}).limit(1);
  var jn=(jRes.data&&jRes.data.length?(jRes.data[0].job_number||0):0)+1;

  if(frequency==='Monthly'){
    var d=new Date(cur);
    while(d<=end){
      var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      dates.push(ds); d=new Date(d); d.setMonth(d.getMonth()+1);
    }
  } else {
    while(cur<=end){
      var ds2=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      dates.push(ds2); cur.setDate(cur.getDate()+intervalDays);
    }
  }
  var bid=await getBizId();
  var jobs=dates.map(function(date){ return {job_number:jn++,client_name:clientName,service:'Regular Cleaning',address:address||'',scheduled_date:date,scheduled_time:startTime,status:'Scheduled',amount:price,business_id:bid}; });
  try{
    for(var b=0;b<jobs.length;b+=50) await sb.from('jobs').insert(jobs.slice(b,b+50));
    showAlert('Created '+jobs.length+' recurring appointments for '+clientName+' (12 months)!');
  }catch(err){ console.error('Auto schedule error:',err); }
}

// ---- SAVE EDIT HELPER ----
var _editId = '';
async function saveEdit(tbl, dat){
  if(!_editId) return;
  var res = await sb.from(tbl).update(dat).eq('id',_editId);
  if(res.error){ showAlert('Error: '+res.error.message); return; }
  // If updating client with price, update future jobs too
  if(tbl==='clients' && dat.price_per_visit){
    await sb.from('jobs').update({amount:dat.price_per_visit}).eq('client_name',dat.name).eq('status','Scheduled');
  }
  closeModal();
  loadSec(_cur);
}

// ---- CLIENT EDIT / DELETE ----
function editClient(id){
  var c = (_allClients||[]).find(function(x){ return x.id===id; })||{};
  _editId = id;
  document.getElementById('modal-title').textContent = 'Edit Client';
  document.getElementById('modal-body').innerHTML =
    '<div class="form-row"><div class="form-group"><label class="form-label">Full name *</label><input class="form-input" id="f-name" value="'+(c.name||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Type</label><select class="form-input" id="f-type"><option'+(c.type==='Residential'?' selected':'')+'>Residential</option><option'+(c.type==='Commercial'?' selected':'')+'>Commercial</option></select></div></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="f-phone" value="'+(c.phone||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" value="'+(c.email||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" value="'+(c.address||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Frequency</label><select class="form-input" id="f-freq"><option'+(c.frequency==='Weekly'?' selected':'')+' value="Weekly">Weekly</option><option'+(c.frequency==='Biweekly'?' selected':'')+' value="Biweekly">Biweekly</option><option'+(c.frequency==='3 Weeks'?' selected':'')+' value="3 Weeks">Every 3 weeks</option><option'+((!c.frequency||c.frequency==='Monthly')?' selected':'')+' value="Monthly">Monthly</option><option'+(c.frequency==='One-time'?' selected':'')+' value="One-time">One-time</option></select></div>'
    +'<div class="form-group"><label class="form-label">Price per visit ($)</label><input class="form-input" id="f-price" type="number" step="0.01" value="'+(c.price_per_visit||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status"><option'+(c.status==='Active'||!c.status?' selected':'')+'>Active</option><option'+(c.status==='Inactive'?' selected':'')+'>Inactive</option></select></div>'
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="'+(c.notes||'')+'"/></div>';
  document.getElementById('modal-save').onclick = function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    saveEdit('clients',{name:gv('f-name'),type:gv('f-type'),phone:gv('f-phone'),email:gv('f-email'),address:gv('f-address'),frequency:gv('f-freq'),price_per_visit:parseFloat(gv('f-price'))||0,status:gv('f-status'),notes:gv('f-notes')});
  };
  document.getElementById('modal-bg').classList.add('open');
}

async function deleteClient(id){
  var c = (_allClients||[]).find(function(x){ return x.id===id; })||{};
  var name = c.name||'this client';
  showConfirm('Delete '+name+' and ALL their jobs, invoices and appointments?', async function(){
    await sb.from('jobs').delete().eq('client_name',name);
    await sb.from('invoices').delete().eq('client_name',name);
    await sb.from('quotes').delete().eq('client_name',name);
    await sb.from('payments').delete().eq('client_name',name);
    await sb.from('clients').delete().eq('id',id);
    loadClients();
  }, function(){});
}

// ---- JOB EDIT / DELETE ----
function editJob(id){
  var j = (_jobs||[]).find(function(x){ return x.id===id; })||{};
  _editId = id;
  document.getElementById('modal-title').textContent = 'Edit Job';
  document.getElementById('modal-body').innerHTML =
    '<div class="form-group"><label class="form-label">Client name</label><input class="form-input" id="f-client" value="'+(j.client_name||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" value="'+(j.service||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" value="'+(j.amount||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status"><option'+(j.status==='Scheduled'?' selected':'')+'>Scheduled</option><option'+(j.status==='In progress'?' selected':'')+'>In progress</option><option'+(j.status==='To confirm'?' selected':'')+'>To confirm</option><option'+(j.status==='Completed'?' selected':'')+'>Completed</option><option'+(j.status==='Invoiced'?' selected':'')+'>Invoiced</option><option'+(j.status==='Paid'?' selected':'')+'>Paid</option><option'+(j.status==='Cancelled'?' selected':'')+'>Cancelled</option></select></div></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="'+(j.scheduled_date||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Time</label><input class="form-input" id="f-time" type="time" value="'+(j.scheduled_time||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" value="'+(j.address||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="'+(j.notes||'')+'"/></div>';
  document.getElementById('modal-save').onclick = function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    var newSt=gv('f-status');
    saveEdit('jobs',{client_name:gv('f-client'),service:gv('f-service'),amount:parseFloat(gv('f-amount'))||0,scheduled_date:gv('f-date')||null,scheduled_time:gv('f-time')||null,address:gv('f-address'),status:newSt,notes:gv('f-notes')});
  };
  document.getElementById('modal-bg').classList.add('open');
}

async function deleteJob(id){
  var j = (_jobs||[]).find(function(x){ return x.id===id; })||{};
  showConfirm('Delete job for '+(j.client_name||'this client')+'?', async function(){
    var res = await sb.from('jobs').delete().eq('id',id);
    if(res.error){ showAlert('Error: '+res.error.message); return; }
    loadJobs();
  }, function(){});
}

// ---- QUOTE EDIT / DELETE ----
function editQuote(id){
  var q = (_allQuotes||[]).find(function(x){ return x.id===id; })||{};
  _editId = id;
  document.getElementById('modal-title').textContent = 'Edit Estimate';
  document.getElementById('modal-body').innerHTML =
    '<div class="form-group"><label class="form-label">Client name</label><input class="form-input" id="f-client" value="'+(q.client_name||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" value="'+(q.service||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" value="'+(q.amount||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Expiry date</label><input class="form-input" id="f-date" type="date" value="'+(q.expiry_date||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status"><option'+(q.status==='Draft'?' selected':'')+'>Draft</option><option'+(q.status==='Awaiting'?' selected':'')+'>Awaiting</option><option'+(q.status==='Sent'?' selected':'')+'>Sent</option><option'+(q.status==='Approved'?' selected':'')+'>Approved</option><option'+(q.status==='Declined'?' selected':'')+'>Declined</option></select></div>'
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="'+(q.notes||'')+'"/></div>';
  document.getElementById('modal-save').onclick = function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    saveEdit('quotes',{client_name:gv('f-client'),service:gv('f-service'),amount:parseFloat(gv('f-amount'))||0,expiry_date:gv('f-date')||null,status:gv('f-status'),notes:gv('f-notes')});
  };
  document.getElementById('modal-bg').classList.add('open');
}

async function deleteQuote(id){
  showConfirm('Delete this estimate?', async function(){
    await sb.from('quotes').delete().eq('id',id);
    loadQuotes();
  }, function(){});
}

// ---- INVOICE FUNCTIONS ----
function viewInvoice(id){
  var inv = (_allInvoices||[]).find(function(x){ return x.id===id; })||{};
  if(!inv.id){ showAlert('Invoice not found.'); return; }
  var subtotal=Number(inv.amount||0), tax=subtotal*Number(inv.tax_rate||0)/100, disc=Number(inv.discount||0), total=subtotal+tax-disc;
  var html = '<div class="inv-preview">'
    +'<div class="inv-header">'
    +'<div><div class="inv-co">CleanPro TX</div><div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:3px;">Lubbock, TX &bull; </div></div>'
    +'<div style="text-align:right;"><div class="inv-tag">INVOICE</div><div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:2px;">#'+String(inv.invoice_number||0).padStart(3,'0')+'</div></div>'
    +'</div>'
    +'<div class="inv-body">'
    +'<div class="inv-grid">'
    +'<div><div class="inv-lbl">Bill To</div><div class="inv-val" style="font-size:16px;font-weight:700;">'+(inv.client_name||'--')+'</div>'
    +(inv.client_email?'<div class="inv-val" style="font-size:13px;">'+inv.client_email+'</div>':'')
    +(inv.client_phone?'<div class="inv-val" style="font-size:13px;">'+inv.client_phone+'</div>':'')+'</div>'
    +'<div><div class="inv-lbl">Invoice Details</div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span class="inv-val" style="color:var(--tx3);">Issue date</span><span class="inv-val"><b>'+fmtD(inv.issue_date)+'</b></span></div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span class="inv-val" style="color:var(--tx3);">Due date</span><span class="inv-val"><b>'+fmtD(inv.due_date)+'</b></span></div>'
    +(inv.payment_url?'<a href="'+inv.payment_url+'" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex;margin-top:8px;text-decoration:none;">Pay Now</a>':'')
    +'</div></div>'
    +'<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">'
    +'<table><thead><tr><th>Service</th><th style="text-align:right;">Amount</th></tr></thead>'
    +'<tbody><tr><td><b>'+(inv.service||'Cleaning Service')+'</b>'+(inv.description&&inv.description!==inv.service?'<br><span style="font-size:12px;color:var(--tx3);">'+inv.description+'</span>':'')+'</td><td style="text-align:right;"><b>'+fmt(inv.amount||0)+'</b></td></tr></tbody></table></div>'
    +'<div style="background:var(--border2);border-radius:var(--radius);padding:14px 18px;">'
    +(Number(inv.tax_rate)>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--tx3);">Tax ('+inv.tax_rate+'%)</span><span>'+fmt(tax)+'</span></div>':'')
    +(Number(inv.discount)>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:var(--green);"><span>Discount</span><span>-'+fmt(disc)+'</span></div>':'')
    +'<div class="inv-total-row"><div class="inv-total-lbl">Total Due</div><div class="inv-total-amt">'+fmt(total)+'</div></div>'
    +(inv.status==='Paid'?'<div style="text-align:center;margin-top:8px;background:var(--green-light);color:var(--green-dark);border-radius:var(--radius);padding:8px;font-size:13px;font-weight:700;">✓ PAID IN FULL</div>':'')
    +'</div>'
    +'<div style="text-align:center;margin-top:16px;font-size:11px;color:var(--tx3);">Thank you for choosing CleanPro TX! &bull; </div>'
    +'</div></div>';
  document.getElementById('inv-view-content').innerHTML = html;
  document.getElementById('inv-view-bg').classList.add('open');
}

function printInvoice(){
  var content = document.getElementById('inv-view-content').innerHTML;
  var win = window.open('','_blank');
  win.document.write('<html><head><title>Invoice</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:20px;}*{box-sizing:border-box;}.inv-preview{max-width:600px;margin:0 auto;}.inv-header{background:linear-gradient(135deg,#1E1B4B,#7C3AED,#10B981);padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start;border-radius:12px 12px 0 0;}.inv-co{font-size:18px;font-weight:800;color:#fff;}.inv-tag{font-size:26px;font-weight:900;color:#fff;}.inv-body{padding:24px 32px;}.inv-lbl{font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;}.inv-val{font-size:14px;font-weight:500;}.inv-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}.inv-total-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:2px solid #111;}.inv-total-lbl{font-size:15px;font-weight:700;}.inv-total-amt{font-size:26px;font-weight:800;color:#7C3AED;}table{width:100%;border-collapse:collapse;}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #eee;}</style></head><body>'+content+'</body></html>');
  win.document.close(); win.print();
}

function sendInvoice(id){
  var inv = (_allInvoices||[]).find(function(x){ return x.id===id; })||{};
  if(!inv.id){ showAlert('Invoice not found.'); return; }
  window._currentInv = inv;
  openInvoiceSendModal(inv, inv.client_email||'', inv.client_phone||'');
}

function openInvoiceSendModal(inv, email, phone){
  window._currentInv = inv;
  document.getElementById('inv-modal-title').textContent = 'Send Invoice #'+String(inv.invoice_number||0).padStart(3,'0');
  document.getElementById('inv-amount').textContent = fmt(inv.amount||0);
  document.getElementById('inv-desc').textContent = inv.service||'Cleaning Service';
  document.getElementById('inv-number').textContent = 'Due: '+fmtD(inv.due_date);
  document.getElementById('inv-email').value = email||'';
  document.getElementById('inv-phone').value = phone||'';
  document.getElementById('inv-result').textContent = '';
  try{ document.getElementById('inv-note').value = inv.notes||''; }catch(e){}
  document.getElementById('inv-modal-bg').classList.add('open');
}

async function confirmSendInvoice(){
  var inv = window._currentInv;
  if(!inv){ showAlert('No invoice selected.'); return; }
  var btn = document.getElementById('inv-send-btn');
  btn.textContent='Sending...'; btn.disabled=true;
  var via = document.querySelector('input[name="inv-via"]:checked');
  var viaVal = via ? via.value : 'email';
  var email = document.getElementById('inv-email').value.trim();
  var phone = document.getElementById('inv-phone').value.trim().replace(/\D/g,'');
  var note = ''; try{ note=document.getElementById('inv-note').value; }catch(e){}
  try{
    var payUrl = '';
    try{
      var plRes = await sb.functions.invoke('create-invoice-payment',{body:{client_name:inv.client_name,amount:Number(inv.amount||0),invoice_number:inv.invoice_number}});
      if(plRes.data&&plRes.data.url) payUrl=plRes.data.url;
    }catch(e){}

    if(viaVal==='email'&&email){
      await sb.functions.invoke('hyper-api',{body:{to:email,client_name:inv.client_name||'',invoice_number:String(inv.invoice_number||''),amount:Number(inv.amount||0).toFixed(2),due_date:fmtD(inv.due_date),service:inv.service||'Cleaning Service',pay_url:payUrl,note:note}});
      await sb.from('invoices').update({status:'Sent',client_email:email,payment_url:payUrl}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='Invoice sent to '+email+'!';
    }
    if(viaVal==='whatsapp'&&phone){
      var msg='Hi '+inv.client_name+'! Your invoice #'+String(inv.invoice_number||0).padStart(3,'0')+' for '+fmt(inv.amount||0)+' is ready. Due: '+fmtD(inv.due_date)+'.'+(payUrl?' Pay here: '+payUrl:'')+(note?' Note: '+note:'');
      window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
      await sb.from('invoices').update({status:'Sent',payment_url:payUrl}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='WhatsApp opened!';
    }
    if(viaVal==='sms'&&phone){
      await sb.functions.invoke('smooth-responder',{body:{to:phone,custom_message:'Invoice #'+String(inv.invoice_number||0).padStart(3,'0')+' for '+fmt(inv.amount||0)+'. Due: '+fmtD(inv.due_date)+'.'+(payUrl?' Pay: '+payUrl:'')}});
      await sb.from('invoices').update({status:'Sent',payment_url:payUrl}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='SMS sent!';
    }
    loadInvoices();
    setTimeout(function(){ document.getElementById('inv-modal-bg').classList.remove('open'); },1500);
  }catch(err){
    document.getElementById('inv-result').style.color='var(--red)';
    document.getElementById('inv-result').textContent='Error: '+err.message;
  }
  btn.textContent='Send Invoice'; btn.disabled=false;
}

async function markInvoicePaid(id){
  showConfirm('Mark this invoice as Paid?', async function(){
    var inv = (_allInvoices||[]).find(function(x){ return x.id===id; })||{};
    await sb.from('invoices').update({status:'Paid',balance:0}).eq('id',id);
    if(inv.client_name){
      var bid3 = await getBizId();
      await sb.from('payments').insert([{client_name:inv.client_name,amount:inv.amount||0,method:'Manual',payment_date:new Date().toISOString().slice(0,10),status:'Paid',invoice_id:id,business_id:bid3}]);
    }
    loadInvoices();
    showAlert('Payment recorded! Invoice marked as Paid.');
  }, function(){});
}

function editInvoiceFull(id){
  var inv = (_allInvoices||[]).find(function(x){ return x.id===id; })||{};
  _editId = id;
  var statusOpts = ['Draft','Sent','Viewed','Partial payment','Paid','Overdue','Cancelled'].map(function(s){ return '<option'+(s===inv.status?' selected':'')+'>'+s+'</option>'; }).join('');
  document.getElementById('modal-title').textContent = 'Edit Invoice';
  document.getElementById('modal-body').innerHTML =
    '<div class="form-group"><label class="form-label">Client</label><input class="form-input" id="f-client" value="'+(inv.client_name||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" value="'+(inv.service||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" value="'+(inv.amount||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Due date</label><input class="form-input" id="f-due" type="date" value="'+(inv.due_date||'')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status">'+statusOpts+'</select></div>'
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="'+(inv.notes||'')+'"/></div>';
  document.getElementById('modal-save').onclick = function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    var amt=parseFloat(gv('f-amount'))||0, st=gv('f-status');
    saveEdit('invoices',{client_name:gv('f-client'),service:gv('f-service'),amount:amt,balance:st==='Paid'?0:amt,due_date:gv('f-due')||null,status:st,notes:gv('f-notes')});
  };
  document.getElementById('modal-bg').classList.add('open');
}

async function deleteInvoice(id){
  showConfirm('Delete this invoice?', async function(){
    await sb.from('invoices').delete().eq('id',id);
    loadInvoices();
  }, function(){});
}

// ---- PAYMENT EDIT/DELETE ----
function editPayment(id){
  var p = (_allPayments||[]).find(function(x){ return x.id===id; })||{};
  _editId = id;
  document.getElementById('modal-title').textContent = 'Edit Payment';
  document.getElementById('modal-body').innerHTML =
    '<div class="form-group"><label class="form-label">Client</label><input class="form-input" id="f-client" value="'+(p.client_name||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" value="'+(p.amount||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Method</label><select class="form-input" id="f-method"><option'+(p.method==='Card'?' selected':'')+'>Card</option><option'+(p.method==='Cash'?' selected':'')+'>Cash</option><option'+(p.method==='Zelle'?' selected':'')+'>Zelle</option><option'+(p.method==='Venmo'?' selected':'')+'>Venmo</option><option'+(p.method==='Check'?' selected':'')+'>Check</option></select></div></div>'
    +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="'+(p.payment_date||'')+'"/></div>';
  document.getElementById('modal-save').onclick = function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    saveEdit('payments',{client_name:gv('f-client'),amount:parseFloat(gv('f-amount'))||0,method:gv('f-method'),payment_date:gv('f-date')||null,status:'Paid'});
  };
  document.getElementById('modal-bg').classList.add('open');
}

async function deletePayment(id){
  showConfirm('Delete this payment?', async function(){
    await sb.from('payments').delete().eq('id',id);
    loadPayments();
  }, function(){});
}

// ---- EXPENSE EDIT/DELETE ----
function editExpense(id){
  _editId = id;
  sb.from('expenses').select('*').eq('id',id).single().then(function(res){
    var e = res.data||{};
    document.getElementById('modal-title').textContent = 'Edit Expense';
    document.getElementById('modal-body').innerHTML =
      '<div class="form-group"><label class="form-label">Description</label><input class="form-input" id="f-desc" value="'+(e.description||'')+'"/></div>'
      +'<div class="form-row"><div class="form-group"><label class="form-label">Category</label><select class="form-input" id="f-cat"><option'+(e.category==='Supplies'?' selected':'')+'>Supplies</option><option'+(e.category==='Transportation'?' selected':'')+'>Transportation</option><option'+(e.category==='Equipment'?' selected':'')+'>Equipment</option><option'+(e.category==='Marketing'?' selected':'')+'>Marketing</option><option'+(e.category==='Insurance'?' selected':'')+'>Insurance</option><option'+(e.category==='Other'?' selected':'')+'>Other</option></select></div>'
      +'<div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" id="f-amount" type="number" value="'+(e.amount||'')+'"/></div></div>'
      +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="'+(e.expense_date||'')+'"/></div>';
    document.getElementById('modal-save').onclick = function(){
      function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
      saveEdit('expenses',{description:gv('f-desc'),category:gv('f-cat'),amount:parseFloat(gv('f-amount'))||0,expense_date:gv('f-date')||null});
    };
    document.getElementById('modal-bg').classList.add('open');
  });
}
async function deleteExpense(id){
  showConfirm('Delete this expense?', async function(){
    await sb.from('expenses').delete().eq('id',id);
    loadExpenses();
  }, function(){});
}

// ---- TIMESHEET EDIT/DELETE ----
function editTimesheet(id){
  _editId = id;
  sb.from('timesheets').select('*').eq('id',id).single().then(function(res){
    var t = res.data||{};
    document.getElementById('modal-title').textContent = 'Edit Timesheet';
    document.getElementById('modal-body').innerHTML =
      '<div class="form-group"><label class="form-label">Employee</label><input class="form-input" id="f-emp" value="'+(t.employee_name||'')+'"/></div>'
      +'<div class="form-group"><label class="form-label">Description</label><input class="form-input" id="f-desc" value="'+(t.job_description||'')+'"/></div>'
      +'<div class="form-row"><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="'+(t.work_date||'')+'"/></div>'
      +'<div class="form-group"><label class="form-label">Hours</label><input class="form-input" id="f-hours" type="number" step="0.5" value="'+(t.duration_hours||'')+'"/></div></div>'
      +'<div class="form-row"><div class="form-group"><label class="form-label">Start time</label><input class="form-input" id="f-start" type="time" value="'+(t.start_time||'')+'"/></div>'
      +'<div class="form-group"><label class="form-label">End time</label><input class="form-input" id="f-end" type="time" value="'+(t.end_time||'')+'"/></div></div>';
    document.getElementById('modal-save').onclick = function(){
      function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
      saveEdit('timesheets',{employee_name:gv('f-emp'),job_description:gv('f-desc'),work_date:gv('f-date')||null,start_time:gv('f-start')||null,end_time:gv('f-end')||null,duration_hours:parseFloat(gv('f-hours'))||0});
    };
    document.getElementById('modal-bg').classList.add('open');
  });
}
async function deleteTimesheet(id){
  showConfirm('Delete this timesheet entry?', async function(){
    await sb.from('timesheets').delete().eq('id',id);
    loadTimesheets();
  }, function(){});
}

// ---- LEAD EDIT/DELETE ----
async function editLead(id){
  var SBU='https://yfqoncqoerleoaqxvaie.supabase.co', SBK='sb_publishable_cbrrFqLqJMkUXJ4icNOn9g_lEv4NneF';
  var r=await fetch(SBU+'/rest/v1/leads?id=eq.'+id+'&select=*',{headers:{'apikey':SBK,'Authorization':'Bearer '+SBK}});
  var data=await r.json(); var l=data[0]||{}; _editId=id;
  document.getElementById('modal-title').textContent='Edit Lead';
  document.getElementById('modal-body').innerHTML=
    '<div class="form-group"><label class="form-label">Client name</label><input class="form-input" id="f-name" value="'+(l.name||l.client_name||'')+'"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="f-phone" value="'+(l.phone||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status"><option'+(l.status==='new'?' selected':'')+' value="new">New</option><option'+(l.status==='accepted'?' selected':'')+' value="accepted">Accepted</option><option'+(l.status==='declined'?' selected':'')+' value="declined">Declined</option></select></div></div>'
    +'<div class="form-group"><label class="form-label">Service</label><input class="form-input" id="f-service" value="'+(l.service||'')+'"/></div>'
    +'<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" value="'+(l.address||'')+'"/></div>';
  document.getElementById('modal-save').onclick=async function(){
    function gv(id){var el=document.getElementById(id);return el?el.value:'';}
    await fetch(SBU+'/rest/v1/leads?id=eq.'+id,{method:'PATCH',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json'},body:JSON.stringify({name:gv('f-name'),phone:gv('f-phone'),service:gv('f-service'),address:gv('f-address'),status:gv('f-status')})});
    closeModal(); loadLeads();
  };
  document.getElementById('modal-bg').classList.add('open');
}
async function deleteLead(id){
  var SBU='https://yfqoncqoerleoaqxvaie.supabase.co', SBK='sb_publishable_cbrrFqLqJMkUXJ4icNOn9g_lEv4NneF';
  showConfirm('Delete this lead permanently?', async function(){
    await fetch(SBU+'/rest/v1/leads?id=eq.'+id,{method:'DELETE',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK}});
    loadLeads();
  }, function(){});
}

// ---- SMS ----
function doSMS(jobId){
  var j = (_jobs||[]).find(function(x){ return x.id===jobId; })||{};
  _smsJob = j;
  document.getElementById('sms-info').textContent = (j.client_name||'')+(j.service?' — '+j.service:'');
  document.getElementById('sms-preview').textContent = 'Hi '+(j.client_name||'')+'! Reminder: your cleaning '+(j.service?'('+j.service+') ':'')+' is scheduled for '+fmtD(j.scheduled_date)+(j.scheduled_time?' at '+fmtT(j.scheduled_time):'')+'. Questions? Call . — CleanPro TX';
  document.getElementById('sms-phone').value = '';
  document.getElementById('sms-result').textContent = '';
  document.getElementById('sms-modal-bg').classList.add('open');
}
async function confirmSMS(){
  var phone = document.getElementById('sms-phone').value.trim();
  if(!phone){ showAlert('Please enter the client phone number.'); return; }
  var btn=document.getElementById('sms-btn'); btn.textContent='Sending...'; btn.disabled=true;
  try{
    var res=await sb.functions.invoke('smooth-responder',{body:{to:phone,client_name:_smsJob.client_name||'',service:_smsJob.service||'',scheduled_date:_smsJob.scheduled_date||'',custom_message:document.getElementById('sms-preview').textContent}});
    if(res.error) throw res.error;
    document.getElementById('sms-result').style.color='var(--green)';
    document.getElementById('sms-result').textContent='SMS sent!';
    setTimeout(function(){ document.getElementById('sms-modal-bg').classList.remove('open'); },2000);
  }catch(err){
    document.getElementById('sms-result').style.color='var(--red)';
    document.getElementById('sms-result').textContent='Error: '+err.message;
  }
  btn.textContent='Send SMS'; btn.disabled=false;
}

// ---- PHOTOS ----
function doPhotos(jobId){
  var j = (_jobs||[]).find(function(x){ return x.id===jobId; })||{};
  _photoJobId=jobId; _bf=null; _af=null;
  document.getElementById('photos-title').textContent=(j.client_name||'Job')+' — Photos';
  document.getElementById('before-prev').innerHTML='<div style="font-size:28px;">+</div><div style="font-size:12px;color:var(--tx3);margin-top:4px;">Upload photo</div>';
  document.getElementById('after-prev').innerHTML='<div style="font-size:28px;">+</div><div style="font-size:12px;color:var(--tx3);margin-top:4px;">Upload photo</div>';
  document.getElementById('photos-result').textContent='';
  document.getElementById('existing-photos').innerHTML='';
  loadExistingPhotos(jobId);
  document.getElementById('photos-modal-bg').classList.add('open');
}
function prevPhoto(type,input){
  if(!input.files[0]) return;
  if(type==='before') _bf=input.files[0]; else _af=input.files[0];
  var reader=new FileReader();
  reader.onload=function(e){ document.getElementById(type+'-prev').innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);"/>'; };
  reader.readAsDataURL(input.files[0]);
}
async function loadExistingPhotos(jobId){
  var res=await sb.storage.from('job-photos').list(jobId+'/',{limit:20});
  var files=res.data||[];
  var el=document.getElementById('existing-photos');
  if(!files.length){ el.innerHTML=''; return; }
  el.innerHTML='<div style="font-size:11px;font-weight:600;color:var(--tx3);margin-bottom:8px;text-transform:uppercase;">Existing photos</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px;">'
    +files.map(function(f){ var url=sb.storage.from('job-photos').getPublicUrl(jobId+'/'+f.name).data.publicUrl; return '<img src="'+url+'" style="width:100%;height:64px;object-fit:cover;border-radius:var(--radius);cursor:pointer;" onclick="window.open(\''+url+'\',\'_blank\')"/>'; }).join('')+'</div>';
}
async function uploadPhotos(){
  if(!_bf&&!_af){ showAlert('Please select at least one photo.'); return; }
  var btn=document.getElementById('photos-btn'); btn.textContent='Uploading...'; btn.disabled=true;
  try{
    var ts=Date.now();
    if(_bf) await sb.storage.from('job-photos').upload(_photoJobId+'/before-'+ts+'.jpg',_bf,{upsert:true});
    if(_af) await sb.storage.from('job-photos').upload(_photoJobId+'/after-'+ts+'.jpg',_af,{upsert:true});
    document.getElementById('photos-result').textContent='Photos uploaded!';
    setTimeout(function(){ document.getElementById('photos-modal-bg').classList.remove('open'); },1500);
  }catch(err){
    document.getElementById('photos-result').style.color='var(--red)';
    document.getElementById('photos-result').textContent='Error: '+err.message;
  }
  btn.textContent='Save photos'; btn.disabled=false;
}

// ---- AI CHAT ----
var _chatHistory=[], _chatOpen=false;
function toggleChat(){
  _chatOpen=!_chatOpen;
  document.getElementById('chat-box').style.display=_chatOpen?'flex':'none';
  if(_chatOpen&&_chatHistory.length===0) addMsg('assistant','Hi Maria! I am your AI assistant for The Best Cleaning. How can I help you today?');
}
function addMsg(role,text){
  _chatHistory.push({role:role,content:text});
  var box=document.getElementById('chat-messages');
  var isUser=role==='user';
  box.innerHTML+='<div style="margin-bottom:10px;display:flex;justify-content:'+(isUser?'flex-end':'flex-start')+'">'
    +'<div style="max-width:82%;background:'+(isUser?'var(--purple)':'var(--border2)')+';color:'+(isUser?'#fff':'var(--tx)')+';border-radius:12px;padding:8px 12px;font-size:13px;line-height:1.5;">'+text+'</div></div>';
  box.scrollTop=box.scrollHeight;
}
function chatKeydown(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendChat(); } }
async function sendChat(){
  var input=document.getElementById('chat-input'); var msg=input.value.trim(); if(!msg) return;
  input.value=''; addMsg('user',msg);
  try{
    var res=await sb.functions.invoke('clever-handler',{body:{messages:_chatHistory}});
    addMsg('assistant',res.data&&res.data.reply?res.data.reply:'Sorry, I could not process that request.');
  }catch(err){ addMsg('assistant','Error: '+err.message); }
}

// ---- GOOGLE REVIEWS ----
var REVIEW_LINK = 'https://business.google.com';

function copyReviewLink(){
  var link = 'https://business.google.com';
  navigator.clipboard.writeText(link).then(function(){
    showAlert('Review link copied! Share it with your clients after each job.');
  }).catch(function(){
    showAlert('Copy this link: https://business.google.com');
  });
}

function sendReviewWhatsApp(){
  var msg = 'Hi! Thank you for choosing CleanPro TX! We hope you loved our service. Would you mind leaving us a Google review? It only takes 1 minute and helps us a lot! 🌟\n\nhttps://g.page/r/CThebestcleaning/review\n\nThank you! — Maria ';
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

// ---- SETTINGS SAVE ----
async function saveSettings(){
  var btn = document.querySelector('#s-settings .btn-primary');
  if(btn){ btn.textContent='Saving...'; btn.disabled=true; }
  try{
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    var bid = await getBizId();
    var res = await sb.from('businesses').update({
      business_name: gv('s-bizname'),
      owner_name: gv('s-owner'),
      phone: gv('s-phone'),
      email: gv('s-email'),
      service_type: gv('s-service'),
      city: gv('s-city'),
      address: gv('s-address'),
      website: gv('s-website')
    }).eq('id', bid);
    if(res.error) throw res.error;
    // Update sidebar name
    try{ document.querySelector('.logo-text').textContent = gv('s-bizname'); }catch(e){}
    var el = document.getElementById('settings-result');
    if(el){ el.style.color='var(--green)'; el.textContent='Settings saved successfully!'; }
    setTimeout(function(){ if(el) el.textContent=''; },3000);
  }catch(err){
    var el = document.getElementById('settings-result');
    if(el){ el.style.color='var(--red)'; el.textContent='Error: '+err.message; }
  }
  if(btn){ btn.textContent='Save changes'; btn.disabled=false; }
}

async function changePassword(){
  var user = await sb.auth.getUser();
  var email = user.data.user?.email;
  if(!email){ showAlert('No email found.'); return; }
  var res = await sb.auth.resetPasswordForEmail(email, {redirectTo: window.location.origin+'/reset-password.html'});
  if(res.error){ showAlert('Error: '+res.error.message); return; }
  showAlert('Password reset email sent to '+email+'! Check your inbox.');
}
