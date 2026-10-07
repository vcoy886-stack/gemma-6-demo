// cuenta.js — plan, créditos, historial completo, upgrade y cancelación.
(function () {
  "use strict";
  const { $, $$, api, toast, safe, mdLite, escHTML } = window.FIA;

  let planPendienteCheckout = null;
  const NOMBRES_PLAN = { pro: "Pro", experto: "Experto" };
  const PRECIOS_PLAN = { pro: "$14.99/mes — 50 análisis al mes", experto: "$29.99/mes — análisis ilimitados" };

  function formatearFecha(iso) {
    try { return new Date(iso).toLocaleDateString("es-419", { day: "2-digit", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  }
  function formatearFechaHora(iso) {
    try { return new Date(iso).toLocaleString("es-419", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }

  function pintar(u) {
    $("#cuenta-email").textContent = u.email;
    $("#pill-creditos").textContent = u.ilimitado ? "⚡ Ilimitado" : `⚡ ${u.creditos} créditos`;
    $("#plan-nombre").textContent = "Plan " + u.plan_nombre;
    $("#plan-badge").textContent = u.plan_nombre;
    $("#plan-renovacion").textContent = u.plan === "gratis" ? "Se renueva automáticamente cada mes" : "Próxima renovación: " + formatearFecha(u.renovacion);
    $("#stat-creditos").textContent = u.ilimitado ? "∞" : u.creditos;
    $("#stat-usados").textContent = (u.historial || []).filter(h => h.tipo && h.tipo[0] !== "_").length;
    $("#btn-cancelar").hidden = u.plan === "gratis";
    $("#btn-mejorar").hidden = u.plan === "experto";
    pintarHistorial(u);
  }

  function pintarHistorial(u) {
    const host = $("#historial-contenido");
    if (!u.historial_habilitado) {
      host.innerHTML = `<div class="upgrade-lock">El historial completo está disponible en los planes <strong>Pro</strong> y <strong>Experto</strong>.<br><button class="btn btn--primary btn--sm" type="button" style="margin-top:.9rem" data-abrir-upgrade>Mejorar plan</button></div>`;
      $("[data-abrir-upgrade]", host)?.addEventListener("click", () => $("#modal-upgrade").showModal());
      return;
    }
    const items = (u.historial || []).slice().reverse();
    if (!items.length) { host.innerHTML = `<p class="muted">Todavía no tienes contratos analizados.</p>`; return; }
    host.innerHTML = items.map(h => `
      <details class="historial-item">
        <summary><span>${escHTML(h.tipo_nombre || h.tipo)}</span><span class="fecha">${formatearFechaHora(h.fecha)}</span></summary>
        <div class="cuerpo">${mdLite(h.resultado)}</div>
      </details>
    `).join("");
  }

  async function cargarSesion() {
    const r = await api("GET", "api/yo.php");
    if (!r.ok) { window.location.href = "index.html"; return; }
    pintar(r.usuario);
  }

  function abrirCheckout(plan) {
    planPendienteCheckout = plan;
    $("#checkout-titulo").textContent = "Plan " + NOMBRES_PLAN[plan];
    $("#checkout-desc").textContent = PRECIOS_PLAN[plan];
    $("#modal-upgrade").close();
    $("#modal-checkout").showModal();
  }

  async function confirmarCheckout() {
    if (!planPendienteCheckout) return;
    const btn = $("#btn-simular-pago");
    btn.disabled = true; btn.textContent = "Procesando...";
    const r = await api("POST", "api/checkout.php", { plan: planPendienteCheckout });
    btn.disabled = false; btn.textContent = "Simular pago";
    if (!r.ok) { toast(r.error || "No se pudo procesar el pago simulado.", "error"); return; }
    pintar(r.usuario);
    $("#modal-checkout").close();
    toast(`¡Listo! Ahora tienes el plan ${NOMBRES_PLAN[planPendienteCheckout]}.`, "ok");
    planPendienteCheckout = null;
  }

  async function cancelarPlan() {
    if (!confirm("¿Seguro que quieres cancelar? Volverás al plan Gratis (3 análisis/mes).")) return;
    const r = await api("POST", "api/cancelar.php");
    if (!r.ok) { toast(r.error || "No se pudo cancelar.", "error"); return; }
    pintar(r.usuario);
    toast("Volviste al plan Gratis.", "ok");
  }

  function initModales() {
    $$("dialog").forEach(d => {
      d.querySelector(".modal-close")?.addEventListener("click", () => d.close());
      d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    });
    $$("[data-checkout]").forEach(b => b.addEventListener("click", () => abrirCheckout(b.dataset.checkout)));
    $("#btn-simular-pago").addEventListener("click", confirmarCheckout);
    $("#btn-mejorar").addEventListener("click", () => $("#modal-upgrade").showModal());
    $("#btn-cancelar").addEventListener("click", cancelarPlan);
  }

  function initSalir() {
    $("#btn-salir").addEventListener("click", async () => {
      await api("POST", "api/logout.php");
      window.location.href = "index.html";
    });
  }

  function boot() {
    safe(initModales, "initModales");
    safe(initSalir, "initSalir");
    cargarSesion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
