(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Mounts (idempotent — fill only if empty) ---------- */

  function mountServices() {
    const target = $("[data-services]");
    if (!target || target.children.length > 0 || !data.services) return;
    target.innerHTML = data.services.map(s => `
      <article class="glass-card service-card reveal">
        <div class="service-icon">${escHTML(s.icon)}</div>
        <h3>${escHTML(s.name)}</h3>
        <p>${escHTML(s.desc)}</p>
        <div class="service-price">${escHTML(s.from)}</div>
      </article>
    `).join("");
  }

  function mountPlans() {
    const target = $("[data-plans]");
    if (!target || target.children.length > 0 || !data.plans) return;
    target.innerHTML = data.plans.map(p => `
      <article class="glass-card plan-card reveal ${p.highlight ? "is-highlight" : ""}">
        <div class="plan-name">${escHTML(p.name)}</div>
        <div class="plan-price">${escHTML(p.price)}</div>
        <div class="plan-period">${escHTML(p.period)}</div>
        <ul class="plan-features">
          ${p.features.map(f => `<li>${escHTML(f)}</li>`).join("")}
        </ul>
        <a href="#cta" class="btn ${p.highlight ? "btn-primary" : "btn-glass"}">${escHTML(p.cta)}</a>
      </article>
    `).join("");
  }

  function mountTestimonials() {
    const target = $("[data-testimonials]");
    if (!target || target.children.length > 0 || !data.testimonials) return;
    target.innerHTML = data.testimonials.map(t => `
      <article class="glass-card testi-card reveal">
        <p class="testi-quote">${escHTML(t.quote)}</p>
        <div class="testi-meta">
          <span class="testi-name">${escHTML(t.name)}</span>
          <span class="testi-role">${escHTML(t.role)}</span>
        </div>
      </article>
    `).join("");
  }

  function mountFaqs() {
    const target = $("[data-faqs]");
    if (!target || target.children.length > 0 || !data.faqs) return;
    target.innerHTML = data.faqs.map((f, i) => `
      <div class="glass-card faq-item reveal" data-faq-item>
        <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${escHTML(f.q)}</span>
          <span class="plus">+</span>
        </button>
        <div class="faq-a" id="faq-a-${i}">
          <div class="faq-a-inner"><p>${escHTML(f.a)}</p></div>
        </div>
      </div>
    `).join("");
  }

  function mountStats() {
    const target = $("[data-hero-stats]");
    if (!target || target.children.length > 0 || !data.stats) return;
    target.innerHTML = data.stats.map(s => `
      <div class="stat">
        <strong data-count-to="${s.value}" data-suffix="${escHTML(s.suffix)}">0${escHTML(s.suffix)}</strong>
        <span>${escHTML(s.label)}</span>
      </div>
    `).join("");
  }

  /* ---------- Nav / mobile menu ---------- */

  function initMobileMenu() {
    const toggle = $("[data-menu-toggle]");
    const menu = $("[data-mobile-menu]");
    const close = $("[data-menu-close]");
    if (!toggle || !menu) return;
    const open = () => { menu.classList.add("is-open"); document.body.style.overflow = "hidden"; };
    const hide = () => { menu.classList.remove("is-open"); document.body.style.overflow = ""; };
    toggle.addEventListener("click", open);
    if (close) close.addEventListener("click", hide);
    $$("a", menu).forEach(a => a.addEventListener("click", hide));
  }

  /* ---------- Smooth anchor scroll ---------- */

  function initSmoothScroll() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const navOffset = 90;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveals() {
    const targets = $$(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(el => io.observe(el));

    // Safety net: force-reveal anything still hidden after 4s
    setTimeout(() => {
      $$(".reveal:not(.is-visible)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 4000);
  }

  /* ---------- FAQ accordion ---------- */

  function initFaq() {
    const list = $("[data-faqs]");
    if (!list) return;
    list.addEventListener("click", e => {
      const btn = e.target.closest(".faq-q");
      if (!btn) return;
      const item = btn.closest("[data-faq-item]");
      const wasOpen = item.classList.contains("is-open");
      $$("[data-faq-item]", list).forEach(i => {
        i.classList.remove("is-open");
        $(".faq-q", i).setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ---------- Count-up stats ---------- */

  function initCountUp() {
    const nodes = $$("[data-count-to]");
    if (!nodes.length) return;

    function animate(el) {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.suffix || "";
      if (reduced || !isFinite(target)) {
        el.textContent = target.toLocaleString("es-CO") + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("es-CO") + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    nodes.forEach(el => io.observe(el));
  }

  /* ---------- Magnetic CTA buttons (desktop only) ---------- */

  function initMagnetic() {
    if (!fineHover || reduced) return;
    $$("[data-magnetic]").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseout", e => {
        if (!btn.contains(e.relatedTarget)) btn.style.transform = "";
      });
    });
  }

  /* ---------- Simulated lead form ---------- */

  function initForm() {
    const form = $("[data-lead-form]");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.classList.add("is-sent");
    });
  }

  /* ---------- Sticky nav shrink on scroll ---------- */

  function initNavScroll() {
    const nav = $(".nav-inner");
    if (!nav) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.style.boxShadow = window.scrollY > 20
          ? "0 14px 34px rgba(31,41,55,.14)"
          : "0 10px 30px rgba(31,41,55,.08)";
        ticking = false;
      });
    }, { passive: true });
  }

  function boot() {
    safe(mountStats, "mountStats");
    safe(mountServices, "mountServices");
    safe(mountPlans, "mountPlans");
    safe(mountTestimonials, "mountTestimonials");
    safe(mountFaqs, "mountFaqs");

    safe(initMobileMenu, "initMobileMenu");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initFaq, "initFaq");
    safe(initForm, "initForm");
    safe(initNavScroll, "initNavScroll");
    safe(initMagnetic, "initMagnetic");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
