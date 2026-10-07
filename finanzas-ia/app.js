// app.js — la herramienta: selección de módulo, análisis, créditos, historial, upgrade.
(function () {
  "use strict";
  const { $, $$, api, toast, safe, mdLite, escHTML } = window.FIA;

  let usuarioActual = null;
  let moduloActivo = "radiografia";
  let planPendienteCheckout = null;

  const NOMBRES_PLAN = { pro: "Pro", experto: "Experto" };
  const PRECIOS_PLAN = { pro: "$9.99/mes — 100 análisis al mes", experto: "$19.99/mes — análisis ilimitados" };

  function pintarCreditos(u) {
    const pill = $("#pill-creditos");
    if (!pill) return;
    pill.textContent = u.ilimitado ? "⚡ Ilimitado" : `⚡ ${u.creditos} crédito${u.creditos === 1 ? "" : "s"}`;
    pill.classList.add("is-bump");
    setTimeout(() => pill.classList.remove("is-bump"), 280);
  }

  function pintarHistorial(u) {
    const host = $("#historial-contenido");
    if (!host) return;
    if (!u.historial_habilitado) {
      host.innerHTML = `<div class="upgrade-lock">El historial está disponible en los planes <strong>Pro</strong> y <strong>Experto</strong>.<br><button class="btn btn--primary btn--sm" type="button" style="margin-top:.9rem" data-abrir-upgrade>Mejorar plan</button></div>`;
      const b = $("[data-abrir-upgrade]", host);
      if (b) b.addEventListener("click", () => $("#modal-upgrade").showModal());
      return;
    }
    const items = (u.historial || []).filter(h => h.modulo && h.modulo[0] !== "_").slice().reverse();
    if (!items.length) { host.innerHTML = `<p class="muted">Todavía no tienes análisis guardados.</p>`; return; }
    host.innerHTML = items.map(h => `
      <details class="historial-item">
        <summary><span>${escHTML(h.modulo_nombre || h.modulo)}</span><span class="fecha">${formatearFecha(h.fecha)}</span></summary>
        <div class="cuerpo">${mdLite(h.resultado)}</div>
      </details>
    `).join("");
  }

  function formatearFecha(iso) {
    try {
      return new Date(iso).toLocaleString("es-419", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function aplicarUsuario(u) {
    usuarioActual = u;
    pintarCreditos(u);
    pintarHistorial(u);
    $("#btn-exportar-pdf").hidden = !u.exportar_pdf;
  }

  async function cargarSesion() {
    const r = await api("GET", "api/yo.php");
    if (!r.ok) { window.location.href = "index.html"; return; }
    aplicarUsuario(r.usuario);
  }

  function seleccionarModulo(btn) {
    $$(".modulo-btn").forEach(b => b.classList.toggle("is-active", b === btn));
    moduloActivo = btn.dataset.modulo;
    $("#modulo-titulo").textContent = btn.querySelector("strong").textContent;
    $("#modulo-resumen").textContent = btn.querySelector("span > span").textContent;
    $("#datos-input").placeholder = btn.dataset.placeholder || "";
    $("#panel-resultado").dataset.state = "idle";
  }

  async function enviarAnalisis(e) {
    e.preventDefault();
    const datos = $("#datos-input").value.trim();
    if (!datos) { toast("Pega tus datos financieros antes de analizar.", "error"); return; }

    const panel = $("#panel-resultado");
    const btn = $("#btn-analizar");
    panel.dataset.state = "working";
    btn.disabled = true;
    panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });

    const r = await api("POST", "api/analizar.php", { modulo: moduloActivo, datos });
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
    $("#resultado-modulo-badge").textContent = $("#modulo-titulo").textContent;
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

  function initModulos() {
    $$(".modulo-btn").forEach(btn => btn.addEventListener("click", () => seleccionarModulo(btn)));
  }

  function initForm() {
    $("#form-analizar").addEventListener("submit", enviarAnalisis);
    $("#btn-nuevo").addEventListener("click", () => {
      $("#panel-resultado").dataset.state = "idle";
      $("#datos-input").value = "";
      $("#datos-input").focus();
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
    safe(initModulos, "initModulos");
    safe(initForm, "initForm");
    safe(initModales, "initModales");
    safe(initSalir, "initSalir");
    cargarSesion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
