/* ==========================================================================
   Dr. Junaid Fateh: site scripts (no libraries needed)
   ========================================================================== */
(function () {
  "use strict";

  var WHATSAPP = document.body.getAttribute("data-whatsapp") || "923366600008";
  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  doc.documentElement.classList.remove("no-js");

  /** Fire analytics events if GA4 / Meta Pixel are configured in site.yml */
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params || {});
      if (typeof window.fbq === "function") {
        var map = { generate_lead: "Lead", consult_open: "Contact" };
        if (map[name]) window.fbq("track", map[name], params || {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  /* ── Header: shadow on scroll, menus ─────────────────────────────────── */
  var header = $("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      doc.documentElement.style.setProperty("--mega-top", header.getBoundingClientRect().bottom + "px");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Click/tap support for dropdowns (hover works on desktop through CSS)
    $$(".nav__toggle").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var li = btn.parentElement;
        var open = !li.classList.contains("is-open");
        $$(".nav__list > li.is-open").forEach(function (o) {
          o.classList.remove("is-open");
          var b = $(".nav__toggle", o); if (b) b.setAttribute("aria-expanded", "false");
        });
        li.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
    doc.addEventListener("click", function (e) {
      if (!e.target.closest(".nav__list")) {
        $$(".nav__list > li.is-open").forEach(function (o) {
          o.classList.remove("is-open");
          var b = $(".nav__toggle", o); if (b) b.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  // Mobile menu
  var burger = $("[data-burger]");
  var mobileMenu = $("#mobile-menu");
  function closeMobile() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    doc.body.classList.remove("modal-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
  }
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      mobileMenu.hidden = false;
      doc.body.classList.add("modal-open");
      burger.setAttribute("aria-expanded", "true");
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target === mobileMenu || e.target.closest("[data-burger-close]")) closeMobile();
    });
  }

  /* ── YouTube "click to play" ─────────────────────────────────────────── */
  doc.addEventListener("click", function (e) {
    var btn = e.target.closest(".yt-facade");
    if (!btn) return;
    var id = btn.getAttribute("data-yt");
    var iframe = doc.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    iframe.title = btn.getAttribute("aria-label") || "YouTube video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    btn.replaceWith(iframe);
    track("video_play", { video_id: id });
  });

  /* ── Before / after sliders ──────────────────────────────────────────── */
  $$(".ba__stage").forEach(function (stage) {
    var range = $(".ba__range", stage);
    if (!range) return;
    var update = function () { stage.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", update);
    update();
  });

  /* ── Carousels (reviews) ─────────────────────────────────────────────── */
  $$("[data-carousel]").forEach(function (car) {
    var track = $(".carousel__track", car);
    $$("[data-dir]", car).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = Number(btn.getAttribute("data-dir"));
        var card = track.firstElementChild;
        var step = card ? card.getBoundingClientRect().width + 20 : 300;
        track.scrollBy({ left: dir * step, behavior: "smooth" });
      });
    });
  });

  /* ── Filters (gallery, reviews) ──────────────────────────────────────── */
  $$("[data-filter-group]").forEach(function (bar) {
    var target = $(bar.getAttribute("data-filter-group"));
    if (!target) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      var val = btn.getAttribute("data-filter");
      $$("button", bar).forEach(function (b) { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
      $$("[data-filter-item]", target).forEach(function (item) {
        var tags = (item.getAttribute("data-filter-item") || "").split(" ");
        item.hidden = !(val === "all" || tags.indexOf(val) !== -1);
      });
    });
  });

  /* ── Hair graft estimator ────────────────────────────────────────────── */
  var est = $("[data-estimator]");
  if (est) {
    var fmt = function (n) { return Math.round(n / 50) * 50; };
    var nf = new Intl.NumberFormat("en-US");
    var current = function () { return $(".estimator__panel:not([hidden])", est); };
    var calc = function () {
      var panel = current();
      if (!panel) return;
      var opt = $("input[type=radio]:checked:not([name=est-density])", panel);
      if (!opt) return;
      var factor = 1;
      var dens = $("input[name=est-density]:checked", panel);
      if (dens) factor = Number(dens.value) || 1;
      var min = fmt(Number(opt.getAttribute("data-min")) * factor);
      var max = fmt(Number(opt.getAttribute("data-max")) * factor);
      $("[data-est-value]", est).textContent = nf.format(min) + " to " + nf.format(max);
      var meta = max > 4500 ? "Often planned over two sessions" : (max > 3000 ? "Usually one long session" : "Usually one session");
      $("[data-est-meta]", est).textContent = meta + ". Final number confirmed at consultation.";
      var send = $("[data-est-send]", est);
      var lines = "Graft estimator result: " + nf.format(min) + " to " + nf.format(max) + " grafts (" + opt.getAttribute("data-label") + (dens ? ", " + dens.getAttribute("data-label") : "") + ").";
      send.setAttribute("data-procedure", panel.getAttribute("data-procedure"));
      send.setAttribute("data-message", lines);
    };
    $$(".estimator__tab", est).forEach(function (tab) {
      tab.addEventListener("click", function () {
        var area = tab.getAttribute("data-area");
        $$(".estimator__tab", est).forEach(function (t) { t.classList.toggle("is-active", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
        $$(".estimator__panel", est).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== area; });
        calc();
      });
    });
    est.addEventListener("change", calc);
    calc();
  }

  /* ── WhatsApp consultation form ──────────────────────────────────────── */
  var modal = $("#consult-modal");
  var form = $("#consult-form");
  var lastFocus = null;

  function openConsult(opts) {
    if (!modal || !form) return false;
    opts = opts || {};
    lastFocus = doc.activeElement;
    var sel = form.elements.procedure;
    var proc = opts.procedure || doc.body.getAttribute("data-procedure") || "";
    if (proc && sel) {
      var match = Array.prototype.find.call(sel.options, function (o) { return o.value === proc || o.text === proc; });
      if (match) sel.value = match.value;
    }
    if (opts.location) {
      var r = Array.prototype.find.call(form.elements.location, function (i) { return i.value === opts.location; });
      if (r) r.checked = true;
    }
    if (opts.message) {
      var msg = form.elements.message;
      if (msg.value.indexOf(opts.message) === -1) msg.value = (msg.value ? msg.value + "\n" : "") + opts.message;
    }
    modal.hidden = false;
    doc.body.classList.add("modal-open");
    setTimeout(function () { (form.elements.name.value ? sel : form.elements.name).focus(); }, 50);
    track("consult_open", { procedure: proc || "general", page: location.pathname });
    return true;
  }
  function closeConsult() {
    if (!modal) return;
    modal.hidden = true;
    doc.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  doc.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-consult]");
    if (!trigger) {
      // Any other WhatsApp link to the clinic number also opens the form, unless marked data-direct
      var wa = e.target.closest('a[href*="wa.me/' + WHATSAPP + '"]');
      if (wa && !wa.hasAttribute("data-direct") && !wa.closest("#consult-modal")) trigger = wa;
    }
    if (!trigger) return;
    var opened = openConsult({
      procedure: trigger.getAttribute("data-procedure"),
      location: trigger.getAttribute("data-location"),
      message: trigger.getAttribute("data-message"),
    });
    if (opened) { e.preventDefault(); closeMobile(); }
  });

  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target.closest("[data-modal-close]")) closeConsult(); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (!modal.hidden) closeConsult(); closeMobile(); }
      if (e.key === "Tab" && !modal.hidden) {
        var f = $$("button, a[href], input, select, textarea", modal).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var direct = $("[data-direct]", modal);
    if (direct) direct.addEventListener("click", function () { track("generate_lead", { method: "whatsapp_direct" }); });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = form.elements;
      var err = $(".form-error", form);
      $$(".is-invalid", form).forEach(function (i) { i.classList.remove("is-invalid"); });
      var missing = [];
      if (!el.name.value.trim()) { missing.push("your name"); el.name.classList.add("is-invalid"); }
      if (!el.procedure.value) { missing.push("a treatment"); el.procedure.classList.add("is-invalid"); }
      if (missing.length) {
        err.textContent = "Please add " + missing.join(" and ") + ".";
        err.hidden = false;
        (el.name.value.trim() ? el.procedure : el.name).focus();
        return;
      }
      err.hidden = true;
      var loc = form.querySelector("input[name=location]:checked");
      var lines = [
        "Assalam o Alaikum Dr. Junaid,",
        "I would like to book a consultation.",
        "",
        "Name: " + el.name.value.trim(),
      ];
      if (el.phone.value.trim()) lines.push("Phone: " + el.phone.value.trim());
      if (el.city.value.trim()) lines.push("City/Country: " + el.city.value.trim());
      lines.push("Treatment: " + el.procedure.value);
      if (loc) lines.push("Preferred: " + loc.value);
      if (el.message.value.trim()) lines.push("", el.message.value.trim());
      lines.push("", "(Sent from " + doc.title.split("|")[0].trim() + ")");
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
      track("generate_lead", { method: "whatsapp_form", procedure: el.procedure.value, location: loc ? loc.value : "" });
      window.open(url, "_blank", "noopener");
      closeConsult();
    });
  }

  /* ── English / Urdu toggle (Google Translate) ────────────────────────── */
  var toggles = $$(".lang-toggle");
  if (toggles.length) {
    var KEY = "drjf_lang";
    var store = {
      get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
      set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } },
    };
    var cookieLang = (doc.cookie.match(/googtrans=\/en\/([\w-]+)/) || [])[1];
    var lang = cookieLang === "ur" ? "ur" : (store.get() || "en");
    var setActive = function (l) {
      $$(".lang-toggle__opt").forEach(function (b) {
        var on = b.getAttribute("data-lang") === l;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    };
    var setCookie = function (value, expire) {
      var host = location.hostname;
      var tail = expire ? "; expires=Thu, 01 Jan 1970 00:00:00 UTC" : "";
      doc.cookie = "googtrans=" + value + "; path=/" + tail;
      if (host && host.indexOf(".") !== -1) {
        doc.cookie = "googtrans=" + value + "; path=/; domain=" + host + tail;
        doc.cookie = "googtrans=" + value + "; path=/; domain=." + host + tail;
      }
    };
    var applyCombo = function (l, tries) {
      var combo = $(".goog-te-combo");
      if (combo) { combo.value = l; combo.dispatchEvent(new Event("change")); return true; }
      if ((tries || 0) < 30) setTimeout(function () { applyCombo(l, (tries || 0) + 1); }, 300);
      return false;
    };
    setActive(lang);

    if (location.protocol !== "file:") {
      window.googleTranslateElementInit = function () {
        /* global google */
        new google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "en,ur", autoDisplay: false }, "google_translate_element");
        if (lang === "ur") applyCombo("ur");
      };
      var s = doc.createElement("script");
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      doc.head.appendChild(s);
    }

    doc.addEventListener("click", function (e) {
      var b = e.target.closest(".lang-toggle__opt");
      if (!b) return;
      var l = b.getAttribute("data-lang");
      if (l === lang) return;
      lang = l;
      store.set(l);
      setActive(l);
      track("language_switch", { language: l });
      if (l === "ur") {
        setCookie("/en/ur");
        if (!applyCombo("ur", 30)) location.reload();
      } else {
        setCookie("", true);
        if (!applyCombo("en", 30)) location.reload();
        else setTimeout(function () { location.reload(); }, 150);
      }
    });
  }

  /* ── Reveal on scroll ────────────────────────────────────────────────── */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("is-visible"); });
  }
})();
