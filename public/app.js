const cityLabels = [
  ["Київ", 50.4501, 30.5234, 6],
  ["Львів", 49.8397, 24.0297, 6],
  ["Одеса", 46.4825, 30.7233, 6],
  ["Харків", 49.9935, 36.2304, 6],
  ["Дніпро", 48.4647, 35.0462, 6],
  ["Полтава", 49.5883, 34.5514, 7],
  ["Вінниця", 49.2328, 28.4682, 7],
  ["Черкаси", 49.4444, 32.0598, 7],
  ["Запоріжжя", 47.8388, 35.1396, 7],
  ["Тернопіль", 49.5535, 25.5948, 8],
  ["Умань", 48.7484, 30.2218, 8],
  ["Ніжин", 51.048, 31.8869, 9],
  ["Кременчук", 49.9685, 33.6089, 9],
  ["Решетилівка", 49.1489, 34.1965, 10],
  ["Опішня", 49.8764, 34.0072, 10],
  ["Диканька", 49.9562, 34.6125, 10],
  ["Миргород", 49.565, 34.078, 10],
  ["Великі Сорочинці", 50.0234, 33.941, 11],
  ["Кобеляки", 49.8258, 34.529, 11],
  ["Кам'янське", 50.311, 32.308, 11]
];

const fallbackUkrainePolygon = [[[
  [23.72, 52.34], [25.12, 51.85], [26.85, 51.72], [30.18, 52.28], [31.82, 51.58],
  [33.74, 52.18], [35.32, 51.36], [37.18, 50.62], [39.92, 50.24], [40.14, 49.12],
  [39.22, 48.34], [38.12, 47.88], [37.8, 47.1], [36.22, 46.72], [35.28, 46.02],
  [35.0, 45.44], [36.42, 45.18], [36.02, 44.62], [34.38, 44.42], [33.18, 45.0],
  [32.22, 45.28], [30.78, 45.38], [30.08, 46.0], [29.24, 45.38], [28.42, 45.48],
  [28.0, 46.2], [29.62, 46.38], [29.16, 46.82], [27.92, 47.58], [26.72, 48.2],
  [24.86, 47.78], [22.18, 48.34], [22.42, 49.34], [23.56, 50.42], [23.64, 51.18],
  [23.72, 52.34]
]]];

const rivalOwners = ["Інший гравець"];
let RECT_CELL_WIDTH_DEGREES = 0.018;
let RECT_CELL_HEIGHT_DEGREES = 0.012;
const MAP_BOUNDS = { south: 43.2, west: 21.0, north: 53.0, east: 41.2 };
const MAP_VIEW_BOUNDS = {
  south: MAP_BOUNDS.south - 2.2,
  west: MAP_BOUNDS.west - 4.5,
  north: MAP_BOUNDS.north + 2.2,
  east: MAP_BOUNDS.east + 4.5
};
const TILE_SIZE = 256;
const DISPLAY_ZOOM_LEVELS = [5, 7, 10, 12];
const MAX_CONFIGURED_VISIBLE_CELLS = 500000;
const MAX_CONFIGURED_OWNED_CELLS = 500000;
let MAP_ZOOM_LEVELS = [...DISPLAY_ZOOM_LEVELS];
let MAP_ZOOM_PRESETS = [
  { displayZoom: 5, mapZoom: 5, mode: "overview", showFreeGrid: false, freeGridOpacity: 0, maxVisibleCells: 2500 },
  { displayZoom: 7, mapZoom: 7, mode: "overview", showFreeGrid: false, freeGridOpacity: 0, maxVisibleCells: 7000 },
  { displayZoom: 10, mapZoom: 10, mode: "detail", showFreeGrid: true, freeGridOpacity: 0.12, maxVisibleCells: 18000 },
  { displayZoom: 12, mapZoom: 12, mode: "detail", showFreeGrid: true, freeGridOpacity: 0.26, maxVisibleCells: 46000 }
];
let MAX_VISIBLE_GRID_CELLS = 46000;
const SETTLEMENT_GRID_SIZE = 0.25;
let DETAIL_ZOOM_MIN = 10;
let DRAW_GRID = true;
let CLAIM_BATCH_SIZE = 1000;
let SELL_REFUND_RATE = 0.50;
let LAND_LEVELS = [
  { level: 1, name: "Без добрив", cost: 0, incomeBonusPercent: 0 },
  { level: 2, name: "Базові добрива", cost: 900, incomeBonusPercent: 25 },
  { level: 3, name: "Посилені добрива", cost: 1500, incomeBonusPercent: 60 },
  { level: 4, name: "Преміум добрива", cost: 2400, incomeBonusPercent: 110 },
  { level: 5, name: "Агрохімія повного циклу", cost: 3600, incomeBonusPercent: 175 }
];
let gameSettings = null;
let activeAssetKind = "machinery";
let assetCarouselIndex = 0;
let assetPhotoIndex = 0;
let stageRules = [
  { title: "Початок", min: 0, text: "Купуйте перші ділянки та формуйте базу господарства." },
  { title: "Господарство", min: 5, text: "Земля поруч підвищує ціну наступної покупки, а з'єднані ділянки дають бонус до доходу." },
  { title: "Компанія", min: 15, text: "З'єднані ділянки дають відчутний бонус до доходу." },
  { title: "Агрохолдинг", min: 40, text: "Розвивайте побудови, техніку і рівні землі." },
  { title: "Корпорація", min: 100, text: "Масштабуйте виробництво та баланс між землею й активами." },
  { title: "Національна корпорація", min: 250, text: "Гравець бореться за лідерство на карті України." }
];

const authScreen = document.querySelector("#authScreen");
const gameScreen = document.querySelector("#gameScreen");
const authStatus = document.querySelector("#authStatus");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const recoverForm = document.querySelector("#recoverForm");
const resetForm = document.querySelector("#resetForm");
const forgotPasswordLink = document.querySelector("#forgotPasswordLink");
const playerName = document.querySelector("#playerName");
const coinCount = document.querySelector("#coinCount");
const dayCount = document.querySelector("#dayCount");
const mapBoard = document.querySelector("#mapBoard");
const zoomBadge = document.querySelector("#zoomBadge");
const mapStage = document.querySelector(".map-stage");
const cellInfoPanel = document.querySelector("#cellInfoPanel");
const selectionPopup = document.querySelector("#selectionPopup");
const selectionSummary = document.querySelector("#selectionSummary");
const closeSelectionPopup = document.querySelector("#closeSelectionPopup");
const closeCellInfoButton = document.querySelector("#closeCellInfoButton");
const detailInfoButton = document.querySelector("#detailInfoButton");
const clusterSelectButton = document.querySelector("#clusterSelectButton");
const newsButton = document.querySelector("#newsButton");
const newsModal = document.querySelector("#newsModal");
const returnToNewsButton = document.querySelector("#returnToNewsButton");
const cellTitle = document.querySelector("#cellTitle");
const cellDetails = document.querySelector("#cellDetails");
const buyButton = document.querySelector("#buyButton");
const contactOwnerButton = document.querySelector("#contactOwnerButton");
const offerBuyoutButton = document.querySelector("#offerBuyoutButton");
const upgradeButton = document.querySelector("#upgradeButton");
const buildingButton = document.querySelector("#buildingButton");
const machineryButton = document.querySelector("#machineryButton");
const sellButton = document.querySelector("#sellButton");
const profileButton = document.querySelector("#profileButton");
const dossierButton = document.querySelector("#dossierButton");
const helpButton = document.querySelector("#helpButton");
const messagesButton = document.querySelector("#messagesButton");
const messageBadge = document.querySelector("#messageBadge");
const logoutButton = document.querySelector("#logoutButton");
const profileModal = document.querySelector("#profileModal");
const helpModal = document.querySelector("#helpModal");
const helpSections = document.querySelector("#helpSections");
const dossierModal = document.querySelector("#dossierModal");
const dossierTitle = document.querySelector("#dossierTitle");
const dossierOverview = document.querySelector("#dossierOverview");
const dossierJournal = document.querySelector("#dossierJournal");
const adminModal = document.querySelector("#adminModal");
const profileForm = document.querySelector("#profileForm");
const profileCompanyName = document.querySelector("#profileCompanyName");
const profileColor = document.querySelector("#profileColor");
const profileLogo = document.querySelector("#profileLogo");
const profileLogoPreview = document.querySelector("#profileLogoPreview");
const profileStats = document.querySelector("#profileStats");
const adminResetLandButton = document.querySelector("#adminResetLandButton");
const adminResetMoneyButton = document.querySelector("#adminResetMoneyButton");
const adminResetMachineryButton = document.querySelector("#adminResetMachineryButton");
const adminResetAssetsButton = document.querySelector("#adminResetAssetsButton");
const adminClearEventsButton = document.querySelector("#adminClearEventsButton");
const adminSettingsForm = document.querySelector("#adminSettingsForm");
const adminSettingsFields = document.querySelector("#adminSettingsFields");
const adminPlayerStats = document.querySelector("#adminPlayerStats");
const adminStats = document.querySelector("#adminStats");
const messagesModal = document.querySelector("#messagesModal");
const chatList = document.querySelector("#chatList");
const chatMessages = document.querySelector("#chatMessages");
const messageForm = document.querySelector("#messageForm");
const messageText = document.querySelector("#messageText");
const assetModal = document.querySelector("#assetModal");
const assetForm = document.querySelector("#assetForm");
const assetModalEyebrow = document.querySelector("#assetModalEyebrow");
const assetModalTitle = document.querySelector("#assetModalTitle");
const assetOptions = document.querySelector("#assetOptions");
const assetQuantity = document.querySelector("#assetQuantity");
const assetTotal = document.querySelector("#assetTotal");
const assetSubmitButton = assetForm?.querySelector('button[type="submit"]');
const imagePreviewModal = document.querySelector("#imagePreviewModal");
const imagePreviewTarget = document.querySelector("#imagePreviewTarget");
const imagePreviewPrev = document.querySelector("#imagePreviewPrev");
const imagePreviewNext = document.querySelector("#imagePreviewNext");
const imagePreviewCounter = document.querySelector("#imagePreviewCounter");
const ownerModal = document.querySelector("#ownerModal");
const offerModal = document.querySelector("#offerModal");
const offerForm = document.querySelector("#offerForm");
const offerDetails = document.querySelector("#offerDetails");
const offerAmount = document.querySelector("#offerAmount");
const offerBalance = document.querySelector("#offerBalance");
const ownerInfo = document.querySelector("#ownerInfo");
const adminSummary = document.querySelector("#adminSummary");
const adminUsers = document.querySelector("#adminUsers");
const ownedMetric = document.querySelector("#ownedMetric");
const largestClusterMetric = document.querySelector("#largestClusterMetric");
const incomeMetric = document.querySelector("#incomeMetric");
const assetMetric = document.querySelector("#assetMetric");
const stageTitle = document.querySelector("#stageTitle");
const stageProgress = document.querySelector("#stageProgress");
const stageText = document.querySelector("#stageText");
const leaderboard = document.querySelector("#leaderboard");
const newsList = document.querySelector("#newsList");
const gameMessage = document.querySelector("#gameMessage");

function finishBoot() {
  awaitingInitialOverviewLand = false;
  document.body.classList.remove("is-booting");
}

function bindEvent(element, eventName, handler, options) {
  if (!element) return;
  element.addEventListener(eventName, handler, options);
}

function activateAdminTabDom(tab) {
  if (!tab) return;
  document.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.toggle("is-active", item.dataset.adminTab === tab));
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.adminPanel !== tab));
}

document.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-admin-tab]");
  if (!tabButton) return;
  event.preventDefault();
  activateAdminTabDom(tabButton.dataset.adminTab);
  if (tabButton.dataset.adminTab === "players") loadAdminUsersIfNeeded();
  if (tabButton.dataset.adminTab === "settings") loadAdminSettingsIfNeeded();
});

let player = null;
let state = defaultGameState();
let selectedCellId = null;
let saveTimer = null;
let saveScope = null;
let saveInFlight = null;
let gameMessageTimer = null;
let map = null;
let mapTilesCanvas = null;
let gridCanvas = null;
let gridGl = null;
let gridProgram = null;
let gridFillBuffer = null;
let gridBorderBuffer = null;
let gridGeometryCache = null;
let mapPointerState = null;
let ukrainePolygons = fallbackUkrainePolygon;
let ukraineCellCache = new Map();
let cellCache = new Map();
let settlementPlaces = [];
let settlementGrid = new Map();
let globalMarketState = { version: 0, resetAt: null, stats: { ownedCells: 0 } };
let visibleLandState = { version: 0, owners: {}, cells: {} };
let overviewTerritories = [];
const chunkCache = new Map();
const CHUNK_CACHE_LIMIT = 220;
let pendingSettingsImages = 0;
let marketTimer = null;
let incomeTimer = null;
let visibleLandTimer = null;
let marketOwnedCellCount = 0;
let marketVersion = 0;
let visibleLandRequestId = 0;
let visibleLandBoundsKey = "";
let visibleLandVersion = 0;
let leaderboardRows = [];
let leaderboardTimer = null;
let leaderboardVersion = 0;
let activeChatUserId = null;
let chats = [];
let unreadMessages = 0;
let messagesTimer = null;
let activeChatTimer = null;
let activeChatSignature = "";
let activeChatLoading = false;
let newsRows = [];
let newsTimer = null;
let visibleCells = [];
let visibleCellById = new Map();
let playableGridRows = null;
let mapSettledTimer = null;
let landRenderMode = null;
let cellLayerById = new Map();
let selectedCellIds = new Set();
let purchaseInProgress = false;
let landOperationOverlay = null;
let selectionDrag = null;
let selectionDragWasEnabled = true;
let clusterModeDragWasEnabled = true;
let clusterSelectionMode = false;
let suppressMapClick = false;
let adminSettingsLoaded = false;
let selectionPopupDismissed = false;
let cellInfoOpen = false;
let newsReturnState = null;
let touchTooltip = null;
let touchTooltipTimer = null;
let gridUpdateTimer = null;
let gridRenderJob = 0;
let gridRenderFrame = null;
let gridPanFrame = null;
let mapBaseRenderFrame = null;
let isMapMoving = false;
let lastWheelZoomAt = 0;
let gridTooDenseNotifiedAt = 0;
let gridSkippedForDensity = false;
let detailedMapMarkerCount = 0;
let landClusterCacheKey = "";
let landMembershipRevision = 0;
let landClusterCacheMap = null;
let landClusterCacheClusters = null;
let ownedCountCacheRevision = -1;
let ownedCountCache = 0;
let farmDerivedStatsCache = null;
let awaitingInitialOverviewLand = false;

function defaultGameState() {
  return {
    coins: gameSettings?.economy?.startingCoins || 11700,
    currentDay: 1,
    land: {},
    companyName: "",
    color: "#35c982",
    logo: "",
    inventory: { machinery: {}, elevators: {}, machineryBatches: [] },
    lastAdminResetAt: null,
    lastIncomeAt: null,
    stats: {
      purchased: 0,
      upgraded: 0,
      buildings: 0,
      machinery: 0,
      earned: 0
    },
    events: [],
    ledger: []
  };
}

function showAuthMessage(message) {
  authStatus.textContent = message;
}

function showGameMessage(message) {
  if (!gameMessage) return;
  const text = landLabel(message);
  clearTimeout(gameMessageTimer);
  gameMessage.textContent = text;
  gameMessage.classList.toggle("is-visible", Boolean(text));
  if (!text) return;
  gameMessageTimer = window.setTimeout(() => {
    gameMessage.classList.remove("is-visible");
  }, 4200);
}

function landLabel(value) {
  return String(value || "");
}

function replaceGameTerms(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const nextText = landLabel(node.nodeValue);
    if (nextText !== node.nodeValue) node.nodeValue = nextText;
  });
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      ...options
    });
  } catch (error) {
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  let payload = null;
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = { error: `Сервер повернув пошкоджений JSON (${response.status}).` };
    }
  } else {
    payload = {
      error: response.status === 413
        ? "Дані завеликі для сервера. Зменште обсяг операції або збільшіть ліміт Nginx."
        : `Сервер повернув не JSON (${response.status}).`
    };
  }
  if (!response.ok) {
    const error = new Error(payload?.error || "Помилка сервера.");
    error.status = response.status;
    error.url = url;
    throw error;
  }
  return payload;
}

function normalizeState(nextState) {
  const base = defaultGameState();
  const normalized = {
    ...base,
    ...(nextState || {}),
    stats: { ...base.stats, ...((nextState && nextState.stats) || {}) },
    land: { ...((nextState && nextState.land) || {}) },
    inventory: {
      machinery: { ...(((nextState && nextState.inventory) || {}).machinery || {}) },
      elevators: { ...(((nextState && nextState.inventory) || {}).elevators || {}) },
      machineryBatches: Array.isArray(((nextState && nextState.inventory) || {}).machineryBatches)
        ? ((nextState && nextState.inventory) || {}).machineryBatches.slice(-500)
        : []
    },
    events: Array.isArray(nextState && nextState.events) ? nextState.events.slice(-30) : [],
    ledger: Array.isArray(nextState && nextState.ledger) ? nextState.ledger.slice(-1000) : []
  };

  if (!normalized.companyName) normalized.companyName = "";
  if (player?.username && normalized.companyName === `${player.username} Земля`) normalized.companyName = player.username;
  normalized.events = normalized.events
    .filter((event) => event && typeof event.text === "string")
    .map((event) => ({ ...event, text: landLabel(event.text) }));

  if (!/^#[0-9a-f]{6}$/i.test(normalized.color || "")) normalized.color = base.color;
  if (typeof normalized.logo !== "string") normalized.logo = "";
  if (typeof normalized.lastAdminResetAt !== "string") normalized.lastAdminResetAt = null;
  normalized.inventory = normalizeMachineryInventory(normalized.inventory, normalized.currentDay);

  return migrateLandToPlayResolution(normalized);
}

function normalizeMachineryInventory(inventory, currentDay = 1) {
  const next = {
    machinery: { ...(inventory?.machinery || {}) },
    elevators: { ...(inventory?.elevators || {}) },
    machineryBatches: Array.isArray(inventory?.machineryBatches) ? inventory.machineryBatches.slice(-500) : []
  };
  if (!next.machineryBatches.length && Object.keys(next.machinery || {}).length) {
    next.machineryBatches = Object.entries(next.machinery)
      .map(([id, qty]) => {
        const item = machineryItemById(id);
        const duration = Math.max(1, Number(item?.durationDays) || 80);
        return {
          id,
          qty: Math.max(0, Math.floor(Number(qty) || 0)),
          purchasedDay: Math.max(1, currentDay),
          expiresDay: Math.max(1, currentDay) + duration
        };
      })
      .filter((batch) => batch.id && batch.qty > 0);
  }
  next.machineryBatches = next.machineryBatches
    .map((batch) => ({
      id: String(batch.id || ""),
      qty: Math.max(0, Math.floor(Number(batch.qty) || 0)),
      purchasedDay: Math.max(1, Math.floor(Number(batch.purchasedDay) || currentDay)),
      expiresDay: Math.max(1, Math.floor(Number(batch.expiresDay) || currentDay))
    }))
    .filter((batch) => batch.id && batch.qty > 0);
  next.machinery = activeMachineryMap(next, currentDay);
  return next;
}

function activeMachineryMap(inventory = state.inventory, currentDay = state.currentDay) {
  const batches = Array.isArray(inventory?.machineryBatches) ? inventory.machineryBatches : [];
  if (!batches.length) return { ...(inventory?.machinery || {}) };
  return batches.reduce((map, batch) => {
    if ((batch.expiresDay || 0) < currentDay) return map;
    map[batch.id] = (map[batch.id] || 0) + (batch.qty || 0);
    return map;
  }, {});
}

function expireMachinery(showMessage = false) {
  const before = inventoryCount("machinery");
  state.inventory = normalizeMachineryInventory(state.inventory, state.currentDay);
  const after = inventoryCount("machinery");
  if (showMessage && before > after) {
    showGameMessage(`Строк дії частини техніки завершився. Списано: ${before - after} шт.`);
  }
  return before !== after;
}

function normalizeMapZoomPresets(mapSettings = {}) {
  const incoming = Array.isArray(mapSettings.zoomPresets) ? mapSettings.zoomPresets : [];
  return DISPLAY_ZOOM_LEVELS.map((displayZoom, index) => {
    const fallback = MAP_ZOOM_PRESETS[index] || { displayZoom, mapZoom: displayZoom, mode: displayZoom >= 10 ? "detail" : "overview", showFreeGrid: displayZoom >= 10, freeGridOpacity: displayZoom >= 12 ? 0.26 : 0.12, maxVisibleCells: displayZoom >= 12 ? 46000 : displayZoom >= 10 ? 18000 : 7000 };
    const raw = incoming.find((item) => Number(item?.displayZoom) === displayZoom) || incoming[index] || fallback;
    const mapZoom = Number.isFinite(Number(raw.mapZoom)) ? Number(raw.mapZoom) : fallback.mapZoom;
    return {
      displayZoom,
      mapZoom: displayZoom === 5 ? 5 : mapZoom,
      mode: displayZoom >= 10 ? "detail" : "overview",
      showFreeGrid: raw.showFreeGrid !== false,
      freeGridOpacity: Math.max(0, Math.min(1, Number(raw.freeGridOpacity) || 0)),
      maxVisibleCells: Math.max(500, Math.min(MAX_CONFIGURED_VISIBLE_CELLS, Math.floor(Number(raw.maxVisibleCells) || fallback.maxVisibleCells || 10000)))
    };
  });
}

function applyGameSettings(settings) {
  gameSettings = settings || gameSettings;
  const economy = gameSettings?.economy || {};
  const mapSettings = gameSettings?.map || {};
  const upgrades = gameSettings?.upgrades || {};
  MAX_VISIBLE_GRID_CELLS = Number.isFinite(Number(economy.maxVisibleCells))
    ? Math.max(1000, Math.min(MAX_CONFIGURED_VISIBLE_CELLS, Number(economy.maxVisibleCells)))
    : 46000;
  DETAIL_ZOOM_MIN = Number.isFinite(Number(economy.detailZoomMin))
    ? Math.max(10, Math.min(12, Number(economy.detailZoomMin)))
    : 10;
  MAP_ZOOM_PRESETS = normalizeMapZoomPresets(mapSettings);
  MAP_ZOOM_LEVELS = MAP_ZOOM_PRESETS.map((preset) => preset.mapZoom);
  RECT_CELL_WIDTH_DEGREES = Number.isFinite(Number(mapSettings.cellWidthDegrees)) ? Number(mapSettings.cellWidthDegrees) : 0.018;
  RECT_CELL_HEIGHT_DEGREES = Number.isFinite(Number(mapSettings.cellHeightDegrees)) ? Number(mapSettings.cellHeightDegrees) : 0.012;
  DRAW_GRID = economy.drawGrid !== false;
  CLAIM_BATCH_SIZE = Number.isFinite(economy.claimBatchSize) ? economy.claimBatchSize : CLAIM_BATCH_SIZE;
  SELL_REFUND_RATE = Number.isFinite(economy.sellRefundPercent) ? economy.sellRefundPercent / 100 : SELL_REFUND_RATE;
  LAND_LEVELS = Array.isArray(upgrades.landLevels) && upgrades.landLevels.length ? upgrades.landLevels : LAND_LEVELS;
  stageRules = Array.isArray(gameSettings?.stages) && gameSettings.stages.length ? gameSettings.stages : stageRules;
  if (!gameSettings.assets) {
    gameSettings.assets = {
      machineryItems: [{ id: "tractor-basic", icon: "🚜", name: "Трактор базовий", cost: 3600, incomeBonusPercent: 8, durationDays: 80, minCells: 10, photos: [] }],
      elevatorItems: [{ id: "elevator-basic", icon: "🏗", name: "Елеватор базовий", cost: 9000, incomePerDay: 900, minCells: 3, maxOwnerLandPercent: 20, photos: [] }]
    };
  }
  gameSettings.assets.elevatorItems = (gameSettings.assets.elevatorItems || []).map((item) => ({
    ...item,
    incomePerDay: Number.isFinite(Number(item.incomePerDay)) ? Number(item.incomePerDay) : 900,
    minCells: Number.isFinite(Number(item.minCells)) ? Math.max(1, Math.floor(Number(item.minCells))) : 1,
    maxOwnerLandPercent: Number.isFinite(Number(item.maxOwnerLandPercent)) ? Math.min(100, Math.max(1, Number(item.maxOwnerLandPercent))) : 25,
    serviceLifeExtensionDays: Number.isFinite(Number(item.serviceLifeExtensionDays)) ? Math.max(0, Math.floor(Number(item.serviceLifeExtensionDays))) : 0
  }));
  gameSettings.assets.machineryItems = (gameSettings.assets.machineryItems || []).map((item) => ({
    ...item,
    durationDays: Number.isFinite(Number(item.durationDays)) ? Math.max(1, Math.floor(Number(item.durationDays))) : 80,
    landCapacity: Number.isFinite(Number(item.landCapacity)) ? Math.max(1, Math.floor(Number(item.landCapacity))) : 25
  }));
  if (state?.inventory) state.inventory = normalizeMachineryInventory(state.inventory, state.currentDay || 1);
  cellCache = new Map();
  landClusterCacheKey = "";
  farmDerivedStatsCache = null;
  invalidateChunkCache();
  if (!DRAW_GRID) {
    visibleCells = [];
    updateLandMapSource([]);
  }
}

async function loadGameSettings() {
  try {
    applyGameSettings(await requestJson("/api/settings"));
  } catch {
    applyGameSettings(gameSettings);
  }
}

function migrateLandToPlayResolution(nextState) {
  const migratedLand = {};
  Object.entries(nextState.land || {}).forEach(([id, ownership]) => {
    const normalizedId = normalizePlayableCellId(id);
    if (!normalizedId || migratedLand[normalizedId]) return;
    migratedLand[normalizedId] = {
      ...ownership,
      id: normalizedId,
      building: typeof ownership.building === "string" ? ownership.building : ownership.buildingId || null,
      buildingId: typeof ownership.buildingId === "string" ? ownership.buildingId : ownership.building || null,
      buildingGroupId: typeof ownership.buildingGroupId === "string" ? ownership.buildingGroupId : null,
      buildingBuiltAt: typeof ownership.buildingBuiltAt === "string" ? ownership.buildingBuiltAt : null,
      buildingLevel: Number.isFinite(ownership.buildingLevel) ? ownership.buildingLevel : ownership.building ? 1 : 0,
      machineryLevel: Number.isFinite(ownership.machineryLevel) ? ownership.machineryLevel : ownership.machinery ? 1 : 0,
      nickname: ownership.nickname || ""
    };
  });

  return {
    ...nextState,
    land: migratedLand
  };
}

function normalizePlayableCellId(id) {
  return isRegularHexId(id) ? String(id) : null;
}

function startGame(nextPlayer, nextState) {
  player = nextPlayer;
  state = normalizeState(nextState);
  landMembershipRevision += 1;
  farmDerivedStatsCache = null;
  adminSettingsLoaded = false;
  saveScope = null;
  clearTimeout(saveTimer);

  authScreen.classList.add("is-hidden");
  if (window.location.pathname === "/admin") {
    if (!player?.isAdmin) {
      window.location.replace("/");
      return;
    }
    document.body.classList.add("is-admin-page");
    gameScreen.classList.remove("is-hidden");
    adminModal.classList.remove("is-hidden");
    finishBoot();
    openAdminPanel();
    return;
  }

  awaitingInitialOverviewLand = true;
  window.setTimeout(() => {
    if (!awaitingInitialOverviewLand) return;
    console.warn("Initial land payload is still loading; showing the game shell.");
    showGameMessage("Карта ще довантажує землі. Можна користуватися грою, дані оновляться автоматично.");
    finishBoot();
  }, 7000);
  gameScreen.classList.remove("is-hidden");
  renderPlayerHeader();
  render();
  showGameMessage("Карту володінь завантажено.");
  refreshMessageSummary();
  loadGameSettings().then(() => initMap().catch((error) => {
    console.error("initMap failed:", error);
    showGameMessage(error?.message || "Не вдалося завантажити карту.");
    if (awaitingInitialOverviewLand) {
      awaitingInitialOverviewLand = false;
      finishBoot();
    }
  }));
}

async function logoutPlayer() {
  clearTimeout(saveTimer);
  if (player && (saveScope || saveInFlight)) {
    await saveState();
  }
  try {
    await requestJson("/api/logout", { method: "POST", body: "{}" });
  } catch {
    // Local logout still matters if the network request fails.
  }
  player = null;
  selectedCellId = null;
  selectedCellIds = new Set();
  activeChatUserId = null;
  saveScope = null;
  clearTimeout(saveTimer);
  clearInterval(messagesTimer);
  stopActiveChatPolling();
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("is-hidden"));
  hideSelectionPopup();
  hideCellInfoPanel();
  gameScreen.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
  finishBoot();
  loginForm?.reset();
  showAuthMessage("Ви вийшли з акаунта.");
}

function queueSave({ invalidateDerived = true, scope = "full" } = {}) {
  if (invalidateDerived) farmDerivedStatsCache = null;
  const requestedScope = player?.isGuest ? "full" : scope;
  if (requestedScope === "full" || saveScope !== "full") saveScope = requestedScope;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(), 350);
}

function compactFarmMeta() {
  return {
    coins: state.coins,
    currentDay: state.currentDay,
    inventory: state.inventory,
    lastIncomeAt: state.lastIncomeAt,
    stats: state.stats,
    events: state.events,
    ledger: state.ledger
  };
}

async function saveState() {
  if (!player) return;
  clearTimeout(saveTimer);
  if (saveInFlight) {
    let inFlightFailed = false;
    try {
      await saveInFlight;
    } catch {
      inFlightFailed = true;
    }
    if (!inFlightFailed && saveScope) return saveState();
    return;
  }
  const scope = saveScope;
  if (!scope) return;
  saveScope = null;

  saveInFlight = (async () => {
    const metaOnly = scope === "meta" && !player.isGuest;
    const payload = await requestJson(metaOnly ? "/api/save-meta" : "/api/save", {
      method: "POST",
      body: JSON.stringify(metaOnly ? { farm: compactFarmMeta() } : { farm: state })
    });
    if (Number.isFinite(payload.coins) && payload.coins !== state.coins) {
      state.coins = payload.coins;
      renderPlayerHeader();
    }
  })();

  let saveFailed = false;
  try {
    await saveInFlight;
  } catch (error) {
    saveFailed = true;
    saveScope = scope === "full" ? "full" : (saveScope || "meta");
    showGameMessage(error.message);
  } finally {
    saveInFlight = null;
  }
  if (saveScope && !saveFailed) return saveState();
  if (saveFailed && player) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveState(), 1200);
  }
}

async function initMap() {
  if (map) return;

  if (!globalThis.maplibregl) {
    await new Promise((resolve) => {
      const startedAt = Date.now();
      const tick = () => {
        if (globalThis.maplibregl || Date.now() - startedAt > 8000) {
          resolve();
          return;
        }
        window.setTimeout(tick, 120);
      };
      tick();
    });
  }

  if (!globalThis.maplibregl) {
    showGameMessage("MapLibre GL JS не завантажився. Перевірте підключення до інтернету.");
    finishBoot();
    return;
  }

  map = new maplibregl.Map({
    container: mapBoard,
    style: createUkraineVectorStyle(),
    center: [31.25, 49.02],
    zoom: MAP_ZOOM_LEVELS[0],
    minZoom: MAP_ZOOM_LEVELS[0],
    maxZoom: MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1],
    renderWorldCopies: false,
    dragRotate: false,
    pitchWithRotate: false,
    attributionControl: false
  });
  installMapLibreAdapter(map);
  map.scrollZoom.disable();
  map.dragRotate.disable();
  map.touchPitch?.disable?.();
  map.touchZoomRotate?.enable?.();
  map.touchZoomRotate?.disableRotation?.();
  map.addControl(new maplibregl.AttributionControl({ customAttribution: "© OpenStreetMap contributors" }), "bottom-right");
  globalThis.agroMap = map;
  document.agroMap = map;
  addMapZoomControl();
  addMapQuickActionsControl();

  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Карта завантажується надто довго.")), 10000);
    map.once("load", () => {
      window.clearTimeout(timeout);
      resolve();
    });
    map.once("error", (event) => {
      window.clearTimeout(timeout);
      reject(event?.error || new Error("Помилка завантаження карти."));
    });
  });
  initLandMapLayers();
  // Ownership aggregation is small and should appear before the large playable-grid mask.
  // On the production map that mask contains hundreds of thousands of cells.
  refreshVisibleLand();
  Promise.allSettled([loadUkraineBoundary(), loadPlayableGridMask()]).then(() => {
    scheduleGridUpdate(true);
  });
  useFallbackSettlements();
  updateSettlementMapSource();
  loadSettlementsInBackground();
  Promise.allSettled([refreshGlobalMarket(), refreshLeaderboard(), refreshNews(), refreshMessageSummary()]);
  requestIdleWork(addDeferredRayonLayer);

  map.on("movestart", () => {
    visibleLandRequestId += 1;
    cancelPendingGridRender();
    isMapMoving = true;
  });
  map.on("dragstart", () => {
    suppressMapClick = true;
  });
  map.on("dragend", () => {
    window.setTimeout(() => {
      suppressMapClick = false;
    }, 80);
  });
  map.on("move", () => {
    updateZoomBadge();
  });
  const handleSettledMapChange = () => {
    scheduleMapSettled();
  };
  map.on("zoomend", handleSettledMapChange);
  map.on("moveend", handleSettledMapChange);
  map.on("moveend", () => {
    clampMapLibreCenterToBounds();
  });
  map.on("resize", () => {
    scheduleMapSettled();
  });
  map.on("click", (event) => {
    if (event?.originalEvent?.button != null && event.originalEvent.button !== 0) return;
    if (suppressMapClick) return;
    selectCellAtMapPoint({
      latlng: { lat: event.lngLat.lat, lng: event.lngLat.lng },
      originalEvent: event.originalEvent || event
    });
  });
  setupShiftSelection();
  setTimeout(() => {
    map.invalidateSize();
    // Keep the first discrete level truly at the configured engine zoom. fitBounds() used to
    // calculate an intermediate value that could snap back to z7, so the badge said z5 while
    // MapLibre was still rendering a much closer view.
    map.jumpTo({ center: [31.25, 49.02], zoom: MAP_ZOOM_LEVELS[0] });
    updateZoomBadge();
    scheduleVisibleLandRefresh(20);
    updateGrid();
  }, 180);
  startBackgroundPolling();
}

function stopBackgroundPolling() {
  clearInterval(marketTimer);
  clearInterval(leaderboardTimer);
  clearInterval(newsTimer);
  clearInterval(messagesTimer);
  clearInterval(incomeTimer);
  marketTimer = leaderboardTimer = newsTimer = messagesTimer = incomeTimer = null;
}

function startBackgroundPolling() {
  stopBackgroundPolling();
  if (document.hidden || !player || window.location.pathname === "/admin") return;
  marketTimer = setInterval(refreshGlobalMarket, 20000);
  leaderboardTimer = setInterval(refreshLeaderboard, 10000);
  newsTimer = setInterval(refreshNews, 20000);
  messagesTimer = setInterval(refreshMessageSummary, 10000);
  if (!player?.isGuest) incomeTimer = setInterval(() => collectIncome({ silent: true }), 60000);
}

function addMapQuickActionsControl() {
  if (!clusterSelectButton || !newsButton || !mapBoard) return;
  const container = document.createElement("div");
  container.className = "map-quick-actions-control";
  container.append(clusterSelectButton, newsButton);
  mapBoard.appendChild(container);
}

function addMapZoomControl() {
  if (!mapBoard) return;
  const container = document.createElement("div");
  container.className = "map-zoom-control";
  const zoomIn = document.createElement("button");
  const zoomOut = document.createElement("button");
  zoomIn.type = "button";
  zoomOut.type = "button";
  zoomIn.textContent = "+";
  zoomOut.textContent = "−";
  zoomIn.addEventListener("click", () => stepMapZoom(1));
  zoomOut.addEventListener("click", () => stepMapZoom(-1));
  container.append(zoomIn, zoomOut);
  mapBoard.appendChild(container);
  mapBoard.addEventListener("wheel", (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelZoomAt < 180) return;
    lastWheelZoomAt = now;
    stepMapZoom(event.deltaY < 0 ? 1 : -1, mapCursorLngLat(event));
  }, { passive: false });
}

function scheduleMapSettled() {
  clearTimeout(mapSettledTimer);
  mapSettledTimer = setTimeout(() => {
    mapSettledTimer = null;
    if (enforceDiscreteZoom()) return;
    isMapMoving = false;
    updateZoomBadge();
    updateSettlementMapSource();
    requestMapBaseRender();
    scheduleGridUpdate(true);
    scheduleVisibleLandRefresh(true);
  }, 80);
}

function mapCursorLngLat(event) {
  if (!map || !mapBoard || typeof map.unproject !== "function") return null;
  const rect = mapBoard.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  const point = map.unproject([x, y]);
  if (!point || !Number.isFinite(point.lng) || !Number.isFinite(point.lat)) return null;
  return [point.lng, point.lat];
}

function stepMapZoom(direction, around = null) {
  if (!map) return;
  const current = snapZoom(map.getZoom());
  const index = MAP_ZOOM_LEVELS.indexOf(current);
  const nextIndex = Math.max(0, Math.min(MAP_ZOOM_LEVELS.length - 1, index + direction));
  if (nextIndex === index) return;
  const options = { zoom: MAP_ZOOM_LEVELS[nextIndex], duration: 220 };
  if (Array.isArray(around)) options.around = around;
  map.easeTo(options);
}

function createUkraineVectorStyle() {
  const rasterBaseUrl = globalThis.AGRO_RASTER_BASEMAP_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [rasterBaseUrl],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      },
      ukraine: { type: "geojson", data: "/ukraine-boundary.geojson" },
      oblasts: { type: "geojson", data: "/ukraine-adm1.geojson" }
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#f7f8f4" } },
      {
        id: "basemap-raster",
        type: "raster",
        source: "basemap",
        paint: {
          "raster-opacity": 1,
          "raster-resampling": "linear"
        }
      },
      {
        id: "ukraine-fill",
        type: "fill",
        source: "ukraine",
        paint: {
          "fill-color": "#edf6df",
          "fill-opacity": 0.14
        }
      },
      {
        id: "oblast-lines",
        type: "line",
        source: "oblasts",
        paint: {
          "line-color": "rgba(45, 86, 58, 0.36)",
          "line-width": ["interpolate", ["linear"], ["zoom"], MAP_ZOOM_LEVELS[0], 0.7, MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1], 1.4]
        }
      },
      {
        id: "ukraine-outline",
        type: "line",
        source: "ukraine",
        paint: {
          "line-color": "#18231d",
          "line-width": ["interpolate", ["linear"], ["zoom"], MAP_ZOOM_LEVELS[0], 1.6, MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1], 2.6]
        }
      },
    ]
  };
}

function addDeferredRayonLayer() {
  if (!map || map.getSource("rayons")) return;
  map.addSource("rayons", { type: "geojson", data: "/ukraine-adm2.geojson" });
  map.addLayer({
    id: "rayon-lines",
    type: "line",
    source: "rayons",
    minzoom: MAP_ZOOM_LEVELS[1],
    paint: {
      "line-color": "rgba(67, 115, 78, 0.22)",
      "line-width": ["interpolate", ["linear"], ["zoom"], MAP_ZOOM_LEVELS[1], 0.45, MAP_ZOOM_LEVELS[3], 1]
    }
  }, "ukraine-outline");
}

function installMapLibreAdapter(instance) {
  const nativeGetBounds = instance.getBounds.bind(instance);
  const nativeFitBounds = instance.fitBounds.bind(instance);
  const nativeSetMinZoom = instance.setMinZoom?.bind(instance);
  const nativeSetMaxZoom = instance.setMaxZoom?.bind(instance);
  instance.getBounds = () => mapLibreBoundsAdapter(nativeGetBounds());
  instance.latLngToContainerPoint = (latlng) => {
    const lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
    const lng = Array.isArray(latlng) ? latlng[1] : (latlng.lng ?? latlng.lon);
    const point = instance.project([lng, lat]);
    return { x: point.x, y: point.y };
  };
  instance.containerPointToLatLng = (point) => {
    const x = Array.isArray(point) ? point[0] : point.x;
    const y = Array.isArray(point) ? point[1] : point.y;
    const lngLat = instance.unproject([x, y]);
    return { lat: lngLat.lat, lng: lngLat.lng };
  };
  instance.setView = (center, zoom = instance.getZoom()) => {
    const lat = Array.isArray(center) ? center[0] : center.lat;
    const lng = Array.isArray(center) ? center[1] : center.lng;
    instance.easeTo({ center: [lng, lat], zoom: snapZoom(zoom), duration: 180 });
    return instance;
  };
  instance.fitBounds = (bounds, options = {}) => {
    const converted = Array.isArray(bounds)
      ? [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]]
      : [[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]];
    nativeFitBounds(converted, { padding: options.padding?.[0] || options.padding || 18, duration: 0 });
    return instance;
  };
  instance.invalidateSize = () => {
    instance.resize();
    return instance;
  };
  instance.dragging = {
    disable: () => instance.dragPan.disable(),
    enable: () => instance.dragPan.enable(),
    enabled: () => instance.dragPan.isEnabled()
  };
  instance.scrollZoom.setWheelZoomRate?.(1 / 260);
  if (nativeSetMinZoom) nativeSetMinZoom(MAP_ZOOM_LEVELS[0]);
  if (nativeSetMaxZoom) nativeSetMaxZoom(MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1]);
}

function snapZoom(zoom) {
  return MAP_ZOOM_LEVELS.reduce((closest, level) => (
    Math.abs(level - zoom) < Math.abs(closest - zoom) ? level : closest
  ), MAP_ZOOM_LEVELS[0]);
}

function displayZoomForMapZoom(zoom) {
  const snapped = snapZoom(zoom);
  const index = MAP_ZOOM_LEVELS.indexOf(snapped);
  return DISPLAY_ZOOM_LEVELS[index >= 0 ? index : 0];
}

function mapZoomForDisplayZoom(displayZoom) {
  const exactIndex = DISPLAY_ZOOM_LEVELS.indexOf(Number(displayZoom));
  if (exactIndex >= 0) return MAP_ZOOM_LEVELS[exactIndex];
  const fallbackIndex = DISPLAY_ZOOM_LEVELS.findIndex((zoom) => zoom > displayZoom);
  return MAP_ZOOM_LEVELS[fallbackIndex >= 0 ? fallbackIndex : MAP_ZOOM_LEVELS.length - 1];
}

function zoomPresetForMapZoom(zoom = map?.getZoom?.() ?? MAP_ZOOM_LEVELS[0]) {
  const snapped = snapZoom(zoom);
  const index = MAP_ZOOM_LEVELS.findIndex((level) => Math.abs(level - snapped) < 0.001);
  return MAP_ZOOM_PRESETS[index >= 0 ? index : 0] || MAP_ZOOM_PRESETS[0];
}

function applyZoomConfigToLiveMap(preferredZoom = null) {
  if (!map) return;
  map.setMinZoom?.(MAP_ZOOM_LEVELS[0]);
  map.setMaxZoom?.(MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1]);
  const desiredZoom = Number.isFinite(Number(preferredZoom)) ? Number(preferredZoom) : map.getZoom();
  const snapped = snapZoom(desiredZoom);
  const nextMode = zoomPresetForMapZoom(snapped)?.mode === "detail" ? "detail" : "overview";
  const previousMode = currentLandRenderMode();
  if (Math.abs(snapped - map.getZoom()) > 0.001) map.jumpTo({ zoom: snapped });
  if (previousMode !== nextMode) resetLandLayerForMode(nextMode);
  scheduleVisibleLandRefresh(true);
  scheduleGridUpdate(true);
  updateZoomBadge();
}

function enforceDiscreteZoom() {
  if (!map) return false;
  const snapped = snapZoom(map.getZoom());
  if (Math.abs(snapped - map.getZoom()) < 0.02) return false;
  map.jumpTo({ zoom: snapped });
  return true;
}

function mapLibreBoundsAdapter(bounds) {
  return {
    getWest: () => bounds.getWest(),
    getEast: () => bounds.getEast(),
    getSouth: () => bounds.getSouth(),
    getNorth: () => bounds.getNorth(),
    pad(ratio = 0) {
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const north = bounds.getNorth();
      const lngPad = (east - west) * ratio;
      const latPad = (north - south) * ratio;
      return mathBounds({
        west: west - lngPad,
        east: east + lngPad,
        south: south - latPad,
        north: north + latPad
      });
    }
  };
}

function initSplashMap() {
  const splashMap = document.querySelector("#splashMap");
  if (!splashMap) return;
  drawStaticUkrainePreview(splashMap, fallbackUkrainePolygon);
}

function settlementWeightForType(type) {
  if (type === "oblast") return 900000;
  if (type === "rayon") return 280000;
  if (type === "city") return 160000;
  if (type === "town") return 42000;
  return 9000;
}

function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

function initLandMapLayers() {
  if (!map || map.getSource("game-land")) return;
  map.addSource("game-land", { type: "geojson", data: emptyFeatureCollection() });
  map.addLayer({ id: "game-land-fill", type: "fill", source: "game-land", paint: {
    "fill-color": ["get", "fill"], "fill-opacity": ["get", "fillOpacity"]
  }});
  map.addLayer({ id: "game-land-line", type: "line", source: "game-land", paint: {
    "line-color": ["get", "stroke"], "line-opacity": ["get", "strokeOpacity"], "line-width": ["get", "strokeWidth"]
  }});
}

function cellFeature(cell) {
  const parsed = parseHexId(cell.id);
  const boundary = cell.boundary || rectBoundaryLatLng(parsed.q, parsed.r);
  const owner = cell.overviewOwner || getOwner(cell.id);
  const selected = selectedCellIds.has(cell.id) || selectedCellId === cell.id;
  const zoom = displayZoomForMapZoom(map.getZoom());
  const preset = zoomPresetForMapZoom(map.getZoom());
  const freeGridOpacity = preset?.showFreeGrid ? Math.max(0, Math.min(1, Number(preset.freeGridOpacity) || 0)) : 0;
  const color = cell.overviewColor || (owner === "player" ? state.color : owner === "rival" ? rivalColorForCell(cell.id) : "#111111");
  const overviewOpacity = cell.overviewOwner ? Math.max(0.12, Math.min(0.48, Number(cell.occupied || 1) * 0.48)) : null;
  return {
    type: "Feature", id: cell.id,
    properties: {
      id: cell.id,
      fill: selected ? "#ffb000" : owner === "free" ? "#ffffff" : color,
      fillOpacity: selected ? 0.42 : overviewOpacity ?? (owner === "player" ? 0.48 : owner === "rival" ? 0.38 : 0),
      stroke: selected ? "#ffb000" : owner === "free" ? "#111111" : color,
      strokeOpacity: selected ? 1 : cell.overviewOwner ? 0.65 : owner === "free" ? freeGridOpacity : 0.38,
      strokeWidth: selected ? 2 : cell.overviewOwner ? 1.2 : 0.75
    },
    geometry: { type: "Polygon", coordinates: [[...boundary.map(([lat, lng]) => [lng, lat]), [boundary[0][1], boundary[0][0]]]] }
  };
}

function updateLandMapSource(cells = visibleCells) {
  const nextCells = Array.isArray(cells) ? cells : [];
  visibleCellById = new Map(nextCells.map((cell) => [cell.id, cell]));
  const source = map?.getSource?.("game-land");
  if (source) source.setData({ type: "FeatureCollection", features: nextCells.map(cellFeature) });
}

async function loadPlayableGridMask() {
  try {
    const payload = await requestJson("/playable-grid.json");
    playableGridRows = new Map(Object.entries(payload.rows || {}).map(([row, ranges]) => [Number(row), ranges]));
  } catch {
    playableGridRows = null;
  }
}

function curatedSettlementLabels() {
  const labels = [
    ["Київська область", 50.45, 30.52, 7, "oblast"],
    ["Львівська область", 49.84, 24.03, 7, "oblast"],
    ["Одеська область", 46.48, 30.72, 7, "oblast"],
    ["Харківська область", 49.99, 36.23, 7, "oblast"],
    ["Дніпропетровська область", 48.46, 35.05, 7, "oblast"],
    ["Запорізька область", 47.84, 35.14, 7, "oblast"],
    ["Полтавська область", 49.59, 34.55, 7, "oblast"],
    ["Вінницька область", 49.23, 28.47, 7, "oblast"],
    ["Черкаська область", 49.44, 32.06, 7, "oblast"],
    ["Кіровоградська область", 48.51, 32.26, 7, "oblast"],
    ["Чернігівська область", 51.50, 31.29, 7, "oblast"],
    ["Сумська область", 50.91, 34.80, 7, "oblast"],
    ["Житомирська область", 50.25, 28.66, 7, "oblast"],
    ["Рівненська область", 50.62, 26.25, 7, "oblast"],
    ["Волинська область", 50.75, 25.33, 7, "oblast"],
    ["Тернопільська область", 49.55, 25.59, 7, "oblast"],
    ["Хмельницька область", 49.42, 26.99, 7, "oblast"],
    ["Чернівецька область", 48.29, 25.94, 7, "oblast"],
    ["Івано-Франківська область", 48.92, 24.71, 7, "oblast"],
    ["Закарпатська область", 48.62, 22.29, 7, "oblast"],
    ["Миколаївська область", 46.98, 31.99, 7, "oblast"],
    ["Херсонська область", 46.64, 32.62, 7, "oblast"],
    ["Донецька область", 48.02, 37.80, 7, "oblast"],
    ["Луганська область", 48.57, 39.31, 7, "oblast"],
    ["Автономна Республіка Крим", 44.95, 34.10, 7, "oblast"],
    ["Кропивницький район", 48.51, 32.26, 9, "rayon"],
    ["Олександрійський район", 48.67, 33.12, 9, "rayon"],
    ["Голованівський район", 48.39, 30.45, 9, "rayon"],
    ["Новоукраїнський район", 48.33, 31.53, 9, "rayon"],
    ["Полтавський район", 49.59, 34.55, 9, "rayon"],
    ["Кременчуцький район", 49.07, 33.42, 9, "rayon"],
    ["Уманський район", 48.75, 30.22, 9, "rayon"],
    ["Черкаський район", 49.44, 32.06, 9, "rayon"],
    ["Білоцерківський район", 49.80, 30.12, 9, "rayon"],
    ["Львівський район", 49.84, 24.03, 9, "rayon"],
    ["Тернопільський район", 49.55, 25.59, 9, "rayon"],
    ["Київ", 50.45, 30.52, 11, "city"],
    ["Львів", 49.84, 24.03, 11, "city"],
    ["Одеса", 46.48, 30.72, 11, "city"],
    ["Харків", 49.99, 36.23, 11, "city"],
    ["Дніпро", 48.46, 35.05, 11, "city"],
    ["Кропивницький", 48.51, 32.26, 11, "city"],
    ["Полтава", 49.59, 34.55, 11, "city"],
    ["Черкаси", 49.44, 32.06, 11, "city"],
    ["Вінниця", 49.23, 28.47, 11, "city"],
    ["Кременчук", 49.07, 33.42, 11, "city"],
    ["Умань", 48.75, 30.22, 11, "city"],
    ["Олександрія", 48.67, 33.12, 11, "city"],
    ["Знам'янка", 48.71, 32.66, 12, "town"],
    ["Новоукраїнка", 48.33, 31.53, 12, "town"],
    ["Долинська", 48.11, 32.76, 12, "town"],
    ["Світловодськ", 49.05, 33.25, 12, "town"],
    ["Гайворон", 48.34, 29.86, 12, "town"],
    ["Миргород", 49.97, 33.61, 12, "town"],
    ["Решетилівка", 49.57, 34.08, 12, "town"],
    ["Пантаївка", 48.67, 32.88, 13, "village"],
    ["Суботці", 48.66, 32.52, 13, "village"],
    ["Дмитрівка", 48.77, 32.72, 13, "village"],
    ["Нова Прага", 48.57, 32.90, 13, "village"],
    ["Чорний Ліс", 48.70, 32.48, 13, "village"],
    ["Велика Виска", 48.37, 31.97, 13, "village"],
    ["Аджамка", 48.54, 32.54, 13, "village"],
    ["Мала Виска", 48.64, 31.64, 13, "village"]
  ];
  return labels.map(([n, lat, lng, z, type]) => ({ n, lat, lng, z, type, p: settlementWeightForType(type), f: "PPL" }));
}

async function loadSettlements() {
  useFallbackSettlements();
}

function useFallbackSettlements() {
  settlementPlaces = curatedSettlementLabels();
  settlementGrid = buildSettlementGrid(settlementPlaces);
}

async function loadSettlementsInBackground() {
  useFallbackSettlements();
  updateSettlementMapSource();
}

function requestIdleWork(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 2500 });
  } else {
    window.setTimeout(callback, 1200);
  }
}

function updateSettlementMapSource() {
  requestMapBaseRender();
}

async function refreshGlobalMarket() {
  try {
    const nextMarket = await requestJson(`/api/market?version=${encodeURIComponent(marketVersion || 0)}`);
    if (nextMarket?.notModified) return;
    const nextOwnedCount = Number(nextMarket?.stats?.ownedCells) || 0;
    if (nextMarket?.resetAt && !state.lastAdminResetAt) {
      state.lastAdminResetAt = nextMarket.resetAt;
    }
    const resetChanged = nextMarket?.resetAt && state.lastAdminResetAt !== nextMarket.resetAt;
    const marketChanged = nextOwnedCount !== marketOwnedCellCount
      || Number(nextMarket?.version) !== marketVersion
      || resetChanged;
    globalMarketState = nextMarket;
    marketVersion = Number(nextMarket?.version) || marketVersion;
    marketOwnedCellCount = nextOwnedCount;
    if (resetChanged) {
      state.land = {};
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
      state.lastAdminResetAt = nextMarket.resetAt;
      selectedCellIds = new Set();
      selectedCellId = null;
      visibleLandState = { version: 0, owners: {}, cells: {} };
      overviewTerritories = [];
      queueSave();
    }
    reconcileLocalLandWithVisibleState();
    if (map && marketChanged) {
      scheduleVisibleLandRefresh(true);
      renderHeader();
      renderLeaderboard();
    }
  } catch {
    globalMarketState = globalMarketState || { version: 0, resetAt: null, stats: { ownedCells: 0 } };
  }
}

async function refreshMarket() {
  return refreshGlobalMarket();
}

function mapViewportQuery() {
  if (!map) return null;
  const bounds = map.getBounds().pad(currentLandRenderMode() === "overview" ? 0.22 : 0.08);
  const level = currentChunkLevel();
  const cellsPerChunk = level <= 1 ? 512 : level === 2 ? 256 : level === 3 ? 128 : 32;
  const chunkWidth = cellsPerChunk * RECT_CELL_WIDTH_DEGREES;
  const chunkHeight = cellsPerChunk * RECT_CELL_HEIGHT_DEGREES;
  const minChunkQ = Math.floor((bounds.getWest() - MAP_BOUNDS.west) / chunkWidth);
  const maxChunkQ = Math.floor((bounds.getEast() - MAP_BOUNDS.west) / chunkWidth);
  const minChunkR = Math.floor((MAP_BOUNDS.north - bounds.getNorth()) / chunkHeight);
  const maxChunkR = Math.floor((MAP_BOUNDS.north - bounds.getSouth()) / chunkHeight);
  return new URLSearchParams({
    west: (MAP_BOUNDS.west + minChunkQ * chunkWidth).toFixed(5),
    east: (MAP_BOUNDS.west + (maxChunkQ + 1) * chunkWidth).toFixed(5),
    north: (MAP_BOUNDS.north - minChunkR * chunkHeight).toFixed(5),
    south: (MAP_BOUNDS.north - (maxChunkR + 1) * chunkHeight).toFixed(5),
    minChunkQ: String(minChunkQ), maxChunkQ: String(maxChunkQ),
    minChunkR: String(minChunkR), maxChunkR: String(maxChunkR),
    zoom: String(Math.round(displayZoomForMapZoom(map.getZoom()))),
    limit: String(Math.max(6000, Math.min(MAX_CONFIGURED_OWNED_CELLS, Number(gameSettings?.map?.maxOwnedCellsPerViewport) || 50000))),
    version: String(marketVersion || 0),
    playerId: player?.id || ""
  });
}

function currentChunkLevel() {
  const zoom = Math.round(displayZoomForMapZoom(map?.getZoom?.() || 7));
  if (zoom <= 7) return 1;
  if (zoom <= 9) return 2;
  if (zoom <= 11) return 3;
  if (zoom <= 12) return 4;
  return 4;
}

function chunkCacheKey(level, query) {
  return [
    `z${level}`,
    query.get("minChunkQ"), query.get("maxChunkQ"),
    query.get("minChunkR"), query.get("maxChunkR"),
    query.get("zoom"),
    marketVersion || 0,
    player?.id || ""
  ].join(":");
}

function getChunkCache(key) {
  const cached = chunkCache.get(key);
  if (!cached) return null;
  cached.lastUsed = Date.now();
  return cached.payload;
}

function setChunkCache(key, payload) {
  chunkCache.set(key, { payload, lastUsed: Date.now() });
  if (chunkCache.size <= CHUNK_CACHE_LIMIT) return;
  const oldest = [...chunkCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed).slice(0, chunkCache.size - CHUNK_CACHE_LIMIT);
  oldest.forEach(([oldKey]) => chunkCache.delete(oldKey));
}

function invalidateChunkCache() {
  chunkCache.clear();
  visibleLandBoundsKey = "";
  visibleLandVersion = 0;
}

async function refreshVisibleLand() {
  if (!map) return;
  const requestId = ++visibleLandRequestId;
  try {
    const mode = currentLandRenderMode();
    if (mode === "overview") {
      const query = mapViewportQuery();
      if (!query) return;
      const cacheKey = chunkCacheKey(currentChunkLevel(), query);
      const cached = getChunkCache(cacheKey);
      const payload = cached || await requestJson(`/api/map/overview?z=${query.get("zoom")}&${query.toString()}`);
      if (requestId !== visibleLandRequestId || currentLandRenderMode() !== "overview") return;
      if (payload?.notModified) {
        if (awaitingInitialOverviewLand) {
          awaitingInitialOverviewLand = false;
          finishBoot();
        }
        return;
      }
      if (!cached) setChunkCache(cacheKey, payload);
      overviewTerritories = Array.isArray(payload.territories) ? payload.territories : [];
      if (payload.truncated) {
        console.warn("Overview territory payload reached its configured cap.", { limit: gameSettings?.map?.overviewMaxTerritories, zoom: query.get("zoom") });
      }
      if (Number.isFinite(payload.version)) marketVersion = payload.version;
      resetLandLayerForMode(mode);
      updateGrid();
      if (awaitingInitialOverviewLand) {
        awaitingInitialOverviewLand = false;
        finishBoot();
      }
      return;
    }

    overviewTerritories = [];
    const query = mapViewportQuery();
    if (!query) return;
    const boundsKey = chunkCacheKey(4, query);
    if (boundsKey === visibleLandBoundsKey && visibleLandVersion === marketVersion) {
      visibleCells = isOverviewZoom() ? overviewTerritoryCells() : visibleCells;
      if (isOverviewZoom() && visibleCells.length) updateLandMapSource(visibleCells);
      renderGridGpuLayer();
      return;
    }
    const cached = getChunkCache(boundsKey);
    const payload = cached || await requestJson(`/api/map/cells?${query.toString()}`);
    if (requestId !== visibleLandRequestId || currentLandRenderMode() !== mode) return;
    if (payload?.notModified) return;
    if (!cached) setChunkCache(boundsKey, payload);
    visibleLandBoundsKey = boundsKey;
    visibleLandVersion = Number(payload.version) || marketVersion;
    visibleLandState = {
      version: Number(payload.version) || marketVersion,
      owners: payload.owners && typeof payload.owners === "object" ? payload.owners : {},
      cells: {}
    };
    (payload.cells || []).forEach((cell) => {
      if (!cell?.id) return;
      visibleLandState.cells[cell.id] = {
        o: cell.o,
        l: cell.l || 1,
        b: typeof cell.b === "string" ? cell.b : null,
        g: typeof cell.g === "string" ? cell.g : null
      };
      if (cell.o && payload.owners?.[cell.o] && !visibleLandState.owners[cell.o]) {
        visibleLandState.owners[cell.o] = payload.owners[cell.o];
      }
    });
    // Never replace a detail zoom with overview polygons merely because the ownership payload
    // hit its safety cap. That old fallback was the main reason z10 sometimes looked like the
    // previous/coarser zoom and the free-cell grid disappeared until the next pan.
    if (payload.truncated) {
      console.warn("Viewport ownership payload was truncated; keeping the configured detail grid.", { limit: query.get("limit"), zoom: query.get("zoom") });
    }
    if (Number.isFinite(payload.version)) marketVersion = payload.version;
    resetLandLayerForMode(mode);
    reconcileLocalLandWithVisibleState();
    updateGrid();
  } catch {
    visibleLandState = visibleLandState || { version: 0, owners: {}, cells: {} };
    if (awaitingInitialOverviewLand && currentLandRenderMode() === "overview") {
      awaitingInitialOverviewLand = false;
      finishBoot();
    }
  }
}

function scheduleVisibleLandRefresh(immediate = false) {
  clearTimeout(visibleLandTimer);
  visibleLandTimer = setTimeout(() => {
    visibleLandTimer = null;
    refreshVisibleLand();
  }, immediate ? 0 : 120);
}

function invalidateVisibleLandCache() {
  invalidateChunkCache();
}

function reconcileLocalLandWithVisibleState() {
  if (!player?.id || !state?.land) return;
  let changed = false;
  Object.keys(state.land).forEach((id) => {
    const remote = visibleLandState.cells[id];
    if (remote && remote.o !== player.id) {
      delete state.land[id];
      changed = true;
    }
    if (player.isGuest && remote && remote.o !== player.id) {
      delete state.land[id];
      changed = true;
    }
  });
  if (changed) {
    landMembershipRevision += 1;
    farmDerivedStatsCache = null;
    queueSave();
  }
}

function visibleLandOwner(cellId) {
  return visibleLandState.cells[cellId] || null;
}

function visibleOwnerMeta(ownerId) {
  return visibleLandState.owners[ownerId] || null;
}

function applyClaimedCellsToVisibleLand(claimedIds) {
  if (!player?.id || !claimedIds?.length) return;
  visibleLandState.owners[player.id] = {
    color: state.color || "#35c982",
    name: state.companyName || player.username || "Гравець"
  };
  claimedIds.forEach((id) => {
    visibleLandState.cells[id] = { o: player.id, l: 1 };
  });
  visibleLandVersion = marketVersion;
  invalidateGridGeometryCache();
}

function removeCellsFromVisibleLand(cellIds) {
  if (!cellIds?.length) return;
  cellIds.forEach((id) => {
    delete visibleLandState.cells[id];
  });
  visibleLandVersion = marketVersion;
  invalidateGridGeometryCache();
}

function invalidateGridGeometryCache() {
  gridGeometryCache = null;
}

async function refreshLeaderboard() {
  try {
    const payload = await requestJson(`/api/leaderboard?version=${encodeURIComponent(leaderboardVersion || 0)}`);
    if (payload?.notModified) return;
    leaderboardVersion = Number(payload?.version) || leaderboardVersion;
    leaderboardRows = Array.isArray(payload.rows) ? payload.rows : [];
    renderLeaderboard();
  } catch {
    leaderboardRows = [];
  }
}

async function refreshNews() {
  try {
    const payload = await requestJson("/api/news");
    newsRows = Array.isArray(payload.rows) ? payload.rows : [];
    renderNews();
  } catch {
    newsRows = [];
    renderNews();
  }
}

function buildSettlementGrid(places) {
  const grid = new Map();
  places.forEach((place) => {
    const key = settlementGridKey(place.lat, place.lng);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(place);
  });
  return grid;
}

function settlementGridKey(lat, lng) {
  return `${Math.floor(lat / SETTLEMENT_GRID_SIZE)}:${Math.floor(lng / SETTLEMENT_GRID_SIZE)}`;
}

async function loadUkraineBoundary() {
  try {
    const geojson = await fetch("/ukraine-boundary.geojson").then((response) => {
      if (!response.ok) throw new Error("Local boundary file is unavailable.");
      return response.json();
    });
    ukrainePolygons = extractPolygonsFromGeoJson(geojson);
  } catch {
    ukrainePolygons = fallbackUkrainePolygon;
    showGameMessage("Не вдалося завантажити локальний кордон, використано резервний контур України.");
  }
}

function extractPolygonsFromGeoJson(geojson) {
  const features = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const polygons = [];

  features.forEach((feature) => {
    const geometry = feature.geometry || feature;
    if (!geometry) return;
    if (geometry.type === "Polygon") polygons.push(geometry.coordinates);
    if (geometry.type === "MultiPolygon") polygons.push(...geometry.coordinates);
  });

  return polygons.length ? polygons : fallbackUkrainePolygon;
}

function mathBounds(bounds) {
  return {
    getSouth: () => bounds.south,
    getNorth: () => bounds.north,
    getWest: () => bounds.west,
    getEast: () => bounds.east,
    pad(amount = 0) {
      const latPad = (bounds.north - bounds.south) * amount;
      const lngPad = (bounds.east - bounds.west) * amount;
      return mathBounds({
        south: bounds.south - latPad,
        north: bounds.north + latPad,
        west: bounds.west - lngPad,
        east: bounds.east + lngPad
      });
    }
  };
}

function createMathMap(container, options = {}) {
  const listeners = new Map();
  const state = {
    center: { lat: options.center?.[0] || 49.02, lng: options.center?.[1] || 31.25 },
    zoom: options.zoom || 6,
    minZoom: options.minZoom || 4,
    maxZoom: options.maxZoom || 13
  };
  const api = {
    on(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
      return api;
    },
    emit(type, payload = {}) {
      listeners.get(type)?.forEach((handler) => handler(payload));
      return api;
    },
    getZoom: () => state.zoom,
    getMaxZoom: () => state.maxZoom,
    getCenter: () => ({ ...state.center }),
    getBounds: () => viewportBounds(state.center, state.zoom),
    getSize: () => {
      const rect = container.getBoundingClientRect();
      return { x: rect.width, y: rect.height };
    },
    latLngToContainerPoint(latlng) {
      const lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
      const lng = Array.isArray(latlng) ? latlng[1] : latlng.lng;
      return latLngToPoint(lat, lng, state.center, state.zoom, container);
    },
    containerPointToLatLng(point) {
      const x = Array.isArray(point) ? point[0] : point.x;
      const y = Array.isArray(point) ? point[1] : point.y;
      return pointToLatLng(x, y, state.center, state.zoom, container);
    },
    setView(center, zoom = state.zoom) {
      state.center = clampCenter({ lat: Array.isArray(center) ? center[0] : center.lat, lng: Array.isArray(center) ? center[1] : center.lng });
      state.zoom = clampZoom(zoom, state.minZoom, state.maxZoom);
      api.emit("move");
      api.emit("moveend");
      api.emit("zoomend");
      return api;
    },
    fitBounds(bounds) {
      state.center = clampCenter({
        lat: (bounds.getSouth() + bounds.getNorth()) / 2,
        lng: (bounds.getWest() + bounds.getEast()) / 2
      });
      state.zoom = 6;
      api.emit("move");
      api.emit("moveend");
      api.emit("zoomend");
      return api;
    },
    invalidateSize() {
      api.emit("resize");
      return api;
    },
    dragging: {
      _enabled: true,
      disable() { this._enabled = false; },
      enable() { this._enabled = true; }
    }
  };
  setupMathMapInput(container, api, state);
  return api;
}

function setupMathMapInput(container, api, state) {
  container.addEventListener("wheel", (event) => {
    event.preventDefault();
    const nextZoom = clampZoom(state.zoom + (event.deltaY < 0 ? 1 : -1), state.minZoom, state.maxZoom);
    if (nextZoom === state.zoom) return;
    state.zoom = nextZoom;
    api.emit("move");
    api.emit("zoomend");
    api.emit("moveend");
  }, { passive: false });

  container.addEventListener("pointerdown", (event) => {
    if (event.shiftKey || clusterSelectionMode) return;
    if (!api.dragging._enabled || event.button !== 0 || event.target.closest("button, input, textarea, select, .modal")) return;
    mapPointerState = { x: event.clientX, y: event.clientY, center: { ...state.center }, moved: false };
    container.setPointerCapture?.(event.pointerId);
    api.emit("movestart");
  });
  container.addEventListener("pointermove", (event) => {
    if (!mapPointerState || !api.dragging._enabled) return;
    const dx = event.clientX - mapPointerState.x;
    const dy = event.clientY - mapPointerState.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) mapPointerState.moved = true;
    const startPixel = lngLatToGlobalPixel(mapPointerState.center.lat, mapPointerState.center.lng, state.zoom);
    state.center = clampCenter(globalPixelToLngLat(startPixel.x - dx, startPixel.y - dy, state.zoom));
    api.emit("move");
  });
  container.addEventListener("pointerup", (event) => {
    const pointer = mapPointerState;
    mapPointerState = null;
    container.releasePointerCapture?.(event.pointerId);
    api.emit("moveend");
    if (!pointer?.moved) {
      const rect = container.getBoundingClientRect();
      const latlng = api.containerPointToLatLng([event.clientX - rect.left, event.clientY - rect.top]);
      api.emit("click", { latlng, originalEvent: event });
    }
  });
  window.addEventListener("resize", () => api.emit("resize"));
}

function clampZoom(zoom, minZoom, maxZoom) {
  return Math.max(minZoom, Math.min(maxZoom, Math.round(Number(zoom) || minZoom)));
}

function clampCenter(center) {
  return {
    lat: Math.max(MAP_BOUNDS.south, Math.min(MAP_BOUNDS.north, center.lat)),
    lng: Math.max(MAP_BOUNDS.west, Math.min(MAP_BOUNDS.east, center.lng))
  };
}

function latLngToPoint(lat, lng, center, zoom, container = mapBoard) {
  const rect = container.getBoundingClientRect();
  const centerPixel = lngLatToGlobalPixel(center.lat, center.lng, zoom);
  const pixel = lngLatToGlobalPixel(lat, lng, zoom);
  return {
    x: rect.width / 2 + pixel.x - centerPixel.x,
    y: rect.height / 2 + pixel.y - centerPixel.y
  };
}

function pointToLatLng(x, y, center, zoom, container = mapBoard) {
  const rect = container.getBoundingClientRect();
  const centerPixel = lngLatToGlobalPixel(center.lat, center.lng, zoom);
  return globalPixelToLngLat(centerPixel.x + x - rect.width / 2, centerPixel.y + y - rect.height / 2, zoom);
}

function viewportBounds(center, zoom) {
  const rect = mapBoard.getBoundingClientRect();
  const northWest = pointToLatLng(0, 0, center, zoom, mapBoard);
  const southEast = pointToLatLng(rect.width, rect.height, center, zoom, mapBoard);
  return mathBounds({
    south: Math.min(northWest.lat, southEast.lat),
    north: Math.max(northWest.lat, southEast.lat),
    west: Math.min(northWest.lng, southEast.lng),
    east: Math.max(northWest.lng, southEast.lng)
  });
}

function lngLatToGlobalPixel(lat, lng, zoom) {
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, Number(lat) || 0));
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin(clampedLat * Math.PI / 180);
  return {
    x: ((Number(lng) || 0) + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function globalPixelToLngLat(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / scale;
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

function drawStaticUkrainePreview(container, polygons) {
  container.innerHTML = "";
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const rect = container.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width || 640));
  canvas.height = Math.max(1, Math.round(rect.height || 360));
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  const context = canvas.getContext("2d");
  drawUkrainePolygons(context, polygons, canvas.width, canvas.height, mathBounds(MAP_BOUNDS), true);
}

function requestMapBaseRender() {
  if (mapBaseRenderFrame) return;
  mapBaseRenderFrame = requestAnimationFrame(() => {
    mapBaseRenderFrame = null;
  });
}

function drawUkrainePolygons(context, polygons, width, height, bounds, staticPreview) {
  context.save();
  context.lineJoin = "round";
  context.lineCap = "round";
  polygons.forEach((polygon) => {
    const rings = polygon.map((ring) => ring.map(([lng, lat]) => {
      if (staticPreview) {
        return {
          x: (lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west) * width,
          y: (MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south) * height
        };
      }
      return map.latLngToContainerPoint([lat, lng]);
    }));
    context.beginPath();
    rings.forEach((ring) => {
      ring.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
    });
    context.fillStyle = staticPreview ? "rgba(53, 201, 130, 0.16)" : "rgba(53, 201, 130, 0.012)";
    context.strokeStyle = staticPreview ? "#9ee85f" : "#18231d";
    context.lineWidth = staticPreview ? 2 : 2.2;
    context.fill("evenodd");
    context.stroke();
  });
  context.restore();
}

function drawSettlementLabels() {
  return;
}

function initGridGpuLayer() {
  if (gridCanvas || !mapBoard) return;
  gridCanvas = document.createElement("canvas");
  gridCanvas.className = "regular-grid-gpu-canvas";
  gridCanvas.setAttribute("aria-hidden", "true");
  mapBoard.appendChild(gridCanvas);
  gridGl = gridCanvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true })
    || gridCanvas.getContext("experimental-webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gridGl) {
    showGameMessage("WebGL недоступний. Карта може працювати повільніше.");
    return;
  }
  gridProgram = createGridProgram(gridGl);
  gridFillBuffer = gridGl.createBuffer();
  gridBorderBuffer = gridGl.createBuffer();
  syncGridGpuCanvas();
}

function createGridProgram(gl) {
  const vertexSource = [
    "attribute vec2 a_position;",
    "attribute vec4 a_color;",
    "varying vec4 v_color;",
    "void main() {",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "  v_color = a_color;",
    "}"
  ].join("\n");
  const fragmentSource = [
    "precision mediump float;",
    "varying vec4 v_color;",
    "void main() {",
    "  gl_FragColor = v_color;",
    "}"
  ].join("\n");
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Grid shader link failed.");
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Grid shader compile failed.");
  return shader;
}

function refreshCanvasMapLayers() {
  requestMapBaseRender();
  updateLandMapSource(visibleCells);
}

function syncGridGpuCanvas() {
  if (!gridCanvas || !mapBoard) return;
  const ratio = Math.min(1.5, window.devicePixelRatio || 1);
  const rect = mapBoard.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (gridCanvas.width !== width || gridCanvas.height !== height) {
    gridCanvas.width = width;
    gridCanvas.height = height;
    invalidateGridGeometryCache();
  }
  gridCanvas.style.width = rect.width + "px";
  gridCanvas.style.height = rect.height + "px";
  renderGridGpuLayer();
}

function setGridCanvasVisible(visible) {
  if (!gridCanvas) return;
  gridCanvas.style.visibility = visible ? "visible" : "hidden";
}

function updateZoomBadge() {
  if (!zoomBadge || !map) return;
  zoomBadge.textContent = `Zoom ${displayZoomForMapZoom(map.getZoom())}`;
  const overview = isOverviewZoom();
  if (clusterSelectButton) {
    clusterSelectButton.disabled = overview;
    clusterSelectButton.classList.toggle("is-hidden", overview);
    clusterSelectButton.title = overview ? "Виділення доступне на Zoom 10/12" : "";
  }
  if (overview && clusterSelectionMode) setClusterSelectionMode(false);
}

function updateGridGpuLayer(cells = visibleCells) {
  if (!DRAW_GRID) {
    visibleCells = [];
    clearGridGpuLayer();
    return false;
  }
  visibleCells = Array.isArray(cells) ? cells : visibleCells;
  renderGridGpuLayer();
  return true;
}

function clearGridGpuLayer() {
  if (!gridGl || !gridCanvas) return;
  gridGl.viewport(0, 0, gridCanvas.width, gridCanvas.height);
  gridGl.clearColor(0, 0, 0, 0);
  gridGl.clear(gridGl.COLOR_BUFFER_BIT);
}

function gridGeometryCacheKey(cellsToDraw, rect) {
  const bounds = map.getBounds();
  const zoom = snapZoom(map.getZoom());
  const selectionKey = selectedCellId || "";
  const selectionSize = selectedCellIds.size;
  const firstCell = cellsToDraw[0]?.id || "";
  const middleCell = cellsToDraw[Math.floor(cellsToDraw.length / 2)]?.id || "";
  const lastCell = cellsToDraw[cellsToDraw.length - 1]?.id || "";
  const cellKey = `${firstCell}:${middleCell}:${lastCell}`;
  return [
    currentLandRenderMode(),
    visibleLandState.version,
    marketVersion,
    zoom,
    bounds.getWest().toFixed(6),
    bounds.getEast().toFixed(6),
    bounds.getSouth().toFixed(6),
    bounds.getNorth().toFixed(6),
    rect.width,
    rect.height,
    cellsToDraw.length,
    cellKey,
    selectionKey,
    selectionSize,
    shouldDrawCellBorders() ? "cell-borders" : shouldDrawTerritoryBorders() ? "territory-borders" : "no-borders"
  ].join("|");
}

function shouldDrawCellBorders() {
  return map && !isOverviewZoom() && map.getZoom() >= detailZoomStart();
}

function shouldDrawTerritoryBorders() {
  return map && isOverviewZoom();
}

function buildGridGeometry(cellsToDraw, rect) {
  const strokeVertices = [];
  const fillVertices = [];
  const drawCellBorders = shouldDrawCellBorders();
  const drawTerritoryBorders = shouldDrawTerritoryBorders();
  cellsToDraw.forEach((cell) => {
    appendCellVertices(strokeVertices, fillVertices, cell, rect.width, rect.height, drawCellBorders, drawTerritoryBorders);
  });
  return {
    fillVertices: new Float32Array(fillVertices),
    borderVertices: strokeVertices.length ? new Float32Array(strokeVertices) : null,
    fillCount: fillVertices.length / 6,
    borderCount: strokeVertices.length / 6
  };
}

function renderGridGpuLayer() {
  if (!gridGl || !gridProgram || !gridFillBuffer || !map || !DRAW_GRID) {
    clearGridGpuLayer();
    return;
  }
  const rect = mapBoard.getBoundingClientRect();
  const cellsToDraw = visibleCells;
  if (!cellsToDraw.length) {
    clearGridGpuLayer();
    return;
  }
  const cacheKey = gridGeometryCacheKey(cellsToDraw, rect);
  if (!gridGeometryCache || gridGeometryCache.key !== cacheKey) {
    gridGeometryCache = { key: cacheKey, ...buildGridGeometry(cellsToDraw, rect) };
  }
  const geometry = gridGeometryCache;
  gridGl.viewport(0, 0, gridCanvas.width, gridCanvas.height);
  gridGl.clearColor(0, 0, 0, 0);
  gridGl.clear(gridGl.COLOR_BUFFER_BIT);
  gridGl.useProgram(gridProgram);
  const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
  const positionLocation = gridGl.getAttribLocation(gridProgram, "a_position");
  const colorLocation = gridGl.getAttribLocation(gridProgram, "a_color");
  gridGl.enable(gridGl.BLEND);
  gridGl.blendFunc(gridGl.SRC_ALPHA, gridGl.ONE_MINUS_SRC_ALPHA);

  if (geometry.fillCount > 0) {
    gridGl.bindBuffer(gridGl.ARRAY_BUFFER, gridFillBuffer);
    gridGl.bufferData(gridGl.ARRAY_BUFFER, geometry.fillVertices, gridGl.STATIC_DRAW);
    gridGl.enableVertexAttribArray(positionLocation);
    gridGl.vertexAttribPointer(positionLocation, 2, gridGl.FLOAT, false, stride, 0);
    gridGl.enableVertexAttribArray(colorLocation);
    gridGl.vertexAttribPointer(colorLocation, 4, gridGl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gridGl.drawArrays(gridGl.TRIANGLES, 0, geometry.fillCount);
  }

  if (geometry.borderVertices && geometry.borderCount > 0 && gridBorderBuffer) {
    gridGl.bindBuffer(gridGl.ARRAY_BUFFER, gridBorderBuffer);
    gridGl.bufferData(gridGl.ARRAY_BUFFER, geometry.borderVertices, gridGl.STATIC_DRAW);
    gridGl.enableVertexAttribArray(positionLocation);
    gridGl.vertexAttribPointer(positionLocation, 2, gridGl.FLOAT, false, stride, 0);
    gridGl.enableVertexAttribArray(colorLocation);
    gridGl.vertexAttribPointer(colorLocation, 4, gridGl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gridGl.drawArrays(gridGl.TRIANGLES, 0, geometry.borderCount);
  }
}

function requestGridPanRender() {
  if (!gridCanvas || !DRAW_GRID) return;
  if (gridPanFrame) return;
  gridPanFrame = requestAnimationFrame(() => {
    gridPanFrame = null;
    renderGridGpuLayer();
  });
}

function appendCellVertices(strokeVertices, fillVertices, cell, width, height, drawCellBorders = false, drawTerritoryBorders = false) {
  const boundary = cell.boundary && cell.boundary.length ? cell.boundary : getCell(cell.id).boundary;
  if (!boundary || !boundary.length) return;
  const centerPoint = map.latLngToContainerPoint([cell.lat, cell.lng]);
  const center = screenToClip(centerPoint.x, centerPoint.y, width, height);
  const fill = cell.overviewOwner ? overviewCellColor(cell) : gridCellColor(cell.id);
  const stroke = cell.overviewOwner ? overviewCellStrokeColor(cell) : gridCellStrokeColor(cell.id);
  const selected = selectedCellIds.has(cell.id) || cell.id === selectedCellId;
  const edgeScale = 0.985;
  const points = boundary.map(([lat, lng]) => map.latLngToContainerPoint([lat, lng]));
  const drawStroke = drawCellBorders || (drawTerritoryBorders && (cell.overviewOwner || getOwner(cell.id) !== "free"));
  if (drawStroke && stroke[3] > 0) {
    for (let index = 0; index < points.length; index += 1) {
      appendLineQuad(
        strokeVertices,
        points[index],
        points[(index + 1) % points.length],
        cell.overviewOwner ? 1.3 : selected ? 2.2 : drawTerritoryBorders ? 1.0 : 0.65,
        stroke,
        width,
        height
      );
    }
  }
  if (fill[3] <= 0) return;
  for (let index = 0; index < points.length; index += 1) {
    const a = scaledClipPoint(points[index], centerPoint, edgeScale, width, height);
    const b = scaledClipPoint(points[(index + 1) % points.length], centerPoint, edgeScale, width, height);
    fillVertices.push(center.x, center.y, ...fill, a.x, a.y, ...fill, b.x, b.y, ...fill);
  }
}

function appendLineQuad(vertices, a, b, thickness, color, width, height) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length * thickness / 2;
  const ny = dx / length * thickness / 2;
  const p1 = screenToClip(a.x + nx, a.y + ny, width, height);
  const p2 = screenToClip(a.x - nx, a.y - ny, width, height);
  const p3 = screenToClip(b.x - nx, b.y - ny, width, height);
  const p4 = screenToClip(b.x + nx, b.y + ny, width, height);
  vertices.push(
    p1.x, p1.y, ...color, p2.x, p2.y, ...color, p3.x, p3.y, ...color,
    p1.x, p1.y, ...color, p3.x, p3.y, ...color, p4.x, p4.y, ...color
  );
}

function screenToClip(x, y, width, height) {
  return { x: (x / width) * 2 - 1, y: 1 - (y / height) * 2 };
}

function scaledClipPoint(point, center, scale, width, height) {
  return screenToClip(center.x + (point.x - center.x) * scale, center.y + (point.y - center.y) * scale, width, height);
}

function rivalColorForCell(id) {
  const remote = visibleLandOwner(id);
  if (remote?.o) return visibleOwnerMeta(remote.o)?.color || "#ef7669";
  return "#ef7669";
}

function gridCellColor(id) {
  const selected = selectedCellIds.has(id) || id === selectedCellId;
  const owner = getOwner(id);
  if (selected) return [1, 0.69, 0, 0.44];
  if (owner === "player") return colorToFloats(state.color, 0.48);
  if (owner === "rival") return colorToFloats(rivalColorForCell(id), 0.38);
  return selected ? [1, 0.69, 0, 0.42] : [1, 1, 1, 0];
}

function gridCellStrokeColor(id) {
  const selected = selectedCellIds.has(id) || id === selectedCellId;
  if (selected) return [1, 0.69, 0, 1];
  if (displayZoomForMapZoom(map.getZoom()) < 12) return [0.07, 0.07, 0.07, 0];
  const owner = getOwner(id);
  if (owner === "player") return colorToFloats(state.color, 0.5);
  if (owner === "rival") return colorToFloats(rivalColorForCell(id), 0.42);
  return [0.07, 0.07, 0.07, map.getZoom() >= detailZoomStart() ? 0.26 : 0];
}

function colorToFloats(hex, alpha) {
  const normalized = String(hex || "").replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized.padEnd(6, "0").slice(0, 6);
  return [(parseInt(value.slice(0, 2), 16) || 0) / 255, (parseInt(value.slice(2, 4), 16) || 0) / 255, (parseInt(value.slice(4, 6), 16) || 0) / 255, alpha];
}

async function updateGrid() {
  if (!map) return;
  cancelPendingGridRender();
  gridRenderJob += 1;
  const renderJob = gridRenderJob;
  const mode = currentLandRenderMode();
  resetLandLayerForMode(mode);
  cellLayerById = new Map();
  detailedMapMarkerCount = 0;
  if (!DRAW_GRID) {
    visibleCells = [];
    updateLandMapSource([]);
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  if (mode === "overview") {
    visibleCells = overviewTerritoryCells();
    updateLandMapSource(visibleCells);
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  visibleCells = gridCellsInView();
  if (renderJob !== gridRenderJob || currentLandRenderMode() !== "detail") return;
  if (gridSkippedForDensity) {
    await renderCoarseLandFallback(renderJob);
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  if (!visibleCells.length) {
    updateLandMapSource([]);
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  if (selectedCellId && !visibleCells.some((cell) => cell.id === selectedCellId)) {
    selectedCellId = null;
    selectedCellIds = new Set();
  }
  updateSettlementLabelVisibility();
  updateLandMapSource(visibleCells);
  renderSelectedCell();
}

async function renderCoarseLandFallback(renderJob) {
  const query = mapViewportQuery();
  if (!query) return;
  try {
    const payload = await requestJson(`/api/map/overview?${query.toString()}`);
    if (renderJob !== gridRenderJob || currentLandRenderMode() !== "detail") return;
    overviewTerritories = Array.isArray(payload.territories) ? payload.territories : [];
    if (payload.truncated) {
      console.warn("Coarse overview fallback reached its configured territory cap.", { limit: gameSettings?.map?.overviewMaxTerritories, zoom: query.get("zoom") });
    }
    if (Number.isFinite(payload.version)) marketVersion = payload.version;
    visibleCells = overviewTerritoryCells();
    updateLandMapSource(visibleCells);
  } catch {
    // Keep the previous LOD visible when the fallback request fails.
  }
}

function clearGridLayerForZoom() {
  cancelPendingGridRender();
  gridRenderJob += 1;
  cellLayerById = new Map();
  detailedMapMarkerCount = 0;
  updateLandMapSource([]);
}

function showTouchTooltip(cell, owner, latlng) {
  return;
}

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function isLowPowerDevice() {
  return isTouchDevice()
    || window.innerWidth < 900
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}

function updateSettlementLabelVisibility() {
  return;
}

function currentLandRenderMode() {
  return zoomPresetForMapZoom(map?.getZoom?.() ?? MAP_ZOOM_LEVELS[0])?.mode === "detail" ? "detail" : "overview";
}

function isOverviewZoom() {
  return currentLandRenderMode() === "overview";
}

function resetLandLayerForMode(nextMode) {
  if (landRenderMode === nextMode) return;
  landRenderMode = nextMode;
  if (nextMode === "overview") {
    selectedCellId = null;
    selectedCellIds = new Set();
    selectionPopupDismissed = false;
    hideSelectionPopup();
    hideCellInfoPanel();
    if (clusterSelectionMode) setClusterSelectionMode(false);
  }
  invalidateGridGeometryCache();
}

function detailZoomStart() {
  const index = MAP_ZOOM_PRESETS.findIndex((preset) => preset.mode === "detail");
  return MAP_ZOOM_LEVELS[index >= 0 ? index : MAP_ZOOM_LEVELS.length - 1];
}

function overviewClusterKey(cell, precision = 0.45) {
  return Math.round(cell.lat / precision) + ":" + Math.round(cell.lng / precision);
}

function overviewCellColor(cell) {
  if (cell.overviewOwner === "selected") return [1, 0.69, 0, 0.38];
  if (cell.overviewOwner === "player") return colorToFloats(cell.overviewColor || state.color || "#35c982", 0.28);
  return colorToFloats(cell.overviewColor || "#ef7669", 0.24);
}

function overviewCellStrokeColor(cell) {
  if (cell.overviewOwner === "selected") return [1, 0.69, 0, 0.9];
  if (cell.overviewOwner === "player") return colorToFloats(cell.overviewColor || state.color || "#35c982", 0.72);
  return colorToFloats(cell.overviewColor || "#ef7669", 0.62);
}

function renderOverviewGridLayer() {
  if (!isOverviewZoom()) {
    visibleCells = [];
    clearGridGpuLayer();
    return;
  }
  const cells = overviewTerritoryCells();
  if (!cells.length) {
    visibleCells = [];
    clearGridGpuLayer();
    return;
  }
  visibleCells = cells;
  renderGridGpuLayer();
}

function overviewTerritoryCells() {
  const serverCells = (overviewTerritories || []).map((territory) => ({
    id: territory.chunkId || `territory-${territory.ownerId}-${territory.lat}-${territory.lng}`,
    code: `territory-${territory.ownerId}`,
    lat: territory.lat,
    lng: territory.lng,
    overviewOwner: territory.ownerKind === "player" ? "player" : "rival",
    overviewColor: territory.color || "#ef7669",
    occupied: territory.occupied,
    boundary: territory.polygon
  }));

  return serverCells;
}

function overviewGridStepForZoom(zoom) {
  if (zoom <= 5) return 72;
  if (zoom <= 7) return 48;
  if (zoom <= 9) return 24;
  if (zoom <= 11) return 12;
  return 6;
}

function scheduleGridUpdate(immediate = false) {
  clearTimeout(gridUpdateTimer);
  gridUpdateTimer = setTimeout(() => {
    gridUpdateTimer = null;
    updateGrid();
  }, immediate ? 0 : isLowPowerDevice() ? 420 : 300);
}

function cancelPendingGridRender() {
  clearTimeout(gridUpdateTimer);
  gridUpdateTimer = null;
  if (gridRenderFrame !== null) {
    cancelAnimationFrame(gridRenderFrame);
    gridRenderFrame = null;
  }
}

function refreshVisibleCellLayers(cellIds = null) {
  if (!map) return;
  if (isOverviewZoom()) {
    scheduleGridUpdate();
    return;
  }

  updateLandMapSource(visibleCells);
  renderSelectedCell();
}

function setupShiftSelection() {
  mapBoard.addEventListener("pointerdown", (event) => {
    if (isOverviewZoom()) return;
    if ((!clusterSelectionMode && !event.shiftKey) || event.button !== 0) return;
    event.preventDefault();
    selectionDragWasEnabled = !!map?.dragging?.enabled?.();
    map.dragging.disable();

    const boardRect = mapBoard.getBoundingClientRect();
    selectionDrag = {
      startX: event.clientX - boardRect.left,
      startY: event.clientY - boardRect.top,
      endX: event.clientX - boardRect.left,
      endY: event.clientY - boardRect.top,
      moved: false,
      box: document.createElement("div")
    };
    selectionDrag.box.className = "selection-box";
    mapBoard.appendChild(selectionDrag.box);
    updateSelectionBox();
  });

  mapBoard.addEventListener("pointermove", (event) => {
    if (!selectionDrag) return;
    event.preventDefault();
    const boardRect = mapBoard.getBoundingClientRect();
    selectionDrag.endX = event.clientX - boardRect.left;
    selectionDrag.endY = event.clientY - boardRect.top;
    selectionDrag.moved = Math.hypot(selectionDrag.endX - selectionDrag.startX, selectionDrag.endY - selectionDrag.startY) > 6;
    updateSelectionBox();
  });

  window.addEventListener("pointerup", finishShiftSelection);
  window.addEventListener("pointercancel", finishShiftSelection);
  window.addEventListener("blur", () => {
    if (selectionDrag) {
      selectionDrag.box?.remove();
      selectionDrag = null;
    }
    if (!clusterSelectionMode && selectionDragWasEnabled) map.dragging.enable();
  });
}

function updateSelectionBox() {
  if (!selectionDrag) return;
  const left = Math.min(selectionDrag.startX, selectionDrag.endX);
  const top = Math.min(selectionDrag.startY, selectionDrag.endY);
  const width = Math.abs(selectionDrag.endX - selectionDrag.startX);
  const height = Math.abs(selectionDrag.endY - selectionDrag.startY);
  Object.assign(selectionDrag.box.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  });
}

function finishShiftSelection(event) {
  if (!selectionDrag) return;
  event.preventDefault();
  suppressMapClick = true;
  window.setTimeout(() => {
    suppressMapClick = false;
  }, 360);

  const drag = selectionDrag;
  const previousSelection = new Set(selectedCellIds);
  selectionDrag = null;
  if (selectionDragWasEnabled) map.dragging.enable();
  drag.box.remove();

  if (!drag.moved) {
    const latlng = map.containerPointToLatLng([drag.endX, drag.endY]);
    const cell = cellFromLatLng(latlng.lat, latlng.lng);
    if (cell) selectCell(cell.id, { shiftKey: true });
    return;
  }

  const left = Math.min(drag.startX, drag.endX);
  const right = Math.max(drag.startX, drag.endX);
  const top = Math.min(drag.startY, drag.endY);
  const bottom = Math.max(drag.startY, drag.endY);
  const nextSelection = new Set(selectedCellIds);

  selectionCellsForDrag(drag).forEach((cell) => {
    const point = map.latLngToContainerPoint([cell.lat, cell.lng]);
    if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
      nextSelection.add(cell.id);
      selectedCellId = cell.id;
    }
  });

  selectedCellIds = nextSelection;
  selectionPopupDismissed = false;
  refreshVisibleCellLayers(changedSelectionIds(previousSelection, selectedCellIds));
}

function selectionCandidateCells() {
  // Zoom 5/7 contains aggregated ownership polygons, not canonical grid cells.
  // Synthesizing q/r cells from the aggregate bounding box used to count land outside the
  // playable-grid mask too, which is why selecting all of Ukraine could exceed the admin total.
  return isOverviewZoom() ? [] : visibleCells;
}

function selectionCellsForDrag() {
  return selectionCandidateCells();
}

function selectCellAtMapPoint(event) {
  if (suppressMapClick) return;
  if (!event?.latlng) return;

  if (isOverviewZoom()) {
    map.setView(event.latlng, detailZoomStart());
    showGameMessage("На Zoom 5/7 виділення вимкнено. Карта наближена до Zoom 10.");
    return;
  }

  const cell = cellFromLatLng(event.latlng.lat, event.latlng.lng);
  if (cell) {
    if (clusterSelectionMode) toggleCellSelection(cell.id);
    else selectCell(cell.id, event.originalEvent);
  }
}

function clampMapLibreCenterToBounds() {
  if (!map || typeof map.getCenter !== "function" || typeof map.getBounds !== "function") return;
  const bounds = map.getBounds();
  const currentCenter = map.getCenter();
  const width = bounds.getEast() - bounds.getWest();
  const height = bounds.getNorth() - bounds.getSouth();
  if (!(width > 0 && height > 0)) return;
  if (width >= (MAP_VIEW_BOUNDS.east - MAP_VIEW_BOUNDS.west) || height >= (MAP_VIEW_BOUNDS.north - MAP_VIEW_BOUNDS.south)) {
    return;
  }
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const clampedCenter = {
    lng: Math.max(MAP_VIEW_BOUNDS.west + halfWidth, Math.min(MAP_VIEW_BOUNDS.east - halfWidth, currentCenter.lng)),
    lat: Math.max(MAP_VIEW_BOUNDS.south + halfHeight, Math.min(MAP_VIEW_BOUNDS.north - halfHeight, currentCenter.lat))
  };
  if (Math.abs(clampedCenter.lng - currentCenter.lng) < 1e-6 && Math.abs(clampedCenter.lat - currentCenter.lat) < 1e-6) return;
  map.jumpTo({ center: [clampedCenter.lng, clampedCenter.lat] });
}

function hexId(q, r) {
  return "cell-" + q + "-" + r;
}

function isRegularHexId(id) {
  return /^cell--?\d+--?\d+$/.test(String(id || ""));
}

function parseHexId(id) {
  const match = String(id || "").match(/^cell-(-?\d+)-(-?\d+)$/);
  return { q: match ? Number(match[1]) : 0, r: match ? Number(match[2]) : 0 };
}

function cellFromLatLng(lat, lng) {
  const q = Math.floor((lng - MAP_BOUNDS.west) / RECT_CELL_WIDTH_DEGREES);
  const r = Math.floor((MAP_BOUNDS.north - lat) / RECT_CELL_HEIGHT_DEGREES);
  return isPlayableGridCell(q, r) ? makeCell(hexId(q, r)) : null;
}

function gridCellsInView(bounds = map.getBounds().pad(0.04), limit = gridCellLimitForZoom()) {
  gridSkippedForDensity = false;
  const minQ = Math.floor((bounds.getWest() - MAP_BOUNDS.west) / RECT_CELL_WIDTH_DEGREES) - 1;
  const maxQ = Math.ceil((bounds.getEast() - MAP_BOUNDS.west) / RECT_CELL_WIDTH_DEGREES) + 1;
  const minR = Math.floor((MAP_BOUNDS.north - bounds.getNorth()) / RECT_CELL_HEIGHT_DEGREES) - 1;
  const maxR = Math.ceil((MAP_BOUNDS.north - bounds.getSouth()) / RECT_CELL_HEIGHT_DEGREES) + 1;
  const candidateCount = Math.max(0, maxQ - minQ + 1) * Math.max(0, maxR - minR + 1);
  if (candidateCount > limit) {
    gridSkippedForDensity = true;
    return [];
  }
  const stride = 1;
  const cells = [];
  for (let q = minQ; q <= maxQ; q += stride) {
    for (let r = minR; r <= maxR; r += stride) {
      const { lat, lng } = cellCenterFromGrid(q, r);
      if (!pointInBounds(lat, lng, bounds)) continue;
      if (!isPlayableGridCell(q, r)) continue;
      const cell = makeVisibleCell(hexId(q, r));
      cells.push(cell);
    }
  }
  return cells;
}

function notifyGridTooDense() {
  const now = Date.now();
  if (now - gridTooDenseNotifiedAt < 4500) return;
  gridTooDenseNotifiedAt = now;
  showGameMessage("Занадто багато ділянок для цього масштабу. Наблизьте карту, щоб сітка була чіткою.");
}

function isPlayableGridCell(q, r) {
  if (playableGridRows) {
    const ranges = playableGridRows.get(r);
    return Array.isArray(ranges) && ranges.some(([minQ, maxQ]) => q >= minQ && q <= maxQ);
  }
  const { lng, lat } = cellCenterFromGrid(q, r);
  return pointInUkraine([lng, lat]);
}

function gridCellLimitForZoom() {
  const preset = zoomPresetForMapZoom(map?.getZoom?.() ?? detailZoomStart());
  return Math.min(MAX_VISIBLE_GRID_CELLS, Math.max(500, Number(preset?.maxVisibleCells) || MAX_VISIBLE_GRID_CELLS));
}

function makeVisibleCell(id) {
  const { q, r } = parseHexId(id);
  const { lat, lng } = cellCenterFromGrid(q, r);
  const cell = { id, code: id, lat, lng, boundary: rectBoundaryLatLng(q, r) };
  rememberCell(id, cell);
  return cell;
}

function makeCell(id) {
  if (cellCache.has(id)) return cellCache.get(id);
  if (!isRegularHexId(id)) return null;
  const { q, r } = parseHexId(id);
  const { lat, lng } = cellCenterFromGrid(q, r);
  const basePrice = basePriceForCellId(id);
  const income = incomeForCellId(id);
  const settlement = nearestSettlement(lat, lng) || {};
  const cell = {
    id,
    code: id,
    lat,
    lng,
    region: safePlaceName(settlement.name) || "вибрана місцевість",
    settlementDistanceKm: Number.isFinite(settlement.distanceKm) ? settlement.distanceKm : null,
    basePrice,
    price: priceForCellId(id),
    income,
    boundary: rectBoundaryLatLng(q, r)
  };
  rememberCell(id, cell);
  return cell;
}

function cellCenterFromGrid(q, r) {
  return {
    lng: MAP_BOUNDS.west + (q + 0.5) * RECT_CELL_WIDTH_DEGREES,
    lat: MAP_BOUNDS.north - (r + 0.5) * RECT_CELL_HEIGHT_DEGREES
  };
}

function rectBoundaryLatLng(q, r) {
  const west = MAP_BOUNDS.west + q * RECT_CELL_WIDTH_DEGREES;
  const east = west + RECT_CELL_WIDTH_DEGREES;
  const north = MAP_BOUNDS.north - r * RECT_CELL_HEIGHT_DEGREES;
  const south = north - RECT_CELL_HEIGHT_DEGREES;
  return [[north, west], [north, east], [south, east], [south, west]];
}

function rectBoundaryLatLngBlock(q, r, step) {
  const west = MAP_BOUNDS.west + q * RECT_CELL_WIDTH_DEGREES;
  const east = MAP_BOUNDS.west + (q + step) * RECT_CELL_WIDTH_DEGREES;
  const north = MAP_BOUNDS.north - r * RECT_CELL_HEIGHT_DEGREES;
  const south = MAP_BOUNDS.north - (r + step) * RECT_CELL_HEIGHT_DEGREES;
  return [[north, west], [north, east], [south, east], [south, west]];
}

function rememberCell(id, cell) {
  if (cellCache.size > 25000) {
    let removed = 0;
    for (const key of cellCache.keys()) {
      cellCache.delete(key);
      removed += 1;
      if (removed >= 5000) break;
    }
  }
  cellCache.set(id, cell);
}

function playerOwnedCellCount() {
  if (ownedCountCacheRevision !== landMembershipRevision) {
    ownedCountCache = Object.keys(state.land || {}).length;
    ownedCountCacheRevision = landMembershipRevision;
  }
  return ownedCountCache;
}

function ownershipPriceMultiplierForCount(ownedCount = playerOwnedCellCount()) {
  return GameRules.stagePriceMultiplier(ownedCount, gameSettings?.stages || []);
}

function priceForCellId(id, ownedCount = playerOwnedCellCount(), excludedIds = null) {
  const basePrice = basePriceForCellId(id);
  const pressure = nearbyOwnedPressure(id, excludedIds);
  const growth = Number.isFinite(gameSettings?.economy?.nearbyPriceGrowthPercent) ? gameSettings.economy.nearbyPriceGrowthPercent / 100 : 0.06;
  return GameRules.landPrice(basePrice, pressure, growth * 100, ownershipPriceMultiplierForCount(ownedCount));
}

function marketPriceForCellId(id) {
  const basePrice = basePriceForCellId(id);
  const pressure = nearbyOwnedPressure(id);
  const growth = Number.isFinite(gameSettings?.economy?.nearbyPriceGrowthPercent) ? gameSettings.economy.nearbyPriceGrowthPercent / 100 : 0.06;
  return GameRules.landPrice(basePrice, pressure, growth * 100, 1);
}

function basePriceForCellId(id) {
  const seed = Math.abs(hashString(String(id))) || 1;
  return rangedSettingValue(gameSettings?.economy?.baseLandPriceMin, gameSettings?.economy?.baseLandPriceSpread, 1800, seed);
}

function nearbyOwnedPressure(id, excludedIds = null) {
  return neighborIdsWithinRadius(id, gameSettings?.economy?.nearbyPriceRadius || 2).reduce((sum, neighborId) => {
    if (excludedIds?.has(neighborId)) return sum;
    const owner = visibleLandOwner(neighborId) || state.land?.[neighborId];
    return sum + (owner ? 1 : 0);
  }, 0);
}

function incomeForCellId(id) {
  const seed = Math.abs(hashString(String(id))) || 1;
  return rangedSettingValue(gameSettings?.economy?.baseIncomeMin, gameSettings?.economy?.baseIncomeSpread, 180, seed);
}

function rangedSettingValue(minValue, spreadValue, fallback, seed) {
  const base = Number.isFinite(minValue) ? minValue : fallback;
  const spread = Number.isFinite(spreadValue) ? Math.max(0, Math.floor(spreadValue)) : 0;
  return Math.round(base + (spread > 0 ? Math.abs(seed) % spread : 0));
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function nearestSettlement(lat, lng) {
  if (!settlementPlaces.length) {
    return cityLabels
      .map(([name, cityLat, cityLng]) => ({
        name,
        distanceKm: distanceKm(lat, lng, cityLat, cityLng)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }

  const baseLat = Math.floor(lat / SETTLEMENT_GRID_SIZE);
  const baseLng = Math.floor(lng / SETTLEMENT_GRID_SIZE);
  let candidates = [];
  for (let radius = 0; radius <= 5 && candidates.length < 12; radius += 1) {
    for (let y = baseLat - radius; y <= baseLat + radius; y += 1) {
      for (let x = baseLng - radius; x <= baseLng + radius; x += 1) {
        const bucket = settlementGrid.get(`${y}:${x}`);
        if (bucket) candidates = candidates.concat(bucket);
      }
    }
  }

  return candidates
    .map((place) => ({
      name: place.n || place.name || place.asciiname || place.toponymName || "населений пункт",
      distanceKm: distanceKm(lat, lng, place.lat, place.lng),
      population: place.p || 0
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || b.population - a.population)[0] || { name: "населений пункт", distanceKm: 0 };
}

function distanceKm(latA, lngA, latB, lngB) {
  const meanLat = ((latA + latB) / 2) * Math.PI / 180;
  const dLat = (latA - latB) * 111.32;
  const dLng = (lngA - lngB) * 111.32 * Math.cos(meanLat);
  return Math.hypot(dLat, dLng);
}

function pointInBounds(lat, lng, bounds) {
  return lat >= bounds.getSouth() && lat <= bounds.getNorth() && lng >= bounds.getWest() && lng <= bounds.getEast();
}

function pointInUkraine(point) {
  return ukrainePolygons.some((polygon) => {
    if (!pointInPolygon(point, polygon[0])) return false;
    return !polygon.slice(1).some((hole) => pointInPolygon(point, hole));
  });
}

function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCell(id) {
  const visibleCell = visibleCellById.get(id);
  const cell = visibleCell?.region ? visibleCell : makeCell(id);
  if (cell) cell.price = priceForCellId(cell.id);
  return cell;
}

function getOwner(cellId) {
  if (state.land[cellId]) return "player";
  const remote = visibleLandOwner(cellId);
  if (remote?.o === player?.id) return "player";
  if (remote?.o) return "rival";
  return "free";
}

function selectedCells() {
  const ids = selectedCellIds.size ? [...selectedCellIds] : selectedCellId ? [selectedCellId] : [];
  return ids.map(getCell).filter(Boolean);
}

function freeSelectedCells() {
  const ids = selectedCellIds.size ? [...selectedCellIds] : selectedCellId ? [selectedCellId] : [];
  return ids.filter((id) => getOwner(id) === "free").map(getCell).filter(Boolean);
}

function ownedSelectedCells() {
  const ids = selectedCellIds.size ? [...selectedCellIds] : selectedCellId ? [selectedCellId] : [];
  return ids.filter((id) => state.land[id] || visibleLandState.cells[id]).map(getCell).filter(Boolean);
}

function buildableSelectedCells() {
  return ownedSelectedCells().filter((cell) => {
    const owned = state.land[cell.id];
    return owned && !owned.building && !owned.buildingId;
  });
}

function selectedGroupSummary() {
  const ids = [...selectedCellIds];
  const selectedFreeIds = new Set(ids.filter((id) => getOwner(id) === "free"));
  const clusterMap = clusterByCell();
  const countedBuildings = new Set();
  let freeCount = 0;
  let ownedCount = 0;
  let rivalCount = 0;
  let totalPrice = 0;
  let totalIncome = 0;
  let upgradeCost = 0;
  let elevatorCost = 0;
  let machineryCost = 0;
  let sellTotal = 0;
  let canUpgrade = false;
  let canBuyMachinery = false;
  let buildableCount = 0;

  ids.forEach((id) => {
    const owner = getOwner(id);
    const income = incomeForCellId(id);
    if (owner === "free") {
      totalPrice += priceForCellId(id, playerOwnedCellCount() + freeCount, selectedFreeIds);
      freeCount += 1;
      totalIncome += income;
      return;
    }
    if (state.land[id]) {
      const owned = state.land[id];
      ownedCount += 1;
      const buildingItem = buildingItemForCell(owned);
      if (buildingItem) {
        const key = owned.buildingGroupId || `${id}:${buildingItem.id}`;
        if (!countedBuildings.has(key)) {
          countedBuildings.add(key);
          totalIncome += buildingItem.incomePerDay || 0;
        }
      } else {
        totalIncome += cellDailyIncome({ id, income }, owned, clusterMap);
      }
      canUpgrade = canUpgrade || ((!owned.building && !owned.buildingId) && owned.level < maxLandLevel());
      if (!owned.building && !owned.buildingId) buildableCount += 1;
      upgradeCost += (!owned.building && !owned.buildingId && owned.level < maxLandLevel()) ? nextUpgradeCost(owned) : 0;
      sellTotal += sellValue({ id, price: priceForCellId(id), income }, owned);
      return;
    }
    rivalCount += 1;
  });

  return {
    totalCount: ids.length,
    freeCount,
    ownedCount,
    rivalCount,
    totalPrice,
    totalIncome,
    upgradeCost,
    elevatorCost,
    machineryCost,
    sellTotal,
    canUpgrade,
    buildableCount,
    canBuild: buildableCount >= minBuildingCells(),
    canBuyMachinery: ownedCount > 0
  };
}

function rivalName(cellId) {
  const remote = visibleLandOwner(cellId);
  if (remote?.o && remote.o !== player?.id) return visibleOwnerMeta(remote.o)?.name || "Інший гравець";
  const numeric = parseInt(cellId.slice(-5), 16) || 0;
  return rivalOwners[numeric % rivalOwners.length];
}

function ownerDisplayName(cellId) {
  const remote = visibleLandOwner(cellId);
  if (remote?.o) return visibleOwnerMeta(remote.o)?.name || "Інший гравець";
  if (state.land[cellId]) return state.companyName || player?.username || "Ваша компанія";
  return "Система";
}

function ownerIdForCell(cellId) {
  const remote = visibleLandOwner(cellId);
  if (remote?.o) return remote.o;
  if (state.land[cellId]) return player?.id || "";
  return "";
}

function ownerInfoButton(cellId) {
  const ownerId = ownerIdForCell(cellId);
  const name = ownerDisplayName(cellId);
  return ownerId
    ? `<button class="inline-owner-button" type="button" data-owner-id="${escapeHtml(ownerId)}">${escapeHtml(name)}</button>`
    : escapeHtml(name);
}

function ownedCells() {
  return Object.keys(state.land).map(getCell);
}

function neighbors(cell) {
  return neighborIdsWithinRadius(cell.id, 1);
}

function neighborIdsWithinRadius(id, radius = 1) {
  if (!isRegularHexId(id)) return [];
  const { q, r } = parseHexId(id);
  const ids = [];
  const distance = Math.max(1, Math.floor(radius));
  for (let dq = -distance; dq <= distance; dq += 1) {
    for (let dr = -distance; dr <= distance; dr += 1) {
      if (dq === 0 && dr === 0) continue;
      ids.push(hexId(q + dq, r + dr));
    }
  }
  return ids;
}

function connectedClusters() {
  const cacheKey = ownedLandKey();
  if (landClusterCacheKey === cacheKey && landClusterCacheClusters) return landClusterCacheClusters;

  const owned = new Set(Object.keys(state.land));
  const clusters = [];

  while (owned.size) {
    const start = owned.values().next().value;
    const queue = [start];
    const cluster = [];
    owned.delete(start);

    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const id = queue[queueIndex++];
      cluster.push(id);
      neighbors({ id }).forEach((neighborId) => {
        if (owned.has(neighborId)) {
          owned.delete(neighborId);
          queue.push(neighborId);
        }
      });
    }

    clusters.push(cluster);
  }

  landClusterCacheKey = cacheKey;
  landClusterCacheClusters = clusters.sort((a, b) => b.length - a.length);
  landClusterCacheMap = null;
  return landClusterCacheClusters;
}

function bonusForSize(size) {
  return (gameSettings?.clusters || [])
    .filter((rule) => size >= rule.min)
    .reduce((best, rule) => Math.max(best, (rule.bonusPercent || 0) / 100), 0);
}

function clusterByCell() {
  const cacheKey = ownedLandKey();
  if (landClusterCacheKey === cacheKey && landClusterCacheMap) return landClusterCacheMap;

  const mapByCell = new Map();
  connectedClusters().forEach((cluster) => {
    const bonus = bonusForSize(cluster.length);
    cluster.forEach((id) => mapByCell.set(id, { size: cluster.length, bonus }));
  });
  landClusterCacheKey = cacheKey;
  landClusterCacheMap = mapByCell;
  return mapByCell;
}

function ownedLandKey() {
  return landMembershipRevision;
}

function cellDailyIncome(cell, ownership, clusterMap = clusterByCell()) {
  if (!ownership) return cell.income;
  const buildingIncome = buildingDailyIncomeForCell(ownership);
  if (buildingIncome > 0) return buildingIncome;
  return incomeBreakdown(cell, ownership, clusterMap).total;
}

function incomeBreakdown(cell, ownership, clusterMap = clusterByCell()) {
  const base = cell.income || incomeForCellId(cell.id);
  const bonuses = inventoryBonusPercents();
  const buildingItem = buildingItemForCell(ownership);
  if (!ownership) {
    return {
      base,
      landGain: 0,
      cellAssetGain: 0,
      machineryGain: 0,
      buildingGain: 0,
      inventoryGain: 0,
      clusterGain: 0,
      total: base,
      machineryPercent: bonuses.machinery,
      buildingIncome: bonuses.buildingsIncome,
      inventoryPercent: bonuses.machinery
    };
  }
  if (buildingItem) {
    return {
      base: 0,
      landGain: 0,
      cellAssetGain: buildingItem.incomePerDay || 0,
      machineryGain: 0,
      buildingGain: buildingItem.incomePerDay || 0,
      inventoryGain: 0,
      clusterGain: 0,
      total: buildingItem.incomePerDay || 0,
      machineryPercent: bonuses.machinery,
      buildingIncome: buildingItem.incomePerDay || 0,
      inventoryPercent: 0
    };
  }
  const cluster = clusterMap.get(cell.id) || { bonus: 0 };
  const levelBonus = fertilizerMultiplier(ownership.level || 1);
  const afterLand = base * levelBonus;
  const machineryGain = afterLand * bonuses.machinery / 100;
  const buildingGain = 0;
  const afterInventory = afterLand + machineryGain;
  const total = afterInventory * (1 + cluster.bonus);
  return {
    base,
    landGain: afterLand - base,
    cellAssetGain: 0,
    machineryGain,
    buildingGain,
    inventoryGain: machineryGain + buildingGain,
    clusterGain: total - afterInventory,
    total,
    machineryPercent: bonuses.machinery,
    buildingIncome: bonuses.buildingsIncome,
    inventoryPercent: bonuses.machinery
  };
}

function fertilizerLevel(level) {
  return [...LAND_LEVELS].reverse().find((item) => (level || 1) >= item.level) || LAND_LEVELS[0];
}

function fertilizerMultiplier(level) {
  return GameRules.fertilizerMultiplier(level, LAND_LEVELS);
}

function inventoryIncomeMultiplier() {
  return 1 + inventoryBonusPercents().machinery / 100;
}

function inventoryBonusPercents() {
  expireMachinery(false);
  const machinery = assetBonusPercent("machineryItems", activeMachineryMap(), playerOwnedCellCount());
  const buildingsIncome = buildingDailyIncome();
  return { machinery, buildings: 0, buildingsIncome, total: machinery };
}

function assetBonusPercent(settingsKey, inventoryMap, landCount = playerOwnedCellCount()) {
  return (gameSettings?.assets?.[settingsKey] || []).reduce((sum, item) => {
    const units = inventoryMap[item.id] || 0;
    const coverage = Math.min(1, units * Math.max(1, item.landCapacity || 25) / Math.max(1, landCount));
    return sum + coverage * (item.incomeBonusPercent || 0);
  }, 0);
}

function machineryItemById(id) {
  return (gameSettings?.assets?.machineryItems || []).find((item) => item.id === id) || null;
}

function machineryServiceExtensionDays() {
  const counted = new Set();
  return Object.values(state.land || {}).reduce((sum, ownership) => {
    const item = buildingItemForCell(ownership);
    if (!item) return sum;
    const key = ownership.buildingGroupId || `${ownership.id}:${item.id}`;
    if (counted.has(key)) return sum;
    counted.add(key);
    return sum + (Number(item.serviceLifeExtensionDays) || 0);
  }, 0);
}

function buildingItemById(id) {
  return (gameSettings?.assets?.elevatorItems || []).find((item) => item.id === id) || null;
}

function buildingItemForCell(ownership) {
  return buildingItemById(ownership?.building || ownership?.buildingId);
}

function buildingDailyIncomeForCell(ownership) {
  const item = buildingItemForCell(ownership);
  return item ? item.incomePerDay || 0 : 0;
}

function buildingCostForCell(ownership) {
  const item = buildingItemForCell(ownership);
  return item ? item.cost || 0 : 0;
}

function buildingDailyIncome() {
  if (Number.isFinite(farmDerivedStatsCache?.buildingIncome)) return farmDerivedStatsCache.buildingIncome;
  const counted = new Set();
  const value = Object.values(state.land || {}).reduce((sum, ownership) => {
    const item = buildingItemForCell(ownership);
    if (!item) return sum;
    const key = ownership.buildingGroupId || `${ownership.id}:${item.id}`;
    if (counted.has(key)) return sum;
    counted.add(key);
    return sum + (item.incomePerDay || 0);
  }, 0);
  farmDerivedStatsCache = { ...(farmDerivedStatsCache || {}), buildingIncome: value };
  return value;
}

function buildingCountByItem() {
  const counted = new Set();
  return Object.entries(state.land || {}).reduce((map, [cellId, ownership]) => {
    const id = ownership.building || ownership.buildingId;
    const key = ownership.buildingGroupId || `${cellId}:${id}`;
    if (id && !counted.has(key)) {
      counted.add(key);
      map[id] = (map[id] || 0) + 1;
    }
    return map;
  }, {});
}

function totalDailyIncome() {
  if (Number.isFinite(farmDerivedStatsCache?.income)) return farmDerivedStatsCache.income;
  const clusterMap = clusterByCell();
  const countedBuildings = new Set();
  const value = ownedCells().reduce((sum, cell) => {
    const ownership = state.land[cell.id];
    const item = buildingItemForCell(ownership);
    if (item) {
      const key = ownership.buildingGroupId || `${cell.id}:${item.id}`;
      if (countedBuildings.has(key)) return sum;
      countedBuildings.add(key);
      return sum + (item.incomePerDay || 0);
    }
    return sum + cellDailyIncome(cell, ownership, clusterMap);
  }, 0);
  const rounded = Math.max(0, Math.floor(value));
  farmDerivedStatsCache = { ...(farmDerivedStatsCache || {}), income: rounded };
  return rounded;
}

function firstBuildingCellIdsForLand(land = state.land) {
  const firstIds = new Set();
  const seenGroups = new Set();
  Object.entries(land || {}).forEach(([id, ownership]) => {
    if (!ownership?.building && !ownership?.buildingId) return;
    const groupId = ownership.buildingGroupId;
    if (!groupId) {
      firstIds.add(id);
      return;
    }
    if (seenGroups.has(groupId)) return;
    seenGroups.add(groupId);
    firstIds.add(id);
  });
  return firstIds;
}

function assetsValue() {
  if (Number.isFinite(farmDerivedStatsCache?.assets)) return farmDerivedStatsCache.assets;
  const firstBuildingCells = firstBuildingCellIdsForLand();
  const value = ownedCells().reduce((sum, cell) => {
    const owned = state.land[cell.id];
    return sum
      + owned.price
      + fertilizerCostThroughLevel(owned.level || 1)
      + (firstBuildingCells.has(cell.id) ? buildingCostForCell(owned) : 0);
  }, inventoryValue());
  farmDerivedStatsCache = { ...(farmDerivedStatsCache || {}), assets: value };
  return value;
}

function isFirstCellInBuildingGroup(cellId, ownership) {
  if (!ownership?.building && !ownership?.buildingId) return false;
  return firstBuildingCellIdsForLand().has(cellId);
}

function inventoryValue() {
  expireMachinery(false);
  const machineryMap = activeMachineryMap();
  const machinery = (gameSettings?.assets?.machineryItems || []).reduce((sum, item) => sum + (machineryMap?.[item.id] || 0) * (item.cost || 0), 0);
  return machinery;
}

function fertilizerCostThroughLevel(level) {
  return GameRules.improvementCostForLevel(level, LAND_LEVELS);
}

function fertilizerUpgradeCost(currentLevel, targetLevel) {
  return GameRules.fertilizerUpgradeCost(currentLevel, targetLevel, LAND_LEVELS);
}

function nextUpgradeCost(owned) {
  return fertilizerUpgradeCost(owned?.level || 1, (owned?.level || 1) + 1);
}

function maxLandLevel() {
  return Math.max(...LAND_LEVELS.map((item) => item.level), 1);
}

function minElevatorCells() {
  return gameSettings?.upgrades?.elevatorMinSelectedCells || 3;
}

function minBuildingCells() {
  const items = gameSettings?.assets?.elevatorItems || [];
  return items.length ? Math.min(...items.map((item) => Math.max(1, item.minCells || minElevatorCells()))) : minElevatorCells();
}

function minCellsForBuilding(item) {
  return Math.max(1, Number(item?.minCells) || minBuildingCells());
}

function buildingCellCountForItem(itemId) {
  return Object.values(state.land || {}).filter((owned) => (owned.building || owned.buildingId) === itemId).length;
}

function maxBuildingCellsForOwner(item) {
  const percent = Math.min(100, Math.max(1, Number(item?.maxOwnerLandPercent) || 25));
  const ownedCount = Object.keys(state.land || {}).length;
  return Math.max(minCellsForBuilding(item), Math.floor((ownedCount * percent) / 100));
}

function sellValue(cell, owned) {
  const buildingValue = isFirstCellInBuildingGroup(cell?.id, owned) ? buildingCostForCell(owned) : 0;
  return Math.floor((marketPriceForCellId(cell.id) + fertilizerCostThroughLevel(owned.level || 1) + buildingValue) * SELL_REFUND_RATE);
}

function addEvent(text) {
  state.events.unshift({ text: landLabel(text), at: new Date().toISOString() });
  state.events = state.events.slice(0, 30);
}

function addLedger(type, text, amount = 0, landDelta = 0) {
  state.ledger = Array.isArray(state.ledger) ? state.ledger : [];
  state.ledger.unshift({
    type,
    text: landLabel(text),
    amount: Math.floor(amount),
    balance: Math.floor(state.coins),
    landDelta,
    at: new Date().toISOString()
  });
  state.ledger = state.ledger.slice(0, 1000);
}

function money(value) {
  const number = Number(value);
  return `${Math.floor(Number.isFinite(number) ? number : 0).toLocaleString("uk-UA")} мон.`;
}

function safePlaceName(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") return "";
  return text;
}

function cellLocationName(cell) {
  const existing = safePlaceName(cell?.region);
  if (existing) return existing;
  if (Number.isFinite(cell?.lat) && Number.isFinite(cell?.lng)) {
    return safePlaceName(nearestSettlement(cell.lat, cell.lng)?.name) || "вибрана місцевість";
  }
  return "вибрана місцевість";
}

function cellLocationPhrase(cell) {
  const name = cellLocationName(cell);
  return name === "вибрана місцевість" ? "у вибраній місцевості" : `біля ${name}`;
}

function cellSettlementLine(cell) {
  const distance = Number(cell?.settlementDistanceKm);
  return `${cellLocationName(cell)}${Number.isFinite(distance) ? ` - ${distance.toFixed(1)} км` : ""}`;
}

function cellBaseIncome(cell) {
  const income = Number(cell?.income);
  if (Number.isFinite(income)) return income;
  return cell?.id ? incomeForCellId(cell.id) : 0;
}

function setActionButton(button, title, note = "") {
  button.innerHTML = note
    ? `<span>${escapeHtml(title)}</span><small>${escapeHtml(note)}</small>`
    : `<span>${escapeHtml(title)}</span>`;
}

function setSavingButton(button, isSaving, savedText = "Збережено") {
  if (!button) return () => {};
  const previous = button.innerHTML;
  button.disabled = isSaving;
  if (isSaving) button.innerHTML = "<span>Збереження...</span>";
  return () => {
    button.disabled = false;
    button.innerHTML = `<span>${savedText}</span>`;
    window.setTimeout(() => {
      if (document.body.contains(button)) button.innerHTML = previous;
    }, 900);
  };
}

function ensureLandOperationOverlay() {
  if (landOperationOverlay) return landOperationOverlay;
  landOperationOverlay = document.createElement("div");
  landOperationOverlay.className = "land-operation-overlay is-hidden";
  landOperationOverlay.innerHTML = `
    <div class="land-operation-panel" role="status" aria-live="polite">
      <div class="land-operation-spinner"></div>
      <strong>Йде реєстрація права власності</strong>
      <p>Перевіряємо ділянки, готуємо документи та вносимо запис у земельний реєстр.</p>
      <small id="landOperationCount"></small>
    </div>
  `;
  document.body.appendChild(landOperationOverlay);
  return landOperationOverlay;
}

function showLandOperationOverlay(count = 1, operation = "buy") {
  const overlay = ensureLandOperationOverlay();
  const title = overlay.querySelector("strong");
  const text = overlay.querySelector("p");
  const counter = overlay.querySelector("#landOperationCount");
  if (operation === "sell") {
    if (title) title.textContent = "Йде переоформлення права власності";
    if (text) text.textContent = "Повертаємо ділянки системі, оновлюємо земельний реєстр і нараховуємо кошти.";
  } else if (operation === "fertilizer") {
    if (title) title.textContent = "Застосовуємо добрива";
    if (text) text.textContent = "Перевіряємо вибрані ділянки та оновлюємо їхній рівень родючості.";
  } else if (operation === "building") {
    if (title) title.textContent = "Оформлюємо побудову";
    if (text) text.textContent = "Перевіряємо ділянки, реєструємо об'єкт і оновлюємо господарство.";
  } else if (operation === "machinery") {
    if (title) title.textContent = "Оформлюємо купівлю техніки";
    if (text) text.textContent = "Перевіряємо доступність техніки та вносимо її до господарства.";
  } else {
    if (title) title.textContent = "Йде реєстрація права власності";
    if (text) text.textContent = "Перевіряємо ділянки, готуємо документи та вносимо запис у земельний реєстр.";
  }
  if (counter) counter.textContent = count > 1 ? `У пакеті: ${count} позицій` : "Одна позиція";
  overlay.classList.remove("is-hidden");
}

function hideLandOperationOverlay() {
  landOperationOverlay?.classList.add("is-hidden");
}

function mergeClaimResponses(first = {}, second = {}) {
  return {
    ok: true,
    claimed: [...new Set([...(first.claimed || []), ...(second.claimed || [])])],
    alreadyOwned: [...new Set([...(first.alreadyOwned || []), ...(second.alreadyOwned || [])])],
    rejected: [...new Set([...(first.rejected || []), ...(second.rejected || [])])],
    prices: { ...(first.prices || {}), ...(second.prices || {}) },
    charged: (Number(first.charged) || 0) + (Number(second.charged) || 0),
    coins: Number.isFinite(second.coins) ? second.coins : first.coins,
    lastIncomeAt: second.lastIncomeAt || first.lastIncomeAt || null,
    stats: second.stats || first.stats || null,
    version: Number.isFinite(second.version) ? second.version : first.version,
    resetAt: second.resetAt || first.resetAt || null
  };
}

function isTransientClaimError(error) {
  const status = Number(error?.status) || 0;
  return status === 0 || status === 502 || status === 503 || status === 504;
}

async function claimLandBatch(batch) {
  try {
    return await requestJson("/api/claim", {
      method: "POST",
      body: JSON.stringify({
        cells: batch.map((cell) => ({
          id: cell.id,
          price: cell.price,
          region: cellLocationName(cell),
          nickname: `${cellLocationName(cell)}, ${String(cell.code || cell.id).slice(-5)}`
        }))
      })
    });
  } catch (error) {
    // A gateway can return 502 after the Node process has already committed the first request.
    // /api/claim is idempotent for the same owner, so retry smaller halves and treat
    // alreadyOwned as a successful recovery instead of charging twice.
    if (!isTransientClaimError(error) || batch.length <= 100) throw error;
    const middle = Math.ceil(batch.length / 2);
    const first = await claimLandBatch(batch.slice(0, middle));
    const second = await claimLandBatch(batch.slice(middle));
    return mergeClaimResponses(first, second);
  }
}

async function buySelectedCell() {
  if (purchaseInProgress) return;
  const cells = freeSelectedCells();
  if (!cells.length) return;
  const ownedBeforePurchase = playerOwnedCellCount();
  const packageFreeIds = new Set(cells.map((cell) => cell.id));
  const totalPrice = cells.reduce((sum, cell, index) => sum + priceForCellId(cell.id, ownedBeforePurchase + index, packageFreeIds), 0);
  if (state.coins < totalPrice) {
    showGameMessage(`Потрібно ${money(totalPrice)}, на балансі ${money(state.coins)}.`);
    return;
  }

  purchaseInProgress = true;
  buyButton.disabled = true;
  showLandOperationOverlay(cells.length);
  try {
    const ownedNowIds = new Set();
    const authoritativePrices = new Map();
    for (let index = 0; index < cells.length; index += CLAIM_BATCH_SIZE) {
      const batch = cells.slice(index, index + CLAIM_BATCH_SIZE);
      const claim = await claimLandBatch(batch);
      if (Number.isFinite(claim.version)) marketVersion = claim.version;
      if (Number.isFinite(claim.coins)) state.coins = claim.coins;
      if (typeof claim.lastIncomeAt === "string") state.lastIncomeAt = claim.lastIncomeAt;
      if (claim.stats && typeof claim.stats === "object") state.stats = { ...state.stats, ...claim.stats };
      Object.entries(claim.prices || {}).forEach(([id, price]) => authoritativePrices.set(id, Number(price)));
      const acceptedIds = [...new Set([...(claim.claimed || []), ...(claim.alreadyOwned || [])])];
      applyClaimedCellsToVisibleLand(acceptedIds);
      refreshCanvasMapLayers();
      acceptedIds.forEach((id) => ownedNowIds.add(id));
    }
    marketOwnedCellCount += ownedNowIds.size;
    const claimedCells = cells.filter((cell) => ownedNowIds.has(cell.id));
    if (!claimedCells.length) {
      showGameMessage("Не вдалося купити: ці ділянки вже зайняті.");
      refreshVisibleCellLayers(cells.map((cell) => cell.id));
      render();
      return;
    }
    if (claimedCells.length < cells.length) {
      showGameMessage(`Куплено ${claimedCells.length} з ${cells.length} земельних ділянок. Частину вже зайняли інші гравці.`);
    }
    cells.length = 0;
    cells.push(...claimedCells.map((cell) => ({ ...cell, price: authoritativePrices.get(cell.id) || cell.price })));
  } catch (error) {
    // If a proxy lost the response after the server committed a batch, reconcile the viewport
    // immediately so the UI does not keep showing those cells as free.
    scheduleVisibleLandRefresh(20);
    showGameMessage(error.message);
    return;
  } finally {
    purchaseInProgress = false;
    buyButton.disabled = false;
    hideLandOperationOverlay();
    // Always leave a purchase attempt in navigation mode. Returns from try/catch still run
    // finally, so failed/conflicting purchases cannot leave dragPan disabled until F5.
    if (clusterSelectionMode) setClusterSelectionMode(false);
    else map?.dragging?.enable?.();
  }

  const finalPrice = cells.reduce((sum, cell) => sum + cell.price, 0);
  const purchasedAt = new Date().toISOString();
  cells.forEach((cell) => {
    const placeName = cellLocationName(cell);
    state.land[cell.id] = {
      id: cell.id,
      price: cell.price,
      purchasedAt,
      level: 1,
      building: null,
      buildingId: null,
      buildingGroupId: null,
      buildingLevel: 0,
      machinery: false,
      machineryLevel: 0,
      nickname: `${placeName}, ${cell.code.slice(-5)}`
    };
  });
  landMembershipRevision += 1;
  farmDerivedStatsCache = null;
  // Purchase counters are updated by the server together with the transaction.
  addEvent(cells.length === 1
    ? `Куплено земельну ділянку ${cells[0].code} ${cellLocationPhrase(cells[0])}.`
    : `Куплено земельних ділянок: ${cells.length} за ${money(finalPrice)}.`);
  addLedger("buy", `Купівля землі: ${cells.length} ділянок`, -finalPrice, cells.length);
  showGameMessage(cells.length === 1
    ? "Землю куплено. Дохід почне нараховуватися."
    : `Куплено земельних ділянок: ${cells.length}.`);
  refreshVisibleCellLayers(cells.map((cell) => cell.id));
  scheduleVisibleLandRefresh(20);
  // /api/claim already persisted the land delta. Only the compact stats/events/ledger
  // changed locally, so avoid uploading the player's entire 90k+ cell farm again.
  queueSave({ scope: "meta" });
  render();
}

function upgradeSelectedCell() {
  openFertilizerPurchase();
}

function buildOnSelectedCell() {
  const builtCells = ownedSelectedCells().filter((cell) => {
    const owned = state.land[cell.id];
    return owned?.building || owned?.buildingId;
  });
  if (builtCells.length) {
    demolishSelectedBuildings(builtCells);
    return;
  }
  const buildable = buildableSelectedCells();
  if (buildable.length < minBuildingCells()) {
    showGameMessage(`Для побудови потрібно виділити щонайменше ${minBuildingCells()} ваших вільних від побудов ділянок.`);
    return;
  }
  openAssetPurchase("elevators");
}

function buyMachinery() {
  openAssetPurchase("machinery");
}

async function demolishSelectedBuildings(cells = ownedSelectedCells()) {
  const targets = cells.filter((cell) => state.land[cell.id]?.building || state.land[cell.id]?.buildingId);
  if (!targets.length) return;
  if (!confirm(`Знести побудови на вибраних ділянках: ${targets.length}?`)) return;

  let payload;
  try {
    showLandOperationOverlay(targets.length, "building");
    payload = await requestJson("/api/purchase-asset", {
      method: "POST",
      body: JSON.stringify({ kind: "demolish", cellIds: targets.map((cell) => cell.id) })
    });
  } catch (error) {
    showGameMessage(error.message);
    return;
  } finally {
    hideLandOperationOverlay();
  }
  applyServerEconomyPatch(payload);
  const changedIds = Object.keys(payload.landPatch || {});
  addEvent(`Знесено побудов на ділянках: ${changedIds.length}.`);
  addLedger("building-demolish", `Знесено побудову: ${changedIds.length} комірок`, 0, 0);
  refreshVisibleCellLayers(changedIds);
  scheduleGridUpdate();
  queueSave({ scope: "meta" });
  render();
}

function openFertilizerPurchase() {
  activeAssetKind = "fertilizer";
  const cells = ownedSelectedCells().filter((cell) => {
    const owned = state.land[cell.id];
    return owned && !owned.building && !owned.buildingId && owned.level < maxLandLevel();
  });
  if (!cells.length) {
    showGameMessage("Оберіть вашу ділянку, яку можна покращити добривами.");
    return;
  }
  const minCurrentLevel = Math.min(...cells.map((cell) => state.land[cell.id].level || 1));
  const levels = LAND_LEVELS.filter((item) => item.level > minCurrentLevel);
  if (!levels.length) {
    showGameMessage("Для вибраних ділянок уже доступний максимальний рівень добрив.");
    return;
  }
  assetModalEyebrow.textContent = "Інвестиції в добрива";
  assetModalTitle.textContent = "Виберіть рівень добрив";
  assetOptions.innerHTML = levels.map((item, index) => {
    const totalCost = fertilizerCostForSelectedCells(item.level);
    return `
      <label class="asset-option ${index === 0 ? "is-active" : ""}">
        <input type="radio" name="assetId" value="${item.level}" ${index === 0 ? "checked" : ""}>
        <span class="asset-icon"><span>${item.level}</span></span>
        <span><strong>${escapeHtml(item.name)}</strong><small>${money(totalCost)} · +${item.incomeBonusPercent}% до доходу землі</small></span>
      </label>
    `;
  }).join("");
  assetQuantity.value = 1;
  assetQuantity.closest("label")?.classList.add("is-hidden");
  updateAssetTotal();
  openModal(assetModal);
}

function selectedFertilizerLevel() {
  const level = Number(new FormData(assetForm).get("assetId")) || 1;
  return LAND_LEVELS.find((item) => item.level === level) || LAND_LEVELS[0];
}

function fertilizerCostForSelectedCells(targetLevel) {
  return ownedSelectedCells().reduce((sum, cell) => {
    const owned = state.land[cell.id];
    if (!owned || owned.building || owned.buildingId) return sum;
    return sum + fertilizerUpgradeCost(owned.level || 1, targetLevel);
  }, 0);
}

function assetItemsForKind(kind) {
  const items = kind === "elevators"
    ? (gameSettings?.assets?.elevatorItems || [])
    : (gameSettings?.assets?.machineryItems || []);
  return items;
}

function openAssetPurchase(kind) {
  activeAssetKind = kind;
  assetCarouselIndex = 0;
  assetPhotoIndex = 0;
  const items = assetItemsForKind(kind);
  if (!items.length) {
    showGameMessage("У налаштуваннях немає доступних активів.");
    return;
  }
  assetModalEyebrow.textContent = kind === "elevators" ? "Побудови" : "Техніка";
  assetModalTitle.textContent = kind === "elevators" ? "Побудувати" : "Купити техніку";
  assetOptions.innerHTML = `<input type="hidden" name="assetId" value="${escapeHtml(items[0].id)}">`;
  assetQuantity.value = kind === "elevators" ? buildableSelectedCells().length : 1;
  assetQuantity.closest("label")?.classList.toggle("is-hidden", kind === "elevators");
  updateAssetTotal();
  openModal(assetModal);
}

function selectedAssetItem() {
  const items = assetItemsForKind(activeAssetKind);
  const id = new FormData(assetForm).get("assetId");
  return items.find((item) => item.id === id) || items[assetCarouselIndex] || items[0];
}

function updateAssetTotal() {
  if (activeAssetKind === "fertilizer") {
    const item = selectedFertilizerLevel();
    const total = fertilizerCostForSelectedCells(item.level);
    assetTotal.innerHTML = `
      <div class="asset-total-main">
        <span class="asset-icon"><span>${item.level}</span></span>
        <span>${escapeHtml(item.name)}</span>
        <strong>${ownedSelectedCells().length} ділянок · ${money(total)} · +${item.incomeBonusPercent}% до доходу землі</strong>
      </div>
    `;
    const locked = Boolean(item.proOnly && !player?.isPro);
    if (assetSubmitButton) {
      assetSubmitButton.disabled = locked;
      assetSubmitButton.textContent = locked ? "Доступно для Pro гравців" : "Купити";
    }
    return;
  }
  const item = selectedAssetItem();
  const items = assetItemsForKind(activeAssetKind);
  const maxQuantity = activeAssetKind === "elevators" ? minCellsForBuilding(item) : 1;
  const quantity = activeAssetKind === "elevators" ? maxQuantity : Math.max(1, Math.min(maxQuantity, Math.floor(Number(assetQuantity.value) || 1)));
  const total = activeAssetKind === "elevators" ? (item?.cost || 0) : (item?.cost || 0) * quantity;
  const photos = item?.photos?.length ? item.photos : [];
  const currentPhotoIndex = assetPhotoIndex % Math.max(1, photos.length);
  const photo = photos[currentPhotoIndex] || "";
  assetTotal.innerHTML = item
    ? `
      <div class="asset-carousel-card">
        <div class="asset-carousel-title">
          <button class="asset-nav asset-nav-kind" type="button" data-asset-nav="-1" ${items.length < 2 ? "disabled" : ""}>‹</button>
          <strong>${escapeHtml(item.name)}</strong>
          <button class="asset-nav asset-nav-kind" type="button" data-asset-nav="1" ${items.length < 2 ? "disabled" : ""}>›</button>
        </div>
        <div class="asset-carousel-media">
          <button class="asset-nav asset-nav-photo" type="button" data-asset-photo-nav="-1" ${photos.length < 2 ? "disabled" : ""}>‹</button>
          <button class="asset-image-frame" type="button" ${photo ? `data-preview-src="${escapeHtml(photo)}" data-preview-gallery="${escapeHtml(JSON.stringify(photos))}" data-preview-index="${currentPhotoIndex}"` : ""}>
            ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}">` : renderIconPreview(item.icon)}
            ${item.proOnly && !player?.isPro ? '<span class="pro-asset-lock"><b>🔒</b><small>Доступно для Pro гравців</small></span>' : ""}
          </button>
          <button class="asset-nav asset-nav-photo" type="button" data-asset-photo-nav="1" ${photos.length < 2 ? "disabled" : ""}>›</button>
        </div>
        <div class="asset-characteristics">${assetCharacteristics(item, activeAssetKind)}</div>
        <div class="asset-total-main">
          <span>${activeAssetKind === "elevators" ? `${quantity} ділянок` : `${quantity} шт.`}</span>
          <strong>${money(total)}</strong>
        </div>
      </div>
    `
    : "";
  const locked = Boolean(item?.proOnly && !player?.isPro);
  if (assetSubmitButton) {
    assetSubmitButton.disabled = locked;
    assetSubmitButton.textContent = locked ? "Доступно для Pro гравців" : "Купити";
  }
}

function assetCharacteristics(item, kind) {
  const rows = kind === "elevators"
    ? [
        ["Дохід", `${money(item.incomePerDay || 0)} / добу`],
        ["Мінімум", `${minCellsForBuilding(item)} ділянок`],
        ["Ліміт", `${item.maxOwnerLandPercent || 25}% землі власника`],
        Number(item.serviceLifeExtensionDays) > 0 ? ["Техніка", `+${item.serviceLifeExtensionDays} днів до строку дії`] : null
      ]
    : [
        ["Бонус", `+${item.incomeBonusPercent || 0}% до доходу землі`],
        ["Потрібно землі", `${Math.max(1, Number(item.minCells) || 1)} ділянок`],
        ["Термін дії", `${item.durationDays || 80} днів`],
        ["Площа обробки", `до ${item.landCapacity || 25} земель на одиницю`]
      ];
  if (item.proOnly) rows.unshift(["Доступ", "🔒 Pro гравці"]);
  return rows.filter(Boolean).map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
}

function stepAssetItem(delta) {
  const items = assetItemsForKind(activeAssetKind);
  if (items.length < 2) return;
  assetCarouselIndex = (assetCarouselIndex + delta + items.length) % items.length;
  assetPhotoIndex = 0;
  const input = assetOptions.querySelector("input[name='assetId']");
  if (input) input.value = items[assetCarouselIndex].id;
  updateAssetTotal();
}

function stepAssetPhoto(delta) {
  const photos = selectedAssetItem()?.photos || [];
  if (photos.length < 2) return;
  assetPhotoIndex = (assetPhotoIndex + delta + photos.length) % photos.length;
  updateAssetTotal();
}

let imagePreviewPhotos = [];
let imagePreviewIndex = 0;

function openImagePreview(src, photos = [], index = 0) {
  if (!imagePreviewModal || !imagePreviewTarget || !src) return;
  imagePreviewPhotos = (Array.isArray(photos) && photos.length ? photos : [src]).filter(Boolean);
  imagePreviewIndex = Math.max(0, Math.min(Number(index) || 0, imagePreviewPhotos.length - 1));
  renderImagePreview();
  openModal(imagePreviewModal);
}

function renderImagePreview() {
  if (!imagePreviewTarget) return;
  const src = imagePreviewPhotos[imagePreviewIndex];
  if (!src) return;
  imagePreviewTarget.src = src;
  if (imagePreviewCounter) imagePreviewCounter.textContent = `${imagePreviewIndex + 1} / ${imagePreviewPhotos.length}`;
  const onlyOne = imagePreviewPhotos.length < 2;
  if (imagePreviewPrev) imagePreviewPrev.disabled = onlyOne;
  if (imagePreviewNext) imagePreviewNext.disabled = onlyOne;
}

function stepImagePreview(delta) {
  if (imagePreviewPhotos.length < 2) return;
  imagePreviewIndex = (imagePreviewIndex + delta + imagePreviewPhotos.length) % imagePreviewPhotos.length;
  renderImagePreview();
}

function openPreviewFromButton(photoButton) {
  if (photoButton.dataset.previewGallery) {
    try {
      const photos = JSON.parse(photoButton.dataset.previewGallery);
      if (Array.isArray(photos) && photos.length) {
        const index = Math.max(0, Math.min(Number(photoButton.dataset.previewIndex) || 0, photos.length - 1));
        openImagePreview(photos[index] || photoButton.dataset.previewSrc, photos, index);
        return;
      }
    } catch {
      // Fall back to collecting visible preview buttons below.
    }
  }
  const scope = photoButton.closest(".asset-gallery, .asset-photo-list, .asset-carousel-card") || document;
  const buttons = [...scope.querySelectorAll("[data-preview-src]")];
  const photos = buttons.map((button) => button.dataset.previewSrc).filter(Boolean);
  const index = Math.max(0, buttons.indexOf(photoButton));
  openImagePreview(photoButton.dataset.previewSrc, photos, index);
}

function applyServerEconomyPatch(payload = {}) {
  if (Number.isFinite(payload.coins)) state.coins = payload.coins;
  if (Number.isFinite(payload.currentDay)) state.currentDay = payload.currentDay;
  if (payload.inventory && typeof payload.inventory === "object") state.inventory = payload.inventory;
  if (payload.stats && typeof payload.stats === "object") state.stats = { ...state.stats, ...payload.stats };
  Object.entries(payload.landPatch || {}).forEach(([id, patch]) => {
    if (state.land?.[id]) state.land[id] = { ...state.land[id], ...patch };
  });
  farmDerivedStatsCache = null;
}

async function buyAsset(event) {
  event.preventDefault();
  if (activeAssetKind === "fertilizer") {
    await buyFertilizerLevel();
    return;
  }
  const item = selectedAssetItem();
  if (!item) return;
  if (item.proOnly && !player?.isPro) {
    showGameMessage("Цей актив доступний лише Pro гравцям.");
    return;
  }
  const buildableCells = activeAssetKind === "elevators" ? buildableSelectedCells() : [];
  const requiredBuildingCells = activeAssetKind === "elevators" ? minCellsForBuilding(item) : 0;
  const quantity = activeAssetKind === "elevators" ? requiredBuildingCells : 1;
  const total = item.cost || 0;

  if (activeAssetKind === "elevators") {
    if (ownedSelectedCells().length !== buildableCells.length) {
      showGameMessage("Серед виділених ділянок уже є побудова. Спочатку знесіть стару побудову.");
      return;
    }
    if (buildableCells.length !== requiredBuildingCells) {
      showGameMessage(`Для "${item.name}" потрібно виділити рівно ${requiredBuildingCells} ваших ділянок без побудов.`);
      return;
    }
    const maxAllowed = maxBuildingCellsForOwner(item);
    const existingCells = buildingCellCountForItem(item.id);
    if (existingCells + requiredBuildingCells > maxAllowed) {
      showGameMessage(`Ліміт для "${item.name}": максимум ${maxAllowed} ділянок (${item.maxOwnerLandPercent || 25}% вашої землі). Зараз уже зайнято: ${existingCells}.`);
      return;
    }
  } else if (activeAssetKind === "machinery") {
    const requiredLand = Math.max(1, Number(item.minCells) || 1);
    if (playerOwnedCellCount() < requiredLand) {
      showGameMessage(`Для "${item.name}" потрібно мати щонайменше ${requiredLand} земельних ділянок.`);
      return;
    }
  }
  if (state.coins < total) {
    showGameMessage(`Для покупки потрібно ${money(total)}.`);
    return;
  }

  let payload;
  try {
    showLandOperationOverlay(
      activeAssetKind === "elevators" ? requiredBuildingCells : 1,
      activeAssetKind === "elevators" ? "building" : "machinery"
    );
    payload = await requestJson("/api/purchase-asset", {
      method: "POST",
      body: JSON.stringify(activeAssetKind === "elevators"
        ? { kind: "building", itemId: item.id, cellIds: buildableCells.map((cell) => cell.id) }
        : { kind: "machinery", itemId: item.id })
    });
  } catch (error) {
    showGameMessage(error.message);
    return;
  } finally {
    hideLandOperationOverlay();
  }

  applyServerEconomyPatch(payload);
  const charged = Math.max(0, Number(payload.charged) || total);
  if (activeAssetKind === "elevators") {
    const changedIds = Object.keys(payload.landPatch || {});
    addEvent(`Побудовано: ${item.name}, ${changedIds.length} комірок.`);
    addLedger("building", `${item.name}: ${changedIds.length} комірок`, -charged, 0);
    closeModals();
    showGameMessage(`Побудовано ${item.name}. Дохід +${money(item.incomePerDay || 0)} / добу.`);
    refreshVisibleCellLayers(changedIds);
    scheduleGridUpdate();
  } else {
    addEvent(`Куплено техніку: ${item.name}.`);
    addLedger("machinery", `${item.name}: 1 шт.`, -charged, 0);
    closeModals();
    showGameMessage(`Куплено ${item.name}. Витрачено ${money(charged)}.`);
  }
  queueSave({ scope: "meta" });
  render();
}

async function buyFertilizerLevel() {
  const item = selectedFertilizerLevel();
  if (item.proOnly && !player?.isPro) {
    showGameMessage("Цей рівень добрив доступний лише Pro гравцям.");
    return;
  }
  const cells = ownedSelectedCells().filter((cell) => {
    const owned = state.land[cell.id];
    return owned && !owned.building && !owned.buildingId && (owned.level || 1) < item.level;
  });
  if (!cells.length) {
    showGameMessage("Вибраний рівень уже застосовано до цих ділянок.");
    return;
  }
  const totalCost = cells.reduce((sum, cell) => sum + fertilizerUpgradeCost(state.land[cell.id].level || 1, item.level), 0);
  if (state.coins < totalCost) {
    showGameMessage(`Для добрив потрібно ${money(totalCost)}.`);
    return;
  }

  let payload;
  try {
    showLandOperationOverlay(cells.length, "fertilizer");
    payload = await requestJson("/api/purchase-asset", {
      method: "POST",
      body: JSON.stringify({ kind: "fertilizer", level: item.level, cellIds: cells.map((cell) => cell.id) })
    });
  } catch (error) {
    showGameMessage(error.message);
    return;
  } finally {
    hideLandOperationOverlay();
  }
  applyServerEconomyPatch(payload);
  const changedIds = Object.keys(payload.landPatch || {});
  const charged = Math.max(0, Number(payload.charged) || totalCost);
  addEvent(changedIds.length === 1
    ? `На ділянці ${changedIds[0]} застосовано ${item.name}.`
    : `Застосовано ${item.name} для ділянок: ${changedIds.length}.`);
  addLedger("upgrade", `${item.name}: ${changedIds.length} ділянок`, -charged, 0);
  closeModals();
  showGameMessage(`Інвестицію в добрива збережено: ${item.name}.`);
  refreshVisibleCellLayers(changedIds);
  queueSave({ scope: "meta" });
  render();
}

async function sellSelectedLand() {
  const cells = ownedSelectedCells();
  if (!cells.length) return;
  let soldCells = [];
  let payload = null;

  showLandOperationOverlay(cells.length, "sell");
  try {
    payload = await requestJson("/api/sell", {
      method: "POST",
      body: JSON.stringify({ cells: cells.map((cell) => ({ id: cell.id, region: cellLocationName(cell) })) })
    });
    if (Number.isFinite(payload.version)) marketVersion = payload.version;
    removeCellsFromVisibleLand(Array.isArray(payload.soldIds) ? payload.soldIds : []);
    refreshCanvasMapLayers();
    const soldIds = new Set(Array.isArray(payload.soldIds) ? payload.soldIds : []);
    soldCells = cells.filter((cell) => soldIds.has(cell.id));
    if (Number.isFinite(payload.coins)) state.coins = payload.coins;
  } catch (error) {
    showGameMessage(error.message);
    return;
  } finally {
    hideLandOperationOverlay();
  }

  if (!soldCells.length) {
    showGameMessage("Продаж не виконано: ці ділянки вже не належать вам або карта оновилась.");
    refreshVisibleCellLayers(cells.map((cell) => cell.id));
    render();
    return;
  }

  soldCells.forEach((cell) => delete state.land[cell.id]);
  landMembershipRevision += 1;
  farmDerivedStatsCache = null;
  state.stats.buildings = Object.values(state.land || {}).filter((owned) => owned.building || owned.buildingId).length;
  selectedCellIds = new Set();
  selectedCellId = null;
  const totalRefund = Number.isFinite(payload?.refund) ? payload.refund : 0;
  addEvent(`Продано земельних ділянок: ${soldCells.length}. Отримано ${money(totalRefund)}.`);
  addLedger("sell", `Продаж землі: ${soldCells.length} ділянок`, totalRefund, -soldCells.length);
  showGameMessage(`Землю продано системі за ${money(totalRefund)}.`);
  marketOwnedCellCount = Math.max(0, marketOwnedCellCount - soldCells.length);
  scheduleVisibleLandRefresh(20);
  scheduleGridUpdate();
  queueSave();
  render();
}
function incomeWaitLabel(milliseconds) {
  const minutes = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} год ${rest} хв`;
  if (hours) return `${hours} год`;
  return `${Math.max(1, rest)} хв`;
}

async function collectIncome({ silent = false } = {}) {
  if (!player || player.isGuest) {
    if (!silent) showGameMessage("Для серверного доходу потрібно увійти в акаунт.");
    return;
  }
  if (!silent && saveScope) await saveState();

  let payload;
  try {
    payload = await requestJson("/api/collect-income", { method: "POST", body: "{}" });
  } catch (error) {
    if (!silent) showGameMessage(error.message);
    return;
  }

  if (Number.isFinite(payload.coins)) state.coins = payload.coins;
  if (Number.isFinite(payload.currentDay)) state.currentDay = payload.currentDay;
  if (typeof payload.lastIncomeAt === "string") state.lastIncomeAt = payload.lastIncomeAt;
  if (payload.stats && typeof payload.stats === "object") state.stats = { ...state.stats, ...payload.stats };
  state.inventory = normalizeMachineryInventory(state.inventory, state.currentDay || 1);
  farmDerivedStatsCache = null;

  const income = Math.max(0, Math.floor(Number(payload.income) || 0));
  const days = Math.max(0, Math.floor(Number(payload.days ?? payload.cycles) || 0));
  if (!days || !income) {
    if (!silent) showGameMessage(`Добовий дохід уже синхронізовано. Наступне нарахування приблизно через ${incomeWaitLabel(payload.nextInMs)}.`);
    render();
    return;
  }

  if (!silent) showGameMessage(`Автоматично нараховано ${money(income)} за ${days} ${days === 1 ? "добу" : "діб"}.`);
  render();
}

function cellTooltip(cell, owner) {
  const settlementLine = cellSettlementLine(cell);
  const displayPrice = owner === "free" ? priceForCellId(cell.id) : cell.price;
  if (owner === "player") {
    const breakdown = incomeBreakdown(cell, state.land[cell.id]);
    const buildingItem = buildingItemForCell(state.land[cell.id]);
    if (buildingItem) {
      return `
        <strong>${escapeHtml(buildingItem.name)}</strong>
        <span>${settlementLine}</span>
        <em>Дохід побудови: ${money(breakdown.total)} / добу</em>
      `;
    }
    return `
      <strong>${state.land[cell.id].nickname || "Ваша ділянка"}</strong>
      <span>${settlementLine}</span>
      <em>Дохід: ${money(breakdown.total)} / добу</em>
      <em>Добрива: +${money(breakdown.landGain)} / добу</em>
      <em>Техніка: +${money(breakdown.machineryGain)} / добу</em>
    `;
  }
  if (owner === "rival") {
    return `
      <strong>${rivalName(cell.id)}</strong>
      <span>${settlementLine}</span>
      <em>Земля вже зайнята</em>
    `;
  }
  return `
    <strong>Вільна земля</strong>
    <span>${settlementLine}</span>
    <em>Ціна: ${money(displayPrice)}</em>
    <em>Базовий дохід: ${money(cellBaseIncome(cell))} / добу</em>
  `;
}

function selectCell(cellId, event = null) {
  if (isOverviewZoom()) {
    showGameMessage("На Zoom 5/7 виділення земельних ділянок недоступне.");
    return;
  }
  if (clusterSelectionMode && !event?.shiftKey) {
    toggleCellSelection(cellId);
    return;
  }

  const previousSelection = new Set(selectedCellIds);
  if (selectedCellId) previousSelection.add(selectedCellId);
  selectionPopupDismissed = false;

  if (event?.shiftKey) {
    const groupIds = buildingGroupCellIds(cellId);
    const idsToToggle = groupIds.length ? groupIds : [cellId];
    if (idsToToggle.every((id) => selectedCellIds.has(id))) {
      idsToToggle.forEach((id) => selectedCellIds.delete(id));
    } else {
      idsToToggle.forEach((id) => selectedCellIds.add(id));
      selectedCellId = cellId;
    }
    if (!selectedCellIds.size) selectedCellId = cellId;
  } else {
    const groupIds = buildingGroupCellIds(cellId);
    selectedCellId = cellId;
    selectedCellIds = new Set(groupIds.length ? groupIds : [cellId]);
  }

  refreshVisibleCellLayers(changedSelectionIds(previousSelection, selectedCellIds));
  const cell = getCell(cellId);
}

function buildingGroupCellIds(cellId) {
  const owned = state.land?.[cellId];
  const groupId = owned?.buildingGroupId;
  if (!groupId) return [];
  return Object.entries(state.land || {})
    .filter(([, cell]) => cell.buildingGroupId === groupId)
    .map(([id]) => id);
}

function changedSelectionIds(previousSelection, nextSelection) {
  const changed = new Set(previousSelection);
  nextSelection.forEach((id) => changed.add(id));
  return changed;
}

function showSelectionPopup(text) {
  if (!selectionPopup || !selectionSummary || selectionPopupDismissed) return;
  selectionSummary.textContent = text;
  selectionPopup.classList.remove("is-hidden");
}

function hideSelectionPopup() {
  selectionPopup?.classList.add("is-hidden");
}

function showCellInfoPanel() {
  cellInfoOpen = true;
  cellInfoPanel?.classList.remove("is-hidden");
  if (window.matchMedia("(max-width: 860px)").matches) {
    cellInfoPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function hideCellInfoPanel() {
  cellInfoOpen = false;
  cellInfoPanel?.classList.add("is-hidden");
}

function setClusterSelectionMode(enabled) {
  if (enabled && isOverviewZoom()) {
    clusterSelectionMode = false;
    clusterSelectButton?.classList.remove("is-active");
    mapBoard?.classList.remove("is-cluster-mode");
    showGameMessage("Виділення кластера доступне лише на Zoom 10/12.");
    return;
  }
  clusterSelectionMode = enabled;
  clusterSelectButton?.classList.toggle("is-active", enabled);
  mapBoard?.classList.toggle("is-cluster-mode", enabled);
  if (!map) return;
  if (enabled) {
    clusterModeDragWasEnabled = !!map?.dragging?.enabled?.();
    map.dragging.disable();
    showGameMessage("Режим виділення кластера: проведіть пальцем прямокутник або натискайте ділянки для додавання/зняття.");
  } else {
    // Keep the mode-level drag state separate from selectionDragWasEnabled: every pointer
    // selection starts while dragPan is intentionally disabled and would otherwise overwrite
    // the value needed to restore normal map navigation when cluster mode ends.
    if (clusterModeDragWasEnabled) map.dragging.enable();
    clusterModeDragWasEnabled = true;
  }
}

function toggleCellSelection(cellId) {
  if (isOverviewZoom()) return;
  const previousSelection = new Set(selectedCellIds);
  if (selectedCellIds.has(cellId)) {
    selectedCellIds.delete(cellId);
    if (selectedCellId === cellId) selectedCellId = selectedCellIds.values().next().value || null;
  } else {
    selectedCellIds.add(cellId);
    selectedCellId = cellId;
  }
  selectionPopupDismissed = false;
  refreshVisibleCellLayers(changedSelectionIds(previousSelection, selectedCellIds));
  render();
}

function selectedBuildingInfo() {
  const ids = selectedCellIds.size ? [...selectedCellIds] : (selectedCellId ? [selectedCellId] : []);
  if (!ids.length) return null;
  const ownerships = ids.map((id) => state.land?.[id]);
  if (ownerships.some((ownership) => !ownership || (!ownership.building && !ownership.buildingId))) return null;
  const buildingIds = new Set(ownerships.map((ownership) => ownership.building || ownership.buildingId));
  const groupIds = new Set(ownerships.map((ownership, index) => ownership.buildingGroupId || `cell:${ids[index]}`));
  if (buildingIds.size !== 1 || groupIds.size !== 1) return null;
  const item = buildingItemById([...buildingIds][0]);
  if (!item) return null;
  return { item, count: ids.length };
}

function setActionVisibility({ buy = false, contact = false, offer = false, upgrade = false, building = false, machinery = false, sell = false } = {}) {
  [[buyButton, buy], [contactOwnerButton, contact], [offerBuyoutButton, offer], [upgradeButton, upgrade], [buildingButton, building], [machineryButton, machinery], [sellButton, sell]]
    .forEach(([button, visible]) => button?.classList.toggle("is-hidden", !visible));
}

function renderSelectedCell() {
  if (!selectedCellId) {
    hideSelectionPopup();
    hideCellInfoPanel();
    cellTitle.textContent = "Оберіть ділянку";
    cellDetails.innerHTML = "";
    setActionButton(buyButton, "Купити землю", "Оберіть вільну ділянку на карті");
    setActionButton(contactOwnerButton, "Зв'язатися з власником", "Доступно для зайнятої чужої ділянки");
    setActionButton(upgradeButton, "Інвестиції в добрива", "Підвищує рівень добрив і дохід землі");
    setActionButton(buildingButton, "Побудувати", "Потрібно виділити 3 ваші ділянки");
    setActionButton(machineryButton, "Купити техніку", "Підсилює продуктивність ділянок");
    setActionButton(sellButton, "Продати землю", "Повертає частину вартості системі");
    buyButton.disabled = true;
    if (contactOwnerButton) contactOwnerButton.disabled = true;
    upgradeButton.disabled = true;
    buildingButton.disabled = true;
    machineryButton.disabled = true;
    sellButton.disabled = true;
    setActionVisibility();
    return;
  }

  if (isOverviewZoom()) {
    const cell = getCell(selectedCellId);
    cellTitle.textContent = cell ? "Огляд території" : "Оберіть ділянку";
    cellDetails.innerHTML = `<div><dt>Масштаб</dt><dd>Для операцій із землею наблизьте карту до рівня 150, 75 або 40 комірок по ширині.</dd></div>`;
    const cellOwner = cell ? getOwner(cell.id) : "free";
    const canOperate = Boolean(cell) && selectedCellIds.size <= 1;
    setActionButton(buyButton, "Купити землю", canOperate && cellOwner === "free" ? "" : "Наблизьте карту або виберіть вільну ділянку");
    setActionButton(contactOwnerButton, "Зв'язатися з власником", cellOwner === "rival" ? "" : "Доступно для чужої зайнятої ділянки");
    setActionButton(upgradeButton, "Інвестиції в добрива", canOperate && cellOwner === "player" ? "" : "Доступно на 3 найближчих масштабах");
    setActionButton(buildingButton, "Побудувати", canOperate && cellOwner === "player" ? "" : "Доступно на 3 найближчих масштабах");
    setActionButton(machineryButton, "Купити техніку", canOperate ? "" : "Доступно на 3 найближчих масштабах");
    setActionButton(sellButton, "Продати землю", canOperate && cellOwner === "player" ? "" : "Доступно на 3 найближчих масштабах");
    buyButton.disabled = !(cellOwner === "free" && cell);
    if (contactOwnerButton) contactOwnerButton.disabled = !(cellOwner === "rival");
    upgradeButton.disabled = !(cellOwner === "player");
    buildingButton.disabled = !(cellOwner === "player");
    machineryButton.disabled = !(cellOwner === "player" || cellOwner === "rival" || cellOwner === "free");
    sellButton.disabled = !(cellOwner === "player");
    setActionVisibility();
    showSelectionPopup("Наблизьте карту, щоб працювати з окремими ділянками.");
    if (cellInfoOpen) cellInfoPanel?.classList.remove("is-hidden");
    return;
  }

  if (selectedCellIds.size > 1) {
    const summary = selectedGroupSummary();
    const cells = { length: summary.totalCount };
    const freeCells = { length: summary.freeCount };
    const ownedCellsList = { length: summary.ownedCount };
    const rivalCells = summary.rivalCount;
    const totalPrice = summary.totalPrice;
    const totalIncome = summary.totalIncome;
    const selectedOwners = new Set([...selectedCellIds].map((id) => ownerIdForCell(id)).filter(Boolean));
    const canOfferBuyout = summary.rivalCount === cells.length && selectedOwners.size === 1;

    const selectedBuilding = selectedBuildingInfo();
    cellTitle.textContent = selectedBuilding
      ? selectedBuilding.item.name
      : `Виділено ${cells.length} земельних ділянок`;
    cellDetails.innerHTML = [
      ["Вільні", freeCells.length],
      ["Ваші", ownedCellsList.length],
    ["Інші гравці", rivalCells],
      ["Вартість купівлі", money(totalPrice)],
      ["Потенційний дохід", `${money(totalIncome)} / добу`],
      ["Продаж системі", money(summary.sellTotal)]
    ].map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");

    setActionButton(buyButton, freeCells.length ? `Купити землю - ${money(totalPrice)}` : "Купити землю", "Нова земля дає базовий дохід за добу");
    setActionButton(contactOwnerButton, "Зв'язатися з власником", "Оберіть одну зайняту чужу ділянку");
    setActionButton(upgradeButton, summary.upgradeCost ? `Добрива - ${money(summary.upgradeCost)}` : "Інвестиції в добрива", fertilizerLevelsNote());
    const builtCount = ownedSelectedCells().filter((cell) => state.land[cell.id]?.building || state.land[cell.id]?.buildingId).length;
    setActionButton(buildingButton, builtCount ? "Знести побудову" : "Побудувати", builtCount ? `Вибрано комірок з побудовою: ${builtCount}` : `Доступно без побудов: ${summary.buildableCount}; мінімум ${minBuildingCells()}`);
    setActionButton(machineryButton, "Купити техніку", "Кожна одиниця додає свій % до доходу");
    setActionButton(sellButton, summary.sellTotal ? `Продати - ${money(summary.sellTotal)}` : "Продати землю", "Повертає частину вартості системі");
    buyButton.disabled = !freeCells.length;
    if (contactOwnerButton) contactOwnerButton.disabled = true;
    upgradeButton.disabled = !summary.canUpgrade;
    buildingButton.disabled = !(summary.buildableCount >= minBuildingCells() || builtCount);
    machineryButton.disabled = playerOwnedCellCount() < 1;
    sellButton.disabled = !summary.ownedCount;
    setActionVisibility({
      buy: freeCells.length > 0,
      offer: canOfferBuyout,
      upgrade: summary.canUpgrade,
      building: summary.buildableCount >= minBuildingCells() || builtCount > 0,
      machinery: summary.ownedCount > 0 && playerOwnedCellCount() > 0,
      sell: summary.ownedCount > 0
    });
    showSelectionPopup(selectedBuilding
      ? selectedBuilding.item.name
      : `Виділено ${cells.length} ділянок · ваші ${ownedCellsList.length} · вільні ${freeCells.length}`);
    if (cellInfoOpen) cellInfoPanel?.classList.remove("is-hidden");
    return;
  }

  const cell = getCell(selectedCellId);
  const owner = getOwner(selectedCellId);
  const owned = state.land[selectedCellId];
  const cluster = clusterByCell().get(selectedCellId);
  const basePrice = cell.basePrice || basePriceForCellId(selectedCellId);
  const pressure = nearbyOwnedPressure(selectedCellId);
  const neighborGrowthPercent = Number.isFinite(gameSettings?.economy?.nearbyPriceGrowthPercent) ? gameSettings.economy.nearbyPriceGrowthPercent : 8;

  const selectedBuilding = owned ? buildingItemForCell(owned) : null;
  cellTitle.textContent = selectedBuilding
    ? selectedBuilding.name
    : owner === "player"
      ? owned.nickname || "Ваша ділянка"
      : owner === "rival"
        ? rivalName(selectedCellId)
        : "Вільна земля";

  const rows = [
    ["ID ділянки", cell.code],
    ["Статус", owner === "player" ? "ваша власність" : owner === "rival" ? "зайнято іншим гравцем" : "вільна"],
    ["Власник", owner === "free" ? "Система" : ownerInfoButton(selectedCellId)],
    ["Вплив сусідів", pressure ? `${pressure} зайнятих поруч · +${neighborGrowthPercent}% кожна` : "немає"]
  ];

  if (owned) {
    const breakdown = incomeBreakdown(cell, owned);
    const buildingItem = selectedBuilding;
    if (buildingItem) {
      rows.push(["Побудова", escapeHtml(buildingItem.name)]);
      rows.push(["Дохід", `${money(buildingItem.incomePerDay || 0)} / добу`]);
    } else {
      rows.push(["Рівень добрив", `${owned.level} · ${escapeHtml(fertilizerLevel(owned.level)?.name || "")}`]);
      rows.push(["Дохід", `${money(breakdown.total)} / добу`]);
      rows.push(["Господарство", `${cluster ? cluster.size : 1} зем. у групі, бонус ${Math.round((cluster ? cluster.bonus : 0) * 100)}%`]);
      rows.push(["Техніка", `+${money(breakdown.machineryGain)} / добу (${breakdown.machineryPercent}%)`]);
    }
    rows.push(["Побудови загалом", inventoryDescription("elevators")]);
    rows.push(["Продаж системі", money(sellValue(cell, owned))]);
  } else {
    rows.push(["Базовий дохід", `${money(cellBaseIncome(cell))} / добу`]);
  }

  cellDetails.innerHTML = rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");
  setActionButton(buyButton, owner === "free" ? `Купити землю - ${money(cell.price)}` : "Купити землю", "Нова земля дає базовий дохід за добу");
  setActionButton(contactOwnerButton, "Зв'язатися з власником", "Написати власнику цієї ділянки");
  setActionButton(upgradeButton, owned && !owned.building && !owned.buildingId && owned.level < maxLandLevel() ? `Добрива - ${money(nextUpgradeCost(owned))}` : "Інвестиції в добрива", fertilizerLevelsNote());
  setActionButton(buildingButton, owned?.building || owned?.buildingId ? "Знести побудову" : "Побудувати", owned?.building || owned?.buildingId ? "Після знесення можна побудувати іншу" : `Потрібно мін. ${minBuildingCells()} ділянок без побудов`);
  setActionButton(machineryButton, "Купити техніку", "Кожна одиниця додає свій % до доходу");
  setActionButton(sellButton, owned ? `Продати - ${money(sellValue(cell, owned))}` : "Продати землю", "Повертає частину вартості системі");
  buyButton.disabled = owner !== "free";
  if (contactOwnerButton) contactOwnerButton.disabled = owner !== "rival" || !ownerIdForCell(selectedCellId);
  upgradeButton.disabled = !owned || owned.building || owned.buildingId || owned.level >= maxLandLevel();
  buildingButton.disabled = !owned || (!(owned.building || owned.buildingId) && buildableSelectedCells().length < minBuildingCells());
  machineryButton.disabled = !owned;
  sellButton.disabled = !owned;
  setActionVisibility({
    buy: owner === "free",
    contact: owner === "rival" && Boolean(ownerIdForCell(selectedCellId)),
    offer: owner === "rival" && Boolean(ownerIdForCell(selectedCellId)),
    upgrade: Boolean(owned && !owned.building && !owned.buildingId && owned.level < maxLandLevel()),
    building: Boolean(owned && ((owned.building || owned.buildingId) || buildableSelectedCells().length >= minBuildingCells())),
    machinery: Boolean(owned),
    sell: Boolean(owned)
  });
  showSelectionPopup(`${cell.code} · ${owner === "free" ? "вільна" : owner === "player" ? "ваша" : "інший гравець"}`);
  if (cellInfoOpen) cellInfoPanel?.classList.remove("is-hidden");
}

function renderMetrics() {
  const clusters = connectedClusters();
  const ownedCount = Object.keys(state.land).length;
  const income = totalDailyIncome();
  const value = assetsValue();
  const currentStage = [...stageRules].reverse().find((stage) => ownedCount >= stage.min) || stageRules[0];
  const nextStage = stageRules.find((stage) => stage.min > ownedCount);

  coinCount.textContent = money(state.coins);
  dayCount.textContent = state.currentDay;
  if (ownedMetric) ownedMetric.textContent = ownedCount;
  if (largestClusterMetric) largestClusterMetric.textContent = clusters[0] ? clusters[0].length : 0;
  if (incomeMetric) incomeMetric.textContent = money(income);
  if (assetMetric) assetMetric.innerHTML = `<span class="asset-metric-line">${inventoryCount("machinery")} тех. · ${money(buildingDailyIncome())}/добу побуд.</span><span class="asset-metric-line">${money(value)}</span>`;
  stageTitle.textContent = currentStage.title;
  stageText.textContent = nextStage
    ? `${currentStage.text} До наступного етапу: ${nextStage.min - ownedCount} зем.`
    : currentStage.text;
  const nextGoal = nextStage ? nextStage.min : Math.max(ownedCount, 1);
  stageProgress.style.width = `${Math.min(100, Math.round((ownedCount / nextGoal) * 100))}%`;
}

function renderLeaderboard() {
  const playerScore = assetsValue() + state.coins;
  const playerLandCount = Object.keys(state.land).length;
  const playerNameForList = state.companyName || "Ваше господарство";
  const fallbackRows = [
    { id: "local-player", name: playerNameForList, landCount: playerLandCount, cash: state.coins, score: playerScore }
  ];
  const serverRows = (leaderboardRows.length ? leaderboardRows : fallbackRows).map((row) => ({ ...row }));
  const playerRow = serverRows.find((row) => row.id === player?.id || row.id === "local-player");
  if (playerRow) {
    playerRow.id = player?.id || "local-player";
    playerRow.name = playerNameForList;
    playerRow.landCount = playerLandCount;
    playerRow.cash = state.coins;
    playerRow.score = playerScore;
  } else {
    serverRows.push({ id: player?.id || "local-player", name: playerNameForList, landCount: playerLandCount, cash: state.coins, score: playerScore });
  }
  const rows = serverRows
    .sort((a, b) => (b.landCount || 0) - (a.landCount || 0) || (b.cash || 0) - (a.cash || 0) || (b.score || 0) - (a.score || 0))
    .slice(0, 12);

  leaderboard.innerHTML = rows.map((row, index) => `
    <li class="${row.id === player?.id || row.name === playerNameForList ? "is-player" : ""}" data-leader-player="${escapeHtml(row.id || "")}">
      <span>${index + 1}. ${row.name}</span>
      <strong>${row.landCount || 0} зем. · ${money(row.cash || row.score || 0)}</strong>
    </li>
  `).join("");
}
function renderNews() {
  if (!newsList) return;
  newsList.innerHTML = newsRows.length
    ? newsRows.map((item) => `
      <article class="news-item ${item.tone ? `news-${escapeHtml(item.tone)}` : ""}" ${item.targetCellId ? `data-news-cell="${escapeHtml(item.targetCellId)}"` : ""}>
        <strong>${escapeHtml(item.title || "Новина")}</strong>
        <p>${escapeHtml(landLabel(item.text || ""))}</p>
        <time>${formatNewsTime(item.at)}</time>
      </article>
    `).join("")
    : `<article class="news-item"><strong>Ринок чекає</strong><p>Поки немає новин. Купіть землю, побудуйте об'єкт або обженіть лідера.</p></article>`;
}

function openNewsPanel() {
  openModal(newsModal);
}

function focusNewsTarget(cellId) {
  const normalized = normalizePlayableCellId(cellId);
  if (!normalized) return;
  newsReturnState = {
    center: map?.getCenter(),
    zoom: map?.getZoom(),
    scrollY: window.scrollY
  };
  newsModal?.classList.add("is-hidden");
  returnToNewsButton?.classList.remove("is-hidden");
  mapStage?.scrollIntoView({ behavior: "smooth", block: "center" });
  const cell = getCell(normalized);
  map.setView([cell.lat, cell.lng], detailZoomStart());
  window.setTimeout(() => {
    selectCell(cell.id);
  }, 220);
}

function returnToNews() {
  if (newsReturnState?.center && map) {
    map.setView(newsReturnState.center, snapZoom(newsReturnState.zoom || map.getZoom()));
  }
  if (Number.isFinite(newsReturnState?.scrollY)) {
    window.scrollTo({ top: newsReturnState.scrollY, behavior: "smooth" });
  }
  returnToNewsButton?.classList.add("is-hidden");
  openNewsPanel();
}

function formatNewsTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fertilizerLevelsNote() {
  return LAND_LEVELS
    .filter((item) => item.level > 1)
    .map((item) => `${item.level}: ${item.name} +${item.incomeBonusPercent}%`)
    .join("; ") || "Рівні добрив не налаштовані";
}

function inventoryDescription(kind) {
  const items = kind === "elevators" ? (gameSettings?.assets?.elevatorItems || []) : (gameSettings?.assets?.machineryItems || []);
  const bucket = kind === "elevators" ? buildingCountByItem() : activeMachineryMap();
  const rows = items
    .map((item) => ({ item, qty: Number(bucket?.[item.id]) || 0 }))
    .filter((row) => row.qty > 0);
  return rows.length
    ? rows.map((row) => kind === "elevators"
      ? `${escapeHtml(row.item.name)}: ${row.qty} шт. (${money((row.item.incomePerDay || 0) * row.qty)} / добу)`
      : `${escapeHtml(row.item.name)}: ${row.qty} шт. (+${row.item.incomeBonusPercent || 0}% кожна, разом +${Math.round((row.item.incomeBonusPercent || 0) * row.qty)}%)`).join("<br>")
    : "немає";
}

function render() {
  renderHeader();
  renderSelectedCell();
  renderMetrics();
  renderLeaderboard();
  renderNews();
}

function renderHeader() {
  renderPlayerHeader();
}

function renderMap() {
  invalidateGridGeometryCache();
  scheduleGridUpdate();
}

function renderPlayerHeader() {
  const name = state.companyName || player?.username || "Гравець";
  playerName.innerHTML = `${state.logo ? `<img class="company-logo" src="${state.logo}" alt="">` : ""}<span>${escapeHtml(name)}</span>${player?.isPro ? '<span title="Pro гравець" aria-label="Pro гравець">👑</span>' : ""}`;
}

function openModal(modal) {
  modal?.classList.remove("is-hidden");
}

function closeModal(modal) {
  modal?.classList.add("is-hidden");
  if (modal === messagesModal) stopActiveChatPolling();
  if (modal === imagePreviewModal && imagePreviewTarget) {
    imagePreviewTarget.removeAttribute("src");
    imagePreviewPhotos = [];
    imagePreviewIndex = 0;
  }
}

function closeModals() {
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("is-hidden"));
  if (imagePreviewTarget) imagePreviewTarget.removeAttribute("src");
  imagePreviewPhotos = [];
  imagePreviewIndex = 0;
}

function closeImagePreview() {
  imagePreviewModal?.classList.add("is-hidden");
  if (imagePreviewTarget) imagePreviewTarget.removeAttribute("src");
  imagePreviewPhotos = [];
  imagePreviewIndex = 0;
}

function renderProfileForm() {
  const ownedCount = Object.keys(state.land || {}).length;
  const clusters = connectedClusters();
  const currentStage = [...stageRules].reverse().find((stage) => ownedCount >= stage.min) || stageRules[0];
  profileCompanyName.value = state.companyName || "";
  profileColor.value = state.color || "#35c982";
  profileLogoPreview.innerHTML = state.logo ? `<img src="${state.logo}" alt="Емблема компанії">` : "<span>Емблему не завантажено</span>";
  profileStats.innerHTML = [
    ["Гравець", player?.username || "Гість"],
    ["Компанія", state.companyName || player?.username || "Гравець"],
    ["Етап", currentStage.title],
    ["Баланс", money(state.coins)],
    ["День гри", state.currentDay],
    ["Земельні ділянки", ownedCount],
    ["Найбільше господарство", clusters[0] ? clusters[0].length : 0],
    ["Дохід за добу", money(totalDailyIncome())],
    ["Інвестиції", money(assetsValue())],
    ["Техніка", inventoryCount("machinery")],
    ["Побудови", inventoryCount("elevators")],
    ["Бонус техніки", `+${Math.round((inventoryIncomeMultiplier() - 1) * 100)}%`],
    ["Дохід побудов", `${money(buildingDailyIncome())} / добу`],
    ["Зароблено всього", money(state.stats.earned || 0)],
    ["Куплено ділянок", state.stats.purchased || 0],
    ["Покращень", state.stats.upgraded || 0],
    ["Побудов", buildingObjectCount()],
    ["Активна техніка", inventoryCount("machinery")]
  ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
}

function selectedBuyoutCellIds() {
  return selectedCellIds.size ? [...selectedCellIds] : (selectedCellId ? [selectedCellId] : []);
}

function openBuyoutOffer() {
  const cellIds = selectedBuyoutCellIds();
  const ownerIds = new Set(cellIds.map((id) => ownerIdForCell(id)).filter(Boolean));
  if (!cellIds.length || ownerIds.size !== 1) {
    showGameMessage("Для пропозиції викупу виберіть землі одного власника.");
    return;
  }
  const ownerId = [...ownerIds][0];
  const cells = cellIds.map(getCell).filter(Boolean);
  const systemValue = cells.reduce((sum, cell) => sum + (Number(cell.price) || 0), 0);
  const income = cells.reduce((sum, cell) => sum + (Number(cell.income) || cellBaseIncome(cell)), 0);
  const fertilized = cellIds.filter((id) => (state.land?.[id]?.level || 1) > 1).length;
  const buildings = cellIds.filter((id) => state.land?.[id]?.building || state.land?.[id]?.buildingId).length;
  offerDetails.innerHTML = [["Власник", rivalName(cellIds[0])], ["Земель", cellIds.length], ["Системна оцінка", money(systemValue)], ["Орієнтовний дохід", `${money(income)} / добу`], ["Добрива", `${fertilized} ділянок`], ["Побудови", `${buildings} ділянок`]].map(([key, value]) => `<div><span>${key}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("");
  offerModal.dataset.ownerId = ownerId;
  offerModal.dataset.cellIds = JSON.stringify(cellIds);
  offerAmount.value = systemValue || 1;
  offerBalance.textContent = `Баланс: ${money(state.coins)} · Зарезервовано після відправлення: ${money(offerAmount.value)} · Доступно: ${money(state.coins - offerAmount.value)}`;
  openModal(offerModal);
}

function buildingObjectCount() {
  const groups = new Set();
  Object.entries(state.land || {}).forEach(([id, ownership]) => {
    const buildingId = ownership?.building || ownership?.buildingId;
    if (buildingId) groups.add(ownership.buildingGroupId || `${id}:${buildingId}`);
  });
  return groups.size;
}

function formatJournalDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })
    : "Невідомий час";
}

function renderDossier() {
  if (!dossierOverview || !dossierJournal) return;
  const ownedCount = Object.keys(state.land || {}).length;
  const clusters = connectedClusters();
  const stage = [...stageRules].reverse().find((item) => ownedCount >= item.min) || stageRules[0];
  const activeMachinery = inventoryCount("machinery");
  const buildingCount = buildingObjectCount();
  const machineryCoverage = Math.min(ownedCount, Object.entries(activeMachineryMap()).reduce((sum, [id, quantity]) => {
    return sum + Math.max(0, Number(quantity) || 0) * Math.max(1, Number(machineryItemById(id)?.landCapacity) || 25);
  }, 0));
  const unfertilizedCount = Object.values(state.land || {}).filter((item) => (item.level || 1) <= 1).length;
  const taxRate = Number(stage?.incomeTaxPercent) || 0;
  const latestIncome = (Array.isArray(state.ledger) ? state.ledger : []).find((entry) => entry?.type === "income" && entry?.details)?.details || null;
  const incomeRows = [
    ["Базовий дохід земель", "Дохід звичайних ділянок до застосування покращень.", latestIncome?.baseIncome],
    ["Бонус добрив", "Додатковий дохід від рівнів добрив на конкретних ділянках.", latestIncome?.fertilizerBonus],
    ["Бонус техніки", "Ефект активної техніки в межах її виробничої місткості.", latestIncome?.machineryBonus],
    ["Бонус господарств", "Приріст доходу від компактних суміжних земельних масивів.", latestIncome?.clusterBonus],
    ["Побудови", "Окремий дохід об'єктів; земля під ними не дає звичайного доходу.", latestIncome?.buildingIncome],
    ["Валовий дохід", "Сума всіх доходів до утримання податку.", latestIncome?.grossIncome],
    [`Податок ${latestIncome?.taxRate || taxRate}%`, "Віднімається з валового доходу за ставкою поточного етапу розвитку.", latestIncome?.tax, true],
    ["Зараховано", "Чистий дохід після податку, зарахований на баланс компанії.", latestIncome ? latestIncome.grossIncome - latestIncome.tax : null]
  ];
  dossierTitle.textContent = state.companyName || player?.username || "Господарство";
  dossierOverview.innerHTML = `
    <div class="dossier-grid">
      ${[["Етап розвитку", escapeHtml(stage.title)], ["Земельний банк", `${ownedCount} ділянок`], ["Найбільший кластер", `${clusters[0]?.length || 0} ділянок`], ["Баланс", money(state.coins)], ["Дохід за цикл", money(totalDailyIncome())], ["Податок", taxRate ? `${taxRate}%` : "не застосовується"], ["Активна техніка", `${activeMachinery} од.<br><small>Працюють на ${machineryCoverage} земельних ділянках<br>${Math.max(0, ownedCount - machineryCoverage)} ділянок без техніки</small>`], ["Побудови", `${buildingCount} об.`], ["Добрива", `${Object.values(state.land || {}).filter((item) => (item.level || 1) > 1).length} ділянок<br><small>${unfertilizedCount} ділянок без добрив</small>`], ["Інвестиції", money(assetsValue())]]
        .map(([label, value]) => `<div><span>${label}</span><strong>${String(value)}</strong></div>`).join("")}
    </div>
    <section class="dossier-section">
      <h4>Орієнтовні щоденні доходи/витрати</h4>
      <p>Складові показані за останнім завершеним нарахуванням. Поточні значення можуть змінюватися після купівлі, продажу або інвестицій.</p>
      <div class="income-structure">
        ${incomeRows.map(([title, description, amount, isExpense]) => `<div><span>${escapeHtml(title)}</span><small>${escapeHtml(description)}</small><strong class="${isExpense ? "journal-negative" : ""}">${amount == null ? "Буде показано після нарахування" : `${isExpense ? "-" : "+"}${money(amount)}`}</strong></div>`).join("")}
      </div>
    </section>`;
  const entries = Array.isArray(state.ledger) ? state.ledger : [];
  dossierJournal.innerHTML = entries.length ? `<div class="journal-list">${entries.map((entry) => {
    const details = entry.details;
    const amount = Number(entry.amount) || 0;
    const lines = details ? [
      ["Базовий дохід земель", details.baseIncome], ["Бонус добрив", details.fertilizerBonus],
      ["Бонус техніки", details.machineryBonus], ["Бонус господарств", details.clusterBonus],
      ["Побудови", details.buildingIncome], ["Валовий дохід", details.grossIncome],
      [`Податок ${details.taxRate || 0}%`, Number(details.tax) || 0, true], ["Зараховано", amount]
    ].map(([label, value, isExpense]) => `<div><span>${label}</span><strong class="${isExpense ? "journal-negative" : ""}">${isExpense ? "-" : "+"}${money(Math.abs(Number(value) || 0))}</strong></div>`).join("") : "";
    return `<article class="journal-entry"><time>${formatJournalDate(entry.at)}</time><h4>${escapeHtml(entry.text || "Подія")}</h4>${lines || `<p>${amount ? `${amount > 0 ? "+" : ""}${money(amount)}` : "Без зміни балансу"}</p>`}</article>`;
  }).join("")}</div>` : "<p class=\"muted-text\">Подій ще немає.</p>";
}

function activateDossierTab(tab) {
  document.querySelectorAll("[data-dossier-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.dossierTab === tab));
  dossierOverview?.classList.toggle("is-hidden", tab !== "overview");
  dossierJournal?.classList.toggle("is-hidden", tab !== "journal");
}

function renderHelp() {
  if (!helpSections) return;
  const economy = gameSettings?.economy || {};
  const stages = [...(gameSettings?.stages || stageRules)].sort((a, b) => a.min - b.min);
  const clusters = [...(gameSettings?.clusters || [])].sort((a, b) => a.min - b.min);
  const levels = [...(gameSettings?.upgrades?.landLevels || LAND_LEVELS)].sort((a, b) => a.level - b.level);
  const machinery = gameSettings?.assets?.machineryItems || [];
  const buildings = gameSettings?.assets?.elevatorItems || [];
  const taxRows = stages.filter((item) => Number(item.incomeTaxPercent) > 0)
    .map((item) => `<li>«${escapeHtml(item.title)}» від ${item.min} земель: ${item.incomeTaxPercent}%.</li>`).join("");
  const sections = [
    ["Мета гри", "Ваше завдання — розвивати власну аграрну компанію: купувати землю, формувати компактні господарства, підвищувати дохід, інвестувати в добрива, техніку та побудови."],
    ["Земля", `Земля — головний актив. Базова вартість зараз <b>${money(economy.baseLandPriceMin)}</b>, а базовий дохід — <b>${money(economy.baseIncomeMin)} / цикл</b>. Кожна зайнята земля в радіусі ${economy.nearbyPriceRadius || 1} піднімає ціну на ${economy.nearbyPriceGrowthPercent || 0}%. Пакетна купівля не збільшує ціну ділянок всередині самого пакета.`],
    ["Продаж землі", `Продаж враховує актуальну ринкову вартість, вкладення у добрива й побудови. Виплата становить <b>${economy.sellRefundPercent || 0}%</b> від розрахованої вартості.`],
    ["Господарства", clusters.length ? `Суміжні землі утворюють господарство. Бонуси: <ul>${clusters.map((item) => `<li>від ${item.min} земель: +${item.bonusPercent}%;</li>`).join("")}</ul>` : "Суміжні землі одного гравця утворюють господарство та можуть давати бонус до доходу."],
    ["Рівні розвитку компанії", `<ul>${stages.map((item, index) => `<li><b>${escapeHtml(item.title)}</b> — від ${item.min} земель; ціна нової землі ×${Number(item.landPriceMultiplier || 1).toLocaleString("uk-UA")} ${Number(item.incomeTaxPercent) ? `; податок ${item.incomeTaxPercent}%` : ""}.</li>`).join("")}</ul>`],
    ["Щоденний дохід", `Дохід нараховується раз на ${economy.incomeCycleMinutes || 1440} хв. і продовжує накопичуватися офлайн до ${economy.offlineIncomeCapHours || 0} годин. На нього впливають добрива, техніка, розмір господарства, побудови та податок.`],
    ["Добрива", `<ul>${levels.map((item) => `<li><b>${escapeHtml(item.name || `Рівень ${item.level}`)}</b>: +${item.incomeBonusPercent || 0}% доходу, вартість ${money(item.cost)}.</li>`).join("")}</ul>Покращення залишається на ділянці постійно.`],
    ["Техніка", machinery.length ? `<ul>${machinery.map((item) => `<li><b>${escapeHtml(item.name)}</b>: ${money(item.cost)}, +${item.incomeBonusPercent || 0}%, до ${item.landCapacity || 0} земель, строк ${item.durationDays || 0} днів.</li>`).join("")}</ul>` : "Техніка підвищує дохід земель на обмежений строк і має власну виробничу місткість."],
    ["Побудови", buildings.length ? `<ul>${buildings.map((item) => `<li><b>${escapeHtml(item.name)}</b>: займає ${item.minCells || 1} ділянок, приносить ${money(item.incomePerDay || 0)} / цикл.</li>`).join("")}</ul>Земля під побудовою не приносить звичайного земельного доходу.` : "Побудови займають кілька власних ділянок і мають власний дохід."],
    ["Податки", taxRows ? `<p>Податок віднімається від валового доходу відповідно до поточного етапу.</p><ul>${taxRows}</ul>` : "Для жодного етапу податок зараз не встановлено."],
    ["Досьє компанії", "У «Досьє» відображаються землі, господарства, баланс, дохід, активна техніка, побудови, добрива, активи, поточний етап і податок."],
    ["Журнал", "У журналі зберігаються фінансові операції та деталізація добових і офлайн-нарахувань: базовий дохід, бонуси, податок і чиста сума."],
    ["Основна стратегія", "Купуйте землю, об'єднуйте її у господарства, збільшуйте дохід, інвестуйте в розвиток і розширюйте компанію. Великий компактний масив ефективніший, але наступні покупки можуть бути дорожчими."]
  ];
  helpSections.innerHTML = sections.map(([title, content], index) => `<details class="help-section" ${index === 0 ? "open" : ""}><summary>${title}</summary><div>${content}</div></details>`).join("");
}

async function showOwnerInfo(ownerId) {
  if (!ownerModal || !ownerInfo || !ownerId) return;
  ownerInfo.innerHTML = "<p>Завантажуємо інформацію...</p>";
  openModal(ownerModal);
  if (ownerId === player?.id) {
    renderOwnerInfo({
      id: player?.id,
      username: player?.username || "Гість",
      companyName: state.companyName || player?.username || "Гравець",
      logo: state.logo || "",
      color: state.color || "#35c982",
      landCount: Object.keys(state.land || {}).length,
      cash: state.coins,
      score: assetsValue() + state.coins,
      income: totalDailyIncome(),
      machineryCount: inventoryCount("machinery"),
      buildingCount: inventoryCount("elevators"),
      rank: leaderboardRankForPlayer(player?.id)
    });
    return;
  }
  try {
    const info = await requestJson(`/api/player-info?id=${encodeURIComponent(ownerId)}`);
    renderOwnerInfo(info);
  } catch (error) {
    ownerInfo.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

function renderOwnerInfo(info) {
  ownerInfo.innerHTML = `
    <div class="owner-card">
      <div class="owner-logo" style="border-color:${escapeHtml(info.color || "#35c982")}">
        ${info.logo ? `<img src="${escapeHtml(info.logo)}" alt="Логотип компанії">` : `<span>${escapeHtml((info.companyName || "?").slice(0, 1))}</span>`}
      </div>
      <div>
        <h3>${escapeHtml(info.companyName || "Компанія")}</h3>
        <p>${escapeHtml(info.username || "Гравець")}</p>
      </div>
    </div>
    <div class="profile-stats">
      ${[
        ["Місце в рейтингу", info.rank ? `#${info.rank}` : "поза рейтингом"],
        ["Земельні ділянки", info.landCount || 0],
        ["Баланс", money(info.cash || 0)],
        ["Орієнтовна вартість активів", money(info.score || 0)],
        ["Техніка", info.machineryCount || 0],
        ["Побудови", info.buildingCount || 0],
        ["Дохід за добу", `${money(info.income || 0)} / добу`]
      ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("")}
    </div>
    ${info.id && info.id !== player?.id ? `<button class="primary-action" type="button" data-contact-player="${escapeHtml(info.id)}">Зв'язатися з гравцем</button>` : ""}
  `;
}

function leaderboardRankForPlayer(id) {
  const rows = [...leaderboardRows].sort((a, b) => (b.landCount || 0) - (a.landCount || 0) || (b.cash || 0) - (a.cash || 0) || (b.score || 0) - (a.score || 0));
  const index = rows.findIndex((row) => row.id === id);
  return index >= 0 ? index + 1 : null;
}

async function refreshMessageSummary() {
  if (!player || player.isGuest) return;
  try {
    const payload = await requestJson("/api/messages/summary");
    unreadMessages = Number(payload.unread) || 0;
    chats = Array.isArray(payload.chats) ? payload.chats : [];
    renderMessageBadge();
    if (!messagesModal?.classList.contains("is-hidden")) renderChatList();
  } catch {
    unreadMessages = 0;
    renderMessageBadge();
  }
}

function renderMessageBadge() {
  if (!messageBadge) return;
  messageBadge.textContent = unreadMessages > 99 ? "99+" : String(unreadMessages);
  messageBadge.classList.toggle("is-hidden", unreadMessages <= 0);
}

async function openMessagesPanel() {
  openModal(messagesModal);
  if (chatList) chatList.innerHTML = "<p>Завантажуємо чати...</p>";
  if (chatMessages) chatMessages.innerHTML = "<p class=\"muted-text\">Оберіть чат або напишіть власнику ділянки.</p>";
  await refreshMessageSummary();
  renderChatList();
  startActiveChatPolling();
}

function renderChatList() {
  if (!chatList) return;
  chatList.innerHTML = chats.length
    ? chats.map((chat) => `
      <button class="chat-list-item ${chat.userId === activeChatUserId ? "is-active" : ""}" type="button" data-chat-user="${escapeHtml(chat.userId)}">
        <strong>${escapeHtml(chat.companyName || chat.username || "Гравець")}</strong>
        <span>${escapeHtml(chat.lastText || "Немає повідомлень")}</span>
        ${chat.unread ? `<em>${chat.unread}</em>` : ""}
      </button>
    `).join("")
    : "<p class=\"muted-text\">Чатів ще немає.</p>";
}

async function openChat(userId) {
  if (!userId || userId === player?.id) return;
  activeChatUserId = userId;
  activeChatSignature = "";
  closeModal(ownerModal);
  openModal(messagesModal);
  renderChatList();
  await loadChatMessages(userId, { force: true, scroll: "bottom" });
  await refreshMessageSummary();
  startActiveChatPolling();
}

function chatRowsSignature(rows) {
  return rows.map((message) => `${message.id || ""}:${message.readAt || ""}:${message.createdAt || ""}`).join("|");
}

async function loadChatMessages(userId = activeChatUserId, options = {}) {
  if (!userId || !chatMessages) return;
  if (activeChatLoading) return;
  activeChatLoading = true;
  const silent = Boolean(options.silent);
  if (!silent) chatMessages.innerHTML = "<p>Завантажуємо повідомлення...</p>";
  try {
    const payload = await requestJson(`/api/messages/thread?userId=${encodeURIComponent(userId)}`);
    const rows = Array.isArray(payload.messages) ? payload.messages : [];
    const signature = chatRowsSignature(rows);
    if (!options.force && signature === activeChatSignature) return;
    activeChatSignature = signature;
    const partner = payload.partner || {};
    const nearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 80;
    chatMessages.innerHTML = `
      <div class="chat-thread-head">
        <strong>${escapeHtml(partner.companyName || partner.username || "Гравець")}</strong>
      </div>
      <div class="chat-message-list">
        ${rows.length ? rows.map((message) => `
          <div class="chat-message ${message.fromId === player?.id ? "is-own" : ""}">
            <p>${escapeHtml(message.text || "")}</p>
            <time>${formatNewsTime(message.createdAt)}</time>
          </div>
        `).join("") : "<p class=\"muted-text\">Почніть діалог першим повідомленням.</p>"}
      </div>
    `;
    if (options.scroll === "bottom" || nearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    if (!silent) chatMessages.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  } finally {
    activeChatLoading = false;
  }
}

function startActiveChatPolling() {
  clearInterval(activeChatTimer);
  activeChatTimer = setInterval(async () => {
    if (!player || !activeChatUserId || messagesModal?.classList.contains("is-hidden")) return;
    await loadChatMessages(activeChatUserId, { silent: true });
    await refreshMessageSummary();
  }, 2500);
}

function stopActiveChatPolling() {
  clearInterval(activeChatTimer);
  activeChatTimer = null;
}

async function sendChatMessage(event) {
  event.preventDefault();
  if (!activeChatUserId || !messageText?.value.trim()) return;
  const text = messageText.value.trim();
  messageText.value = "";
  try {
    await requestJson("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({ toUserId: activeChatUserId, text })
    });
    await loadChatMessages(activeChatUserId, { force: true, scroll: "bottom" });
    await refreshMessageSummary();
  } catch (error) {
    showGameMessage(error.message);
  }
}

function inventoryCount(kind) {
  const bucket = kind === "elevators" ? buildingCountByItem() : activeMachineryMap();
  return Object.values(bucket || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}

async function saveProfile(event) {
  event.preventDefault();
  const restoreButton = setSavingButton(event.submitter, true);
  const profile = {
    companyName: profileCompanyName.value.trim() || state.companyName,
    color: profileColor.value,
    logo: state.logo || ""
  };
  state.companyName = profile.companyName;
  state.color = profile.color;
  renderPlayerHeader();

  try {
    const payload = await requestJson("/api/profile", {
      method: "POST",
      body: JSON.stringify(player?.isGuest ? { farm: state } : { profile })
    });
    if (payload.profile) {
      state.companyName = payload.profile.companyName || state.companyName;
      state.color = payload.profile.color || state.color;
      state.logo = typeof payload.profile.logo === "string" ? payload.profile.logo : state.logo;
    } else if (payload.farm) {
      state = normalizeState(payload.farm);
    }
    if (Number.isFinite(payload.version)) marketVersion = payload.version;
    invalidateVisibleLandCache();
    invalidateGridGeometryCache();
    scheduleVisibleLandRefresh(20);
    updateLandMapSource(visibleCells);
    renderHeader();
    renderSelectedCell();
    closeModals();
    showGameMessage("Профіль компанії збережено.");
    restoreButton();
  } catch (error) {
    restoreButton();
    showGameMessage(error.message);
  }
}

function loadProfileLogo() {
  const file = profileLogo.files?.[0];
  if (!file) return;
  if (file.size > 160000) {
    showGameMessage("Емблема завелика. Оберіть файл до 160 КБ.");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.logo = String(reader.result || "");
    renderProfileForm();
  });
  reader.readAsDataURL(file);
}

async function openAdminPanel() {
  openModal(adminModal);
  adminUsers.innerHTML = "<p>Список учасників відкриємо після натискання на вкладку “Гравці”.</p>";
  try {
    const payload = await requestJson("/api/admin?includeUsers=0");
    applyGameSettings(payload.settings || gameSettings);
    renderAdminSummary(payload.summary || {}, payload.summary?.newestUsers || []);
    adminUsers.dataset.loaded = "0";
    adminUsers.dataset.users = JSON.stringify(payload.users || []);
    adminSettingsLoaded = false;
  } catch (error) {
    adminSummary.innerHTML = "";
    adminUsers.innerHTML = `<p>${error.message}</p>`;
  }
}

function renderAdminSettings(settings) {
  if (!adminSettingsFields) return;
  const economy = settings?.economy || {};
  const upgrades = settings?.upgrades || {};
  const tips = settingTips();
  const fields = [
    ["startingCoins", "Стартові гроші", economy.startingCoins, "economy", "number"],
    ["baseLandPriceMin", "Базова вартість землі", economy.baseLandPriceMin, "economy", "number"],
    ["baseLandPriceSpread", "Розкид ціни", economy.baseLandPriceSpread, "economy", "number"],
    ["baseIncomeMin", "Базовий дохід ділянки / добу", economy.baseIncomeMin, "economy", "number"],
    ["baseIncomeSpread", "Розкид доходу", economy.baseIncomeSpread, "economy", "number"],
    ["nearbyPriceGrowthPercent", "% зростання ціни поруч", economy.nearbyPriceGrowthPercent, "economy", "number"],
    ["nearbyPriceRadius", "Радіус впливу ціни", economy.nearbyPriceRadius, "economy", "number"],
    ["sellRefundPercent", "% виплати від актуальної ринкової вартості при продажі", economy.sellRefundPercent, "economy", "number"],
    ["incomeCycleMinutes", "Інтервал нарахування доходу, хв", economy.incomeCycleMinutes, "economy", "number"],
    ["offlineIncomeCapHours", "Ліміт офлайн-доходу, год", economy.offlineIncomeCapHours, "economy", "number"],
    ["maxVisibleCells", "Глобальний ліміт комірок на екрані", economy.maxVisibleCells, "economy", "number"],
    ["maxOwnedCellsPerViewport", "Ліміт зайнятих комірок API", settings?.map?.maxOwnedCellsPerViewport, "map", "number"],
    ["overviewMaxTerritories", "Ліміт агрегованих територій zoom 5/7", settings?.map?.overviewMaxTerritories, "map", "number"],
    ["claimBatchSize", "Пакет купівлі", economy.claimBatchSize, "economy", "number"],
    ["elevatorMinSelectedCells", "Ділянок для побудови", upgrades.elevatorMinSelectedCells, "upgrades", "number"],
  ];
  const generalFieldsHtml = fields.map(([name, label, value, group, type = "number"]) => {
    const max = name === "maxVisibleCells" || name === "maxOwnedCellsPerViewport" ? MAX_CONFIGURED_VISIBLE_CELLS
      : name === "overviewMaxTerritories" ? 30000
      : null;
    const min = name === "overviewMaxTerritories" ? 500 : null;
    return `
      <label title="${escapeHtml(tips[`${group}.${name}`] || "")}">${label}<input name="${group}.${name}" type="${type}" step="0.01" ${min != null ? `min="${min}"` : ""} ${max != null ? `max="${max}"` : ""} value="${escapeHtml(value == null ? "" : value)}"></label>
    `;
  }).join("");
  adminSettingsFields.innerHTML = `
    <details class="settings-section settings-disclosure wide-field">
      <summary class="settings-disclosure-summary"><span>Налаштування гри</span><small>Основна економіка та ліміти</small></summary>
      <div class="settings-section-body settings-general-grid">
        ${generalFieldsHtml}
        <label class="settings-checkbox" title="Діагностика продуктивності: вимкніть, щоб бачити тільки карту без шару комірок.">
          <input name="economy.drawGrid" type="checkbox" ${economy.drawGrid !== false ? "checked" : ""}>
          <span>Малювати сітку</span>
        </label>
      </div>
    </details>
    ${renderMapZoomEditor(settings?.map || {})}
    ${renderGridDensityEditor(settings?.map || {})}
    ${renderLandLevelEditor(settings?.upgrades?.landLevels || LAND_LEVELS)}
    ${renderAssetEditor("machineryItems", "Техніка", settings?.assets?.machineryItems || [], tips.machineryItems)}
    ${renderAssetEditor("elevatorItems", "Побудови", settings?.assets?.elevatorItems || [], tips.elevatorItems)}
    ${renderClusterEditor(settings?.clusters || [])}
    ${renderStageEditor(settings?.stages || [])}
  `;
}


function renderMapZoomEditor(mapSettings) {
  const presets = normalizeMapZoomPresets(mapSettings);
  return `
    <details class="settings-section settings-disclosure wide-field" data-list="mapZoomPresets">
      <summary class="settings-disclosure-summary"><span>Масштаби карти</span><small>Zoom 5/7 — агрегація, Zoom 10/12 — комірки</small></summary>
      <div class="settings-section-body">
        <p class="muted-text">Display Zoom — число у бейджі. MapLibre zoom — реальний масштаб рушія. Режим detail малює окремі комірки.</p>
        <div class="settings-list compact-list">
          ${presets.map((preset) => `
            <div class="settings-card compact-card map-zoom-settings-card" data-item="mapZoomPresets">
              <input data-field="displayZoom" type="hidden" value="${preset.displayZoom}">
              <strong>Zoom ${preset.displayZoom}</strong>
              <label>MapLibre zoom <input data-field="mapZoom" type="number" min="3" max="16" step="1" inputmode="numeric" value="${preset.mapZoom}"></label>
              <label>Режим
                <select data-field="mode">
                  <option value="overview" ${preset.mode === "overview" ? "selected" : ""}>Огляд (агрегація)</option>
                  <option value="detail" ${preset.mode === "detail" ? "selected" : ""}>Детальні комірки</option>
                </select>
              </label>
              <label class="settings-checkbox"><input data-field="showFreeGrid" type="checkbox" ${preset.showFreeGrid ? "checked" : ""}><span>Сітка вільних комірок</span></label>
              <label>Прозорість сітки <input data-field="freeGridOpacity" type="number" min="0" max="1" step="0.01" inputmode="decimal" value="${preset.freeGridOpacity}"></label>
              <label>Макс. комірок цього zoom <input data-field="maxVisibleCells" type="number" min="500" max="500000" step="1" inputmode="numeric" value="${preset.maxVisibleCells}"></label>
            </div>
          `).join("")}
        </div>
        <p class="muted-text">Рекомендація: Zoom 5/7 — overview без вільної сітки; Zoom 10/12 — detail. Реальні MapLibre zoom мають зростати зліва направо.</p>
      </div>
    </details>
  `;
}

function renderGridDensityEditor(mapSettings) {
  const actual = Number(mapSettings.gridCellCount) || 363019;
  const width = Number(mapSettings.cellWidthDegrees) || 0.018;
  const height = Number(mapSettings.cellHeightDegrees) || 0.012;
  return `
    <details class="settings-section settings-disclosure wide-field grid-density-settings">
      <summary class="settings-disclosure-summary"><span>Кількість комірок на карті України</span><small>${actual.toLocaleString("uk-UA")} комірок</small></summary>
      <div class="settings-section-body">
        <div class="settings-card compact-card">
          <div><span class="muted-text">Поточна фактична кількість</span><strong>${actual.toLocaleString("uk-UA")}</strong></div>
          <label>Цільова кількість <input data-grid-target type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${actual}"></label>
          <div><span class="muted-text">Розмір комірки</span><strong>${width.toFixed(6)}° × ${height.toFixed(6)}°</strong></div>
          <button class="danger-action" type="button" data-rebuild-grid>Перебудувати сітку</button>
        </div>
        <p class="muted-text">Перебудова не додає постійних обчислень у кадр, але більша кількість комірок збільшує навантаження на detail-zoom. Через зміну ID/геометрії ця операція обнуляє всю землю всіх гравців.</p>
      </div>
    </details>
  `;
}

function renderLandLevelEditor(items) {
  return `
    <details class="settings-section settings-disclosure wide-field" data-list="landLevels" title="Рівні інвестицій у добрива: рівень, назва, вартість і % впливу на дохід.">
      <summary class="settings-disclosure-summary"><span>Інвестиції в добрива</span><small>${items.length} рівнів</small></summary>
      <div class="settings-section-body">
        <div class="settings-section-head"><span></span><button class="secondary-action" type="button" data-add-item="landLevels">Додати</button></div>
        <div class="settings-list compact-list">
        ${items.map((item) => `
          <div class="settings-card compact-card" data-item="landLevels">
            <label>Рівень <input data-field="level" type="number" min="1" value="${item.level || 1}"></label>
            <label>Назва <input data-field="name" value="${escapeHtml(item.name || "")}"></label>
            <label>Вартість <input data-field="cost" type="number" min="0" value="${item.cost || 0}"></label>
            <label>Вплив на дохід, % <input data-field="incomeBonusPercent" type="number" min="0" step="0.01" value="${item.incomeBonusPercent || 0}"></label>
            <label class="settings-checkbox"><input data-field="proOnly" type="checkbox" ${item.proOnly ? "checked" : ""}><span>Доступно Pro користувачам</span></label>
            <button class="danger-action" type="button" data-remove-item>Видалити</button>
          </div>
        `).join("")}
        </div>
        <button class="primary-action settings-section-save" type="submit">Зберегти добрива</button>
      </div>
    </details>
  `;
}

function renderIconPreview(icon) {
  return String(icon || "").startsWith("data:image/")
    ? `<img src="${escapeHtml(icon)}" alt="">`
    : `<span>${escapeHtml(icon || "•")}</span>`;
}

function renderPhotoThumbs(photos) {
  const list = Array.isArray(photos) ? photos : parsePhotosValue(photos);
  if (!list.length) return `<span class="muted-text">Фото ще не додано</span>`;
  return list.map((src, index) => `
    <button class="asset-photo-button" type="button" data-preview-src="${escapeHtml(src)}" data-preview-index="${index}" title="Відкрити фото ${index + 1}">
      <img src="${escapeHtml(src)}" alt="Фото ${index + 1}" loading="lazy" decoding="async">
    </button>
  `).join("");
}

function renderAssetGallery(photos) {
  const list = Array.isArray(photos) ? photos : [];
  if (!list.length) return "";
  return `
    <div class="asset-gallery">
      ${list.map((src, index) => `
        <button class="asset-photo-button" type="button" data-preview-src="${escapeHtml(src)}" data-preview-index="${index}" title="Роздивитися фото ${index + 1}">
          <img src="${escapeHtml(src)}" alt="Фото ${index + 1}" loading="lazy" decoding="async">
        </button>
      `).join("")}
    </div>
  `;
}

function renderAssetEditor(key, title, items, tip) {
  const isBuilding = key === "elevatorItems";
  return `
    <details class="settings-section settings-disclosure wide-field" data-list="${key}" title="${escapeHtml(tip || "")}">
      <summary class="settings-disclosure-summary"><span>${title}</span><small>${items.length} позицій</small></summary>
      <div class="settings-section-body">
        <div class="settings-section-head"><span></span><button class="secondary-action" type="button" data-add-item="${key}">Додати</button></div>
        <div class="settings-list">
        ${items.map((item) => `
          <div class="settings-card asset-settings-card" data-item="${key}">
            <div class="icon-preview" data-icon-preview>${renderIconPreview(item.icon)}</div>
            <label>ID <input data-field="id" value="${escapeHtml(item.id || "")}"></label>
            <label>Іконка / emoji <input data-field="icon" value="${escapeHtml(item.icon || "")}"></label>
            <label>Картинка <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-icon-upload></label>
            <label>Назва <input data-field="name" value="${escapeHtml(item.name || "")}"></label>
            <label>Вартість <input data-field="cost" type="number" min="0" value="${item.cost || 0}"></label>
            <label class="settings-checkbox"><input data-field="proOnly" type="checkbox" ${item.proOnly ? "checked" : ""}><span>Доступно Pro користувачам</span></label>
            ${isBuilding
              ? `
                <label>Дохід за добу <input data-field="incomePerDay" type="number" min="0" value="${item.incomePerDay || 0}"></label>
                <label>Мінімум комірок <input data-field="minCells" type="number" min="1" value="${item.minCells || 1}"></label>
                <label>Макс. % землі власника <input data-field="maxOwnerLandPercent" type="number" min="1" max="100" step="0.01" value="${item.maxOwnerLandPercent || 25}"></label>
                <label>Продовження техніки, днів <input data-field="serviceLifeExtensionDays" type="number" min="0" value="${item.serviceLifeExtensionDays || 0}"></label>
              `
              : `
                <label>Бонус доходу землі, % <input data-field="incomeBonusPercent" type="number" min="0" step="0.01" value="${item.incomeBonusPercent || 0}"></label>
                <label>Термін дії, днів <input data-field="durationDays" type="number" min="1" value="${item.durationDays || 80}"></label>
                <label>Виробнича місткість, земель <input data-field="landCapacity" type="number" min="1" value="${item.landCapacity || 25}"></label>
              `}
            <label class="asset-photos-upload">Фото для перегляду (можна обрати кілька одразу) <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple data-photos-upload></label>
            <input type="hidden" data-field="photos" value="${escapeHtml(JSON.stringify(item.photos || []))}">
            <div class="asset-photo-list" data-photo-list>${renderPhotoThumbs(item.photos || [])}</div>
            <button class="secondary-action" type="button" data-clear-photos>Очистити фото</button>
            <button class="danger-action" type="button" data-remove-item>Видалити</button>
          </div>
        `).join("")}
        </div>
        <button class="primary-action settings-section-save" type="submit">Зберегти ${title.toLowerCase()}</button>
      </div>
    </details>
  `;
}

function renderClusterEditor(items) {
  return `
    <details class="settings-section settings-disclosure wide-field" data-list="clusters">
      <summary class="settings-disclosure-summary"><span>Бонуси господарств</span><small>${items.length} правил</small></summary>
      <div class="settings-section-body">
        <div class="settings-section-head"><span></span><button class="secondary-action" type="button" data-add-item="clusters">Додати</button></div>
        <div class="settings-list compact-list">
          ${items.map((item) => `
            <div class="settings-card compact-card" data-item="clusters">
              <label>Від кількості ділянок <input data-field="min" type="number" min="1" value="${item.min || 1}"></label>
              <label>Бонус доходу, % <input data-field="bonusPercent" type="number" min="0" step="0.01" value="${item.bonusPercent || 0}"></label>
              <button class="danger-action" type="button" data-remove-item>Видалити</button>
            </div>
          `).join("")}
        </div>
      </div>
    </details>
  `;
}

function renderStageEditor(items) {
  return `
    <details class="settings-section settings-disclosure wide-field" data-list="stages">
      <summary class="settings-disclosure-summary"><span>Етапи гри</span><small>${items.length} етапів</small></summary>
      <div class="settings-section-body">
        <div class="settings-section-head"><span></span><button class="secondary-action" type="button" data-add-item="stages">Додати</button></div>
        <div class="settings-list">
          ${items.map((item) => `
            <div class="settings-card stage-card" data-item="stages">
              <label>Назва <input data-field="title" value="${escapeHtml(item.title || "")}"></label>
              <label>Мін. землі <input data-field="min" type="number" min="0" value="${item.min || 0}"></label>
              <label>Коефіцієнт ціни землі <input data-field="landPriceMultiplier" type="number" min="0.1" step="0.01" value="${item.landPriceMultiplier || 1}"></label>
              <label>Податок з доходу, % <input data-field="incomeTaxPercent" type="number" min="0" max="100" step="0.01" value="${item.incomeTaxPercent || 0}"></label>
              <label class="wide-field">Опис <input data-field="text" value="${escapeHtml(item.text || "")}"></label>
              <button class="danger-action" type="button" data-remove-item>Видалити</button>
            </div>
          `).join("")}
        </div>
      </div>
    </details>
  `;
}

function settingTips() {
  return {
    "economy.startingCoins": "Скільки грошей отримує новий гравець. Приклад: 11700.",
    "economy.baseLandPriceMin": "Базова ціна вільної ділянки. Якщо розкид ціни 0 і поруч немає зайнятої землі, на карті буде саме ця ціна.",
    "economy.baseLandPriceSpread": "Додатковий випадковий розкид. 0 = усі ділянки стартують з базової ціни; 90 = базова ціна +0..89.",
    "economy.baseIncomeMin": "Базовий дохід ділянки за одну добу. Якщо розкид доходу 0, на карті буде саме це значення.",
    "economy.baseIncomeSpread": "Додатковий випадковий розкид доходу. 0 = однаковий базовий дохід; 18 = +0..17 мон. / добу.",
    "economy.nearbyPriceGrowthPercent": "На скільки % кожна зайнята сусідня ділянка піднімає ціну. Щоб ціна завжди дорівнювала базовій, поставте 0.",
    "economy.nearbyPriceRadius": "Скільки кілець сусідніх ділянок враховувати для ціни. Приклад: 2.",
    "economy.sellRefundPercent": "Яку частину актуальної ринкової вартості землі з урахуванням зайнятих сусідів отримує гравець при продажі.",
    "economy.incomeCycleMinutes": "Інтервал автоматичного нарахування доходу в хвилинах. Для одного нарахування на добу використовуйте 1440.",
    "economy.offlineIncomeCapHours": "Максимальний реальний час офлайн-накопичення доходу. Рекомендовано 168 годин (7 діб).",
    "economy.detailZoomMin": "Застарілий параметр сумісності. Тепер режим кожного масштабу задається у блоці «Масштаби карти».",
    "economy.maxVisibleCells": "Глобальна верхня межа для комірок, які можна намалювати у viewport. Окремий ліміт кожного zoom задається нижче.",
    "map.maxOwnedCellsPerViewport": "Скільки зайнятих комірок сервер може повернути для поточного viewport. Діапазон розширено до 500000, але високі значення збільшують JSON і час обробки; для overview використовується окрема агрегація.",
    "map.overviewMaxTerritories": "Максимальна кількість агрегованих територій у відповіді zoom 5/7. Збільшуйте лише якщо дуже розрізнені володіння обрізаються; надто велике значення збільшує навантаження на MapLibre.",
    "economy.claimBatchSize": "Скільки ділянок купується одним запитом.",
    "upgrades.landMaxLevel": "Максимальний рівень інвестицій у добрива.",
    "upgrades.elevatorMinSelectedCells": "Скільки ваших ділянок треба виділити, щоб побудувати об'єкт.",
    machineryItems: "Налаштування техніки: іконка, назва, вартість, бонус до доходу земель, термін дії, ліміт активних одиниць і фото для перегляду під час купівлі.",
    elevatorItems: "Налаштування побудов: іконка, назва, вартість, дохід за добу, мінімум ділянок, максимальна частка від землі власника, продовження строку техніки і фото."
  };
}

function settingsFromForm(form) {
  const next = JSON.parse(JSON.stringify(gameSettings || {}));
  const data = new FormData(form);
  data.forEach((value, key) => {
    const [group, name] = key.split(".");
    if (!group || !name) return;
    if (key === "economy.drawGrid") return;
    if (!next[group]) next[group] = {};
    next[group][name] = Number(value);
  });
  next.economy = next.economy || {};
  next.economy.drawGrid = form.querySelector('[name="economy.drawGrid"]')?.checked !== false;
  next.map = next.map || {};
  next.map.zoomPresets = collectSettingsCards("mapZoomPresets").map((item) => ({
    displayZoom: Number(item.displayZoom),
    mapZoom: Number(item.mapZoom),
    mode: item.mode === "detail" ? "detail" : "overview",
    showFreeGrid: Boolean(item.showFreeGrid),
    freeGridOpacity: Math.max(0, Math.min(1, Number.parseFloat(item.freeGridOpacity) || 0)),
    maxVisibleCells: Math.max(500, Math.floor(Number(item.maxVisibleCells) || 500))
  }));
  next.assets = next.assets || {};
  next.upgrades = next.upgrades || {};
  next.upgrades.landLevels = collectSettingsCards("landLevels").map((item) => ({
    level: Number(item.level) || 1,
    name: item.name || "Добрива",
    cost: Number(item.cost) || 0,
    incomeBonusPercent: Number(item.incomeBonusPercent) || 0
    ,proOnly: Boolean(item.proOnly)
  })).sort((a, b) => a.level - b.level);
  next.upgrades.landMaxLevel = Math.max(...next.upgrades.landLevels.map((item) => item.level), 1);
  next.assets.machineryItems = collectSettingsCards("machineryItems").map(normalizeAssetCard);
  next.assets.elevatorItems = collectSettingsCards("elevatorItems").map(normalizeAssetCard);
  next.clusters = collectSettingsCards("clusters").map((item) => ({
    min: Number(item.min) || 1,
    bonusPercent: Number(item.bonusPercent) || 0
  }));
  next.stages = collectSettingsCards("stages").map((item) => ({
    title: item.title || "Етап",
    min: Number(item.min) || 0,
    landPriceMultiplier: Math.max(0.1, Number(item.landPriceMultiplier) || 1),
    incomeTaxPercent: Math.max(0, Math.min(100, Number(item.incomeTaxPercent) || 0)),
    text: item.text || ""
  }));
  next.rivals = [];
  return next;
}

function collectSettingsCards(listName) {
  return [...adminSettingsFields.querySelectorAll(`[data-item="${listName}"]`)].map((card) => {
    const row = {};
    card.querySelectorAll("[data-field]").forEach((input) => {
      row[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
    });
    return row;
  });
}

function parsePhotosValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeAssetCard(item) {
  return {
    id: item.id || `asset-${Date.now()}`,
    icon: item.icon || "•",
    name: item.name || "Актив",
    cost: Number(item.cost) || 0,
    incomeBonusPercent: Number(item.incomeBonusPercent) || 0,
    durationDays: Math.max(1, Math.floor(Number(item.durationDays) || 80)),
    incomePerDay: Number(item.incomePerDay) || 0,
    minCells: Math.max(1, Math.floor(Number(item.minCells) || 1)),
    maxOwnerLandPercent: Math.min(100, Math.max(1, Number(item.maxOwnerLandPercent) || 25)),
    serviceLifeExtensionDays: Math.max(0, Math.floor(Number(item.serviceLifeExtensionDays) || 0)),
    landCapacity: Math.max(1, Math.floor(Number(item.landCapacity) || 25)),
    proOnly: Boolean(item.proOnly),
    photos: parsePhotosValue(item.photos).slice(0, 8)
  };
}

function renderAdminSummary(summary, users = []) {
  const occupiedLand = Number.isFinite(summary.occupiedLand) ? summary.occupiedLand : marketOwnedCellCount;
  const totalLand = totalPlayableLandCount();
  const freeLand = Number.isFinite(totalLand) ? Math.max(0, totalLand - occupiedLand) : null;
  renderAdminStats(summary, users);
  adminSummary.innerHTML = [
    ["Учасників", Number.isFinite(summary.users) ? summary.users : 0],
    ["Адмінів", Number.isFinite(summary.admins) ? summary.admins : 0],
    ["Зайнято на карті", occupiedLand],
    ["Вільно на карті України", freeLand == null ? "рахується після карти" : freeLand],
    ["Грошей у грі", money(summary.totalCash || 0)]
  ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
}

function renderAdminStats(summary, users = []) {
  if (!adminStats) return;
  const newestUsers = Array.isArray(summary?.newestUsers) && summary.newestUsers.length
    ? summary.newestUsers
    : [...(Array.isArray(users) ? users : [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 40);
  const summaryHtml = [
    ["Онлайн зараз", Number.isFinite(summary.onlineUsers) ? summary.onlineUsers : 0],
    ["Усього зареєстровано", Number.isFinite(summary.users) ? summary.users : 0],
    ["Зареєстровано сьогодні", Number.isFinite(summary.registeredToday) ? summary.registeredToday : 0],
    ["Зареєстровано за 30 днів", Number.isFinite(summary.registeredLast30Days) ? summary.registeredLast30Days : 0]
  ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
  adminStats.innerHTML = `
    <div class="admin-summary-grid">${summaryHtml}</div>
    <section class="admin-new-users">
      <div class="admin-section-head">
        <button class="secondary-action" type="button">Список нових гравців</button>
        <span>${newestUsers.length} останніх</span>
      </div>
      <div class="admin-new-users-list">
        ${newestUsers.length ? newestUsers.map((user) => `
          <article class="admin-new-user" data-user-id="${escapeHtml(user.id)}">
            <div>
              <strong>${escapeHtml(user.username || "Гравець")}</strong>
              <span>${escapeHtml(user.companyName || "")}</span>
              <small>${user.createdAt ? new Date(user.createdAt).toLocaleString("uk-UA") : "дата невідома"} · ${user.landCount || 0} зем. · ${money(user.coins || 0)}</small>
            </div>
            <div class="admin-new-user-actions">
              <button class="secondary-action" type="button" data-admin-message-player="${escapeHtml(user.id)}">Написати</button>
              <button class="secondary-action" type="button" data-player-stats="${escapeHtml(user.id)}">Статистика</button>
              <button class="secondary-action" type="button" data-admin-edit-player="${escapeHtml(user.id)}">Редагувати</button>
            </div>
          </article>
        `).join("") : "<p>Нових гравців поки немає.</p>"}
      </div>
    </section>
  `;
}

function totalPlayableLandCount() {
  const configured = Number(gameSettings?.map?.gridCellCount);
  return Number.isFinite(configured) && configured > 0 ? configured : 363019;
}

function renderAdminUsers(users) {
  const machineryItems = gameSettings?.assets?.machineryItems || [];
  const elevatorItems = gameSettings?.assets?.elevatorItems || [];
  if (adminUsers) adminUsers.dataset.loaded = "1";
  adminUsers.innerHTML = users.map((user) => `
    <form class="admin-user" data-user-id="${user.id}">
      <details>
      <summary class="admin-user-title"><strong>${escapeHtml(user.username)}${user.isPro ? " 👑" : ""}</strong><span>${user.landCount || 0} зем. · ${money(user.coins || 0)}</span></summary>
      <div class="admin-user-body">
      <label>Логін <input name="username" value="${escapeHtml(user.username || "")}" ${user.username === "Admin" ? "readonly" : ""}></label>
      <label>Компанія <input name="companyName" value="${escapeHtml(user.companyName || "")}"></label>
      <label>Гроші <input name="coins" type="number" min="0" value="${user.coins || 0}"></label>
      <label>День <input name="currentDay" type="number" min="1" value="${user.currentDay || 1}"></label>
      <label>Колір <input name="color" type="color" value="${user.color || "#35c982"}"></label>
      <label class="inline-check"><input name="isAdmin" type="checkbox" ${user.isAdmin ? "checked" : ""}> Адмін</label>
      <label class="inline-check"><input name="isPro" type="checkbox" ${user.isPro ? "checked" : ""}> Pro гравець</label>
      <div class="admin-user-stats">
        <span>Інвестиції: ${money(user.score || 0)}</span>
        <span>Дохід: ${money(user.income || 0)} / добу</span>
        <span>Зароблено: ${money(user.earned || 0)}</span>
        <span>Куплено: ${user.purchased || 0}</span>
        <span>Покращень: ${user.upgraded || 0}</span>
        <span>Техніка: ${inventoryMapCount(user.inventory?.machinery)}</span>
        <span>Побудови: ${inventoryMapCount(user.buildingInventory)}</span>
      </div>
      <div class="admin-inventory-editor">
        <strong>Інвентар гравця</strong>
        ${renderAdminInventoryInputs("machinery", "Техніка", machineryItems, user.inventory?.machinery || {})}
        ${renderAdminBuildingSummary("Побудови на ділянках", elevatorItems, user.buildingInventory || {})}
      </div>
      <div class="admin-user-actions">
        <button class="secondary-action" type="submit">Зберегти</button>
        <button class="secondary-action" type="button" data-player-stats="${user.id}">Статистика гравця</button>
        <button class="danger-action" type="submit" name="resetAll" value="1">Обнулити всі дані</button>
        ${user.username === "Admin" ? "" : `<button class="danger-action" type="button" data-delete-user="${user.id}">Видалити</button>`}
      </div>
      </details>
    </form>
  `).join("");
}

function inventoryMapCount(map) {
  return Object.values(map || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}

function renderAdminInventoryInputs(kind, title, items, inventoryMap) {
  return `
    <div>
      <span>${title}</span>
      <div class="admin-inventory-grid">
        ${items.map((item) => `
          <label>
            <span class="asset-icon">${renderIconPreview(item.icon)}</span>
            <span>${escapeHtml(item.name)}</span>
            <input name="inventory.${kind}.${escapeHtml(item.id)}" type="number" min="0" value="${inventoryMap[item.id] || 0}">
          </label>
        `).join("") || "<p>Немає налаштованих позицій.</p>"}
      </div>
    </div>
  `;
}

function renderAdminBuildingSummary(title, items, inventoryMap) {
  const rows = items
    .map((item) => ({ item, qty: Number(inventoryMap[item.id]) || 0 }))
    .filter((row) => row.qty > 0);
  return `
    <div>
      <span>${title}</span>
      <div class="admin-inventory-grid">
        ${rows.map(({ item, qty }) => `
          <label>
            <span class="asset-icon">${renderIconPreview(item.icon)}</span>
            <span>${escapeHtml(item.name)}</span>
            <strong>${qty} шт.</strong>
          </label>
        `).join("") || "<p>Побудов на ділянках немає.</p>"}
      </div>
    </div>
  `;
}

async function clearEvents(userId = "") {
  if (!confirm(userId ? "Очистити події цього гравця?" : "Очистити події всіх гравців?")) return;
  try {
    const payload = await requestJson("/api/admin/clear-events", {
      method: "POST",
      body: JSON.stringify(userId ? { id: userId } : {})
    });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (!userId || userId === player?.id) {
      state = normalizeState(payload.farm || { ...state, events: [] });
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    render();
    showGameMessage("Журнал очищено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function deleteUser(userId) {
  if (!confirm("Видалити гравця разом із його землею на карті?")) return;
  try {
    const payload = await requestJson("/api/admin/delete-user", {
      method: "POST",
      body: JSON.stringify({ id: userId })
    });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    await refreshGlobalMarket();
    await refreshVisibleLand();
    scheduleGridUpdate();
    refreshLeaderboard();
    showGameMessage("Гравця видалено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function showPlayerStats(userId) {
  adminPlayerStats.innerHTML = "<p>Завантажуємо статистику...</p>";
  try {
    const payload = await requestJson(`/api/admin/player?id=${encodeURIComponent(userId)}`);
    const ledger = payload.ledger || [];
    const land = payload.land || [];
    adminPlayerStats.innerHTML = `
      <h4>Статистика гравця: ${escapeHtml(payload.user?.username || "")}</h4>
      <div class="admin-summary">
        <div><span>Компанія</span><strong>${escapeHtml(payload.user?.companyName || "")}</strong></div>
        <div><span>Баланс</span><strong>${money(payload.user?.coins || 0)}</strong></div>
        <div><span>Земля</span><strong>${payload.user?.landCount || 0}</strong></div>
        <div><span>Інвестиції</span><strong>${money(payload.user?.score || 0)}</strong></div>
      </div>
      <h4>Усі нарахування і витрати</h4>
      <div class="ledger-list">
        ${ledger.length ? ledger.map((item) => `
          <div>
            <strong>${escapeHtml(item.text)}</strong>
            <span>${new Date(item.at).toLocaleString("uk-UA")} · ${item.amount >= 0 ? "+" : ""}${money(item.amount || 0)} · баланс ${item.balance === null ? "?" : money(item.balance)}</span>
          </div>
        `).join("") : "<p>Журнал дій поки порожній.</p>"}
      </div>
      <h4>Земельні ділянки</h4>
      <div class="ledger-list compact">
        ${land.length ? land.map((cell) => `<div><strong>${cell.id}</strong><span>ціна ${money(cell.price || 0)} · рівень добрив ${cell.level || 1}</span></div>`).join("") : "<p>Землі немає.</p>"}
      </div>
    `;
  } catch (error) {
    adminPlayerStats.innerHTML = `<p>${error.message}</p>`;
  }
}

function activateAdminTab(tab) {
  activateAdminTabDom(tab);
  if (tab === "players") loadAdminUsersIfNeeded();
  if (tab === "settings") loadAdminSettingsIfNeeded();
}

async function loadAdminSettingsIfNeeded() {
  if (!adminSettingsForm || adminSettingsLoaded) return;
  adminSettingsLoaded = true;
  adminSettingsFields.innerHTML = "<p>Завантажуємо налаштування...</p>";
  renderAdminSettings(gameSettings);
}

async function loadAdminUsersIfNeeded() {
  if (!adminUsers || adminUsers.dataset.loaded === "1") return;
  adminUsers.dataset.loaded = "loading";
  adminUsers.innerHTML = "<p>Завантажуємо список гравців...</p>";
  try {
    const payload = await requestJson("/api/admin?includeUsers=1");
    const users = payload.users || [];
    adminUsers.dataset.users = JSON.stringify(users);
    renderAdminUsers(users);
    adminUsers.dataset.loaded = "1";
  } catch (error) {
    adminUsers.dataset.loaded = "0";
    adminUsers.innerHTML = `<p>${error.message}</p>`;
  }
}

function focusAdminUser(userId) {
  activateAdminTab("players");
  const form = adminUsers?.querySelector(`[data-user-id="${CSS.escape(userId)}"]`);
  if (!form) return;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  form.classList.add("is-highlighted");
  window.setTimeout(() => form.classList.remove("is-highlighted"), 1600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function saveAdminUser(event) {
  const form = event.target.closest(".admin-user");
  if (!form) return;
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form));
  body.id = form.dataset.userId;
  body.coins = Number(body.coins);
  body.currentDay = Number(body.currentDay);
  body.isAdmin = form.elements.isAdmin.checked;
  body.isPro = form.elements.isPro.checked;
  body.resetLand = event.submitter?.name === "resetLand";
  body.resetAll = event.submitter?.name === "resetAll";
  body.inventory = { machinery: {}, elevators: {} };
  new FormData(form).forEach((value, key) => {
    const parts = key.split(".");
    if (parts[0] !== "inventory" || !parts[1] || !parts[2]) return;
    body.inventory[parts[1]][parts.slice(2).join(".")] = Math.max(0, Math.floor(Number(value) || 0));
  });
  if (body.resetAll && !confirm("Обнулити всі дані цього учасника до стану нового гравця?")) return;
  const restoreButton = setSavingButton(event.submitter, true);
  try {
    const payload = await requestJson("/api/admin/user", { method: "POST", body: JSON.stringify(body) });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (body.id === player?.id) {
      player.isPro = body.isPro;
      state = normalizeState(payload.farm || state);
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    if (body.resetLand || body.resetAll) await refreshGlobalMarket();
    scheduleGridUpdate();
    refreshLeaderboard();
    showGameMessage("Учасника оновлено.");
    restoreButton();
  } catch (error) {
    restoreButton();
    showGameMessage(error.message);
  }
}

async function saveAdminSettings(event) {
  event.preventDefault();
  if (pendingSettingsImages > 0) {
    showGameMessage("Зачекайте, фото ще обробляються. Після повідомлення про додавання натисніть “Зберегти” ще раз.");
    return;
  }
  const currentZoomBeforeSave = map ? snapZoom(map.getZoom()) : null;
  const restoreButton = setSavingButton(event.submitter, true);
  try {
    const payload = await requestJson("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ settings: settingsFromForm(adminSettingsForm) })
    });
    applyGameSettings(payload.settings);
    applyZoomConfigToLiveMap(currentZoomBeforeSave);
    renderAdminSettings(gameSettings);
    renderAdminSummary(payload.summary || {}, payload.users || []);
    scheduleGridUpdate();
    render();
    showGameMessage("Налаштування гри збережено.");
    restoreButton();
  } catch (error) {
    restoreButton();
    showGameMessage(error.message);
  }
}

function defaultSettingsItem(listName) {
  const stamp = Date.now().toString(36);
  const items = {
    machineryItems: { id: `tractor-${stamp}`, icon: "🚜", name: "Новий трактор", cost: 3600, incomeBonusPercent: 8, durationDays: 80, minCells: 10, landCapacity: 25, photos: [] },
    elevatorItems: { id: `elevator-${stamp}`, icon: "🏗", name: "Нова побудова", cost: 9000, incomePerDay: 900, minCells: 3, maxOwnerLandPercent: 20, serviceLifeExtensionDays: 0, photos: [] },
    landLevels: { level: LAND_LEVELS.length + 1, name: "Новий рівень добрив", cost: 100, incomeBonusPercent: 10 },
    clusters: { min: 10, bonusPercent: 5 },
    stages: { title: "Новий етап", min: 0, landPriceMultiplier: 1, incomeTaxPercent: 0, text: "Опис етапу" },
  };
  return items[listName] || {};
}

function addSettingsItem(listName) {
  const next = settingsFromForm(adminSettingsForm);
  if (listName === "machineryItems" || listName === "elevatorItems") {
    next.assets = next.assets || {};
    next.assets[listName] = [...(next.assets[listName] || []), defaultSettingsItem(listName)];
  } else if (listName === "landLevels") {
    next.upgrades = next.upgrades || {};
    next.upgrades.landLevels = [...(next.upgrades.landLevels || LAND_LEVELS), defaultSettingsItem(listName)];
  } else {
    next[listName] = [...(next[listName] || []), defaultSettingsItem(listName)];
  }
  applyGameSettings(next);
  renderAdminSettings(gameSettings);
}

async function rebuildPlayableGrid() {
  const targetInput = adminSettingsFields?.querySelector("[data-grid-target]");
  const targetCells = Math.floor(Number(String(targetInput?.value || "").replace(/[^\d]/g, "")) || 0);
  if (targetInput) targetInput.value = String(targetCells || "");
  if (targetCells < 50000 || targetCells > 1000000) {
    showGameMessage("Вкажіть від 50 000 до 1 000 000 комірок.");
    return;
  }
  const current = Number(gameSettings?.map?.gridCellCount) || 363019;
  if (!confirm(`Перебудувати сітку з приблизно ${current.toLocaleString("uk-UA")} до ${targetCells.toLocaleString("uk-UA")} комірок? УСЯ земля всіх гравців буде обнулена.`)) return;
  if (!confirm("Це незворотна зміна геометрії сітки. Підтвердити обнулення всієї землі та перебудову?")) return;
  const button = adminSettingsFields?.querySelector("[data-rebuild-grid]");
  const restore = setSavingButton(button, true);
  try {
    const payload = await requestJson("/api/admin/rebuild-grid", {
      method: "POST",
      body: JSON.stringify({ targetCells, confirm: "RESET_LAND" })
    });
    applyGameSettings(payload.settings);
    if (payload.farm) {
      state = normalizeState(payload.farm);
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    selectedCellIds = new Set();
    selectedCellId = null;
    visibleLandState = { version: 0, owners: {}, cells: {} };
    playableGridRows = null;
    await loadPlayableGridMask();
    applyZoomConfigToLiveMap(map ? snapZoom(map.getZoom()) : null);
    renderAdminSettings(gameSettings);
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    render();
    showGameMessage(`Сітку перебудовано: ${Number(payload.grid?.count || 0).toLocaleString("uk-UA")} комірок. Землі обнулено.`);
  } catch (error) {
    showGameMessage(error.message);
  } finally {
    restore?.();
  }
}

function handleSettingsClick(event) {
  const rebuildButton = event.target.closest("[data-rebuild-grid]");
  if (rebuildButton) {
    rebuildPlayableGrid();
    return;
  }
  const addButton = event.target.closest("[data-add-item]");
  if (addButton) {
    addSettingsItem(addButton.dataset.addItem);
    return;
  }
  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    removeButton.closest(".settings-card")?.remove();
    return;
  }
  const clearPhotosButton = event.target.closest("[data-clear-photos]");
  if (clearPhotosButton) {
    const card = clearPhotosButton.closest(".settings-card");
    const photosInput = card?.querySelector("[data-field='photos']");
    const photoList = card?.querySelector("[data-photo-list]");
    if (photosInput) photosInput.value = "[]";
    if (photoList) photoList.innerHTML = renderPhotoThumbs([]);
  }
}

function handleSettingsInput(event) {
  const input = event.target.closest("[data-field='icon']");
  if (!input) return;
  const card = input.closest(".settings-card");
  const preview = card?.querySelector("[data-icon-preview]");
  if (preview) preview.innerHTML = renderIconPreview(input.value);
}

function handleSettingsFile(event) {
  const iconInputElement = event.target.closest("[data-icon-upload]");
  const photosInputElement = event.target.closest("[data-photos-upload]");
  if (iconInputElement) {
    loadSettingsIcon(iconInputElement);
    return;
  }
  if (photosInputElement) {
    loadSettingsPhotos(photosInputElement);
  }
}

function loadSettingsIcon(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  const card = input.closest(".settings-card");
  const iconInput = card?.querySelector("[data-field='icon']");
  const preview = card?.querySelector("[data-icon-preview]");
  showGameMessage("Готуємо картинку...");
  pendingSettingsImages += 1;
  encodeImageFile(file, { maxBytes: 170000, maxSide: 520 })
    .then((value) => {
      if (iconInput) iconInput.value = value;
      if (preview) preview.innerHTML = renderIconPreview(value);
      showGameMessage("Картинку додано. Натисніть “Зберегти”, щоб записати налаштування.");
    })
    .catch((error) => showGameMessage(error.message))
    .finally(() => {
      pendingSettingsImages = Math.max(0, pendingSettingsImages - 1);
    });
}

function loadSettingsPhotos(input) {
  const files = [...(input.files || [])].slice(0, 8);
  if (!files.length) return;
  const card = input.closest(".settings-card");
  const photosInput = card?.querySelector("[data-field='photos']");
  const photoList = card?.querySelector("[data-photo-list]");
  const existing = parsePhotosValue(photosInput?.value);
  showGameMessage("Готуємо фото...");
  pendingSettingsImages += 1;
  Promise.all(files.map((file) => encodeImageFile(file, { maxBytes: 170000, maxSide: 900 }))).then((nextPhotos) => {
    const photos = [...existing, ...nextPhotos].filter(Boolean).slice(0, 8);
    if (photosInput) photosInput.value = JSON.stringify(photos);
    if (photoList) photoList.innerHTML = renderPhotoThumbs(photos);
    input.value = "";
    showGameMessage(`Фото додано: ${nextPhotos.length}. Натисніть “Зберегти”, щоб записати налаштування.`);
  }).catch((error) => showGameMessage(error.message))
    .finally(() => {
      pendingSettingsImages = Math.max(0, pendingSettingsImages - 1);
    });
}

function encodeImageFile(file, options = {}) {
  const maxBytes = options.maxBytes || 170000;
  const maxSide = options.maxSide || 900;
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Оберіть файл зображення."));
  }
  if (file.type === "image/svg+xml") {
    if (file.size > maxBytes) return Promise.reject(new Error("SVG завеликий. Оберіть менший файл."));
    return readFileAsDataUrl(file);
  }
  return readFileAsDataUrl(file).then((src) => compressImageDataUrl(src, maxBytes, maxSide));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Не вдалося прочитати файл.")));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(src, maxBytes, maxSide) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let result = canvas.toDataURL("image/webp", quality);
      while (dataUrlBytes(result) > maxBytes && quality > 0.36) {
        quality -= 0.08;
        result = canvas.toDataURL("image/webp", quality);
      }
      if (dataUrlBytes(result) > maxBytes) {
        reject(new Error("Фото занадто велике навіть після стискання. Спробуйте менше зображення."));
        return;
      }
      resolve(result);
    });
    image.addEventListener("error", () => reject(new Error("Не вдалося обробити зображення.")));
    image.src = src;
  });
}

function dataUrlBytes(value) {
  return Math.ceil(String(value || "").length * 0.75);
}

async function resetAllLand() {
  if (!confirm("Обнулити всі землі всіх учасників?")) return;
  try {
    const payload = await requestJson("/api/admin/reset-land", { method: "POST", body: "{}" });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    globalMarketState = { version: 0, resetAt: payload.farm?.lastAdminResetAt || null, stats: { ownedCells: 0 } };
    marketVersion = 0;
    marketOwnedCellCount = 0;
    visibleLandState = { version: 0, owners: {}, cells: {} };
    overviewTerritories = [];
    invalidateGridGeometryCache();
    state = normalizeState(payload.farm || { ...state, land: {} });
    landMembershipRevision += 1;
    farmDerivedStatsCache = null;
    selectedCellIds = new Set();
    selectedCellId = null;
    cellLayerById = new Map();
    scheduleVisibleLandRefresh(true);
    refreshLeaderboard();
    renderHeader();
    showGameMessage("Всі землі обнулено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function resetAllMoney() {
  if (!confirm("Обнулити гроші всіх учасників до стартового балансу?")) return;
  try {
    const payload = await requestJson("/api/admin/reset-money", { method: "POST", body: "{}" });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (payload.farm) {
      state = normalizeState(payload.farm);
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    refreshLeaderboard();
    render();
    showGameMessage("Гроші всіх учасників обнулено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function resetAllMachinery() {
  if (!confirm("Обнулити техніку всіх учасників?")) return;
  try {
    const payload = await requestJson("/api/admin/reset-machinery", { method: "POST", body: "{}" });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (payload.farm) {
      state = normalizeState(payload.farm);
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    refreshLeaderboard();
    render();
    showGameMessage("Техніку всіх учасників обнулено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function resetAllAssets() {
  if (!confirm("Обнулити всю власність і активи всіх учасників? Гроші залишаться.")) return;
  try {
    const payload = await requestJson("/api/admin/reset-assets", { method: "POST", body: "{}" });
    renderAdminSummary(payload.summary || {}, payload.users || []);
    renderAdminUsers(payload.users || []);
    globalMarketState = { version: 0, resetAt: payload.farm?.lastAdminResetAt || null, stats: { ownedCells: 0 } };
    marketVersion = 0;
    marketOwnedCellCount = 0;
    visibleLandState = { version: 0, owners: {}, cells: {} };
    overviewTerritories = [];
    invalidateGridGeometryCache();
    if (payload.farm) {
      state = normalizeState(payload.farm);
      landMembershipRevision += 1;
      farmDerivedStatsCache = null;
    }
    selectedCellIds = new Set();
    selectedCellId = null;
    scheduleVisibleLandRefresh(true);
    refreshLeaderboard();
    renderHeader();
    showGameMessage("Власність і активи всіх учасників обнулено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.authTab;
    document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("is-active", item === tab));
    loginForm.classList.toggle("is-hidden", mode !== "login");
    registerForm.classList.toggle("is-hidden", mode !== "register");
    recoverForm?.classList.add("is-hidden");
    resetForm?.classList.add("is-hidden");
    showAuthMessage("");
  });
});

bindEvent(forgotPasswordLink, "click", () => {
  document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.remove("is-active"));
  loginForm?.classList.add("is-hidden");
  registerForm?.classList.add("is-hidden");
  resetForm?.classList.add("is-hidden");
  recoverForm?.classList.remove("is-hidden");
  showAuthMessage("");
});

if (new URLSearchParams(window.location.search).has("reset")) {
  document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.remove("is-active"));
  loginForm?.classList.add("is-hidden");
  registerForm?.classList.add("is-hidden");
  recoverForm?.classList.add("is-hidden");
  resetForm?.classList.remove("is-hidden");
  showAuthMessage("Введіть новий пароль для акаунта.");
}

bindEvent(loginForm, "submit", async (event) => {
  event.preventDefault();
  showAuthMessage("Входимо...");
  try {
    const payload = await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
    });
    startGame(payload.player, payload.farm);
  } catch (error) {
    showAuthMessage(error.message);
  }
});

bindEvent(registerForm, "submit", async (event) => {
  event.preventDefault();
  showAuthMessage("Створюємо компанію...");
  try {
    const payload = await requestJson("/api/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(registerForm)))
    });
    startGame(payload.player, payload.farm);
  } catch (error) {
    showAuthMessage(error.message);
  }
});

bindEvent(recoverForm, "submit", async (event) => {
  event.preventDefault();
  showAuthMessage("Готуємо відновлення...");
  try {
    const payload = await requestJson("/api/password-reset/request", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(recoverForm)))
    });
    showAuthMessage(payload.message || "Якщо email існує, інструкція для відновлення буде надіслана.");
  } catch (error) {
    showAuthMessage(error.message);
  }
});

bindEvent(resetForm, "submit", async (event) => {
  event.preventDefault();
  const token = new URLSearchParams(window.location.search).get("reset");
  if (!token) {
    showAuthMessage("Посилання відновлення не містить токен.");
    return;
  }
  try {
    const payload = await requestJson("/api/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, ...Object.fromEntries(new FormData(resetForm)) })
    });
    showAuthMessage(payload.message || "Пароль змінено. Увійдіть з новим паролем.");
    resetForm.classList.add("is-hidden");
    loginForm.classList.remove("is-hidden");
  } catch (error) {
    showAuthMessage(error.message);
  }
});

bindEvent(buyButton, "click", buySelectedCell);
bindEvent(contactOwnerButton, "click", () => {
  const ownerId = ownerIdForCell(selectedCellId);
  if (ownerId) openChat(ownerId);
});
bindEvent(upgradeButton, "click", upgradeSelectedCell);
bindEvent(buildingButton, "click", buildOnSelectedCell);
bindEvent(machineryButton, "click", buyMachinery);
bindEvent(sellButton, "click", sellSelectedLand);
bindEvent(closeSelectionPopup, "click", () => {
  selectionPopupDismissed = true;
  setClusterSelectionMode(false);
  hideSelectionPopup();
});
bindEvent(closeCellInfoButton, "click", hideCellInfoPanel);
bindEvent(detailInfoButton, "click", showCellInfoPanel);
bindEvent(clusterSelectButton, "click", () => setClusterSelectionMode(!clusterSelectionMode));
bindEvent(newsButton, "click", openNewsPanel);
bindEvent(returnToNewsButton, "click", returnToNews);
bindEvent(cellDetails, "click", (event) => {
  const ownerButton = event.target.closest("[data-owner-id]");
  if (ownerButton) showOwnerInfo(ownerButton.dataset.ownerId);
});
bindEvent(leaderboard, "click", (event) => {
  const row = event.target.closest("[data-leader-player]");
  if (row?.dataset.leaderPlayer) showOwnerInfo(row.dataset.leaderPlayer);
});
bindEvent(ownerInfo, "click", (event) => {
  const contact = event.target.closest("[data-contact-player]");
  if (contact?.dataset.contactPlayer) openChat(contact.dataset.contactPlayer);
});
bindEvent(profileButton, "click", () => {
  renderProfileForm();
  openModal(profileModal);
});
bindEvent(offerBuyoutButton, "click", openBuyoutOffer);
bindEvent(offerAmount, "input", () => {
  if (offerBalance) offerBalance.textContent = `Баланс: ${money(state.coins)} · Зарезервовано після відправлення: ${money(offerAmount.value)} · Доступно: ${money(Math.max(0, state.coins - Number(offerAmount.value || 0)))}`;
});
bindEvent(offerForm, "submit", async (event) => {
  event.preventDefault();
  const cellIds = JSON.parse(offerModal?.dataset.cellIds || "[]");
  const amount = Math.floor(Number(offerAmount?.value) || 0);
  if (!cellIds.length || amount < 1 || !confirm(`Ви пропонуєте ${money(amount)} за ${cellIds.length} земель.`)) return;
  try {
    const payload = await requestJson("/api/offers", { method: "POST", body: JSON.stringify({ cellIds, amount }) });
    state.coins = payload.coins;
    closeModal(offerModal);
    render();
    showGameMessage("Пропозицію відправлено. Сума зарезервована.");
  } catch (error) { showGameMessage(error.message); }
});
bindEvent(dossierButton, "click", () => {
  renderDossier();
  activateDossierTab("overview");
  openModal(dossierModal);
});
bindEvent(dossierModal, "click", (event) => {
  const tab = event.target.closest("[data-dossier-tab]");
  if (tab?.dataset.dossierTab) activateDossierTab(tab.dataset.dossierTab);
});
bindEvent(helpButton, "click", () => {
  renderHelp();
  openModal(helpModal);
});
bindEvent(messagesButton, "click", openMessagesPanel);
bindEvent(logoutButton, "click", logoutPlayer);
bindEvent(chatList, "click", (event) => {
  const item = event.target.closest("[data-chat-user]");
  if (item?.dataset.chatUser) openChat(item.dataset.chatUser);
});
bindEvent(messageForm, "submit", sendChatMessage);
bindEvent(newsList, "click", (event) => {
  const item = event.target.closest("[data-news-cell]");
  if (item?.dataset.newsCell) focusNewsTarget(item.dataset.newsCell);
});
bindEvent(profileForm, "submit", saveProfile);
bindEvent(profileLogo, "change", loadProfileLogo);
bindEvent(adminStats, "click", (event) => {
  const messageButton = event.target.closest("[data-admin-message-player]");
  if (messageButton?.dataset.adminMessagePlayer) {
    openChat(messageButton.dataset.adminMessagePlayer);
    return;
  }
  const statsButton = event.target.closest("[data-player-stats]");
  if (statsButton?.dataset.playerStats) {
    activateAdminTab("players");
    showPlayerStats(statsButton.dataset.playerStats);
    return;
  }
  const editButton = event.target.closest("[data-admin-edit-player]");
  if (editButton?.dataset.adminEditPlayer) focusAdminUser(editButton.dataset.adminEditPlayer);
});
bindEvent(adminUsers, "submit", saveAdminUser);
bindEvent(adminUsers, "click", (event) => {
  const button = event.target.closest("[data-player-stats]");
  if (button) showPlayerStats(button.dataset.playerStats);
  const clearButton = event.target.closest("[data-clear-events]");
  if (clearButton) clearEvents(clearButton.dataset.clearEvents);
  const deleteButton = event.target.closest("[data-delete-user]");
  if (deleteButton) deleteUser(deleteButton.dataset.deleteUser);
});
bindEvent(adminSettingsForm, "submit", saveAdminSettings);
bindEvent(adminSettingsFields, "click", handleSettingsClick);
bindEvent(adminSettingsFields, "input", handleSettingsInput);
bindEvent(adminSettingsFields, "change", handleSettingsFile);
bindEvent(adminResetLandButton, "click", resetAllLand);
bindEvent(adminResetMoneyButton, "click", resetAllMoney);
bindEvent(adminResetMachineryButton, "click", resetAllMachinery);
bindEvent(adminResetAssetsButton, "click", resetAllAssets);
bindEvent(adminClearEventsButton, "click", () => clearEvents(""));
bindEvent(assetForm, "submit", buyAsset);
bindEvent(assetOptions, "change", updateAssetTotal);
bindEvent(assetQuantity, "input", updateAssetTotal);
bindEvent(assetTotal, "click", (event) => {
  const assetNav = event.target.closest("[data-asset-nav]");
  if (assetNav) {
    stepAssetItem(Number(assetNav.dataset.assetNav) || 0);
    return;
  }
  const photoNav = event.target.closest("[data-asset-photo-nav]");
  if (photoNav) {
    stepAssetPhoto(Number(photoNav.dataset.assetPhotoNav) || 0);
    return;
  }
  const photoButton = event.target.closest("[data-preview-src]");
  if (photoButton) openPreviewFromButton(photoButton);
});
bindEvent(adminSettingsFields, "click", (event) => {
  const photoButton = event.target.closest("[data-preview-src]");
  if (photoButton) openPreviewFromButton(photoButton);
});
bindEvent(imagePreviewPrev, "click", () => stepImagePreview(-1));
bindEvent(imagePreviewNext, "click", () => stepImagePreview(1));
document.addEventListener("keydown", (event) => {
  if (!imagePreviewModal || imagePreviewModal.classList.contains("is-hidden")) return;
  if (event.key === "ArrowLeft") stepImagePreview(-1);
  if (event.key === "ArrowRight") stepImagePreview(1);
});
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});
document.querySelectorAll("[data-close-image-preview]").forEach((button) => button.addEventListener("click", closeImagePreview));
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    if (modal === adminModal && document.body.classList.contains("is-admin-page")) return;
    closeModal(modal);
  });
});
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  button.classList.remove("is-pressed");
  window.requestAnimationFrame(() => {
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 160);
  });
});
document.addEventListener("visibilitychange", () => {
  startBackgroundPolling();
  if (!document.hidden && player && window.location.pathname !== "/admin") {
    Promise.allSettled([refreshGlobalMarket(), refreshLeaderboard(), refreshNews(), refreshMessageSummary()]);
  }
});

replaceGameTerms(document.body);
initSplashMap();

requestJson("/api/me")
  .then((payload) => {
    if (payload.player.isGuest) {
      finishBoot();
      return;
    }
    startGame(payload.player, payload.farm);
  })
  .catch(() => {
    finishBoot();
  });
