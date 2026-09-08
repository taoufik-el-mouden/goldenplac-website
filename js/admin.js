/**
 * Goldenplac - Admin Panel Logic
 * Autenticación PIN, gestión CRUD de servicios, obras, opiniones,
 * bandeja de leads, exportación CSV y copias de seguridad.
 */

const SESSION_AUTH_KEY = 'goldenplac_admin_auth_session';
const LOCKOUT_STORAGE_KEY = 'goldenplac_admin_lockout_until';
const ATTEMPTS_STORAGE_KEY = 'goldenplac_admin_fail_count';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const PIN_SALT = '_goldenplac_sec_2026_madrid';
let inactivityTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();

  // Suscribirse a cambios del Store sólo si está autenticado
  window.GoldenStore.subscribe(() => {
    if (isAuthenticated()) {
      updateOverviewStats();
      renderRecentLeads();
      renderFullLeads();
      renderServicesTable();
      renderProjectsTable();
      renderTestimonialsTable();
    }
  });
});

/* 1. CRIPTOGRAFÍA & HASHING SEGURO (SHA-256 con Salt) */
async function hashPin(pin) {
  const msgBuffer = new TextEncoder().encode(pin + PIN_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAuthenticated() {
  const sessionRaw = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (!sessionRaw) return false;
  try {
    const sess = JSON.parse(sessionRaw);
    if (sess && sess.token && (Date.now() - sess.timestamp < 8 * 60 * 60 * 1000)) {
      return true;
    }
  } catch (e) {
    if (sessionRaw === 'true') return true;
  }
  return false;
}

/* 2. PROTECCIÓN CONTRA FUERZA BRUTA (BRUTE-FORCE LOCKOUT) */
function checkLockout() {
  const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_STORAGE_KEY) || '0', 10);
  const now = Date.now();
  const input = document.getElementById('adminPinInput');
  const btn = document.getElementById('pinSubmitBtn');
  const notice = document.getElementById('lockoutNotice');
  const error = document.getElementById('pinError');

  if (now < lockoutUntil) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    if (input) input.disabled = true;
    if (btn) btn.disabled = true;
    if (error) error.style.display = 'none';
    if (notice) {
      notice.style.display = 'block';
      notice.textContent = `⛔ Acceso bloqueado por seguridad tras varios intentos erróneos. Espera ${mins}m ${secs < 10 ? '0' : ''}${secs}s.`;
    }
    setTimeout(checkLockout, 1000);
    return true;
  } else {
    if (lockoutUntil > 0) {
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
    }
    if (input) input.disabled = false;
    if (btn) btn.disabled = false;
    if (notice) notice.style.display = 'none';
    return false;
  }
}

/* 3. AUTENTICACIÓN & CONTROL DE SESIÓN (ZERO DATA EXPOSURE) */
function clearSensitiveAdminDOM() {
  const recentTable = document.getElementById('recentLeadsTableBody');
  const fullTable = document.getElementById('fullLeadsTableBody');
  if (recentTable) recentTable.innerHTML = '';
  if (fullTable) fullTable.innerHTML = '';
}

function checkAuthSession() {
  const lock = document.getElementById('lockScreen');
  if (isAuthenticated()) {
    if (lock) lock.style.display = 'none';
    initAdminData();
    initInactivityTimer();
  } else {
    if (lock) lock.style.display = 'flex';
    clearSensitiveAdminDOM();
    checkLockout();
  }
}

async function handlePinSubmit(e) {
  e.preventDefault();
  if (checkLockout()) return;

  const input = document.getElementById('adminPinInput');
  const error = document.getElementById('pinError');
  const entered = (input.value || '').trim();
  if (!entered) return;

  const settings = window.GoldenStore.getSettings();
  let validHash = settings.adminPinHash;

  // Migración segura automática al primer uso
  if (!validHash) {
    const initialPin = settings.adminPin || '1234';
    validHash = await hashPin(initialPin);
    window.GoldenStore.updateSettings({ adminPinHash: validHash, adminPin: undefined });
  }

  const enteredHash = await hashPin(entered);

  if (enteredHash === validHash) {
    // Éxito: limpiar contadores de error
    localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);

    // Crear token criptográfico de sesión
    const sessionData = {
      token: Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''),
      timestamp: Date.now()
    };
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(sessionData));

    document.getElementById('lockScreen').style.display = 'none';
    input.value = '';
    if (error) error.style.display = 'none';

    // Cargar datos SOLO tras autenticación verificada
    initAdminData();
    initInactivityTimer();
    showAdminToast('Acceso concedido al Panel de Control');
  } else {
    let fails = parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, fails.toString());

    if (fails >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
      localStorage.setItem(LOCKOUT_STORAGE_KEY, lockUntil.toString());
      checkLockout();
    } else {
      const remaining = MAX_FAILED_ATTEMPTS - fails;
      if (error) {
        error.textContent = `Código incorrecto. Te quedan ${remaining} intento(s) antes del bloqueo de seguridad.`;
        error.style.display = 'block';
      }
      input.select();
    }
  }
}

function initInactivityTimer() {
  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      logoutAdmin('Tu sesión ha expirado por inactividad (25 minutos). Por seguridad vuelve a identificarte.');
    }, 25 * 60 * 1000);
  };

  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}

function logoutAdmin(noticeMsg) {
  sessionStorage.removeItem(SESSION_AUTH_KEY);
  clearSensitiveAdminDOM();
  const lock = document.getElementById('lockScreen');
  if (lock) lock.style.display = 'flex';
  if (noticeMsg) {
    alert(noticeMsg);
  }
  window.location.reload();
}

async function saveNewPin() {
  const newPin = document.getElementById('newAdminPin').value.trim();
  if (newPin.length < 4) {
    alert('El nuevo PIN o contraseña debe tener al menos 4 caracteres.');
    return;
  }
  const hash = await hashPin(newPin);
  window.GoldenStore.updateSettings({ adminPinHash: hash, adminPin: undefined });
  document.getElementById('newAdminPin').value = '';
  showAdminToast('Contraseña de Administrador actualizada y cifrada (SHA-256) con éxito');
}

/* 2. NAVEGACIÓN POR PESTAÑAS Y MENÚ MÓVIL */
function toggleAdminSidebar(force) {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('adminSidebarBackdrop');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('open');
  const nextState = (typeof force === 'boolean') ? force : !isOpen;

  if (nextState) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchTab(tabId) {
  // Cerrar menú móvil si estaba abierto
  toggleAdminSidebar(false);

  document.querySelectorAll('.admin-tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  }

  const navItem = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
  if (navItem) navItem.classList.add('active');

  // Si se cambia a la pestaña Antes/Después o Testimonios, refrescar sus tablas
  if (tabId === 'tab-beforeafter') renderBeforeAfterTable();
  if (tabId === 'tab-testimonials') renderTestimonialsTable();
  if (tabId === 'tab-projects') renderProjectsTable();
  if (tabId === 'tab-services') renderServicesTable();

  // Actualizar título superior
  const titles = {
    'tab-dashboard': 'Resumen General',
    'tab-leads': 'Solicitudes de Presupuesto',
    'tab-company': 'Información de la Empresa y Textos',
    'tab-services': 'Gestión de Servicios',
    'tab-projects': 'Galería de Obras',
    'tab-beforeafter': 'Comparador Antes y Después',
    'tab-testimonials': 'Opiniones de Clientes',
    'tab-backup': 'Seguridad y Copias de Seguridad',
    'tab-businesscard': 'Diseñador de Tarjetas de Visita'
  };
  const topTitle = document.getElementById('adminTopTitle');
  if (topTitle && titles[tabId]) topTitle.textContent = titles[tabId];
}

/* 3. INICIALIZACIÓN DE DATOS */
function initAdminData() {
  loadCompanyForm();
  updateOverviewStats();
  renderRecentLeads();
  renderFullLeads();
  renderServicesTable();
  renderProjectsTable();
  renderBeforeAfterTable();
  renderTestimonialsTable();
}

function updateOverviewStats() {
  const leads = window.GoldenStore.getLeads();
  const services = window.GoldenStore.getServices();
  const projects = window.GoldenStore.getProjects();
  const testimonials = window.GoldenStore.getTestimonials();

  const elLeads = document.getElementById('statLeadsCount');
  const elBadgeLeads = document.getElementById('badgeLeadsCount');
  const elServices = document.getElementById('statServicesCount');
  const elProjects = document.getElementById('statProjectsCount');
  const elReviews = document.getElementById('statReviewsCount');

  if (elLeads) elLeads.textContent = leads.length;
  if (elBadgeLeads) elBadgeLeads.textContent = leads.filter(l => l.status === 'nuevo').length;
  if (elServices) elServices.textContent = services.length;
  if (elProjects) elProjects.textContent = projects.length;
  if (elReviews) elReviews.textContent = testimonials.length;
}

/* 4. GESTIÓN DE INFORMACIÓN DE EMPRESA Y TEXTOS */
function loadCompanyForm() {
  const c = window.GoldenStore.getCompany();

  setVal('cfgCompanyName', c.name);
  setVal('cfgCompanyCif', c.cif);
  setVal('cfgCompanyPhone', c.phone);
  setVal('cfgCompanyWhatsapp', c.whatsapp);
  setVal('cfgCompanyEmail', c.email);
  setVal('cfgCompanySchedule', c.schedule);
  setVal('cfgCompanyAddress', c.address);
  setVal('cfgCompanyMapsUrl', c.googleMapsUrl || '');
  setVal('cfgCompanySlogan', c.slogan);

  setVal('cfgHeroBadge', c.heroBadge);
  setVal('cfgHeroTitle', c.heroTitle);
  setVal('cfgHeroSubtitle', c.heroSubtitle);
}

function saveCompanyDetails() {
  window.GoldenStore.updateCompany({
    name: getVal('cfgCompanyName'),
    cif: getVal('cfgCompanyCif'),
    phone: getVal('cfgCompanyPhone'),
    phoneRaw: getVal('cfgCompanyPhone').replace(/\s+/g, ''),
    whatsapp: getVal('cfgCompanyWhatsapp').replace(/[^0-9]/g, ''),
    email: getVal('cfgCompanyEmail'),
    schedule: getVal('cfgCompanySchedule'),
    address: getVal('cfgCompanyAddress'),
    googleMapsUrl: getVal('cfgCompanyMapsUrl'),
    slogan: getVal('cfgCompanySlogan')
  });
  showAdminToast('Datos de contacto y empresa actualizados.');
}

function saveHeroTexts() {
  window.GoldenStore.updateCompany({
    heroBadge: getVal('cfgHeroBadge'),
    heroTitle: getVal('cfgHeroTitle'),
    heroSubtitle: getVal('cfgHeroSubtitle')
  });
  showAdminToast('Textos de portada (Hero) actualizados.');
}

/* 5. GESTIÓN DE LEADS / SOLICITUDES */
function renderRecentLeads() {
  const leads = window.GoldenStore.getLeads().slice(0, 5);
  const tbody = document.getElementById('dashboardRecentLeadsBody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 2rem;">No hay solicitudes registradas aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = leads.map(l => `
    <tr>
      <td><strong>${escapeHTML(l.name)}</strong></td>
      <td>${escapeHTML(l.phone)}</td>
      <td>${escapeHTML(l.service)}</td>
      <td>${escapeHTML(l.zone || 'Madrid')}</td>
      <td><span class="status-badge status-${l.status || 'nuevo'}">${escapeHTML(l.status || 'nuevo')}</span></td>
      <td>
        <div class="action-btn-group">
          <a href="https://wa.me/${(l.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="icon-btn" title="Contactar por WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
          </a>
          <button class="icon-btn" onclick="toggleLeadStatus(${l.id})" title="Cambiar estado">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderFullLeads() {
  const leads = window.GoldenStore.getLeads();
  const tbody = document.getElementById('fullLeadsTableBody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--admin-text-muted); padding: 3rem;">No hay solicitudes de presupuesto en la bandeja.</td></tr>`;
    return;
  }

  tbody.innerHTML = leads.map(l => `
    <tr>
      <td style="font-size: 0.8rem; color: var(--admin-text-muted);">${escapeHTML(l.createdAt || '')}</td>
      <td><strong>${escapeHTML(l.name)}</strong></td>
      <td>
        <div>${escapeHTML(l.phone)}</div>
        <div style="font-size: 0.78rem; color: var(--admin-text-muted);">${escapeHTML(l.email || '-')}</div>
      </td>
      <td>
        <div style="font-weight: 600;">${escapeHTML(l.service)}</div>
        <div style="font-size: 0.78rem; color: var(--admin-gold);">${escapeHTML(l.zone || 'Madrid')}</div>
      </td>
      <td style="max-width: 240px; font-size: 0.84rem; color: var(--admin-text-muted);">${escapeHTML(l.message || '-')}</td>
      <td>
        <select class="admin-select" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; width: auto;" onchange="changeLeadStatus(${l.id}, this.value)">
          <option value="nuevo" ${l.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
          <option value="contactado" ${l.status === 'contactado' ? 'selected' : ''}>Contactado</option>
          <option value="completado" ${l.status === 'completado' ? 'selected' : ''}>Completado</option>
        </select>
      </td>
      <td>
        <div class="action-btn-group">
          <a href="https://wa.me/${(l.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola ' + l.name + ', te escribo de Goldenplac SL en relación a tu solicitud de presupuesto.')}" target="_blank" class="icon-btn" title="Contactar por WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
          </a>
          <button class="icon-btn btn-danger" onclick="deleteLeadItem(${l.id})" title="Eliminar lead">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function changeLeadStatus(leadId, newStatus) {
  window.GoldenStore.updateLeadStatus(leadId, newStatus);
  showAdminToast(`Estado de solicitud actualizado a ${newStatus}`);
}

function toggleLeadStatus(leadId) {
  const lead = window.GoldenStore.getLeads().find(l => l.id === leadId);
  if (lead) {
    const next = lead.status === 'nuevo' ? 'contactado' : (lead.status === 'contactado' ? 'completado' : 'nuevo');
    window.GoldenStore.updateLeadStatus(leadId, next);
  }
}

function deleteLeadItem(leadId) {
  if (confirm('¿Seguro que deseas eliminar este registro de solicitud?')) {
    window.GoldenStore.deleteLead(leadId);
    showAdminToast('Solicitud eliminada.');
  }
}

function exportLeadsCSV() {
  const leads = window.GoldenStore.getLeads();
  if (leads.length === 0) {
    alert('No hay solicitudes para exportar.');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ID,Fecha,Nombre,Telefono,Email,Servicio,Zona,Estado,Mensaje\n";

  leads.forEach(l => {
    const row = [
      l.id,
      `"${l.createdAt || ''}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.service || '').replace(/"/g, '""')}"`,
      `"${(l.zone || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ].join(',');
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `goldenplac_solicitudes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* 6. GESTIÓN DE SERVICIOS (CRUD) */
function renderServicesTable() {
  const services = window.GoldenStore.getServices();
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  tbody.innerHTML = services.map(s => `
    <tr>
      <td style="width: 70px;">
        <img src="${escapeHTML(s.image)}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px;" alt="Servicio">
      </td>
      <td>
        <strong>${escapeHTML(s.title)}</strong>
        <div style="font-size: 0.78rem; color: var(--admin-text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(s.description)}</div>
      </td>
      <td>${escapeHTML(s.category || 'Pladur')}</td>
      <td><span class="status-badge" style="background: rgba(197, 160, 89, 0.15); color: var(--admin-gold);">${escapeHTML(s.tag || '-')}</span></td>
      <td>${escapeHTML(s.priceEstimate || '-')}</td>
      <td>
        <div class="action-btn-group">
          <button class="icon-btn" onclick="editService('${s.id}')" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn btn-danger" onclick="deleteServiceItem('${s.id}')" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddServiceModal() {
  document.getElementById('serviceModalTitle').textContent = 'Añadir Servicio';
  document.getElementById('serviceEditId').value = '';
  document.getElementById('modalServiceTitle').value = '';
  document.getElementById('modalServiceCategory').value = 'Techos';
  document.getElementById('modalServiceTag').value = '';
  document.getElementById('modalServiceImage').value = 'assets/images/techos-led.jpg';
  document.getElementById('modalServicePrice').value = 'Desde 30 €/m²';
  document.getElementById('modalServiceDesc').value = '';
  updatePreviewFromUrl('modalServiceImage', 'servicePreviewBox', 'servicePreviewImg');
  const m = document.getElementById('serviceModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function closeServiceModal() {
  const m = document.getElementById('serviceModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('active');
  }
}

function editService(id) {
  const service = window.GoldenStore.getServices().find(s => s.id === id);
  if (!service) return;

  document.getElementById('serviceModalTitle').textContent = 'Editar Servicio';
  document.getElementById('serviceEditId').value = service.id;
  document.getElementById('modalServiceTitle').value = service.title;
  document.getElementById('modalServiceCategory').value = service.category || 'Techos';
  document.getElementById('modalServiceTag').value = service.tag || '';
  document.getElementById('modalServiceImage').value = service.image || '';
  document.getElementById('modalServicePrice').value = service.priceEstimate || '';
  document.getElementById('modalServiceDesc').value = service.description || '';
  updatePreviewFromUrl('modalServiceImage', 'servicePreviewBox', 'servicePreviewImg');
  const m = document.getElementById('serviceModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function handleSaveService(e) {
  e.preventDefault();
  const id = document.getElementById('serviceEditId').value;
  const newService = {
    id: id || undefined,
    title: document.getElementById('modalServiceTitle').value.trim(),
    category: document.getElementById('modalServiceCategory').value,
    tag: document.getElementById('modalServiceTag').value.trim(),
    image: document.getElementById('modalServiceImage').value.trim() || 'assets/images/techos-led.jpg',
    priceEstimate: document.getElementById('modalServicePrice').value.trim(),
    description: document.getElementById('modalServiceDesc').value.trim(),
    features: ['Material homologado', 'Acabado profesional', 'Garantía por escrito']
  };

  window.GoldenStore.saveService(newService);
  closeServiceModal();
  showAdminToast('Servicio guardado con éxito');
}

function deleteServiceItem(id) {
  if (confirm('¿Eliminar este servicio?')) {
    window.GoldenStore.deleteService(id);
    showAdminToast('Servicio eliminado.');
  }
}

/* 7. GESTIÓN DE PROYECTOS / OBRAS (CRUD) */
function renderProjectsTable() {
  const projects = window.GoldenStore.getProjects();
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td style="width: 70px;">
        <img src="${escapeHTML(p.image || p.afterImage)}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px;" alt="Obra">
      </td>
      <td>
        <strong>${escapeHTML(p.title)}</strong>
        <div style="font-size: 0.78rem; color: var(--admin-text-muted);">${escapeHTML(p.description || '')}</div>
      </td>
      <td>${escapeHTML(p.category || 'Obra')}</td>
      <td>${escapeHTML(p.location || 'Madrid')}</td>
      <td>${escapeHTML(p.duration || '3 días')}</td>
      <td>
        <div class="action-btn-group">
          <button class="icon-btn" onclick="editProject(${p.id})" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn btn-danger" onclick="deleteProjectItem(${p.id})" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddProjectModal() {
  document.getElementById('projectModalTitle').textContent = 'Añadir Obra a la Galería';
  document.getElementById('projectEditId').value = '';
  document.getElementById('modalProjectTitle').value = '';
  document.getElementById('modalProjectCategory').value = 'Techos';
  document.getElementById('modalProjectLocation').value = 'Madrid Capital';
  document.getElementById('modalProjectImage').value = 'img/falso-techo-recien-montado.mKmm81ID_ZG1BbR.webp';
  document.getElementById('modalProjectDuration').value = '3 días';
  document.getElementById('modalProjectDesc').value = '';
  updatePreviewFromUrl('modalProjectImage', 'projectPreviewBox', 'projectPreviewImg');
  const m = document.getElementById('projectModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function closeProjectModal() {
  const m = document.getElementById('projectModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('active');
  }
}

function editProject(id) {
  const project = window.GoldenStore.getProjects().find(p => p.id === id);
  if (!project) return;

  document.getElementById('projectModalTitle').textContent = 'Editar Obra';
  document.getElementById('projectEditId').value = project.id;
  document.getElementById('modalProjectTitle').value = project.title;
  document.getElementById('modalProjectCategory').value = project.category || 'Techos';
  document.getElementById('modalProjectLocation').value = project.location || '';
  document.getElementById('modalProjectImage').value = project.image || project.afterImage || '';
  document.getElementById('modalProjectDuration').value = project.duration || '';
  document.getElementById('modalProjectDesc').value = project.description || '';
  updatePreviewFromUrl('modalProjectImage', 'projectPreviewBox', 'projectPreviewImg');
  const m = document.getElementById('projectModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function handleSaveProject(e) {
  e.preventDefault();
  const id = document.getElementById('projectEditId').value;
  const imgVal = document.getElementById('modalProjectImage').value.trim() || 'img/falso-techo-recien-montado.mKmm81ID_ZG1BbR.webp';
  const newProject = {
    id: id ? Number(id) : undefined,
    title: document.getElementById('modalProjectTitle').value.trim(),
    category: document.getElementById('modalProjectCategory').value,
    location: document.getElementById('modalProjectLocation').value.trim(),
    image: imgVal,
    afterImage: imgVal,
    duration: document.getElementById('modalProjectDuration').value.trim(),
    description: document.getElementById('modalProjectDesc').value.trim(),
    year: '2026'
  };

  window.GoldenStore.saveProject(newProject);
  closeProjectModal();
  showAdminToast('Obra guardada en la galería con éxito');
}

function deleteProjectItem(id) {
  if (confirm('¿Eliminar esta obra de la galería?')) {
    window.GoldenStore.deleteProject(id);
    showAdminToast('Obra eliminada de la galería.');
  }
}

/* 8. GESTIÓN DE TESTIMONIOS (CRUD CON MODIFICACIÓN) */
function renderTestimonialsTable() {
  const testimonials = window.GoldenStore.getTestimonials();
  const tbody = document.getElementById('testimonialsTableBody');
  if (!tbody) return;

  if (!testimonials || testimonials.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 2.5rem;">No hay opiniones de clientes todavía.</td></tr>`;
    return;
  }

  tbody.innerHTML = testimonials.map(t => {
    const avatarUrl = t.avatar || '';
    const initial = (t.name || 'C')[0].toUpperCase();

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--admin-gold); display: flex; align-items: center; justify-content: center; background: #0b1120; flex-shrink: 0; color: #fff; font-weight: 700; font-size: 0.9rem;">
              ${avatarUrl ? `
                <img src="${escapeHTML(avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${escapeHTML(t.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              ` : ''}
              <span style="${avatarUrl ? 'display:none;' : 'display:flex;'}">${initial}</span>
            </div>
            <div>
              <strong>${escapeHTML(t.name)}</strong>
              <div style="font-size: 0.74rem; color: #22c55e;">✓ Verificado Google</div>
            </div>
          </div>
        </td>
        <td><span style="color: var(--admin-gold); font-size: 0.85rem;">${escapeHTML(t.location || 'Madrid')}</span></td>
        <td><span style="font-size: 0.84rem;">${escapeHTML(t.service || '-')}</span></td>
        <td><span style="color: #f59e0b; font-weight: 700;">★ ${t.rating || 5}.0</span></td>
        <td style="max-width: 280px; font-size: 0.82rem; color: var(--admin-text-muted); line-height: 1.4;">${escapeHTML(t.comment)}</td>
        <td>
          <div class="action-btn-group">
            <button class="icon-btn" onclick="editTestimonialItem(${t.id})" title="Modificar Opinión">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn btn-danger" onclick="deleteTestimonialItem(${t.id})" title="Eliminar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddTestimonialModal() {
  document.getElementById('testimonialEditId').value = '';
  document.getElementById('testimonialModalTitle').textContent = 'Añadir Nueva Opinión';
  document.getElementById('modalTestName').value = '';
  document.getElementById('modalTestLocation').value = 'Madrid Capital';
  document.getElementById('modalTestService').value = 'Falso techo LED';
  document.getElementById('modalTestRating').value = '5';
  document.getElementById('modalTestComment').value = '';
  
  const avatarInput = document.getElementById('modalTestAvatar');
  if (avatarInput) {
    avatarInput.value = '';
    clearImagePreview('modalTestAvatar', 'testPreviewBox', 'testPreviewImg');
  }

  const m = document.getElementById('testimonialModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function editTestimonialItem(id) {
  const testimonials = window.GoldenStore.getTestimonials();
  const t = testimonials.find(item => item.id === Number(id) || item.id === id);
  if (!t) return;

  document.getElementById('testimonialEditId').value = t.id;
  document.getElementById('testimonialModalTitle').textContent = 'Modificar Opinión del Cliente';
  document.getElementById('modalTestName').value = t.name || '';
  document.getElementById('modalTestLocation').value = t.location || '';
  document.getElementById('modalTestService').value = t.service || '';
  document.getElementById('modalTestRating').value = String(t.rating || 5);
  document.getElementById('modalTestComment').value = t.comment || '';

  const avatarInput = document.getElementById('modalTestAvatar');
  if (avatarInput) {
    avatarInput.value = t.avatar || '';
    updatePreviewFromUrl('modalTestAvatar', 'testPreviewBox', 'testPreviewImg');
  }

  const m = document.getElementById('testimonialModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function closeTestimonialModal() {
  const m = document.getElementById('testimonialModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('active');
  }
}

function handleSaveTestimonial(e) {
  e.preventDefault();
  const editId = document.getElementById('testimonialEditId').value;
  const avatarInput = document.getElementById('modalTestAvatar');

  const newT = {
    name: document.getElementById('modalTestName').value.trim(),
    location: document.getElementById('modalTestLocation').value.trim(),
    service: document.getElementById('modalTestService').value.trim(),
    rating: parseInt(document.getElementById('modalTestRating').value, 10) || 5,
    avatar: (avatarInput && avatarInput.value.trim()) || '',
    comment: document.getElementById('modalTestComment').value.trim(),
    date: 'Febrero 2026'
  };

  if (editId) {
    newT.id = isNaN(Number(editId)) ? editId : Number(editId);
  }

  window.GoldenStore.saveTestimonial(newT);
  closeTestimonialModal();
  renderTestimonialsTable();
  showAdminToast(editId ? '¡Opinión modificada con éxito!' : '¡Nueva opinión guardada con éxito!');
}

function deleteTestimonialItem(id) {
  if (confirm('¿Seguro que deseas eliminar este testimonio de cliente?')) {
    window.GoldenStore.deleteTestimonial(id);
    renderTestimonialsTable();
    showAdminToast('Testimonio eliminado.');
  }
}

/* 8.5. GESTIÓN DE COMPARADOR ANTES / DESPUÉS (CRUD) */
function renderBeforeAfterTable() {
  const items = window.GoldenStore.getBeforeAfter();
  const tbody = document.getElementById('beforeAfterTableBody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-text-muted); padding: 2.5rem;">No hay comparaciones de Antes / Después. Haz clic en "Añadir Comparación" para crear una.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(b => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="position: relative; width: 64px; height: 44px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.4); background: #0b1120;">
            <img src="${escapeHTML(b.beforeImage)}" style="width: 100%; height: 100%; object-fit: cover;" alt="Antes" onerror="this.src='assets/images/techos-led.jpg'">
            <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); font-size: 0.56rem; color: #f59e0b; text-align: center; font-weight: 700; line-height: 1.2;">ANTES</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--admin-gold);"><polyline points="9 18 15 12 9 6"></polyline></svg>
          <div style="position: relative; width: 64px; height: 44px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(34, 197, 94, 0.4); background: #0b1120;">
            <img src="${escapeHTML(b.afterImage)}" style="width: 100%; height: 100%; object-fit: cover;" alt="Después" onerror="this.src='assets/images/hero-bg.jpg'">
            <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); font-size: 0.56rem; color: #22c55e; text-align: center; font-weight: 700; line-height: 1.2;">DESPUÉS</span>
          </div>
        </div>
      </td>
      <td><strong>${escapeHTML(b.title)}</strong></td>
      <td><span class="project-tag-pill">${escapeHTML(b.category || 'General')}</span></td>
      <td style="max-width: 320px; font-size: 0.82rem; color: var(--admin-text-muted); line-height: 1.4;">${escapeHTML(b.caption || '-')}</td>
      <td>
        <div class="action-btn-group">
          <button class="icon-btn" onclick="editBeforeAfterItem(${b.id})" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn btn-danger" onclick="deleteBeforeAfterItem(${b.id})" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddBeforeAfterModal() {
  document.getElementById('beforeAfterEditId').value = '';
  document.getElementById('beforeAfterModalTitle').textContent = 'Añadir Comparación Antes / Después';
  document.getElementById('modalBaTitle').value = '';
  document.getElementById('modalBaCategory').value = 'Techos';
  document.getElementById('modalBaBeforeImage').value = '';
  document.getElementById('modalBaAfterImage').value = '';
  document.getElementById('modalBaCaption').value = '';
  clearImagePreview('modalBaBeforeImage', 'baBeforePreviewBox', 'baBeforePreviewImg');
  clearImagePreview('modalBaAfterImage', 'baAfterPreviewBox', 'baAfterPreviewImg');

  const m = document.getElementById('beforeAfterModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function editBeforeAfterItem(id) {
  const items = window.GoldenStore.getBeforeAfter();
  const b = items.find(item => item.id === Number(id) || item.id === id);
  if (!b) return;

  document.getElementById('beforeAfterEditId').value = b.id;
  document.getElementById('beforeAfterModalTitle').textContent = 'Editar Comparación Antes / Después';
  document.getElementById('modalBaTitle').value = b.title || '';
  document.getElementById('modalBaCategory').value = b.category || 'Techos';
  document.getElementById('modalBaBeforeImage').value = b.beforeImage || '';
  document.getElementById('modalBaAfterImage').value = b.afterImage || '';
  document.getElementById('modalBaCaption').value = b.caption || '';

  updatePreviewFromUrl('modalBaBeforeImage', 'baBeforePreviewBox', 'baBeforePreviewImg');
  updatePreviewFromUrl('modalBaAfterImage', 'baAfterPreviewBox', 'baAfterPreviewImg');

  const m = document.getElementById('beforeAfterModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
  }
}

function closeBeforeAfterModal() {
  const m = document.getElementById('beforeAfterModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('active');
  }
}

function handleSaveBeforeAfter(e) {
  e.preventDefault();
  const editId = document.getElementById('beforeAfterEditId').value;
  const newItem = {
    title: document.getElementById('modalBaTitle').value.trim(),
    category: document.getElementById('modalBaCategory').value,
    beforeImage: document.getElementById('modalBaBeforeImage').value.trim(),
    afterImage: document.getElementById('modalBaAfterImage').value.trim(),
    caption: document.getElementById('modalBaCaption').value.trim()
  };

  if (editId) {
    newItem.id = isNaN(Number(editId)) ? editId : Number(editId);
  }

  window.GoldenStore.saveBeforeAfter(newItem);
  closeBeforeAfterModal();
  renderBeforeAfterTable();
  showAdminToast('¡Comparación Antes / Después guardada con éxito!');
}

function deleteBeforeAfterItem(id) {
  if (confirm('¿Seguro que deseas eliminar esta comparación de Antes y Después?')) {
    window.GoldenStore.deleteBeforeAfter(id);
    renderBeforeAfterTable();
    showAdminToast('Comparación eliminada.');
  }
}

/* 9. COPIA DE SEGURIDAD & RESTAURAR */
function downloadBackup() {
  const json = window.GoldenStore.exportBackupJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goldenplac_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAdminToast('Copia de seguridad descargada correctamente.');
}

function handleRestoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const success = window.GoldenStore.importBackupJSON(e.target.result);
    if (success) {
      showAdminToast('¡Copia de seguridad restaurada con éxito!');
      initAdminData();
    } else {
      alert('Error: el archivo seleccionado no tiene un formato válido de copia de seguridad de Goldenplac.');
    }
  };
  reader.readAsText(file);
}

function resetStoreToDefault() {
  if (confirm('¿Estás seguro de que deseas restablecer los datos de fábrica? Se reiniciarán todos los textos, servicios y fotos a sus valores originales.')) {
    window.GoldenStore.resetToDefault();
    showAdminToast('Valores originales restablecidos.');
    initAdminData();
  }
}

/* 10. UTILIDADES & HELPERS */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.value = val;
}

function showAdminToast(msg) {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>${escapeHTML(msg)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
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

/* 11. GESTIÓN DE SUBIDA DE IMÁGENES Y VISTA PREVIA */
function handleImageFileSelect(event, inputId, previewBoxId, previewImgId) {
  const file = event.target.files[0];
  if (!file) return;

  // Comprobar que es imagen
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    // Comprimir / redimensionar automáticamente para carga ultra rápida y ahorro de espacio
    compressImage(rawDataUrl, 1200, 0.82, (compressedDataUrl) => {
      const inputEl = document.getElementById(inputId);
      const previewBox = document.getElementById(previewBoxId);
      const previewImg = document.getElementById(previewImgId);

      if (inputEl) inputEl.value = compressedDataUrl;
      if (previewImg) previewImg.src = compressedDataUrl;
      if (previewBox) previewBox.classList.add('has-image');

      showAdminToast('¡Foto cargada y optimizada con éxito!');
    });
  };
  reader.readAsDataURL(file);
}

function updatePreviewFromUrl(inputId, previewBoxId, previewImgId) {
  const inputEl = document.getElementById(inputId);
  const previewBox = document.getElementById(previewBoxId);
  const previewImg = document.getElementById(previewImgId);

  if (!inputEl || !previewBox || !previewImg) return;

  const url = inputEl.value.trim();
  if (url) {
    previewImg.src = url;
    previewImg.onerror = () => {
      previewBox.classList.remove('has-image');
    };
    previewImg.onload = () => {
      previewBox.classList.add('has-image');
    };
  } else {
    previewBox.classList.remove('has-image');
  }
}

function clearImagePreview(inputId, previewBoxId, previewImgId) {
  const inputEl = document.getElementById(inputId);
  const previewBox = document.getElementById(previewBoxId);
  const previewImg = document.getElementById(previewImgId);

  if (inputEl) inputEl.value = '';
  if (previewImg) previewImg.src = '';
  if (previewBox) previewBox.classList.remove('has-image');
}

function setPresetImage(inputId, previewBoxId, previewImgId, presetPath) {
  const inputEl = document.getElementById(inputId);
  if (inputEl) inputEl.value = presetPath;
  updatePreviewFromUrl(inputId, previewBoxId, previewImgId);
  showAdminToast('Foto predeterminada seleccionada');
}

/**
 * Comprime y redimensiona una imagen usando canvas para que cargue al instante
 */
function compressImage(base64Str, maxDim, quality, callback) {
  const img = new Image();
  img.src = base64Str;
  img.onload = function() {
    let width = img.width;
    let height = img.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const result = canvas.toDataURL('image/jpeg', quality);
    callback(result);
  };
  img.onerror = function() {
    callback(base64Str);
  };
}

// Cerrar modales al hacer clic en el fondo o pulsar tecla Escape
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
    e.target.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.style.display = 'none';
      m.classList.remove('active');
    });
  }
});


