// main.js — landing: si ya hay sesión, cambia el CTA; reveals suaves.
(function () {
  "use strict";
  const { $, $$, api, safe } = window.FIA || {};

  async function initSesion() {
    if (!api) return;
    const r = await api("GET", "api/yo.php");
    if (r.ok) {
      $$('[data-abrir-auth]').forEach(a => {
        a.setAttribute("href", "app.html");
        a.removeAttribute("data-abrir-auth");
        if (a.textContent.trim().toLowerCase() !== "entrar") a.textContent = "Ir a mi cuenta";
        else a.textContent = "Mi cuenta";
      });
    }
  }

  function initReveals() {
    const targets = $$(".modulo-card, .plan-card, .card, .testimonio");
    if (!targets.length || !("IntersectionObserver" in window)) return;
    targets.forEach(el => el.style.opacity = "0");
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = "opacity .5s ease, transform .5s ease";
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(el => { el.style.transform = "translateY(14px)"; io.observe(el); });
    setTimeout(() => targets.forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; }), 6000);
  }

  function boot() {
    safe(initSesion, "initSesion");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) safe(initReveals, "initReveals");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
