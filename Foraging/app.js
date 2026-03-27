'use strict';

// ===== CONSTANTS =====

const STORAGE_KEY = 'stonesaga-foraging';

const ZONE_LABELS = {
  foreground: 'Foreground',
  midground: 'Midground',
  background: 'Background'
};

const ZONE_ORDER = {
  foreground: 1,
  midground: 2,
  background: 3
};

const CARD_ZONE_LAYOUT = ['background', 'midground', 'foreground'];

const TERRAINS = {
  forest: {
    label: 'Forest',
    icon: '🌲',
    themeClass: 'terrain-forest',
    baseCards: createCardRange('FF', 1, 12)
  },
  prairie: {
    label: 'Prairie',
    icon: '🌾',
    themeClass: 'terrain-prairie',
    baseCards: createCardRange('FP', 1, 12)
  },
  glade: {
    label: 'Glade',
    icon: '🍃',
    themeClass: 'terrain-glade',
    baseCards: createCardRange('FT', 1, 12),
    availableWhen: settings => settings.expansions.natureOfTheBeast
  },
  jungle: {
    label: 'Jungle',
    icon: '🌴',
    themeClass: 'terrain-jungle',
    baseCards: createCardRange('FM', 1, 8)
  }
};

const TERRAIN_ORDER = ['forest', 'prairie', 'jungle', 'glade'];

const OPTIONAL_CARD_GROUPS = [
  {
    terrain: 'forest',
    title: 'Forest Additions',
    cards: [
      { code: 'FF13', note: 'Base game discovered card' },
      { code: 'FF14', note: 'Base game discovered card' },
      { code: 'CF01', note: 'Base game discovered card' },
      { code: 'CF02', note: 'Base game discovered card' },
      { code: 'CF03', note: 'Base game discovered card' },
      { code: 'CF04', note: 'Base game discovered card' },
      { code: 'EF01', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EF02', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EF03', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' }
    ]
  },
  {
    terrain: 'prairie',
    title: 'Prairie Additions',
    cards: [
      { code: 'FP13', note: 'Base game discovered card' },
      { code: 'FP14', note: 'Base game discovered card' },
      { code: 'CP01', note: 'Base game discovered card' },
      { code: 'CP02', note: 'Base game discovered card' },
      { code: 'CP03', note: 'Base game discovered card' },
      { code: 'CP04', note: 'Base game discovered card' },
      { code: 'EP01', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EP02', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EP03', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' }
    ]
  },
  {
    terrain: 'glade',
    title: 'Glade Additions',
    cards: [
      { code: 'FT13', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'FT14', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'CT01', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'CT02', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'CT03', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'CT04', note: 'Nature of the Beast discovered card', requiresExpansion: 'natureOfTheBeast' },
      { code: 'EG01', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EG02', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' },
      { code: 'EG03', note: 'Meals & Myths discovered card', requiresExpansion: 'mealsAndMyths' }
    ]
  }
];

const OPTIONAL_CARD_LOOKUP = buildOptionalCardLookup(OPTIONAL_CARD_GROUPS);

const CARD_ZONE_DATA = {
  forest: {
    background: ['FF05', 'FF07', 'FF08', 'CF03', 'EF01', 'EF02'],
    midground: ['FF09', 'FF10', 'FF11', 'CF02', 'EF03'],
    foreground: ['FF12', 'CF04']
  },
  prairie: {
    background: ['FP04', 'FP06', 'FP07', 'FP08', 'FP09', 'CP03', 'EP01', 'EP02'],
    midground: ['FP05', 'FP10', 'FP11', 'CP02'],
    foreground: ['FP12', 'CP04']
  },
  jungle: {
    background: ['FM02', 'FM06'],
    midground: ['FM01', 'FM07'],
    foreground: ['FM08']
  },
  glade: {
    background: ['FT04', 'FT05', 'FT09', 'CT02', 'EG01', 'EG02', 'EG03'],
    midground: ['FT01', 'FT06', 'FT08', 'FT10', 'CT03'],
    foreground: ['FT12', 'CT04']
  }
};

const CARD_ZONE_LOOKUP = buildCardZoneLookup(CARD_ZONE_DATA);

// ===== STATE =====

let state = createDefaultState();

/** The currently highlighted terrain on the start screen (null = none selected). */
let selectedTerrain = null;

// ===== HELPERS =====

function createCardRange(prefix, start, end) {
  const cards = [];
  for (let cardNumber = start; cardNumber <= end; cardNumber++) {
    cards.push(prefix + String(cardNumber).padStart(2, '0'));
  }
  return cards;
}

function buildOptionalCardLookup(groups) {
  const lookup = {};

  groups.forEach(group => {
    group.cards.forEach(card => {
      lookup[card.code] = {
        terrain: group.terrain,
        title: group.title,
        note: card.note,
        requiresExpansion: card.requiresExpansion || null
      };
    });
  });

  return lookup;
}

function normalizeCardZoneEntry(entry, terrain, predatorZone) {
  if (typeof entry === 'string') {
    return {
      code: entry,
      terrain,
      predatorZone,
      resourcesByZone: null
    };
  }

  return {
    code: entry.code,
    terrain,
    predatorZone,
    resourcesByZone: entry.resourcesByZone || null
  };
}

function buildCardZoneLookup(zoneData) {
  const lookup = {};

  Object.entries(zoneData).forEach(([terrain, zones]) => {
    Object.entries(zones).forEach(([predatorZone, entries]) => {
      entries.forEach(entry => {
        const normalized = normalizeCardZoneEntry(entry, terrain, predatorZone);
        lookup[normalized.code] = normalized;
      });
    });
  });

  return lookup;
}

function createDefaultSettings() {
  const cardToggles = {};

  Object.keys(OPTIONAL_CARD_LOOKUP).forEach(code => {
    cardToggles[code] = false;
  });

  return {
    expansions: {
      mealsAndMyths: false,
      natureOfTheBeast: false
    },
    cardToggles
  };
}

function createEmptySession() {
  return {
    terrain: null,
    deck: [],
    played: [],
    currentDraw: null,
    active: false,
    endReason: null
  };
}

function createDefaultState() {
  return {
    settings: createDefaultSettings(),
    session: createEmptySession()
  };
}

function isTerrainAvailable(terrain, settings = state.settings) {
  const terrainDef = TERRAINS[terrain];
  if (!terrainDef) return false;
  return !terrainDef.availableWhen || terrainDef.availableWhen(settings);
}

function getTerrainLabel(terrain) {
  return TERRAINS[terrain] ? TERRAINS[terrain].label : '';
}

function getTerrainIcon(terrain) {
  return TERRAINS[terrain] ? TERRAINS[terrain].icon : '🃏';
}

function getCardPredatorZone(code) {
  const cardZone = CARD_ZONE_LOOKUP[code];
  return cardZone ? cardZone.predatorZone : null;
}

function getCardZoneResources(code, zone) {
  const cardZone = CARD_ZONE_LOOKUP[code];
  if (!cardZone || !cardZone.resourcesByZone) return [];
  return cardZone.resourcesByZone[zone] || [];
}

function hasForegroundPredator(cards) {
  return cards.some(code => getCardPredatorZone(code) === 'foreground');
}

function getClosestPredatorDistance(cards) {
  const predatorDistances = cards
    .map(code => getCardPredatorZone(code))
    .filter(Boolean)
    .map(zone => ZONE_ORDER[zone]);

  if (predatorDistances.length === 0) return null;
  return Math.min(...predatorDistances);
}

function getBlockedReason(selectionState, index) {
  if (selectionState.allowedIndices.has(index)) return '';
  return selectionState.blockedReason || 'Blocked by predator rule.';
}

function getSelectionState(currentDraw, playedCards) {
  const allowedIndices = new Set(currentDraw.map((_, index) => index));

  if (currentDraw.length < 2) {
    return { allowedIndices, message: '', blockedReason: '' };
  }

  const existingClosestPredator = getClosestPredatorDistance(playedCards);
  if (existingClosestPredator === null) {
    return { allowedIndices, message: '', blockedReason: '' };
  }

  const predatorIndices = currentDraw
    .map((code, index) => ({ code, index, zone: getCardPredatorZone(code) }))
    .filter(card => card.zone !== null);

  if (predatorIndices.length === 0) {
    return {
      allowedIndices,
      message: 'Predators are already in the tableau, but neither drawn card has one.',
      blockedReason: ''
    };
  }

  if (predatorIndices.length === 1) {
    return {
      allowedIndices: new Set([predatorIndices[0].index]),
      message: 'A predator is already in the tableau, so you must take the drawn predator if able.',
      blockedReason: 'You must choose the card with a predator.'
    };
  }

  const closerPredators = predatorIndices.filter(card => ZONE_ORDER[card.zone] <= existingClosestPredator);
  if (closerPredators.length > 0) {
    return {
      allowedIndices: new Set(closerPredators.map(card => card.index)),
      message: 'Both drawn cards have predators. Choose one whose predator is at least as close as the closest predator already in the tableau.',
      blockedReason: 'You must choose a predator that is at least as close as the closest predator already in the tableau.'
    };
  }

  return {
    allowedIndices: new Set(predatorIndices.map(card => card.index)),
    message: 'Both drawn cards have predators. Neither is closer than the predators already in the tableau, so either predator card may be chosen.',
    blockedReason: 'You must choose one of the predator cards.'
  };
}

function enforcePredatorEndState() {
  if (!state.session.active) return;
  if (!hasForegroundPredator(state.session.played)) return;

  state.session.active = false;
  state.session.currentDraw = null;
  state.session.endReason = 'predator';
  saveState();
}

function getEndMessage() {
  const playedCount = state.session.played.length;

  if (state.session.endReason === 'predator') {
    return 'A foreground predator is in the tableau. Searching ends and a Wildlife Encounter must be resolved.';
  }

  if (state.session.endReason === 'manual') {
    return playedCount
      ? 'Foraging stopped early.'
      : 'Foraging stopped before any cards were played.';
  }

  if (state.session.endReason === 'deck') {
    return 'The deck is exhausted.';
  }

  return playedCount
    ? playedCount + ' card' + (playedCount !== 1 ? 's' : '') + ' played.'
    : 'No cards were played.';
}

function isCardEnabledForSettings(code, settings = state.settings) {
  const cardConfig = OPTIONAL_CARD_LOOKUP[code];
  if (!cardConfig || !cardConfig.requiresExpansion) return true;
  return !!settings.expansions[cardConfig.requiresExpansion];
}

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
    const defaultSettings = createDefaultSettings();

    if (saved.settings) {
      const savedExpansions = saved.settings.expansions || {};
      state.settings.expansions.mealsAndMyths = !!savedExpansions.mealsAndMyths;
      state.settings.expansions.natureOfTheBeast = !!savedExpansions.natureOfTheBeast;

      const savedCardToggles = saved.settings.cardToggles || {};
      Object.keys(defaultSettings.cardToggles).forEach(code => {
        state.settings.cardToggles[code] = !!savedCardToggles[code];
      });
    }

    if (saved.session) {
      const session = saved.session;
      state.session = {
        terrain: typeof session.terrain === 'string' && session.terrain in TERRAINS ? session.terrain : null,
        deck: Array.isArray(session.deck) ? session.deck.filter(code => typeof code === 'string') : [],
        played: Array.isArray(session.played) ? session.played.filter(code => typeof code === 'string') : [],
        currentDraw: Array.isArray(session.currentDraw) ? session.currentDraw.filter(code => typeof code === 'string') : null,
        active: !!session.active,
        endReason: typeof session.endReason === 'string' ? session.endReason : null
      };
    }
  } catch (e) {
    console.warn('Could not load state from localStorage:', e);
  }
}

// ===== DECK BUILDING =====

/**
 * Build an ordered array of card codes for the given terrain.
 * @param {'forest'|'prairie'|'glade'|'jungle'} terrain
 * @param {{ expansions: object, cardToggles: object }} settings
 * @returns {string[]}
 */
function buildDeck(terrain, settings) {
  const terrainDef = TERRAINS[terrain];
  if (!terrainDef) return [];

  const cards = terrainDef.baseCards.slice();

  OPTIONAL_CARD_GROUPS.forEach(group => {
    if (group.terrain !== terrain) return;

    group.cards.forEach(card => {
      if (!settings.cardToggles[card.code]) return;
      if (card.requiresExpansion && !settings.expansions[card.requiresExpansion]) return;
      cards.push(card.code);
    });
  });

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
  Object.values(TERRAINS).forEach(terrainDef => {
    document.body.classList.remove(terrainDef.themeClass);
  });

  if (terrain && TERRAINS[terrain]) {
    document.body.classList.add(TERRAINS[terrain].themeClass);
  }
}

// ===== START SCREEN =====

function renderStartScreen() {
  TERRAIN_ORDER.forEach(terrain => {
    const btn = document.querySelector('.btn-terrain[data-terrain="' + terrain + '"]');
    if (!btn) return;
    btn.disabled = !isTerrainAvailable(terrain);
  });

  if (selectedTerrain && !isTerrainAvailable(selectedTerrain)) {
    selectedTerrain = null;
  }

  document.querySelectorAll('.btn-terrain').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.terrain === selectedTerrain);
  });

  document.getElementById('btn-begin').disabled = (selectedTerrain === null);

  const hasActive = state.session.active;
  document.getElementById('resume-banner').classList.toggle('hidden', !hasActive);
  document.getElementById('new-session-panel').classList.toggle('hidden', hasActive);

  if (hasActive && state.session.terrain) {
    const terrain = state.session.terrain;
    document.getElementById('resume-terrain-label').textContent =
      getTerrainIcon(terrain) + ' ' + getTerrainLabel(terrain);
  }

  applyTerrainTheme(selectedTerrain || null);
}

// ===== SETTINGS SCREEN =====

function buildCardToggleRow(card) {
  const label = document.createElement('label');
  label.className = 'toggle-row';

  const isEnabled = isCardEnabledForSettings(card.code);

  const textWrap = document.createElement('span');
  textWrap.className = 'toggle-label';

  const strong = document.createElement('strong');
  strong.textContent = card.code;
  textWrap.appendChild(strong);

  const small = document.createElement('small');
  small.textContent = isEnabled
    ? card.note
    : card.note + ' (enable the required expansion first)';
  textWrap.appendChild(small);

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.dataset.cardToggle = card.code;
  input.checked = !!state.settings.cardToggles[card.code];
  input.disabled = !isEnabled;

  const track = document.createElement('span');
  track.className = 'toggle-track';

  const thumb = document.createElement('span');
  thumb.className = 'toggle-thumb';
  track.appendChild(thumb);

  label.appendChild(textWrap);
  label.appendChild(input);
  label.appendChild(track);

  return label;
}

function renderSettingsScreen() {
  document.getElementById('toggle-meals-myths').checked = state.settings.expansions.mealsAndMyths;
  document.getElementById('toggle-nature-beast').checked = state.settings.expansions.natureOfTheBeast;

  const groupsHost = document.getElementById('card-toggle-groups');
  groupsHost.innerHTML = '';

  OPTIONAL_CARD_GROUPS.forEach(group => {
    const section = document.createElement('section');
    section.className = 'settings-subgroup';

    const title = document.createElement('h4');
    title.textContent = group.title;
    section.appendChild(title);

    const terrainNote = document.createElement('p');
    terrainNote.className = 'settings-subgroup-note';
    terrainNote.textContent = getTerrainLabel(group.terrain) + ' deck extras.';
    section.appendChild(terrainNote);

    group.cards.forEach(card => {
      section.appendChild(buildCardToggleRow(card));
    });

    groupsHost.appendChild(section);
  });
}

// ===== FORAGING SCREEN =====

function renderForagingScreen() {
  enforcePredatorEndState();

  const sess = state.session;
  document.getElementById('foraging-terrain-label').textContent =
    getTerrainIcon(sess.terrain) + ' ' + getTerrainLabel(sess.terrain) + ' Foraging';
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

  if (!sess.active) {
    const div = document.createElement('div');
    div.className = 'end-message';

    const heading = document.createElement('h3');
    heading.textContent = sess.endReason === 'predator' ? 'Predator Encounter' : 'Session Complete';
    div.appendChild(heading);

    const info = document.createElement('p');
    info.textContent = getEndMessage();
    div.appendChild(info);

    const summary = document.createElement('p');
    summary.textContent = sess.played.length
      ? sess.played.length + ' card' + (sess.played.length !== 1 ? 's' : '') + ' played.'
      : 'No cards were played.';
    div.appendChild(summary);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-ghost';
    backBtn.textContent = '← Back to Start';
    backBtn.addEventListener('click', clearSessionAndGoHome);
    div.appendChild(backBtn);

    zone.appendChild(div);
    document.getElementById('btn-stop').classList.add('hidden');
    return;
  }

  document.getElementById('btn-stop').classList.remove('hidden');

  if (sess.currentDraw !== null) {
    const isSingle = sess.currentDraw.length === 1;
    if (isSingle) zone.classList.add('single-draw');

    const drawLabel = document.createElement('div');
    drawLabel.className = 'draw-label';
    drawLabel.textContent = isSingle
      ? 'Last card in the deck — play it?'
      : 'Choose one card to play';
    zone.appendChild(drawLabel);

    const selectionState = getSelectionState(sess.currentDraw, sess.played);
    if (selectionState.message) {
      const hint = document.createElement('p');
      hint.className = 'draw-hint';
      hint.textContent = selectionState.message;
      zone.appendChild(hint);
    }

    const cardsRow = document.createElement('div');
    cardsRow.className = 'draw-cards';

    sess.currentDraw.forEach((code, idx) => {
      const isAllowed = isSingle || selectionState.allowedIndices.has(idx);
      const cardEl = buildCardElement(
        code,
        isSingle ? 'Play' : 'Select',
        isAllowed ? () => selectCard(idx) : null,
        {
          disabled: !isAllowed,
          helperText: getBlockedReason(selectionState, idx)
        }
      );
      cardsRow.appendChild(cardEl);
    });

    zone.appendChild(cardsRow);

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

  sess.active = false;
  sess.endReason = 'deck';
  saveState();
  renderDrawZone();
}

function buildCardElement(code, buttonLabel, onSelect, options = {}) {
  const stack = document.createElement('div');
  stack.className = 'card-stack';

  const card = document.createElement('div');
  card.className = 'card';

  if (options.disabled) {
    card.classList.add('card-blocked');
  }

  const predatorZone = getCardPredatorZone(code);
  const zones = document.createElement('div');
  zones.className = 'card-zones';

  CARD_ZONE_LAYOUT.forEach(zone => {
    const zoneEl = document.createElement('div');
    zoneEl.className = 'card-zone card-zone-' + zone;

    const zoneIcon = document.createElement('div');
    zoneIcon.className = 'card-zone-icon';
    zoneIcon.textContent = getTerrainIcon(state.session.terrain);
    zoneEl.appendChild(zoneIcon);

    if (predatorZone === zone) {
      zoneEl.classList.add('card-zone-has-predator');

      const marker = document.createElement('div');
      marker.className = 'card-predator-marker';
      marker.textContent = 'Predator: ' + ZONE_LABELS[zone];
      zoneEl.appendChild(marker);
    }

    zones.appendChild(zoneEl);
  });

  const codeEl = document.createElement('div');
  codeEl.className = 'card-code';
  codeEl.textContent = code;

  const btn = document.createElement('button');
  btn.className = 'card-select-btn';
  btn.textContent = buttonLabel;
  btn.disabled = !!options.disabled;
  if (onSelect) {
    btn.addEventListener('click', onSelect);
  }

  card.appendChild(zones);
  card.appendChild(codeEl);
  card.appendChild(btn);

  stack.appendChild(card);

  const helper = document.createElement('div');
  helper.className = 'card-helper-text';
  helper.textContent = options.helperText || '';
  stack.appendChild(helper);

  return stack;
}

function renderPlayedList() {
  const played = state.session.played;
  const list = document.getElementById('played-list');
  list.innerHTML = '';

  if (played.length === 0) {
    const em = document.createElement('em');
    em.textContent = 'No cards played yet.';
    list.appendChild(em);
    return;
  }

  played.forEach(code => {
    const badge = document.createElement('span');
    const predatorZone = getCardPredatorZone(code);
    badge.className = 'played-badge' + (predatorZone ? ' played-badge-predator' : '');
    badge.textContent = predatorZone
      ? code + ' • predator: ' + ZONE_LABELS[predatorZone].toLowerCase()
      : code;
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

  if (hasForegroundPredator(sess.played)) {
    sess.active = false;
    sess.currentDraw = null;
    sess.endReason = 'predator';
    saveState();
    return;
  }

  if (sess.deck.length >= 2) {
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

  const selectionState = getSelectionState(sess.currentDraw, sess.played);
  if (sess.currentDraw.length > 1 && !selectionState.allowedIndices.has(chosenIdx)) {
    return;
  }

  const chosen = sess.currentDraw[chosenIdx];

  if (sess.currentDraw.length === 2) {
    const discarded = sess.currentDraw[chosenIdx === 0 ? 1 : 0];
    shuffleCardBack(sess.deck, discarded);
  }

  sess.played.push(chosen);
  sess.currentDraw = null;

  if (getCardPredatorZone(chosen) === 'foreground') {
    sess.active = false;
    sess.endReason = 'predator';
  } else if (sess.deck.length === 0) {
    sess.active = false;
    sess.endReason = 'deck';
  } else {
    sess.endReason = null;
  }

  saveState();
  renderForagingScreen();
}

function endSession() {
  state.session.active = false;
  state.session.currentDraw = null;
  state.session.endReason = 'manual';
  saveState();
  renderForagingScreen();
}

function startNewSession(terrain) {
  if (!isTerrainAvailable(terrain)) return;

  const deck = buildDeck(terrain, state.settings);
  shuffle(deck);

  state.session = {
    terrain,
    deck,
    played: [],
    currentDraw: null,
    active: true,
    endReason: null
  };

  drawCards();

  applyTerrainTheme(terrain);
  renderForagingScreen();
  renderScreen('foraging');
}

function clearSessionAndGoHome() {
  state.session = createEmptySession();
  selectedTerrain = null;
  saveState();
  applyTerrainTheme(null);
  renderStartScreen();
  renderScreen('start');
}

// ===== EVENT WIRING =====

function init() {
  loadState();
  enforcePredatorEndState();

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
    renderSettingsScreen();
    renderScreen('settings');
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    if (!state.session.active) return;
    applyTerrainTheme(state.session.terrain);
    renderForagingScreen();
    renderScreen('foraging');
  });

  document.getElementById('btn-discard').addEventListener('click', clearSessionAndGoHome);
  document.getElementById('btn-stop').addEventListener('click', endSession);

  document.getElementById('toggle-meals-myths').addEventListener('change', e => {
    state.settings.expansions.mealsAndMyths = e.target.checked;
    saveState();
    renderSettingsScreen();
  });

  document.getElementById('toggle-nature-beast').addEventListener('change', e => {
    state.settings.expansions.natureOfTheBeast = e.target.checked;
    if (!e.target.checked && selectedTerrain === 'glade') {
      selectedTerrain = null;
    }
    saveState();
    renderSettingsScreen();
    renderStartScreen();
  });

  document.getElementById('card-toggle-groups').addEventListener('change', e => {
    if (!e.target.matches('[data-card-toggle]')) return;
    const code = e.target.dataset.cardToggle;
    if (!(code in state.settings.cardToggles)) return;
    state.settings.cardToggles[code] = e.target.checked;
    saveState();
  });

  document.getElementById('btn-settings-back').addEventListener('click', () => {
    renderStartScreen();
    renderScreen('start');
  });

  applyTerrainTheme(null);
  renderStartScreen();
  renderSettingsScreen();
  renderScreen('start');
}

document.addEventListener('DOMContentLoaded', init);
