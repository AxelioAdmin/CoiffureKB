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

  const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // affichage du lundi au dimanche

  const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
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

  // Prix « à partir de » d'une catégorie : prixDepart s'il est défini, sinon le plus bas
  function startingPrice(category) {
    if (typeof category.prixDepart === "number") return category.prixDepart;
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
    // Sans lien de réservation en ligne, les boutons « Rendez-vous » gardent
    // leur lien vers le formulaire de demande de l'accueil (index.html#rendez-vous).
    if (CONFIG.reservation) {
      $$("[data-kb-booking]").forEach((el) => {
        el.href = CONFIG.reservation;
        el.target = "_blank";
        el.rel = "noopener";
      });
    }

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
          : "flex items-center justify-between gap-4 border-b border-white/10 py-3.5";
        const label = isToday && !compact
          ? '<span class="text-[10px] uppercase tracking-[0.22em] text-white/45">Aujourd’hui</span>'
          : "";
        return `<li class="${rowClass} ${isToday ? "text-white" : "text-white/50"}">
            <span class="flex items-center gap-3">${DAYS[day]}${label}</span>
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

    list.innerHTML = SERVICES.map((cat) => {
      const start = startingPrice(cat);
      const preview = cat.prestations.slice(0, 4).map((p) => escapeHtml(p.nom)).join(" · ");
      return `
        <li class="border-t border-white/10" data-reveal>
          <a href="services.html#${cat.id}" class="group flex items-center gap-5 py-6">
            <img src="${cat.image}" alt="" loading="lazy" class="img-bw size-16 shrink-0 object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-100">
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline gap-4">
                <span class="font-display text-[13px] uppercase tracking-[0.12em]">${escapeHtml(cat.titre)}</span>
                <span class="leader" aria-hidden="true"></span>
                <span class="whitespace-nowrap text-sm text-white/70">${start !== null ? `dès ${start}&nbsp;$` : ""}</span>
              </span>
              <span class="mt-2 block truncate text-[13px] text-white/45 transition-colors duration-500 group-hover:text-white/65">${preview}</span>
            </span>
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
        (cat) => `<a href="#${cat.id}" class="tab-link" data-cat-link="${cat.id}">${escapeHtml(cat.titre)}</a>`
      ).join("");
    }

    wrap.innerHTML = SERVICES.map((cat, i) => `
      <section id="${cat.id}" class="grid gap-10 border-t border-white/10 py-20 md:py-24 lg:grid-cols-12 lg:gap-16" data-cat-section aria-labelledby="titre-${cat.id}">
        <div class="lg:col-span-4">
          <div class="lg:sticky lg:top-44" data-reveal>
            <p class="text-[11px] uppercase tracking-[0.3em] text-white/40">${pad(i + 1)} / ${pad(SERVICES.length)}</p>
            <h2 id="titre-${cat.id}" class="title mt-4">${escapeHtml(cat.titre)}</h2>
            <p class="mt-4 max-w-sm text-[15px]/7 text-white/55">${escapeHtml(cat.description)}</p>
            <div class="img-hover mt-8">
              <img src="${cat.image}" alt="${escapeHtml(cat.titre)} — Coiffure KB Unisexe" loading="lazy" class="img-bw aspect-[16/10] w-full object-cover lg:aspect-[4/5]">
            </div>
          </div>
        </div>
        <ul class="lg:col-span-7 lg:col-start-6">
          ${cat.prestations.map((p) => `
            <li class="border-b border-white/10 py-6 first:pt-0" data-reveal>
              <div class="flex items-baseline gap-4">
                <h3 class="text-lg md:text-xl">${escapeHtml(p.nom)}</h3>
                <span class="leader" aria-hidden="true"></span>
                <span class="whitespace-nowrap text-base text-white/85 md:text-lg">${formatPrice(p)}</span>
              </div>
              <p class="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/45">
                ${p.detail ? `<span>${escapeHtml(p.detail)}</span>` : ""}
                ${p.duree ? `<span>${escapeHtml(p.duree)}</span>` : ""}
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
  function renderJobRows() {
    const list = $("[data-jobs-rows]");
    if (!list) return;

    if (!JOBS.length) {
      list.innerHTML = `<li class="border-b border-white/10 py-8 text-white/60">Aucun poste ouvert pour le moment — les candidatures spontanées sont toujours les bienvenues.</li>`;
      return;
    }

    list.innerHTML = JOBS.map((job) => `
      <li class="border-b border-white/10" data-reveal>
        <a href="emplois.html#${job.id}" class="group flex items-center justify-between gap-6 py-7">
          <span class="min-w-0">
            <span class="block font-display text-sm uppercase tracking-[0.1em] md:text-base">${escapeHtml(job.titre)}</span>
            <span class="mt-2.5 block text-[11px] uppercase tracking-[0.2em] text-white/45">${escapeHtml(job.type)} · ${escapeHtml(job.experience)}</span>
          </span>
          <span class="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 transition-colors duration-500 group-hover:border-white group-hover:bg-white group-hover:text-ink [&>svg]:size-4">${ICONS.arrow}</span>
        </a>
      </li>`).join("");
  }

  function renderJobDetails() {
    const list = $("[data-jobs-list]");
    if (!list) return;

    if (!JOBS.length) {
      list.innerHTML = `<p class="border-t border-white/10 py-10 text-white/60">Aucun poste ouvert pour le moment — envoyez-nous tout de même votre candidature spontanée ci-dessous.</p>`;
      return;
    }

    const bullets = (items) => (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const fact = (label, value) => `
      <div><dt class="text-[10px] uppercase tracking-[0.22em] text-white/40">${label}</dt><dd class="mt-1.5 text-white/85">${escapeHtml(value)}</dd></div>`;

    list.innerHTML = JOBS.map((job, i) => `
      <details id="${job.id}" class="job border-t border-white/10 last:border-b" data-reveal>
        <summary class="flex items-center gap-6 py-8">
          <span class="hidden w-10 text-[11px] tracking-[0.2em] text-white/35 md:block">${pad(i + 1)}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-display text-base uppercase tracking-[0.08em] md:text-xl">${escapeHtml(job.titre)}</span>
            <span class="mt-4 flex flex-wrap gap-2 text-white/60">
              <span class="tag">${escapeHtml(job.type)}</span>
              <span class="tag">${escapeHtml(job.horaire)}</span>
              <span class="tag">${escapeHtml(job.experience)}</span>
            </span>
          </span>
          <span class="job__icon grid size-11 shrink-0 place-items-center rounded-full border border-white/20 [&>svg]:size-4">${ICONS.plus}</span>
        </summary>
        <div class="job__body grid gap-12 pb-14 md:grid-cols-12 md:pl-16">
          <div class="md:col-span-5">
            <p class="text-[15px]/7 text-white/65">${escapeHtml(job.description)}</p>
            <dl class="mt-8 grid grid-cols-2 gap-6 text-sm">
              ${fact("Type", job.type)}
              ${fact("Horaire", job.horaire)}
              ${fact("Expérience", job.experience)}
              ${fact("Rémunération", job.remuneration)}
            </dl>
            <button type="button" class="btn btn--light mt-10" data-apply="${job.id}">Postuler à ce poste</button>
          </div>
          <div class="grid gap-10 sm:grid-cols-2 md:col-span-7">
            <div>
              <h4 class="eyebrow">Vos tâches</h4>
              <ul class="bullet-list mt-5 space-y-3 text-sm/6 text-white/65">${bullets(job.responsabilites)}</ul>
            </div>
            <div>
              <h4 class="eyebrow">Votre profil</h4>
              <ul class="bullet-list mt-5 space-y-3 text-sm/6 text-white/65">${bullets(job.exigences)}</ul>
            </div>
            <div class="border border-white/10 p-6 sm:col-span-2">
              <h4 class="eyebrow">Ce qu’on vous offre</h4>
              <ul class="bullet-list mt-5 grid gap-3 text-sm/6 text-white/65 sm:grid-cols-2">${bullets(job.avantages)}</ul>
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
    const values = {
      "jobs-count": JOBS.length,
      "services-count": SERVICES.reduce((sum, cat) => sum + cat.prestations.length, 0),
    };
    Object.entries(values).forEach(([key, value]) => {
      $$(`[data-${key}]`).forEach((el) => (el.textContent = value));
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
     5. Demande de rendez-vous (accueil)
     ------------------------------------------------------------------------ */
  const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const minutesToTime = (minutes) => `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;

  // "2026-10-06" → date locale (new Date("2026-10-06") serait lue en heure UTC)
  function parseDate(value) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function populateServiceSelect() {
    $$("[data-service-select]").forEach((select) => {
      const options = ['<option value="À déterminer (consultation)">Je ne sais pas encore — consultation</option>'];
      SERVICES.forEach((cat) => {
        const items = cat.prestations.map((p) =>
          `<option value="${escapeHtml(`${cat.titre} — ${p.nom}`)}">${escapeHtml(p.nom)} · ${formatPrice(p)}</option>`
        );
        options.push(`<optgroup label="${escapeHtml(cat.titre)}">${items.join("")}</optgroup>`);
      });
      select.insertAdjacentHTML("beforeend", options.join(""));
    });
  }

  function initBooking() {
    const form = $("[data-booking-form]");
    if (!form) return;
    const dateInput = $("[data-booking-date]", form);
    const timeSelect = $("[data-booking-time]", form);
    const hint = $("[data-booking-hint]", form);
    const hours = CONFIG.horaires || [];

    // Rappel des jours de fermeture : « Salon fermé le lundi et le dimanche. »
    const closedDays = WEEK_ORDER.filter((day) => !hours[day]).map((day) => `le ${DAYS[day].toLowerCase()}`);
    const defaultHint = closedDays.length
      ? `Salon fermé ${closedDays.length > 1 ? `${closedDays.slice(0, -1).join(", ")} et ${closedDays[closedDays.length - 1]}` : closedDays[0]}.`
      : "";

    dateInput.min = isoDate(new Date());

    function setTimeOptions(placeholder, slots = []) {
      const previous = timeSelect.value;
      timeSelect.innerHTML = `<option value="" disabled selected>${placeholder}</option>`
        + (slots.length ? '<option value="Peu importe">Peu importe</option>' : "")
        + slots.map((t) => `<option>${formatHour(minutesToTime(t))}</option>`).join("");
      timeSelect.disabled = !slots.length;
      if (previous && $$("option", timeSelect).some((o) => o.value === previous)) timeSelect.value = previous;
    }

    function showHint(text, isError = false) {
      hint.textContent = text;
      hint.classList.toggle("is-error", isError);
      dateInput.setCustomValidity(isError ? text : "");
    }

    // Plages aux 30 minutes selon les heures d'ouverture du jour choisi
    function updateSlots() {
      if (!dateInput.value) {
        showHint(defaultHint);
        setTimeOptions("Choisissez d'abord une date");
        return;
      }

      const day = parseDate(dateInput.value).getDay();
      const slot = hours[day];
      const slots = [];
      let error = "";

      if (dateInput.value < dateInput.min) {
        error = "Choisissez une date à partir d'aujourd'hui.";
      } else if (!slot) {
        error = `Le salon est fermé le ${DAYS[day].toLowerCase()}. Choisissez une autre date.`;
      } else {
        // Dernière plage 30 min avant la fermeture ; aujourd'hui, au moins 1 h d'avance
        const now = new Date();
        const earliest = dateInput.value === isoDate(now) ? now.getHours() * 60 + now.getMinutes() + 60 : 0;
        for (let t = toMinutes(slot[0]); t <= toMinutes(slot[1]) - 30; t += 30) {
          if (t >= earliest) slots.push(t);
        }
        if (!slots.length) error = "Plus aucune plage disponible aujourd'hui. Choisissez une autre date.";
      }

      if (error) {
        showHint(error, true);
        setTimeOptions("Aucune plage disponible");
      } else {
        showHint(`${DAYS[day]} : ouvert de ${formatHour(slot[0])} à ${formatHour(slot[1])}.`);
        setTimeOptions("Choisir une heure…", slots);
      }
    }

    dateInput.addEventListener("change", updateSlots);
    dateInput.addEventListener("input", updateSlots);
    updateSlots(); // tient compte d'une date restaurée par le navigateur

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const nom = data.get("nom");
      const date = parseDate(data.get("date")).toLocaleDateString("fr-CA", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const body = [
        "Bonjour,",
        "",
        "J'aimerais prendre rendez-vous au salon.",
        "",
        `Service : ${data.get("service")}`,
        `Date souhaitée : ${date}`,
        `Heure souhaitée : ${data.get("heure")}`,
        `Visite : ${data.get("visite") || "—"}`,
        "",
        `Nom : ${nom}`,
        `Téléphone : ${data.get("telephone")}`,
        `Courriel : ${data.get("courriel") || "—"}`,
        "",
        "Précisions :",
        data.get("message") || "—",
        "",
        "Merci de me confirmer le rendez-vous.",
      ].join("\r\n");

      const subject = `Demande de rendez-vous — ${nom} — ${date}`;
      window.location.href = `mailto:${CONFIG.courriel}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const success = $("[data-booking-success]", form);
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     6. Interface : en-tête, menu, apparitions
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = $("#header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
    window.addEventListener("scroll", update, { passive: true });
    update();
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
      // Le contenu caché derrière le menu ne doit pas recevoir le focus
      $$("main, footer").forEach((el) => (el.inert = open));
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

  // Fondu discret des blocs à leur entrée dans l'écran
  function initReveal() {
    const elements = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      elements.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    elements.forEach((el) => io.observe(el));
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
          item.hidden = !(filter === "tout" || item.dataset.cat.split(" ").includes(filter));
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
        <span class="text-[11px] tabular-nums tracking-[0.3em] text-white/50" data-lb-count></span>
        <button type="button" class="lb-btn" data-lb-close aria-label="Fermer">${ICONS.close}</button>
      </div>
      <div class="relative flex min-h-0 items-center justify-center px-4 md:px-24" data-lb-stage>
        <img class="lightbox__img" alt="">
        <button type="button" class="lb-btn absolute left-4 top-1/2 -translate-y-1/2 md:left-10" data-lb-prev aria-label="Photo précédente">${ICONS.prev}</button>
        <button type="button" class="lb-btn absolute right-4 top-1/2 -translate-y-1/2 md:right-10" data-lb-next aria-label="Photo suivante">${ICONS.next}</button>
      </div>
      <p class="px-5 py-6 text-center text-[11px] uppercase tracking-[0.3em] text-white/60" data-lb-caption></p>`;
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
      logo: new URL("img/logo.svg", location.href).href,
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
  renderJobRows();
  renderJobDetails();
  populateJobSelect();
  populateServiceSelect();
  renderCounts();
  injectSchema();

  initHeader();
  initMenu();
  initReveal();
  initGallery();
  initLightbox();
  initScrollSpy();
  initApply();
  initBooking();

  if (document.readyState === "complete") handleHash(true);
  else window.addEventListener("load", () => handleHash(true));
  window.addEventListener("hashchange", () => handleHash(false));
})();
