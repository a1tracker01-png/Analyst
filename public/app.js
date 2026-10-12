/**
 * VIRALRADAR AI — Frontend Application Logic
 * Instagram Tech & AI Competitor Intelligence
 */

const STATE = {
  currentTab: 'reels',
  currentTimeframe: '24h',
  currentSort: 'views',
  currentCreator: 'all',
  searchQuery: '',
  discoverySubNiche: 'all',
  competitors: [],
  reels: [],
  fastBoomReels: [],
  discoveryCreators: [],
  savedIdeas: [],
  activeBlueprintReel: null
};

// DOM Elements Cache
const DOM = {
  // Tabs
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  reelsCountBadge: document.getElementById('reelsCountBadge'),
  fastBoomCountBadge: document.getElementById('fastBoomCountBadge'),
  competitorsCountBadge: document.getElementById('competitorsCountBadge'),
  vaultCountBadge: document.getElementById('vaultCountBadge'),

  // KPIs
  kpiCompetitorsCount: document.getElementById('kpiCompetitorsCount'),
  kpiBoomCount: document.getElementById('kpiBoomCount'),
  kpiPeakVelocity: document.getElementById('kpiPeakVelocity'),

  // Toolbar
  timeframePills: document.getElementById('timeframePills'),
  sortSelector: document.getElementById('sortSelector'),
  creatorFilter: document.getElementById('creatorFilter'),
  reelsSearchInput: document.getElementById('reelsSearchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  visibleReelsCount: document.getElementById('visibleReelsCount'),
  timeframeDisplayTag: document.getElementById('timeframeDisplayTag'),
  sortDisplayTag: document.getElementById('sortDisplayTag'),

  // Grids
  reelsGrid: document.getElementById('reelsGrid'),
  fastBoomGrid: document.getElementById('fastBoomGrid'),
  competitorsGrid: document.getElementById('competitorsGrid'),
  discoveryGrid: document.getElementById('discoveryGrid'),
  vaultGrid: document.getElementById('vaultGrid'),

  // Fast Boom Hero Stats
  boomStatSupernova: document.getElementById('boomStatSupernova'),
  boomStatFastBoom: document.getElementById('boomStatFastBoom'),
  boomStatEarly: document.getElementById('boomStatEarly'),

  // Discovery Filter
  discoveryNicheFilter: document.getElementById('discoveryNicheFilter'),

  // Modals & Forms
  addCompetitorModal: document.getElementById('addCompetitorModal'),
  inputCompetitorHandle: document.getElementById('inputCompetitorHandle'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnShowAddCompFromTab: document.getElementById('btnShowAddCompFromTab'),
  btnDailySyncAll: document.getElementById('btnDailySyncAll'),
  btnCloseAddModal: document.getElementById('btnCloseAddModal'),
  btnCancelAddModal: document.getElementById('btnCancelAddModal'),
  btnSubmitAddModal: document.getElementById('btnSubmitAddModal'),
  addCompStatusMsg: document.getElementById('addCompStatusMsg'),

  btnToggleAdvancedAdd: document.getElementById('btnToggleAdvancedAdd'),
  advancedAddFields: document.getElementById('advancedAddFields'),
  advancedChevron: document.getElementById('advancedChevron'),
  inputCompRealName: document.getElementById('inputCompRealName'),
  inputCompRealFollowers: document.getElementById('inputCompRealFollowers'),
  inputCompRealBio: document.getElementById('inputCompRealBio'),
  inputCompAvgViews: document.getElementById('inputCompAvgViews'),
  inputCompNiche: document.getElementById('inputCompNiche'),

  // Edit Competitor Modal
  editCompetitorModal: document.getElementById('editCompetitorModal'),
  editCompUsername: document.getElementById('editCompUsername'),
  editCompHandleDisplay: document.getElementById('editCompHandleDisplay'),
  editCompName: document.getElementById('editCompName'),
  editCompFollowers: document.getElementById('editCompFollowers'),
  editCompBio: document.getElementById('editCompBio'),
  editCompAvgViews: document.getElementById('editCompAvgViews'),
  editCompNiche: document.getElementById('editCompNiche'),
  btnCloseEditModal: document.getElementById('btnCloseEditModal'),
  btnCancelEditModal: document.getElementById('btnCancelEditModal'),
  btnSaveEditModal: document.getElementById('btnSaveEditModal'),

  // Add Reel Modal
  btnOpenAddReelModal: document.getElementById('btnOpenAddReelModal'),
  addReelModal: document.getElementById('addReelModal'),
  addReelCreatorSelect: document.getElementById('addReelCreatorSelect'),
  addReelPermalink: document.getElementById('addReelPermalink'),
  addReelViews: document.getElementById('addReelViews'),
  addReelLikes: document.getElementById('addReelLikes'),
  addReelTopic: document.getElementById('addReelTopic'),
  addReelCaption: document.getElementById('addReelCaption'),
  btnCloseAddReelModal: document.getElementById('btnCloseAddReelModal'),
  btnCancelAddReelModal: document.getElementById('btnCancelAddReelModal'),
  btnSubmitAddReelModal: document.getElementById('btnSubmitAddReelModal'),

  quickAddInput: document.getElementById('quickAddInput'),
  btnQuickAdd: document.getElementById('btnQuickAdd'),

  blueprintModal: document.getElementById('blueprintModal'),
  blueprintModalBody: document.getElementById('blueprintModalBody'),
  btnCloseBlueprintModal: document.getElementById('btnCloseBlueprintModal'),
  btnCopyScript: document.getElementById('btnCopyScript'),
  btnSaveFromBlueprint: document.getElementById('btnSaveFromBlueprint'),

  // Global actions
  btnExportCsv: document.getElementById('btnExportCsv'),
  btnRefreshAll: document.getElementById('btnRefreshAll'),
  btnSaveScraperSettings: document.getElementById('btnSaveScraperSettings'),
  igSessionIdInput: document.getElementById('igSessionIdInput'),
  apifyTokenInput: document.getElementById('apifyTokenInput'),
  rapidApiKeyInput: document.getElementById('rapidApiKeyInput'),
  toastContainer: document.getElementById('toastContainer'),
  clockDisplay: document.getElementById('clockDisplay')
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupEventListeners();
  loadAllData();
});

function initClock() {
  function update() {
    const now = new Date();
    DOM.clockDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}

function setupEventListeners() {
  // Nav Tabs switching
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Timeframe pills
  DOM.timeframePills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    DOM.timeframePills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    STATE.currentTimeframe = btn.dataset.timeframe;
    updateTimeframeTag();
    fetchReels();
  });

  // Sort dropdown
  DOM.sortSelector.addEventListener('change', (e) => {
    STATE.currentSort = e.target.value;
    updateSortTag();
    fetchReels();
  });

  // Creator filter
  DOM.creatorFilter.addEventListener('change', (e) => {
    STATE.currentCreator = e.target.value;
    fetchReels();
  });

  // Search input
  let searchTimeout = null;
  DOM.reelsSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    STATE.searchQuery = val;
    DOM.btnClearSearch.style.display = val ? 'inline-block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchReels();
    }, 250);
  });

  DOM.btnClearSearch.addEventListener('click', () => {
    DOM.reelsSearchInput.value = '';
    STATE.searchQuery = '';
    DOM.btnClearSearch.style.display = 'none';
    fetchReels();
  });

  // Discovery Sub-Niche filter
  DOM.discoveryNicheFilter.addEventListener('click', (e) => {
    const chip = e.target.closest('.subniche-chip');
    if (!chip) return;
    DOM.discoveryNicheFilter.querySelectorAll('.subniche-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    STATE.discoverySubNiche = chip.dataset.niche;
    fetchDiscovery();
  });

  // Modal actions
  DOM.btnOpenAddModal.addEventListener('click', () => openAddModal());
  if (DOM.btnShowAddCompFromTab) {
    DOM.btnShowAddCompFromTab.addEventListener('click', () => openAddModal());
  }
  DOM.btnCloseAddModal.addEventListener('click', () => closeAddModal());
  DOM.btnCancelAddModal.addEventListener('click', () => closeAddModal());
  DOM.btnSubmitAddModal.addEventListener('click', () => submitAddModal());

  // Quick add inline
  if (DOM.btnQuickAdd) {
    DOM.btnQuickAdd.addEventListener('click', () => {
      const val = DOM.quickAddInput.value.trim();
      if (!val) {
        showToast('Please enter an Instagram handle.', 'error');
        return;
      }
      addCompetitorHandle(val);
      DOM.quickAddInput.value = '';
    });
  }

  // Suggestion tags in modal
  document.querySelectorAll('.sugg-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      DOM.inputCompetitorHandle.value = tag.dataset.user;
    });
  });

  // Blueprint modal close
  DOM.btnCloseBlueprintModal.addEventListener('click', () => {
    DOM.blueprintModal.classList.remove('show');
  });

  DOM.btnCopyScript.addEventListener('click', () => {
    if (STATE.activeBlueprintReel) {
      const text = generateFullScriptText(STATE.activeBlueprintReel);
      navigator.clipboard.writeText(text).then(() => {
        showToast('Replication script copied to clipboard!', 'success');
      });
    }
  });

  DOM.btnSaveFromBlueprint.addEventListener('click', () => {
    if (STATE.activeBlueprintReel) {
      saveReelToVault(STATE.activeBlueprintReel);
    }
  });

  // Global buttons
  DOM.btnExportCsv.addEventListener('click', () => {
    window.location.href = '/api/export/csv';
    showToast('Exporting reels data to CSV...', 'info');
  });

  DOM.btnRefreshAll.addEventListener('click', async () => {
    showToast('Refreshing all competitor feeds with public scraper...', 'info');
    try {
      const res = await fetch('/api/competitors/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Feeds refreshed successfully!', 'success');
        loadAllData();
      }
    } catch (e) {
      showToast('Error refreshing feeds: ' + e.message, 'error');
    }
  });

  // Daily Follower Sync button listener
  if (DOM.btnDailySyncAll) {
    DOM.btnDailySyncAll.addEventListener('click', async () => {
      showToast('Syncing daily follower changes for all competitors...', 'info');
      try {
        const res = await fetch('/api/competitors/daily-sync', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          await fetchCompetitors();
          await fetchReels();
          await fetchFastBoom();
        } else {
          showToast(data.message || 'Daily sync failed', 'error');
        }
      } catch (err) {
        showToast('Error syncing daily stats: ' + err.message, 'error');
      }
    });
  }

  // Advanced add fields toggle
  if (DOM.btnToggleAdvancedAdd) {
    DOM.btnToggleAdvancedAdd.addEventListener('click', () => {
      const isHidden = DOM.advancedAddFields.style.display === 'none';
      DOM.advancedAddFields.style.display = isHidden ? 'block' : 'none';
      if (DOM.advancedChevron) DOM.advancedChevron.textContent = isHidden ? '▴' : '▾';
    });
  }

  // Edit Competitor modal listeners
  if (DOM.btnCloseEditModal) DOM.btnCloseEditModal.addEventListener('click', closeEditModal);
  if (DOM.btnCancelEditModal) DOM.btnCancelEditModal.addEventListener('click', closeEditModal);
  if (DOM.btnSaveEditModal) DOM.btnSaveEditModal.addEventListener('click', submitEditCompetitorModal);

  // Add Reel modal listeners
  if (DOM.btnOpenAddReelModal) DOM.btnOpenAddReelModal.addEventListener('click', openAddReelModal);
  if (DOM.btnCloseAddReelModal) DOM.btnCloseAddReelModal.addEventListener('click', closeAddReelModal);
  if (DOM.btnCancelAddReelModal) DOM.btnCancelAddReelModal.addEventListener('click', closeAddReelModal);
  if (DOM.btnSubmitAddReelModal) DOM.btnSubmitAddReelModal.addEventListener('click', submitAddReelModal);

  // Scraper Settings save
  if (DOM.btnSaveScraperSettings) {
    DOM.btnSaveScraperSettings.addEventListener('click', async () => {
      const instagramSessionId = DOM.igSessionIdInput ? DOM.igSessionIdInput.value.trim() : '';
      const apifyToken = DOM.apifyTokenInput ? DOM.apifyTokenInput.value.trim() : '';
      const rapidApiKey = DOM.rapidApiKeyInput ? DOM.rapidApiKeyInput.value.trim() : '';
      try {
        const res = await fetch('/api/scraper/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instagramSessionId, apifyToken, rapidApiKey })
        });
        const data = await res.json();
        if (data.success) {
          // Persist locally
          if (instagramSessionId) localStorage.setItem('vr_ig_session', instagramSessionId);
          if (apifyToken) localStorage.setItem('vr_apify_token', apifyToken);
          if (rapidApiKey) localStorage.setItem('vr_rapidapi_key', rapidApiKey);

          showToast('Scraper configuration saved! Live sync ready.', 'success');
        }
      } catch (e) {
        showToast('Failed to save settings: ' + e.message, 'error');
      }
    });
  }
}

function switchTab(tabId) {
  STATE.currentTab = tabId;
  DOM.navTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  DOM.tabPanes.forEach(p => p.classList.toggle('active', p.id === `pane${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`));

  if (tabId === 'reels') fetchReels();
  if (tabId === 'fastboom') fetchFastBoom();
  if (tabId === 'competitors') fetchCompetitors();
  if (tabId === 'discovery') fetchDiscovery();
  if (tabId === 'vault') fetchSavedIdeas();
}

function updateTimeframeTag() {
  const map = {
    '24h': 'Past 24 Hours',
    '2d': 'Past 2 Days',
    '4d': 'Past 4 Days',
    '1w': 'Past 1 Week',
    'all': 'All Tracked Time'
  };
  DOM.timeframeDisplayTag.textContent = map[STATE.currentTimeframe] || 'Past 24 Hours';
}

function updateSortTag() {
  const map = {
    'views': 'Most Popular (Views)',
    'velocity': 'Velocity (Views/Hr)',
    'engagement': 'Engagement Rate (%)',
    'viralScore': 'Viral Outlier Score',
    'likes': 'Most Likes',
    'recent': 'Newest First'
  };
  DOM.sortDisplayTag.textContent = map[STATE.currentSort] || 'Most Popular (Views)';
}

// ==========================================
// DATA FETCHING
// ==========================================
async function loadAllData() {
  await loadScraperSettings();
  await fetchCompetitors();
  await fetchReels();
  await fetchFastBoom();
  await fetchDiscovery();
  await fetchSavedIdeas();
}

// Fetch Competitors list
async function fetchCompetitors() {
  try {
    const res = await fetch('/api/competitors');
    const data = await res.json();
    if (data.success) {
      STATE.competitors = data.competitors;
      DOM.competitorsCountBadge.textContent = data.count;
      DOM.kpiCompetitorsCount.textContent = data.count;

      // Update creator filter dropdown
      populateCreatorFilter(data.competitors);
      // Render competitors grid
      renderCompetitorsGrid(data.competitors);
    }
  } catch (err) {
    console.error('Error fetching competitors:', err);
  }
}

function populateCreatorFilter(competitors) {
  const currentVal = DOM.creatorFilter.value;
  DOM.creatorFilter.innerHTML = '<option value="all">All Competitors</option>';
  competitors.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.username;
    opt.textContent = `@${c.username} (${c.name || ''})`;
    DOM.creatorFilter.appendChild(opt);
  });
  if (currentVal) DOM.creatorFilter.value = currentVal;
}

// Fetch Reels Feed with timeframe & sorting
async function fetchReels() {
  DOM.reelsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Filtering reels for ${DOM.timeframeDisplayTag.textContent}...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams({
      timeframe: STATE.currentTimeframe,
      sort: STATE.currentSort,
      creator: STATE.currentCreator,
      search: STATE.searchQuery
    });

    const res = await fetch(`/api/reels?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      STATE.reels = data.reels;
      DOM.reelsCountBadge.textContent = data.count;
      DOM.visibleReelsCount.textContent = data.count;
      renderReelsGrid(data.reels);
    }
  } catch (err) {
    DOM.reelsGrid.innerHTML = `<div class="empty-state"><h3>Error loading reels</h3><p>${err.message}</p></div>`;
  }
}

// Fetch Fast-Boom Alerts
async function fetchFastBoom() {
  try {
    const res = await fetch('/api/fast-boom');
    const data = await res.json();
    if (data.success) {
      STATE.fastBoomReels = data.reels;
      DOM.fastBoomCountBadge.textContent = data.count;
      DOM.kpiBoomCount.textContent = data.stats.supernova + data.stats.fastBoom;

      // Update hero stat cards
      DOM.boomStatSupernova.textContent = data.stats.supernova;
      DOM.boomStatFastBoom.textContent = data.stats.fastBoom;
      DOM.boomStatEarly.textContent = data.stats.earlySignals;

      // Find peak velocity
      if (data.reels.length > 0) {
        const peak = Math.max(...data.reels.map(r => r.velocity || 0));
        DOM.kpiPeakVelocity.textContent = formatCompactNumber(peak) + ' v/h';
      }

      renderFastBoomGrid(data.reels);
    }
  } catch (err) {
    console.error('Error fetching fast boom:', err);
  }
}

// Fetch Tech & AI Discovery creators
async function fetchDiscovery() {
  try {
    const params = new URLSearchParams({
      subNiche: STATE.discoverySubNiche
    });
    const res = await fetch(`/api/discovery?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      STATE.discoveryCreators = data.creators;
      renderDiscoveryGrid(data.creators);
    }
  } catch (err) {
    console.error('Error fetching discovery:', err);
  }
}

// Fetch Saved Ideas Vault
async function fetchSavedIdeas() {
  try {
    const res = await fetch('/api/saved-ideas');
    const data = await res.json();
    if (data.success) {
      STATE.savedIdeas = data.ideas;
      DOM.vaultCountBadge.textContent = data.count;
      renderVaultGrid(data.ideas);
    }
  } catch (err) {
    console.error('Error fetching saved ideas:', err);
  }
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

// 1. Render Reels Grid
function renderReelsGrid(reels) {
  if (!reels || reels.length === 0) {
    DOM.reelsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3>No Reels Found</h3>
        <p>No competitor reels matched the selected timeframe (${DOM.timeframeDisplayTag.textContent}) or search criteria. Try selecting "Past 1 Week" or "All Time".</p>
      </div>
    `;
    return;
  }

  DOM.reelsGrid.innerHTML = reels.map(r => createReelCardHtml(r)).join('');
  attachReelCardEvents(DOM.reelsGrid);
}

// 2. Render Fast-Boom Grid
function renderFastBoomGrid(reels) {
  if (!reels || reels.length === 0) {
    DOM.fastBoomGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚡</span>
        <h3>No High-Velocity Breakouts Right Now</h3>
        <p>All tracked reels are currently pacing at standard view velocity. Check back as new posts gain traction.</p>
      </div>
    `;
    return;
  }

  DOM.fastBoomGrid.innerHTML = reels.map(r => createFastBoomCardHtml(r)).join('');
  attachReelCardEvents(DOM.fastBoomGrid);
}

// Helper to create HTML for a standard reel card
function createReelCardHtml(r) {
  const isFresh = r.ageHours <= 24;
  const ageDisplay = formatAgeHours(r.ageHours);
  
  let boomBadgeHtml = '';
  if (r.boomLevel === 'SUPERNOVA') {
    boomBadgeHtml = `<span class="badge-supernova">🔥 SUPERNOVA (${r.outlierMultiplier}x)</span>`;
  } else if (r.boomLevel === 'FAST_BOOM') {
    boomBadgeHtml = `<span class="badge-fastboom">⚡ FAST BOOM (${r.outlierMultiplier}x)</span>`;
  } else if (r.boomLevel === 'TRENDING') {
    boomBadgeHtml = `<span class="badge-rising">🚀 TRENDING (${r.outlierMultiplier}x)</span>`;
  }

  return `
    <article class="reel-card" data-reel-id="${r.id}">
      <div class="reel-creator-bar">
        <div class="reel-creator-meta">
          <img src="${r.creator?.avatar}" alt="${r.creator?.name}" class="creator-avatar" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(r.creator?.username || 'user')}&background=8b5cf6&color=ffffff'">
          <div class="creator-info-text">
            <span class="creator-name">${escapeHtml(r.creator?.name || r.creator?.username)}</span>
            <span class="creator-handle">${escapeHtml(r.creator?.handle || '@' + r.creator?.username)}</span>
          </div>
        </div>
        <span class="reel-age-chip ${isFresh ? 'fresh' : ''}">⏱️ ${ageDisplay}</span>
      </div>

      <div class="reel-media-wrapper">
        <img src="${r.thumbnail}" alt="Thumbnail" class="reel-thumb" loading="lazy">
        <div class="media-badges">
          ${boomBadgeHtml}
        </div>
        <div class="velocity-badge">
          ⚡ ${formatCompactNumber(r.velocity)} views/hr
        </div>
      </div>

      <div class="reel-body">
        <div class="reel-topic-tag">${escapeHtml(r.topic || 'Tech & AI Insights')}</div>
        <p class="reel-caption">${escapeHtml(r.caption)}</p>

        <div class="reel-metrics-row">
          <div class="metric-col">
            <span class="metric-lbl">Views</span>
            <span class="metric-data metric-highlight">${formatCompactNumber(r.views)}</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Likes</span>
            <span class="metric-data">${formatCompactNumber(r.likes)}</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Engagement</span>
            <span class="metric-data">${r.engagementRate}%</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Outlier</span>
            <span class="metric-data metric-outlier">${r.outlierMultiplier}x</span>
          </div>
        </div>

        <div class="reel-hook-pill">
          <span>🎯</span>
          <span><strong>Hook:</strong> ${escapeHtml(r.hookType || 'Problem-Agitation Hook')}</span>
        </div>

        <div class="reel-card-actions">
          <button class="btn btn-primary btn-sm btn-action-blueprint" data-id="${r.id}">
            🚀 Replicate Blueprint
          </button>
          <button class="btn btn-secondary btn-sm btn-action-save" data-id="${r.id}" title="Save to Idea Vault">
            ⭐
          </button>
          <a href="${r.permalink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open on Instagram">
            ↗
          </a>
        </div>
      </div>
    </article>
  `;
}

// Helper to create HTML for a Fast-Boom card with blueprint teaser
function createFastBoomCardHtml(r) {
  const ageDisplay = formatAgeHours(r.ageHours);
  
  let boomBadgeHtml = '';
  if (r.boomLevel === 'SUPERNOVA') {
    boomBadgeHtml = `<span class="badge-supernova">🔥 SUPERNOVA OUTLIER</span>`;
  } else {
    boomBadgeHtml = `<span class="badge-fastboom">⚡ FAST BOOM ALERT</span>`;
  }

  return `
    <article class="reel-card fastboom-card" data-reel-id="${r.id}">
      <div class="reel-creator-bar">
        <div class="reel-creator-meta">
          <img src="${r.creator?.avatar}" alt="${r.creator?.name}" class="creator-avatar" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(r.creator?.username || 'user')}&background=8b5cf6&color=ffffff'">
          <div class="creator-info-text">
            <span class="creator-name">${escapeHtml(r.creator?.name || r.creator?.username)}</span>
            <span class="creator-handle">${escapeHtml(r.creator?.handle || '@' + r.creator?.username)}</span>
          </div>
        </div>
        <span class="reel-age-chip fresh">⚡ Gaining Fast (${ageDisplay})</span>
      </div>

      <div class="reel-media-wrapper">
        <img src="${r.thumbnail}" alt="Thumbnail" class="reel-thumb" loading="lazy">
        <div class="media-badges">
          ${boomBadgeHtml}
        </div>
        <div class="velocity-badge">
          ⚡ ${formatCompactNumber(r.velocity)} views/hr
        </div>
      </div>

      <div class="reel-body">
        <div class="reel-topic-tag">${escapeHtml(r.topic || 'Viral Tech Alert')}</div>
        <p class="reel-caption">${escapeHtml(r.caption)}</p>

        <div class="blueprint-teaser">
          <div class="blueprint-header">
            <span>🧬 Viral Blueprint:</span>
          </div>
          <div class="blueprint-body">
            ${escapeHtml(r.breakoutBlueprint || 'High-retention demonstration with instant payoff')}
          </div>
        </div>

        <div class="reel-metrics-row">
          <div class="metric-col">
            <span class="metric-lbl">Total Views</span>
            <span class="metric-data metric-highlight">${formatCompactNumber(r.views)}</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Velocity</span>
            <span class="metric-data">${formatCompactNumber(r.velocity)}/h</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Outlier Multiplier</span>
            <span class="metric-data metric-outlier">${r.outlierMultiplier}x</span>
          </div>
          <div class="metric-col">
            <span class="metric-lbl">Viral Score</span>
            <span class="metric-data metric-highlight">${r.viralScore}/100</span>
          </div>
        </div>

        <div class="reel-card-actions">
          <button class="btn btn-primary btn-sm btn-action-blueprint" data-id="${r.id}">
            🚀 Replicate Blueprint
          </button>
          <button class="btn btn-secondary btn-sm btn-action-save" data-id="${r.id}" title="Save to Idea Vault">
            ⭐
          </button>
          <a href="${r.permalink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open on Instagram">
            ↗
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderFollowerDelta(change) {
  if (typeof change === 'number' && change > 0) {
    return `<span class="stat-growth-tag growth" title="Followers increased today">▲ +${formatCompactNumber(change)}</span>`;
  } else if (typeof change === 'number' && change < 0) {
    return `<span class="stat-growth-tag drop" title="Followers decreased today">▼ -${formatCompactNumber(Math.abs(change))}</span>`;
  }
  return `<span class="stat-growth-tag stable" title="Live follower tracking active">● Live Synced</span>`;
}

// 3. Render Competitors Grid
function renderCompetitorsGrid(competitors) {
  if (!competitors || competitors.length === 0) {
    DOM.competitorsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">👥</span>
        <h3>No Competitors Added Yet</h3>
        <p>Use the search bar above to add Tech & AI competitor Instagram accounts.</p>
      </div>
    `;
    return;
  }

  DOM.competitorsGrid.innerHTML = competitors.map(c => {
    const avatarUrl = c.avatar || `/avatars/${c.username}.jpg`;
    const fallbackUrl = c.remoteAvatar || avatarUrl;
    return `
    <div class="competitor-card">
      <div class="comp-card-top">
        <img src="${avatarUrl}" alt="${escapeHtml(c.name || c.username)}" class="comp-avatar-lg" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='/api/proxy-image?url=' + encodeURIComponent('${fallbackUrl}')">
        <div class="comp-info">
          <span class="comp-name">${escapeHtml(c.name || c.username)}</span>
          <span class="comp-handle">@${escapeHtml(c.username)}</span>
          <span class="comp-niche-badge">${escapeHtml(c.niche || 'Tech & AI')}</span>
          <span class="comp-source-tag">${escapeHtml(c.dataSource || 'Live Instagram Feeds')}</span>
        </div>
      </div>

      <p class="comp-bio">${escapeHtml(c.bio || 'Verified Tech and AI Instagram creator.')}</p>

      <!-- Follower Metrics with Daily Increase/Decrease Indicator -->
      <div class="comp-stats-row">
        <div class="comp-stat-cell">
          <span class="comp-stat-num">${formatCompactNumber(c.followers)}</span>
          <span class="comp-stat-lbl">Followers</span>
          ${renderFollowerDelta(c.followerChange)}
        </div>
        <div class="comp-stat-cell">
          <span class="comp-stat-num">${formatCompactNumber(c.avgViews)}</span>
          <span class="comp-stat-lbl">Avg Views</span>
        </div>
        <div class="comp-stat-cell">
          <span class="comp-stat-num">${c.avgEngagementRate}%</span>
          <span class="comp-stat-lbl">Eng. Rate</span>
        </div>
      </div>

      <!-- Direct Instagram Profile Redirect Button -->
      <a href="https://www.instagram.com/${escapeHtml(c.username)}/" target="_blank" rel="noopener noreferrer" class="btn btn-instagram-direct" title="Open Instagram Profile of @${escapeHtml(c.username)}">
        <svg class="ig-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span>View Instagram Profile ↗</span>
      </a>

      <div class="comp-actions">
        <button class="btn btn-secondary btn-sm btn-comp-edit" data-user="${c.username}">
          ✏️ Edit Stats
        </button>
        <button class="btn btn-secondary btn-sm btn-comp-refresh" data-user="${c.username}">
          🔄 Refresh
        </button>
        <button class="btn btn-outline-danger btn-sm btn-comp-remove" data-user="${c.username}">
          ✕ Remove
        </button>
      </div>
    </div>
  `;
  }).join('');

  // Attach button listeners
  DOM.competitorsGrid.querySelectorAll('.btn-comp-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditCompetitorModal(btn.dataset.user));
  });

  DOM.competitorsGrid.querySelectorAll('.btn-comp-refresh').forEach(btn => {
    btn.addEventListener('click', () => refreshCompetitorHandle(btn.dataset.user));
  });

  DOM.competitorsGrid.querySelectorAll('.btn-comp-remove').forEach(btn => {
    btn.addEventListener('click', () => removeCompetitorHandle(btn.dataset.user));
  });
}

// 4. Render Discovery Grid
function renderDiscoveryGrid(creators) {
  if (!creators || creators.length === 0) {
    DOM.discoveryGrid.innerHTML = `<div class="empty-state"><h3>No creators found</h3></div>`;
    return;
  }

  DOM.discoveryGrid.innerHTML = creators.map(c => `
    <div class="discovery-card">
      <div class="comp-card-top">
        <img src="${c.avatar}" alt="${c.name}" class="comp-avatar-lg" loading="lazy">
        <div class="comp-info">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="comp-name">${escapeHtml(c.name)}</span>
            <span class="growth-badge">📈 +${c.growthRate7d}% 7d</span>
          </div>
          <span class="comp-handle">@${escapeHtml(c.username)}</span>
          <span class="comp-niche-badge">${escapeHtml(c.subNiche)}</span>
        </div>
      </div>

      <div class="growth-info-box">
        <div class="growth-info-title">💡 Growth Strategy:</div>
        <p class="growth-info-desc">${escapeHtml(c.growthStrategy)}</p>
      </div>

      <div class="breakout-hook-box">
        <strong>Breakout Hook:</strong> ${escapeHtml(c.breakoutHook)}
      </div>

      <div class="comp-stats-row">
        <div>
          <span class="comp-stat-num">${formatCompactNumber(c.followers)}</span>
          <span class="comp-stat-lbl">Followers</span>
        </div>
        <div>
          <span class="comp-stat-num">+${formatCompactNumber(c.newFollowers7d)}</span>
          <span class="comp-stat-lbl">New / 7d</span>
        </div>
        <div>
          <span class="comp-stat-num">${formatCompactNumber(c.avgViews)}</span>
          <span class="comp-stat-lbl">Avg Views</span>
        </div>
      </div>

      <div style="margin-top:auto;">
        ${c.isAdded 
          ? `<button class="btn btn-secondary btn-sm" style="width:100%;" disabled>✓ In Watchlist</button>`
          : `<button class="btn btn-primary btn-sm btn-discovery-add" style="width:100%;" data-user="${c.username}">
               + Add to Competitors Watchlist
             </button>`
        }
      </div>
    </div>
  `).join('');

  DOM.discoveryGrid.querySelectorAll('.btn-discovery-add').forEach(btn => {
    btn.addEventListener('click', () => addDiscoveryCreator(btn.dataset.user));
  });
}

// 5. Render Replication Vault Grid
function renderVaultGrid(ideas) {
  if (!ideas || ideas.length === 0) {
    DOM.vaultGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">💡</span>
        <h3>Replication Vault is Empty</h3>
        <p>Click "⭐ Save to Vault" or "🚀 Replicate Blueprint" on any reel card in the Reels Feed or Fast-Boom Radar to store scripts here.</p>
      </div>
    `;
    return;
  }

  DOM.vaultGrid.innerHTML = ideas.map(item => {
    const r = item.reel;
    return `
      <div class="reel-card" data-vault-id="${item.id}">
        <div class="reel-creator-bar">
          <div class="reel-creator-meta">
            <img src="${r.creator?.avatar}" alt="${r.creator?.name}" class="creator-avatar" loading="lazy">
            <div class="creator-info-text">
              <span class="creator-name">${escapeHtml(r.creator?.name || r.creator?.username)}</span>
              <span class="creator-handle">${escapeHtml(r.creator?.handle || '@' + r.creator?.username)}</span>
            </div>
          </div>
          <button class="btn-clear btn-vault-remove" data-id="${item.id}" title="Remove from Vault">✕</button>
        </div>

        <div class="reel-body">
          <div class="reel-topic-tag">${escapeHtml(r.topic || 'Replication Idea')}</div>
          <p class="reel-caption">${escapeHtml(r.caption)}</p>

          <div class="blueprint-teaser" style="margin-bottom:0.75rem;">
            <div class="blueprint-header">📋 Script Blueprint:</div>
            <div class="blueprint-body">${escapeHtml(item.replicationPrompt || r.breakoutBlueprint)}</div>
          </div>

          <div class="reel-metrics-row">
            <div class="metric-col">
              <span class="metric-lbl">Views</span>
              <span class="metric-data">${formatCompactNumber(r.views)}</span>
            </div>
            <div class="metric-col">
              <span class="metric-lbl">Velocity</span>
              <span class="metric-data">${formatCompactNumber(r.velocity)}/h</span>
            </div>
            <div class="metric-col">
              <span class="metric-lbl">Outlier</span>
              <span class="metric-data">${r.outlierMultiplier}x</span>
            </div>
            <div class="metric-col">
              <span class="metric-lbl">Engagement</span>
              <span class="metric-data">${r.engagementRate}%</span>
            </div>
          </div>

          <div class="reel-card-actions">
            <button class="btn btn-primary btn-sm btn-vault-blueprint" data-id="${r.id}">
              🚀 Open Script Details
            </button>
            <a href="${r.permalink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="View Original">
              ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  DOM.vaultGrid.querySelectorAll('.btn-vault-remove').forEach(btn => {
    btn.addEventListener('click', () => removeVaultIdea(btn.dataset.id));
  });

  DOM.vaultGrid.querySelectorAll('.btn-vault-blueprint').forEach(btn => {
    btn.addEventListener('click', () => openBlueprintModal(btn.dataset.id));
  });
}

// Attach event handlers to reel card actions
function attachReelCardEvents(container) {
  container.querySelectorAll('.btn-action-blueprint').forEach(btn => {
    btn.addEventListener('click', () => {
      openBlueprintModal(btn.dataset.id);
    });
  });

  container.querySelectorAll('.btn-action-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const reel = findReelById(btn.dataset.id);
      if (reel) saveReelToVault(reel);
    });
  });
}

function findReelById(id) {
  return STATE.reels.find(r => r.id === id) ||
         STATE.fastBoomReels.find(r => r.id === id) ||
         STATE.savedIdeas.find(i => i.reelId === id || i.reel?.id === id)?.reel;
}

// ==========================================
// COMPETITOR MANAGEMENT OPERATIONS
// ==========================================
async function addCompetitorHandle(handle) {
  showToast(`Scraping @${handle} via public Instagram engine...`, 'info');
  try {
    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await fetchCompetitors();
      await fetchReels();
      await fetchFastBoom();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to add competitor: ' + err.message, 'error');
  }
}

async function removeCompetitorHandle(handle) {
  if (!confirm(`Are you sure you want to stop tracking @${handle}?`)) return;
  try {
    const res = await fetch(`/api/competitors/${encodeURIComponent(handle)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Removed @${handle}`, 'success');
      await fetchCompetitors();
      await fetchReels();
      await fetchFastBoom();
    }
  } catch (err) {
    showToast('Error removing: ' + err.message, 'error');
  }
}

async function refreshCompetitorHandle(handle) {
  showToast(`Refreshing data for @${handle}...`, 'info');
  try {
    const res = await fetch(`/api/competitors/refresh/${encodeURIComponent(handle)}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Refreshed @${handle}`, 'success');
      loadAllData();
    }
  } catch (err) {
    showToast('Error refreshing: ' + err.message, 'error');
  }
}

async function addDiscoveryCreator(handle) {
  showToast(`Adding @${handle} to competitor watchlist...`, 'info');
  try {
    const res = await fetch('/api/discovery/add-to-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await fetchCompetitors();
      await fetchDiscovery();
      await fetchReels();
      await fetchFastBoom();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to add creator: ' + err.message, 'error');
  }
}

// ==========================================
// REPLICATION VAULT ACTIONS
// ==========================================
async function saveReelToVault(reel) {
  try {
    const res = await fetch('/api/saved-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reel })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Saved to Replication Vault! 💡', 'success');
      fetchSavedIdeas();
    }
  } catch (err) {
    showToast('Failed to save idea: ' + err.message, 'error');
  }
}

async function removeVaultIdea(id) {
  try {
    const res = await fetch(`/api/saved-ideas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Removed idea from vault', 'info');
      fetchSavedIdeas();
    }
  } catch (err) {
    showToast('Error removing idea: ' + err.message, 'error');
  }
}

// ==========================================
// BLUEPRINT MODAL & SCRIPT GENERATOR
// ==========================================
function openBlueprintModal(reelId) {
  const reel = findReelById(reelId);
  if (!reel) return;

  STATE.activeBlueprintReel = reel;

  DOM.blueprintModalBody.innerHTML = `
    <div class="blueprint-details">
      <div class="comp-card-top" style="margin-bottom:0;">
        <img src="${reel.creator?.avatar}" alt="${reel.creator?.name}" class="comp-avatar-lg">
        <div class="comp-info">
          <span class="comp-name">${escapeHtml(reel.creator?.name || reel.creator?.username)}</span>
          <span class="comp-handle">@${escapeHtml(reel.creator?.username)}</span>
          <span class="tag-highlight" style="font-size:0.75rem; margin-top:0.2rem;">
            Topic: ${escapeHtml(reel.topic || 'Tech & AI')}
          </span>
        </div>
      </div>

      <div class="blueprint-meta-bar">
        <div>
          <span class="metric-lbl">Post Age</span>
          <span class="metric-data">${formatAgeHours(reel.ageHours)}</span>
        </div>
        <div>
          <span class="metric-lbl">Velocity</span>
          <span class="metric-data metric-highlight">${formatCompactNumber(reel.velocity)} v/h</span>
        </div>
        <div>
          <span class="metric-lbl">Outlier Multiplier</span>
          <span class="metric-data metric-outlier">${reel.outlierMultiplier}x</span>
        </div>
        <div>
          <span class="metric-lbl">Viral Score</span>
          <span class="metric-data metric-highlight">${reel.viralScore}/100</span>
        </div>
      </div>

      <div class="script-box">
        <h4>⚡ Why This Reel Is Booming (Algorithmic Rationale)</h4>
        <p>
          This video has achieved a <strong>${reel.outlierMultiplier}x view outlier multiplier</strong> compared to @${reel.creator?.username}'s median performance. The hook utilizes high urgency ("${escapeHtml(reel.hookType)}") coupled with immediate visual proof within the first 3 seconds, resulting in above-average watch time and share-rate.
        </p>
      </div>

      <div class="script-box">
        <h4>🎬 30-Second Video Replication Script (Adapted for You)</h4>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; white-space: pre-wrap;">
${escapeHtml(generateFullScriptText(reel))}
        </div>
      </div>

      <div class="reel-hook-pill">
        <span>🎵</span>
        <span><strong>Recommended Sound:</strong> ${escapeHtml(reel.sound || 'Trending Electronic Synth Beat')} ${reel.audioTrending ? '🔥 (Trending Audio)' : ''}</span>
      </div>
    </div>
  `;

  DOM.blueprintModal.classList.add('show');
}

function generateFullScriptText(reel) {
  const topic = reel.topic || 'this new AI workflow';
  return `[HOOK - 0:00 to 0:04]
Visual: Direct-to-camera with screen split showing ${topic}.
Speech: "${reel.hookType.includes('Contrarian') ? 'Stop doing this the old way in 2026.' : 'Everyone is using ChatGPT wrong, here is the secret method.'} If you want to master ${topic}, listen up."

[PROOF / AGITATION - 0:04 to 0:12]
Visual: Rapid screen capture showing side-by-side results with a 200% speed slider.
Speech: "Most creators take 3 hours to build this manually. With this tool, it took me literally 45 seconds."

[THE BREAKDOWN - 0:12 to 0:24]
Visual: 3 quick bullet steps with highlighted clicks.
Speech: "Step 1: Open the free dashboard. Step 2: Paste the template from my bio. Step 3: Hit run and let the AI agent execute."

[CALL TO ACTION - 0:24 to 0:30]
Visual: Pinned comment preview graphic.
Speech: "Comment 'WORKFLOW' below and I'll DM you the direct template before it goes paid. Save this reel so you don't lose it!"`;
}

// ==========================================
// MODAL CONTROLS & UTILITIES
// ==========================================
function openAddModal() {
  DOM.inputCompetitorHandle.value = '';
  if (DOM.inputCompRealName) DOM.inputCompRealName.value = '';
  if (DOM.inputCompRealFollowers) DOM.inputCompRealFollowers.value = '';
  if (DOM.inputCompRealBio) DOM.inputCompRealBio.value = '';
  if (DOM.inputCompAvgViews) DOM.inputCompAvgViews.value = '';
  if (DOM.inputCompNiche) DOM.inputCompNiche.value = '';
  if (DOM.advancedAddFields) DOM.advancedAddFields.style.display = 'none';
  if (DOM.advancedChevron) DOM.advancedChevron.textContent = '▾';
  DOM.addCompStatusMsg.style.display = 'none';
  DOM.addCompetitorModal.classList.add('show');
  DOM.inputCompetitorHandle.focus();
}

function closeAddModal() {
  DOM.addCompetitorModal.classList.remove('show');
}

async function submitAddModal() {
  const handle = DOM.inputCompetitorHandle.value.trim();
  if (!handle) {
    showModalMsg('Please enter an Instagram handle.', 'error');
    return;
  }

  const payload = {
    username: handle,
    name: DOM.inputCompRealName?.value.trim() || undefined,
    followers: DOM.inputCompRealFollowers?.value.trim() || undefined,
    bio: DOM.inputCompRealBio?.value.trim() || undefined,
    avgViews: DOM.inputCompAvgViews?.value.trim() || undefined,
    niche: DOM.inputCompNiche?.value.trim() || undefined
  };

  showModalMsg(`Syncing @${handle}... Checking live feed & credentials...`, 'info');
  DOM.btnSubmitAddModal.disabled = true;

  try {
    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showModalMsg(data.message, 'success');
      showToast(data.message, 'success');
      setTimeout(() => {
        closeAddModal();
        DOM.btnSubmitAddModal.disabled = false;
        loadAllData();
      }, 700);
    } else {
      showModalMsg(data.message, 'error');
      DOM.btnSubmitAddModal.disabled = false;
    }
  } catch (err) {
    showModalMsg('Error: ' + err.message, 'error');
    DOM.btnSubmitAddModal.disabled = false;
  }
}

// ==========================================
// EDIT COMPETITOR MODAL
// ==========================================
function openEditCompetitorModal(username) {
  const comp = STATE.competitors.find(c => c.username.toLowerCase() === username.toLowerCase());
  if (!comp) return;

  DOM.editCompUsername.value = comp.username;
  DOM.editCompHandleDisplay.value = `@${comp.username}`;
  DOM.editCompName.value = comp.name || comp.username;
  DOM.editCompFollowers.value = comp.followers || '';
  DOM.editCompBio.value = comp.bio || '';
  DOM.editCompAvgViews.value = comp.avgViews || '';
  DOM.editCompNiche.value = comp.niche || 'Tech & AI';

  DOM.editCompetitorModal.classList.add('show');
}

function closeEditModal() {
  DOM.editCompetitorModal.classList.remove('show');
}

async function submitEditCompetitorModal() {
  const username = DOM.editCompUsername.value;
  if (!username) return;

  const payload = {
    name: DOM.editCompName.value.trim(),
    followers: DOM.editCompFollowers.value.trim(),
    bio: DOM.editCompBio.value.trim(),
    avgViews: DOM.editCompAvgViews.value.trim(),
    niche: DOM.editCompNiche.value.trim()
  };

  try {
    const res = await fetch(`/api/competitors/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Updated real stats for @${username}!`, 'success');
      closeEditModal();
      loadAllData();
    } else {
      showToast(data.message || 'Failed to update', 'error');
    }
  } catch (err) {
    showToast('Error updating competitor: ' + err.message, 'error');
  }
}

// ==========================================
// ADD REAL REEL MODAL
// ==========================================
function openAddReelModal() {
  // Populate dropdown with tracked competitors
  DOM.addReelCreatorSelect.innerHTML = '';
  if (STATE.competitors.length === 0) {
    DOM.addReelCreatorSelect.innerHTML = '<option value="">No competitors tracked yet</option>';
  } else {
    STATE.competitors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.username;
      opt.textContent = `@${c.username} (${c.name || ''})`;
      DOM.addReelCreatorSelect.appendChild(opt);
    });
  }

  DOM.addReelPermalink.value = '';
  DOM.addReelViews.value = '';
  DOM.addReelLikes.value = '';
  DOM.addReelTopic.value = '';
  DOM.addReelCaption.value = '';

  DOM.addReelModal.classList.add('show');
}

function closeAddReelModal() {
  DOM.addReelModal.classList.remove('show');
}

async function submitAddReelModal() {
  const username = DOM.addReelCreatorSelect.value;
  const permalink = DOM.addReelPermalink.value.trim();
  const views = DOM.addReelViews.value.trim();

  if (!username) {
    showToast('Please select a competitor', 'error');
    return;
  }
  if (!permalink) {
    showToast('Please enter an Instagram reel URL', 'error');
    return;
  }
  if (!views) {
    showToast('Please enter real view count', 'error');
    return;
  }

  const payload = {
    permalink,
    views,
    likes: DOM.addReelLikes.value.trim(),
    topic: DOM.addReelTopic.value.trim(),
    caption: DOM.addReelCaption.value.trim()
  };

  try {
    const res = await fetch(`/api/competitors/${encodeURIComponent(username)}/reels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Added real reel to @${username}!`, 'success');
      closeAddReelModal();
      loadAllData();
    } else {
      showToast(data.message || 'Error adding reel', 'error');
    }
  } catch (err) {
    showToast('Failed to add reel: ' + err.message, 'error');
  }
}

// Load scraper settings from localStorage / status API
async function loadScraperSettings() {
  // Check localStorage first
  const savedSession = localStorage.getItem('vr_ig_session');
  const savedApify = localStorage.getItem('vr_apify_token');
  const savedRapid = localStorage.getItem('vr_rapidapi_key');

  if (savedSession && DOM.igSessionIdInput) DOM.igSessionIdInput.value = savedSession;
  if (savedApify && DOM.apifyTokenInput) DOM.apifyTokenInput.value = savedApify;
  if (savedRapid && DOM.rapidApiKeyInput) DOM.rapidApiKeyInput.value = savedRapid;

  // Sync to backend if localStorage has keys but backend was restarted
  if (savedSession || savedApify || savedRapid) {
    try {
      await fetch('/api/scraper/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagramSessionId: savedSession || undefined,
          apifyToken: savedApify || undefined,
          rapidApiKey: savedRapid || undefined
        })
      });
    } catch(e) {}
  }
}

function showModalMsg(text, type) {
  DOM.addCompStatusMsg.textContent = text;
  DOM.addCompStatusMsg.className = `modal-status-msg ${type}`;
  DOM.addCompStatusMsg.style.display = 'block';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function formatAgeHours(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h ago`;
}

function formatCompactNumber(num) {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
