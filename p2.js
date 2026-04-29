// ============================================================
// P2.JS — ALL DATA LOADING FUNCTIONS
// ============================================================
var SB_CS_URL = 'https://yfqoncqoerleoaqxvaie.supabase.co';
var SB_CS_KEY = 'sb_publishable_cbrrFqLqJMkUXJ4icNOn9g_lEv4NneF';

// ---- DASHBOARD ----
async function loadSchedule(){
  try{
    var r = await Promise.all([
      sb.from('jobs').select('*').order('scheduled_date'),
      sb.from('invoices').select('*'),
      sb.from('quotes').select('*'),
      sb.from('requests').select('*'),
      sb.from('payments').select('*')
    ]);
    var J=r[0].data||[], I=r[1].data||[], Q=r[2].data||[], R=r[3].data||[], P=r[4].data||[];
    _jobs=J; _allInvoices=I; _allPayments=P;

    var now=new Date(), m=now.getMonth(), y=now.getFullYear();
    var todayStr = now.toISOString().slice(0,10);

    var rev = P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getMonth()===m && new Date(p.payment_date).getFullYear()===y; })
               .reduce(function(a,p){ return a+Number(p.amount||0); }, 0);
    try{ document.getElementById('k-rev').textContent = fmt(rev); }catch(e){}

    var todayJobs = J.filter(function(j){ return j.scheduled_date===todayStr; });
    var activeJobs = J.filter(function(j){ return ['Scheduled','In progress','To confirm'].includes(j.status); });
    var overdue = I.filter(function(i){ return i.status==='Overdue'; });
    var outstanding = I.filter(function(i){ return i.status!=='Paid' && i.status!=='Cancelled'; });
    var openQ = Q.filter(function(q){ return q.status==='Awaiting'||q.status==='Draft'||q.status==='Sent'; });
    var newLeads = R.filter(function(r){ return r.status==='New'; });

    try{ document.getElementById('k-today').textContent = todayJobs.length; }catch(e){}
    try{ document.getElementById('k-today-s').textContent = 'jobs today'; }catch(e){}
    try{ document.getElementById('k-jobs').textContent = activeJobs.length; }catch(e){}
    try{ document.getElementById('k-out').textContent = fmt(outstanding.reduce(function(a,i){ return a+Number(i.balance||0); },0)); }catch(e){}
    try{ document.getElementById('k-out-s').textContent = overdue.length+' overdue'; }catch(e){}
    try{ document.getElementById('k-quo').textContent = openQ.length; }catch(e){}
    try{ document.getElementById('k-leads-dash').textContent = newLeads.length; }catch(e){}
    try{
      if(newLeads.length > 0){
        document.getElementById('leads-badge').textContent = newLeads.length;
        document.getElementById('leads-badge').style.display = 'inline';
      }
    }catch(e){}

    // Pipeline
    var pipe = {
      requests: R.filter(function(r){ return r.status==='New'; }),
      quotes:   Q.filter(function(q){ return ['Awaiting','Draft','Sent'].includes(q.status); }),
      scheduled:J.filter(function(j){ return ['Scheduled','To confirm'].includes(j.status); }),
      progress: J.filter(function(j){ return j.status==='Completed'; }),
      invoice:  J.filter(function(j){ return j.status==='Completed' && !j.invoice_id; })
    };
    var keys=['requests','quotes','scheduled','progress','invoice'], ids=['r','q','s','p','i'];
    var colors=['#5B21B6','#92400E','#1E40AF','#065F46','#1E40AF'];
    var btnColors=['#7C3AED','#F59E0B','#3B82F6','#10B981','#3B82F6'];
    var btnLabels=['View leads','Send estimate','Send reminder','Done+Invoice','Create invoice'];
    var btnActions=['leads','quotes','jobs','','invoices'];

    for(var k=0; k<keys.length; k++){
      var key=keys[k], pid=ids[k], items=pipe[key];
      try{ document.getElementById('pr-'+pid).textContent = items.length; }catch(e){}
      var el = document.getElementById('pr-'+pid+'c');
      if(!el) continue;
      if(!items.length){
        el.innerHTML = '<div style="font-size:11px;color:var(--tx3);text-align:center;padding:8px 0;">Empty</div>';
        continue;
      }
      var col=colors[k], bc=btnColors[k], bl=btnLabels[k], ba=btnActions[k];
      el.innerHTML = items.slice(0,3).map(function(i){
        var act = key==='progress'
          ? 'onclick="completeAndInvoice(\''+i.id+'\')"'
          : 'onclick="nav(\''+ba+'\',null)"';
        return '<div class="pipe-card">'
          +'<div class="pipe-name" style="color:'+col+';">'+(i.client_name||i.name||'--')+'</div>'
          +'<div class="pipe-svc">'+(i.service||'--')+'</div>'
          +(i.amount?'<div class="pipe-amt" style="color:'+col+';">'+fmt(i.amount)+'</div>':'')
          +'<div class="pipe-date">'+fmtD(i.scheduled_date||i.preferred_date||i.created_at)+'</div>'
          +'<button '+act+' class="pipe-action" style="background:'+bc+';color:#fff;">'+bl+'</button>'
          +'</div>';
      }).join('')+(items.length>3?'<div style="font-size:10px;color:var(--tx3);text-align:center;padding:4px;">+'+(items.length-3)+' more</div>':'');
    }

    // Today's jobs
    try{
      var el2 = document.getElementById('today-jobs-list');
      if(el2){
        if(!todayJobs.length){
          el2.innerHTML = '<div class="empty">No jobs today</div>';
        } else {
          el2.innerHTML = '<table><thead><tr><th>Client</th><th>Service</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>'
            +todayJobs.map(function(j){
              var doneBtn = (j.status!=='Completed'&&j.status!=='Paid'&&j.status!=='Invoiced')
                ? '<button onclick="completeAndInvoice(\''+j.id+'\')" class="btn btn-success btn-xs">Done+Invoice</button>'
                : '<span class="badge b-completed">Done</span>';
              return '<tr><td><b>'+(j.client_name||'--')+'</b></td><td>'+(j.service||'--')+'</td><td>'+fmtT(j.scheduled_time)+'</td><td>'+bdg(j.status)+'</td><td>'+doneBtn+'</td></tr>';
            }).join('')+'</tbody></table>';
        }
      }
    }catch(e){}

    // Unpaid invoices
    try{
      var el3 = document.getElementById('unpaid-inv-list');
      var unpaid = I.filter(function(i){ return i.status!=='Paid'&&i.status!=='Cancelled'; }).slice(0,5);
      if(el3){
        if(!unpaid.length){
          el3.innerHTML = '<div class="empty">All invoices are paid!</div>';
        } else {
          el3.innerHTML = '<table><thead><tr><th>Client</th><th>Amount</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>'
            +unpaid.map(function(i){
              return '<tr><td><b>'+(i.client_name||'--')+'</b></td><td>'+fmt(i.amount)+'</td><td>'+fmtD(i.due_date)+'</td><td>'+bdg(i.status)+'</td>'
                +'<td><button onclick="sendInvoice(\''+i.id+'\')" class="btn btn-primary btn-xs">Send</button></td></tr>';
            }).join('')+'</tbody></table>';
        }
      }
    }catch(e){}

  }catch(err){ console.error('loadSchedule error:',err); }
}

// ============================================================
// LEADS — con cobro automático Stripe
// ============================================================
async function loadLeads(){
  try{
    // Cargar leads de CleanSaver AI
    var res = await fetch(SB_CS_URL+'/rest/v1/leads?select=*&order=created_at.desc', {
      headers:{'apikey':SB_CS_KEY,'Authorization':'Bearer '+SB_CS_KEY}
    });
    var leads = res.ok ? await res.json() : [];

    // Cargar precios de leads
    var priceRes = await fetch(SB_CS_URL+'/rest/v1/lead_pricing?select=service_type,price&is_active=eq.true', {
      headers:{'apikey':SB_CS_KEY,'Authorization':'Bearer '+SB_CS_KEY}
    });
    var pricing = priceRes.ok ? await priceRes.json() : [];
    var priceMap = {};
    pricing.forEach(function(p){ priceMap[p.service_type] = p.price; });

    // Cargar claims del pro actual para saber cuáles ya reclamó
    var claimsRes = await sb.from('lead_claims').select('lead_id,status').eq('business_id', _bizId||'');
    var claims = claimsRes.data||[];
    var claimedMap = {};
    claims.forEach(function(c){ claimedMap[c.lead_id] = c.status; });

    // KPIs
    try{ document.getElementById('leads-new').textContent = leads.filter(function(l){ return l.status==='new'||l.status==='pending'; }).length; }catch(e){}
    try{ document.getElementById('leads-accepted').textContent = leads.filter(function(l){ return l.status==='accepted'||l.status==='claimed'; }).length; }catch(e){}
    try{ document.getElementById('leads-converted').textContent = leads.filter(function(l){ return l.status==='converted'; }).length; }catch(e){}

    var html = leads.length ? leads.map(function(l){
      var lid = l.id;
      var lstat = l.status||'new';
      var svcType = l.service||'';
      var leadPrice = priceMap[svcType] || 25;
      var alreadyClaimed = claimedMap[lid];

      var actionBtn = '';
      if(alreadyClaimed === 'paid'){
        // Ya reclamó este lead — mostrar contacto
        actionBtn = '<span class="badge b-active" style="margin-right:4px;">✓ Claimed</span>'
          +'<button onclick="viewLeadContact(\''+lid+'\')" class="btn btn-primary btn-xs">View Contact</button>';
      } else if(alreadyClaimed === 'pending'){
        actionBtn = '<span class="badge b-progress">Processing...</span>';
      } else if(lstat==='new'||lstat==='pending'){
        // No reclamado — mostrar botón con precio
        actionBtn = '<button onclick="claimLead(\''+lid+'\',\''+svcType+'\','+leadPrice+')" class="btn btn-success btn-xs" style="background:linear-gradient(135deg,#10B981,#059669);">'
          +'💳 Claim — $'+leadPrice
          +'</button>';
      } else if(lstat==='claimed'||lstat==='accepted'){
        actionBtn = '<span class="badge b-active">Claimed</span>';
      } else {
        actionBtn = '<span class="badge b-cancelled">'+lstat+'</span>';
      }

      var delBtn = '<button onclick="deleteLead(\''+lid+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);margin-left:4px;">Del</button>';

      return '<tr>'
        +'<td><b>'+(l.name||'--')+'</b><br><span style="font-size:11px;color:var(--tx3);">'+(l.address||'')+'</span></td>'
        +'<td>'+(svcType||'--')+'</td>'
        +'<td>'+(l.city||l.address||'--')+'</td>'
        +'<td>'+(l.budget?'$'+l.budget:'--')+'</td>'
        +'<td><b style="color:var(--purple);">$'+leadPrice+'</b></td>'
        +'<td>'+bdg(lstat)+'</td>'
        +'<td style="white-space:nowrap;">'+actionBtn+delBtn+'</td>'
        +'</tr>';
    }).join('') : '<tr><td colspan="7" class="empty">No leads yet — they appear here when clients request services on CleanSaver AI</td></tr>';

    try{ document.getElementById('leads-table').innerHTML = html; }catch(e){}
  }catch(err){ console.error('loadLeads error:',err); }
}

// ---- Reclamar un lead con cobro automático ----
async function claimLead(leadId, serviceType, leadPrice){
  // Verificar que tiene tarjeta
  if(!_bizId){ await getBizId(); }

  var bizRes = await sb.from('businesses').select('stripe_payment_method_id,card_last4,card_brand').eq('id',_bizId).single();
  var biz = bizRes.data||{};

  if(!biz.stripe_payment_method_id){
    showConfirm(
      '⚠️ No tienes una tarjeta guardada. ¿Quieres ir a Settings para agregar una?',
      function(){ nav('settings', document.querySelector('.ni:last-child')); },
      function(){}
    );
    return;
  }

  var brand = (biz.card_brand||'card').toUpperCase();
  var last4 = biz.card_last4||'----';

  showConfirm(
    '💳 Se cobrará $'+leadPrice+' a tu '+brand+' terminada en '+last4+'.\n\nUna vez que pagues verás el nombre, teléfono y email del cliente.\n\n¿Confirmas el cobro?',
    async function(){
      // Mostrar loading en el botón
      try{
        var btns = document.querySelectorAll('#leads-table button');
        btns.forEach(function(b){ if(b.textContent.includes('Claim')) b.textContent = 'Processing...'; b.disabled = true; });
      }catch(e){}

      try{
        var res = await fetch(SB_CS_URL+'/functions/v1/claim-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: leadId, business_id: _bizId })
        });
        var data = await res.json();

        if(data.success){
          showAlert(
            '✅ Lead reclamado exitosamente!\n\n'
            +'👤 Cliente: '+data.client.name+'\n'
            +'📞 Teléfono: '+data.client.phone+'\n'
            +'📧 Email: '+(data.client.email||'N/A')+'\n'
            +'📍 Dirección: '+data.client.address+'\n\n'
            +'💰 Cobrado: $'+data.charged+'\n\n'
            +'El cliente fue agregado a tus Requests en CleanPro TX.'
          );
          loadLeads();
          loadSchedule();
        } else if(data.code === 'NO_PAYMENT_METHOD'){
          showAlert('No tienes tarjeta guardada. Ve a Settings → Payment Method para agregar una.');
        } else if(data.code === 'PAYMENT_FAILED'){
          showAlert('❌ El cobro falló: '+(data.stripe_error||'Error desconocido')+'\n\nVerifica tu tarjeta en Settings.');
        } else {
          showAlert('Error: '+(data.error||'Intenta de nuevo'));
          loadLeads();
        }
      }catch(err){
        showAlert('Error de conexión: '+err.message);
        loadLeads();
      }
    },
    function(){ loadLeads(); }
  );
}

// ---- Ver contacto de lead ya reclamado ----
async function viewLeadContact(leadId){
  try{
    var res = await fetch(SB_CS_URL+'/rest/v1/leads?id=eq.'+leadId+'&select=name,phone,email,address,service', {
      headers:{'apikey':SB_CS_KEY,'Authorization':'Bearer '+SB_CS_KEY}
    });
    var data = await res.json();
    var l = data[0]||{};
    showAlert(
      '👤 '+l.name+'\n'
      +'📞 '+(l.phone||'N/A')+'\n'
      +'📧 '+(l.email||'N/A')+'\n'
      +'📍 '+(l.address||'N/A')+'\n'
      +'🔧 '+(l.service||'N/A')
    );
  }catch(e){
    showAlert('Error al cargar el contacto');
  }
}

async function declineLead(id){
  await fetch(SB_CS_URL+'/rest/v1/leads?id=eq.'+id, {
    method:'PATCH',
    headers:{'apikey':SB_CS_KEY,'Authorization':'Bearer '+SB_CS_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({status:'declined'})
  });
  loadLeads();
}

// ---- CLIENTS ----
async function loadClients(statusFilter){
  var res = await sb.from('clients').select('*').order('name');
  var C = res.data||[]; _allClients = C;
  if(statusFilter && statusFilter!=='all') C = C.filter(function(c){ return c.status===statusFilter; });
  try{ document.getElementById('k-tc').textContent = _allClients.length; }catch(e){}
  try{ document.getElementById('k-ac').textContent = _allClients.filter(function(c){ return c.status==='Active'; }).length; }catch(e){}
  try{ document.getElementById('k-av').textContent = fmt(_allClients.length ? _allClients.reduce(function(a,c){ return a+Number(c.price_per_visit||0); },0)/_allClients.length : 0); }catch(e){}
  var html = C.length ? C.map(function(c){
    var cid=c.id;
    return '<tr>'
      +'<td><b>'+(c.name||'--')+'</b><br><span style="font-size:11px;color:var(--tx3);">'+(c.email||'')+'</span></td>'
      +'<td>'+(c.phone||'--')+'</td>'
      +'<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(c.address||'--')+'</td>'
      +'<td><span class="badge b-scheduled">'+(c.frequency||'Monthly')+'</span></td>'
      +'<td><b>'+fmt(c.price_per_visit||0)+'</b></td>'
      +'<td>'+bdg(c.status||'Active')+'</td>'
      +'<td style="white-space:nowrap;">'
      +'<button onclick="editClient(\''+cid+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deleteClient(\''+cid+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="7" class="empty">No clients yet. Add your first client!</td></tr>';
  try{ document.getElementById('clients-table').innerHTML = html; }catch(e){}
}

// ---- JOBS ----
async function loadJobs(statusFilter){
  var res = await sb.from('jobs').select('*').order('scheduled_date',{ascending:false});
  var allJ = res.data||[]; _jobs = allJ;
  var today = new Date().toISOString().slice(0,10);
  var week = new Date(); week.setDate(week.getDate()+7);
  try{ document.getElementById('k-tj').textContent = allJ.filter(function(j){ return j.scheduled_date===today; }).length; }catch(e){}
  try{ document.getElementById('k-wj').textContent = allJ.filter(function(j){ return j.scheduled_date && new Date(j.scheduled_date+'T12:00:00')<=week; }).length; }catch(e){}
  try{ document.getElementById('k-cj').textContent = allJ.filter(function(j){ return j.status==='Completed'; }).length; }catch(e){}
  try{ document.getElementById('k-rj').textContent = fmt(allJ.filter(function(j){ return j.status==='Completed'||j.status==='Paid'||j.status==='Invoiced'; }).reduce(function(a,j){ return a+Number(j.amount||0); },0)); }catch(e){}

  var todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  var rows = allJ.filter(function(j){
    if(!j.scheduled_date) return true;
    return new Date(j.scheduled_date+'T23:59:59') <= todayEnd;
  });
  if(statusFilter && statusFilter!=='all') rows = rows.filter(function(j){ return j.status===statusFilter; });

  var html = rows.length ? rows.map(function(j){
    var jid=j.id;
    var nextBtn = '';
    if(j.status==='Scheduled'||j.status==='In progress'||j.status==='To confirm'){
      nextBtn = '<button onclick="completeAndInvoice(\''+jid+'\')" class="btn btn-success btn-xs">Done+Invoice</button>';
    } else if(j.status==='Completed'){
      nextBtn = '<button onclick="createInvoiceFromJob(\''+jid+'\',_jobs.find(function(x){return x.id===\''+jid+'\';})||{})" class="btn btn-primary btn-xs">Create Invoice</button>';
    } else if(j.status==='Invoiced'){
      nextBtn = '<span class="badge b-invoiced">Invoiced</span>';
    } else if(j.status==='Paid'){
      nextBtn = '<span class="badge b-paid">Paid</span>';
    } else {
      nextBtn = '<button onclick="editJob(\''+jid+'\')" class="btn btn-outline btn-xs">Schedule</button>';
    }
    return '<tr>'
      +'<td><b style="color:var(--purple);">#J-'+String(j.job_number||0).padStart(3,'0')+'</b></td>'
      +'<td><b>'+(j.client_name||'--')+'</b></td>'
      +'<td>'+(j.service||'--')+'</td>'
      +'<td>'+fmtD(j.scheduled_date)+'</td>'
      +'<td>'+fmtT(j.scheduled_time)+'</td>'
      +'<td><b>'+fmt(j.amount)+'</b></td>'
      +'<td>'+bdg(j.status||'Scheduled')+'</td>'
      +'<td style="white-space:nowrap;">'+nextBtn+' '
      +mapsBtn(j.address)+' '
      +smsBtn(jid)+' '
      +photoBtn(jid)+' '
      +'<button onclick="editJob(\''+jid+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deleteJob(\''+jid+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="8" class="empty">No jobs found</td></tr>';
  try{ document.getElementById('jobs-table').innerHTML = html; }catch(e){}
}

// ---- QUOTES ----
async function loadQuotes(statusFilter){
  var res = await sb.from('quotes').select('*').order('created_at',{ascending:false});
  var Q = res.data||[]; _allQuotes = Q;
  try{ document.getElementById('k-qt').textContent = Q.length; }catch(e){}
  try{ document.getElementById('k-qp').textContent = Q.filter(function(q){ return ['Awaiting','Draft','Sent'].includes(q.status); }).length; }catch(e){}
  try{ document.getElementById('k-qa').textContent = Q.filter(function(q){ return q.status==='Approved'; }).length; }catch(e){}
  try{ document.getElementById('k-qv').textContent = fmt(Q.reduce(function(a,q){ return a+Number(q.amount||0); },0)); }catch(e){}

  var rows = Q;
  if(statusFilter && statusFilter!=='all') rows = rows.filter(function(q){ return q.status===statusFilter; });

  var html = rows.length ? rows.map(function(q){
    var qid=q.id;
    var actions = '';
    if(q.status==='Draft') actions = '<button onclick="sendQuote(\''+qid+'\')" class="btn btn-primary btn-xs">Send</button> ';
    else if(q.status==='Awaiting'||q.status==='Sent') actions = '<button onclick="approveQuote(\''+qid+'\')" class="btn btn-success btn-xs">Approve</button> ';
    else if(q.status==='Approved') actions = '<button onclick="convertQuoteToJob(\''+qid+'\')" class="btn btn-success btn-xs">→ Job</button> ';
    actions += '<button onclick="editQuote(\''+qid+'\')" class="btn btn-outline btn-xs">Edit</button> ';
    actions += '<button onclick="deleteQuote(\''+qid+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>';
    return '<tr>'
      +'<td><b style="color:var(--purple);">#E-'+String(q.quote_number||0).padStart(3,'0')+'</b></td>'
      +'<td><b>'+(q.client_name||'--')+'</b></td>'
      +'<td>'+(q.service||'--')+'</td>'
      +'<td><b>'+fmt(q.amount)+'</b></td>'
      +'<td>'+fmtD(q.expiry_date)+'</td>'
      +'<td>'+bdg(q.status||'Draft')+'</td>'
      +'<td style="white-space:nowrap;">'+actions+'</td></tr>';
  }).join('') : '<tr><td colspan="7" class="empty">No estimates yet</td></tr>';
  try{ document.getElementById('quotes-table').innerHTML = html; }catch(e){}
}

// ---- INVOICES ----
async function loadInvoices(statusFilter){
  var res = await sb.from('invoices').select('*').order('created_at',{ascending:false});
  var I = res.data||[]; _allInvoices = I;
  var now=new Date(), m=now.getMonth(), y=now.getFullYear();
  var thisMonth = I.filter(function(i){ return new Date(i.created_at).getMonth()===m && new Date(i.created_at).getFullYear()===y; });
  try{ document.getElementById('k-ii').textContent = thisMonth.length; }catch(e){}
  try{ document.getElementById('k-ib').textContent = fmt(I.reduce(function(a,i){ return a+Number(i.amount||0); },0)); }catch(e){}
  try{ document.getElementById('k-io').textContent = fmt(I.filter(function(i){ return i.status!=='Paid'&&i.status!=='Cancelled'; }).reduce(function(a,i){ return a+Number(i.balance||0); },0)); }catch(e){}
  try{ document.getElementById('k-ia').textContent = I.filter(function(i){ return i.status==='Overdue'; }).length+' overdue'; }catch(e){}

  var rows = I;
  if(statusFilter && statusFilter!=='all') rows = rows.filter(function(i){ return i.status===statusFilter; });

  var html = rows.length ? rows.map(function(i){
    var iid=i.id;
    return '<tr>'
      +'<td><b style="color:var(--purple);">#'+String(i.invoice_number||0).padStart(3,'0')+'</b></td>'
      +'<td><b>'+(i.client_name||'--')+'</b><br><span style="font-size:11px;color:var(--tx3);">'+(i.service||'')+'</span></td>'
      +'<td>'+fmtD(i.due_date)+'</td>'
      +'<td><b>'+fmt(i.amount)+'</b></td>'
      +'<td>'+fmt(i.balance||0)+'</td>'
      +'<td>'+bdg(i.status||'Draft')+'</td>'
      +'<td style="white-space:nowrap;">'
      +'<button onclick="viewInvoice(\''+iid+'\')" class="btn btn-primary btn-xs">View</button> '
      +'<button onclick="sendInvoice(\''+iid+'\')" class="btn btn-success btn-xs">Send</button> '
      +'<button onclick="markInvoicePaid(\''+iid+'\')" class="btn btn-outline btn-xs" style="color:var(--green);border-color:var(--green);">Paid</button> '
      +'<button onclick="editInvoiceFull(\''+iid+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deleteInvoice(\''+iid+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="8" class="empty">No invoices yet</td></tr>';
  try{ document.getElementById('invoices-table').innerHTML = html; }catch(e){}
}

// ---- PAYMENTS ----
async function loadPayments(){
  var rp = await sb.from('payments').select('*').order('payment_date',{ascending:false});
  var ri = await sb.from('invoices').select('*');
  var P=rp.data||[], I=ri.data||[]; _allPayments=P;
  var now=new Date(), m=now.getMonth(), y=now.getFullYear();
  var mp = P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getMonth()===m && new Date(p.payment_date).getFullYear()===y; });
  try{ document.getElementById('k-pr').textContent = fmt(mp.reduce(function(a,p){ return a+Number(p.amount||0); },0)); }catch(e){}
  try{ document.getElementById('k-po').textContent = fmt(I.filter(function(i){ return i.status!=='Paid'&&i.status!=='Cancelled'; }).reduce(function(a,i){ return a+Number(i.balance||0); },0)); }catch(e){}
  try{ document.getElementById('k-pc').textContent = P.length; }catch(e){}
  var methods={}; P.forEach(function(p){ methods[p.method]=(methods[p.method]||0)+1; });
  var top = Object.entries(methods).sort(function(a,b){ return b[1]-a[1]; })[0];
  try{ document.getElementById('k-pm').textContent = top?top[0]:'--'; }catch(e){}
  var html = P.length ? P.map(function(p){
    return '<tr><td><b>'+(p.client_name||'--')+'</b></td><td><b>'+fmt(p.amount)+'</b></td><td>'+(p.method||'--')+'</td><td>'+fmtD(p.payment_date)+'</td><td>'+bdg(p.status||'Paid')+'</td>'
      +'<td style="white-space:nowrap;">'
      +'<button onclick="editPayment(\''+p.id+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deletePayment(\''+p.id+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="6" class="empty">No payments yet</td></tr>';
  try{ document.getElementById('payments-table').innerHTML = html; }catch(e){}
}

// ---- EXPENSES ----
async function loadExpenses(){
  var re = await sb.from('expenses').select('*').order('expense_date',{ascending:false});
  var rp = await sb.from('payments').select('*');
  var E=re.data||[], P=rp.data||[];
  var now=new Date(), m=now.getMonth(), y=now.getFullYear();
  var me = E.filter(function(e){ return new Date(e.expense_date).getMonth()===m && new Date(e.expense_date).getFullYear()===y; });
  var te = me.reduce(function(a,e){ return a+Number(e.amount||0); },0);
  var tr = P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getMonth()===m && new Date(p.payment_date).getFullYear()===y; }).reduce(function(a,p){ return a+Number(p.amount||0); },0);
  try{ document.getElementById('k-et').textContent = fmt(te); }catch(e){}
  try{ document.getElementById('k-ep').textContent = fmt(tr-te); }catch(e){}
  var cats={}; E.forEach(function(e){ cats[e.category]=(cats[e.category]||0)+Number(e.amount||0); });
  var topc = Object.entries(cats).sort(function(a,b){ return b[1]-a[1]; })[0];
  try{ document.getElementById('k-ec').textContent = topc?topc[0]:'--'; }catch(e){}
  var html = E.length ? E.map(function(e){
    return '<tr><td>'+(e.description||'--')+'</td><td>'+(e.category||'--')+'</td><td><b>'+fmt(e.amount)+'</b></td><td>'+fmtD(e.expense_date)+'</td>'
      +'<td style="white-space:nowrap;">'
      +'<button onclick="editExpense(\''+e.id+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deleteExpense(\''+e.id+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="5" class="empty">No expenses yet</td></tr>';
  try{ document.getElementById('expenses-table').innerHTML = html; }catch(e){}
}

// ---- REPORTS ----
async function loadReports(){
  try{
    var rc = await sb.from('clients').select('*');
    var rp = await sb.from('payments').select('*');
    var re = await sb.from('expenses').select('*');
    var C=rc.data||[], P=rp.data||[], E=re.data||[];
    var yr = new Date().getFullYear();
    var rev = P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getFullYear()===yr; }).reduce(function(a,p){ return a+Number(p.amount||0); },0);
    var exp = E.filter(function(e){ return new Date(e.expense_date).getFullYear()===yr; }).reduce(function(a,e){ return a+Number(e.amount||0); },0);
    try{ document.getElementById('k-rr').textContent = fmt(rev); }catch(e){}
    try{ document.getElementById('k-re').textContent = fmt(exp); }catch(e){}
    try{ document.getElementById('k-rp').textContent = fmt(rev-exp); }catch(e){}
    try{ document.getElementById('k-rc').textContent = C.length; }catch(e){}

    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var mrev = months.map(function(_,i){ return P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getMonth()===i && new Date(p.payment_date).getFullYear()===yr; }).reduce(function(a,p){ return a+Number(p.amount||0); },0); });
    var mexp = months.map(function(_,i){ return E.filter(function(e){ return new Date(e.expense_date).getMonth()===i && new Date(e.expense_date).getFullYear()===yr; }).reduce(function(a,e){ return a+Number(e.amount||0); },0); });
    var mhtml = '';
    months.forEach(function(mo,i){
      if(mrev[i]>0||mexp[i]>0){
        var profit = mrev[i]-mexp[i];
        mhtml += '<tr><td>'+mo+'</td><td style="color:var(--green);"><b>'+fmt(mrev[i])+'</b></td><td style="color:var(--red);">'+fmt(mexp[i])+'</td><td style="color:'+(profit>=0?'var(--green)':'var(--red)')+'"><b>'+fmt(profit)+'</b></td></tr>';
      }
    });
    try{ document.getElementById('monthly-table').innerHTML = mhtml||'<tr><td colspan="4" class="empty">No data yet</td></tr>'; }catch(e){}

    var ct={}; P.forEach(function(p){ var n=p.client_name||'Unknown'; if(!ct[n])ct[n]={jobs:0,total:0}; ct[n].jobs++; ct[n].total+=Number(p.amount||0); });
    var top = Object.entries(ct).sort(function(a,b){ return b[1].total-a[1].total; }).slice(0,10);
    try{ document.getElementById('reports-table').innerHTML = top.length ? top.map(function(e){ return '<tr><td><b>'+e[0]+'</b></td><td>'+e[1].jobs+'</td><td><b>'+fmt(e[1].total)+'</b></td></tr>'; }).join('') : '<tr><td colspan="3" class="empty">No data yet</td></tr>'; }catch(e){}
  }catch(err){ console.error('loadReports error:',err); }
}

// ---- GALLERY ----
async function loadGallery(){
  try{
    var res = await sb.storage.from('job-photos').list('',{limit:50,sortBy:{column:'created_at',order:'desc'}});
    var files = res.data||[];
    var el = document.getElementById('gallery-grid');
    if(!files.length){ if(el) el.innerHTML='<div class="empty">No photos yet</div>'; return; }
    if(el) el.innerHTML = files.map(function(f){
      var url = sb.storage.from('job-photos').getPublicUrl(f.name).data.publicUrl;
      return '<div style="border-radius:var(--radius-lg);overflow:hidden;aspect-ratio:1;cursor:pointer;" onclick="window.open(\''+url+'\',\'_blank\')"><img src="'+url+'" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/></div>';
    }).join('');
  }catch(err){ console.error('loadGallery error:',err); }
}

// ---- TIMESHEETS ----
async function loadTimesheets(){
  var res = await sb.from('timesheets').select('*').order('work_date',{ascending:false});
  var T = res.data||[];
  var html = T.length ? T.map(function(t){
    return '<tr><td><b>'+(t.employee_name||'--')+'</b></td><td>'+(t.job_description||'--')+'</td><td>'+fmtD(t.work_date)+'</td><td>'+fmtT(t.start_time)+'</td><td>'+fmtT(t.end_time)+'</td><td>'+(t.duration_hours?t.duration_hours+'h':'--')+'</td>'
      +'<td style="white-space:nowrap;">'
      +'<button onclick="editTimesheet(\''+t.id+'\')" class="btn btn-outline btn-xs">Edit</button> '
      +'<button onclick="deleteTimesheet(\''+t.id+'\')" class="btn btn-outline btn-xs" style="color:var(--red);border-color:var(--red);">Del</button>'
      +'</td></tr>';
  }).join('') : '<tr><td colspan="7" class="empty">No timesheets yet</td></tr>';
  try{ document.getElementById('timesheets-table').innerHTML = html; }catch(e){}
}

// ---- RECENT PHOTOS (dashboard) ----
async function loadRecentPhotos(){
  try{
    var res = await sb.storage.from('job-photos').list('',{limit:6,sortBy:{column:'created_at',order:'desc'}});
    var files = res.data||[];
    var el = document.getElementById('recent-photos-grid');
    if(!el) return;
    if(!files.length){ el.innerHTML='<div class="empty" style="font-size:12px;">No photos yet</div>'; return; }
    el.innerHTML = files.map(function(f){
      var url = sb.storage.from('job-photos').getPublicUrl(f.name).data.publicUrl;
      return '<div style="aspect-ratio:1;border-radius:var(--radius);overflow:hidden;cursor:pointer;" onclick="window.open(\''+url+'\',\'_blank\')">'
        +'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/></div>';
    }).join('');
  }catch(err){ console.error('loadRecentPhotos error:',err); }
}

// ---- COMPLETE & INVOICE ----
async function completeAndInvoice(jobId){
  var job = _jobs.find(function(j){ return j.id===jobId; })||{};
  if(!job.id){ showAlert('Job not found.'); return; }
  showConfirm('Mark job for '+job.client_name+' as Completed and create invoice?', async function(){
    await sb.from('jobs').update({status:'Completed'}).eq('id',jobId);
    _jobs = _jobs.map(function(j){ return j.id===jobId?Object.assign({},j,{status:'Completed'}):j; });
    loadJobs();
    await createInvoiceFromJob(jobId, job);
  }, function(){});
}

async function createInvoiceFromJob(jobId, jobData){
  try{
    var invRes = await sb.from('invoices').select('invoice_number').order('invoice_number',{ascending:false}).limit(1);
    var lastNum = invRes.data&&invRes.data.length ? (invRes.data[0].invoice_number||0) : 0;
    var dueDate = new Date(); dueDate.setDate(dueDate.getDate()+7);
    var clientRes = await sb.from('clients').select('email,phone,address').eq('name',jobData.client_name).maybeSingle();
    var email = clientRes.data&&clientRes.data.email||'';
    var phone = clientRes.data&&clientRes.data.phone||'';
    var bid = await getBizId();
    var inv = {
      invoice_number: lastNum+1,
      client_name: jobData.client_name,
      client_email: email,
      client_phone: phone,
      client_address: clientRes.data&&clientRes.data.address||jobData.address||'',
      service: jobData.service||'Regular Cleaning',
      description: jobData.service||'Regular Cleaning',
      amount: jobData.amount||0,
      balance: jobData.amount||0,
      tax_rate: 0, discount: 0,
      due_date: dueDate.toISOString().slice(0,10),
      issue_date: new Date().toISOString().slice(0,10),
      status: 'Draft',
      job_id: jobId,
      business_id: bid
    };
    var res = await sb.from('invoices').insert([inv]).select().single();
    if(res.error) throw res.error;
    window._currentInv = res.data;
    openInvoiceSendModal(res.data, email, phone);
    loadInvoices();
  }catch(err){ showAlert('Error creating invoice: '+err.message); }
}

// ---- QUOTE ACTIONS ----
async function sendQuote(id){
  await sb.from('quotes').update({status:'Sent'}).eq('id',id);
  showAlert('Estimate marked as Sent!');
  loadQuotes();
}
async function approveQuote(id){
  await sb.from('quotes').update({status:'Approved'}).eq('id',id);
  showAlert('Estimate approved!');
  loadQuotes();
}
async function convertQuoteToJob(id){
  var q = (_allQuotes||[]).find(function(x){ return x.id===id; })||{};
  var jRes = await sb.from('jobs').select('job_number').order('job_number',{ascending:false}).limit(1);
  var jn = (jRes.data&&jRes.data.length?(jRes.data[0].job_number||0):0)+1;
  var res = await sb.from('jobs').insert([{
    job_number: jn,
    client_name: q.client_name,
    service: q.service,
    amount: q.amount,
    address: q.address||'',
    status: 'Scheduled',
    scheduled_date: null
  }]);
  if(res.error){ showAlert('Error: '+res.error.message); return; }
  await sb.from('quotes').update({status:'Converted'}).eq('id',id);
  showAlert('Job created from estimate! Go to Jobs to schedule it.');
  loadQuotes();
}

// ---- INIT ----
window.addEventListener('load', function(){
  loadSchedule();
  loadRecentPhotos();
});

// ---- ACCOUNTING ----
async function loadAcct(){
  try{
    var yr = parseInt(document.getElementById('acct-year')?.value || new Date().getFullYear());
    var rp = await sb.from('payments').select('*');
    var re = await sb.from('expenses').select('*');
    var P = rp.data||[], E = re.data||[];
    var rev = P.filter(function(p){ return p.status==='Paid' && new Date(p.payment_date).getFullYear()===yr; }).reduce(function(a,p){ return a+Number(p.amount||0); },0);
    var exp = E.filter(function(e){ return new Date(e.expense_date).getFullYear()===yr; }).reduce(function(a,e){ return a+Number(e.amount||0); },0);
    var profit = rev - exp;
    var margin = rev > 0 ? Math.round(profit/rev*100) : 0;
    try{ document.getElementById('acct-rev').textContent = fmt(rev); }catch(e){}
    try{ document.getElementById('acct-exp').textContent = fmt(exp); }catch(e){}
    try{ document.getElementById('acct-profit').textContent = fmt(profit); document.getElementById('acct-profit').style.color = profit>=0?'var(--green)':'var(--red)'; }catch(e){}
    try{ document.getElementById('acct-margin').textContent = margin+'%'; }catch(e){}
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var mrev = months.map(function(_,i){ return P.filter(function(p){ return p.status==='Paid'&&new Date(p.payment_date).getMonth()===i&&new Date(p.payment_date).getFullYear()===yr; }).reduce(function(a,p){ return a+Number(p.amount||0); },0); });
    var mexp = months.map(function(_,i){ return E.filter(function(e){ return new Date(e.expense_date).getMonth()===i&&new Date(e.expense_date).getFullYear()===yr; }).reduce(function(a,e){ return a+Number(e.amount||0); },0); });
    var mhtml = months.map(function(mo,i){
      if(mrev[i]===0&&mexp[i]===0) return '';
      var mp = mrev[i]-mexp[i];
      return '<tr><td><b>'+mo+'</b></td><td style="color:var(--green);"><b>'+fmt(mrev[i])+'</b></td><td style="color:var(--red);">'+fmt(mexp[i])+'</td><td style="color:'+(mp>=0?'var(--green)':'var(--red)')+'"><b>'+fmt(mp)+'</b></td></tr>';
    }).filter(Boolean).join('');
    try{ document.getElementById('acct-monthly').innerHTML = mhtml||'<tr><td colspan="4" class="empty">No data for '+yr+'</td></tr>'; }catch(e){}
    var cats = {};
    E.filter(function(e){ return new Date(e.expense_date).getFullYear()===yr; }).forEach(function(e){ cats[e.category||'Other']=(cats[e.category||'Other']||0)+Number(e.amount||0); });
    var catHtml = Object.entries(cats).sort(function(a,b){ return b[1]-a[1]; }).map(function(c){
      var pct = exp>0?Math.round(c[1]/exp*100):0;
      return '<tr><td>'+c[0]+'</td><td>'+fmt(c[1])+'</td><td><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:6px;background:var(--border2);border-radius:3px;overflow:hidden;"><div style="height:100%;background:var(--purple);width:'+pct+'%;"></div></div>'+pct+'%</div></td></tr>';
    }).join('');
    try{ document.getElementById('acct-expenses-breakdown').innerHTML = catHtml||'<tr><td colspan="3" class="empty">No expenses</td></tr>'; }catch(e){}
    try{ document.getElementById('tax-income').textContent = fmt(rev); }catch(e){}
    try{
      document.getElementById('tax-expenses-list').innerHTML = Object.entries(cats).map(function(c){
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border2);font-size:12px;"><span style="color:var(--tx2);">'+c[0]+'</span><span style="font-weight:600;">'+fmt(c[1])+'</span></div>';
      }).join('')+'<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;"><span>Total Expenses</span><span style="color:var(--red);">'+fmt(exp)+'</span></div>';
    }catch(e){}
    try{ document.getElementById('tax-net').textContent = fmt(profit); document.getElementById('tax-net').style.color = profit>=0?'var(--green)':'var(--red)'; }catch(e){}
  }catch(err){ console.error('loadAcct error:',err); }
}

// ---- SETTINGS — carga perfil + estado de tarjeta ----
async function loadSettings(){
  try{
    var res = await sb.from('businesses').select('*').limit(1).single();
    var biz = res.data||{};
    try{ document.getElementById('s-bizname').value = biz.business_name||''; }catch(e){}
    try{ document.getElementById('s-owner').value = biz.owner_name||''; }catch(e){}
    try{ document.getElementById('s-phone').value = biz.phone||''; }catch(e){}
    try{ document.getElementById('s-email').value = biz.email||''; }catch(e){}
    try{ document.getElementById('s-service').value = biz.service_type||'Cleaning'; }catch(e){}
    try{ document.getElementById('s-city').value = biz.city||''; }catch(e){}
    try{ document.getElementById('s-address').value = biz.address||''; }catch(e){}
    try{ document.getElementById('s-website').value = biz.website||''; }catch(e){}
    try{ document.getElementById('s-plan-name').textContent = (biz.plan||'Basic')+' Plan'; }catch(e){}
    try{ document.getElementById('s-plan-status').textContent = biz.status||'Active'; }catch(e){}
    var user = await sb.auth.getUser();
    try{ document.getElementById('s-account-email').textContent = user.data.user?.email||'--'; }catch(e){}

    // ---- Cargar estado de tarjeta Stripe ----
    if(typeof loadCardStatus === 'function'){
      await loadCardStatus();
    }
  }catch(err){ console.error('loadSettings error:',err); }
}
