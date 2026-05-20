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
    f:'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
     +'<div class="form-group"><label class="form-label">Client name *</label><input class="form-input" id="f-client" placeholder="Client name" oninput="invAutoFill()"/></div>'
     +'<div class="form-group"><label class="form-label">Client email</label><input class="form-input" id="f-email" type="email" placeholder="client@email.com"/></div>'
     +'</div>'
     +'<div class="form-group"><label class="form-label">Service address</label><input class="form-input" id="f-address" placeholder="Street address, Lubbock TX"/></div>'
     +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">'
     +'<div class="form-group"><label class="form-label">Invoice date</label><input class="form-input" id="f-idate" type="date" value="'+new Date().toISOString().slice(0,10)+'"/></div>'
     +'<div class="form-group"><label class="form-label">Terms</label><select class="form-input" id="f-terms" onchange="invCalcDue()"><option value="0">Due on receipt</option><option value="7">Net 7</option><option value="15">Net 15</option><option value="30" selected>Net 30</option></select></div>'
     +'<div class="form-group"><label class="form-label">Due date</label><input class="form-input" id="f-due" type="date"/></div>'
     +'</div>'
     +'<div style="background:var(--border2);border-radius:10px;padding:12px;margin:4px 0;">'
     +'<div style="display:grid;grid-template-columns:1fr 80px 100px;gap:8px;margin-bottom:6px;">'
     +'<div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;">Service / Description</div>'
     +'<div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;">Qty</div>'
     +'<div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;">Rate ($)</div>'
     +'</div>'
     +'<div id="inv-lines">'
     +'<div style="display:grid;grid-template-columns:1fr 80px 100px;gap:8px;margin-bottom:6px;">'
     +'<input class="form-input" id="f-service" placeholder="Regular Cleaning"/>'
     +'<input class="form-input" id="f-qty" type="number" value="1" min="1" oninput="invCalcTotal()"/>'
     +'<input class="form-input" id="f-rate" type="number" step="0.01" placeholder="0.00" oninput="invCalcTotal()"/>'
     +'</div>'
     +'</div>'
     +'</div>'
     +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
     +'<div class="form-group"><label class="form-label">Note to customer</label><textarea class="form-input" id="f-notes" rows="2" placeholder="Thank you for your business!"></textarea></div>'
     +'<div style="background:var(--border2);border-radius:10px;padding:14px;">'
     +'<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:13px;color:var(--tx3);">Subtotal</span><span style="font-size:13px;font-weight:600;" id="inv-subtotal">$0.00</span></div>'
     +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="font-size:13px;color:var(--tx3);">Tax %</span><input style="width:60px;" class="form-input" id="f-tax" type="number" value="0" min="0" max="100" oninput="invCalcTotal()"/><span style="font-size:13px;font-weight:600;" id="inv-tax-amt">$0.00</span></div>'
     +'<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid var(--purple);"><span style="font-size:15px;font-weight:700;color:var(--tx);">Total</span><span style="font-size:18px;font-weight:800;color:var(--purple);" id="inv-total">$0.00</span></div>'
     +'<input type="hidden" id="f-amount" value="0"/>'
     +'</div>'
     +'</div>'
     +'<div style="display:flex;gap:8px;margin-top:4px;">'
     +'<button type="button" class="btn btn-primary" style="flex:1;" onclick="saveAndSendInvoice()">📧 Save & Send</button>'
     +'<button type="button" class="btn btn-outline" style="flex:1;" onclick="saveModal()">💾 Save as Draft</button>'
     +'</div>'
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
  if(btn){ btn.textContent='Saving...'; btn.disabled=true; }
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
      // Mensaje de bienvenida por WhatsApp al cliente nuevo
      if(cphone){
        setTimeout(async function(){
          var cleanPhone = cphone.replace(/\D/g,'').slice(-10);
          var firstDate = startDate ? new Date(startDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}) : '';
          var msg = 'Hi '+cname+'! 🏠✨\n\nThank you for choosing The Best Cleaning LLC! We are excited to work with you.\n\n'
            +(firstDate?'📅 Your first appointment is scheduled for '+firstDate+(startTime?' at '+fmtT(startTime):'')+'\n\n':'')
            +'If you have any questions, call or text us anytime:\n📞 (806) 620-1613\n\nWe look forward to making your home sparkle! — Maria\nThe Best Cleaning LLC';
          try{
            await sb.functions.invoke('smooth-responder',{body:{to:cleanPhone,custom_message:msg}});
            console.log('Welcome WhatsApp sent to '+cname);
          }catch(e){ console.log('Welcome msg error:',e.message); }
        }, 2000);
      }
    }
    else if(_curM==='job'){
      var recur=g('f-recur')||'none';
      var jRes=await sb.from('jobs').select('job_number').order('job_number',{ascending:false}).limit(1);
      var jn=(jRes.data&&jRes.data.length?(jRes.data[0].job_number||0):0)+1;
      tbl='jobs';
      dat={job_number:jn,client_name:g('f-client'),service:g('f-service'),amount:parseFloat(g('f-amount'))||0,scheduled_date:g('f-date')||null,scheduled_time:g('f-time')||null,address:g('f-address'),status:g('f-status')||'Scheduled',notes:g('f-notes')};
      // Try Google Calendar sync but never block saving if it fails
      if(dat.scheduled_date){
        setTimeout(function(){ syncToGoogleCalendar(dat).catch(function(e){ console.log('Calendar sync skipped:',e.message); }); }, 500);
      }
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
      var dd=new Date(); dd.setDate(dd.getDate()+30);
      var amount = parseFloat(g('f-amount'))||0;
      tbl='invoices';
      dat={invoice_number:invN,client_name:g('f-client'),service:g('f-service'),amount:amount,balance:amount,due_date:g('f-due')||dd.toISOString().slice(0,10),issued_date:g('f-idate')||new Date().toISOString().slice(0,10),status:'Draft',notes:g('f-notes')};
      var bid = await getBizId();
      if(bid) dat.business_id = bid;
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
      var bid = await getBizId();
      if(bid) dat.business_id = bid;
      var res = await sb.from(tbl).insert([dat]);
      if(res.error) throw res.error;
      closeModal();
      loadSec(_cur);
      // After saving a job, offer to add to phone calendar
      if(_curM==='job' && dat.scheduled_date){
        setTimeout(function(){ offerPhoneCalendar(dat); }, 400);
      }
    }
  }catch(err){ showAlert('Error: '+err.message); }
  if(btn){ btn.textContent='Save'; btn.disabled=false; }
}

// ============================================================
// CALENDAR — Add to phone / download ICS
// ============================================================

// Offer to download ICS after saving a job
function offerPhoneCalendar(job){
  if(!job.scheduled_date) return;
  showConfirm(
    'Job saved! Add "'+job.client_name+'" to your phone calendar?',
    function(){ downloadJobICS(job); },
    function(){}
  );
}

// Generate and download a single-job ICS file
function downloadJobICS(job){
  var date = job.scheduled_date.replace(/-/g,'');
  var startTime = ((job.scheduled_time||'09:00').slice(0,5).replace(':',''))+'00';
  // Default 2 hours duration
  var endHour = parseInt((job.scheduled_time||'09:00').slice(0,2)) + 2;
  var endTime = String(endHour).padStart(2,'0') + (job.scheduled_time||'09:00').slice(3,5).replace(':','') + '00';
  var now = new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  var uid = 'job-'+(job.id||Date.now())+'@thebestcleaning';

  var ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Best Cleaning//Pro//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:'+uid,
    'DTSTAMP:'+now,
    'DTSTART;TZID=America/Chicago:'+date+'T'+startTime,
    'DTEND;TZID=America/Chicago:'+date+'T'+endTime,
    'SUMMARY:'+(job.client_name||'Cleaning')+' — '+(job.service||'Cleaning'),
    'DESCRIPTION:Amount: $'+(job.amount||0)+'\\nThe Best Cleaning LLC (806) 620-1613',
    'LOCATION:'+(job.address||'Lubbock, TX'),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  var blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (job.client_name||'job').replace(/\s+/g,'-')+'-'+job.scheduled_date+'.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAlert('📅 Calendar file downloaded! Open it to add to your phone or Google Calendar.');
}

// Download ALL upcoming jobs as a single ICS file
async function downloadAllJobsICS(){
  try{
    var bid = await getBizId();
    var today = new Date().toISOString().slice(0,10);
    var res = await sb.from('jobs').select('*')
      .eq('business_id', bid)
      .gte('scheduled_date', today)
      .neq('status','Cancelled')
      .order('scheduled_date');
    var jobs = res.data||[];
    if(!jobs.length){ showAlert('No upcoming jobs to export.'); return; }

    var now = new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Best Cleaning//Pro//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:The Best Cleaning — Jobs',
      'X-WR-TIMEZONE:America/Chicago'
    ];

    jobs.forEach(function(job){
      var date = job.scheduled_date.replace(/-/g,'');
      var startTime = ((job.scheduled_time||'09:00').slice(0,5).replace(':',''))+'00';
      var endHour = parseInt((job.scheduled_time||'09:00').slice(0,2)) + 2;
      var endTime = String(endHour).padStart(2,'0') + (job.scheduled_time||'09:00').slice(3,5).replace(':','') + '00';
      var uid = 'job-'+(job.id||Math.random())+'@thebestcleaning';
      lines = lines.concat([
        'BEGIN:VEVENT',
        'UID:'+uid,
        'DTSTAMP:'+now,
        'DTSTART;TZID=America/Chicago:'+date+'T'+startTime,
        'DTEND;TZID=America/Chicago:'+date+'T'+endTime,
        'SUMMARY:'+(job.client_name||'Cleaning')+' — '+(job.service||'Cleaning'),
        'DESCRIPTION:Amount: $'+(job.amount||0)+'\\nStatus: '+(job.status||'Scheduled')+'\\nThe Best Cleaning LLC (806) 620-1613',
        'LOCATION:'+(job.address||'Lubbock, TX'),
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ]);
    });
    lines.push('END:VCALENDAR');

    var blob = new Blob([lines.join('\r\n')], {type:'text/calendar;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'thebestcleaning-jobs-'+today+'.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('📅 '+jobs.length+' jobs exported! Open the file to import all into Google Calendar or your phone.');
  }catch(err){ showAlert('Error: '+err.message); }
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
    showAlert('✅ Created '+jobs.length+' recurring appointments for '+clientName+' (12 months)!');
    // Sync all jobs to Google Calendar with delay to avoid rate limits
    setTimeout(async function(){
      for(var i=0;i<jobs.length;i++){
        await syncToGoogleCalendar(jobs[i]).catch(function(e){ console.log('Cal sync skip:',e.message); });
        await new Promise(function(r){ setTimeout(r, 400); });
      }
      console.log('Synced '+jobs.length+' jobs to Google Calendar for '+clientName);
    }, 1500);
  }catch(err){ console.error('Auto schedule error:',err); }
}

// ---- SAVE EDIT HELPER ----
var _editId = '';
async function saveEdit(tbl, dat){
  if(!_editId) return;
  var res = await sb.from(tbl).update(dat).eq('id',_editId);
  if(res.error){ showAlert('Error: '+res.error.message); return; }
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
    +'<div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="'+(j.notes||'')+'"/></div>'
    +'<div style="margin-top:8px;display:flex;gap:8px;">'
    +'<button type="button" class="btn btn-outline btn-sm" onclick="downloadJobICS((_jobs||[]).find(function(x){return x.id===\''+id+'\';})||{})">📅 Download to Calendar</button>'
    +'<button type="button" class="btn btn-danger btn-sm" style="color:#fff;" onclick="deleteJob(\''+id+'\');closeModal();">🗑 Delete</button>'
    +'</div>';
  document.getElementById('modal-save').onclick = async function(){
    function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
    var newSt=gv('f-status');
    var prevSt = j.status;
    await saveEdit('jobs',{client_name:gv('f-client'),service:gv('f-service'),amount:parseFloat(gv('f-amount'))||0,scheduled_date:gv('f-date')||null,scheduled_time:gv('f-time')||null,address:gv('f-address'),status:newSt,notes:gv('f-notes')});
    // Auto-create invoice when job is marked Completed
    if(newSt==='Completed' && prevSt!=='Completed'){
      await autoCreateInvoice(j.id, gv('f-client'), gv('f-service'), parseFloat(gv('f-amount'))||0);
    }
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
    +'<div><div class="inv-co">The Best Cleaning LLC</div><div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:3px;">Lubbock, TX &bull; (806) 620-1613</div></div>'
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
    +'<div style="text-align:center;margin-top:16px;font-size:11px;color:var(--tx3);">Thank you for choosing The Best Cleaning LLC! &bull; thebestcleaning78@gmail.com</div>'
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

async function sendInvoice(id){
  var inv = (_allInvoices||[]).find(function(x){ return x.id===id; })||{};
  if(!inv.id){ showAlert('Invoice not found.'); return; }
  window._currentInv = inv;
  
  // Auto-buscar email y teléfono del cliente
  var email = inv.client_email||'';
  var phone = inv.client_phone||'';
  
  if(!email || !phone){
    var cli = (_allClients||[]).find(function(c){
      return c.name && inv.client_name && c.name.toLowerCase()===inv.client_name.toLowerCase();
    });
    if(cli){
      email = email || cli.email || '';
      phone = phone || cli.phone || '';
    } else {
      // Buscar en Supabase si no está en memoria
      try{
        var res = await sb.from('clients').select('email,phone').ilike('name', inv.client_name).limit(1);
        if(res.data && res.data.length){
          email = email || res.data[0].email || '';
          phone = phone || res.data[0].phone || '';
        }
      }catch(e){}
    }
  }
  
  openInvoiceSendModal(inv, email, phone);
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
    // 1. Crear link de pago Stripe siempre
    var payUrl = inv.payment_url || '';
    if(!payUrl){
      try{
        var plRes = await sb.functions.invoke('create-invoice-payment',{body:{
          invoice_id: inv.id,
          client_name: inv.client_name,
          amount: Number(inv.amount||0),
          invoice_number: inv.invoice_number,
          description: inv.service||'Cleaning Service'
        }});
        if(plRes.data&&plRes.data.url) payUrl=plRes.data.url;
      }catch(e){ console.log('Stripe link error:',e); }
    }

    // 2. Guardar payment_url en el invoice
    if(payUrl){
      await sb.from('invoices').update({payment_url:payUrl}).eq('id',inv.id);
    }

    if(viaVal==='email'&&email){
      // Usar send-invoice-email con invoice_id y view link
      var viewUrl = window.location.origin+'/invoice-view.html?id='+inv.id;
      var emailRes = await sb.functions.invoke('send-invoice-email',{body:{
        invoice_id: inv.id,
        to: email,
        view_url: viewUrl
      }});
      if(emailRes.error) throw new Error('Email error: '+JSON.stringify(emailRes.error));
      await sb.from('invoices').update({status:'Sent',client_email:email}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='Invoice sent to '+email+'! ✅';
    }
    if(viaVal==='whatsapp'&&phone){
      var invNum=String(inv.invoice_number||0).padStart(3,'0');
      var msg='Hi '+inv.client_name+'! 🧹\n\nYour invoice #'+invNum+' for $'+Number(inv.amount||0).toFixed(2)+' is ready.\nService: '+(inv.service||'Cleaning Service')+'\nDue: '+fmtD(inv.due_date)+'.'+(payUrl?'\n\n💳 Pay here: '+payUrl:'')+(note?'\n\nNote: '+note:'')+'\n\nThank you! — The Best Cleaning LLC (806) 620-1613';
      window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
      await sb.from('invoices').update({status:'Sent'}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='WhatsApp opened! ✅';
    }
    if(viaVal==='sms'&&phone){
      var invNum2=String(inv.invoice_number||0).padStart(3,'0');
      await sb.functions.invoke('smooth-responder',{body:{to:phone,custom_message:'Hi '+inv.client_name+'! Invoice #'+invNum2+' for $'+Number(inv.amount||0).toFixed(2)+'. Due: '+fmtD(inv.due_date)+'.'+(payUrl?' Pay: '+payUrl:'')+' — The Best Cleaning LLC (806) 620-1613'}});
      await sb.from('invoices').update({status:'Sent'}).eq('id',inv.id);
      document.getElementById('inv-result').style.color='var(--green)';
      document.getElementById('inv-result').textContent='SMS sent! ✅';
    }
    loadInvoices();
    setTimeout(function(){ document.getElementById('inv-modal-bg').classList.remove('open'); },2000);
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
  document.getElementById('sms-preview').textContent = 'Hi '+(j.client_name||'')+'! Reminder: your cleaning '+(j.service?'('+j.service+') ':'')+' is scheduled for '+fmtD(j.scheduled_date)+(j.scheduled_time?' at '+fmtT(j.scheduled_time):'')+'. Questions? Call (806) 620-1613. — The Best Cleaning LLC';
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
function copyReviewLink(){
  var link = 'https://g.page/r/CXEOhJ_XWtKBEB0/review';
  navigator.clipboard.writeText(link).then(function(){
    showAlert('Review link copied! Share it with your clients after each job.');
  }).catch(function(){
    showAlert('Copy this link: https://g.page/r/CXEOhJ_XWtKBEB0/review');
  });
}

function sendReviewWhatsApp(){
  var msg = 'Hi! Thank you for choosing The Best Cleaning LLC! We hope you loved our service. Would you mind leaving us a Google review? It only takes 1 minute and helps us a lot! 🌟\n\nhttps://g.page/r/CXEOhJ_XWtKBEB0/review\n\nThank you! — Maria (806) 620-1613';
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

// ---- INVOICE HELPERS ----
function invCalcDue(){
  var idate = document.getElementById('f-idate');
  var terms = document.getElementById('f-terms');
  var due = document.getElementById('f-due');
  if(!idate || !terms || !due) return;
  var d = new Date(idate.value+'T12:00:00');
  d.setDate(d.getDate() + parseInt(terms.value||0));
  due.value = d.toISOString().slice(0,10);
}

function invCalcTotal(){
  var qty = parseFloat(document.getElementById('f-qty')?.value||1)||1;
  var rate = parseFloat(document.getElementById('f-rate')?.value||0)||0;
  var tax = parseFloat(document.getElementById('f-tax')?.value||0)||0;
  var subtotal = qty * rate;
  var taxAmt = subtotal * tax / 100;
  var total = subtotal + taxAmt;
  var sub = document.getElementById('inv-subtotal');
  var taxEl = document.getElementById('inv-tax-amt');
  var totEl = document.getElementById('inv-total');
  var amtEl = document.getElementById('f-amount');
  if(sub) sub.textContent = '$'+subtotal.toFixed(2);
  if(taxEl) taxEl.textContent = '$'+taxAmt.toFixed(2);
  if(totEl) totEl.textContent = '$'+total.toFixed(2);
  if(amtEl) amtEl.value = total.toFixed(2);
}

async function invAutoFill(){
  var clientEl = document.getElementById('f-client');
  if(!clientEl || clientEl.value.length < 2) return;
  var res = await sb.from('clients').select('email,address,price_per_visit').ilike('name', clientEl.value+'%').limit(1).maybeSingle();
  if(res.data){
    var emailEl = document.getElementById('f-email');
    var addrEl = document.getElementById('f-address');
    var rateEl = document.getElementById('f-rate');
    if(emailEl && res.data.email) emailEl.value = res.data.email;
    if(addrEl && res.data.address) addrEl.value = res.data.address;
    if(rateEl && res.data.price_per_visit) { rateEl.value = res.data.price_per_visit; invCalcTotal(); }
  }
}

async function saveAndSendInvoice(){
  await saveModal();
  var bid = await getBizId();
  var res = await sb.from('invoices').select('id').eq('business_id', bid).order('created_at',{ascending:false}).limit(1).single();
  if(res.data){
    await sendInvoice(res.data.id);
  }
}

setTimeout(function(){
  var terms = document.getElementById('f-terms');
  if(terms) invCalcDue();
}, 300);


// ---- QUICK JOB FROM CLIENT ----
function quickJob(clientId){
  var c = (_allClients||[]).find(function(x){ return x.id===clientId; })||{};
  if(!c.id){ showAlert('Client not found.'); return; }
  
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  var tomorrowStr = tomorrow.toISOString().slice(0,10);
  
  document.getElementById('modal-title').textContent = '+ New Job for '+c.name;
  document.getElementById('modal-body').innerHTML =
    '<div style="background:var(--purple-light);border-radius:var(--radius-lg);padding:12px 16px;margin-bottom:14px;">'
    +'<div style="font-size:13px;font-weight:700;color:var(--purple);">'+(c.name||'')+'</div>'
    +'<div style="font-size:12px;color:var(--tx3);">'+(c.address||'No address')+'</div>'
    +'<div style="font-size:12px;color:var(--tx3);">'+(c.frequency||'Monthly')+' — '+fmt(c.price_per_visit||0)+' per visit</div>'
    +'</div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Date *</label>'
    +'<input class="form-input" id="qj-date" type="date" value="'+tomorrowStr+'"/></div>'
    +'<div class="form-group"><label class="form-label">Time</label>'
    +'<input class="form-input" id="qj-time" type="time" value="'+(c.preferred_time||'09:00')+'"/></div></div>'
    +'<div class="form-group"><label class="form-label">Service</label>'
    +'<input class="form-input" id="qj-service" value="Regular Cleaning"/></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Amount ($)</label>'
    +'<input class="form-input" id="qj-amount" type="number" value="'+(c.price_per_visit||0)+'"/></div>'
    +'<div class="form-group"><label class="form-label">Status</label>'
    +'<select class="form-input" id="qj-status"><option>Scheduled</option><option>To confirm</option></select></div></div>'
    +'<div class="form-group"><label class="form-label">Notes</label>'
    +'<input class="form-input" id="qj-notes" placeholder="Optional notes..."/></div>';
  
  document.getElementById('modal-save').textContent = '✅ Create Job';
  document.getElementById('modal-save').onclick = async function(){
    var btn = document.getElementById('modal-save');
    btn.textContent = 'Saving...'; btn.disabled = true;
    try{
      function gv(id){ var el=document.getElementById(id); return el?el.value:''; }
      var bid = await getBizId();
      var jRes = await sb.from('jobs').select('job_number').order('job_number',{ascending:false}).limit(1);
      var jn = (jRes.data&&jRes.data.length?(jRes.data[0].job_number||0):0)+1;
      var dat = {
        job_number: jn,
        client_name: c.name,
        service: gv('qj-service')||'Regular Cleaning',
        amount: parseFloat(gv('qj-amount'))||c.price_per_visit||0,
        scheduled_date: gv('qj-date')||null,
        scheduled_time: gv('qj-time')||null,
        address: c.address||'',
        status: gv('qj-status')||'Scheduled',
        notes: gv('qj-notes')||'',
        business_id: bid
      };
      var res = await sb.from('jobs').insert([dat]);
      if(res.error) throw res.error;
      
      // Sync to Google Calendar
      if(dat.scheduled_date){
        syncToGoogleCalendar(dat).catch(function(e){ console.log('Cal sync:',e.message); });
      }
      
      closeModal();
      showAlert('✅ Job created for '+c.name+' on '+fmtD(dat.scheduled_date)+'!');
      loadClients();
    }catch(err){
      showAlert('Error: '+err.message);
    }
    btn.textContent = '✅ Create Job'; btn.disabled = false;
  };
  document.getElementById('modal-bg').classList.add('open');
}


// ---- AUTO CREATE INVOICE WHEN JOB COMPLETED (like Jobber) ----
async function autoCreateInvoice(jobId, clientName, service, amount){
  try{
    var bid = await getBizId();
    // Get next invoice number
    var iRes = await sb.from('invoices').select('invoice_number').order('invoice_number',{ascending:false}).limit(1);
    var invN = (iRes.data&&iRes.data.length?(iRes.data[0].invoice_number||0):0)+1;
    var due = new Date(); due.setDate(due.getDate()+7);
    var dueStr = due.toISOString().slice(0,10);

    // Create invoice
    var invRes = await sb.from('invoices').insert([{
      invoice_number: invN,
      client_name: clientName,
      service: service||'Regular Cleaning',
      description: service||'Regular Cleaning',
      amount: amount,
      balance: amount,
      due_date: dueStr,
      issue_date: new Date().toISOString().slice(0,10),
      status: 'Draft',
      tax_rate: 0,
      discount: 0,
      notes: 'Auto-generated from job completion',
      job_id: jobId,
      business_id: bid
    }]).select().single();

    if(invRes.error) throw invRes.error;
    var newInv = invRes.data;

    // Create Stripe payment link
    var payRes = await sb.functions.invoke('create-invoice-payment',{body:{
      invoice_id: newInv.id,
      client_name: clientName,
      amount: amount,
      invoice_number: invN,
      description: service||'Regular Cleaning'
    }});
    var payUrl = payRes.data&&payRes.data.url ? payRes.data.url : '';

    // Save payment_url
    if(payUrl){
      await sb.from('invoices').update({payment_url:payUrl}).eq('id',newInv.id);
      newInv.payment_url = payUrl;
    }

    // Get client email
    var cliRes = await sb.from('clients').select('email,phone').ilike('name',clientName).limit(1);
    var cli = cliRes.data&&cliRes.data.length ? cliRes.data[0] : {};

    // Send email if client has email
    if(cli.email){
      await sb.functions.invoke('send-invoice-email',{body:{
        invoice_id: newInv.id,
        to: cli.email
      }});
      await sb.from('invoices').update({status:'Sent',client_email:cli.email}).eq('id',newInv.id);
      showAlert('Job completed! Invoice #'+String(invN).padStart(3,'0')+' created and sent to '+cli.email+' with Pay Now link. 🎉');
    } else {
      showAlert('Job completed! Invoice #'+String(invN).padStart(3,'0')+' created for $'+amount+'. Add client email to send automatically.');
    }

    loadInvoices();
  }catch(err){
    console.error('Auto invoice error:',err);
    showAlert('Job completed! Could not auto-create invoice: '+err.message);
  }
}

// ---- GOOGLE CALENDAR SYNC (silent — never blocks saving) ----
async function syncToGoogleCalendar(job){
  if(!job.scheduled_date) return;
  try{
    await sb.functions.invoke('google-calendar-sync',{body:{
      action: 'create',
      event: {
        client_name: job.client_name||'',
        service: job.service||'Cleaning',
        amount: job.amount||0,
        address: job.address||'',
        scheduled_date: job.scheduled_date,
        scheduled_time: (job.scheduled_time||'09:00:00').slice(0,8),
        end_time: '11:00:00'
      }
    }});
  }catch(e){
    // Silent fail — calendar sync is optional, saving always succeeds
    console.log('Google Calendar sync not available:',e.message);
  }
}
