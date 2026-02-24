/* ============================================================
   KASAPOGLU – Frontend Application
   Navigation · Status · Assistant · Forms · UI
   ============================================================ */

/* --- Live Open/Closed Status --- */
function updateOpenStatus() {
  var badge = document.getElementById('status-badge');
  if (!badge || typeof SITE_CONFIG === 'undefined') return;

  var now = new Date();
  var day = now.getDay();
  var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  var info = SITE_CONFIG.hours[day];

  if (info && info.open && info.close && time >= info.open && time < info.close) {
    badge.className = 'status-badge open';
    badge.innerHTML = '<span class="status-dot"></span> Jetzt geöffnet';
  } else {
    badge.className = 'status-badge closed';
    badge.innerHTML = '<span class="status-dot"></span> Geschlossen';
  }
}

/* --- Active Link Highlighting --- */
function updateActiveLink(sectionId) {
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.classList.remove('active-link');
    var href = link.getAttribute('href');
    if (href === '#' + sectionId) {
      link.classList.add('active-link');
    }
  });
}

/* --- Section Navigation with Fade --- */
var _currentSection = 'start';
var _isTransitioning = false;

function showSection(sectionId, skipScroll) {
  if (_isTransitioning) return false;
  if (!document.getElementById(sectionId)) return false;

  // Scroll to top INSTANTLY before any visual change
  if (!skipScroll) {
    window.scrollTo(0, 0);
  }

  var current = document.querySelector('.page-section.active-section');
  var target = document.getElementById(sectionId);

  // If already showing this section, just ensure scroll is at top
  if (current === target) {
    updateActiveLink(sectionId);
    var navBottom = document.querySelector('.nav-bottom');
    if (navBottom) navBottom.classList.remove('open');
    return false;
  }

  _isTransitioning = true;

  // Fade out current section
  if (current) {
    current.classList.add('fade-out');
    setTimeout(function() {
      // Hide all sections
      document.querySelectorAll('.page-section').forEach(function(s) {
        s.classList.remove('active-section', 'fade-out');
        s.classList.add('hidden');
      });
      // Show target
      target.classList.remove('hidden');
      void target.offsetWidth;
      target.classList.add('active-section');
      _currentSection = sectionId;
      _isTransitioning = false;

      // Re-observe fade-up elements inside the new section
      reobserveFadeUps(target);
    }, 180); // matches fade-out duration
  } else {
    // No current section visible - just show target
    document.querySelectorAll('.page-section').forEach(function(s) {
      s.classList.remove('active-section');
      s.classList.add('hidden');
    });
    target.classList.remove('hidden');
    void target.offsetWidth;
    target.classList.add('active-section');
    _currentSection = sectionId;
    _isTransitioning = false;
  }

  updateActiveLink(sectionId);

  // Update hash without triggering hashchange
  if (history.replaceState) {
    history.replaceState(null, '', '#' + sectionId);
  }

  // Close mobile menu
  var navBottom = document.querySelector('.nav-bottom');
  if (navBottom) navBottom.classList.remove('open');

  return false;
}

/* --- Re-observe fade-up elements after section switch --- */
function reobserveFadeUps(container) {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  container.querySelectorAll('.fade-up:not(.visible)').forEach(function(el) {
    observer.observe(el);
  });
}

/* --- Nav Link Click Handler (with preventDefault) --- */
function handleNavClick(event, sectionId) {
  event.preventDefault();
  event.stopPropagation();
  showSection(sectionId);
  return false;
}

/* --- Hash-based routing --- */
function routeFromHash() {
  var hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    showSection(hash);
  }
}


/* --- Hamburger Menu Toggle --- */
function toggleMenu() {
  var navBottom = document.querySelector('.nav-bottom');
  if (navBottom) navBottom.classList.toggle('open');
}

/* --- Scroll Progress Bar --- */
function updateScrollProgress() {
  var bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  var scrollTop = window.scrollY;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  bar.style.width = percent + '%';
}

/* --- Ticker geometry: center start + seamless loop --- */
function setupTickerGeometry() {
  var bar = document.querySelector('.ticker-bar');
  var track = document.querySelector('.ticker-track');
  if (!bar || !track) return;

  var trackWidth = track.scrollWidth;
  var barWidth = bar.clientWidth;
  var startShift = Math.max(0, (trackWidth - barWidth) / 2);
  var loopDistance = trackWidth / 2;

  track.style.setProperty('--ticker-start', startShift + 'px');
  track.style.setProperty('--ticker-loop', loopDistance + 'px');

  // Reset animation phase after geometry updates so the ticker starts from the centered offset.
  // Without this, the old animation timeline can keep a stale translateX phase after resize.
  track.style.animation = 'none';
  void track.offsetWidth;
  track.style.animation = '';
}

/* --- Scroll to Top Button --- */
function initScrollTop() {
  var btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --- Captcha --- */
function refreshCaptcha() {
  var a = Math.floor(Math.random() * 9) + 1;
  var b = Math.floor(Math.random() * 9) + 1;
  var q = document.getElementById('captcha-question');
  var ans = document.getElementById('captcha-answer');
  var inp = document.getElementById('captcha-input');
  var err = document.getElementById('captcha-error');
  if (q) q.textContent = a + ' + ' + b + ' = ?';
  if (ans) ans.value = String(a + b);
  if (inp) inp.value = '';
  if (err) err.style.display = 'none';
}

/* --- Contact Form Submission --- */
function handleSubmit(event) {
  event.preventDefault();

  var captchaInput = document.getElementById('captcha-input');
  var captchaAnswer = document.getElementById('captcha-answer');
  var captchaError = document.getElementById('captcha-error');

  if (captchaInput && captchaAnswer && captchaInput.value.trim() !== captchaAnswer.value) {
    if (captchaError) captchaError.style.display = 'block';
    return false;
  }
  if (captchaError) captchaError.style.display = 'none';

  var form = document.getElementById('contact-form');
  var successBox = document.getElementById('success-msg');
  var errorBox = document.getElementById('form-errors');
  var formData = new FormData(form);
  var name = (formData.get('name') || '').toString().trim();
  var email = (formData.get('email') || '').toString().trim();
  var phone = (formData.get('phone') || '').toString().trim();
  var subject = (formData.get('subject') || '').toString().trim();
  var message = (formData.get('message') || '').toString().trim();
  var privacy = !!formData.get('privacy');
  var supabaseCfg = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.supabase) ? SITE_CONFIG.supabase : null;
  var hasSupabase = !!(supabaseCfg && supabaseCfg.url && supabaseCfg.anonKey);

  if (successBox) successBox.classList.remove('show');
  if (errorBox) { errorBox.style.display = 'none'; errorBox.innerHTML = ''; }

  var errors = [];
  if (name.length < 2) errors.push('Bitte geben Sie einen gültigen Namen ein.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
  if (!subject) errors.push('Bitte wählen Sie einen Betreff.');
  if (message.length < 10) errors.push('Bitte beschreiben Sie Ihr Anliegen genauer (mind. 10 Zeichen).');
  if (!privacy) errors.push('Bitte bestätigen Sie die Datenschutzerklärung.');
  if (errors.length) {
    if (errorBox) {
      errorBox.innerHTML = errors.map(function(m) { return '<div>' + m + '</div>'; }).join('');
      errorBox.style.display = 'block';
      errorBox.classList.add('show');
    }
    return false;
  }

  function showSuccess(note) {
    if (successBox) {
      successBox.innerHTML = '<strong>✓</strong> Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.' + (note ? '<br><strong>' + note + '</strong>' : '');
      successBox.classList.add('show');
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function() { successBox.classList.remove('show'); }, 8000);
    }
    form.reset();
    refreshCaptcha();
  }

  function showError(messages) {
    if (errorBox) {
      errorBox.innerHTML = messages.map(function(m) { return '<div>' + m + '</div>'; }).join('');
      errorBox.style.display = 'block';
      errorBox.classList.add('show');
    }
  }

  function submitViaLegacyApi() {
    fetch('/api/contact', { method: 'POST', body: formData })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(result) {
        if (!result.ok || !result.data.success) {
          var messages = (result.data.errors) || [result.data.message || 'Es ist ein Fehler aufgetreten.'];
          showError(messages);
          return;
        }
        showSuccess(result.data.ticket ? ('Referenznummer: ' + result.data.ticket) : '');
      })
      .catch(function() {
        showError(['Es ist ein Fehler beim Senden aufgetreten.']);
      });
  }

  if (!hasSupabase) {
    submitViaLegacyApi();
    return false;
  }

  var insertPayload = {
    name: name,
    email: email,
    phone: phone || null,
    subject: subject || null,
    message: message
  };

  fetch(supabaseCfg.url.replace(/\/$/, '') + '/rest/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseCfg.anonKey,
      'Authorization': 'Bearer ' + supabaseCfg.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(insertPayload)
  })
    .then(function(res) {
      return res.text().then(function(raw) {
        var parsed = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }
        return { ok: res.ok, status: res.status, data: parsed };
      });
    })
    .then(function(result) {
      if (result.ok) {
        showSuccess('Gespeichert in Supabase');
        return;
      }
      submitViaLegacyApi();
    })
    .catch(function() {
      submitViaLegacyApi();
    });

  return false;
}

/* --- Quick Inquiry (Hero) --- */
function submitQuickInquiry() {
  var sel = document.getElementById('quick-subject');
  if (sel && sel.value) {
    showSection('kontakt');
    setTimeout(function() {
      var subjectField = document.getElementById('subject');
      if (subjectField) subjectField.value = sel.value;
    }, 100);
  }
}

/* --- Key Type Assistant --- */
var assistantSteps = [
  {
    question: 'Welche Art von Schlüssel benötigen Sie?',
    options: [
      { text: 'Haustür / Wohnungstür', next: 1 },
      { text: 'Zimmertür / Möbelschloss', next: 2 },
      { text: 'Sicherheits- / Schließanlage', next: 3 },
      { text: 'Autoschlüssel', next: 4 }
    ]
  },
  {
    question: 'Hat Ihr Schlüssel runde Vertiefungen (Bohrmulden) auf der Oberfläche?',
    options: [
      { text: 'Ja, runde Mulden sichtbar', result: { type: 'Bohrmuldenschlüssel', hint: 'Bitte bringen Sie die Sicherungskarte mit, falls vorhanden.' } },
      { text: 'Nein, flaches Profil / Zacken', result: { type: 'Flachschlüssel', hint: 'Kann meist direkt vor Ort nachgefertigt werden.' } },
      { text: 'Bin mir nicht sicher', result: { type: 'Unklar – Prüfung vor Ort', hint: 'Kommen Sie vorbei, wir prüfen Ihren Schlüssel kostenlos.' } }
    ]
  },
  {
    question: 'Ist es ein einfacher Bartschlüssel (runder Schaft mit Bart am Ende)?',
    options: [
      { text: 'Ja, klassischer Bartschlüssel', result: { type: 'Buntbartschlüssel', hint: 'Ideal für Zimmertüren und ältere Schlösser. Bitte Schlüssel mitbringen.' } },
      { text: 'Nein, moderner / flacher Schlüssel', result: { type: 'Flachschlüssel', hint: 'Kann meist direkt vor Ort nachgefertigt werden.' } }
    ]
  },
  {
    question: 'Haben Sie eine Sicherungskarte für Ihre Schließanlage?',
    options: [
      { text: 'Ja, Sicherungskarte vorhanden', result: { type: 'Schließanlagen-Schlüssel', hint: 'Bitte bringen Sie die Sicherungskarte und einen Ausweis mit. Produktionszeit ca. 20–30 Min.' } },
      { text: 'Nein / Unsicher', result: { type: 'Schließanlagen-Schlüssel', hint: 'Ohne Sicherungskarte ist eine Nachfertigung nicht möglich. Bitte beim Verwalter nachfragen.' } }
    ]
  },
  {
    question: 'Autoschlüssel – Was wird benötigt?',
    options: [
      { text: 'Verstanden', result: { type: 'Autoschlüssel', hint: 'Bitte bringen Sie mit: Fahrzeugschein, vorhandenen Schlüssel, Ausweis. Wir prüfen die Machbarkeit vor Ort.' } }
    ]
  }
];

function openAssistant() {
  var overlay = document.getElementById('assistant-modal');
  if (overlay) {
    overlay.classList.add('show');
    renderAssistantStep(0);
  }
}

function closeAssistant() {
  var overlay = document.getElementById('assistant-modal');
  if (overlay) overlay.classList.remove('show');
}

function renderAssistantStep(stepIndex) {
  var container = document.getElementById('assistant-content');
  if (!container || !assistantSteps[stepIndex]) return;

  var step = assistantSteps[stepIndex];
  var html = '<div class="assistant-step">';
  html += '<p><strong>' + step.question + '</strong></p>';
  html += '<div class="assistant-options">';

  step.options.forEach(function(opt) {
    if (opt.next !== undefined) {
      html += '<button class="assistant-option" onclick="renderAssistantStep(' + opt.next + ')">' + opt.text + '</button>';
    } else if (opt.result) {
      html += '<button class="assistant-option" onclick="showAssistantResult(\'' +
        opt.result.type.replace(/'/g, "\\'") + '\', \'' +
        opt.result.hint.replace(/'/g, "\\'") + '\')">' + opt.text + '</button>';
    }
  });

  html += '</div></div>';
  container.innerHTML = html;
}

function showAssistantResult(type, hint) {
  var container = document.getElementById('assistant-content');
  if (!container) return;

  container.innerHTML =
    '<div class="assistant-result">' +
    '<h4>Wahrscheinlich: ' + type + '</h4>' +
    '<p>' + hint + '</p>' +
    '<div style="margin-top:1rem;">' +
    '<a href="#kontakt" class="btn btn-primary btn-sm" onclick="closeAssistant(); showSection(\'kontakt\'); return false;">Anfrage stellen</a>' +
    ' <button class="btn btn-outline btn-sm" onclick="renderAssistantStep(0);">Nochmal prüfen</button>' +
    '</div></div>';
}

/* --- FAQ Toggle --- */
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(function(el) {
    el.addEventListener('click', function() {
      this.closest('.faq-item').classList.toggle('open');
    });
  });
}

/* --- IntersectionObserver: Scroll Fade-In --- */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });

  /* fade-up: scroll reveal with stagger */
  var fadeUpObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, i * 80);
        fadeUpObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.fade-up').forEach(function(el) {
    fadeUpObserver.observe(el);
  });
}

/* --- Animated Stats Counter --- */
function initStatsCounter() {
  var banner = document.querySelector('.stats-banner');
  if (!banner || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var counted = false;
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(banner);
}

function animateCounters() {
  var items = [
    { selector: '[data-count="15"]', end: 15, suffix: '+', decimals: 0 },
    { selector: '[data-count="5000"]', end: 5000, suffix: '+', decimals: 0, format: true }
  ];

  items.forEach(function(item) {
    var el = document.querySelector(item.selector);
    if (!el) return;

    var start = 0;
    var duration = 1800;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // ease out cubic
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(start + (item.end - start) * ease);

      if (item.format) {
        el.textContent = current.toLocaleString('de-DE') + item.suffix;
      } else {
        el.textContent = current + item.suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });
}

/* --- Review Auto-Highlight --- */
function initReviewHighlight() {
  var cards = document.querySelectorAll('.review-card');
  if (cards.length === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var currentIndex = 0;
  setInterval(function() {
    cards.forEach(function(c) { c.classList.remove('highlight'); });
    cards[currentIndex].classList.add('highlight');
    currentIndex = (currentIndex + 1) % cards.length;
  }, 4000);
}

/* --- Cookie Consent Banner --- */
function initCookieBanner() {
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  var consent = localStorage.getItem('cookie-consent');
  if (!consent) {
    banner.style.display = 'block';
  }
}

function acceptCookies() {
  localStorage.setItem('cookie-consent', 'accepted');
  var banner = document.getElementById('cookie-banner');
  if (banner) banner.style.display = 'none';
}

function declineCookies() {
  localStorage.setItem('cookie-consent', 'declined');
  var banner = document.getElementById('cookie-banner');
  if (banner) banner.style.display = 'none';
}

/* --- Product Filter (Produkte-Seite) --- */
function filterProducts(category) {
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === category);
  });

  document.querySelectorAll('.product-card').forEach(function(card) {
    if (category === 'all' || card.getAttribute('data-category') === category) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/* --- Product Rendering (Produkte-Seite) --- */
function renderProducts() {
  if (typeof PRODUCTS === 'undefined') return;
  var grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.filter(function(p) {
    return p.visible !== false;
  }).map(function(p) {
    var bulletsHtml = (p.bullets || []).map(function(b) { return '<li>' + b + '</li>'; }).join('');
    return (
      '<article class="product-card" data-category="' + (p.category || 'standard') + '">' +
      '<img src="' + (p.image || '') + '" alt="' + (p.name || '') + '" loading="lazy">' +
      '<div class="content">' +
      '<h3>' + (p.name || '') + '</h3>' +
      '<p class="desc">' + (p.description || '') + '</p>' +
      (bulletsHtml ? '<ul>' + bulletsHtml + '</ul>' : '') +
      (p.hint ? '<p class="hint">' + p.hint + '</p>' : '') +
      '<a href="schluesselservice.html#kontakt" class="product-btn">Anfrage erstellen</a>' +
      '</div></article>'
    );
  }).join('');
}

/* --- Initialize --- */
document.addEventListener('DOMContentLoaded', function() {
  // Open/Closed Status
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  // Scroll events
  window.addEventListener('scroll', function() { updateScrollProgress(); });
  initScrollTop();

  // Captcha
  if (document.getElementById('captcha-question')) refreshCaptcha();

  // FAQ
  initFAQ();

  // Scroll animations
  initScrollAnimations();

  // Hash-based routing: check URL hash on load
  if (document.getElementById('start')) {
    var hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
      showSection(hash);
    } else {
      updateActiveLink('start');
    }
  }

  // Listen for hash changes (back/forward buttons)
  window.addEventListener('hashchange', function() {
    routeFromHash();
  });

  // Products page
  if (document.getElementById('product-grid')) {
    renderProducts();
    // Set active link for products page
    document.querySelectorAll('.nav-links a').forEach(function(link) {
      if (link.getAttribute('href') === 'produkte.html') {
        link.classList.add('active-link');
      }
    });
  }

  // Stats counter animation
  initStatsCounter();

  // Review auto-highlight
  initReviewHighlight();

  // Cookie consent
  initCookieBanner();

  // Center ticker start position and set seamless loop distance
  setupTickerGeometry();

  // Auto-update copyright year
  var yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Responsive: show nav on resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      var navBottom = document.querySelector('.nav-bottom');
      if (navBottom) navBottom.classList.remove('open');
    }
    setupTickerGeometry();
  });
});
