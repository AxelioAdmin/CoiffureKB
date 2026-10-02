/* ==========================================================================
   COIFFURE KB UNISEXE — Scripts principaux
   --------------------------------------------------------------------------
   Aucun serveur ni outil de compilation requis : ouvrez simplement les
   fichiers HTML dans un navigateur. Les données viennent de js/config.js
   et js/data.js.
   ========================================================================== */
(function () {
  "use strict";

  const CONFIG = window.KB_CONFIG || {};
  const SERVICES = window.KB_SERVICES || [];
  const JOBS = (window.KB_EMPLOIS || []).filter((job) => job.actif !== false);

  const root = document.documentElement;
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // affichage du lundi au dimanche

  const ICONS = {
    arrowUpRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-3.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  };

  /* ------------------------------------------------------------------------
     Utilitaires
     ------------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, "0");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (m || 0);
  }

  // "09:30" → "9 h 30" ; "17:00" → "17 h"
  function formatHour(time) {
    const [h, m] = time.split(":").map(Number);
    return m ? `${h} h ${pad(m)}` : `${h} h`;
  }

  function formatPrice(item) {
    if (typeof item.prix === "number") {
      return `${item.des ? "dès " : ""}${item.prix}&nbsp;$`;
    }
    return escapeHtml(item.prix || "Sur consultation");
  }

  function minPrice(category) {
    const prices = category.prestations.map((p) => p.prix).filter((p) => typeof p === "number");
    return prices.length ? Math.min(...prices) : null;
  }

  function telHref() {
    return "tel:" + String(CONFIG.telephone || "").replace(/[^\d+]/g, "");
  }

  function fullAddress() {
    const a = CONFIG.adresse || {};
    return [a.rue, `${a.ville || ""} (${a.province || ""}) ${a.codePostal || ""}`.trim()]
      .filter(Boolean)
      .join(", ");
  }

  /* ------------------------------------------------------------------------
     1. Coordonnées (config.js)
     ------------------------------------------------------------------------ */
  function hydrateConfig() {
    const a = CONFIG.adresse || {};
    const values = {
      nom: CONFIG.nom,
      telephone: CONFIG.telephone,
      courriel: CONFIG.courriel,
      courrielEmplois: CONFIG.courrielEmplois || CONFIG.courriel,
      rue: a.rue,
      ville: [a.ville && `${a.ville} (${a.province})`, a.codePostal].filter(Boolean).join(" "),
      adresse: fullAddress(),
    };

    $$("[data-kb]").forEach((el) => {
      const value = values[el.dataset.kb];
      if (value) el.textContent = value;
    });

    $$("[data-kb-tel]").forEach((el) => (el.href = telHref()));
    $$("[data-kb-mail]").forEach((el) => (el.href = "mailto:" + CONFIG.courriel));
    $$("[data-kb-mail-jobs]").forEach((el) => (el.href = "mailto:" + values.courrielEmplois));
    $$("[data-kb-booking]").forEach((el) => {
      if (CONFIG.reservation) {
        el.href = CONFIG.reservation;
        el.target = "_blank";
        el.rel = "noopener";
      } else {
        el.href = telHref();
      }
    });

    $$("[data-kb-social]").forEach((el) => {
      const url = (CONFIG.reseaux || {})[el.dataset.kbSocial];
      if (url) el.href = url;
      else el.hidden = true;
    });

    const query = encodeURIComponent(CONFIG.carte || fullAddress());
    $$("[data-kb-map]").forEach((iframe) => {
      iframe.src = `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
    });
    $$("[data-kb-directions]").forEach((el) => {
      el.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
    });

    $$("[data-kb-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ------------------------------------------------------------------------
     2. Horaires et état « ouvert / fermé »
     ------------------------------------------------------------------------ */
  function getStatus(now = new Date()) {
    const hours = CONFIG.horaires || [];
    const today = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slot = hours[today];

    if (slot && minutes >= toMinutes(slot[0]) && minutes < toMinutes(slot[1])) {
      return { open: true, text: `Ouvert · ferme à ${formatHour(slot[1])}` };
    }

    for (let i = 0; i <= 7; i++) {
      const day = (today + i) % 7;
      const next = hours[day];
      if (!next) continue;
      if (i === 0 && minutes < toMinutes(next[0])) {
        return { open: false, text: `Fermé · ouvre à ${formatHour(next[0])}` };
      }
      if (i === 1) return { open: false, text: `Fermé · ouvre demain à ${formatHour(next[0])}` };
      if (i > 1) return { open: false, text: `Fermé · ouvre ${DAYS[day].toLowerCase()} à ${formatHour(next[0])}` };
    }
    return { open: false, text: "Fermé" };
  }

  function renderStatus() {
    const status = getStatus();
    $$("[data-kb-status]").forEach((el) => {
      el.innerHTML = `<span class="status-dot${status.open ? " is-open" : ""}"></span><span>${status.text}</span>`;
    });
  }

  function renderHours() {
    const today = new Date().getDay();
    const hours = CONFIG.horaires || [];

    $$("[data-kb-hours]").forEach((list) => {
      const compact = list.dataset.kbHours === "compact";
      list.innerHTML = WEEK_ORDER.map((day) => {
        const slot = hours[day];
        const isToday = day === today;
        const time = slot ? `${formatHour(slot[0])} – ${formatHour(slot[1])}` : "Fermé";
        const rowClass = compact
          ? "flex justify-between gap-4 py-1"
          : "flex items-center justify-between gap-4 border-b border-white/10 py-4";
        const badge = isToday && !compact
          ? '<span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">Aujourd’hui</span>'
          : "";
        return `<li class="${rowClass} ${isToday ? "text-white" : "text-white/55"}">
            <span class="flex items-center gap-3">${DAYS[day]}${badge}</span>
            <span class="tabular-nums">${time}</span>
          </li>`;
      }).join("");
    });

    renderStatus();
    setInterval(renderStatus, 60 * 1000);
  }

  /* ------------------------------------------------------------------------
     3. Services
     ------------------------------------------------------------------------ */
  function renderServiceRows() {
    const list = $("[data-services-list]");
    if (!list) return;

    list.innerHTML = SERVICES.map((cat, i) => {
      const min = minPrice(cat);
      const preview = cat.prestations.slice(0, 4).map((p) => escapeHtml(p.nom)).join(" · ");
      return `
        <li class="border-b border-white/10" data-reveal style="--d:${i * 0.05}s">
          <a href="services.html#${cat.id}" class="service-row group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 sm:grid-cols-[auto_1fr_auto_auto] md:gap-8 md:py-8" data-hover-img="${cat.image}">
            <img src="${cat.image}" alt="" loading="lazy" class="img-bw size-16 rounded-xl object-cover sm:size-20 lg:hidden">
            <span class="hidden w-12 text-sm tabular-nums text-white/40 lg:block">${pad(i + 1)}</span>
            <span class="min-w-0">
              <span class="block font-display text-3xl font-bold tracking-tight transition-transform duration-700 ease-out group-hover:translate-x-3 sm:text-5xl lg:text-7xl">${escapeHtml(cat.titre)}</span>
              <span class="mt-2 block truncate text-sm text-white/50">${preview}</span>
            </span>
            <span class="hidden whitespace-nowrap text-right text-sm text-white/70 sm:block">${min !== null ? `dès ${min}&nbsp;$` : ""}</span>
            <span class="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 transition-colors duration-500 group-hover:border-white group-hover:bg-white group-hover:text-ink md:size-14 [&>svg]:size-5">${ICONS.arrowUpRight}</span>
          </a>
        </li>`;
    }).join("");
  }

  function renderServicesPage() {
    const wrap = $("[data-services-full]");
    if (!wrap) return;

    const nav = $("[data-cat-nav]");
    if (nav) {
      nav.innerHTML = SERVICES.map(
        (cat) => `<a href="#${cat.id}" class="chip" data-cat-link="${cat.id}">${escapeHtml(cat.titre)}</a>`
      ).join("");
    }

    wrap.innerHTML = SERVICES.map((cat, i) => `
      <section id="${cat.id}" class="grid gap-10 border-t border-white/10 py-16 md:py-24 lg:grid-cols-12 lg:gap-16" data-cat-section aria-labelledby="titre-${cat.id}">
        <div class="lg:col-span-5 xl:col-span-4">
          <div class="lg:sticky lg:top-44">
            <p class="eyebrow">${pad(i + 1)} / ${pad(SERVICES.length)}</p>
            <h2 id="titre-${cat.id}" class="mt-5 font-display text-5xl font-bold tracking-tight md:text-6xl">${escapeHtml(cat.titre)}</h2>
            <p class="mt-5 max-w-md text-white/60">${escapeHtml(cat.description)}</p>
            <div class="img-zoom mt-8 overflow-hidden rounded-2xl" data-reveal="clip">
              <img src="${cat.image}" alt="${escapeHtml(cat.titre)} — Coiffure KB Unisexe" loading="lazy" class="img-bw aspect-[16/9] w-full object-cover lg:aspect-[4/5]">
            </div>
          </div>
        </div>
        <ul class="lg:col-span-7 xl:col-span-8">
          ${cat.prestations.map((p, j) => `
            <li class="border-b border-white/10 py-7 first:pt-0" data-reveal style="--d:${j * 0.04}s">
              <div class="flex items-baseline gap-4">
                <h3 class="font-display text-xl font-semibold tracking-tight md:text-2xl">${escapeHtml(p.nom)}</h3>
                <span class="leader" aria-hidden="true"></span>
                <span class="whitespace-nowrap font-display text-lg font-semibold md:text-2xl">${formatPrice(p)}</span>
              </div>
              <p class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/50">
                ${p.detail ? `<span>${escapeHtml(p.detail)}</span>` : ""}
                ${p.duree ? `<span class="inline-flex items-center gap-1.5">${ICONS.clock}${escapeHtml(p.duree)}</span>` : ""}
              </p>
            </li>`).join("")}
        </ul>
      </section>`).join("");
  }

  // Met en évidence la catégorie visible dans la barre de navigation
  function initScrollSpy() {
    const nav = $("[data-cat-nav]");
    const sections = $$("[data-cat-section]");
    if (!nav || !sections.length || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$("[data-cat-link]", nav).forEach((link) => {
          const active = link.dataset.catLink === entry.target.id;
          link.classList.toggle("is-active", active);
          if (active) {
            nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
          }
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach((section) => io.observe(section));
  }

  /* ------------------------------------------------------------------------
     4. Offres d'emploi
     ------------------------------------------------------------------------ */
  function renderJobCards() {
    const grid = $("[data-jobs-cards]");
    if (!grid) return;

    if (!JOBS.length) {
      grid.innerHTML = `<p class="rounded-3xl border border-ink/15 p-8 text-ink/70 md:col-span-2">Aucun poste ouvert pour le moment — les candidatures spontanées sont toujours les bienvenues.</p>`;
      return;
    }

    grid.innerHTML = JOBS.map((job, i) => `
      <article class="group relative flex flex-col justify-between gap-10 rounded-3xl border border-ink/15 p-7 transition-colors duration-500 hover:bg-ink hover:text-white md:p-9" data-reveal style="--d:${i * 0.06}s">
        <div>
          <div class="flex flex-wrap gap-2">
            <span class="tag">${escapeHtml(job.type)}</span>
            <span class="tag">${escapeHtml(job.experience)}</span>
          </div>
          <h3 class="mt-7 font-display text-3xl font-bold tracking-tight md:text-4xl">${escapeHtml(job.titre)}</h3>
          <p class="mt-3 text-ink/60 transition-colors duration-500 group-hover:text-white/60">${escapeHtml(job.resume)}</p>
        </div>
        <a href="emplois.html#${job.id}" class="inline-flex items-center gap-2 text-sm font-semibold after:absolute after:inset-0 after:rounded-3xl [&>svg]:size-4" data-cursor="Voir">
          Voir le poste ${ICONS.arrowUpRight}
        </a>
      </article>`).join("");
  }

  function renderJobDetails() {
    const list = $("[data-jobs-list]");
    if (!list) return;

    if (!JOBS.length) {
      list.innerHTML = `<p class="border-t border-white/10 py-10 text-lg text-white/60">Aucun poste ouvert pour le moment — envoyez-nous tout de même votre candidature spontanée ci-dessous.</p>`;
      return;
    }

    const bullets = (items) => (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    list.innerHTML = JOBS.map((job, i) => `
      <details id="${job.id}" class="job border-t border-white/10 last:border-b" data-reveal>
        <summary class="flex items-center gap-6 py-8 md:gap-10 md:py-10">
          <span class="hidden w-10 text-sm tabular-nums text-white/40 md:block">${pad(i + 1)}</span>
          <span class="min-w-0 flex-1">
            <span class="job__title block font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-6xl">${escapeHtml(job.titre)}</span>
            <span class="mt-4 flex flex-wrap gap-2 text-white/70">
              <span class="tag">${escapeHtml(job.type)}</span>
              <span class="tag">${escapeHtml(job.horaire)}</span>
              <span class="tag">${escapeHtml(job.experience)}</span>
            </span>
          </span>
          <span class="job__icon grid size-12 shrink-0 place-items-center rounded-full border border-white/20 transition-colors duration-500 md:size-16 [&>svg]:size-5">${ICONS.plus}</span>
        </summary>
        <div class="job__body grid gap-12 pb-14 md:grid-cols-12 md:pl-20">
          <div class="md:col-span-5">
            <p class="text-lg/relaxed text-white/75">${escapeHtml(job.description)}</p>
            <dl class="mt-8 grid grid-cols-2 gap-6 text-sm">
              <div><dt class="text-[11px] uppercase tracking-[0.2em] text-white/40">Type</dt><dd class="mt-1.5">${escapeHtml(job.type)}</dd></div>
              <div><dt class="text-[11px] uppercase tracking-[0.2em] text-white/40">Horaire</dt><dd class="mt-1.5">${escapeHtml(job.horaire)}</dd></div>
              <div><dt class="text-[11px] uppercase tracking-[0.2em] text-white/40">Expérience</dt><dd class="mt-1.5">${escapeHtml(job.experience)}</dd></div>
              <div><dt class="text-[11px] uppercase tracking-[0.2em] text-white/40">Rémunération</dt><dd class="mt-1.5">${escapeHtml(job.remuneration)}</dd></div>
            </dl>
            <button type="button" class="btn btn--light mt-10" data-apply="${job.id}">Postuler à ce poste ${ICONS.arrowUpRight}</button>
          </div>
          <div class="grid gap-10 sm:grid-cols-2 md:col-span-7">
            <div>
              <h4 class="eyebrow">Vos tâches</h4>
              <ul class="bullet-list mt-5 space-y-3 text-white/75">${bullets(job.responsabilites)}</ul>
            </div>
            <div>
              <h4 class="eyebrow">Votre profil</h4>
              <ul class="bullet-list mt-5 space-y-3 text-white/75">${bullets(job.exigences)}</ul>
            </div>
            <div class="rounded-2xl bg-white/[0.04] p-6 sm:col-span-2">
              <h4 class="eyebrow">Ce qu’on vous offre</h4>
              <ul class="bullet-list mt-5 grid gap-3 text-white/75 sm:grid-cols-2">${bullets(job.avantages)}</ul>
            </div>
          </div>
        </div>
      </details>`).join("");
  }

  function populateJobSelect() {
    $$("[data-job-select]").forEach((select) => {
      const options = JOBS.map((job) => `<option value="${escapeHtml(job.titre)}" data-id="${job.id}">${escapeHtml(job.titre)}</option>`);
      options.push('<option value="Candidature spontanée" data-id="spontanee">Candidature spontanée</option>');
      select.insertAdjacentHTML("beforeend", options.join(""));
    });
  }

  // Chiffres calculés à partir des données : ils restent toujours exacts
  function renderCounts() {
    const openSlots = (CONFIG.horaires || []).filter(Boolean);
    const values = {
      "jobs-count": JOBS.length,
      "services-count": SERVICES.reduce((sum, cat) => sum + cat.prestations.length, 0),
      "open-days": openSlots.length,
      "open-hours": Math.round(openSlots.reduce((sum, s) => sum + toMinutes(s[1]) - toMinutes(s[0]), 0) / 60),
    };

    Object.entries(values).forEach(([key, value]) => {
      $$(`[data-${key}]`).forEach((el) => {
        // Avec data-count, la valeur est animée par initCounters()
        if (el.hasAttribute("data-count")) el.dataset.count = value;
        else el.textContent = value;
      });
    });

    $$("[data-plural]").forEach((el) => {
      el.textContent = JOBS.length > 1 ? el.dataset.plural : el.dataset.singular;
    });
    $$("[data-if-jobs]").forEach((el) => (el.hidden = !JOBS.length));
  }

  function initApply() {
    const form = $("[data-apply-form]");
    if (!form) return;
    const select = $("[data-job-select]", form);

    // Boutons « Postuler » : présélectionne le poste puis défile vers le formulaire
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-apply]");
      if (!button) return;
      const option = select && $(`option[data-id="${button.dataset.apply}"]`, select);
      if (option) select.value = option.value;
      $("#postuler").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      setTimeout(() => $("input", form)?.focus({ preventScroll: true }), 700);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const poste = data.get("poste");
      const nom = data.get("nom");
      const body = [
        "Bonjour,",
        "",
        `Je souhaite poser ma candidature pour le poste : ${poste}.`,
        "",
        `Nom : ${nom}`,
        `Courriel : ${data.get("courriel")}`,
        `Téléphone : ${data.get("telephone") || "—"}`,
        `Expérience : ${data.get("experience")}`,
        `Disponibilités : ${data.getAll("disponibilites").join(", ") || "—"}`,
        "",
        "Message :",
        data.get("message") || "—",
        "",
        "Mon CV est joint à ce courriel.",
      ].join("\r\n");

      const to = CONFIG.courrielEmplois || CONFIG.courriel;
      const subject = `Candidature — ${poste} — ${nom}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const success = $("[data-apply-success]");
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  // Ouvre l'offre ciblée par l'ancre (#…). Au chargement, repositionne aussi
  // la page, car le contenu généré n'existait pas lors du défilement natif.
  function handleHash(scroll) {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;
    if (scroll) setTimeout(() => target.scrollIntoView({ behavior: "instant", block: "start" }), 60);
  }

  /* ------------------------------------------------------------------------
     5. Interface : en-tête, menu, préchargement
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = $("#header");
    if (!header) return;
    const floating = $$("[data-floating]");
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const delta = y - lastY;
      header.classList.toggle("is-scrolled", y > 30);

      if (Math.abs(delta) > 6) {
        const hide = delta > 0 && y > 500 && !root.classList.contains("menu-open");
        header.classList.toggle("is-hidden", hide);
        root.classList.toggle("header-hidden", hide);
        lastY = y;
      }

      const showFloating = y > window.innerHeight * 0.8;
      floating.forEach((el) => el.classList.toggle("is-visible", showFloating));
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();

    $$("[data-to-top]").forEach((btn) =>
      btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }))
    );
  }

  function initMenu() {
    const toggle = $(".menu-toggle");
    const menu = $("#menu-mobile");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      root.classList.toggle("menu-open", open);
    };

    menu.inert = true;
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  function initPreloader() {
    const preloader = $(".preloader");
    const finish = () => root.classList.add("is-loaded");
    if (!preloader) {
      finish();
      return;
    }

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem("kb-visited") === "1";
      sessionStorage.setItem("kb-visited", "1");
    } catch (e) { /* stockage indisponible : on affiche l'animation complète */ }

    const quick = alreadySeen || reduceMotion;
    if (quick) preloader.classList.add("is-quick");

    const count = $(".preloader__count", preloader);
    const bar = $(".preloader__bar", preloader);
    const duration = quick ? 200 : 1300;
    const fontsReady = Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (count) count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (bar) bar.style.setProperty("--p", eased);
      if (progress < 1) requestAnimationFrame(tick);
      else fontsReady.then(done);
    }

    function done() {
      preloader.classList.add("is-done");
      finish();
      setTimeout(() => preloader.remove(), 1100);
    }

    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------------
     6. Animations
     ------------------------------------------------------------------------ */
  let revealObserver = null;

  function initReveal() {
    const elements = $$("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-in"));
      return;
    }
    revealObserver = revealObserver || new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    elements.forEach((el) => revealObserver.observe(el));
  }

  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      const start = performance.now();
      const duration = 1600;
      (function step(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * (p === 1 ? 1 : eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
  }

  function initMarquee() {
    $$(".marquee").forEach((marquee) => {
      const group = $(".marquee__group", marquee);
      if (!group) return;
      for (let i = 0; i < 2; i++) {
        const clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        marquee.appendChild(clone);
      }
    });
  }

  function initParallax() {
    const elements = $$("[data-parallax]");
    if (!elements.length || reduceMotion) return;
    let ticking = false;

    function update() {
      const vh = window.innerHeight;
      elements.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const scale = el.dataset.parallaxScale || 1.15;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${scale})`;
      });
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initCursor() {
    if (!finePointer || reduceMotion) return;

    const cursor = document.createElement("div");
    cursor.className = "cursor is-hidden";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="cursor__label"></span>';
    document.body.appendChild(cursor);
    const label = cursor.firstElementChild;

    let x = -100, y = -100, cx = -100, cy = -100;

    window.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      cursor.classList.remove("is-hidden");
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));

    document.addEventListener("pointerover", (e) => {
      const target = e.target.closest("[data-cursor], a, button, summary, label, select");
      const text = target && target.dataset.cursor;
      cursor.classList.toggle("is-label", Boolean(text));
      cursor.classList.toggle("is-hover", Boolean(target) && !text);
      if (text) label.textContent = text;
    });

    (function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  // Image qui suit le curseur au survol de la liste des services (accueil)
  function initHoverReveal() {
    const list = $("[data-services-list]");
    if (!list || !finePointer || reduceMotion) return;

    const box = document.createElement("div");
    box.className = "hover-reveal";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = '<img alt="">';
    document.body.appendChild(box);
    const img = box.firstElementChild;

    let x = 0, y = 0, cx = 0, cy = 0, running = false, visible = false;

    function loop() {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      const rotate = Math.max(-10, Math.min(10, (x - cx) * 0.06));
      box.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) rotate(${rotate.toFixed(2)}deg)`;
      if (visible || Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) requestAnimationFrame(loop);
      else running = false;
    }

    list.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
    });
    list.addEventListener("pointerover", (e) => {
      const row = e.target.closest("[data-hover-img]");
      if (!row) return;
      if (img.getAttribute("src") !== row.dataset.hoverImg) img.src = row.dataset.hoverImg;
      if (!visible) {
        cx = x = e.clientX;
        cy = y = e.clientY;
      }
      visible = true;
      box.classList.add("is-visible");
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    });
    list.addEventListener("pointerleave", () => {
      visible = false;
      box.classList.remove("is-visible");
    });
  }

  /* ------------------------------------------------------------------------
     7. Galerie : filtres et visionneuse
     ------------------------------------------------------------------------ */
  function initGallery() {
    const grid = $("[data-gallery]");
    if (!grid) return;
    const items = $$("[data-cat]", grid);
    const buttons = $$("[data-filter]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        items.forEach((item) => {
          const show = filter === "tout" || item.dataset.cat.split(" ").includes(filter);
          item.hidden = !show;
          if (show) {
            item.classList.remove("is-in");
            requestAnimationFrame(() => item.classList.add("is-in"));
          }
        });
      });
    });
  }

  function initLightbox() {
    const links = $$("[data-lightbox]");
    if (!links.length) return;

    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Visionneuse de photos");
    box.innerHTML = `
      <div class="flex items-center justify-between px-5 py-5 md:px-10">
        <span class="text-xs tabular-nums tracking-[0.3em] text-white/60" data-lb-count></span>
        <button type="button" class="lb-btn" data-lb-close aria-label="Fermer">${ICONS.close}</button>
      </div>
      <div class="relative flex min-h-0 items-center justify-center px-4 md:px-28" data-lb-stage>
        <img class="lightbox__img" alt="">
        <button type="button" class="lb-btn absolute left-4 top-1/2 -translate-y-1/2 md:left-10" data-lb-prev aria-label="Photo précédente">${ICONS.prev}</button>
        <button type="button" class="lb-btn absolute right-4 top-1/2 -translate-y-1/2 md:right-10" data-lb-next aria-label="Photo suivante">${ICONS.next}</button>
      </div>
      <p class="px-5 py-6 text-center font-accent text-2xl italic md:text-3xl" data-lb-caption></p>`;
    document.body.appendChild(box);

    const img = $(".lightbox__img", box);
    const caption = $("[data-lb-caption]", box);
    const counter = $("[data-lb-count]", box);
    const closeBtn = $("[data-lb-close]", box);
    let current = 0;
    let lastFocus = null;

    const visibleLinks = () => links.filter((link) => !link.closest("[hidden]"));

    function show(index) {
      const list = visibleLinks();
      if (!list.length) return;
      current = (index + list.length) % list.length;
      const link = list[current];
      img.classList.add("is-loading");
      const next = new Image();
      next.onload = next.onerror = () => {
        img.src = link.href;
        img.alt = $("img", link)?.alt || "";
        img.classList.remove("is-loading");
      };
      next.src = link.href;
      caption.textContent = link.dataset.caption || "";
      counter.textContent = `${pad(current + 1)} / ${pad(list.length)}`;
    }

    function open(link) {
      lastFocus = document.activeElement;
      show(visibleLinks().indexOf(link));
      box.classList.add("is-open");
      root.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function close() {
      box.classList.remove("is-open");
      root.classList.remove("lightbox-open");
      if (lastFocus) lastFocus.focus();
    }

    links.forEach((link) =>
      link.addEventListener("click", (e) => {
        e.preventDefault();
        open(link);
      })
    );
    closeBtn.addEventListener("click", close);
    $("[data-lb-prev]", box).addEventListener("click", () => show(current - 1));
    $("[data-lb-next]", box).addEventListener("click", () => show(current + 1));
    $("[data-lb-stage]", box).addEventListener("click", (e) => {
      if (e.target === e.currentTarget) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") {
        const focusable = $$("button", box);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Balayage sur mobile
    let touchX = null;
    box.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    box.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ------------------------------------------------------------------------
     8. Données structurées (référencement local)
     ------------------------------------------------------------------------ */
  function injectSchema() {
    if (document.body.dataset.page !== "accueil") return;
    const a = CONFIG.adresse || {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const schema = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: CONFIG.nom,
      telephone: CONFIG.telephone,
      email: CONFIG.courriel,
      image: new URL("img/salon2.jpg", location.href).href,
      address: {
        "@type": "PostalAddress",
        streetAddress: a.rue,
        addressLocality: a.ville,
        addressRegion: a.province,
        postalCode: a.codePostal,
        addressCountry: "CA",
      },
      openingHoursSpecification: (CONFIG.horaires || [])
        .map((slot, day) => slot && {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayNames[day],
          opens: slot[0],
          closes: slot[1],
        })
        .filter(Boolean),
      sameAs: Object.values(CONFIG.reseaux || {}).filter(Boolean),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */
  hydrateConfig();
  renderHours();
  renderServiceRows();
  renderServicesPage();
  renderJobCards();
  renderJobDetails();
  populateJobSelect();
  renderCounts();
  injectSchema();

  initPreloader();
  initHeader();
  initMenu();
  initMarquee();
  initReveal();
  initCounters();
  initParallax();
  initGallery();
  initLightbox();
  initScrollSpy();
  initApply();
  initCursor();
  initHoverReveal();

  if (document.readyState === "complete") handleHash(true);
  else window.addEventListener("load", () => handleHash(true));
  window.addEventListener("hashchange", () => handleHash(false));
})();
