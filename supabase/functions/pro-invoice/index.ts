// ============================================================
// pro-invoice — Facturas de los pros de CleanPro TX
// Proyecto: CleanSaver / CleanPro (yfqoncqoerleoaqxvaie)
//
// Acciones (POST):
//  - {action:"view", id}            -> PUBLICA. La pagina invoice-view.html
//      la usa para mostrarle al cliente UNA factura (por su id) con el
//      nombre del negocio y sus formas de pago (Venmo, Cash App, Zelle).
//      La marca "Viewed" la primera vez.
//  - {action:"email", invoice_id, to} -> requiere sesion del pro.
//      Manda la factura por correo con el nombre del negocio. Las
//      respuestas del cliente le llegan al correo del pro.
//  - {action:"auto", job_id}        -> la llama la base de datos cuando un
//      trabajo pasa a Completed. Crea la factura (una por trabajo), descuenta
//      el deposito pagado y se la manda al cliente si tiene email.
//  - {action:"deposit", job_id}     -> la llama la base de datos cuando se
//      crea el PRIMER trabajo de un cliente y el negocio tiene "Deposit %".
//  - {action:"reminders"}           -> la llama el cron diario. Marca Overdue
//      y manda recordatorios (1, 7 y 14 dias despues de vencer).
//  auto/deposit/reminders son seguras de repetir: nunca duplican nada.
// El dinero va directo al pro (sus cuentas). CleanPro no cobra por el.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = "invoices@cleansavertx.com";
const VIEW_URL = "https://cleanprotx.vercel.app/invoice-view.html?id=";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function money(n: unknown) { return Number(n || 0).toFixed(2); }
function fmtPhone(p: unknown) {
  const d = String(p || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p || "");
}
function fmtDate(d: unknown) {
  const s = String(d || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function publicBiz(b: any) {
  return {
    business_name: b.business_name, phone: fmtPhone(b.phone), email: b.email, city: [b.city, b.state].filter(Boolean).join(", "),
    website: b.website, venmo_handle: b.venmo_handle, cashapp_tag: b.cashapp_tag, zelle_info: b.zelle_info, payment_note: b.payment_note,
  };
}
function publicInvoice(i: any) {
  return {
    invoice_number: i.invoice_number, client_name: i.client_name, service: i.service, description: i.description, notes: i.notes,
    amount: i.amount, balance: i.balance, discount: i.discount, tax_rate: i.tax_rate, issue_date: i.issue_date || i.issued_date || i.created_at,
    due_date: i.due_date, status: i.status, is_deposit: i.is_deposit,
  };
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#666;font-size:13px;">${label}</td><td align="right" style="padding:6px 0;color:#111827;font-weight:600;font-size:13px;">${value}</td></tr>`;
}

function emailHtml(inv: any, biz: any, reminder = false) {
  const num = String(inv.invoice_number || 0).padStart(3, "0");
  const pays = [
    biz.venmo_handle ? `Venmo: <b>@${esc(String(biz.venmo_handle).replace(/^@/, ""))}</b>` : "",
    biz.cashapp_tag ? `Cash App: <b>$${esc(String(biz.cashapp_tag).replace(/^\$/, ""))}</b>` : "",
    biz.zelle_info ? `Zelle: <b>${esc(biz.zelle_info)}</b>` : "",
  ].filter(Boolean);
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1e1b4b;padding:24px 28px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="color:#fff;font-size:22px;font-weight:700;">${esc(biz.business_name || "Invoice")}</div>
    <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">${esc([biz.city, biz.state].filter(Boolean).join(", "))}</div>
  </div>
  <div style="background:#f8f7ff;padding:24px 28px;">
    <h2 style="color:#1e1b4b;font-size:18px;margin:0 0 12px;">${inv.is_deposit ? "Deposit" : "Invoice"} #${num}</h2>
    <p style="color:#333;font-size:14px;">Hi ${esc(inv.client_name)},</p>
    <p style="color:#333;font-size:14px;">${reminder
      ? `Friendly reminder: this ${inv.is_deposit ? "deposit" : "invoice"} is still open. If you already paid, thank you — please ignore this email.`
      : `Thank you for your business! Here is your ${inv.is_deposit ? "deposit request" : "invoice"}:`}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin:16px 0;"><tr><td style="padding:16px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("Service", esc(inv.service || "Service"))}
        ${row("Due date", esc(fmtDate(inv.due_date)))}
        <tr><td colspan="2" style="border-top:2px solid #6366f1;padding-top:6px;"></td></tr>
        <tr><td style="color:#1e1b4b;font-weight:700;font-size:16px;">Total due</td>
        <td align="right" style="color:#4f46e5;font-weight:800;font-size:22px;">$${money(inv.balance ?? inv.amount)}</td></tr>
      </table></td></tr></table>
    <a href="${VIEW_URL}${inv.id}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:12px 0;">View invoice &amp; how to pay</a>
    ${pays.length ? `<p style="color:#333;font-size:13px;line-height:1.7;"><b>Pay with:</b><br>${pays.join("<br>")}</p>` : ""}
    ${biz.payment_note ? `<p style="color:#666;font-size:12px;">${esc(biz.payment_note)}</p>` : ""}
    <p style="color:#666;font-size:12px;margin-top:16px;">Questions? ${biz.phone ? "Call or text " + esc(fmtPhone(biz.phone)) : "Reply to this email"}.</p>
  </div>
  <div style="background:#1e1b4b;padding:12px;border-radius:0 0 12px 12px;text-align:center;color:#a5b4fc;font-size:11px;">Sent with CleanPro TX</div>
</div>`;
}


const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
const addDays = (d: string, n: number) => { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

async function sendInvoiceEmail(inv: any, biz: any, to: string, reminder = false) {
  if (!RESEND_KEY) throw new Error("Email is not set up yet (RESEND_API_KEY).");
  const num = String(inv.invoice_number || 0).padStart(3, "0");
  const name = String(biz.business_name || "Your service provider").replace(/[<>"]/g, "");
  const kind = inv.is_deposit ? "Deposit" : "Invoice";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${name} <${FROM_EMAIL}>`,
      reply_to: biz.email || undefined,
      to,
      subject: `${reminder ? "Reminder: " : ""}${kind} #${num} — $${money(inv.balance ?? inv.amount)} — ${name}`,
      html: emailHtml(inv, biz, reminder),
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id) throw new Error(d.message || "Email not sent");
  return d.id;
}

async function nextInvoiceNumber(bizId: string) {
  const { data } = await supabase.from("pro_invoices").select("invoice_number").eq("business_id", bizId)
    .order("invoice_number", { ascending: false }).limit(1);
  return ((data && data[0]?.invoice_number) || 0) + 1;
}

async function findClient(bizId: string, job: any) {
  if (job.client_id) {
    const { data } = await supabase.from("pro_clients").select("*").eq("id", job.client_id).maybeSingle();
    if (data) return data;
  }
  if (!job.client_name) return null;
  const { data } = await supabase.from("pro_clients").select("*").eq("business_id", bizId)
    .ilike("name", String(job.client_name).trim()).limit(1);
  return data && data[0] ? data[0] : null;
}

// Inserta con numero siguiente; si choca el numero, reintenta.
async function insertInvoice(row: any) {
  for (let i = 0; i < 3; i++) {
    row.invoice_number = await nextInvoiceNumber(row.business_id);
    const { data, error } = await supabase.from("pro_invoices").insert([row]).select("*").single();
    if (!error) return { data };
    if (error.code === "23505" && /one_per_job/.test(error.message)) return { duplicate: true };
    if (i === 2) throw new Error(error.message);
  }
  return {};
}

async function autoInvoice(jobId: string) {
  const { data: job } = await supabase.from("pro_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return { skipped: "job not found" };
  if (job.status !== "Completed") return { skipped: "job not completed" };
  const { data: ex } = await supabase.from("pro_invoices").select("id,invoice_number").eq("job_id", jobId)
    .or("is_deposit.is.null,is_deposit.eq.false").limit(1);
  if (ex && ex.length) return { skipped: "already invoiced", invoice_id: ex[0].id };
  const amount = Number(job.amount || 0);
  if (!(amount > 0)) return { skipped: "no amount" };
  const { data: biz } = await supabase.from("businesses").select("*").eq("id", job.business_id).maybeSingle();
  if (!biz) return { skipped: "no business" };
  const cli = await findClient(biz.id, job);

  // Depositos: el de este trabajo, o pagados del cliente sin descontar
  const { data: deps } = await supabase.from("pro_invoices").select("*").eq("business_id", biz.id).eq("is_deposit", true)
    .is("deposit_applied_invoice_id", null).neq("status", "Cancelled");
  const mine = (deps || []).filter((d: any) =>
    d.job_id === jobId || (!d.job_id && String(d.client_name || "").trim().toLowerCase() === String(job.client_name || "").trim().toLowerCase()));
  let depTotal = 0; const depUse: any[] = []; const depCancel: any[] = [];
  for (const d of mine) {
    if (d.status === "Paid") { if (depTotal < amount) { depTotal += Number(d.amount || 0); depUse.push(d); } }
    else if (d.job_id === jobId) depCancel.push(d); // deposito sin pagar: se cancela y se cobra todo en la factura
  }
  depTotal = Math.min(depTotal, amount);
  const balance = Math.round((amount - depTotal) * 100) / 100;

  let terms = parseInt(String(cli?.payment_terms ?? ""), 10);
  if (!(terms >= 0)) terms = biz.default_terms_days != null ? Number(biz.default_terms_days) : 2;
  const today = todayStr();
  const label = (job.service || "Cleaning") + (depTotal > 0 ? ` (balance after $${money(depTotal)} deposit)` : "");
  const email = (cli?.email || "").trim();
  const res = await insertInvoice({
    business_id: biz.id, client_id: cli?.id || job.client_id || null, client_name: job.client_name, job_id: jobId,
    service: label, description: label, amount: balance, balance, tax_rate: 0, discount: 0,
    issue_date: today, issued_date: today, due_date: addDays(today, terms),
    status: balance > 0 ? "Draft" : "Paid",
    notes: depTotal > 0 ? `Total $${money(amount)} minus deposit paid $${money(depTotal)}.` : "",
    client_email: email || null, client_phone: cli?.phone || null, client_address: job.address || cli?.address || null,
  });
  if (res.duplicate) return { skipped: "already invoiced" };
  const inv = res.data;
  if (depUse.length) await supabase.from("pro_invoices").update({ deposit_applied_invoice_id: inv.id }).in("id", depUse.map((d) => d.id));
  if (depCancel.length) await supabase.from("pro_invoices").update({ status: "Cancelled", balance: 0 }).in("id", depCancel.map((d) => d.id));
  await supabase.from("pro_jobs").update({ invoice_id: inv.id }).eq("id", jobId);

  let emailed = false, email_error = "";
  if (balance > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    try {
      await sendInvoiceEmail(inv, biz, email);
      await supabase.from("pro_invoices").update({ status: "Sent", sent_at: new Date().toISOString() }).eq("id", inv.id);
      await supabase.from("pro_jobs").update({ invoice_sent_at: new Date().toISOString() }).eq("id", jobId);
      emailed = true;
    } catch (e) { email_error = (e as Error).message; }
  }
  return { ok: true, invoice_id: inv.id, invoice_number: inv.invoice_number, balance, deposit_applied: depTotal, emailed, email, email_error };
}

async function createDeposit(jobId: string) {
  const { data: job } = await supabase.from("pro_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return { skipped: "job not found" };
  if (!["Scheduled", "To confirm"].includes(job.status)) return { skipped: "status" };
  const amount = Number(job.amount || 0);
  if (!(amount > 0)) return { skipped: "no amount" };
  const { data: biz } = await supabase.from("businesses").select("*").eq("id", job.business_id).maybeSingle();
  const pct = Number(biz?.deposit_percent || 0);
  if (!biz || !(pct > 0)) return { skipped: "deposits off" };
  const today = todayStr();
  if (job.scheduled_date && job.scheduled_date < today) return { skipped: "past job" };

  // Solo el primer trabajo del cliente (cliente nuevo), no cada visita repetida
  const { data: firstJobs } = await supabase.from("pro_jobs").select("id")
    .eq("business_id", biz.id).ilike("client_name", String(job.client_name || "").trim())
    .order("created_at", { ascending: true }).order("scheduled_date", { ascending: true, nullsFirst: false }).order("id").limit(1);
  if (!firstJobs || firstJobs[0]?.id !== jobId) return { skipped: "not first job" };

  const { data: ex } = await supabase.from("pro_invoices").select("id").eq("job_id", jobId).eq("is_deposit", true).limit(1);
  if (ex && ex.length) return { skipped: "deposit exists" };

  const dep = Math.round(amount * pct) / 100;
  const cli = await findClient(biz.id, job);
  const email = (cli?.email || "").trim();
  let due = addDays(today, 1);
  if (job.scheduled_date && job.scheduled_date <= due) due = job.scheduled_date;
  const label = `Deposit ${pct}% — ${job.service || "Cleaning"}`;
  const res = await insertInvoice({
    business_id: biz.id, client_id: cli?.id || job.client_id || null, client_name: job.client_name, job_id: jobId,
    is_deposit: true, deposit_total_price: amount, service: label, description: label,
    amount: dep, balance: dep, tax_rate: 0, discount: 0, issue_date: today, issued_date: today, due_date: due,
    status: "Draft",
    notes: `${pct}% deposit to hold your appointment${job.scheduled_date ? " on " + fmtDate(job.scheduled_date) : ""}. Total price $${money(amount)}; the deposit is subtracted from your final invoice.`,
    client_email: email || null, client_phone: cli?.phone || null, client_address: job.address || cli?.address || null,
  });
  if (!res.data) return { skipped: "insert failed" };
  const inv = res.data;
  let emailed = false, email_error = "";
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    try {
      await sendInvoiceEmail(inv, biz, email);
      await supabase.from("pro_invoices").update({ status: "Sent", sent_at: new Date().toISOString() }).eq("id", inv.id);
      emailed = true;
    } catch (e) { email_error = (e as Error).message; }
  }
  return { ok: true, invoice_id: inv.id, deposit: dep, emailed, email_error };
}

async function runReminders() {
  const today = todayStr();
  // 1) Vencidas -> Overdue
  await supabase.from("pro_invoices").update({ status: "Overdue" }).in("status", ["Sent", "Viewed"]).lt("due_date", today).gt("balance", 0);
  // 2) Recordatorios: 1, 7 y 14 dias despues de vencer (maximo 3)
  const { data: open } = await supabase.from("pro_invoices").select("*")
    .in("status", ["Overdue", "Partial payment"]).gt("balance", 0).lt("due_date", today).lt("reminder_count", 3).limit(300);
  const bizCache: Record<string, any> = {};
  let sent = 0; const errors: string[] = [];
  for (const inv of open || []) {
    const n = Number(inv.reminder_count || 0);
    const firstDay = addDays(inv.due_date, 1);
    const dueOn = n === 0 ? firstDay : addDays(firstDay, n === 1 ? 6 : 13);
    if (today < dueOn) continue;
    if (inv.last_reminder_at && String(inv.last_reminder_at).slice(0, 10) >= addDays(today, -5)) continue;
    let biz = bizCache[inv.business_id];
    if (biz === undefined) {
      const { data } = await supabase.from("businesses").select("*").eq("id", inv.business_id).maybeSingle();
      biz = bizCache[inv.business_id] = data || null;
    }
    if (!biz || biz.auto_reminders === false) continue;
    let email = (inv.client_email || "").trim();
    if (!email && inv.client_id) {
      const { data: c } = await supabase.from("pro_clients").select("email").eq("id", inv.client_id).maybeSingle();
      email = (c?.email || "").trim();
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    // Reclamar el envio primero para no mandar dos veces si el cron corre doble
    const { data: claimed } = await supabase.from("pro_invoices")
      .update({ reminder_count: n + 1, last_reminder_at: new Date().toISOString() })
      .eq("id", inv.id).eq("reminder_count", n).select("id").maybeSingle();
    if (!claimed) continue;
    try { await sendInvoiceEmail(inv, biz, email, true); sent++; }
    catch (e) {
      errors.push(inv.id + ": " + (e as Error).message);
      await supabase.from("pro_invoices").update({ reminder_count: n, last_reminder_at: inv.last_reminder_at }).eq("id", inv.id);
    }
  }
  return { ok: true, checked: (open || []).length, sent, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));

    // ---------- Publica: ver factura ----------
    if (body.action === "view") {
      if (!isUuid(body.id)) return json({ error: "Invoice not found." }, 404);
      const { data: inv } = await supabase.from("pro_invoices").select("*").eq("id", body.id).maybeSingle();
      if (!inv) return json({ error: "Invoice not found." }, 404);
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", inv.business_id).maybeSingle();
      if (["Sent", "Draft"].includes(inv.status)) {
        const { data: upd } = await supabase.from("pro_invoices").update({ status: "Viewed", viewed_at: new Date().toISOString() })
          .eq("id", inv.id).in("status", ["Sent", "Draft"]).select("*").maybeSingle();
        if (upd) Object.assign(inv, upd);
      }
      return json({ invoice: publicInvoice(inv), business: publicBiz(biz || {}) });
    }

    // ---------- Automaticas (base de datos / cron) ----------
    if (body.action === "auto") {
      if (!isUuid(body.job_id)) return json({ error: "Job not found" }, 404);
      return json(await autoInvoice(body.job_id));
    }
    if (body.action === "deposit") {
      if (!isUuid(body.job_id)) return json({ error: "Job not found" }, 404);
      return json(await createDeposit(body.job_id));
    }
    if (body.action === "reminders") return json(await runReminders());

    // ---------- Con sesion del pro ----------
    const auth = req.headers.get("Authorization") || "";
    const { data: u } = await supabase.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = u?.user;
    if (!user) return json({ error: "Please sign in again" }, 401);
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!biz) return json({ error: "Business not found" }, 404);

    if (body.action === "email") {
      if (!RESEND_KEY) return json({ error: "Email is not set up yet (RESEND_API_KEY)." }, 500);
      if (!isUuid(body.invoice_id)) return json({ error: "Invoice not found" }, 404);
      const to = String(body.to || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ error: "Invalid email" }, 400);
      const { data: inv } = await supabase.from("pro_invoices").select("*").eq("id", body.invoice_id).eq("business_id", biz.id).maybeSingle();
      if (!inv) return json({ error: "Invoice not found" }, 404);

      try { await sendInvoiceEmail(inv, { ...biz, email: biz.email || user.email }, to); }
      catch (e) { return json({ error: (e as Error).message }, 502); }
      await supabase.from("pro_invoices").update({
        status: ["Draft"].includes(inv.status) ? "Sent" : inv.status, client_email: to, sent_at: new Date().toISOString(),
      }).eq("id", inv.id);
      return json({ ok: true, view_url: VIEW_URL + inv.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("pro-invoice error:", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
