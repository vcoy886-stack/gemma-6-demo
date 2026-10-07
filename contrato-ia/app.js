// app.js — analizador de contratos: créditos, análisis, historial, upgrade.
(function () {
  "use strict";
  const { $, $$, api, toast, safe, mdLite, escHTML } = window.FIA;

  let planPendienteCheckout = null;
  const NOMBRES_PLAN = { pro: "Pro", experto: "Experto" };
  const PRECIOS_PLAN = { pro: "$14.99/mes — 50 análisis al mes", experto: "$29.99/mes — análisis ilimitados" };

  function pintarCreditos(u) {
    const pill = $("#pill-creditos");
    if (!pill) return;
    pill.textContent = u.ilimitado ? "⚡ Ilimitado" : `⚡ ${u.creditos} crédito${u.creditos === 1 ? "" : "s"}`;
    pill.classList.add("is-bump");
    setTimeout(() => pill.classList.remove("is-bump"), 280);
  }

  function formatearFecha(iso) {
    try { return new Date(iso).toLocaleString("es-419", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }

  function pintarHistorial(u) {
    const host = $("#historial-contenido");
    if (!host) return;
    if (!u.historial_habilitado) {
      host.innerHTML = `<div class="upgrade-lock">El historial está disponible en los planes <strong>Pro</strong> y <strong>Experto</strong>.<br><button class="btn btn--primary btn--sm" type="button" style="margin-top:.9rem" data-abrir-upgrade>Mejorar plan</button></div>`;
      $("[data-abrir-upgrade]", host)?.addEventListener("click", () => $("#modal-upgrade").showModal());
      return;
    }
    const items = (u.historial || []).filter(h => h.tipo && h.tipo[0] !== "_").slice().reverse();
    if (!items.length) { host.innerHTML = `<p class="muted">Todavía no tienes contratos analizados.</p>`; return; }
    host.innerHTML = items.map(h => `
      <details class="historial-item">
        <summary><span>${escHTML(h.tipo_nombre || h.tipo)}</span><span class="fecha">${formatearFecha(h.fecha)}</span></summary>
        <div class="cuerpo">${mdLite(h.resultado)}</div>
      </details>
    `).join("");
  }

  function aplicarUsuario(u) {
    pintarCreditos(u);
    pintarHistorial(u);
    $("#btn-exportar-pdf").hidden = !u.exportar_pdf;
  }

  async function cargarSesion() {
    const r = await api("GET", "api/yo.php");
    if (!r.ok) { window.location.href = "index.html"; return; }
    aplicarUsuario(r.usuario);
  }

  async function enviarAnalisis(e) {
    e.preventDefault();
    const contrato = $("#contrato-input").value.trim();
    const tipo = $("#tipo-select").value;
    if (!contrato) { toast("Pega el texto del contrato antes de analizar.", "error"); return; }
    if (contrato.length < 40) { toast("Eso parece muy corto para ser un contrato completo.", "error"); return; }

    const panel = $("#panel-resultado");
    const btn = $("#btn-analizar");
    panel.dataset.state = "working";
    btn.disabled = true;
    panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });

    const r = await api("POST", "api/analizar.php", { tipo, contrato });
    btn.disabled = false;

    if (!r.ok) {
      if (r.sin_creditos) {
        panel.dataset.state = "idle";
        $("#modal-upgrade").showModal();
        return;
      }
      panel.dataset.state = "error";
      $("#error-texto").textContent = r.error || "Algo salió mal. Inténtalo de nuevo.";
      return;
    }

    aplicarUsuario(r.usuario);
    $("#resultado-tipo-badge").textContent = $("#tipo-select").selectedOptions[0].textContent;
    $("#resultado-texto").innerHTML = mdLite(r.resultado);
    panel.dataset.state = "done";
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
    btn.disabled = true;
    btn.textContent = "Procesando...";
    const r = await api("POST", "api/checkout.php", { plan: planPendienteCheckout });
    btn.disabled = false;
    btn.textContent = "Simular pago";
    if (!r.ok) { toast(r.error || "No se pudo procesar el pago simulado.", "error"); return; }
    aplicarUsuario(r.usuario);
    $("#modal-checkout").close();
    toast(`¡Listo! Ahora tienes el plan ${NOMBRES_PLAN[planPendienteCheckout]}.`, "ok");
    planPendienteCheckout = null;
  }

  function initForm() {
    $("#form-analizar").addEventListener("submit", enviarAnalisis);
    $("#btn-nuevo").addEventListener("click", () => {
      $("#panel-resultado").dataset.state = "idle";
      $("#contrato-input").value = "";
      $("#contrato-input").focus();
    });
    $("#btn-exportar-pdf").addEventListener("click", () => window.print());
  }

  function initModales() {
    $$("dialog").forEach(d => {
      d.querySelector(".modal-close")?.addEventListener("click", () => d.close());
      d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    });
    $$("[data-checkout]").forEach(b => b.addEventListener("click", () => abrirCheckout(b.dataset.checkout)));
    $("#btn-simular-pago").addEventListener("click", confirmarCheckout);
  }

  function initSalir() {
    $("#btn-salir").addEventListener("click", async () => {
      await api("POST", "api/logout.php");
      window.location.href = "index.html";
    });
  }

  function boot() {
    safe(initForm, "initForm");
    safe(initModales, "initModales");
    safe(initSalir, "initSalir");
    cargarSesion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
