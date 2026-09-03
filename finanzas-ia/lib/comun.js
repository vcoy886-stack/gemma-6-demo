// comun.js — helpers compartidos por todas las páginas. IIFE, expone window.FIA.
(function () {
  "use strict";

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function safe(fn, name) { try { return fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  async function api(metodo, ruta, body) {
    const opts = { method: metodo, credentials: "same-origin", headers: {} };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    let res, data;
    try {
      res = await fetch(ruta, opts);
    } catch (e) {
      return { ok: false, error: "No se pudo conectar con el servidor. Revisa tu conexión.", status: 0 };
    }
    try {
      data = await res.json();
    } catch (e) {
      return { ok: false, error: "El servidor respondió de forma inesperada.", status: res.status };
    }
    data.status = res.status;
    return data;
  }

  // ---- Notices en página (nunca alert/confirm salvo acciones destructivas) ----
  function toast(mensaje, tipo) {
    let host = $("#fia-toasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "fia-toasts";
      host.className = "fia-toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = "fia-toast" + (tipo ? " fia-toast--" + tipo : "");
    el.textContent = mensaje;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 300);
    }, 4200);
  }

  // ---- Markdown-lite: ## títulos, **negrita**, listas -, listas numeradas, párrafos ----
  function mdLite(texto) {
    const lineas = String(texto || "").replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let enLista = null; // 'ul' | 'ol' | null
    const inline = (s) => escHTML(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const cerrarLista = () => { if (enLista) { html += enLista === "ul" ? "</ul>" : "</ol>"; enLista = null; } };

    lineas.forEach(linea => {
      const l = linea.trim();
      if (l === "") { cerrarLista(); return; }
      const h2 = l.match(/^##\s+(.*)/);
      const h3 = l.match(/^###\s+(.*)/);
      const li = l.match(/^[-•]\s+(.*)/);
      const ol = l.match(/^\d+[.)]\s+(.*)/);
      const check = l.match(/^(✅|❌|⚠️)\s*(.*)/);

      if (h2) { cerrarLista(); html += `<h3>${inline(h2[1])}</h3>`; return; }
      if (h3) { cerrarLista(); html += `<h4>${inline(h3[1])}</h4>`; return; }
      if (li || check) {
        if (enLista !== "ul") { cerrarLista(); html += "<ul>"; enLista = "ul"; }
        const contenido = check ? `${check[1]} ${inline(check[2])}` : inline(li[1]);
        html += `<li>${contenido}</li>`;
        return;
      }
      if (ol) {
        if (enLista !== "ol") { cerrarLista(); html += "<ol>"; enLista = "ol"; }
        html += `<li>${inline(ol[1])}</li>`;
        return;
      }
      cerrarLista();
      html += `<p>${inline(l)}</p>`;
    });
    cerrarLista();
    return html;
  }

  window.FIA = { $, $$, escHTML, safe, api, toast, mdLite };
})();
