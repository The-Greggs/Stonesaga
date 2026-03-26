'use strict';

// ===== CONSTANTS =====

const STORAGE_KEY = 'stonesaga-foraging';

const TERRAIN_PREFIXES = { forest: 'FF', prairie: 'FP', glade: 'FT' };
const TERRAIN_LABELS   = { forest: 'Forest', prairie: 'Prairie', glade: 'Glade' };
const TERRAIN_ICONS    = { forest: '🌲', prairie: '🌾', glade: '🍃' };

// ===== STATE =====

let state = {
  settings: {
    expansions: { mealsAndMyths: false, natureOfTheBeast: false }
  },
  session: {
    terrain: null,
    deck: [],
    played: [],
    currentDraw: null,
    active: false
  }
};

/** The currently highlighted terrain on the start screen (null = none selected). */
let selectedTerrain = null;

// ===== PERSISTENCE =====

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);

    if (saved.settings) {
      const exp = (saved.settings.expansions) || {};
      state.settings.expansions.mealsAndMyths   = !!exp.mealsAndMyths;
      state.settings.expansions.natureOfTheBeast = !!exp.natureOfTheBeast;
    }

    if (saved.session) {
      // Validate the saved session minimally before trusting it.
      const s = saved.session;
      state.session = {
        terrain:     (typeof s.terrain === 'string' && s.terrain in TERRAIN_LABELS) ? s.terrain : null,
        deck:        Array.isArray(s.deck)        ? s.deck        : [],
        played:      Array.isArray(s.played)      ? s.played      : [],
        currentDraw: Array.isArray(s.currentDraw) ? s.currentDraw : null,
        active:      !!s.active
      };
    }
  } catch (e) {
    console.warn('Could not load state from localStorage:', e);
  }
}

// ===== DECK BUILDING =====

/**
 * Build an ordered array of card codes for the given terrain.
 * @param {'forest'|'prairie'|'glade'} terrain
 * @param {{ mealsAndMyths: boolean, natureOfTheBeast: boolean }} expansions
 * @returns {string[]}
 */
function buildDeck(terrain, expansions) {
  const prefix = TERRAIN_PREFIXES[terrain];
  const cards = [];

  if (terrain === 'glade') {
    // Glade is entirely from Nature of the Beast: FT01–FT12.
    for (let i = 1; i <= 12; i++) {
      cards.push(prefix + String(i).padStart(2, '0'));
    }
  } else {
    // Forest / Prairie: base set 01–12.
    for (let i = 1; i <= 12; i++) {
      cards.push(prefix + String(i).padStart(2, '0'));
    }
    // Nature of the Beast adds card 15 (not 13 or 14).
    if (expansions.natureOfTheBeast) {
      cards.push(prefix + '15');
    }
  }

  return cards;
}

// ===== SHUFFLE =====

/** Fisher-Yates in-place shuffle. */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

/** Insert a single card at a uniformly-random position in the deck. */
function shuffleCardBack(deck, card) {
  const pos = Math.floor(Math.random() * (deck.length + 1));
  deck.splice(pos, 0, card);
}

// ===== SCREEN MANAGEMENT =====

const ALL_SCREENS = ['start', 'foraging', 'settings'];

function renderScreen(name) {
  ALL_SCREENS.forEach(id => {
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.toggle('hidden', id !== name);
  });
}

function applyTerrainTheme(terrain) {
  document.body.classList.remove('terrain-forest', 'terrain-prairie', 'terrain-glade');
  if (terrain && terrain in TERRAIN_LABELS) {
    document.body.classList.add('terrain-' + terrain);
  }
}

// ===== START SCREEN =====

function renderStartScreen() {
  const nb = state.settings.expansions.natureOfTheBeast;

  // Glade is only available with Nature of the Beast.
  const gladeBtn = document.getElementById('btn-terrain-glade');
  gladeBtn.disabled = !nb;

  // If the user previously selected Glade but has since deactivated NatB, deselect.
  if (!nb && selectedTerrain === 'glade') {
    selectedTerrain = null;
  }

  // Highlight the selected terrain button.
  document.querySelectorAll('.btn-terrain').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.terrain === selectedTerrain);
  });

  // Enable Begin only when a terrain is chosen.
  document.getElementById('btn-begin').disabled = (selectedTerrain === null);

  // Resume banner vs. new-session panel.
  const hasActive = state.session.active;
  document.getElementById('resume-banner').classList.toggle('hidden', !hasActive);
  document.getElementById('new-session-panel').classList.toggle('hidden', hasActive);

  if (hasActive && state.session.terrain) {
    const t = state.session.terrain;
    document.getElementById('resume-terrain-label').textContent =
      TERRAIN_ICONS[t] + ' ' + TERRAIN_LABELS[t];
  }

  // Keep the settings toggles in sync.
  document.getElementById('toggle-meals-myths').checked = state.settings.expansions.mealsAndMyths;
  document.getElementById('toggle-nature-beast').checked = nb;

  applyTerrainTheme(selectedTerrain || null);
}

// ===== FORAGING SCREEN =====

function renderForagingScreen() {
  const sess = state.session;

  const icon  = TERRAIN_ICONS[sess.terrain]  || '';
  const label = TERRAIN_LABELS[sess.terrain] || '';
  document.getElementById('foraging-terrain-label').textContent = icon + ' ' + label + ' Foraging';
  document.getElementById('deck-count').textContent = sess.deck.length;

  applyTerrainTheme(sess.terrain);
  renderDrawZone();
  renderPlayedList();
}

function renderDrawZone() {
  const sess = state.session;
  const zone = document.getElementById('draw-zone');
  zone.innerHTML = '';
  zone.className = 'draw-zone';

  // ── Session has ended ──────────────────────────────────────────────────────
  if (!sess.active) {
    const div = document.createElement('div');
    div.className = 'end-message';

    const heading = document.createElement('h3');
    heading.textContent = 'Session Complete';
    div.appendChild(heading);

    const info = document.createElement('p');
    info.textContent = sess.played.length
      ? sess.played.length + ' card' + (sess.played.length !== 1 ? 's' : '') + ' played.'
      : 'No cards were played.';
    div.appendChild(info);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-ghost';
    backBtn.textContent = '← Back to Start';
    backBtn.addEventListener('click', clearSessionAndGoHome);
    div.appendChild(backBtn);

    zone.appendChild(div);

    // Hide the Stop button — it's not relevant when the session is over.
    document.getElementById('btn-stop').classList.add('hidden');
    return;
  }

  document.getElementById('btn-stop').classList.remove('hidden');

  // ── Cards are currently drawn; player must choose ──────────────────────────
  if (sess.currentDraw !== null) {
    const isSingle = sess.currentDraw.length === 1;
    if (isSingle) zone.classList.add('single-draw');

    const drawLabel = document.createElement('div');
    drawLabel.className = 'draw-label';
    drawLabel.textContent = isSingle
      ? 'Last card in the deck — play it?'
      : 'Choose one card to play';
    zone.appendChild(drawLabel);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'draw-cards';

    sess.currentDraw.forEach((code, idx) => {
      const cardEl = buildCardElement(
        code,
        isSingle ? 'Play' : 'Select',
        () => selectCard(idx)
      );
      cardsRow.appendChild(cardEl);
    });

    zone.appendChild(cardsRow);

    // On a single-card draw the player may also choose to stop.
    if (isSingle) {
      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn-ghost';
      skipBtn.style.marginTop = '0.25rem';
      skipBtn.textContent = 'Skip — stop foraging';
      skipBtn.addEventListener('click', endSession);
      zone.appendChild(skipBtn);
    }
    return;
  }

  // ── Between draws; player can draw more or stop ────────────────────────────
  if (sess.deck.length > 0) {
    const wrap = document.createElement('div');
    wrap.className = 'draw-next-wrap';

    const remainLabel = document.createElement('div');
    remainLabel.className = 'draw-label';
    remainLabel.textContent =
      sess.deck.length + ' card' + (sess.deck.length !== 1 ? 's' : '') + ' remain in the deck.';
    wrap.appendChild(remainLabel);

    const drawBtn = document.createElement('button');
    drawBtn.className = 'btn btn-primary';
    drawBtn.textContent = 'Draw Cards';
    drawBtn.addEventListener('click', () => {
      drawCards();
      renderForagingScreen();
    });
    wrap.appendChild(drawBtn);

    zone.appendChild(wrap);
    return;
  }

  // ── Deck is empty and no current draw — auto-end ───────────────────────────
  sess.active = false;
  saveState();
  renderDrawZone();
}

function buildCardElement(code, buttonLabel, onSelect) {
  const card = document.createElement('div');
  card.className = 'card';

  const art = document.createElement('div');
  art.className = 'card-art';

  const icon = document.createElement('div');
  icon.className = 'card-art-icon';
  icon.textContent = TERRAIN_ICONS[state.session.terrain] || '🃏';
  art.appendChild(icon);

  const codeEl = document.createElement('div');
  codeEl.className = 'card-code';
  codeEl.textContent = code;

  const btn = document.createElement('button');
  btn.className = 'card-select-btn';
  btn.textContent = buttonLabel;
  btn.addEventListener('click', onSelect);

  card.appendChild(art);
  card.appendChild(codeEl);
  card.appendChild(btn);
  return card;
}

function renderPlayedList() {
  const played = state.session.played;
  const list   = document.getElementById('played-list');
  list.innerHTML = '';

  if (played.length === 0) {
    const em = document.createElement('em');
    em.textContent = 'No cards played yet.';
    list.appendChild(em);
    return;
  }

  played.forEach(code => {
    const badge = document.createElement('span');
    badge.className = 'played-badge';
    badge.textContent = code;
    list.appendChild(badge);
  });
}

// ===== GAME LOGIC =====

/**
 * Draw 1 or 2 cards from the top of the deck into currentDraw.
 * Mutates state.session; calls saveState().
 */
function drawCards() {
  const sess = state.session;
  if (!sess.active || sess.deck.length === 0) return;

  if (sess.deck.length >= 2) {
    // Pop from the end of the array (it's pre-shuffled).
    sess.currentDraw = [sess.deck.pop(), sess.deck.pop()];
  } else {
    sess.currentDraw = [sess.deck.pop()];
  }

  saveState();
}

/**
 * The player picks the card at chosenIdx.
 * The other card (if any) is shuffled back into the deck.
 */
function selectCard(chosenIdx) {
  const sess = state.session;
  if (!sess.currentDraw) return;

  const chosen = sess.currentDraw[chosenIdx];

  if (sess.currentDraw.length === 2) {
    const discarded = sess.currentDraw[chosenIdx === 0 ? 1 : 0];
    shuffleCardBack(sess.deck, discarded);
  }

  sess.played.push(chosen);
  sess.currentDraw = null;

  if (sess.deck.length === 0) {
    sess.active = false;
  }

  saveState();
  renderForagingScreen();
}

function endSession() {
  state.session.active = false;
  state.session.currentDraw = null;
  saveState();
  renderForagingScreen();
}

function startNewSession(terrain) {
  const deck = buildDeck(terrain, state.settings.expansions);
  shuffle(deck);

  state.session = {
    terrain,
    deck,
    played: [],
    currentDraw: null,
    active: true
  };

  // Auto-draw the first pair before showing the screen.
  drawCards();

  applyTerrainTheme(terrain);
  renderForagingScreen();
  renderScreen('foraging');
}

function clearSessionAndGoHome() {
  state.session = { terrain: null, deck: [], played: [], currentDraw: null, active: false };
  selectedTerrain = null;
  saveState();
  applyTerrainTheme(null);
  renderStartScreen();
  renderScreen('start');
}

// ===== EVENT WIRING =====

function init() {
  loadState();

  // ── Start screen ──────────────────────────────────────────────────────────

  document.querySelectorAll('.btn-terrain').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      selectedTerrain = btn.dataset.terrain;
      renderStartScreen();
    });
  });

  document.getElementById('btn-begin').addEventListener('click', () => {
    if (selectedTerrain === null) return;
    startNewSession(selectedTerrain);
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    renderScreen('settings');
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    if (!state.session.active) return;
    applyTerrainTheme(state.session.terrain);
    renderForagingScreen();
    renderScreen('foraging');
  });

  document.getElementById('btn-discard').addEventListener('click', clearSessionAndGoHome);

  // ── Foraging screen ───────────────────────────────────────────────────────

  document.getElementById('btn-stop').addEventListener('click', endSession);

  // ── Settings screen ───────────────────────────────────────────────────────

  document.getElementById('toggle-meals-myths').addEventListener('change', e => {
    state.settings.expansions.mealsAndMyths = e.target.checked;
    saveState();
  });

  document.getElementById('toggle-nature-beast').addEventListener('change', e => {
    state.settings.expansions.natureOfTheBeast = e.target.checked;
    saveState();
    // If Glade was selected and NatB just turned off, clear the selection.
    if (!e.target.checked && selectedTerrain === 'glade') {
      selectedTerrain = null;
    }
  });

  document.getElementById('btn-settings-back').addEventListener('click', () => {
    renderStartScreen();
    renderScreen('start');
  });

  // ── Boot ──────────────────────────────────────────────────────────────────

  applyTerrainTheme(null);
  renderStartScreen();
  renderScreen('start');
}

document.addEventListener('DOMContentLoaded', init);
