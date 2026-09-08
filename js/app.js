/**
 * Goldenplac - Frontend Logic
 * Conexión dinámica con GoldenStore, interactividad de calculadora,
 * slider antes/después, filtros de galería y envío de presupuestos.
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  renderCompanyInfo();
  renderTrustBadges();
  renderServices();
  renderProjects('all');
  renderTestimonials();
  renderBeforeAfterProjects();
  initBeforeAfterSlider();
  initFaqAccordion();
  initMobileMenu();
  updateCalculator();
  renderPublicCardVisit();

  // Suscribirse a cambios del Store (reactividad en tiempo real)
  window.GoldenStore.subscribe(() => {
    renderCompanyInfo();
    renderTrustBadges();
    renderServices();
    renderProjects(currentFilter);
    renderTestimonials();
    renderBeforeAfterProjects();
    updateCalculator();
    renderPublicCardVisit();
  });
}

let currentFilter = 'all';

/* 1. RENDERIZADO DE INFORMACIÓN GENERAL */
function renderCompanyInfo() {
  const company = window.GoldenStore.getCompany();

  // Top Bar
  const topAddress = document.getElementById('top-address');
  const topAddressLink = document.getElementById('top-address-link');
  const topSchedule = document.getElementById('top-schedule');
  const topPhone = document.getElementById('top-phone');
  const topPhoneLink = document.getElementById('top-phone-link');
  if (topAddress) topAddress.textContent = company.address;
  if (topAddressLink && company.googleMapsUrl) topAddressLink.href = company.googleMapsUrl;
  if (topSchedule) topSchedule.textContent = company.schedule;
  if (topPhone) topPhone.textContent = company.phone;
  if (topPhoneLink) topPhoneLink.href = `tel:${company.phoneRaw}`;

  // Hero Section
  const heroBadge = document.getElementById('hero-badge');
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  if (heroBadge) heroBadge.textContent = company.heroBadge;
  if (heroTitle) heroTitle.textContent = company.heroTitle;
  if (heroSubtitle) heroSubtitle.textContent = company.heroSubtitle;

  // WhatsApp Buttons
  const heroWhatsapp = document.getElementById('hero-whatsapp-btn');
  const floatingWhatsapp = document.getElementById('floatingWhatsapp');
  const mobileBarCall = document.getElementById('mobileBarCall');
  const mobileBarWa = document.getElementById('mobileBarWa');
  const waUrl = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent('Hola ' + company.name + ', quisiera pedir presupuesto para un trabajo de pladur o reforma.')}`;
  if (heroWhatsapp) heroWhatsapp.href = waUrl;
  if (floatingWhatsapp) floatingWhatsapp.href = waUrl;
  if (mobileBarCall) mobileBarCall.href = `tel:${company.phoneRaw}`;
  if (mobileBarWa) mobileBarWa.href = waUrl;

  // Footer
  const footerSlogan = document.getElementById('footer-slogan');
  const footerAddress = document.getElementById('footer-address');
  const footerPhone = document.getElementById('footer-phone');
  const footerEmail = document.getElementById('footer-email');
  if (footerSlogan) footerSlogan.textContent = company.slogan;
  if (footerAddress) {
    footerAddress.textContent = company.address;
    if (footerAddress.tagName === 'A' && company.googleMapsUrl) {
      footerAddress.href = company.googleMapsUrl;
    }
  }
  if (footerPhone) {
    footerPhone.textContent = company.phone;
    footerPhone.href = `tel:${company.phoneRaw}`;
  }
  if (footerEmail) {
    footerEmail.textContent = company.email;
    footerEmail.href = `mailto:${company.email}`;
  }

  // Google Maps and Review Links
  if (company.googleMapsUrl) {
    document.querySelectorAll('.hero-google-pill, .btn-gr-view, .btn-gr-write, #footerGoogleMapsLink, #mapClickOverlay, .location-card-footer a').forEach(el => {
      if (el) el.href = company.googleMapsUrl;
    });
  }
}

/* 2. TRUST BADGES */
function renderTrustBadges() {
  const company = window.GoldenStore.getCompany();
  const list = document.getElementById('trustBadgesList');
  if (!list || !company.trustBadges) return;

  list.innerHTML = company.trustBadges.map(badge => `
    <li class="trust-pill-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHTML(badge)}</span>
    </li>
  `).join('');
}

/* 3. SERVICIOS */
function renderServices() {
  const services = window.GoldenStore.getServices();
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  grid.innerHTML = services.map(s => `
    <div class="service-card">
      <div class="service-card-media">
        <img src="${escapeHTML(s.image)}" alt="${escapeHTML(s.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/techos-led.jpg';">
        ${s.tag ? `<span class="service-badge">${escapeHTML(s.tag)}</span>` : ''}
      </div>
      <div class="service-card-body">
        <h3 class="service-card-title">${escapeHTML(s.title)}</h3>
        <p class="service-card-desc">${escapeHTML(s.description)}</p>
        
        <ul class="service-features-list">
          ${(s.features || []).map(f => `
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${escapeHTML(f)}</span>
            </li>
          `).join('')}
        </ul>

        <div class="service-card-footer">
          <span class="service-price-pill">${escapeHTML(s.priceEstimate || 'Precio a consultar')}</span>
          <button class="service-cta-btn" onclick="openQuoteForService('${escapeHTML(s.title)}')">
            <span>Pedir presupuesto</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* 4. PROYECTOS / GALERÍA CON FILTROS & LIGHTBOX */
let activeLightboxIndex = 0;
let currentFilteredProjects = [];
let isGalleryExpanded = false;

function getInitialProjectLimit() {
  return window.innerWidth <= 768 ? 4 : 6;
}

function renderProjects(filterCategory = 'all', resetExpand = true) {
  currentFilter = filterCategory;
  if (resetExpand) {
    isGalleryExpanded = false;
  }

  const projects = window.GoldenStore.getProjects();
  const grid = document.getElementById('galleryGrid');
  const loadMoreWrap = document.getElementById('galleryLoadMoreWrap');
  const loadMoreText = document.getElementById('loadMoreText');
  const loadMoreIcon = document.getElementById('loadMoreIcon');
  if (!grid) return;

  const filtered = filterCategory === 'all' 
    ? projects 
    : projects.filter(p => (p.category || '').toLowerCase() === filterCategory.toLowerCase());

  currentFilteredProjects = filtered;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No hay proyectos en esta categoría por el momento.</div>`;
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    return;
  }

  const limit = getInitialProjectLimit();
  const shouldLimit = !isGalleryExpanded && filtered.length > limit;
  const visibleProjects = shouldLimit ? filtered.slice(0, limit) : filtered;

  grid.innerHTML = visibleProjects.map((p, idx) => `
    <div class="project-card" onclick="openGalleryLightbox(${idx})" title="Haz clic para ampliar">
      <div class="project-media-wrap">
        <img src="${escapeHTML(p.image || p.afterImage)}" alt="${escapeHTML(p.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/hero-bg.jpg';">
        <span class="project-category-tag">${escapeHTML(p.category || 'Obra')}</span>
        <div class="project-zoom-badge" title="Ampliar imagen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </div>
      </div>
      <div class="project-body">
        <h3 class="project-title">${escapeHTML(p.title)}</h3>
        <div class="project-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>${escapeHTML(p.location || 'Comunidad de Madrid')}</span>
        </div>
        <p class="project-desc">${escapeHTML(p.description || '')}</p>
        <div class="project-footer">
          <span>Tiempo: ${escapeHTML(p.duration || '3 días')}</span>
          <span style="color: var(--gold-400); font-weight: 600; display: flex; align-items: center; gap: 0.3rem; cursor: pointer;" onclick="event.stopPropagation(); openGalleryLightbox(${idx});" title="Ver foto en detalle">
            <span>Ver foto</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Handle Load More button
  if (loadMoreWrap) {
    if (filtered.length <= limit) {
      loadMoreWrap.style.display = 'none';
    } else {
      loadMoreWrap.style.display = 'flex';
      if (!isGalleryExpanded) {
        const remaining = filtered.length - limit;
        if (loadMoreText) loadMoreText.textContent = `Ver más trabajos (+${remaining})`;
        if (loadMoreIcon) loadMoreIcon.style.transform = 'rotate(0deg)';
      } else {
        if (loadMoreText) loadMoreText.textContent = 'Ver menos trabajos';
        if (loadMoreIcon) loadMoreIcon.style.transform = 'rotate(180deg)';
      }
    }
  }

  // Actualizar botones de filtro
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterCategory);
  });
}

function toggleLoadMoreProjects() {
  isGalleryExpanded = !isGalleryExpanded;
  renderProjects(currentFilter, false);

  if (!isGalleryExpanded) {
    const gallerySection = document.getElementById('proyectos');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// Lightbox modal logic
function openGalleryLightbox(index) {
  if (!currentFilteredProjects || currentFilteredProjects.length === 0) {
    currentFilteredProjects = (window.GoldenStore && typeof window.GoldenStore.getProjects === 'function') 
      ? window.GoldenStore.getProjects() 
      : [];
  }
  if (!currentFilteredProjects || currentFilteredProjects.length === 0) return;
  activeLightboxIndex = (index >= 0 && index < currentFilteredProjects.length) ? index : 0;
  updateLightboxContent();
  const lightbox = document.getElementById('galleryLightbox');
  if (lightbox) {
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function navigateLightbox(direction) {
  if (!currentFilteredProjects || currentFilteredProjects.length === 0) return;
  activeLightboxIndex += direction;
  if (activeLightboxIndex < 0) {
    activeLightboxIndex = currentFilteredProjects.length - 1;
  } else if (activeLightboxIndex >= currentFilteredProjects.length) {
    activeLightboxIndex = 0;
  }
  updateLightboxContent();
}

function updateLightboxContent() {
  const p = currentFilteredProjects[activeLightboxIndex];
  if (!p) return;

  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lightboxTitle');
  const category = document.getElementById('lightboxCategory');
  const locText = document.getElementById('lightboxLocationText');
  const desc = document.getElementById('lightboxDesc');
  const duration = document.getElementById('lightboxDuration');

  if (img) {
    img.src = p.image || p.afterImage;
    img.alt = p.title || 'Obra Pladur';
  }
  if (title) title.textContent = p.title || '';
  if (category) category.textContent = p.category || 'Obra';
  if (locText) locText.textContent = p.location || 'Comunidad de Madrid';
  if (desc) desc.textContent = p.description || '';
  if (duration) duration.textContent = `Tiempo: ${p.duration || '3 días'}`;
}

function handleLightboxBackdropClick(e) {
  if (e.target.id === 'galleryLightbox') {
    closeGalleryLightbox();
  }
}

// Teclado para navegación de Lightbox
document.addEventListener('keydown', e => {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox || !lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeGalleryLightbox();
  if (e.key === 'ArrowRight') navigateLightbox(1);
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
});

// Event Listeners para los filtros
document.addEventListener('click', e => {
  if (e.target.classList.contains('filter-btn')) {
    const filter = e.target.dataset.filter;
    renderProjects(filter);
  }
});

/* 5. TESTIMONIOS */
function renderTestimonials() {
  const testimonials = window.GoldenStore.getTestimonials();
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  const avatarGradients = [
    'linear-gradient(135deg, #d4af37, #996515)',
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #10b981, #047857)',
    'linear-gradient(135deg, #ec4899, #9d174d)',
    'linear-gradient(135deg, #f59e0b, #b45309)',
    'linear-gradient(135deg, #8b5cf6, #5b21b6)'
  ];

  grid.innerHTML = testimonials.map((t, idx) => {
    const stars = Array(t.rating || 5).fill(`
      <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    `).join('');

    const initial = (t.name || 'C')[0].toUpperCase();
    const gradient = avatarGradients[idx % avatarGradients.length];
    const avatarUrl = t.avatar || '';

    return `
      <div class="testimonial-card">
        <div class="testimonial-card-top">
          <div class="stars-rating">${stars}</div>
          <div class="google-verified-pill" title="Reseña verificada en Google Maps">
            <svg viewBox="0 0 24 24" width="13" height="13">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google</span>
          </div>
        </div>

        <p class="testimonial-text">"${escapeHTML(t.comment)}"</p>

        <div class="testimonial-author">
          <div class="author-avatar" style="background: ${gradient};">
            ${avatarUrl ? `
              <img src="${avatarUrl}" alt="${escapeHTML(t.name)}" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : ''}
            <span class="avatar-fallback" style="${avatarUrl ? 'display:none;' : 'display:flex;'}">${initial}</span>
          </div>
          <div class="author-info">
            <div class="author-name-row">
              <h4>${escapeHTML(t.name)}</h4>
              <span class="verified-badge-icon" title="Cliente verificado">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </span>
            </div>
            <div class="author-meta-row">
              <span class="author-location">${escapeHTML(t.location)}</span>
              <span class="author-bullet">•</span>
              <span class="author-service">${escapeHTML(t.service || 'Instalación de Pladur')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* 6. SLIDER ANTES / DESPUÉS (Luxury GPU Accelerated with Real Work Photos & Mobile Touch Protection) */
function initBeforeAfterSlider() {
  const container = document.getElementById('baContainer');
  const range = document.getElementById('baRange');
  const handle = document.getElementById('baHandle');
  const beforeImg = document.getElementById('baBeforeImg');
  const afterImg = document.getElementById('baAfterImg');
  const caption = document.getElementById('baCaption');
  const projectTabs = document.getElementById('baProjectTabs');
  const quickBtns = document.querySelectorAll('.ba-quick-btn');

  if (!container) return;

  let rafId = null;
  let animRafId = null;
  let currentVal = 50;

  function updateSlider(val, updateInput = true) {
    const clamped = Math.max(0, Math.min(100, val));
    currentVal = clamped;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      container.style.setProperty('--ba-pos', `${clamped}%`);
      if (handle) {
        handle.setAttribute('aria-valuenow', Math.round(clamped));
      }
      if (updateInput && range && Number(range.value) !== Math.round(clamped)) {
        range.value = clamped;
      }
      // Update quick buttons active state
      quickBtns.forEach(btn => {
        const btnVal = parseFloat(btn.dataset.val);
        if (Math.abs(btnVal - clamped) < 2) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  // Smooth animation for quick buttons
  function animateSliderTo(targetVal, duration = 320) {
    if (animRafId) cancelAnimationFrame(animRafId);
    const startVal = currentVal;
    const change = targetVal - startVal;
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);
      updateSlider(startVal + change * easedProgress);

      if (progress < 1) {
        animRafId = requestAnimationFrame(step);
      }
    }
    animRafId = requestAnimationFrame(step);
  }

  // Quick action buttons (0%, 50%, 100%)
  quickBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = parseFloat(btn.dataset.val);
      animateSliderTo(val);
    });
  });

  // Render Projects Tabs Dynamically from Store
  renderBeforeAfterProjects();

  // Native range input listener (for keyboard/accessibility fallback)
  if (range) {
    range.addEventListener('input', (e) => {
      if (animRafId) cancelAnimationFrame(animRafId);
      updateSlider(parseFloat(e.target.value));
    }, { passive: true });
  }

  // Keyboard navigation on handle
  if (handle) {
    handle.addEventListener('keydown', (e) => {
      if (animRafId) cancelAnimationFrame(animRafId);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        updateSlider(currentVal - 5);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        updateSlider(currentVal + 5);
      } else if (e.key === 'Home') {
        e.preventDefault();
        updateSlider(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        updateSlider(100);
      }
    });
  }

  // Mouse Dragging & Container Click
  let isMouseDragging = false;

  function calcPercentFromEvent(e) {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return 50;
    const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    return (offsetX / rect.width) * 100;
  }

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('a, button, .ba-badge')) return;
    if (animRafId) cancelAnimationFrame(animRafId);
    isMouseDragging = true;
    container.classList.add('is-dragging');
    updateSlider(calcPercentFromEvent(e));
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    updateSlider(calcPercentFromEvent(e));
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDragging) {
      isMouseDragging = false;
      container.classList.remove('is-dragging');
    }
  });

  // Touch Gesture Handling: Never hijack vertical page scroll!
  let touchStartX = 0;
  let touchStartY = 0;
  let isSlidingHorizontally = false;
  let touchDecided = false;

  container.addEventListener('touchstart', (e) => {
    if (e.target.closest('a, button, .ba-badge')) return;
    if (animRafId) cancelAnimationFrame(animRafId);
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSlidingHorizontally = false;
    touchDecided = false;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    if (!touchDecided) {
      // Determine if the user is scrolling the page vertically or swiping the slider horizontally
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        touchDecided = true;
        if (Math.abs(diffX) >= Math.abs(diffY)) {
          isSlidingHorizontally = true;
          container.classList.add('is-dragging');
        } else {
          isSlidingHorizontally = false;
        }
      }
    }

    if (isSlidingHorizontally) {
      // Prevent vertical page scroll only during active horizontal slider drag
      if (e.cancelable) e.preventDefault();
      updateSlider(calcPercentFromEvent(e));
    }
  }, { passive: false });

  function endTouch() {
    isSlidingHorizontally = false;
    touchDecided = false;
    container.classList.remove('is-dragging');
  }

  container.addEventListener('touchend', endTouch, { passive: true });
  container.addEventListener('touchcancel', endTouch, { passive: true });

  // Initialize at 50%
  updateSlider(50);
}

function renderBeforeAfterProjects() {
  const container = document.getElementById('baContainer');
  const projectTabs = document.getElementById('baProjectTabs');
  const beforeImg = document.getElementById('baBeforeImg');
  const afterImg = document.getElementById('baAfterImg');
  const caption = document.getElementById('baCaption');
  if (!projectTabs || !window.GoldenStore) return;

  const items = window.GoldenStore.getBeforeAfter();
  if (!items || !items.length) return;

  const getIcon = (cat) => {
    switch((cat || '').toLowerCase()) {
      case 'techos':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      case 'locales':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`;
    }
  };

  const currentActiveBtn = projectTabs.querySelector('.ba-tab-btn.active');
  const activeId = currentActiveBtn ? currentActiveBtn.dataset.id : null;

  projectTabs.innerHTML = items.map((item, idx) => {
    const isActive = activeId ? (String(item.id) === String(activeId)) : (idx === 0);
    return `
      <button type="button" class="ba-tab-btn ${isActive ? 'active' : ''}" role="tab" aria-selected="${isActive ? 'true' : 'false'}" 
        data-id="${item.id}"
        data-before="${escapeHTML(item.beforeImage)}" 
        data-after="${escapeHTML(item.afterImage)}" 
        data-caption="${escapeHTML(item.caption || item.title)}">
        ${getIcon(item.category)}
        <span>${escapeHTML(item.title)}</span>
      </button>
    `;
  }).join('');

  const activeItem = items.find(i => String(i.id) === String(activeId)) || items[0];
  if (activeItem) {
    if (beforeImg && activeItem.beforeImage) beforeImg.src = activeItem.beforeImage;
    if (afterImg && activeItem.afterImage) afterImg.src = activeItem.afterImage;
    if (caption && activeItem.caption) caption.textContent = activeItem.caption;
  }

  const tabBtns = projectTabs.querySelectorAll('.ba-tab-btn');
  tabBtns.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      if (tab.classList.contains('active')) return;

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const newBefore = tab.dataset.before;
      const newAfter = tab.dataset.after;
      const newCaption = tab.dataset.caption;

      if (container) {
        const layers = container.querySelectorAll('.ba-image-layer');
        layers.forEach(layer => layer.classList.add('fade-switch'));

        setTimeout(() => {
          if (beforeImg && newBefore) beforeImg.src = newBefore;
          if (afterImg && newAfter) afterImg.src = newAfter;
          if (caption && newCaption) caption.textContent = newCaption;
          layers.forEach(layer => layer.classList.remove('fade-switch'));
        }, 180);
      }
    });
  });
}

/* 7. CALCULADORA DE PRESUPUESTO */
function updateCalculator() {
  const serviceSelect = document.getElementById('calcService');
  const rangeInput = document.getElementById('calcM2Range');
  const m2Display = document.getElementById('calcM2Display');
  const priceResult = document.getElementById('calcPriceResult');
  const breakdownM2 = document.getElementById('calcBreakdownM2');
  const breakdownTime = document.getElementById('calcBreakdownTime');

  if (!serviceSelect || !rangeInput) return;

  const m2 = parseInt(rangeInput.value, 10);
  m2Display.textContent = `${m2} m²`;
  breakdownM2.textContent = `${m2} m²`;

  const service = serviceSelect.value;
  const settings = window.GoldenStore.getSettings();
  const pricing = settings.calculatorPricing || {};
  const baseRate = pricing[service]?.base || 34;

  let unitRate = baseRate;

  // Opciones extras
  const conAislante = document.getElementById('calcAislante')?.checked;
  const conLed = document.getElementById('calcLed')?.checked;
  const conPintura = document.getElementById('calcPintura')?.checked;
  const conEscombros = document.getElementById('calcEscombros')?.checked;

  if (conAislante) unitRate += 8;
  if (conLed) unitRate += 10;
  if (conPintura) unitRate += 9;
  if (conEscombros) unitRate += 4;

  const total = Math.round(m2 * unitRate);
  priceResult.innerHTML = `${total.toLocaleString('es-ES')} € <span>aprox.</span>`;

  // Tiempo estimado
  let days = '1 - 2 días';
  if (m2 > 100) days = '5 - 8 días';
  else if (m2 > 50) days = '3 - 4 días';
  else if (m2 > 30) days = '2 - 3 días';
  if (breakdownTime) breakdownTime.textContent = days;
}

function sendCalculatedQuote() {
  const serviceName = document.getElementById('calcService').options[document.getElementById('calcService').selectedIndex].text;
  const m2 = document.getElementById('calcM2Range').value;
  const price = document.getElementById('calcPriceResult').textContent.trim();

  openQuoteModal();
  document.getElementById('modalService').value = 'Falsos Techos y Foseados LED';
  document.getElementById('modalMessage').value = `Solicitud de presupuesto de la calculadora: ${serviceName}, aprox. ${m2} m² (estimación aprox. ${price}).`;
}

function sendCalculatedQuoteWhatsApp() {
  const company = window.GoldenStore.getCompany();
  const serviceName = document.getElementById('calcService').options[document.getElementById('calcService').selectedIndex].text;
  const m2 = document.getElementById('calcM2Range').value;
  const price = document.getElementById('calcPriceResult').textContent.trim();

  const msg = `Hola ${company.name}, he realizado una estimación en vuestra web para *${serviceName}* de *${m2} m²* con un cálculo de aprox. *${price}*. Me gustaría concertar una visita técnica para cerrar el presupuesto exacto.`;
  window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* 8. FAQ ACCORDION */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* 9. MODAL DE PRESUPUESTO */
function openQuoteModal() {
  const modal = document.getElementById('quoteModal');
  if (modal) modal.classList.add('active');
}

function closeQuoteModal() {
  const modal = document.getElementById('quoteModal');
  if (modal) modal.classList.remove('active');
}

function openQuoteForService(serviceTitle) {
  openQuoteModal();
  const modalMsg = document.getElementById('modalMessage');
  if (modalMsg) {
    modalMsg.value = `Interesado en presupuesto para: ${serviceTitle}.`;
  }
}

function handleQuoteSubmit(e) {
  e.preventDefault();

  // 1. Verificación Honeypot Anti-Bot
  const honeypot = document.getElementById('hpCompanyTrap');
  if (honeypot && honeypot.value.trim().length > 0) {
    // Es un bot automático: cerramos silenciosamente sin procesar
    closeQuoteModal();
    document.getElementById('quoteForm').reset();
    showToast('¡Gracias! Tu solicitud ha sido procesada.');
    return;
  }

  // 2. Control de Tasa / Rate Limiting (Mínimo 30 segundos entre solicitudes consecutivas)
  const RATE_KEY = 'goldenplac_last_lead_time';
  const lastTime = parseInt(localStorage.getItem(RATE_KEY) || '0', 10);
  const now = Date.now();
  if (now - lastTime < 30000) {
    const waitSecs = Math.ceil((30000 - (now - lastTime)) / 1000);
    showToast(`Por favor espera ${waitSecs} segundos antes de enviar otra solicitud.`);
    return;
  }

  // 3. Sanitización y validación estricta de entradas (Prevención XSS)
  const sanitize = (str) => (str || '').replace(/[<>]/g, '').trim();
  const name = sanitize(document.getElementById('modalName').value).slice(0, 80);
  const phone = sanitize(document.getElementById('modalPhone').value).slice(0, 25);
  const email = sanitize(document.getElementById('modalEmail').value).slice(0, 80);
  const service = sanitize(document.getElementById('modalService').value).slice(0, 70);
  const zone = sanitize(document.getElementById('modalZone').value).slice(0, 60);
  const message = sanitize(document.getElementById('modalMessage').value).slice(0, 800);

  if (!name || name.length < 2) {
    showToast('Por favor introduce tu nombre completo.');
    return;
  }

  // Validación de teléfono (debe contener al menos 9 dígitos)
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 9) {
    showToast('Por favor introduce un teléfono de contacto válido (mínimo 9 dígitos).');
    return;
  }

  // Guardar marca temporal de envío
  localStorage.setItem(RATE_KEY, now.toString());

  // Guardar en GoldenStore
  window.GoldenStore.addLead({
    name,
    phone,
    email,
    service,
    zone,
    message
  });

  closeQuoteModal();
  document.getElementById('quoteForm').reset();

  showToast(`¡Gracias ${name}! Hemos recibido tu solicitud. Te contactaremos en menos de 24h.`);

  // Preguntar si quiere abrir WhatsApp
  const company = window.GoldenStore.getCompany();
  const confirmWa = confirm('¿Deseas enviar también los detalles por WhatsApp directamente a nuestro técnico?');
  if (confirmWa) {
    const waText = `Hola ${company.name}, soy ${name}. He enviado una solicitud en la web para ${service} en ${zone || 'Madrid'}. Teléfono: ${phone}. Mensaje: ${message}`;
    window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  }
}

/* 10. MENÚ MÓVIL */
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if (btn && links) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = links.classList.toggle('mobile-open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    links.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        links.classList.remove('mobile-open');
        document.body.style.overflow = '';
      });
    });

    // Cerrar al pulsar fuera del menú
    document.addEventListener('click', (e) => {
      if (!links.contains(e.target) && !btn.contains(e.target)) {
        if (links.classList.contains('mobile-open')) {
          links.classList.remove('mobile-open');
          document.body.style.overflow = '';
        }
      }
    });
  }
}

/* 11. TOAST NOTIFICATIONS */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-120%)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Exponer funciones globales a window para compatibilidad inline onclick y llamadas externas
window.openQuoteModal = openQuoteModal;
window.closeQuoteModal = closeQuoteModal;
window.openQuoteForService = openQuoteForService;
window.handleQuoteSubmit = handleQuoteSubmit;
window.openGalleryLightbox = openGalleryLightbox;
window.closeGalleryLightbox = closeGalleryLightbox;
window.navigateLightbox = navigateLightbox;
window.handleLightboxBackdropClick = handleLightboxBackdropClick;
window.renderProjects = renderProjects;
window.toggleLoadMoreProjects = toggleLoadMoreProjects;

/* 12. TARJETA DE VISITA DIGITAL (PÚBLICA & SINCRONIZADA) */
function renderPublicCardVisit() {
  const frontImg = document.getElementById('publicCardFrontImg');
  const pubBackBrand = document.getElementById('pubBackBrand');
  const pubBackSubtitle = document.getElementById('pubBackSubtitle');
  const pubBackLocation = document.getElementById('pubBackLocation');
  const pubBackPhone = document.getElementById('pubBackPhone');
  const pubBackPhoneLink = document.getElementById('pubBackPhoneLink');
  const pubBackEmail = document.getElementById('pubBackEmail');
  const pubBackEmailLink = document.getElementById('pubBackEmailLink');
  const pubBackWebsite = document.getElementById('pubBackWebsite');
  const pubBackWebLink = document.getElementById('pubBackWebLink');
  const pubBackAddress = document.getElementById('pubBackAddress');
  const pubBackServicesWrap = document.getElementById('pubBackServicesWrap');
  const pubBackGuarantee = document.getElementById('pubBackGuarantee');
  const pubBackQrImg = document.getElementById('pubBackQrImg');
  const pubBackQrCaption = document.getElementById('pubBackQrCaption');
  const cardBackBox = document.getElementById('publicCardBack');

  let cardSettings = null;
  try {
    const raw = localStorage.getItem('goldenplac_card_visit_settings');
    if (raw) cardSettings = JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading card settings', e);
  }

  const company = window.GoldenStore ? window.GoldenStore.getCompany() : {};

  // Cara 1 - Frontal
  if (frontImg) {
    if (cardSettings && cardSettings.frontImgSrc) {
      frontImg.src = cardSettings.frontImgSrc;
      const scale = cardSettings.frontScale || '100';
      const posX = cardSettings.frontPosX || '50';
      const posY = cardSettings.frontPosY || '50';
      const fit = cardSettings.frontFit || 'cover';
      frontImg.style.transform = `scale(${scale / 100})`;
      frontImg.style.objectPosition = `${posX}% ${posY}%`;
      frontImg.style.objectFit = fit;
    } else {
      frontImg.src = 'assets/images/tarjeta-frontal-gold.jpg';
      frontImg.style.transform = 'scale(1)';
      frontImg.style.objectPosition = 'center';
      frontImg.style.objectFit = 'cover';
    }
  }

  // Cara 2 - Trasera
  const brandName = (cardSettings && cardSettings.name) || company.name || 'GOLDENPLAC';
  const subtitle = (cardSettings && cardSettings.subtitle) || 'REFORMAS E INSTALACIÓN';
  const location = (cardSettings && cardSettings.location) || 'MADRID';
  const phone = (cardSettings && cardSettings.phone) || company.phone || '+34 634 28 34 51';
  const email = (cardSettings && cardSettings.email) || company.email || 'goldenplac85@gmail.com';
  const website = (cardSettings && cardSettings.website) || 'www.goldenplac.es';
  let address = (cardSettings && cardSettings.address) || company.address || 'C/ de Humera, 14 • Fuenlabrada';
  if (address.length > 32 && address.toLowerCase().includes('fuenlabrada')) {
    address = 'C/ de Humera, 14 • Fuenlabrada';
  }
  const guarantee = (cardSettings && cardSettings.guarantee) || 'Garantía por escrito';
  const qrCaption = (cardSettings && cardSettings.qrCaption) || 'Escanear WhatsApp';
  const services = (cardSettings && cardSettings.services) || 'Pladur • Insonorización • Falsos Techos LED • Muebles TV';

  if (pubBackBrand) pubBackBrand.textContent = brandName;
  if (pubBackSubtitle) pubBackSubtitle.textContent = subtitle;
  if (pubBackLocation) pubBackLocation.textContent = location;
  if (pubBackPhone) pubBackPhone.textContent = phone;
  if (pubBackPhoneLink) pubBackPhoneLink.href = `tel:${phone.replace(/\s+/g, '')}`;
  if (pubBackEmail) pubBackEmail.textContent = email;
  if (pubBackEmailLink) pubBackEmailLink.href = `mailto:${email}`;
  if (pubBackWebsite) pubBackWebsite.textContent = website;
  if (pubBackWebLink) pubBackWebLink.href = website.startsWith('http') ? website : `https://${website}`;
  if (pubBackAddress) pubBackAddress.innerHTML = escapeHTML(address).replace(/•/g, '&bull;');
  if (pubBackGuarantee) pubBackGuarantee.textContent = guarantee;
  if (pubBackQrCaption) pubBackQrCaption.textContent = qrCaption;

  if (pubBackServicesWrap && services) {
    const parts = services.split('•').map(s => s.trim()).filter(Boolean);
    pubBackServicesWrap.innerHTML = parts.map((part, idx) => `
      <span style="white-space: nowrap;">${escapeHTML(part)}</span>
      ${idx < parts.length - 1 ? '<span class="sep">&bull;</span>' : ''}
    `).join(' ');
  }

  // Background style if customized
  if (cardSettings && cardSettings.cardBg && cardBackBox) {
    let bgStyle = 'linear-gradient(145deg, #0b1424 0%, #050a13 100%)';
    if (cardSettings.cardBg === 'solid-black') bgStyle = '#050505';
    else if (cardSettings.cardBg === 'dark-slate') bgStyle = 'linear-gradient(145deg, #152232 0%, #080c13 100%)';
    cardBackBox.style.background = bgStyle;
  }

  // QR Code
  if (pubBackQrImg) {
    let qrTarget = `https://wa.me/34634283451?text=Hola%20Goldenplac,%20contacto%20desde%20la%20tarjeta`;
    if (cardSettings) {
      if (cardSettings.qrType === 'phone') {
        qrTarget = `tel:${(cardSettings.phone || phone).replace(/\s+/g, '')}`;
      } else if (cardSettings.qrType === 'web') {
        qrTarget = cardSettings.website ? (cardSettings.website.startsWith('http') ? cardSettings.website : `https://${cardSettings.website}`) : 'https://www.goldenplac.es';
      } else if (cardSettings.qrType === 'maps') {
        qrTarget = 'https://maps.google.com/?q=Calle+de+Humera+14+Fuenlabrada+Madrid';
      } else if (cardSettings.qrType === 'custom' && cardSettings.customQrUrl) {
        qrTarget = cardSettings.customQrUrl;
      }
    }
    pubBackQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrTarget)}`;
  }
}

/* Guardar contacto (.vcf vCard 3.0) directamente al teléfono */
function downloadGoldenplacVCard() {
  const vcard = 
`BEGIN:VCARD
VERSION:3.0
N:Goldenplac;SL;;;
FN:Goldenplac SL - Pladur y Reformas Madrid
ORG:Goldenplac SL;Pladur y Reformas
TITLE:Especialistas en Pladur y Reformas
TEL;TYPE=CELL,VOICE,PREF:+34634283451
EMAIL;TYPE=WORK,INTERNET:goldenplac85@gmail.com
URL:https://www.goldenplac.es
ADR;TYPE=WORK:;;C/ de Humera, 14;Fuenlabrada;Madrid;28944;España
NOTE:Goldenplac SL • Especialistas en techos continuos y desmontables, tabiquería y trasdosados pladur, iluminación indirecta LED, insonorización certificada y reformas integrales en Madrid. CIF: B21844873.
END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Goldenplac-SL-Contacto.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast('¡Contacto descargado! Ábrelo en tu teléfono para guardarlo en tu agenda.');
}

/* Compartir tarjeta en WhatsApp / Redes Sociales */
function shareGoldenplacCard() {
  const shareTitle = 'Goldenplac SL - Tarjeta de Visita Profesional';
  const shareUrl = window.location.href.split('#')[0] + '#tarjeta';

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    }).catch(err => {
      if (err.name !== 'AbortError') {
        openWhatsAppCardShare(shareText, shareUrl);
      }
    });
  } else {
    openWhatsAppCardShare(shareText, shareUrl);
  }
}

function openWhatsAppCardShare(text, url) {
  const fullMsg = `${text}\n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMsg)}`;
  window.open(waUrl, '_blank');
}

/* Imprimir tarjeta en Color idéntico al panel de control (admin.html) */
function printGoldenplacCard() {
  const f = document.getElementById('cardStudioIframe');
  if (f && f.contentWindow) {
    f.contentWindow.print();
  } else {
    window.print();
  }
}

/* Descargar directamente como archivo PDF (idéntico a la impresión) */
function downloadGoldenplacCardPDF() {
  showToast('Generando archivo PDF oficial...');

  if (window.html2pdf) {
    const frontBox = document.getElementById('publicCardFront');
    const backBox = document.getElementById('publicCardBack');
    if (!frontBox || !backBox) {
      window.print();
      return;
    }

    // Contenedor temporal de alta resolución para renderizado PDF idéntico a Image 2
    const printContainer = document.createElement('div');
    printContainer.style.background = '#ffffff';
    printContainer.style.padding = '35px 20px';
    printContainer.style.width = '700px';
    printContainer.style.display = 'flex';
    printContainer.style.flexDirection = 'column';
    printContainer.style.alignItems = 'center';
    printContainer.style.gap = '35px';
    printContainer.style.position = 'fixed';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.zIndex = '-1';

    const cloneFront = frontBox.cloneNode(true);
    cloneFront.style.width = '440px';
    cloneFront.style.height = '284px';
    cloneFront.style.transform = 'none';
    cloneFront.style.margin = '0 auto';
    cloneFront.style.borderRadius = '12px';
    cloneFront.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    cloneFront.style.border = '1px solid rgba(197, 160, 89, 0.45)';

    const cloneBack = backBox.cloneNode(true);
    cloneBack.style.width = '440px';
    cloneBack.style.height = '284px';
    cloneBack.style.transform = 'none';
    cloneBack.style.margin = '0 auto';
    cloneBack.style.borderRadius = '12px';
    cloneBack.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    cloneBack.style.border = '1px solid rgba(197, 160, 89, 0.45)';

    printContainer.appendChild(cloneFront);
    printContainer.appendChild(cloneBack);

    document.body.appendChild(printContainer);

    const opt = {
      margin: [15, 10, 15, 10],
      filename: 'Goldenplac-Tarjeta-Visita.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(printContainer).save().then(() => {
      if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
      showToast('¡PDF de la tarjeta descargado con éxito!');
    }).catch(err => {
      console.warn('html2pdf fallback to print dialog:', err);
      if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
      window.print();
    });
  } else {
    // Fallback directo a la vista de impresión
    window.print();
  }
}

// Compatibilidad
const printGoldenplacCardColorPDF = printGoldenplacCard;

window.renderPublicCardVisit = renderPublicCardVisit;
window.downloadGoldenplacVCard = downloadGoldenplacVCard;
window.shareGoldenplacCard = shareGoldenplacCard;
window.printGoldenplacCard = printGoldenplacCard;
window.printGoldenplacCardColorPDF = printGoldenplacCard;
window.downloadGoldenplacCardPDF = downloadGoldenplacCardPDF;



