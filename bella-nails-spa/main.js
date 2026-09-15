(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtCOP = (n) => "$" + Number(n).toLocaleString("es-CO");

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Mounts (idempotent) ---------- */

  function mountServices() {
    const target = $("[data-services]");
    if (!target || target.children.length > 0 || !data.services) return;
    target.innerHTML = data.services.map(s => `
      <article class="card service-card reveal">
        <div class="service-icon">${escHTML(s.icon)}</div>
        <h3>${escHTML(s.name)}</h3>
        <p>${escHTML(s.desc)}</p>
        <div class="service-meta">
          <span class="service-price">${fmtCOP(s.price)}</span>
          <span class="service-duration">${escHTML(s.duration)}</span>
        </div>
        <div class="service-deposit">Abono: ${fmtCOP(s.deposit)}</div>
        <button class="btn btn-outline btn-sm btn-block" data-book-service="${escHTML(s.id)}">Agendar este servicio</button>
      </article>
    `).join("");
  }

  function mountTestimonials() {
    const target = $("[data-testimonials]");
    if (!target || target.children.length > 0 || !data.testimonials) return;
    target.innerHTML = data.testimonials.map(t => `
      <article class="card testi-card reveal">
        <p class="testi-quote">“${escHTML(t.quote)}”</p>
        <div class="testi-meta"><span class="testi-name">${escHTML(t.name)}</span><span class="testi-role">${escHTML(t.role)}</span></div>
      </article>
    `).join("");
  }

  function mountFaqs() {
    const target = $("[data-faqs]");
    if (!target || target.children.length > 0 || !data.faqs) return;
    target.innerHTML = data.faqs.map((f, i) => `
      <div class="card faq-item reveal" data-faq-item>
        <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${escHTML(f.q)}</span><span class="plus">+</span>
        </button>
        <div class="faq-a" id="faq-a-${i}"><div class="faq-a-inner"><p>${escHTML(f.a)}</p></div></div>
      </div>
    `).join("");
  }

  function mountMarquee() {
    const target = $("[data-marquee]");
    if (!target || target.children.length > 0 || !data.services) return;
    const items = data.services.map(s => `<span>${escHTML(s.name)} <b>·</b></span>`).join("");
    target.innerHTML = items + items; // duplicated for seamless loop
  }

  function mountBookingSelect() {
    const select = $("#bookService");
    if (!select || select.dataset.mounted || !data.services) return;
    select.dataset.mounted = "1";
    select.innerHTML = `<option value="" disabled selected>Elige un servicio</option>` +
      data.services.map(s => `<option value="${escHTML(s.id)}">${escHTML(s.name)} — ${fmtCOP(s.price)}</option>`).join("");
  }

  function mountTimeSlots() {
    const select = $("#bookTime");
    if (!select || select.dataset.mounted || !data.timeSlots) return;
    select.dataset.mounted = "1";
    select.innerHTML = `<option value="" disabled selected>Elige una hora</option>` +
      data.timeSlots.map(t => `<option value="${escHTML(t)}">${escHTML(t)}</option>`).join("");
  }

  function mountPaymentInfo() {
    const holder = $("[data-payment-holder]");
    const number = $("[data-payment-number]");
    const method = $("[data-payment-method]");
    if (data.payment) {
      if (holder) holder.textContent = data.payment.holder;
      if (number) number.textContent = data.payment.number;
      if (method) method.textContent = data.payment.method;
    }
    const policy = $("[data-deposit-policy]");
    if (policy && data.depositPolicy) policy.textContent = data.depositPolicy;
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

  function initSmoothScroll() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: reduced ? "auto" : "smooth" });
    });
  }

  function initReveals() {
    const targets = $$(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) { targets.forEach(el => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(el => io.observe(el));
    setTimeout(() => {
      $$(".reveal:not(.is-visible)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 4000);
  }

  function initFaq() {
    const list = $("[data-faqs]");
    if (!list) return;
    list.addEventListener("click", e => {
      const btn = e.target.closest(".faq-q");
      if (!btn) return;
      const item = btn.closest("[data-faq-item]");
      const wasOpen = item.classList.contains("is-open");
      $$("[data-faq-item]", list).forEach(i => { i.classList.remove("is-open"); $(".faq-q", i).setAttribute("aria-expanded", "false"); });
      if (!wasOpen) { item.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
    });
  }

  /* ---------- Booking wizard ---------- */

  function initBookingWizard() {
    const wizard = $("[data-booking-wizard]");
    if (!wizard) return;

    const dateInput = $("#bookDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    // Pre-select service when a card's "Agendar" button is clicked
    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-book-service]");
      if (!btn) return;
      const select = $("#bookService");
      if (select) select.value = btn.dataset.bookService;
      const bookingSection = $("#reservar");
      if (bookingSection) {
        window.scrollTo({ top: bookingSection.getBoundingClientRect().top + window.scrollY - 90, behavior: reduced ? "auto" : "smooth" });
      }
      goToStep(1);
    });

    function goToStep(n) {
      $$(".booking-panel", wizard).forEach(p => p.classList.toggle("is-active", Number(p.dataset.step) === n));
      $$(".booking-step-dot", wizard).forEach(dot => {
        const step = Number(dot.dataset.step);
        dot.classList.toggle("is-active", step === n);
        dot.classList.toggle("is-done", step < n);
      });
    }

    function findService(id) {
      return (data.services || []).find(s => s.id === id);
    }

    function findStaff(id) {
      return (data.staff || []).find(s => s.id === id);
    }

    function selectedStaffLabel() {
      const checked = $('input[name="bookStaff"]:checked', wizard);
      const staff = checked ? findStaff(checked.value) : null;
      if (!staff || staff.id === "cualquiera") return "Sin preferencia";
      return staff.name;
    }

    function updateSummary() {
      const service = findService($("#bookService")?.value);
      const dateVal = $("#bookDate")?.value;
      const timeVal = $("#bookTime")?.value;
      if (!service) return null;

      $$("[data-summary-service]", wizard).forEach(el => el.textContent = service.name);
      $$("[data-summary-staff]", wizard).forEach(el => el.textContent = selectedStaffLabel());
      $$("[data-summary-date]", wizard).forEach(el => el.textContent = dateVal ? new Date(dateVal + "T00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) : "—");
      $$("[data-summary-time]", wizard).forEach(el => el.textContent = timeVal || "—");
      $$("[data-summary-price]", wizard).forEach(el => el.textContent = fmtCOP(service.price));
      $$("[data-summary-deposit]", wizard).forEach(el => el.textContent = fmtCOP(service.deposit));
      $$("[data-summary-rest]", wizard).forEach(el => el.textContent = fmtCOP(service.price - service.deposit));
      return service;
    }

    const step1Form = $("#bookingStep1Form", wizard);
    if (step1Form) {
      step1Form.addEventListener("submit", e => {
        e.preventDefault();
        if (!step1Form.reportValidity()) return;
        const service = updateSummary();
        if (!service) return;
        goToStep(2);
      });
    }

    $$("[data-back-step]", wizard).forEach(btn => {
      btn.addEventListener("click", () => goToStep(Number(btn.dataset.backStep)));
    });

    const fileInput = $("#bookProof");
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const label = $("[data-file-name]", wizard);
        if (label) label.textContent = fileInput.files[0] ? fileInput.files[0].name : "";
      });
    }

    const step2Form = $("#bookingStep2Form", wizard);
    if (step2Form) {
      step2Form.addEventListener("submit", e => {
        e.preventDefault();
        const service = findService($("#bookService")?.value);
        const timeVal = $("#bookTime")?.value;
        const dateEl = $("[data-summary-date]", wizard);
        $$(".booking-panel", wizard).forEach(p => p.classList.remove("is-active"));
        const success = $("[data-booking-success]", wizard);
        if (success) {
          success.classList.add("is-active");
          const msg = $("[data-success-detail]", success);
          if (msg && service) {
            const staffLabel = selectedStaffLabel();
            const withWhom = staffLabel === "Sin preferencia" ? "" : ` con ${staffLabel}`;
            msg.textContent = `Te esperamos el ${dateEl ? dateEl.textContent : ""} a las ${timeVal} para tu ${service.name}${withWhom}. Guarda tu comprobante por si acaso.`;
          }
        }
      });
    }
  }

  function boot() {
    safe(mountServices, "mountServices");
    safe(mountTestimonials, "mountTestimonials");
    safe(mountFaqs, "mountFaqs");
    safe(mountMarquee, "mountMarquee");
    safe(mountBookingSelect, "mountBookingSelect");
    safe(mountTimeSlots, "mountTimeSlots");
    safe(mountPaymentInfo, "mountPaymentInfo");

    safe(initMobileMenu, "initMobileMenu");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initFaq, "initFaq");
    safe(initBookingWizard, "initBookingWizard");
    safe(initReveals, "initReveals");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
