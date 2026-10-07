// auth.js — modal de login / registro (usado en index.html).
(function () {
  "use strict";
  const { $, $$, api, toast, safe } = window.FIA;

  function abrirModal(pestana) {
    const dialog = $("#modal-auth");
    if (!dialog) return;
    if (dialog.open) dialog.close();
    dialog.showModal();
    cambiarPestana(pestana || "registro");
  }

  function cambiarPestana(nombre) {
    $$(".modal-tabs button", $("#modal-auth")).forEach(b => b.classList.toggle("is-active", b.dataset.tab === nombre));
    $$(".auth-form", $("#modal-auth")).forEach(f => f.hidden = f.dataset.form !== nombre);
    $$(".form-error", $("#modal-auth")).forEach(e => e.textContent = "");
  }

  async function enviarForm(form) {
    const esRegistro = form.dataset.form === "registro";
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const errorEl = form.querySelector(".form-error");
    const btn = form.querySelector('button[type="submit"]');
    errorEl.textContent = "";
    btn.disabled = true;
    btn.textContent = esRegistro ? "Creando cuenta..." : "Entrando...";

    const r = await api("POST", esRegistro ? "api/registro.php" : "api/login.php", { email, password });

    if (!r.ok) {
      errorEl.textContent = r.error || "Algo salió mal. Inténtalo de nuevo.";
      btn.disabled = false;
      btn.textContent = esRegistro ? "Crear cuenta gratis" : "Entrar";
      return;
    }
    toast(esRegistro ? "¡Cuenta creada! Bienvenido/a." : "¡Bienvenido/a de vuelta!", "ok");
    window.location.href = "app.html";
  }

  function initAuthModal() {
    const dialog = $("#modal-auth");
    if (!dialog) return;

    $$("[data-abrir-auth]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        abrirModal(btn.dataset.abrirAuth || "registro");
      });
    });
    $$(".modal-tabs button", dialog).forEach(b => b.addEventListener("click", () => cambiarPestana(b.dataset.tab)));
    dialog.querySelector(".modal-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

    $$(".auth-form", dialog).forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        enviarForm(form);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => safe(initAuthModal, "initAuthModal"));
  else safe(initAuthModal, "initAuthModal");
})();
