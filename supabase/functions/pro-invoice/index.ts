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

function emailHtml(inv: any, biz: any) {
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
    <p style="color:#333;font-size:14px;">Thank you for your business! Here is your ${inv.is_deposit ? "deposit request" : "invoice"}:</p>
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

      const num = String(inv.invoice_number || 0).padStart(3, "0");
      const name = String(biz.business_name || "Your service provider").replace(/[<>"]/g, "");
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${name} <${FROM_EMAIL}>`,
          reply_to: biz.email || user.email,
          to,
          subject: `${inv.is_deposit ? "Deposit" : "Invoice"} #${num} — $${money(inv.balance ?? inv.amount)} — ${name}`,
          html: emailHtml(inv, biz),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.id) return json({ error: d.message || "Email not sent" }, 502);
      await supabase.from("pro_invoices").update({
        status: ["Paid", "Viewed"].includes(inv.status) ? inv.status : "Sent", client_email: to, sent_at: new Date().toISOString(),
      }).eq("id", inv.id);
      return json({ ok: true, view_url: VIEW_URL + inv.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("pro-invoice error:", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
