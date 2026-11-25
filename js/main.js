/* Studio Ciała – skrypty strony */
(function () {
  'use strict';

  /* ---------- KONFIGURACJA (uzupełnić przy wdrożeniu) ---------- */
  var CONFIG = {
    // Adres endpointu formularza (np. Formspree: https://formspree.io/f/XXXX albo własny PHP).
    // Puste = formularz otwiera program pocztowy z gotową wiadomością (mailto).
    FORM_ENDPOINT: '',
    CONTACT_EMAIL: 'kontakt@studiociala.pl',
    // Mapa Google ładowana dopiero po zgodzie na cookies funkcjonalne.
    MAP_SRC: 'https://maps.google.com/maps?q=Jana%20Dekana%208%2C%2064-100%20Leszno&z=15&output=embed',
    // Skrypt widgetu Instagrama (np. Behold.so / LightWidget / Elfsight) – ładowany po zgodzie.
    INSTAGRAM_WIDGET: '',
    // ID Google Analytics 4 (np. G-XXXXXXX) – ładowane po zgodzie na analityczne.
    GA_ID: ''
  };
  var CONSENT_KEY = 'sc_cookie_consent_v1';

  var root = document.documentElement;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- rok w stopce ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- header po przewinięciu ---------- */
  var header = $('#header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- menu mobilne ---------- */
  var burger = $('.burger');
  var mobileMenu = $('#mobile-menu');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (burger) { burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu'); }
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', String(!open));
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  $$('#mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); setFab(false); }
  });

  /* ---------- aktywny link w menu (scrollspy) ---------- */
  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- delikatne pojawianie się sekcji ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- FAQ: jedno otwarte naraz ---------- */
  $$('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) $$('.faq details').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- pływający przycisk kontaktu ---------- */
  var fab = $('#fab');
  var fabBtn = fab ? $('.fab__toggle', fab) : null;
  function setFab(open) {
    if (!fab) return;
    fab.classList.toggle('open', open);
    if (fabBtn) fabBtn.setAttribute('aria-expanded', String(open));
  }
  if (fabBtn) fabBtn.addEventListener('click', function (e) { e.stopPropagation(); setFab(!fab.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (fab && !fab.contains(e.target)) setFab(false); });

  /* =========================================================
     COOKIES / ZGODY
     ========================================================= */
  function readConsent() {
    try { var v = localStorage.getItem(CONSENT_KEY); if (v) return JSON.parse(v); } catch (e) { /* brak storage */ }
    var m = document.cookie.match(new RegExp('(?:^|; )' + CONSENT_KEY + '=([^;]*)'));
    if (m) { try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; } }
    return null;
  }
  function saveConsent(c) {
    c.date = new Date().toISOString();
    var s = JSON.stringify(c);
    try { localStorage.setItem(CONSENT_KEY, s); } catch (e) { /* ignore */ }
    try { document.cookie = CONSENT_KEY + '=' + encodeURIComponent(s) + '; max-age=' + 60 * 60 * 24 * 180 + '; path=/; SameSite=Lax'; } catch (e) { /* ignore */ }
  }

  var bar = $('#cookie-bar');
  var modal = $('#cookie-modal');
  var cookieForm = $('#cookie-form');

  function updateFabOffset() {
    if (bar && !bar.hidden && bar.classList.contains('show') && window.innerWidth < 640) {
      body.classList.add('has-cookie-bar');
      root.style.setProperty('--cookie-h', (bar.offsetHeight + 24) + 'px');
    } else {
      body.classList.remove('has-cookie-bar');
    }
  }
  function showBar() {
    if (!bar) return;
    bar.hidden = false;
    requestAnimationFrame(function () { bar.classList.add('show'); updateFabOffset(); });
  }
  function hideBar() {
    if (!bar) return;
    bar.classList.remove('show');
    updateFabOffset();
    setTimeout(function () { bar.hidden = true; }, 500);
  }
  window.addEventListener('resize', updateFabOffset);

  function applyConsent(c) {
    if (!c) return;
    if (c.functional) { loadMap(); loadInstagram(); }
    if (c.analytics) loadAnalytics();
  }
  function decide(c) { saveConsent(c); applyConsent(c); hideBar(); }

  $$('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () {
      var all = b.getAttribute('data-cookie') === 'all';
      decide({ necessary: true, functional: all, analytics: all });
    });
  });

  function openSettings() {
    if (!modal) return;
    var c = readConsent() || {};
    if (cookieForm) {
      cookieForm.functional.checked = !!c.functional;
      cookieForm.analytics.checked = !!c.analytics;
    }
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }
  $$('[data-cookie-settings]').forEach(function (b) { b.addEventListener('click', openSettings); });

  if (modal) {
    modal.addEventListener('close', function () {
      var v = modal.returnValue;
      if (v === 'all') decide({ necessary: true, functional: true, analytics: true });
      else if (v === 'save') decide({ necessary: true, functional: cookieForm.functional.checked, analytics: cookieForm.analytics.checked });
      modal.returnValue = '';
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
  }

  /* ---------- mapa ---------- */
  var mapLoaded = false;
  function loadMap() {
    var map = $('#map');
    if (!map || mapLoaded) return;
    mapLoaded = true;
    var f = document.createElement('iframe');
    f.src = CONFIG.MAP_SRC;
    f.title = 'Mapa dojazdu: Studio Ciała, ul. Jana Dekana 8, Leszno';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.addEventListener('load', function () { var ph = $('#map-ph'); if (ph) ph.remove(); });
    map.appendChild(f);
  }
  $$('[data-consent-map]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = readConsent() || { necessary: true, analytics: false };
      c.functional = true;
      decide(c);
    });
  });

  /* ---------- Instagram ---------- */
  var igLoaded = false;
  function loadInstagram() {
    if (igLoaded || !CONFIG.INSTAGRAM_WIDGET) return;
    igLoaded = true;
    var s = document.createElement('script');
    s.src = CONFIG.INSTAGRAM_WIDGET; s.async = true;
    document.body.appendChild(s);
  }

  /* ---------- Google Analytics ---------- */
  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded || !CONFIG.GA_ID) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.GA_ID, { anonymize_ip: true });
  }

  var existing = readConsent();
  if (existing) applyConsent(existing); else setTimeout(showBar, 700);

  /* =========================================================
     FORMULARZ KONTAKTOWY
     ========================================================= */
  var form = $('#contact-form');
  var status = $('#form-status');
  function setErr(input, msg) {
    var f = input.closest('.field');
    if (!f) return;
    f.classList.toggle('invalid', !!msg);
    var e = $('.err', f); if (e) e.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validContact(v) {
    var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    var phone = v.replace(/[\s\-()+]/g, '').replace(/^48/, '').length >= 9 && /^[\d\s\-()+]+$/.test(v);
    return email || phone;
  }
  function showStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form__status ' + (ok ? 'ok' : 'bad');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      var name = el.namedItem('name'), contact = el.namedItem('contact'), msg = el.namedItem('message'), consent = el.namedItem('consent');
      var ok = true;
      if (!name.value.trim()) { setErr(name, 'Podaj imię.'); ok = false; } else setErr(name, '');
      if (!validContact(contact.value.trim())) { setErr(contact, 'Podaj poprawny numer telefonu lub e-mail.'); ok = false; } else setErr(contact, '');
      if (msg.value.trim().length < 5) { setErr(msg, 'Napisz kilka słów, z czym przychodzisz.'); ok = false; } else setErr(msg, '');
      var chk = consent.closest('.check');
      if (!consent.checked) { chk.classList.add('invalid'); ok = false; } else chk.classList.remove('invalid');
      if (!ok) { showStatus('Uzupełnij zaznaczone pola.', false); var first = $('[aria-invalid="true"]', form) || consent; first.focus(); return; }
      if (el.namedItem('website').value) return; // honeypot – bot

      var data = { name: name.value.trim(), contact: contact.value.trim(), message: msg.value.trim() };
      var btn = $('button[type="submit"]', form);

      if (CONFIG.FORM_ENDPOINT) {
        btn.disabled = true;
        fetch(CONFIG.FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          showStatus('Dziękuję! Wiadomość wysłana. Odezwę się najszybciej, jak to możliwe.', true);
        }).catch(function () {
          showStatus('Nie udało się wysłać wiadomości. Zadzwoń: 530 111 836.', false);
        }).then(function () { btn.disabled = false; });
      } else {
        var subject = 'Wiadomość ze strony – ' + data.name;
        var bodyTxt = 'Imię: ' + data.name + '\nKontakt: ' + data.contact + '\n\n' + data.message;
        window.location.href = 'mailto:' + CONFIG.CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyTxt);
        showStatus('Otwieram Twój program pocztowy z gotową wiadomością. Jeśli się nie otworzył, zadzwoń: 530 111 836.', true);
      }
    });
    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { if (el.closest('.field')) setErr(el, ''); });
    });
  }
})();
