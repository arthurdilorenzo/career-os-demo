/* ==========================================================================
   John Doe — Career OS (Demo Pública)
   Engine interativo, gráficos SVG em degradê e gaveta lateral
   Persistência isolada em localStorage sobre dataset sintético (data.js)
   ========================================================================== */

(function () {
  'use strict';

  const STAGES = {
    inbound:   { key: 'inbound',   label: 'A validar',  col: 'inbound',   weight: 9, c: '#9f98b0', c2: '#766f87' },
    to_apply:  { key: 'to_apply',  label: 'A aplicar',  col: 'to_apply',  weight: 8, c: '#5cb5c2', c2: '#3b8191' },
    queue:     { key: 'queue',     label: 'Fila',       col: 'to_apply',  weight: 8, c: '#5cb5c2', c2: '#3b8191' },
    submitted: { key: 'submitted', label: 'Enviadas',   col: 'submitted', weight: 4, c: '#6c8fd4', c2: '#4b67a8' },
    screening: { key: 'screening', label: 'Triagem',    col: 'screening', weight: 5, c: '#9c7ed6', c2: '#6e52a8' },
    interview: { key: 'interview', label: 'Entrevista', col: 'interview', weight: 6, c: '#cc9444', c2: '#946326' },
    advisory:  { key: 'advisory',  label: 'Advisory',   col: 'interview', weight: 6, c: '#cc9444', c2: '#946326' },
    offer:     { key: 'offer',     label: 'Oferta',     col: 'offer',     weight: 7, c: '#4aa882', c2: '#2d775b' },
    closed:    { key: 'closed',    label: 'Encerradas', col: 'closed',    weight: 1, c: '#6a6276', c2: '#484252' },
    rejected:  { key: 'rejected',  label: 'Rejeitadas', col: 'rejected',  weight: 0, c: '#9e3d54', c2: '#6b2538' }
  };

  const KANBAN_COLS = [
    { key: 'inbound',   title: 'A validar',  target: 'inbound' },
    { key: 'to_apply',  title: 'A aplicar',  target: 'to_apply' },
    { key: 'submitted', title: 'Enviadas',   target: 'submitted', paginate: true },
    { key: 'screening', title: 'Triagem',    target: 'screening' },
    { key: 'interview', title: 'Entrevista', target: 'interview' },
    { key: 'offer',     title: 'Oferta',     target: 'offer' },
    { key: 'closed',    title: 'Encerradas', target: 'closed',   archived: true, paginate: true },
    { key: 'rejected',  title: 'Rejeitadas', target: 'rejected', archived: true, paginate: true }
  ];

  const PRIMARY_STEP_ORDER = ['inbound', 'to_apply', 'submitted', 'screening', 'interview', 'offer'];
  const ALT_STEP_ORDER = ['advisory', 'closed', 'rejected'];
  const ACTIVE_STAGES = new Set(['screening', 'interview', 'advisory', 'offer']);
  const ARCHIVED_STAGES = new Set(['closed', 'rejected']);

  const VIEW_META = {
    overview:  { eyebrow: 'COMMAND CENTER', title: 'Visão Geral' },
    kanban:    { eyebrow: 'PIPELINE VISUAL', title: 'Kanban por Etapa' },
    table:     { eyebrow: 'BASE COMPLETA', title: 'Tabela de Vagas' },
    analytics: { eyebrow: 'DESEMPENHO & FUNIL', title: 'Análises' },
    agenda:    { eyebrow: 'PRAZOS & FOLLOW-UPS', title: 'Agenda' }
  };

  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const state = {
    jobs: [],
    view: 'overview',
    search: '',
    kanbanRegion: 'all',
    hideArchived: false,
    expandedCols: new Set(),
    tableStage: 'all',
    tableRegion: 'all',
    sortField: 'fitScore',
    sortDir: 'desc',
    privacy: false,
    drawerJobId: null,
    drawerStage: null,
    draggedId: null
  };

  const $ = (id) => document.getElementById(id);

  const el = {
    sidebar: $('sidebar'),
    sbLegend: $('sbLegend'),
    sbCountKanban: $('sbCountKanban'),
    sbCountAgenda: $('sbCountAgenda'),
    addJobBtn: $('addJobBtn'),
    exportChangesBtn: $('exportChangesBtn'),
    localChangesBadge: $('localChangesBadge'),
    privacyModeBtn: $('privacyModeBtn'),
    privacyIcon: $('privacyIcon'),
    privacyLabel: $('privacyLabel'),
    privacyNotice: $('privacyNotice'),
    turnOffPrivacyBtn: $('turnOffPrivacyBtn'),
    viewEyebrow: $('viewEyebrow'),
    viewTitle: $('viewTitle'),
    searchInput: $('searchInput'),

    kpiRow: $('kpiRow'),
    ovAgenda: $('ovAgenda'),
    ovActive: $('ovActive'),
    ovActiveCount: $('ovActiveCount'),
    ovFunnel: $('ovFunnel'),
    ovMonthly: $('ovMonthly'),

    kanbanRegion: $('kanbanRegion'),
    hideArchived: $('hideArchived'),
    kanbanMeta: $('kanbanMeta'),
    kanbanBoard: $('kanbanBoard'),

    tableStageChips: $('tableStageChips'),
    tableRegion: $('tableRegion'),
    tableMeta: $('tableMeta'),
    tableBody: $('tableBody'),

    anGauge: $('anGauge'),
    anDonut: $('anDonut'),
    anFit: $('anFit'),
    anMonthly: $('anMonthly'),
    anOutcome: $('anOutcome'),
    anNote: $('anNote'),

    agendaList: $('agendaList'),

    drawerScrim: $('drawerScrim'),
    drawer: $('drawer'),
    drawerForm: $('drawerForm'),
    drLogo: $('drLogo'),
    drCompany: $('drCompany'),
    drRole: $('drRole'),
    drClose: $('drClose'),
    drChips: $('drChips'),
    drQuickActions: $('drQuickActions'),
    drStepper: $('drStepper'),
    drStatus: $('drStatus'),
    drPriority: $('drPriority'),
    drApplied: $('drApplied'),
    drDue: $('drDue'),
    drResume: $('drResume'),
    drContact: $('drContact'),
    drNextAction: $('drNextAction'),
    drNotes: $('drNotes'),
    drUrl: $('drUrl'),
    drRestore: $('drRestore'),
    drCancel: $('drCancel'),

    exportModal: $('exportModal'),
    exportJson: $('exportJson'),
    clearAllLocalBtn: $('clearAllLocalBtn'),
    copyJsonBtn: $('copyJsonBtn'),
    downloadJsonBtn: $('downloadJsonBtn'),

    newJobModal: $('newJobModal'),
    newJobForm: $('newJobForm'),
    njCompany: $('njCompany'),
    njRole: $('njRole'),
    njCategory: $('njCategory'),
    njStage: $('njStage'),
    njSalary: $('njSalary'),
    njFit: $('njFit'),
    njUrl: $('njUrl'),
    njNotes: $('njNotes'),

    toast: $('toast')
  };

  /* ============================ HELPERS ============================ */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    return /^(https?:\/\/|mailto:)/i.test(trimmed) ? esc(trimmed) : '#';
  }

  function norm(str) {
    if (!str) return '';
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function stageInfo(stageKey) {
    return STAGES[stageKey] || STAGES.closed;
  }

  function stageVars(stageKey) {
    const col = stageInfo(stageKey).col;
    return `--c: var(--st-${col}); --c2: var(--st-${col}-2);`;
  }

  function isUSD(job) {
    return job.category === 'Internacional' || job.category === 'USD Global' || (job.category !== 'Brasil' && job.currency === 'USD');
  }

  function isBRL(job) {
    return !isUSD(job);
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDaysISO(baseStr, days) {
    const base = baseStr ? new Date(baseStr + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const day = String(base.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function daysDiff(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(target.getTime())) return null;
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  function formatDue(dateStr) {
    if (!dateStr) return { text: 'Sem prazo', cls: '', diff: null };
    const diff = daysDiff(dateStr);
    if (diff === null) return { text: esc(dateStr), cls: '', diff: null };
    if (diff < 0) return { text: `Atrasada ${Math.abs(diff)}d`, cls: 'over', diff };
    if (diff === 0) return { text: 'HOJE', cls: 'today', diff };
    if (diff <= 3) return { text: `Em ${diff}d`, cls: 'soon', diff };
    const parts = dateStr.split('-');
    const short = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
    return { text: short, cls: 'later', diff };
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(2)}` : dateStr;
  }

  function monthLabel(ym) {
    const [y, m] = ym.split('-');
    const idx = parseInt(m, 10) - 1;
    return `${MONTHS_PT[idx] || m}/${y.slice(2)}`;
  }

  function renderLogoHtml(company, logoUrl, stageKey, large = false) {
    const safeCo = company || 'CO';
    const initials = esc(safeCo.slice(0, 2).toUpperCase());
    const img = logoUrl
      ? `<img src="${esc(logoUrl)}" alt="${esc(safeCo)}" loading="lazy" />`
      : '';
    return `<span class="logo${large ? ' lg' : ''}" style="${stageVars(stageKey)}">${initials}${img}</span>`;
  }

  function fitBadgeHtml(score) {
    if (score == null || Number.isNaN(Number(score))) {
      return '<span class="fit none">—</span>';
    }
    const val = Number(score);
    const cls = val >= 8.5 ? '' : val >= 7.0 ? ' mid' : ' low';
    return `<span class="fit${cls}">${val.toFixed(1)}</span>`;
  }

  function stagePillHtml(stageKey) {
    const st = stageInfo(stageKey);
    return `<span class="pill" style="${stageVars(stageKey)}"><i></i>${esc(st.label)}</span>`;
  }

  function showToast(msg, ms = 3000) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(el.toast._timer);
    el.toast._timer = setTimeout(() => el.toast.classList.remove('show'), ms);
  }

  /* ============================ STORAGE ============================ */
  function getOverride(id) {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(`demo_job_track_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveOverride(id, payload) {
    try {
      if (typeof localStorage === 'undefined') return;
      const prev = getOverride(id) || {};
      const merged = { ...prev, ...payload, updatedAt: new Date().toISOString() };
      localStorage.setItem(`demo_job_track_${id}`, JSON.stringify(merged));
      updateLocalChangesBadge();
    } catch (err) {
      console.error('Erro ao salvar override local:', err);
    }
  }

  function removeOverride(id) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(`demo_job_track_${id}`);
      updateLocalChangesBadge();
    } catch {}
  }

  function getAllOverrides() {
    const map = {};
    try {
      if (typeof localStorage === 'undefined') return map;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('demo_job_track_')) {
          const id = key.replace('demo_job_track_', '');
          try { map[id] = JSON.parse(localStorage.getItem(key)); } catch {}
        }
      }
    } catch {}
    return map;
  }

  function updateLocalChangesBadge() {
    const count = Object.keys(getAllOverrides()).length;
    if (!el.localChangesBadge) return;
    el.localChangesBadge.textContent = count;
    el.localChangesBadge.hidden = count === 0;
  }

  /* ============================ DATA LOADING ============================ */
  function loadJobs() {
    const base = Array.isArray(window.pipelineData) ? window.pipelineData : [];
    const baseIds = new Set();
    const list = base.map((job) => {
      baseIds.add(job.id);
      const copy = { ...job };
      const ov = getOverride(copy.id);
      if (ov) {
        const fields = ['stage', 'priority', 'dueDate', 'nextActionDate', 'nextAction', 'notes', 'appliedDate', 'contactPerson', 'resumeVersion'];
        fields.forEach((f) => { if (f in ov) copy[f] = ov[f]; });
        if ('dueDate' in ov && !('nextActionDate' in ov)) copy.nextActionDate = ov.dueDate;
      }
      if (!copy.dueDate && copy.nextActionDate) copy.dueDate = copy.nextActionDate;
      if (!copy.nextActionDate && copy.dueDate) copy.nextActionDate = copy.dueDate;
      return copy;
    });

    // Inclui vagas manuais cadastradas localmente que ainda não estão no data.js
    const overrides = getAllOverrides();
    Object.entries(overrides).forEach(([id, ov]) => {
      if (!baseIds.has(id) && ov && ov.company && ov.role) {
        list.unshift({ ...ov, id });
      }
    });

    state.jobs = list;
  }

  function matchesSearch(job) {
    if (!state.search) return true;
    const q = state.search;
    const tags = Array.isArray(job.tags) ? job.tags.join(' ') : '';
    const hay = norm([job.company, job.role, job.location, job.workModel, job.notes, job.nextAction, job.category, job.salaryText, tags].join(' '));
    return hay.includes(q);
  }

  function matchesRegion(job, regionFilter) {
    if (regionFilter === 'all') return true;
    if (regionFilter === 'Internacional') return isUSD(job);
    if (regionFilter === 'Brasil') return isBRL(job);
    return true;
  }

  /* ============================ PRIVACY & NAVIGATION ============================ */
  function applyPrivacy(active) {
    state.privacy = Boolean(active);
    try { localStorage.setItem('demo_pref_privacy', String(state.privacy)); } catch {}
    document.body.classList.toggle('privacy', state.privacy);
    if (el.privacyModeBtn) el.privacyModeBtn.setAttribute('aria-pressed', String(state.privacy));
    if (el.privacyIcon) el.privacyIcon.textContent = state.privacy ? '🔒' : '◉';
    if (el.privacyLabel) el.privacyLabel.textContent = state.privacy ? 'Privacidade on' : 'Privacidade off';
    if (el.privacyNotice) el.privacyNotice.hidden = !state.privacy;
  }

  function switchView(viewName, persist = true) {
    if (!VIEW_META[viewName]) viewName = 'overview';
    state.view = viewName;
    if (persist) {
      try { localStorage.setItem('demo_pref_view', viewName); } catch {}
    }

    document.querySelectorAll('.sb-item[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    document.querySelectorAll('section.view').forEach((sec) => {
      sec.hidden = sec.id !== `view-${viewName}`;
    });

    const meta = VIEW_META[viewName];
    if (el.viewEyebrow) el.viewEyebrow.textContent = meta.eyebrow;
    if (el.viewTitle) el.viewTitle.textContent = meta.title;

    renderActiveView();
  }

  function renderSidebar() {
    const counts = {};
    KANBAN_COLS.forEach((c) => { counts[c.key] = 0; });
    state.jobs.forEach((j) => {
      const col = stageInfo(j.stage).col;
      if (col in counts) counts[col] += 1;
    });

    if (el.sbLegend) {
      el.sbLegend.innerHTML = KANBAN_COLS.map((c) => `
        <li data-stage-jump="${c.key}" style="--c: var(--st-${c.key}); --c2: var(--st-${c.key}-2);" title="Filtrar ${c.title} na tabela">
          <i></i><span>${esc(c.title)}</span><em>${counts[c.key]}</em>
        </li>
      `).join('');
    }

    const attentionCount = (counts.inbound || 0) + (counts.to_apply || 0) + (counts.screening || 0) + (counts.interview || 0) + (counts.offer || 0);
    if (el.sbCountKanban) el.sbCountKanban.textContent = attentionCount;

    const urgentAgenda = state.jobs.filter((j) => {
      if (ARCHIVED_STAGES.has(j.stage)) return false;
      const d = daysDiff(j.dueDate || j.nextActionDate);
      return d !== null && d <= 3;
    }).length;
    if (el.sbCountAgenda) {
      el.sbCountAgenda.textContent = urgentAgenda;
      el.sbCountAgenda.hidden = urgentAgenda === 0;
    }
  }

  function renderActiveView() {
    renderSidebar();
    if (state.view === 'overview') renderOverview();
    else if (state.view === 'kanban') renderKanban();
    else if (state.view === 'table') renderTable();
    else if (state.view === 'analytics') renderAnalytics();
    else if (state.view === 'agenda') renderAgenda();
  }

  /* ============================ SHARED CARD ============================ */
  function createJobCard(job, draggable = false) {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('style', stageVars(job.stage));
    card.dataset.id = job.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    if (draggable) card.setAttribute('draggable', 'true');

    const due = formatDue(job.dueDate || job.nextActionDate);
    const sal = job.salaryText || 'Remuneração a confirmar';
    const salMuted = !job.salaryText || /sem faixa|a confirmar|sob consulta|nao informada/i.test(norm(sal));
    const subLine = job.workModel || job.location || job.category || '';

    card.innerHTML = `
      <div class="card-head">
        ${renderLogoHtml(job.company, job.logo, job.stage)}
        <div class="card-co">
          <b>${esc(job.company)}</b>
          <span>${esc(subLine)}</span>
        </div>
        ${fitBadgeHtml(job.fitScore)}
      </div>
      <div class="card-role">${esc(job.role)}</div>
      <div class="card-salary sensitive${salMuted ? ' muted' : ''}">${esc(sal)}</div>
      <div class="card-foot">
        ${stagePillHtml(job.stage)}
        ${job.priority === 'Alta' ? '<span class="prio">Alta</span>' : ''}
        ${due.diff !== null ? `<span class="due ${due.cls}">${esc(due.text)}</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openDrawer(job.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDrawer(job.id);
      }
    });

    if (draggable) {
      card.addEventListener('dragstart', (e) => {
        state.draggedId = job.id;
        card.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', job.id);
          e.dataTransfer.effectAllowed = 'move';
        }
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        state.draggedId = null;
        document.querySelectorAll('.col.drop-target').forEach((c) => c.classList.remove('drop-target'));
      });
    }

    return card;
  }

  /* ============================ STATS HELPERS ============================ */
  function computeMonthlyBuckets(jobs) {
    const map = {};
    let realAppliedCount = 0;
    let fallbackDateCount = 0;

    jobs.forEach((j) => {
      const raw = j.appliedDate || j.date;
      if (!raw || raw.length < 7) return;
      if (j.appliedDate) realAppliedCount += 1;
      else fallbackDateCount += 1;

      const ym = raw.slice(0, 7);
      if (!map[ym]) map[ym] = { ym, usd: 0, brl: 0, total: 0 };
      if (isUSD(j)) map[ym].usd += 1;
      else map[ym].brl += 1;
      map[ym].total += 1;
    });

    const buckets = Object.values(map).sort((a, b) => a.ym.localeCompare(b.ym));
    return { buckets, realAppliedCount, fallbackDateCount };
  }

  function computeFunnelStats(jobs) {
    const active = jobs.filter((j) => ACTIVE_STAGES.has(j.stage)).length;
    const submitted = jobs.filter((j) => j.stage === 'submitted').length;
    const rejected = jobs.filter((j) => j.stage === 'rejected').length;
    const closed = jobs.filter((j) => j.stage === 'closed').length;
    const formalResponses = active + rejected;
    const totalProcessed = submitted + formalResponses;
    const responseRate = totalProcessed > 0 ? (formalResponses / totalProcessed) * 100 : 0;
    return { active, submitted, rejected, closed, formalResponses, totalProcessed, responseRate };
  }

  /* ============================ SVG CHARTS ============================ */
  function sparklineSvg(values, c1, c2, idSuffix) {
    const w = 180;
    const h = 34;
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? w / (values.length - 1) : w;
    const pts = values.map((v, i) => [i * step, h - 4 - ((v / max) * (h - 10))]);
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    const gid = `sp_${idSuffix}`;
    return `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gid}_line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c2}"/><stop offset="100%" stop-color="${c1}"/></linearGradient>
          <linearGradient id="${gid}_fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}" stop-opacity="0.34"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/></linearGradient>
        </defs>
        <path d="${area}" fill="url(#${gid}_fill)"/>
        <path d="${line}" fill="none" stroke="url(#${gid}_line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function miniBarsSvg(items) {
    const total = items.reduce((s, it) => s + it.val, 0);
    if (total === 0) {
      return '<div style="display:flex;align-items:center;height:100%;padding-top:16px"><div style="width:100%;height:7px;border-radius:4px;background:rgba(255,255,255,0.06)"></div></div>';
    }
    const bars = items.map((it) => {
      const pct = it.val > 0 ? Math.max(8, (it.val / total) * 100) : 0;
      if (!pct) return '';
      return `<div style="width:${pct.toFixed(1)}%;height:7px;border-radius:4px;background:linear-gradient(90deg,${it.c2},${it.c});box-shadow:0 0 10px ${it.c}44" title="${esc(it.label)}: ${it.val}"></div>`;
    }).join('');
    return `<div style="display:flex;gap:4px;align-items:center;height:100%;padding-top:16px">${bars}</div>`;
  }

  function ringSvg(pct, c1, c2) {
    const r = 21;
    const circ = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = circ - (clamped / 100) * circ;
    return `
      <svg class="kpi-ring" viewBox="0 0 54 54">
        <defs><linearGradient id="ring_grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
        <circle cx="27" cy="27" r="${r}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="5"/>
        <circle cx="27" cy="27" r="${r}" fill="none" stroke="url(#ring_grad)" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 27 27)"/>
      </svg>
    `;
  }

  function renderMonthlyBarChart(container, buckets, stacked = false) {
    if (!container) return;
    const slice = buckets.slice(-6);
    if (!slice.length) {
      container.innerHTML = '<p class="empty-state">Sem datas suficientes.</p>';
      return;
    }

    const w = 480;
    const h = 196;
    const padL = 24;
    const padR = 14;
    const padT = 26;
    const padB = 30;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const maxVal = Math.max(...slice.map((b) => b.total), 1);
    const slotW = chartW / slice.length;
    const uid = stacked ? 'anm' : 'ovm';

    const gridLines = [0.25, 0.5, 0.75, 1].map((f) => {
      const y = (padT + chartH * (1 - f)).toFixed(1);
      return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 4"/>`;
    }).join('');

    const bars = slice.map((b, i) => {
      const cx = padL + slotW * i + slotW / 2;
      if (!stacked) {
        const bw = Math.min(40, slotW * 0.52);
        const bh = Math.max(4, (b.total / maxVal) * chartH);
        const x = cx - bw / 2;
        const y = padT + chartH - bh;
        return `
          <g>
            <title>${monthLabel(b.ym)}: ${b.total} (${b.usd} USD · ${b.brl} BRL)</title>
            <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="7" fill="url(#${uid}_coral)"/>
            <text x="${cx.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" fill="#f5f1f7" font-family="Roboto Mono, monospace" font-size="11" font-weight="600">${b.total}</text>
            <text x="${cx.toFixed(1)}" y="${h - 8}" text-anchor="middle" fill="#7d7486" font-family="Roboto Mono, monospace" font-size="10.5">${monthLabel(b.ym)}</text>
          </g>
        `;
      }

      const bw = Math.min(20, slotW * 0.28);
      const gap = 4;
      const hUsd = b.usd ? Math.max(4, (b.usd / maxVal) * chartH) : 0;
      const hBrl = b.brl ? Math.max(4, (b.brl / maxVal) * chartH) : 0;
      const xUsd = cx - bw - gap / 2;
      const xBrl = cx + gap / 2;
      const yUsd = padT + chartH - hUsd;
      const yBrl = padT + chartH - hBrl;
      return `
        <g>
          <title>${monthLabel(b.ym)}: ${b.usd} USD · ${b.brl} BRL</title>
          ${hUsd ? `<rect x="${xUsd.toFixed(1)}" y="${yUsd.toFixed(1)}" width="${bw}" height="${hUsd.toFixed(1)}" rx="5" fill="url(#${uid}_coral)"/>
          <text x="${(xUsd + bw / 2).toFixed(1)}" y="${(yUsd - 6).toFixed(1)}" text-anchor="middle" fill="#ff9a92" font-family="Roboto Mono, monospace" font-size="10">${b.usd}</text>` : ''}
          ${hBrl ? `<rect x="${xBrl.toFixed(1)}" y="${yBrl.toFixed(1)}" width="${bw}" height="${hBrl.toFixed(1)}" rx="5" fill="url(#${uid}_teal)"/>
          <text x="${(xBrl + bw / 2).toFixed(1)}" y="${(yBrl - 6).toFixed(1)}" text-anchor="middle" fill="#8ad8e2" font-family="Roboto Mono, monospace" font-size="10">${b.brl}</text>` : ''}
          <text x="${cx.toFixed(1)}" y="${h - 8}" text-anchor="middle" fill="#7d7486" font-family="Roboto Mono, monospace" font-size="10.5">${monthLabel(b.ym)}</text>
        </g>
      `;
    }).join('');

    const legend = stacked ? `
      <div class="chart-legend">
        <span style="--c: #f26866"><i></i>Internacional (USD)</span>
        <span style="--c: #5cb5c2"><i></i>Brasil (BRL)</span>
      </div>
    ` : '';

    container.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Volume mensal">
        <defs>
          <linearGradient id="${uid}_coral" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f26866"/><stop offset="100%" stop-color="#9e3d54" stop-opacity="0.72"/></linearGradient>
          <linearGradient id="${uid}_teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5cb5c2"/><stop offset="100%" stop-color="#3b8191" stop-opacity="0.72"/></linearGradient>
        </defs>
        ${gridLines}
        ${bars}
      </svg>
      ${legend}
    `;
  }

  /* ============================ VIEW: OVERVIEW ============================ */
  function renderOverview() {
    const jobs = state.jobs;
    const q = state.search ? jobs.filter(matchesSearch) : jobs;

    const inboundCount = jobs.filter((j) => j.stage === 'inbound').length;
    const readyCount = jobs.filter((j) => j.stage === 'to_apply' || j.stage === 'queue').length;
    const screeningCount = jobs.filter((j) => j.stage === 'screening').length;
    const interviewCount = jobs.filter((j) => j.stage === 'interview' || j.stage === 'advisory').length;
    const offerCount = jobs.filter((j) => j.stage === 'offer').length;
    const activeCount = screeningCount + interviewCount + offerCount;
    const usdTotal = jobs.filter(isUSD).length;
    const brlTotal = jobs.filter(isBRL).length;
    const usdActive = jobs.filter((j) => isUSD(j) && ACTIVE_STAGES.has(j.stage)).length;
    const funnel = computeFunnelStats(jobs);
    const monthly = computeMonthlyBuckets(jobs);
    const sparkCounts = monthly.buckets.slice(-5).map((b) => b.total);

    if (el.kpiRow) {
      el.kpiRow.innerHTML = `
        <div class="kpi" style="--c: var(--st-to_apply)">
          <div class="kpi-top"><span class="kpi-label">Fila de Envio</span></div>
          <div class="kpi-num">${readyCount + inboundCount}</div>
          <div class="kpi-sub">${readyCount} prontas · ${inboundCount} a validar</div>
          <div class="kpi-viz">${miniBarsSvg([
            { label: 'Prontas', val: readyCount, c: '#5cb5c2', c2: '#3b8191' },
            { label: 'A validar', val: inboundCount, c: '#9f98b0', c2: '#766f87' }
          ])}</div>
        </div>

        <div class="kpi" style="--c: var(--st-interview)">
          <div class="kpi-top"><span class="kpi-label">Em Movimento</span></div>
          <div class="kpi-num">${activeCount}</div>
          <div class="kpi-sub">${screeningCount} triagem · ${interviewCount} entr · ${offerCount} oferta</div>
          <div class="kpi-viz">${miniBarsSvg([
            { label: 'Triagem', val: screeningCount, c: '#9c7ed6', c2: '#6e52a8' },
            { label: 'Entrevista', val: interviewCount, c: '#cc9444', c2: '#946326' },
            { label: 'Oferta', val: offerCount, c: '#4aa882', c2: '#2d775b' }
          ])}</div>
        </div>

        <div class="kpi" style="--c: var(--st-submitted)">
          <div class="kpi-top"><span class="kpi-label">Enviadas</span></div>
          <div class="kpi-num">${funnel.submitted}</div>
          <div class="kpi-sub">aguardando retorno</div>
          <div class="kpi-viz">${sparklineSvg(sparkCounts, '#6c8fd4', '#4b67a8', 'kpi_sub')}</div>
        </div>

        <div class="kpi" style="--c: var(--accent)">
          <div class="kpi-top"><span class="kpi-label">Internacional USD</span></div>
          <div class="kpi-num">${usdTotal}</div>
          <div class="kpi-sub">${usdActive} em processo ativo · ${brlTotal} BRL</div>
          <div class="kpi-viz">${miniBarsSvg([
            { label: 'USD', val: usdTotal, c: '#f26866', c2: '#d94b7a' },
            { label: 'BRL', val: brlTotal, c: '#6c8fd4', c2: '#4b67a8' }
          ])}</div>
        </div>

        <div class="kpi" style="--c: var(--st-offer)">
          <div class="kpi-top"><span class="kpi-label">Retorno Real</span></div>
          ${ringSvg(funnel.responseRate, '#f26866', '#4aa882')}
          <div class="kpi-num">${funnel.responseRate.toFixed(1)}%</div>
          <div class="kpi-sub">${funnel.formalResponses} respostas / ${funnel.totalProcessed}</div>
        </div>
      `;
    }

    // Agenda imediata no Overview
    if (el.ovAgenda) {
      const dueJobs = q.filter((j) => !ARCHIVED_STAGES.has(j.stage) && (j.dueDate || j.nextActionDate))
        .sort((a, b) => (a.dueDate || a.nextActionDate).localeCompare(b.dueDate || b.nextActionDate));

      if (!dueJobs.length) {
        el.ovAgenda.innerHTML = '<p class="empty-state">Nenhum prazo pendente.</p>';
      } else {
        el.ovAgenda.innerHTML = '';
        dueJobs.slice(0, 12).forEach((job) => {
          const due = formatDue(job.dueDate || job.nextActionDate);
          const wrap = document.createElement('div');
          wrap.className = 'ag-item-wrap';
          wrap.innerHTML = `
            <button type="button" class="ag-row">
              <span class="ag-when ${due.cls}">${esc(due.text)}</span>
              <span class="ag-main">
                <b>${esc(job.company)} — ${esc(job.role)}</b>
                <span>${esc(job.nextAction || job.status || 'Acompanhar')}</span>
              </span>
              ${stagePillHtml(job.stage)}
            </button>
            <button type="button" class="snooze-btn" title="Adiar prazo em +3 dias">+3d</button>
          `;
          wrap.querySelector('.ag-row').addEventListener('click', () => openDrawer(job.id));
          wrap.querySelector('.snooze-btn').addEventListener('click', () => snoozeJob(job.id, 3));
          el.ovAgenda.appendChild(wrap);
        });
      }
    }

    // Processos ativos no Overview
    if (el.ovActive) {
      const actives = q.filter((j) => ACTIVE_STAGES.has(j.stage))
        .sort((a, b) => {
          const diff = stageInfo(b.stage).weight - stageInfo(a.stage).weight;
          if (diff !== 0) return diff;
          return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
        });
      if (el.ovActiveCount) el.ovActiveCount.textContent = `${actives.length} em movimento`;
      el.ovActive.innerHTML = '';
      if (!actives.length) {
        el.ovActive.innerHTML = '<p class="empty-state">Nenhum processo ativo para este filtro.</p>';
      } else {
        actives.forEach((job) => el.ovActive.appendChild(createJobCard(job, false)));
      }
    }

    // Funil no Overview
    if (el.ovFunnel) {
      const funnelStages = KANBAN_COLS.map((c) => ({
        ...c,
        count: jobs.filter((j) => stageInfo(j.stage).col === c.key).length
      }));
      const maxCol = Math.max(...funnelStages.map((s) => s.count), 1);
      el.ovFunnel.innerHTML = `<div class="funnel">${funnelStages.map((s) => {
        const pct = s.count > 0 ? Math.max(3, (s.count / maxCol) * 100) : 0;
        return `
          <div class="fn-row" style="--c: var(--st-${s.key}); --c2: var(--st-${s.key}-2)">
            <span>${esc(s.title)}</span>
            <div class="fn-track"><div class="fn-bar" style="width:${pct.toFixed(1)}%"></div></div>
            <b>${s.count}</b>
          </div>
        `;
      }).join('')}</div>`;
    }

    // Volume mensal no Overview
    renderMonthlyBarChart(el.ovMonthly, monthly.buckets, false);
  }

  /* ============================ VIEW: KANBAN ============================ */
  function renderKanban() {
    if (!el.kanbanBoard) return;

    const filtered = state.jobs.filter((j) => matchesSearch(j) && matchesRegion(j, state.kanbanRegion));
    const visibleCols = state.hideArchived ? KANBAN_COLS.filter((c) => !c.archived) : KANBAN_COLS;

    const buckets = {};
    visibleCols.forEach((c) => { buckets[c.key] = []; });
    filtered.forEach((j) => {
      const col = stageInfo(j.stage).col;
      if (buckets[col]) buckets[col].push(j);
    });

    // Ordenação interna contextual por coluna
    Object.entries(buckets).forEach(([colKey, list]) => {
      list.sort((a, b) => {
        if (colKey === 'screening' || colKey === 'interview' || colKey === 'offer') {
          const wDiff = stageInfo(b.stage).weight - stageInfo(a.stage).weight;
          if (wDiff !== 0) return wDiff;
          return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
        }
        if (colKey === 'submitted' || colKey === 'closed' || colKey === 'rejected') {
          const dA = a.appliedDate || a.lastContactDate || a.date || '';
          const dB = b.appliedDate || b.lastContactDate || b.date || '';
          return dB.localeCompare(dA);
        }
        return (b.fitScore || 0) - (a.fitScore || 0);
      });
    });

    const visibleTotal = visibleCols.reduce((sum, c) => sum + buckets[c.key].length, 0);
    if (el.kanbanMeta) {
      el.kanbanMeta.textContent = `${visibleTotal} vagas exibidas (${state.jobs.length} no total)`;
    }

    el.kanbanBoard.innerHTML = '';

    visibleCols.forEach((colDef) => {
      const list = buckets[colDef.key];
      const colEl = document.createElement('div');
      colEl.className = `col${list.length === 0 ? ' empty' : ''}`;
      colEl.setAttribute('style', `--c: var(--st-${colDef.key}); --c2: var(--st-${colDef.key}-2);`);
      colEl.dataset.stageTarget = colDef.target;

      colEl.innerHTML = `
        <div class="col-head">
          <i></i>
          <h3>${esc(colDef.title)}</h3>
          <em>${list.length}</em>
        </div>
        <div class="col-body"></div>
      `;

      const bodyEl = colEl.querySelector('.col-body');
      const limit = colDef.paginate && !state.expandedCols.has(colDef.key) ? 25 : list.length;
      const slice = list.slice(0, limit);

      if (slice.length === 0) {
        bodyEl.innerHTML = '<div class="col-empty">Arraste uma vaga para cá</div>';
      } else {
        slice.forEach((job) => bodyEl.appendChild(createJobCard(job, true)));
      }

      if (colDef.paginate && list.length > limit) {
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'col-more';
        moreBtn.textContent = `Mostrar todas (${list.length})`;
        moreBtn.addEventListener('click', () => {
          state.expandedCols.add(colDef.key);
          renderKanban();
        });
        bodyEl.appendChild(moreBtn);
      }

      // Drop target handlers
      colEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        colEl.classList.add('drop-target');
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      });
      colEl.addEventListener('dragleave', (e) => {
        if (!colEl.contains(e.relatedTarget)) colEl.classList.remove('drop-target');
      });
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('drop-target');
        const id = state.draggedId || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : null);
        if (id) moveJobStage(id, colDef.target);
      });

      el.kanbanBoard.appendChild(colEl);
    });
  }

  function moveJobStage(jobId, targetStage) {
    const job = state.jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (stageInfo(job.stage).col === stageInfo(targetStage).col && job.stage === targetStage) return;

    const payload = { stage: targetStage };
    if (targetStage === 'submitted' && !job.appliedDate) {
      payload.appliedDate = todayISO();
    }
    saveOverride(jobId, payload);
    Object.assign(job, payload);
    renderActiveView();
    showToast(`${job.company}: movida para ${stageInfo(targetStage).label}`);
  }

  /* ============================ VIEW: TABLE ============================ */
  function renderTable() {
    if (!el.tableBody) return;

    // Contadores nos chips de etapa
    const baseFiltered = state.jobs.filter((j) => matchesSearch(j) && matchesRegion(j, state.tableRegion));
    if (el.tableStageChips) {
      const chipCounts = { all: baseFiltered.length };
      KANBAN_COLS.forEach((c) => { chipCounts[c.key] = 0; });
      baseFiltered.forEach((j) => {
        const col = stageInfo(j.stage).col;
        if (col in chipCounts) chipCounts[col] += 1;
      });

      const chipsHtml = [
        `<button type="button" class="chip${state.tableStage === 'all' ? ' active' : ''}" data-stage="all">Todas <em>${chipCounts.all}</em></button>`,
        ...KANBAN_COLS.map((c) => `
          <button type="button" class="chip${state.tableStage === c.key ? ' active' : ''}" data-stage="${c.key}" style="--c: var(--st-${c.key})">
            <i></i>${esc(c.title)} <em>${chipCounts[c.key]}</em>
          </button>
        `)
      ].join('');
      el.tableStageChips.innerHTML = chipsHtml;
    }

    const rows = baseFiltered.filter((j) => state.tableStage === 'all' || stageInfo(j.stage).col === state.tableStage);

    // Ordenação
    const mult = state.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (state.sortField) {
        case 'company': return (a.company || '').localeCompare(b.company || '') * mult;
        case 'role': return (a.role || '').localeCompare(b.role || '') * mult;
        case 'stage': return (stageInfo(a.stage).weight - stageInfo(b.stage).weight) * mult;
        case 'category': return (a.category || '').localeCompare(b.category || '') * mult;
        case 'date': return ((a.appliedDate || a.date || '').localeCompare(b.appliedDate || b.date || '')) * mult;
        case 'due': {
          const dA = a.dueDate || a.nextActionDate || (mult > 0 ? '9999-99-99' : '');
          const dB = b.dueDate || b.nextActionDate || (mult > 0 ? '9999-99-99' : '');
          return dA.localeCompare(dB) * mult;
        }
        case 'salary': {
          if (a.salaryMin == null && b.salaryMin == null) return 0;
          if (a.salaryMin == null) return 1;
          if (b.salaryMin == null) return -1;
          const unitA = `${a.currency || ''}:${a.salaryPeriod || ''}`;
          const unitB = `${b.currency || ''}:${b.salaryPeriod || ''}`;
          if (unitA !== unitB) return unitA.localeCompare(unitB);
          return (a.salaryMin - b.salaryMin) * mult;
        }
        case 'fitScore':
        default: {
          if (a.fitScore == null && b.fitScore == null) return 0;
          if (a.fitScore == null) return 1;
          if (b.fitScore == null) return -1;
          return (a.fitScore - b.fitScore) * mult;
        }
      }
    });

    if (el.tableMeta) el.tableMeta.textContent = `Mostrando ${rows.length} de ${state.jobs.length}`;

    // Atualiza indicador nos headers
    document.querySelectorAll('.data-table th[data-sort]').forEach((th) => {
      const active = th.dataset.sort === state.sortField;
      th.classList.toggle('sorted', active);
      th.classList.toggle('asc', active && state.sortDir === 'asc');
    });

    el.tableBody.innerHTML = '';
    if (!rows.length) {
      el.tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma vaga encontrada com os filtros atuais.</td></tr>';
      return;
    }

    const frag = document.createDocumentFragment();
    rows.forEach((job) => {
      const tr = document.createElement('tr');
      const due = formatDue(job.dueDate || job.nextActionDate);
      const rawDate = job.appliedDate || job.date || '';

      tr.innerHTML = `
        <td><div class="td-co">${renderLogoHtml(job.company, job.logo, job.stage)}<span>${esc(job.company)}</span></div></td>
        <td class="td-role">${esc(job.role)}</td>
        <td>${stagePillHtml(job.stage)}</td>
        <td>${fitBadgeHtml(job.fitScore)}</td>
        <td class="td-sal sensitive">${esc(job.salaryText || 'A confirmar')}</td>
        <td><span class="tag">${esc(job.category || '—')}</span></td>
        <td class="td-mono">${esc(formatShortDate(rawDate))}</td>
        <td class="td-mono">${due.diff !== null ? `<span class="due ${due.cls}">${esc(due.text)}</span>` : '—'}</td>
      `;
      tr.addEventListener('click', () => openDrawer(job.id));
      frag.appendChild(tr);
    });
    el.tableBody.appendChild(frag);
  }

  /* ============================ VIEW: ANALYTICS ============================ */
  function renderAnalytics() {
    const jobs = state.jobs;
    const funnel = computeFunnelStats(jobs);
    const monthly = computeMonthlyBuckets(jobs);

    // 1. Gauge Semi-Circular: Taxa de Retorno Real
    if (el.anGauge) {
      const r = 90;
      const halfCirc = Math.PI * r;
      const pct = Math.max(0, Math.min(100, funnel.responseRate));
      const dashOffset = halfCirc - (pct / 100) * halfCirc;
      el.anGauge.innerHTML = `
        <div class="gauge-wrap">
          <svg viewBox="0 0 220 132" role="img" aria-label="Gauge de retorno real">
            <defs>
              <linearGradient id="gauge_grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#f26866"/>
                <stop offset="50%" stop-color="#cc9444"/>
                <stop offset="100%" stop-color="#4aa882"/>
              </linearGradient>
            </defs>
            <path d="M 20 112 A ${r} ${r} 0 0 1 200 112" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="16" stroke-linecap="round"/>
            <path d="M 20 112 A ${r} ${r} 0 0 1 200 112" fill="none" stroke="url(#gauge_grad)" stroke-width="16" stroke-linecap="round"
              stroke-dasharray="${halfCirc.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"/>
            <text x="110" y="96" text-anchor="middle" fill="#f5f1f7" font-family="Figtree, sans-serif" font-size="30" font-weight="800">${funnel.responseRate.toFixed(1)}%</text>
            <text x="110" y="116" text-anchor="middle" fill="#7d7486" font-family="Roboto Mono, monospace" font-size="10">${funnel.formalResponses} retornos em ${funnel.totalProcessed}</text>
          </svg>
          <p class="gauge-caption">${funnel.active} em triagem/entrevista/oferta · ${funnel.rejected} rejeitadas · ${funnel.submitted} aguardando</p>
        </div>
      `;
    }

    // 2. Donut: Internacional USD vs Brasil BRL
    if (el.anDonut) {
      const usdJobs = jobs.filter(isUSD);
      const brlJobs = jobs.filter(isBRL);
      const total = usdJobs.length + brlJobs.length || 1;
      const usdActive = usdJobs.filter((j) => ACTIVE_STAGES.has(j.stage)).length;
      const brlActive = brlJobs.filter((j) => ACTIVE_STAGES.has(j.stage)).length;

      const avgFit = (arr) => {
        const rated = arr.filter((j) => j.fitScore != null);
        if (!rated.length) return '—';
        return (rated.reduce((s, j) => s + j.fitScore, 0) / rated.length).toFixed(1);
      };

      const r = 54;
      const circ = 2 * Math.PI * r;
      const usdArc = (usdJobs.length / total) * circ;
      const brlArc = (brlJobs.length / total) * circ;

      el.anDonut.innerHTML = `
        <div class="donut-wrap">
          <svg viewBox="0 0 150 150" role="img" aria-label="Distribuição USD vs BRL">
            <defs>
              <linearGradient id="dn_usd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f26866"/><stop offset="100%" stop-color="#d94b7a"/></linearGradient>
              <linearGradient id="dn_brl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5cb5c2"/><stop offset="100%" stop-color="#6c8fd4"/></linearGradient>
            </defs>
            <circle cx="75" cy="75" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
            <circle cx="75" cy="75" r="${r}" fill="none" stroke="url(#dn_usd)" stroke-width="18"
              stroke-dasharray="${usdArc.toFixed(2)} ${circ.toFixed(2)}" transform="rotate(-90 75 75)"/>
            <circle cx="75" cy="75" r="${r}" fill="none" stroke="url(#dn_brl)" stroke-width="18"
              stroke-dasharray="${brlArc.toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${(-usdArc).toFixed(2)}" transform="rotate(-90 75 75)"/>
            <text x="75" y="72" text-anchor="middle" fill="#f5f1f7" font-family="Figtree, sans-serif" font-size="22" font-weight="800">${jobs.length}</text>
            <text x="75" y="89" text-anchor="middle" fill="#7d7486" font-family="Roboto Mono, monospace" font-size="10">VAGAS</text>
          </svg>
          <div class="donut-stats">
            <div class="donut-item">
              <div class="donut-item-left" style="--c:#f26866;--c2:#d94b7a"><i></i><div>Internacional (USD)<small>${usdActive} ativas · Fit médio ${avgFit(usdJobs)}</small></div></div>
              <b>${usdJobs.length}</b>
            </div>
            <div class="donut-item">
              <div class="donut-item-left" style="--c:#5cb5c2;--c2:#6c8fd4"><i></i><div>Brasil (BRL)<small>${brlActive} ativas · Fit médio ${avgFit(brlJobs)}</small></div></div>
              <b>${brlJobs.length}</b>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Distribuição de Fit Score
    if (el.anFit) {
      const buckets = [
        { label: '9.5 – 10.0', c: '#4aa882', c2: '#2d775b', fn: (f) => f >= 9.5 },
        { label: '9.0 – 9.4',  c: '#5cb5c2', c2: '#3b8191', fn: (f) => f >= 9.0 && f < 9.5 },
        { label: '8.5 – 8.9',  c: '#6c8fd4', c2: '#4b67a8', fn: (f) => f >= 8.5 && f < 9.0 },
        { label: '7.0 – 8.4',  c: '#cc9444', c2: '#946326', fn: (f) => f >= 7.0 && f < 8.5 },
        { label: '< 7.0',      c: '#9e3d54', c2: '#6b2538', fn: (f) => f != null && f < 7.0 },
        { label: 'Sem nota',   c: '#6a6276', c2: '#484252', fn: (f) => f == null }
      ].map((b) => ({ ...b, count: jobs.filter((j) => b.fn(j.fitScore)).length }));
      const maxFit = Math.max(...buckets.map((b) => b.count), 1);

      el.anFit.innerHTML = `<div class="funnel">${buckets.map((b) => {
        const pct = b.count > 0 ? Math.max(4, (b.count / maxFit) * 100) : 0;
        return `
          <div class="fn-row" style="--c:${b.c}; --c2:${b.c2}">
            <span>${b.label}</span>
            <div class="fn-track"><div class="fn-bar" style="width:${pct.toFixed(1)}%"></div></div>
            <b>${b.count}</b>
          </div>
        `;
      }).join('')}</div>`;
    }

    // 4. Volume por mês, por região
    renderMonthlyBarChart(el.anMonthly, monthly.buckets, true);

    // 5. Desfecho das candidaturas
    if (el.anOutcome) {
      const totalSentHistory = funnel.submitted + funnel.active + funnel.rejected + funnel.closed || 1;
      const rows = [
        { label: 'Ativas',     val: funnel.active,    c: '#cc9444', c2: '#946326' },
        { label: 'Aguardando', val: funnel.submitted, c: '#6c8fd4', c2: '#4b67a8' },
        { label: 'Rejeitadas', val: funnel.rejected,  c: '#9e3d54', c2: '#6b2538' },
        { label: 'Encerradas', val: funnel.closed,    c: '#6a6276', c2: '#484252' }
      ];
      el.anOutcome.innerHTML = `<div class="funnel">${rows.map((r) => {
        const pct = (r.val / totalSentHistory) * 100;
        return `
          <div class="fn-row" style="--c:${r.c}; --c2:${r.c2}">
            <span>${r.label}</span>
            <div class="fn-track"><div class="fn-bar" style="width:${Math.max(r.val ? 4 : 0, pct).toFixed(1)}%"></div></div>
            <b>${r.val}</b>
          </div>
        `;
      }).join('')}</div>`;
    }

    // 6. Nota metodológica factual
    if (el.anNote) {
      const withFit = jobs.filter((j) => j.fitScore != null).length;
      const withLastContact = jobs.filter((j) => ARCHIVED_STAGES.has(j.stage) && j.lastContactDate).length;
      el.anNote.textContent =
        `Transparência dos dados (${jobs.length} vagas fictícias em data.js): ` +
        `volume mensal usa appliedDate em ${monthly.realAppliedCount} vagas e date como fallback em ${monthly.fallbackDateCount}. ` +
        `Fit Score avaliado em ${withFit}/${jobs.length}. ` +
        `"Tempo médio até resposta" fica oculto porque apenas ${withLastContact} de ${funnel.closed + funnel.rejected} vagas encerradas/rejeitadas possuem lastContactDate demonstrativo.`;
    }
  }

  /* ============================ VIEW: AGENDA ============================ */
  function renderAgenda() {
    if (!el.agendaList) return;
    const items = state.jobs.filter((j) => !ARCHIVED_STAGES.has(j.stage) && matchesSearch(j));

    const groups = [
      { key: 'over',   title: 'Atrasadas',             c: '--st-rejected',  list: [] },
      { key: 'today',  title: 'Hoje',                  c: '--accent',       list: [] },
      { key: 'week',   title: 'Próximos 7 dias',       c: '--st-interview', list: [] },
      { key: 'later',  title: 'Mais adiante',          c: '--st-submitted', list: [] },
      { key: 'nodate', title: 'Ativas sem prazo',      c: '--st-screening', list: [] }
    ];

    items.forEach((j) => {
      const d = daysDiff(j.dueDate || j.nextActionDate);
      if (d === null) {
        if (ACTIVE_STAGES.has(j.stage) || j.stage === 'to_apply') groups[4].list.push(j);
      } else if (d < 0) groups[0].list.push(j);
      else if (d === 0) groups[1].list.push(j);
      else if (d <= 7) groups[2].list.push(j);
      else groups[3].list.push(j);
    });

    groups.forEach((g) => {
      g.list.sort((a, b) => (a.dueDate || a.nextActionDate || '9999').localeCompare(b.dueDate || b.nextActionDate || '9999'));
    });

    const nonEmpty = groups.filter((g) => g.list.length > 0);
    if (!nonEmpty.length) {
      el.agendaList.innerHTML = '<div class="panel"><p class="empty-state">Nenhum compromisso encontrado.</p></div>';
      return;
    }

    el.agendaList.innerHTML = '';
    nonEmpty.forEach((g) => {
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.innerHTML = `
        <div class="panel-head">
          <h2 style="--c: var(${g.c})"><i></i>${esc(g.title)}</h2>
          <span class="panel-sub">${g.list.length}</span>
        </div>
        <div class="agenda-list"></div>
      `;
      const listEl = panel.querySelector('.agenda-list');
      g.list.forEach((job) => {
        const due = formatDue(job.dueDate || job.nextActionDate);
        const card = document.createElement('div');
        card.className = 'agenda-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="agenda-card-top">
            <span class="ag-when ${due.cls || 'later'}">${esc(due.text)}</span>
            ${stagePillHtml(job.stage)}
            <button type="button" class="snooze-btn" title="Adiar prazo em +3 dias">+3d</button>
          </div>
          <b>${esc(job.company)} — ${esc(job.role)}</b>
          <p>${esc(job.nextAction || job.status || 'Abrir para definir próxima ação')}</p>
        `;
        card.addEventListener('click', (e) => {
          if (e.target.closest('.snooze-btn')) return;
          openDrawer(job.id);
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDrawer(job.id);
          }
        });
        card.querySelector('.snooze-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          snoozeJob(job.id, 3);
        });
        listEl.appendChild(card);
      });
      el.agendaList.appendChild(panel);
    });
  }

  function snoozeJob(jobId, days) {
    const job = state.jobs.find((j) => j.id === jobId);
    if (!job) return;
    const newDate = addDaysISO(job.dueDate || job.nextActionDate || todayISO(), days);
    const payload = { dueDate: newDate, nextActionDate: newDate };
    saveOverride(jobId, payload);
    Object.assign(job, payload);
    renderActiveView();
    showToast(`${job.company}: prazo adiado para ${formatShortDate(newDate)}`);
  }

  /* ============================ DRAWER (GAVETA LATERAL) ============================ */
  function openDrawer(jobId) {
    const job = state.jobs.find((j) => j.id === jobId);
    if (!job || !el.drawer) return;

    state.drawerJobId = jobId;
    state.drawerStage = job.stage || 'to_apply';

    if (el.drLogo) el.drLogo.outerHTML = renderLogoHtml(job.company, job.logo, state.drawerStage, true).replace('<span class="logo lg"', '<span id="drLogo" class="logo lg"');
    el.drLogo = $('drLogo');

    el.drawer.setAttribute('style', stageVars(state.drawerStage));
    if (el.drCompany) el.drCompany.textContent = `${job.company || '—'} · ${job.location || job.workModel || job.category || 'Remoto'}`;
    if (el.drRole) el.drRole.textContent = job.role || '—';

    if (el.drChips) {
      const chips = [
        `<span class="tag sensitive">💵 ${esc(job.salaryText || 'Sob consulta')}</span>`,
        fitBadgeHtml(job.fitScore)
      ];
      if (job.category) chips.push(`<span class="tag">${esc(job.category)}${job.workModel ? ' · ' + esc(job.workModel) : ''}</span>`);
      if (job.appliedDate) chips.push(`<span class="tag">Enviada ${esc(formatShortDate(job.appliedDate))}</span>`);
      if (Array.isArray(job.tags)) {
        job.tags.slice(0, 4).forEach((t) => chips.push(`<span class="tag">${esc(t)}</span>`));
      }
      el.drChips.innerHTML = chips.join('');
    }

    renderDrawerQuickActions(job);
    renderDrawerStepper();

    if (el.drStatus) {
      el.drStatus.textContent = job.status || '';
    }

    if (el.drPriority) el.drPriority.value = job.priority || '';
    if (el.drApplied) el.drApplied.value = job.appliedDate || '';
    if (el.drDue) el.drDue.value = job.dueDate || job.nextActionDate || '';
    if (el.drResume) el.drResume.value = job.resumeVersion || '';
    if (el.drContact) el.drContact.value = job.contactPerson || '';
    if (el.drNextAction) el.drNextAction.value = job.nextAction || '';
    if (el.drNotes) el.drNotes.value = job.notes || '';

    if (el.drUrl) {
      const url = safeUrl(job.url);
      el.drUrl.href = url;
      el.drUrl.hidden = url === '#';
    }
    if (el.drRestore) {
      el.drRestore.hidden = getOverride(jobId) === null;
    }

    if (el.drawerScrim) el.drawerScrim.hidden = false;
    el.drawer.classList.add('open');
    el.drawer.setAttribute('aria-hidden', 'false');
  }

  function renderDrawerQuickActions(job) {
    if (!el.drQuickActions) return;
    const btns = [];
    if (job.stage === 'inbound') {
      btns.push('<button type="button" class="btn sm primary" data-qa="qualify">✓ Qualificar (A aplicar)</button>');
    }
    if (job.stage === 'to_apply' || job.stage === 'queue' || job.stage === 'inbound') {
      btns.push('<button type="button" class="btn sm ghost" data-qa="sent">✉ Marcar Enviada hoje</button>');
    }
    if (!ARCHIVED_STAGES.has(job.stage)) {
      btns.push('<button type="button" class="btn sm ghost" data-qa="snooze">+3d no prazo</button>');
    }
    el.drQuickActions.innerHTML = btns.join('');

    el.drQuickActions.querySelectorAll('[data-qa]').forEach((b) => {
      b.addEventListener('click', () => {
        const qa = b.dataset.qa;
        if (qa === 'qualify') {
          state.drawerStage = 'to_apply';
          el.drawer.setAttribute('style', stageVars('to_apply'));
          renderDrawerStepper();
        } else if (qa === 'sent') {
          state.drawerStage = 'submitted';
          if (el.drApplied && !el.drApplied.value) el.drApplied.value = todayISO();
          if (el.drDue && !el.drDue.value) el.drDue.value = addDaysISO(todayISO(), 7);
          if (el.drNextAction && !el.drNextAction.value) el.drNextAction.value = 'Acompanhar retorno da candidatura (follow-up 7d)';
          el.drawer.setAttribute('style', stageVars('submitted'));
          renderDrawerStepper();
        } else if (qa === 'snooze') {
          if (el.drDue) el.drDue.value = addDaysISO(el.drDue.value || todayISO(), 3);
        }
      });
    });
  }

  function renderDrawerStepper() {
    if (!el.drStepper) return;
    const cur = state.drawerStage;
    const curPrimaryIdx = PRIMARY_STEP_ORDER.indexOf(cur);

    const makeStep = (stKey, idx = -1) => {
      const st = stageInfo(stKey);
      const isCurrent = cur === stKey || (stKey === 'to_apply' && cur === 'queue') || (stKey === 'interview' && cur === 'advisory');
      const isDone = curPrimaryIdx >= 0 && idx >= 0 && idx < curPrimaryIdx;
      const cls = isCurrent ? 'step current' : isDone ? 'step done' : 'step';
      return `<button type="button" class="${cls}" data-step="${stKey}" style="${stageVars(stKey)}">${esc(st.label)}</button>`;
    };

    const mainRow = PRIMARY_STEP_ORDER.map((k, i) => makeStep(k, i)).join('');
    const altRow = ALT_STEP_ORDER.map((k) => makeStep(k)).join('');

    el.drStepper.innerHTML = `
      <div class="stepper">${mainRow}</div>
      <div class="stepper-alt">${altRow}</div>
    `;

    el.drStepper.querySelectorAll('[data-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.drawerStage = btn.dataset.step;
        el.drawer.setAttribute('style', stageVars(state.drawerStage));
        if (state.drawerStage === 'submitted' && el.drApplied && !el.drApplied.value) {
          el.drApplied.value = todayISO();
        }
        renderDrawerStepper();
      });
    });
  }

  function closeDrawer() {
    if (!el.drawer) return;
    el.drawer.classList.remove('open');
    el.drawer.setAttribute('aria-hidden', 'true');
    if (el.drawerScrim) el.drawerScrim.hidden = true;
    state.drawerJobId = null;
  }

  function saveDrawer(e) {
    e.preventDefault();
    const job = state.jobs.find((j) => j.id === state.drawerJobId);
    if (!job) return;

    const due = el.drDue ? el.drDue.value : '';
    const payload = {
      stage: state.drawerStage || job.stage,
      priority: el.drPriority ? el.drPriority.value : '',
      appliedDate: el.drApplied ? el.drApplied.value : '',
      dueDate: due,
      nextActionDate: due,
      resumeVersion: el.drResume ? el.drResume.value.trim() : '',
      contactPerson: el.drContact ? el.drContact.value.trim() : '',
      nextAction: el.drNextAction ? el.drNextAction.value.trim() : '',
      notes: el.drNotes ? el.drNotes.value.trim() : ''
    };

    saveOverride(job.id, payload);
    Object.assign(job, payload);
    closeDrawer();
    renderActiveView();
    showToast(`Salvo: ${job.company}`);
  }

  function restoreDrawerJob() {
    const id = state.drawerJobId;
    if (!id) return;
    removeOverride(id);
    loadJobs();
    closeDrawer();
    renderActiveView();
    showToast('Vaga restaurada para o estado original');
  }

  /* ============================ MODALS ============================ */
  function openExportModal() {
    if (!el.exportModal) return;
    if (el.exportJson) el.exportJson.value = JSON.stringify(getAllOverrides(), null, 2);
    el.exportModal.showModal();
  }

  function openNewJobModal() {
    if (!el.newJobModal) return;
    if (el.newJobForm) el.newJobForm.reset();
    el.newJobModal.showModal();
  }

  function handleNewJobSubmit(e) {
    e.preventDefault();
    const company = el.njCompany.value.trim();
    const role = el.njRole.value.trim();
    const category = el.njCategory.value;
    const stage = el.njStage.value;
    const salaryText = el.njSalary.value.trim();
    const fitRaw = el.njFit.value.trim();
    const url = el.njUrl.value.trim();
    const notes = el.njNotes.value.trim();

    const slug = norm(company).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vaga';
    const id = `manual-${slug}-${Date.now()}`;
    const today = todayISO();

    const newJob = {
      id,
      company,
      role,
      category,
      stage,
      salaryText: salaryText || null,
      salaryMin: null,
      salaryMax: null,
      currency: category === 'Internacional' ? 'USD' : 'BRL',
      fitScore: fitRaw ? parseFloat(fitRaw) : null,
      url,
      date: today,
      appliedDate: stage === 'submitted' ? today : null,
      dueDate: today,
      nextActionDate: today,
      notes: notes || null,
      priority: 'Alta'
    };

    saveOverride(id, newJob);
    state.jobs.unshift(newJob);
    el.newJobModal.close();
    renderActiveView();
    showToast(`Vaga cadastrada: ${company}`);
  }

  /* ============================ EVENTS ============================ */
  function bindEvents() {
    // Sidebar nav
    document.querySelectorAll('.sb-item[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Overview links ("Ver agenda", "Abrir kanban")
    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.goto));
    });

    // Legenda lateral clicável -> Tabela na etapa
    if (el.sbLegend) {
      el.sbLegend.addEventListener('click', (e) => {
        const li = e.target.closest('[data-stage-jump]');
        if (!li) return;
        state.tableStage = li.dataset.stageJump;
        switchView('table');
      });
    }

    // Busca com debounce + atalho Cmd/Ctrl+K
    if (el.searchInput) {
      let timer;
      el.searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.search = norm(e.target.value.trim());
          renderActiveView();
        }, 120);
      });
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (el.searchInput) {
          el.searchInput.focus();
          el.searchInput.select();
        }
      } else if (e.key === 'Escape') {
        if (el.drawer && el.drawer.classList.contains('open')) {
          closeDrawer();
        } else if (document.activeElement === el.searchInput && el.searchInput.value) {
          el.searchInput.value = '';
          state.search = '';
          renderActiveView();
        }
      }
    });

    // Privacidade
    if (el.privacyModeBtn) el.privacyModeBtn.addEventListener('click', () => applyPrivacy(!state.privacy));
    if (el.turnOffPrivacyBtn) el.turnOffPrivacyBtn.addEventListener('click', () => applyPrivacy(false));

    // Kanban controles
    if (el.kanbanRegion) {
      el.kanbanRegion.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-region]');
        if (!btn) return;
        state.kanbanRegion = btn.dataset.region;
        el.kanbanRegion.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
        renderKanban();
      });
    }
    if (el.hideArchived) {
      el.hideArchived.addEventListener('change', (e) => {
        state.hideArchived = e.target.checked;
        renderKanban();
      });
    }

    // Tabela controles
    if (el.tableStageChips) {
      el.tableStageChips.addEventListener('click', (e) => {
        const chip = e.target.closest('button[data-stage]');
        if (!chip) return;
        state.tableStage = chip.dataset.stage;
        renderTable();
      });
    }
    if (el.tableRegion) {
      el.tableRegion.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-region]');
        if (!btn) return;
        state.tableRegion = btn.dataset.region;
        el.tableRegion.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
        renderTable();
      });
    }
    document.querySelectorAll('.data-table th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (state.sortField === field) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortField = field;
          state.sortDir = (field === 'fitScore' || field === 'salary' || field === 'date') ? 'desc' : 'asc';
        }
        renderTable();
      });
    });

    // Gaveta
    if (el.drawerForm) el.drawerForm.addEventListener('submit', saveDrawer);
    if (el.drClose) el.drClose.addEventListener('click', closeDrawer);
    if (el.drCancel) el.drCancel.addEventListener('click', closeDrawer);
    if (el.drawerScrim) el.drawerScrim.addEventListener('click', closeDrawer);
    if (el.drRestore) el.drRestore.addEventListener('click', restoreDrawerJob);

    // Modais
    if (el.exportChangesBtn) el.exportChangesBtn.addEventListener('click', openExportModal);
    if (el.addJobBtn) el.addJobBtn.addEventListener('click', openNewJobModal);
    if (el.newJobForm) el.newJobForm.addEventListener('submit', handleNewJobSubmit);

    document.querySelectorAll('dialog [data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dlg = btn.closest('dialog');
        if (dlg) dlg.close();
      });
    });
    [el.exportModal, el.newJobModal].forEach((dlg) => {
      if (!dlg) return;
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    });

    if (el.copyJsonBtn) {
      el.copyJsonBtn.addEventListener('click', () => {
        if (!el.exportJson) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(el.exportJson.value).then(() => showToast('JSON copiado!'));
        } else {
          el.exportJson.select();
          document.execCommand('copy');
          showToast('JSON copiado!');
        }
      });
    }

    if (el.downloadJsonBtn) {
      el.downloadJsonBtn.addEventListener('click', () => {
        const blob = new Blob([el.exportJson.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline_overrides_${todayISO()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Download JSON iniciado.');
      });
    }

    if (el.clearAllLocalBtn) {
      el.clearAllLocalBtn.addEventListener('click', () => {
        if (!confirm('Apagar todas as alterações locais salvas neste navegador?')) return;
        Object.keys(getAllOverrides()).forEach((id) => removeOverride(id));
        if (el.exportModal) el.exportModal.close();
        loadJobs();
        renderActiveView();
        showToast('Alterações locais removidas.');
      });
    }

    // Fallback limpo para logos externos que falharem
    document.addEventListener('error', (e) => {
      if (e.target && e.target.tagName === 'IMG' && e.target.closest('.logo')) {
        e.target.remove();
      }
    }, true);
  }

  /* ============================ INIT ============================ */
  function init() {
    loadJobs();
    updateLocalChangesBadge();

    let initialView = 'overview';
    let initialPrivacy = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const qView = params.get('view');
      if (qView && VIEW_META[qView]) initialView = qView;
      if (params.get('privacy') === '1' || params.get('privacy') === 'true') initialPrivacy = true;

      if (!qView) {
        const savedView = localStorage.getItem('demo_pref_view');
        if (savedView && VIEW_META[savedView]) initialView = savedView;
      }
      if (!params.has('privacy')) {
        if (localStorage.getItem('demo_pref_privacy') === 'true') initialPrivacy = true;
      }
    } catch {}

    applyPrivacy(initialPrivacy);
    bindEvents();
    switchView(initialView, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
