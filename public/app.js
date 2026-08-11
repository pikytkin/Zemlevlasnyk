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
const REGULAR_HEX_RADIUS_METERS = 1700;
let MAX_VISIBLE_GRID_CELLS = 9000;
const SETTLEMENT_GRID_SIZE = 0.25;
let DETAIL_ZOOM_MIN = 12;
let CLAIM_BATCH_SIZE = 1000;
let SELL_REFUND_RATE = 0.62;
let LAND_LEVELS = [
  { level: 1, name: "Без добрив", cost: 0, incomeBonusPercent: 0 },
  { level: 2, name: "Базові добрива", cost: 165, incomeBonusPercent: 18 },
  { level: 3, name: "Посилені добрива", cost: 260, incomeBonusPercent: 42 },
  { level: 4, name: "Преміум добрива", cost: 380, incomeBonusPercent: 72 },
  { level: 5, name: "Агрохімія повного циклу", cost: 540, incomeBonusPercent: 108 }
];
let gameSettings = null;
let stageRules = [
  { title: "Початок", min: 0, text: "Купуйте перші ділянки та формуйте базу господарства." },
  { title: "Господарство", min: 5, text: "Земля поруч підвищує ціну наступної покупки, а з'єднані ділянки дають бонус до доходу." },
  { title: "Компанія", min: 12, text: "З'єднані ділянки дають відчутний бонус до доходу." },
    { title: "Агрохолдинг", min: 24, text: "Розвивайте побудови, техніку і рівні землі." },
  { title: "Національна корпорація", min: 42, text: "Гравець бореться за лідерство на карті України." }
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
const incomeButton = document.querySelector("#incomeButton");
const dayCount = document.querySelector("#dayCount");
const mapBoard = document.querySelector("#mapBoard");
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
const upgradeButton = document.querySelector("#upgradeButton");
const buildingButton = document.querySelector("#buildingButton");
const machineryButton = document.querySelector("#machineryButton");
const sellButton = document.querySelector("#sellButton");
const profileButton = document.querySelector("#profileButton");
const helpButton = document.querySelector("#helpButton");
const messagesButton = document.querySelector("#messagesButton");
const messageBadge = document.querySelector("#messageBadge");
const logoutButton = document.querySelector("#logoutButton");
const profileModal = document.querySelector("#profileModal");
const helpModal = document.querySelector("#helpModal");
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
const imagePreviewModal = document.querySelector("#imagePreviewModal");
const imagePreviewTarget = document.querySelector("#imagePreviewTarget");
const imagePreviewPrev = document.querySelector("#imagePreviewPrev");
const imagePreviewNext = document.querySelector("#imagePreviewNext");
const imagePreviewCounter = document.querySelector("#imagePreviewCounter");
const ownerModal = document.querySelector("#ownerModal");
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

let player = null;
let state = defaultGameState();
let selectedCellId = null;
let saveTimer = null;
let map = null;
let boundaryLayer = null;
let maskLayer = null;
let gridMarkerLayer = null;
let gridMarkerRenderer = null;
let gridCanvas = null;
let gridGl = null;
let gridProgram = null;
let gridBuffer = null;
let labelLayer = null;
let ukrainePolygons = fallbackUkrainePolygon;
let ukraineCellCache = new Map();
let cellCache = new Map();
let settlementPlaces = [];
let settlementGrid = new Map();
let marketState = { land: {} };
let pendingSettingsImages = 0;
let marketTimer = null;
let marketCellCount = 0;
let marketSignature = "";
let leaderboardRows = [];
let leaderboardTimer = null;
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
let cellLayerById = new Map();
let selectedCellIds = new Set();
let purchaseInProgress = false;
let selectionDrag = null;
let clusterSelectionMode = false;
let suppressMapClick = false;
let selectionPopupDismissed = false;
let cellInfoOpen = false;
let newsReturnState = null;
let touchTooltip = null;
let touchTooltipTimer = null;
let gridUpdateTimer = null;
let gridRenderJob = 0;
let gridRenderFrame = null;
let isMapMoving = false;
let gridTooDenseNotifiedAt = 0;
let detailedMapMarkerCount = 0;
let landClusterCacheKey = "";
let landClusterCacheMap = null;
let landClusterCacheClusters = null;

function defaultGameState() {
  return {
    coins: gameSettings?.economy?.startingCoins || 500,
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
  gameMessage.textContent = landLabel(message);
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
  const response = await fetch(url, {
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: response.status === 413 ? "Дані завеликі для сервера. Зменште фото або збільшіть ліміт Nginx." : `Сервер повернув не JSON (${response.status}).` };
  if (!response.ok) throw new Error(payload.error || "Помилка сервера.");
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
        const duration = Math.max(1, Number(item?.durationDays) || 100);
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

function applyGameSettings(settings) {
  gameSettings = settings || gameSettings;
  const economy = gameSettings?.economy || {};
  const upgrades = gameSettings?.upgrades || {};
  MAX_VISIBLE_GRID_CELLS = Number.isFinite(economy.maxVisibleCells) ? Math.max(600, Math.min(9000, economy.maxVisibleCells)) : MAX_VISIBLE_GRID_CELLS;
  DETAIL_ZOOM_MIN = Number.isFinite(economy.detailZoomMin) ? Math.max(12, economy.detailZoomMin) : DETAIL_ZOOM_MIN;
  CLAIM_BATCH_SIZE = Number.isFinite(economy.claimBatchSize) ? economy.claimBatchSize : CLAIM_BATCH_SIZE;
  SELL_REFUND_RATE = Number.isFinite(economy.sellRefundPercent) ? economy.sellRefundPercent / 100 : SELL_REFUND_RATE;
  LAND_LEVELS = Array.isArray(upgrades.landLevels) && upgrades.landLevels.length ? upgrades.landLevels : LAND_LEVELS;
  stageRules = Array.isArray(gameSettings?.stages) && gameSettings.stages.length ? gameSettings.stages : stageRules;
  if (!gameSettings.assets) {
    gameSettings.assets = {
      machineryItems: [{ id: "tractor-basic", icon: "🚜", name: "Трактор базовий", cost: 480, incomeBonusPercent: 1, durationDays: 100, photos: [] }],
      elevatorItems: [{ id: "elevator-basic", icon: "🏗", mapEmoji: "🏗", name: "Елеватор базовий", cost: 1200, incomePerDay: 75, minCells: 3, maxOwnerLandPercent: 25, photos: [] }]
    };
  }
  gameSettings.assets.elevatorItems = (gameSettings.assets.elevatorItems || []).map((item) => ({
    ...item,
    mapEmoji: item.mapEmoji || (String(item.icon || "").startsWith("data:image/") ? "🏗" : item.icon) || "🏗",
    incomePerDay: Number.isFinite(Number(item.incomePerDay)) ? Number(item.incomePerDay) : 75,
    minCells: Number.isFinite(Number(item.minCells)) ? Math.max(1, Math.floor(Number(item.minCells))) : 1,
    maxOwnerLandPercent: Number.isFinite(Number(item.maxOwnerLandPercent)) ? Math.min(100, Math.max(1, Number(item.maxOwnerLandPercent))) : 25,
    serviceLifeExtensionDays: Number.isFinite(Number(item.serviceLifeExtensionDays)) ? Math.max(0, Math.floor(Number(item.serviceLifeExtensionDays))) : 0
  }));
  gameSettings.assets.machineryItems = (gameSettings.assets.machineryItems || []).map((item) => ({
    ...item,
    durationDays: Number.isFinite(Number(item.durationDays)) ? Math.max(1, Math.floor(Number(item.durationDays))) : 100
  }));
  if (state?.inventory) state.inventory = normalizeMachineryInventory(state.inventory, state.currentDay || 1);
  cellCache = new Map();
  landClusterCacheKey = "";
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

  authScreen.classList.add("is-hidden");
  gameScreen.classList.remove("is-hidden");
  renderPlayerHeader();
  loadGameSettings().then(() => initMap());
  render();
  showGameMessage("Карту володінь завантажено.");
  refreshMessageSummary();
  clearInterval(messagesTimer);
  messagesTimer = setInterval(refreshMessageSummary, 10000);
  if (window.location.pathname === "/admin") {
    if (player?.isAdmin) {
      openAdminPanel();
    } else {
      window.history.replaceState({}, "", "/");
      showGameMessage("Адмін-панель доступна тільки адміністратору.");
    }
  }
}

async function logoutPlayer() {
  if (player) {
    await saveState();
  }
  try {
    await requestJson("/api/logout", { method: "POST", body: "{}" });
  } catch {
    // Local logout still matters if the network request fails.
  }
  player = null;
  selectedCellId = null;
  activeChatUserId = null;
  clearTimeout(saveTimer);
  clearInterval(messagesTimer);
  stopActiveChatPolling();
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("is-hidden"));
  hideSelectionPopup();
  hideCellInfoPanel();
  gameScreen.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
  loginForm?.reset();
  showAuthMessage("Ви вийшли з акаунта.");
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 350);
}

async function saveState() {
  if (!player) return;

  try {
    const payload = await requestJson("/api/save", {
      method: "POST",
      body: JSON.stringify({ farm: state })
    });
    if (payload.farm && Number.isFinite(payload.farm.coins) && payload.farm.coins !== state.coins) {
      state.coins = payload.farm.coins;
      renderPlayerHeader();
    }
    refreshLeaderboard();
    refreshNews();
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function initMap() {
  if (map) return;

  map = L.map(mapBoard, {
    zoomControl: true,
    minZoom: 6,
    maxZoom: 13,
    zoomSnap: 1,
    zoomDelta: 1,
    boxZoom: false,
    wheelDebounceTime: 75,
    wheelPxPerZoomLevel: 165,
    maxBounds: [[43.2, 21.0], [53.0, 41.2]],
    maxBoundsViscosity: 0.9
  }).setView([49.02, 31.25], 6);
  globalThis.agroMap = map;
  document.agroMap = map;
  addMapQuickActionsControl();

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    updateWhenIdle: true,
    updateWhenZooming: false,
    updateInterval: 180,
    keepBuffer: 3,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  map.createPane("countryMaskPane");
  map.getPane("countryMaskPane").style.zIndex = 350;
  map.createPane("gridMarkerPane");
  map.getPane("gridMarkerPane").style.zIndex = 650;
  map.createPane("labelPane");
  map.getPane("labelPane").style.zIndex = 700;

  await loadUkraineBoundary();
  await loadSettlements();
  await refreshMarket();
  await refreshLeaderboard();
  await refreshNews();
  drawUkraineMask();

  gridMarkerRenderer = L.canvas({ padding: 0.35, tolerance: 8 });
  gridMarkerLayer = L.layerGroup([], { pane: "gridMarkerPane" }).addTo(map);
  labelLayer = L.layerGroup([], { pane: "labelPane" }).addTo(map);
  initGridGpuLayer();
  drawSettlementLabels();

  map.on("zoomstart", () => {
    isMapMoving = true;
    clearGridLayerForZoom();
  });
  map.on("movestart", () => {
    isMapMoving = true;
  });
  map.on("zoomend moveend", () => {
    isMapMoving = false;
    scheduleGridUpdate();
  });
  map.on("move zoom resize", syncGridGpuCanvas);
  map.on("click", selectCellAtMapPoint);
  setupShiftSelection();
  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(boundaryLayer.getBounds(), { padding: [18, 18] });
    updateGrid();
  }, 180);
  clearInterval(marketTimer);
  marketTimer = setInterval(refreshMarket, 4500);
  clearInterval(leaderboardTimer);
  leaderboardTimer = setInterval(refreshLeaderboard, 7000);
  clearInterval(newsTimer);
  newsTimer = setInterval(refreshNews, 9000);
}

function addMapQuickActionsControl() {
  if (!clusterSelectButton || !newsButton || !globalThis.L) return;
  const QuickActions = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const container = L.DomUtil.create("div", "leaflet-control map-quick-actions-control");
      container.append(clusterSelectButton, newsButton);
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      return container;
    }
  });
  new QuickActions().addTo(map);
}

async function initSplashMap() {
  const splashMap = document.querySelector("#splashMap");
  if (!splashMap || !globalThis.L) return;

  const preview = L.map(splashMap, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false
  }).setView([49.02, 31.25], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 8,
    updateWhenIdle: true
  }).addTo(preview);

  try {
    const geojson = await fetch("/ukraine-boundary.geojson").then((response) => response.json());
    const layer = L.geoJSON(geojson, {
      style: {
        color: "#9ee85f",
        weight: 2,
        fillColor: "#35c982",
        fillOpacity: 0.16
      }
    }).addTo(preview);
    preview.fitBounds(layer.getBounds(), { padding: [18, 18] });
  } catch {
    preview.setView([49.02, 31.25], 6);
  }
}

async function loadSettlements() {
  try {
    const places = await fetch("/settlements.json").then((response) => {
      if (!response.ok) throw new Error("Settlements unavailable.");
      return response.json();
    });
    settlementPlaces = Array.isArray(places) ? places : [];
    settlementGrid = buildSettlementGrid(settlementPlaces);
  } catch {
    settlementPlaces = cityLabels.map(([n, lat, lng]) => ({ n, lat, lng, p: 0, f: "PPL" }));
    settlementGrid = buildSettlementGrid(settlementPlaces);
  }
}

async function refreshMarket() {
  try {
    const nextMarket = await requestJson("/api/market");
    const nextMarketCellCount = Object.keys(nextMarket?.land || {}).length;
    const nextMarketSignature = marketRenderSignature(nextMarket);
    const resetChanged = nextMarket?.resetAt && state.lastAdminResetAt !== nextMarket.resetAt;
    const marketChanged = nextMarketCellCount !== marketCellCount || nextMarketSignature !== marketSignature || resetChanged;
    marketState = nextMarket;
    marketCellCount = nextMarketCellCount;
    marketSignature = nextMarketSignature;
    if (resetChanged) {
      state.land = {};
      state.lastAdminResetAt = nextMarket.resetAt;
      selectedCellIds = new Set();
      selectedCellId = null;
      queueSave();
    }
    syncOwnedMarketLand();
    reconcileLocalLandWithMarket();
    if (map && gridMarkerLayer) {
      if (marketChanged && !isMapMoving) scheduleGridUpdate();
      render();
    }
  } catch {
    marketState = marketState || { land: {} };
  }
}

async function refreshLeaderboard() {
  try {
    const payload = await requestJson("/api/leaderboard");
    leaderboardRows = Array.isArray(payload.rows) ? payload.rows : [];
    renderLeaderboard();
  } catch {
    leaderboardRows = [];
  }
}

function marketRenderSignature(market) {
  let hash = 0;
  Object.entries(market?.land || {}).forEach(([id, owner]) => {
    const token = `${id}:${owner?.ownerId || ""}:${owner?.ownerColor || ""}:${owner?.buildingId || owner?.building || ""}:${owner?.buildingMapEmoji || owner?.cellEmoji || ""}`;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash + token.charCodeAt(index)) | 0;
    }
  });
  return `${Object.keys(market?.land || {}).length}:${hash}`;
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

function syncOwnedMarketLand() {
  if (!player?.id || !marketState?.land) return;
  Object.entries(marketState.land).forEach(([id, owner]) => {
    if (!isRegularHexId(id)) return;
    if (owner.ownerId !== player.id || state.land[id]) return;
    const cell = getCell(id);
    state.land[id] = {
      id,
      price: Number.isFinite(owner.price) ? owner.price : cell.price,
      purchasedAt: owner.purchasedAt || new Date().toISOString(),
      level: 1,
      building: null,
      buildingId: null,
      buildingGroupId: null,
      buildingLevel: 0,
      machinery: false,
      machineryLevel: 0,
      nickname: `${cell.region}, ${cell.code.slice(-5)}`
    };
  });
}

function reconcileLocalLandWithMarket() {
  if (!player?.id || !marketState?.land || !state?.land) return;
  let changed = false;

  Object.keys(state.land).forEach((id) => {
    if (!isRegularHexId(id)) {
      delete state.land[id];
      changed = true;
      return;
    }
    const marketOwner = marketState.land[id];
    if (marketOwner && marketOwner.ownerId !== player.id) {
      delete state.land[id];
      changed = true;
      return;
    }

    if (player.isGuest && !marketOwner) {
      delete state.land[id];
      changed = true;
    }
  });

  if (!changed) return;
  queueSave();
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

function drawUkraineMask() {
  if (boundaryLayer) boundaryLayer.remove();
  if (maskLayer) maskLayer.remove();

  boundaryLayer = L.geoJSON({
    type: "FeatureCollection",
    features: ukrainePolygons.map((polygon) => ({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: polygon }
    }))
  }, {
    pane: "countryMaskPane",
    interactive: false,
    style: {
      color: "#18231d",
      weight: 3,
      fillOpacity: 0
    }
  }).addTo(map);

  boundaryLayer.bringToFront();
}

function drawSettlementLabels() {
  labelLayer.clearLayers();
  cityLabels.forEach(([name, lat, lng, minZoom]) => {
    const marker = L.marker([lat, lng], {
      pane: "labelPane",
      interactive: false,
      icon: L.divIcon({
        className: `settlement-label settlement-z${minZoom}`,
        html: name,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      })
    });
    marker.options.minZoom = minZoom;
    marker.addTo(labelLayer);
  });
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
  gridBuffer = gridGl.createBuffer();
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

function syncGridGpuCanvas() {
  if (!gridCanvas || !mapBoard) return;
  const ratio = Math.min(1.5, window.devicePixelRatio || 1);
  const rect = mapBoard.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (gridCanvas.width !== width || gridCanvas.height !== height) {
    gridCanvas.width = width;
    gridCanvas.height = height;
  }
  gridCanvas.style.width = rect.width + "px";
  gridCanvas.style.height = rect.height + "px";
  renderGridGpuLayer();
}

function updateGridGpuLayer(cells = visibleCells) {
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

function renderGridGpuLayer() {
  if (!gridGl || !gridProgram || !gridBuffer || !map || isOverviewZoom()) {
    clearGridGpuLayer();
    return;
  }
  const rect = mapBoard.getBoundingClientRect();
  const vertices = [];
  visibleCells.forEach((cell) => appendCellVertices(vertices, cell, rect.width, rect.height));
  gridGl.viewport(0, 0, gridCanvas.width, gridCanvas.height);
  gridGl.clearColor(0, 0, 0, 0);
  gridGl.clear(gridGl.COLOR_BUFFER_BIT);
  if (!vertices.length) return;
  gridGl.useProgram(gridProgram);
  gridGl.bindBuffer(gridGl.ARRAY_BUFFER, gridBuffer);
  gridGl.bufferData(gridGl.ARRAY_BUFFER, new Float32Array(vertices), gridGl.DYNAMIC_DRAW);
  const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
  const positionLocation = gridGl.getAttribLocation(gridProgram, "a_position");
  const colorLocation = gridGl.getAttribLocation(gridProgram, "a_color");
  gridGl.enableVertexAttribArray(positionLocation);
  gridGl.vertexAttribPointer(positionLocation, 2, gridGl.FLOAT, false, stride, 0);
  gridGl.enableVertexAttribArray(colorLocation);
  gridGl.vertexAttribPointer(colorLocation, 4, gridGl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  gridGl.enable(gridGl.BLEND);
  gridGl.blendFunc(gridGl.SRC_ALPHA, gridGl.ONE_MINUS_SRC_ALPHA);
  gridGl.drawArrays(gridGl.TRIANGLES, 0, vertices.length / 6);
}

function appendCellVertices(vertices, cell, width, height) {
  const boundary = cell.boundary && cell.boundary.length ? cell.boundary : getCell(cell.id).boundary;
  if (!boundary || !boundary.length) return;
  const centerPoint = map.latLngToContainerPoint([cell.lat, cell.lng]);
  const center = screenToClip(centerPoint.x, centerPoint.y, width, height);
  const fill = gridCellColor(cell.id);
  const stroke = gridCellStrokeColor(cell.id);
  const selected = selectedCellIds.has(cell.id) || cell.id === selectedCellId;
  const edgeScale = selected ? 0.92 : 0.965;
  const outlineScale = selected ? 1 : 0.985;
  const points = boundary.map(([lat, lng]) => map.latLngToContainerPoint([lat, lng]));
  for (let index = 0; index < 6; index += 1) {
    const a = scaledClipPoint(points[index], centerPoint, edgeScale, width, height);
    const b = scaledClipPoint(points[(index + 1) % 6], centerPoint, edgeScale, width, height);
    vertices.push(center.x, center.y, ...fill, a.x, a.y, ...fill, b.x, b.y, ...fill);
  }
  for (let index = 0; index < 6; index += 1) {
    const outerA = scaledClipPoint(points[index], centerPoint, outlineScale, width, height);
    const outerB = scaledClipPoint(points[(index + 1) % 6], centerPoint, outlineScale, width, height);
    const innerA = scaledClipPoint(points[index], centerPoint, selected ? 0.86 : 0.94, width, height);
    const innerB = scaledClipPoint(points[(index + 1) % 6], centerPoint, selected ? 0.86 : 0.94, width, height);
    vertices.push(outerA.x, outerA.y, ...stroke, outerB.x, outerB.y, ...stroke, innerB.x, innerB.y, ...stroke);
    vertices.push(outerA.x, outerA.y, ...stroke, innerB.x, innerB.y, ...stroke, innerA.x, innerA.y, ...stroke);
  }
}

function screenToClip(x, y, width, height) {
  return { x: (x / width) * 2 - 1, y: 1 - (y / height) * 2 };
}

function scaledClipPoint(point, center, scale, width, height) {
  return screenToClip(center.x + (point.x - center.x) * scale, center.y + (point.y - center.y) * scale, width, height);
}

function gridCellColor(id) {
  const selected = selectedCellIds.has(id) || id === selectedCellId;
  const owner = getOwner(id);
  if (owner === "player") return colorToFloats(state.color, selected ? 0.78 : 0.52);
  if (owner === "rival") return colorToFloats(marketState?.land?.[id]?.ownerColor || "#ef7669", selected ? 0.72 : 0.42);
  return selected ? [1, 0.69, 0, 0.42] : [1, 1, 1, 0.08];
}

function gridCellStrokeColor(id) {
  const selected = selectedCellIds.has(id) || id === selectedCellId;
  const owner = getOwner(id);
  if (selected) return [1, 0.69, 0, 1];
  if (owner === "player") return [0.18, 0.49, 0.3, 0.9];
  if (owner === "rival") return [0.48, 0.22, 0.18, 0.9];
  return [0.07, 0.07, 0.07, 0.88];
}

function colorToFloats(hex, alpha) {
  const normalized = String(hex || "").replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized.padEnd(6, "0").slice(0, 6);
  return [(parseInt(value.slice(0, 2), 16) || 0) / 255, (parseInt(value.slice(2, 4), 16) || 0) / 255, (parseInt(value.slice(4, 6), 16) || 0) / 255, alpha];
}

async function updateGrid() {
  if (!map || !gridMarkerLayer) return;
  cancelPendingGridRender();
  gridRenderJob += 1;
  const renderJob = gridRenderJob;
  gridMarkerLayer.clearLayers();
  cellLayerById = new Map();
  detailedMapMarkerCount = 0;
  clearGridGpuLayer();
  if (isOverviewZoom()) {
    visibleCells = [];
    renderOverviewGridLayer();
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  visibleCells = gridCellsInView();
  if (renderJob !== gridRenderJob || isOverviewZoom()) return;
  if (!visibleCells.length) {
    updateSettlementLabelVisibility();
    renderSelectedCell();
    return;
  }
  if (visibleCells.length && (!selectedCellId || !visibleCells.some((cell) => cell.id === selectedCellId))) {
    selectedCellId = visibleCells[0].id;
    selectedCellIds = new Set([selectedCellId]);
  }
  updateSettlementLabelVisibility();
  updateGridGpuLayer(visibleCells);
  renderDetailedCellsChunked(visibleCells, renderJob);
}

function clearGridLayerForZoom() {
  if (!gridMarkerLayer) return;
  cancelPendingGridRender();
  gridRenderJob += 1;
  gridMarkerLayer.clearLayers();
  cellLayerById = new Map();
  detailedMapMarkerCount = 0;
  clearGridGpuLayer();
}

function renderDetailedCellsChunked(cells, renderJob) {
  const chunkSize = isLowPowerDevice() ? 180 : 420;
  let index = 0;
  function renderChunk() {
    gridRenderFrame = null;
    if (renderJob !== gridRenderJob || isOverviewZoom()) return;
    const end = Math.min(index + chunkSize, cells.length);
    for (; index < end; index += 1) addDetailedCellLayer(cells[index]);
    if (index < cells.length) {
      gridRenderFrame = requestAnimationFrame(renderChunk);
      return;
    }
    renderSelectedCell();
  }
  gridRenderFrame = requestAnimationFrame(renderChunk);
}

function addDetailedCellLayer(cell) {
  addBuildingEmojiLayer(cell, getOwner(cell.id));
}

function showTouchTooltip(cell, owner, latlng) {
  if (!isTouchDevice()) return;
  clearTimeout(touchTooltipTimer);
  if (touchTooltip) {
    map.removeLayer(touchTooltip);
    touchTooltip = null;
  }
  touchTooltip = L.tooltip({
    direction: "top",
    className: "cell-tooltip touch-cell-tooltip",
    interactive: false,
    permanent: true,
    opacity: 1
  })
    .setLatLng(latlng)
    .setContent(cellTooltip(cell, owner))
    .addTo(map);
  touchTooltipTimer = window.setTimeout(() => {
    if (touchTooltip) {
      map.removeLayer(touchTooltip);
      touchTooltip = null;
    }
  }, 3000);
}

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function isLowPowerDevice() {
  return isTouchDevice()
    || window.innerWidth < 900
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}

function shouldBindCellTooltips() {
  return !isTouchDevice() && visibleCells.length <= 1400;
}

function addBuildingEmojiLayer(cell, owner) {
  if (owner !== "player" && owner !== "rival") return;
  if (!canAddDetailedMapMarker()) return;
  const emoji = owner === "player"
    ? buildingMapEmojiForCell(state.land[cell.id])
    : marketState?.land?.[cell.id]?.buildingMapEmoji;
  if (!emoji) return;
  const center = cellCenterLatLng(cell);
  if (!center) return;
  L.marker(center, {
    pane: "labelPane",
    interactive: false,
    icon: L.divIcon({
      className: `building-cell-icon ${owner === "rival" ? "is-rival" : ""}`,
      html: escapeHtml(emoji),
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })
  }).addTo(gridMarkerLayer);
  detailedMapMarkerCount += 1;
}

function canAddDetailedMapMarker() {
  const limit = isLowPowerDevice() ? 80 : 180;
  return detailedMapMarkerCount < limit;
}

function cellCenterLatLng(cell) {
  if (Number.isFinite(cell.lat) && Number.isFinite(cell.lng)) return [cell.lat, cell.lng];
  if (!Array.isArray(cell.boundary) || !cell.boundary.length) return null;
  const total = cell.boundary.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / cell.boundary.length, total[1] / cell.boundary.length];
}

function buildingMapEmojiForCell(ownership) {
  const item = buildingItemForCell(ownership);
  if (!item) return "";
  return String(item.mapEmoji || item.icon || "🏗").startsWith("data:image/") ? "🏗" : String(item.mapEmoji || item.icon || "🏗").slice(0, 8);
}

function updateSettlementLabelVisibility() {
  drawSettlementLabels();
}

function isOverviewZoom() {
  return map.getZoom() < DETAIL_ZOOM_MIN;
}

function overviewClusterKey(cell, precision = 0.45) {
  return Math.round(cell.lat / precision) + ":" + Math.round(cell.lng / precision);
}

function renderOverviewGridLayer() {
  const rivalIds = Object.entries(marketState?.land || {})
    .filter(([, owner]) => owner.ownerId !== player?.id)
    .map(([id]) => id)
    .filter(isRegularHexId);
  const ownedIds = Object.keys(state.land || {}).filter((id) => isRegularHexId(id) && getOwner(id) === "player");
  const buildingIds = ownedIds.filter((id) => state.land[id]?.building || state.land[id]?.buildingId);
  const landOnlyIds = ownedIds.filter((id) => !state.land[id]?.building && !state.land[id]?.buildingId);
  const rivalBuildingIds = rivalIds.filter((id) => marketState?.land?.[id]?.building || marketState?.land?.[id]?.buildingId || marketState?.land?.[id]?.buildingMapEmoji);
  const rivalBuildingSet = new Set(rivalBuildingIds);
  const rivalLandOnlyIds = rivalIds.filter((id) => !rivalBuildingSet.has(id));
  const selectedIds = (selectedCellIds.size ? [...selectedCellIds] : selectedCellId ? [selectedCellId] : []).filter(isRegularHexId);
  addAggregateCells(rivalIds, "rival");
  addAggregateCells(ownedIds, "owned");
  addAggregateCells(selectedIds, "selected");
  addOverviewLandMarkers(landOnlyIds);
  addOverviewBuildingMarkers(buildingIds);
  addOverviewLandMarkers(rivalLandOnlyIds, true);
  addOverviewBuildingMarkers(rivalBuildingIds, true);
}

function addOverviewLandMarkers(ids, isRival = false) {
  addOverviewEmojiMarkers(ids, (id) => isRival ? marketState?.land?.[id]?.cellEmoji || "??" : "??", "land-cell-icon overview-land-icon " + (isRival ? "is-rival" : ""));
}

function addOverviewBuildingMarkers(ids, isRival = false) {
  addOverviewEmojiMarkers(ids, (id) => isRival ? marketState?.land?.[id]?.buildingMapEmoji : buildingMapEmojiForCell(state.land[id]), "building-cell-icon overview-building-icon " + (isRival ? "is-rival" : ""));
}

function addOverviewEmojiMarkers(ids, emojiForId, className) {
  const bounds = map.getBounds().pad(0.08);
  const renderedGroups = new Set();
  const precision = map.getZoom() <= 6 ? 0.85 : 0.42;
  const limit = isLowPowerDevice() ? 80 : 150;
  let rendered = 0;
  ids.some((id) => {
    if (!isRegularHexId(id)) return false;
    const cell = getCell(id);
    if (!cell || !pointInBounds(cell.lat, cell.lng, bounds)) return false;
    const key = overviewClusterKey(cell, precision);
    if (renderedGroups.has(key)) return false;
    const emoji = emojiForId(id);
    if (!emoji) return false;
    renderedGroups.add(key);
    L.marker([cell.lat, cell.lng], {
      pane: "labelPane",
      interactive: false,
      icon: L.divIcon({ className, html: escapeHtml(emoji), iconSize: [28, 28], iconAnchor: [14, 14] })
    }).addTo(gridMarkerLayer);
    rendered += 1;
    return rendered >= limit;
  });
}

function addAggregateCells(ids, kind) {
  const bounds = map.getBounds().pad(0.12);
  const precision = map.getZoom() <= 6 ? 0.85 : 0.42;
  const groups = new Map();
  ids.forEach((id) => {
    if (!isRegularHexId(id)) return;
    const cell = getCell(id);
    if (!cell || !pointInBounds(cell.lat, cell.lng, bounds)) return;
    const key = overviewClusterKey(cell, precision);
    if (!groups.has(key)) groups.set(key, { lat: cell.lat, lng: cell.lng, count: 0 });
    groups.get(key).count += 1;
  });
  [...groups.values()].slice(0, isLowPowerDevice() ? 100 : 180).forEach((group) => {
    L.circleMarker([group.lat, group.lng], aggregateCellStyle(kind, group.count))
      .on("click", () => {
        map.setView([group.lat, group.lng], DETAIL_ZOOM_MIN);
        showGameMessage("Наблизьте карту, щоб обирати окремі земельні ділянки.");
      })
      .addTo(gridMarkerLayer);
  });
}

function aggregateCellStyle(kind, count = 1) {
  const radius = Math.min(18, 4 + Math.sqrt(count) * 1.8);
  const styles = {
    rival: { color: "#7a382f", fillColor: "#ef7669", fillOpacity: 0.2, weight: 1 },
    owned: { color: "#1b6f43", fillColor: state.color, fillOpacity: 0.34, weight: 1 },
    selected: { color: "#ffb000", fillColor: "#ffb000", fillOpacity: 0.4, weight: 1.4 }
  };
  return { pane: "gridMarkerPane", renderer: gridMarkerRenderer, radius, className: "grid-aggregate " + kind, ...styles[kind] };
}

function scheduleGridUpdate() {
  clearTimeout(gridUpdateTimer);
  gridUpdateTimer = setTimeout(() => {
    gridUpdateTimer = null;
    updateGrid();
  }, isLowPowerDevice() ? 260 : 180);
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
  if (!map || !gridMarkerLayer) return;
  if (isOverviewZoom()) {
    scheduleGridUpdate();
    return;
  }

  updateGridGpuLayer(visibleCells);
  scheduleGridUpdate();
  renderSelectedCell();
}

function setupShiftSelection() {
  L.DomEvent.disableClickPropagation(mapBoard);

  mapBoard.addEventListener("pointerdown", (event) => {
    if ((!clusterSelectionMode && !event.shiftKey) || event.button !== 0) return;
    event.preventDefault();
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
  if (!clusterSelectionMode) map.dragging.enable();
  drag.box.remove();

  if (!drag.moved) {
    if (clusterSelectionMode) {
      const latlng = map.containerPointToLatLng([drag.endX, drag.endY]);
      const cell = cellFromLatLng(latlng.lat, latlng.lng);
      if (cell) toggleCellSelection(cell.id);
    }
    return;
  }

  const left = Math.min(drag.startX, drag.endX);
  const right = Math.max(drag.startX, drag.endX);
  const top = Math.min(drag.startY, drag.endY);
  const bottom = Math.max(drag.startY, drag.endY);
  const nextSelection = new Set(selectedCellIds);

  selectionCandidateCells().forEach((cell) => {
    const point = map.latLngToContainerPoint([cell.lat, cell.lng]);
    if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
      nextSelection.add(cell.id);
      selectedCellId = cell.id;
    }
  });

  selectedCellIds = nextSelection;
  selectionPopupDismissed = false;
  refreshVisibleCellLayers(changedSelectionIds(previousSelection, selectedCellIds));
  render();
  showGameMessage(`Виділено земельних ділянок: ${selectedCellIds.size}.`);
}

function selectionCandidateCells() {
  if (!isOverviewZoom()) return visibleCells;
  return gridCellsInView(map.getBounds().pad(0.02));
}

function selectCellAtMapPoint(event) {
  if (suppressMapClick) return;
  if (!event?.latlng || !pointInUkraine([event.latlng.lng, event.latlng.lat])) return;

  if (isOverviewZoom() && !event.originalEvent?.shiftKey && !clusterSelectionMode) {
    map.setView(event.latlng, DETAIL_ZOOM_MIN);
    showGameMessage("Наблизьте карту, щоб обирати окремі земельні ділянки.");
    return;
  }

  const cell = cellFromLatLng(event.latlng.lat, event.latlng.lng);
  if (cell) {
    if (clusterSelectionMode) toggleCellSelection(cell.id);
    else selectCell(cell.id, event.originalEvent);
  }
}

function hexId(q, r) {
  return "hex-" + q + "-" + r;
}

function isRegularHexId(id) {
  return /^hex--?\d+--?\d+$/.test(String(id || ""));
}

function parseHexId(id) {
  const match = String(id || "").match(/^hex-(-?\d+)-(-?\d+)$/);
  return { q: match ? Number(match[1]) : 0, r: match ? Number(match[2]) : 0 };
}

function latLngToWorldMeters(lat, lng) {
  const radius = 6378137;
  const limitedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  return {
    x: radius * lng * Math.PI / 180,
    y: radius * Math.log(Math.tan(Math.PI / 4 + limitedLat * Math.PI / 360))
  };
}

function worldMetersToLatLng(x, y) {
  const radius = 6378137;
  return {
    lng: x / radius * 180 / Math.PI,
    lat: (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) * 180 / Math.PI
  };
}

function axialFromWorld(x, y) {
  const q = (2 / 3 * x) / REGULAR_HEX_RADIUS_METERS;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / REGULAR_HEX_RADIUS_METERS;
  return axialRound(q, r);
}

function axialRound(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
  else if (yDiff > zDiff) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

function worldFromAxial(q, r) {
  return {
    x: REGULAR_HEX_RADIUS_METERS * 1.5 * q,
    y: REGULAR_HEX_RADIUS_METERS * Math.sqrt(3) * (r + q / 2)
  };
}

function regularHexBoundaryLatLng(q, r) {
  const center = worldFromAxial(q, r);
  const points = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 180 * (60 * index);
    const point = worldMetersToLatLng(
      center.x + REGULAR_HEX_RADIUS_METERS * Math.cos(angle),
      center.y + REGULAR_HEX_RADIUS_METERS * Math.sin(angle)
    );
    points.push([point.lat, point.lng]);
  }
  return points;
}

function cellFromLatLng(lat, lng) {
  const point = latLngToWorldMeters(lat, lng);
  const axial = axialFromWorld(point.x, point.y);
  const cell = makeCell(hexId(axial.q, axial.r));
  return pointInUkraine([cell.lng, cell.lat]) ? cell : null;
}

function gridCellsInView(bounds = map.getBounds().pad(0.04), limit = gridCellLimitForZoom()) {
  const corners = [
    latLngToWorldMeters(bounds.getSouth(), bounds.getWest()),
    latLngToWorldMeters(bounds.getSouth(), bounds.getEast()),
    latLngToWorldMeters(bounds.getNorth(), bounds.getEast()),
    latLngToWorldMeters(bounds.getNorth(), bounds.getWest())
  ];
  const axialCorners = corners.map((point) => axialFromWorld(point.x, point.y));
  const qValues = axialCorners.map((point) => point.q);
  const rValues = axialCorners.map((point) => point.r);
  const minQ = Math.floor(Math.min(...qValues)) - 3;
  const maxQ = Math.ceil(Math.max(...qValues)) + 3;
  const minR = Math.floor(Math.min(...rValues)) - 3;
  const maxR = Math.ceil(Math.max(...rValues)) + 3;
  const cells = [];
  for (let q = minQ; q <= maxQ; q += 1) {
    for (let r = minR; r <= maxR; r += 1) {
      const cell = makeVisibleCell(hexId(q, r));
      if (!pointInBounds(cell.lat, cell.lng, bounds)) continue;
      if (!pointInUkraine([cell.lng, cell.lat])) continue;
      cells.push(cell);
      if (cells.length > limit) {
        notifyGridTooDense();
        return [];
      }
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

function ukrainePlayableCellIds() {
  const key = "regular-hex-v1";
  if (ukraineCellCache.has(key)) return ukraineCellCache.get(key);
  const bounds = boundaryLayer?.getBounds?.() || L.latLngBounds([[43.2, 21.0], [53.0, 41.2]]);
  const ids = gridCellsInView(bounds.pad(0.08), MAX_VISIBLE_GRID_CELLS).map((cell) => cell.id);
  ukraineCellCache.set(key, ids);
  return ids;
}

function gridCellLimitForZoom() {
  const zoom = map?.getZoom?.() || DETAIL_ZOOM_MIN;
  const lowPower = isLowPowerDevice();
  const zoomLimit = zoom >= 13 ? (lowPower ? 4200 : 9000) : (lowPower ? 2500 : 7000);
  return Math.min(MAX_VISIBLE_GRID_CELLS, zoomLimit);
}

function makeVisibleCell(id) {
  const { q, r } = parseHexId(id);
  const center = worldFromAxial(q, r);
  const { lat, lng } = worldMetersToLatLng(center.x, center.y);
  const cell = { id, code: id, lat, lng, boundary: regularHexBoundaryLatLng(q, r) };
  rememberCell(id, cell);
  return cell;
}

function makeCell(id) {
  if (cellCache.has(id)) return cellCache.get(id);
  if (!isRegularHexId(id)) return null;
  const { q, r } = parseHexId(id);
  const center = worldFromAxial(q, r);
  const { lat, lng } = worldMetersToLatLng(center.x, center.y);
  const basePrice = basePriceForCellId(id);
  const income = incomeForCellId(id);
  const settlement = nearestSettlement(lat, lng);
  const cell = {
    id,
    code: id,
    lat,
    lng,
    region: settlement.name,
    settlementDistanceKm: settlement.distanceKm,
    basePrice,
    price: priceForCellId(id),
    income,
    boundary: regularHexBoundaryLatLng(q, r)
  };
  rememberCell(id, cell);
  return cell;
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

function priceForCellId(id) {
  const basePrice = basePriceForCellId(id);
  const pressure = nearbyOwnedPressure(id);
  const growth = Number.isFinite(gameSettings?.economy?.nearbyPriceGrowthPercent) ? gameSettings.economy.nearbyPriceGrowthPercent / 100 : 0.08;
  return Math.round(basePrice * (1 + pressure * growth));
}

function basePriceForCellId(id) {
  const seed = Math.abs(hashString(String(id))) || 1;
  return rangedSettingValue(gameSettings?.economy?.baseLandPriceMin, gameSettings?.economy?.baseLandPriceSpread, 70, seed);
}

function nearbyOwnedPressure(id) {
  return neighborIdsWithinRadius(id, gameSettings?.economy?.nearbyPriceRadius || 2).reduce((sum, neighborId) => {
    const owner = marketState?.land?.[neighborId] || state.land?.[neighborId];
    return sum + (owner ? 1 : 0);
  }, 0);
}

function incomeForCellId(id) {
  const seed = Math.abs(hashString(String(id))) || 1;
  return rangedSettingValue(gameSettings?.economy?.baseIncomeMin, gameSettings?.economy?.baseIncomeSpread, 8, seed);
}

function rangedSettingValue(minValue, spreadValue, fallback, seed) {
  const base = Number.isFinite(minValue) ? minValue : fallback;
  const spread = Number.isFinite(spreadValue) ? Math.max(0, Math.floor(spreadValue)) : 0;
  return Math.round(base + (spread > 0 ? Math.abs(seed) % spread : 0));
}

function hexagonLatLng(lat, lng, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index + 30);
    const cellLat = lat + Math.sin(angle) * radius;
    const cellLng = lng + Math.cos(angle) * radius / Math.cos((lat * Math.PI) / 180);
    return [cellLat, cellLng];
  });
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
      name: place.n,
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
  const visibleCell = visibleCells.find((item) => item.id === id);
  const cell = visibleCell?.region ? visibleCell : makeCell(id);
  if (cell) cell.price = priceForCellId(cell.id);
  return cell;
}

function getOwner(cellId) {
  const marketOwner = marketState?.land?.[cellId];
  if (marketOwner && marketOwner.ownerId === player?.id) return "player";
  if (marketOwner && marketOwner.ownerId !== player?.id) return "rival";
  if (state.land[cellId]) return "player";
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
  return ids.filter((id) => state.land[id]).map(getCell).filter(Boolean);
}

function buildableSelectedCells() {
  return ownedSelectedCells().filter((cell) => {
    const owned = state.land[cell.id];
    return owned && !owned.building && !owned.buildingId;
  });
}

function selectedGroupSummary() {
  const ids = [...selectedCellIds];
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
      freeCount += 1;
      totalPrice += priceForCellId(id);
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
  const marketOwner = marketState?.land?.[cellId];
  if (marketOwner && marketOwner.ownerId !== player?.id) return marketOwner.ownerName || "Інший гравець";
  const numeric = parseInt(cellId.slice(-5), 16) || 0;
  return rivalOwners[numeric % rivalOwners.length];
}

function ownerDisplayName(cellId) {
  const marketOwner = marketState?.land?.[cellId];
  if (marketOwner?.ownerName) return marketOwner.ownerName;
  if (state.land[cellId]) return state.companyName || player?.username || "Ваша компанія";
  return "Система";
}

function ownerIdForCell(cellId) {
  const marketOwner = marketState?.land?.[cellId];
  if (marketOwner?.ownerId) return marketOwner.ownerId;
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
    const minR = Math.max(-distance, -dq - distance);
    const maxR = Math.min(distance, -dq + distance);
    for (let dr = minR; dr <= maxR; dr += 1) {
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

    while (queue.length) {
      const id = queue.shift();
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
  return Object.keys(state.land).join("|");
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
  const afterLand = Math.round(base * levelBonus);
  const machineryGain = Math.round(afterLand * bonuses.machinery / 100);
  const buildingGain = 0;
  const afterInventory = afterLand + machineryGain;
  const total = Math.round(afterInventory * (1 + cluster.bonus));
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
  return 1 + ((fertilizerLevel(level)?.incomeBonusPercent || 0) / 100);
}

function inventoryIncomeMultiplier() {
  return 1 + inventoryBonusPercents().machinery / 100;
}

function inventoryBonusPercents() {
  expireMachinery(false);
  const machinery = assetBonusPercent("machineryItems", activeMachineryMap());
  const buildingsIncome = buildingDailyIncome();
  return { machinery, buildings: 0, buildingsIncome, total: machinery };
}

function assetBonusPercent(settingsKey, inventoryMap) {
  return (gameSettings?.assets?.[settingsKey] || []).reduce((sum, item) => {
    return sum + (inventoryMap[item.id] || 0) * (item.incomeBonusPercent || 0);
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
  const counted = new Set();
  return Object.values(state.land || {}).reduce((sum, ownership) => {
    const item = buildingItemForCell(ownership);
    if (!item) return sum;
    const key = ownership.buildingGroupId || `${ownership.id}:${item.id}`;
    if (counted.has(key)) return sum;
    counted.add(key);
    return sum + (item.incomePerDay || 0);
  }, 0);
}

function buildingCountByItem() {
  return Object.values(state.land || {}).reduce((map, ownership) => {
    const id = ownership.building || ownership.buildingId;
    if (id) map[id] = (map[id] || 0) + 1;
    return map;
  }, {});
}

function totalDailyIncome() {
  const clusterMap = clusterByCell();
  const countedBuildings = new Set();
  return ownedCells().reduce((sum, cell) => {
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
}

function assetsValue() {
  return ownedCells().reduce((sum, cell) => {
    const owned = state.land[cell.id];
    return sum
      + owned.price
      + fertilizerCostThroughLevel(owned.level || 1)
      + (isFirstCellInBuildingGroup(cell.id, owned) ? buildingCostForCell(owned) : 0);
  }, inventoryValue());
}

function isFirstCellInBuildingGroup(cellId, ownership) {
  if (!ownership?.building && !ownership?.buildingId) return false;
  const groupId = ownership.buildingGroupId;
  if (!groupId) return true;
  const firstId = Object.keys(state.land || {}).find((id) => state.land[id]?.buildingGroupId === groupId);
  return firstId === cellId;
}

function inventoryValue() {
  expireMachinery(false);
  const machineryMap = activeMachineryMap();
  const machinery = (gameSettings?.assets?.machineryItems || []).reduce((sum, item) => sum + (machineryMap?.[item.id] || 0) * (item.cost || 0), 0);
  return machinery;
}

function fertilizerCostThroughLevel(level) {
  return LAND_LEVELS.filter((item) => item.level <= Math.max(1, level || 1)).reduce((sum, item) => sum + (item.level > 1 ? item.cost || 0 : 0), 0);
}

function fertilizerUpgradeCost(currentLevel, targetLevel) {
  return LAND_LEVELS
    .filter((item) => item.level > Math.max(1, currentLevel || 1) && item.level <= targetLevel)
    .reduce((sum, item) => sum + (item.cost || 0), 0);
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
  return Math.max(1, Math.floor((ownedCount * percent) / 100));
}

function sellValue(cell, owned) {
  return Math.floor((owned.price + fertilizerCostThroughLevel(owned.level || 1) + buildingCostForCell(owned)) * SELL_REFUND_RATE);
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
  return `${Math.floor(value).toLocaleString("uk-UA")} мон.`;
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

async function buySelectedCell() {
  if (purchaseInProgress) return;
  const cells = freeSelectedCells();
  if (!cells.length) return;
  const totalPrice = cells.reduce((sum, cell) => sum + cell.price, 0);
  if (state.coins < totalPrice) {
    showGameMessage(`Потрібно ${money(totalPrice)}, на балансі ${money(state.coins)}.`);
    return;
  }

  purchaseInProgress = true;
  buyButton.disabled = true;
  try {
    const claimedIds = new Set();
    for (let index = 0; index < cells.length; index += CLAIM_BATCH_SIZE) {
      const batch = cells.slice(index, index + CLAIM_BATCH_SIZE);
      const claim = await requestJson("/api/claim", {
        method: "POST",
        body: JSON.stringify({ cells: batch.map((cell) => ({ id: cell.id, price: cell.price, region: cell.region })) })
      });
      marketState = claim.market || marketState;
      (claim.claimed || []).forEach((id) => claimedIds.add(id));
    }
    marketCellCount = Object.keys(marketState?.land || {}).length;
    const claimedCells = cells.filter((cell) => claimedIds.has(cell.id));
    if (!claimedCells.length) {
      showGameMessage("Не вдалося купити: ці ділянки вже зайняті.");
      refreshVisibleCellLayers(cells.map((cell) => cell.id));
      render();
      return;
    }
    if (claimedCells.length < cells.length) {
      showGameMessage(`Куплено ${claimedCells.length} з ${cells.length} земельних ділянок. Частину вже зайняли інші гравці.`);
    }
    const finalPrice = claimedCells.reduce((sum, cell) => sum + cell.price, 0);
    if (state.coins < finalPrice) {
      showGameMessage(`Недостатньо коштів після оновлення карти. Потрібно ${money(finalPrice)}, на балансі ${money(state.coins)}.`);
      refreshVisibleCellLayers(cells.map((cell) => cell.id));
      render();
      return;
    }
    cells.length = 0;
    cells.push(...claimedCells);
  } catch (error) {
    showGameMessage(error.message);
    return;
  } finally {
    purchaseInProgress = false;
    buyButton.disabled = false;
  }

  const finalPrice = cells.reduce((sum, cell) => sum + cell.price, 0);
  state.coins -= finalPrice;
  const purchasedAt = new Date().toISOString();
  cells.forEach((cell) => {
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
      nickname: `${cell.region}, ${cell.code.slice(-5)}`
    };
  });
  state.stats.purchased += cells.length;
  addEvent(cells.length === 1
    ? `Куплено земельну ділянку ${cells[0].code} біля ${cells[0].region}.`
    : `Куплено земельних ділянок: ${cells.length} за ${money(finalPrice)}.`);
  addLedger("buy", `Купівля землі: ${cells.length} ділянок`, -finalPrice, cells.length);
  showGameMessage(cells.length === 1
    ? "Землю куплено. Дохід почне нараховуватися."
    : `Куплено земельних ділянок: ${cells.length}.`);
  refreshVisibleCellLayers(cells.map((cell) => cell.id));
  render();
  queueSave();
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

function demolishSelectedBuildings(cells = ownedSelectedCells()) {
  const targets = cells.filter((cell) => state.land[cell.id]?.building || state.land[cell.id]?.buildingId);
  if (!targets.length) return;
  if (!confirm(`Знести побудови на вибраних ділянках: ${targets.length}?`)) return;
  targets.forEach((cell) => {
    state.land[cell.id].building = null;
    state.land[cell.id].buildingId = null;
    state.land[cell.id].buildingLevel = 0;
  });
  state.stats.buildings = Object.values(state.land || {}).filter((owned) => owned.building || owned.buildingId).length;
  addEvent(`Знесено побудов: ${targets.length}.`);
  addLedger("building-demolish", `Знесено побудов: ${targets.length}`, 0, 0);
  refreshVisibleCellLayers(targets.map((cell) => cell.id));
  scheduleGridUpdate();
  render();
  queueSave();
}
function buyMachinery() {
  if (!Object.keys(state.land || {}).length) {
    showGameMessage("Спочатку купіть землю, щоб техніка давала дохід.");
    return;
  }
  openAssetPurchase("machinery");
}

let activeAssetKind = "machinery";
let assetCarouselIndex = 0;
let assetPhotoIndex = 0;

function assetItemsForKind(kind) {
  return kind === "elevators" ? (gameSettings?.assets?.elevatorItems || []) : (gameSettings?.assets?.machineryItems || []);
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
    return;
  }
  const item = selectedAssetItem();
  const items = assetItemsForKind(activeAssetKind);
  const maxQuantity = activeAssetKind === "elevators" ? buildableSelectedCells().length : Number.POSITIVE_INFINITY;
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
}

function assetCharacteristics(item, kind) {
  const rows = kind === "elevators"
    ? [
        ["Дохід", `${money(item.incomePerDay || 0)} / день`],
        ["Мінімум", `${minCellsForBuilding(item)} ділянок`],
        ["Ліміт", `${item.maxOwnerLandPercent || 25}% землі власника`],
        Number(item.serviceLifeExtensionDays) > 0 ? ["Техніка", `+${item.serviceLifeExtensionDays} днів до строку дії`] : null
      ]
    : [
        ["Бонус", `+${item.incomeBonusPercent || 0}% до доходу землі за одиницю`],
        ["Термін дії", `${item.durationDays || 100} днів`],
        ["Загальний бонус", `+${(item.incomeBonusPercent || 0) * (Math.max(1, Math.floor(Number(assetQuantity.value) || 1)))}%`]
      ];
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

function buyAsset(event) {
  event.preventDefault();
  if (activeAssetKind === "fertilizer") {
    buyFertilizerLevel();
    return;
  }
  const item = selectedAssetItem();
  const buildableCells = activeAssetKind === "elevators" ? buildableSelectedCells() : [];
  const quantity = activeAssetKind === "elevators"
    ? buildableCells.length
    : Math.max(1, Math.floor(Number(assetQuantity.value) || 1));
  const total = activeAssetKind === "elevators" ? (item?.cost || 0) : (item?.cost || 0) * quantity;
  if (!item) return;
  if (activeAssetKind === "elevators") {
    if (ownedSelectedCells().length !== buildableCells.length) {
      showGameMessage("Серед виділених ділянок уже є побудова. Спочатку знесіть стару побудову.");
      return;
    }
    if (buildableCells.length < minCellsForBuilding(item)) {
      showGameMessage(`Для "${item.name}" потрібно виділити мінімум ${minCellsForBuilding(item)} ваших ділянок без побудов.`);
      return;
    }
    const maxAllowed = maxBuildingCellsForOwner(item);
    const existingCells = buildingCellCountForItem(item.id);
    if (existingCells + buildableCells.length > maxAllowed) {
      showGameMessage(`Ліміт для "${item.name}": максимум ${maxAllowed} ділянок (${item.maxOwnerLandPercent || 25}% вашої землі). Зараз уже зайнято: ${existingCells}.`);
      return;
    }
    if (quantity > buildableCells.length) {
      showGameMessage("У виділених ділянках недостатньо місця без побудов.");
      return;
    }
  }
  if (state.coins < total) {
    showGameMessage(`Для покупки потрібно ${money(total)}.`);
    return;
  }
  state.coins -= total;
  if (activeAssetKind === "elevators") {
    const targetCells = buildableCells;
    const groupId = `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const buildingBuiltAt = new Date().toISOString();
    targetCells.forEach((cell) => {
      state.land[cell.id].building = item.id;
      state.land[cell.id].buildingId = item.id;
      state.land[cell.id].buildingGroupId = groupId;
      state.land[cell.id].buildingBuiltAt = buildingBuiltAt;
      state.land[cell.id].buildingLevel = 1;
    });
    state.stats.buildings = Object.values(state.land || {}).filter((owned) => owned.building || owned.buildingId).length;
    addEvent(`Побудовано: ${item.name}, ${quantity} комірок.`);
    addLedger("building", `${item.name}: ${quantity} комірок`, -total, 0);
    closeModals();
    showGameMessage(`Побудовано ${item.name}: ${quantity} комірок. Дохід +${money(item.incomePerDay || 0)} / день.`);
    scheduleGridUpdate();
    render();
    queueSave();
    return;
  }
  state.inventory = state.inventory || { machinery: {}, elevators: {} };
  const bucket = activeAssetKind === "elevators" ? "elevators" : "machinery";
  state.inventory[bucket] = state.inventory[bucket] || {};
  state.inventory[bucket][item.id] = (state.inventory[bucket][item.id] || 0) + quantity;
  if (bucket === "machinery") {
    const duration = Math.max(1, Number(item.durationDays) || 100);
    const extension = machineryServiceExtensionDays();
    state.inventory.machineryBatches = Array.isArray(state.inventory.machineryBatches) ? state.inventory.machineryBatches : [];
    state.inventory.machineryBatches.push({
      id: item.id,
      qty: quantity,
      purchasedDay: state.currentDay,
      expiresDay: state.currentDay + duration + extension
    });
    state.inventory = normalizeMachineryInventory(state.inventory, state.currentDay);
  }
  if (bucket === "elevators") state.stats.buildings += quantity;
  if (bucket === "machinery") state.stats.machinery += quantity;
  addEvent(`${bucket === "elevators" ? "Куплено побудову" : "Куплено техніку"}: ${item.name}, ${quantity} шт.`);
  addLedger(bucket === "elevators" ? "elevator" : "machinery", `${item.name}: ${quantity} шт.`, -total, 0);
  closeModals();
  showGameMessage(`Куплено ${item.name}: ${quantity} шт. Витрачено ${money(total)}.`);
  if (bucket === "elevators") scheduleGridUpdate();
  render();
  queueSave();
}

function buyFertilizerLevel() {
  const item = selectedFertilizerLevel();
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
  state.coins -= totalCost;
  cells.forEach((cell) => {
    state.land[cell.id].level = item.level;
  });
  state.stats.upgraded += cells.length;
  addEvent(cells.length === 1
    ? `На ділянці ${cells[0].id} застосовано ${item.name}.`
    : `Застосовано ${item.name} для ділянок: ${cells.length}.`);
  addLedger("upgrade", `${item.name}: ${cells.length} ділянок`, -totalCost, 0);
  closeModals();
  showGameMessage(`Інвестицію в добрива збережено: ${item.name}.`);
  refreshVisibleCellLayers(cells.map((cell) => cell.id));
  render();
  queueSave();
}

async function sellSelectedLand() {
  const cells = ownedSelectedCells();
  if (!cells.length) return;
  let soldCells = [];

  try {
    const payload = await requestJson("/api/sell", {
      method: "POST",
      body: JSON.stringify({ cells: cells.map((cell) => ({ id: cell.id, region: cell.region })) })
    });
    marketState = payload.market || marketState;
    const soldIds = new Set(Array.isArray(payload.soldIds) ? payload.soldIds : []);
    soldCells = cells.filter((cell) => soldIds.has(cell.id));
  } catch (error) {
    showGameMessage(error.message);
    return;
  }

  if (!soldCells.length) {
    showGameMessage("Продаж не виконано: ці ділянки вже не належать вам або карта оновилась.");
    refreshVisibleCellLayers(cells.map((cell) => cell.id));
    render();
    return;
  }

  const totalRefund = soldCells.reduce((sum, cell) => sum + sellValue(cell, state.land[cell.id]), 0);
  soldCells.forEach((cell) => delete state.land[cell.id]);
  state.stats.buildings = Object.values(state.land || {}).filter((owned) => owned.building || owned.buildingId).length;
  state.coins += totalRefund;
  selectedCellIds = new Set();
  selectedCellId = null;
  addEvent(`Продано земельних ділянок: ${soldCells.length}. Отримано ${money(totalRefund)}.`);
  addLedger("sell", `Продаж землі: ${soldCells.length} ділянок`, totalRefund, -soldCells.length);
  showGameMessage(`Землю продано системі за ${money(totalRefund)}.`);
  scheduleGridUpdate();
  render();
  queueSave();
}
function collectIncome() {
  const expired = expireMachinery(true);
  const income = totalDailyIncome();
  if (income <= 0) {
    showGameMessage("Спочатку купіть землю, щоб отримувати пасивний дохід.");
    return;
  }

  state.coins += income;
  state.currentDay += 1;
  state.stats.earned += income;
  state.lastIncomeAt = new Date().toISOString();
  addEvent(`Отримано денний дохід: ${money(income)}.`);
  addLedger("income", `Денний дохід за день ${state.currentDay}`, income, 0);
  showGameMessage(`Дохід нараховано: ${money(income)}.`);
  if (expired) addLedger("machinery-expired", "Списано техніку після завершення строку дії", 0, 0);
  render();
  queueSave();
}

function cellTooltip(cell, owner) {
  const settlementLine = `${cell.region}${Number.isFinite(cell.settlementDistanceKm) ? ` - ${cell.settlementDistanceKm.toFixed(1)} км` : ""}`;
  const displayPrice = owner === "free" ? priceForCellId(cell.id) : cell.price;
  if (owner === "player") {
    const breakdown = incomeBreakdown(cell, state.land[cell.id]);
    const buildingItem = buildingItemForCell(state.land[cell.id]);
    if (buildingItem) {
      return `
        <strong>${buildingMapEmojiForCell(state.land[cell.id])} ${escapeHtml(buildingItem.name)}</strong>
        <span>${settlementLine}</span>
        <em>Дохід побудови: ${money(breakdown.total)} / день</em>
      `;
    }
    return `
      <strong>${state.land[cell.id].nickname || "Ваша ділянка"}</strong>
      <span>${settlementLine}</span>
      <em>Дохід: ${money(breakdown.total)} / день</em>
      <em>Добрива: +${money(breakdown.landGain)} / день</em>
      <em>Техніка: +${money(breakdown.machineryGain)} / день</em>
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
    <em>Базовий дохід: ${money(cell.income)} / день</em>
  `;
}

function selectCell(cellId, event = null) {
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
  render();
  const cell = getCell(cellId);
  showGameMessage(selectedCellIds.size > 1
    ? `Обрано земельних ділянок: ${selectedCellIds.size}.`
    : `Обрано земельну ділянку ${cell.code} біля ${cell.region}.`);
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
  clusterSelectionMode = enabled;
  clusterSelectButton?.classList.toggle("is-active", enabled);
  mapBoard?.classList.toggle("is-cluster-mode", enabled);
  if (!map) return;
  if (enabled) {
    map.dragging.disable();
    showGameMessage("Режим виділення кластера: проведіть пальцем прямокутник або натискайте ділянки для додавання/зняття.");
  } else {
    map.dragging.enable();
  }
}

function toggleCellSelection(cellId) {
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

    cellTitle.textContent = `Виділено ${cells.length} земельних ділянок`;
    cellDetails.innerHTML = [
      ["Вільні", freeCells.length],
      ["Ваші", ownedCellsList.length],
    ["Інші гравці", rivalCells],
      ["Вартість купівлі", money(totalPrice)],
      ["Потенційний дохід", `${money(totalIncome)} / день`],
      ["Продаж системі", money(summary.sellTotal)]
    ].map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");

    setActionButton(buyButton, freeCells.length ? `Купити землю - ${money(totalPrice)}` : "Купити землю", "Нова земля дає базовий денний дохід");
    setActionButton(contactOwnerButton, "Зв'язатися з власником", "Оберіть одну зайняту чужу ділянку");
    setActionButton(upgradeButton, summary.upgradeCost ? `Добрива - ${money(summary.upgradeCost)}` : "Інвестиції в добрива", fertilizerLevelsNote());
    const builtCount = ownedSelectedCells().filter((cell) => state.land[cell.id]?.building || state.land[cell.id]?.buildingId).length;
    setActionButton(buildingButton, builtCount ? "Знести побудову" : "Побудувати", builtCount ? `Вибрано комірок з побудовою: ${builtCount}` : `Доступно без побудов: ${summary.buildableCount}; мінімум ${minBuildingCells()}`);
    setActionButton(machineryButton, "Купити техніку", "Кожна одиниця додає свій % до доходу");
    setActionButton(sellButton, summary.sellTotal ? `Продати - ${money(summary.sellTotal)}` : "Продати землю", "Повертає частину вартості системі");
    buyButton.disabled = !freeCells.length;
    if (contactOwnerButton) contactOwnerButton.disabled = true;
    upgradeButton.disabled = !summary.canUpgrade;
    buildingButton.disabled = !(summary.canBuild || builtCount);
    machineryButton.disabled = !summary.canBuyMachinery;
    sellButton.disabled = !summary.ownedCount;
    showSelectionPopup(`Виділено ${cells.length} ділянок · ваші ${ownedCellsList.length} · вільні ${freeCells.length}`);
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

  cellTitle.textContent = owner === "player"
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
    const buildingItem = buildingItemForCell(owned);
    if (buildingItem) {
      rows.push(["Побудова", `${escapeHtml(buildingMapEmojiForCell(owned))} ${escapeHtml(buildingItem.name)}`]);
      rows.push(["Дохід побудови", `${money(buildingItem.incomePerDay || 0)} / день`]);
      rows.push(["Техніка", "не застосовується до комірки з побудовою"]);
    } else {
      rows.push(["Рівень добрив", `${owned.level} · ${escapeHtml(fertilizerLevel(owned.level)?.name || "")}`]);
      rows.push(["Господарство", `${cluster ? cluster.size : 1} зем. у групі, бонус ${Math.round((cluster ? cluster.bonus : 0) * 100)}%`]);
      rows.push(["Базовий дохід", `${money(breakdown.base)} / день`]);
      rows.push(["Інвестиції в добрива", `+${money(breakdown.landGain)} / день (${fertilizerLevel(owned.level)?.incomeBonusPercent || 0}%)`]);
      rows.push(["Техніка", `+${money(breakdown.machineryGain)} / день (${breakdown.machineryPercent}%)`]);
      rows.push(["Бонус господарства", `+${money(breakdown.clusterGain)} / день`]);
    }
    rows.push(["Дохід", `${money(breakdown.total)} / день`]);
    rows.push(["Побудови загалом", inventoryDescription("elevators")]);
    rows.push(["Техніка", inventoryDescription("machinery")]);
    rows.push(["Продаж системі", money(sellValue(cell, owned))]);
  } else {
    rows.push(["Базовий дохід", `${money(cell.income)} / день`]);
  }

  cellDetails.innerHTML = rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");
  setActionButton(buyButton, owner === "free" ? `Купити землю - ${money(cell.price)}` : "Купити землю", "Нова земля дає базовий денний дохід");
  setActionButton(contactOwnerButton, "Зв'язатися з власником", "Написати власнику цієї ділянки");
  setActionButton(upgradeButton, owned && !owned.building && !owned.buildingId && owned.level < maxLandLevel() ? `Добрива - ${money(nextUpgradeCost(owned))}` : "Інвестиції в добрива", fertilizerLevelsNote());
  setActionButton(buildingButton, owned?.building || owned?.buildingId ? "Знести побудову" : "Побудувати", owned?.building || owned?.buildingId ? "Після знесення можна побудувати іншу" : `Потрібно мін. ${minBuildingCells()} ділянок без побудов`);
  setActionButton(machineryButton, "Купити техніку", "Кожна одиниця додає свій % до доходу");
  setActionButton(sellButton, owned ? `Продати - ${money(sellValue(cell, owned))}` : "Продати землю", "Повертає частину вартості системі");
  buyButton.disabled = owner !== "free";
  if (contactOwnerButton) contactOwnerButton.disabled = owner !== "rival" || !marketState?.land?.[selectedCellId]?.ownerId;
  upgradeButton.disabled = !owned || owned.building || owned.buildingId || owned.level >= maxLandLevel();
  buildingButton.disabled = !owned || (!(owned.building || owned.buildingId) && buildableSelectedCells().length < minBuildingCells());
  machineryButton.disabled = !owned;
  sellButton.disabled = !owned;
  showSelectionPopup(`${cellTitle.textContent} · ${owner === "free" ? "вільна" : owner === "player" ? "ваша" : "інший гравець"}`);
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
  ownedMetric.textContent = ownedCount;
  largestClusterMetric.textContent = clusters[0] ? clusters[0].length : 0;
  incomeMetric.textContent = money(income);
  assetMetric.textContent = `${inventoryCount("machinery")} тех. · ${money(buildingDailyIncome())}/день побуд. · ${money(value)}`;
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
  map.setView([cell.lat, cell.lng], DETAIL_ZOOM_MIN);
  window.setTimeout(() => {
    selectCell(cell.id);
  }, 220);
}

function returnToNews() {
  if (newsReturnState?.center && map) {
    map.setView(newsReturnState.center, newsReturnState.zoom || map.getZoom());
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
      ? `${escapeHtml(row.item.name)}: ${row.qty} шт. (${money((row.item.incomePerDay || 0) * row.qty)} / день)`
      : `${escapeHtml(row.item.name)}: ${row.qty} шт. (+${row.item.incomeBonusPercent || 0}% кожна, разом +${Math.round((row.item.incomeBonusPercent || 0) * row.qty)}%)`).join("<br>")
    : "немає";
}

function render() {
  renderPlayerHeader();
  renderSelectedCell();
  renderMetrics();
  renderLeaderboard();
  renderNews();
  replaceGameTerms(gameScreen);
}

function renderPlayerHeader() {
  const name = state.companyName || player?.username || "Гравець";
  playerName.innerHTML = `${state.logo ? `<img class="company-logo" src="${state.logo}" alt="">` : ""}<span>${escapeHtml(name)}</span>`;
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
    ["Дохід за день", money(totalDailyIncome())],
    ["Інвестиції", money(assetsValue())],
    ["Техніка", inventoryCount("machinery")],
    ["Побудови", inventoryCount("elevators")],
    ["Бонус техніки", `+${Math.round((inventoryIncomeMultiplier() - 1) * 100)}%`],
    ["Дохід побудов", `${money(buildingDailyIncome())} / день`],
    ["Зароблено всього", money(state.stats.earned || 0)],
    ["Куплено ділянок", state.stats.purchased || 0],
    ["Покращень", state.stats.upgraded || 0],
    ["Побудов", state.stats.buildings || 0],
    ["Техніки", state.stats.machinery || 0]
  ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
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
        ["Дохід за день", `${money(info.income || 0)} / день`]
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
  state.companyName = profileCompanyName.value.trim() || state.companyName;
  state.color = profileColor.value;
  renderPlayerHeader();

  try {
    const payload = await requestJson("/api/profile", {
      method: "POST",
      body: JSON.stringify({ farm: state })
    });
    state = normalizeState(payload.farm || state);
    marketState = payload.market || marketState;
    refreshVisibleCellLayers(Object.keys(state.land));
    render();
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
  adminUsers.innerHTML = "<p>Завантажуємо учасників...</p>";
  try {
    const payload = await requestJson("/api/admin");
    applyGameSettings(payload.settings || gameSettings);
    renderAdminSettings(gameSettings);
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
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
    ["baseIncomeMin", "Базовий дохід ділянки", economy.baseIncomeMin, "economy", "number"],
    ["baseIncomeSpread", "Розкид доходу", economy.baseIncomeSpread, "economy", "number"],
    ["nearbyPriceGrowthPercent", "% зростання ціни поруч", economy.nearbyPriceGrowthPercent, "economy", "number"],
    ["nearbyPriceRadius", "Радіус впливу ціни", economy.nearbyPriceRadius, "economy", "number"],
    ["sellRefundPercent", "% повернення при продажі", economy.sellRefundPercent, "economy", "number"],
    ["detailZoomMin", "Зум окремих ділянок", economy.detailZoomMin, "economy", "number"],
    ["maxVisibleCells", "Ліміт ділянок на екрані", economy.maxVisibleCells, "economy", "number"],
    ["claimBatchSize", "Пакет купівлі", economy.claimBatchSize, "economy", "number"],
    ["elevatorMinSelectedCells", "Ділянок для побудови", upgrades.elevatorMinSelectedCells, "upgrades", "number"],
  ];
  adminSettingsFields.innerHTML = fields.map(([name, label, value, group, type = "number"]) => `
    <label title="${escapeHtml(tips[`${group}.${name}`] || "")}">${label}<input name="${group}.${name}" type="${type}" step="0.01" value="${escapeHtml(value == null ? "" : value)}"></label>
  `).join("") + `
    ${renderLandLevelEditor(settings?.upgrades?.landLevels || LAND_LEVELS)}
    ${renderAssetEditor("machineryItems", "Техніка", settings?.assets?.machineryItems || [], tips.machineryItems)}
    ${renderAssetEditor("elevatorItems", "Побудови", settings?.assets?.elevatorItems || [], tips.elevatorItems)}
    ${renderClusterEditor(settings?.clusters || [])}
    ${renderStageEditor(settings?.stages || [])}
  `;
}

function renderLandLevelEditor(items) {
  return `
    <section class="settings-section wide-field" data-list="landLevels" title="Рівні інвестицій у добрива: рівень, назва, вартість і % впливу на дохід.">
      <div class="settings-section-head">
        <h5>Інвестиції в добрива</h5>
        <button class="secondary-action" type="button" data-add-item="landLevels">Додати</button>
      </div>
      <div class="settings-list compact-list">
        ${items.map((item) => `
          <div class="settings-card compact-card" data-item="landLevels">
            <label>Рівень <input data-field="level" type="number" min="1" value="${item.level || 1}"></label>
            <label>Назва <input data-field="name" value="${escapeHtml(item.name || "")}"></label>
            <label>Вартість <input data-field="cost" type="number" min="0" value="${item.cost || 0}"></label>
            <label>Вплив на дохід, % <input data-field="incomeBonusPercent" type="number" min="0" step="0.01" value="${item.incomeBonusPercent || 0}"></label>
            <button class="danger-action" type="button" data-remove-item>Видалити</button>
          </div>
        `).join("")}
      </div>
      <button class="primary-action settings-section-save" type="submit">Зберегти добрива</button>
    </section>
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
      <img src="${escapeHtml(src)}" alt="Фото ${index + 1}">
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
          <img src="${escapeHtml(src)}" alt="Фото ${index + 1}">
        </button>
      `).join("")}
    </div>
  `;
}

function renderAssetEditor(key, title, items, tip) {
  const isBuilding = key === "elevatorItems";
  return `
    <section class="settings-section wide-field" data-list="${key}" title="${escapeHtml(tip || "")}">
      <div class="settings-section-head">
        <h5>${title}</h5>
        <button class="secondary-action" type="button" data-add-item="${key}">Додати</button>
      </div>
      <div class="settings-list">
        ${items.map((item) => `
          <div class="settings-card asset-settings-card" data-item="${key}">
            <div class="icon-preview" data-icon-preview>${renderIconPreview(item.icon)}</div>
            <label>ID <input data-field="id" value="${escapeHtml(item.id || "")}"></label>
            <label>Іконка / emoji <input data-field="icon" value="${escapeHtml(item.icon || "")}"></label>
            <label>Картинка <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-icon-upload></label>
            <label>Назва <input data-field="name" value="${escapeHtml(item.name || "")}"></label>
            <label>Вартість <input data-field="cost" type="number" min="0" value="${item.cost || 0}"></label>
            ${isBuilding
              ? `
                <label>Дохід за день <input data-field="incomePerDay" type="number" min="0" value="${item.incomePerDay || 0}"></label>
                <label>Мінімум комірок <input data-field="minCells" type="number" min="1" value="${item.minCells || 1}"></label>
                <label>Макс. % землі власника <input data-field="maxOwnerLandPercent" type="number" min="1" max="100" step="0.01" value="${item.maxOwnerLandPercent || 25}"></label>
                <label>Продовження техніки, днів <input data-field="serviceLifeExtensionDays" type="number" min="0" value="${item.serviceLifeExtensionDays || 0}"></label>
                <label>Емоджі на карті <input data-field="mapEmoji" maxlength="8" value="${escapeHtml(item.mapEmoji || item.icon || "🏗")}"></label>
              `
              : `
                <label>Бонус доходу землі, % <input data-field="incomeBonusPercent" type="number" min="0" step="0.01" value="${item.incomeBonusPercent || 0}"></label>
                <label>Термін дії, днів <input data-field="durationDays" type="number" min="1" value="${item.durationDays || 100}"></label>
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
    </section>
  `;
}

function renderClusterEditor(items) {
  return `
    <section class="settings-section wide-field" data-list="clusters">
      <div class="settings-section-head">
        <h5>Бонуси господарств</h5>
        <button class="secondary-action" type="button" data-add-item="clusters">Додати</button>
      </div>
      <div class="settings-list compact-list">
        ${items.map((item) => `
          <div class="settings-card compact-card" data-item="clusters">
            <label>Від кількості ділянок <input data-field="min" type="number" min="1" value="${item.min || 1}"></label>
            <label>Бонус доходу, % <input data-field="bonusPercent" type="number" min="0" step="0.01" value="${item.bonusPercent || 0}"></label>
            <button class="danger-action" type="button" data-remove-item>Видалити</button>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStageEditor(items) {
  return `
    <section class="settings-section wide-field" data-list="stages">
      <div class="settings-section-head">
        <h5>Етапи гри</h5>
        <button class="secondary-action" type="button" data-add-item="stages">Додати</button>
      </div>
      <div class="settings-list">
        ${items.map((item) => `
          <div class="settings-card stage-card" data-item="stages">
            <label>Назва <input data-field="title" value="${escapeHtml(item.title || "")}"></label>
            <label>Мін. землі <input data-field="min" type="number" min="0" value="${item.min || 0}"></label>
            <label class="wide-field">Опис <input data-field="text" value="${escapeHtml(item.text || "")}"></label>
            <button class="danger-action" type="button" data-remove-item>Видалити</button>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function settingTips() {
  return {
    "economy.startingCoins": "Скільки грошей отримує новий гравець. Приклад: 500.",
    "economy.baseLandPriceMin": "Базова ціна вільної ділянки. Якщо розкид ціни 0 і поруч немає зайнятої землі, на карті буде саме ця ціна.",
    "economy.baseLandPriceSpread": "Додатковий випадковий розкид. 0 = усі ділянки стартують з базової ціни; 90 = базова ціна +0..89.",
    "economy.baseIncomeMin": "Базовий денний дохід ділянки. Якщо розкид доходу 0, на карті буде саме це значення.",
    "economy.baseIncomeSpread": "Додатковий випадковий розкид доходу. 0 = однаковий базовий дохід; 18 = +0..17 мон.",
    "economy.nearbyPriceGrowthPercent": "На скільки % кожна зайнята сусідня ділянка піднімає ціну. Щоб ціна завжди дорівнювала базовій, поставте 0.",
    "economy.nearbyPriceRadius": "Скільки кілець сусідніх ділянок враховувати для ціни. Приклад: 2.",
    "economy.sellRefundPercent": "Скільки % вкладеної вартості повертається при продажі землі.",
    "economy.detailZoomMin": "З якого масштабу показувати окремі земельні ділянки.",
    "economy.maxVisibleCells": "Ліміт ділянок, які малюються на екрані. Впливає на швидкість.",
    "economy.claimBatchSize": "Скільки ділянок купується одним запитом.",
    "upgrades.landMaxLevel": "Максимальний рівень інвестицій у добрива.",
    "upgrades.elevatorMinSelectedCells": "Скільки ваших ділянок треба виділити, щоб побудувати об'єкт.",
    machineryItems: "Налаштування техніки: іконка, назва, вартість, бонус до доходу земель, термін дії і фото для перегляду під час купівлі.",
    elevatorItems: "Налаштування побудов: іконка, емоджі на карті, назва, вартість, дохід за день, мінімум ділянок, максимальна частка від землі власника, продовження строку техніки і фото."
  };
}

function settingsFromForm(form) {
  const next = JSON.parse(JSON.stringify(gameSettings || {}));
  const data = new FormData(form);
  data.forEach((value, key) => {
    const [group, name] = key.split(".");
    if (!group || !name) return;
    if (!next[group]) next[group] = {};
    next[group][name] = Number(value);
  });
  next.assets = next.assets || {};
  next.upgrades = next.upgrades || {};
  next.upgrades.landLevels = collectSettingsCards("landLevels").map((item) => ({
    level: Number(item.level) || 1,
    name: item.name || "Добрива",
    cost: Number(item.cost) || 0,
    incomeBonusPercent: Number(item.incomeBonusPercent) || 0
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
    text: item.text || ""
  }));
  next.rivals = [];
  return next;
}

function collectSettingsCards(listName) {
  return [...adminSettingsFields.querySelectorAll(`[data-item="${listName}"]`)].map((card) => {
    const row = {};
    card.querySelectorAll("[data-field]").forEach((input) => {
      row[input.dataset.field] = input.value;
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
    mapEmoji: item.mapEmoji || item.icon || "•",
    name: item.name || "Актив",
    cost: Number(item.cost) || 0,
    incomeBonusPercent: Number(item.incomeBonusPercent) || 0,
    durationDays: Math.max(1, Math.floor(Number(item.durationDays) || 100)),
    incomePerDay: Number(item.incomePerDay) || 0,
    minCells: Math.max(1, Math.floor(Number(item.minCells) || 1)),
    maxOwnerLandPercent: Math.min(100, Math.max(1, Number(item.maxOwnerLandPercent) || 25)),
    serviceLifeExtensionDays: Math.max(0, Math.floor(Number(item.serviceLifeExtensionDays) || 0)),
    photos: parsePhotosValue(item.photos).slice(0, 8)
  };
}

function renderAdminSummary(summary, market, users = []) {
  const occupiedLand = Number.isFinite(summary.occupiedLand) ? summary.occupiedLand : Object.keys(market.land || {}).length;
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
  const newestUsers = [...(Array.isArray(users) ? users : [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 40);
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
  const radiusKm = REGULAR_HEX_RADIUS_METERS / 1000;
  const areaKm2 = (3 * Math.sqrt(3) / 2) * radiusKm * radiusKm;
  return Math.round(603700 / areaKm2);
}

function renderAdminUsers(users) {
  const machineryItems = gameSettings?.assets?.machineryItems || [];
  const elevatorItems = gameSettings?.assets?.elevatorItems || [];
  adminUsers.innerHTML = users.map((user) => `
    <form class="admin-user" data-user-id="${user.id}">
      <div class="admin-user-title">
        <strong>${escapeHtml(user.username)}</strong>
        <span>${user.landCount || 0} зем. · ${money(user.coins || 0)}</span>
      </div>
      <label>Логін <input name="username" value="${escapeHtml(user.username || "")}" ${user.username === "Admin" ? "readonly" : ""}></label>
      <label>Компанія <input name="companyName" value="${escapeHtml(user.companyName || "")}"></label>
      <label>Гроші <input name="coins" type="number" min="0" value="${user.coins || 0}"></label>
      <label>День <input name="currentDay" type="number" min="1" value="${user.currentDay || 1}"></label>
      <label>Колір <input name="color" type="color" value="${user.color || "#35c982"}"></label>
      <label class="inline-check"><input name="isAdmin" type="checkbox" ${user.isAdmin ? "checked" : ""}> Адмін</label>
      <div class="admin-user-stats">
        <span>Інвестиції: ${money(user.score || 0)}</span>
        <span>Дохід: ${money(user.income || 0)} / день</span>
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
        <button class="danger-action" type="submit" name="resetLand" value="1">Обнулити землю</button>
        ${user.username === "Admin" ? "" : `<button class="danger-action" type="button" data-delete-user="${user.id}">Видалити</button>`}
      </div>
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
            <span class="asset-icon"><span>${escapeHtml(item.mapEmoji || "🏗")}</span></span>
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
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (!userId || userId === player?.id) state = normalizeState(payload.farm || { ...state, events: [] });
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
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    marketState = payload.market || marketState;
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
  document.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.toggle("is-active", item.dataset.adminTab === tab));
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.adminPanel !== tab));
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
  body.resetLand = event.submitter?.name === "resetLand";
  body.inventory = { machinery: {}, elevators: {} };
  new FormData(form).forEach((value, key) => {
    const parts = key.split(".");
    if (parts[0] !== "inventory" || !parts[1] || !parts[2]) return;
    body.inventory[parts[1]][parts.slice(2).join(".")] = Math.max(0, Math.floor(Number(value) || 0));
  });
  if (body.resetLand && !confirm("Обнулити землі цього учасника?")) return;
  const restoreButton = setSavingButton(event.submitter, true);
  try {
    const payload = await requestJson("/api/admin/user", { method: "POST", body: JSON.stringify(body) });
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    marketState = payload.market || marketState;
    if (body.id === player?.id) {
      state = normalizeState(payload.farm || state);
    }
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
  const restoreButton = setSavingButton(event.submitter, true);
  try {
    const payload = await requestJson("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ settings: settingsFromForm(adminSettingsForm) })
    });
    applyGameSettings(payload.settings);
    renderAdminSettings(gameSettings);
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
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
    machineryItems: { id: `tractor-${stamp}`, icon: "🚜", name: "Новий трактор", cost: 500, incomeBonusPercent: 1, durationDays: 100, photos: [] },
    elevatorItems: { id: `elevator-${stamp}`, icon: "🏗", mapEmoji: "🏗", name: "Нова побудова", cost: 1200, incomePerDay: 75, minCells: 3, maxOwnerLandPercent: 25, serviceLifeExtensionDays: 0, photos: [] },
    landLevels: { level: LAND_LEVELS.length + 1, name: "Новий рівень добрив", cost: 100, incomeBonusPercent: 10 },
    clusters: { min: 10, bonusPercent: 5 },
    stages: { title: "Новий етап", min: 0, text: "Опис етапу" },
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

function handleSettingsClick(event) {
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
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    marketState = payload.market || { land: {} };
    state = normalizeState(payload.farm || { ...state, land: {} });
    selectedCellIds = new Set();
    selectedCellId = null;
    if (gridMarkerLayer) {
      gridMarkerLayer.clearLayers();
      cellLayerById = new Map();
    }
    scheduleGridUpdate();
    refreshLeaderboard();
    render();
    showGameMessage("Всі землі обнулено.");
  } catch (error) {
    showGameMessage(error.message);
  }
}

async function resetAllMoney() {
  if (!confirm("Обнулити гроші всіх учасників до стартового балансу?")) return;
  try {
    const payload = await requestJson("/api/admin/reset-money", { method: "POST", body: "{}" });
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (payload.farm) state = normalizeState(payload.farm);
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
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    if (payload.farm) state = normalizeState(payload.farm);
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
    renderAdminSummary(payload.summary || {}, payload.market || { land: {} }, payload.users || []);
    renderAdminUsers(payload.users || []);
    marketState = payload.market || { land: {} };
    if (payload.farm) state = normalizeState(payload.farm);
    selectedCellIds = new Set();
    selectedCellId = null;
    scheduleGridUpdate();
    refreshLeaderboard();
    render();
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

forgotPasswordLink?.addEventListener("click", () => {
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

loginForm.addEventListener("submit", async (event) => {
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

registerForm.addEventListener("submit", async (event) => {
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

recoverForm?.addEventListener("submit", async (event) => {
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

resetForm?.addEventListener("submit", async (event) => {
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

buyButton.addEventListener("click", buySelectedCell);
contactOwnerButton?.addEventListener("click", () => {
  const ownerId = marketState?.land?.[selectedCellId]?.ownerId;
  if (ownerId) openChat(ownerId);
});
upgradeButton.addEventListener("click", upgradeSelectedCell);
buildingButton.addEventListener("click", buildOnSelectedCell);
machineryButton.addEventListener("click", buyMachinery);
sellButton.addEventListener("click", sellSelectedLand);
incomeButton.addEventListener("click", collectIncome);
closeSelectionPopup?.addEventListener("click", () => {
  selectionPopupDismissed = true;
  setClusterSelectionMode(false);
  hideSelectionPopup();
});
closeCellInfoButton?.addEventListener("click", hideCellInfoPanel);
detailInfoButton?.addEventListener("click", showCellInfoPanel);
clusterSelectButton?.addEventListener("click", () => setClusterSelectionMode(!clusterSelectionMode));
newsButton?.addEventListener("click", openNewsPanel);
returnToNewsButton?.addEventListener("click", returnToNews);
cellDetails.addEventListener("click", (event) => {
  const ownerButton = event.target.closest("[data-owner-id]");
  if (ownerButton) showOwnerInfo(ownerButton.dataset.ownerId);
});
leaderboard?.addEventListener("click", (event) => {
  const row = event.target.closest("[data-leader-player]");
  if (row?.dataset.leaderPlayer) showOwnerInfo(row.dataset.leaderPlayer);
});
ownerInfo?.addEventListener("click", (event) => {
  const contact = event.target.closest("[data-contact-player]");
  if (contact?.dataset.contactPlayer) openChat(contact.dataset.contactPlayer);
});
profileButton.addEventListener("click", () => {
  renderProfileForm();
  openModal(profileModal);
});
helpButton.addEventListener("click", () => openModal(helpModal));
messagesButton?.addEventListener("click", openMessagesPanel);
logoutButton?.addEventListener("click", logoutPlayer);
chatList?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-chat-user]");
  if (item?.dataset.chatUser) openChat(item.dataset.chatUser);
});
messageForm?.addEventListener("submit", sendChatMessage);
newsList?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-news-cell]");
  if (item?.dataset.newsCell) focusNewsTarget(item.dataset.newsCell);
});
document.querySelectorAll("[data-admin-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    activateAdminTab(button.dataset.adminTab);
  });
});
profileForm.addEventListener("submit", saveProfile);
profileLogo.addEventListener("change", loadProfileLogo);
adminStats?.addEventListener("click", (event) => {
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
adminUsers.addEventListener("submit", saveAdminUser);
adminUsers.addEventListener("click", (event) => {
  const button = event.target.closest("[data-player-stats]");
  if (button) showPlayerStats(button.dataset.playerStats);
  const clearButton = event.target.closest("[data-clear-events]");
  if (clearButton) clearEvents(clearButton.dataset.clearEvents);
  const deleteButton = event.target.closest("[data-delete-user]");
  if (deleteButton) deleteUser(deleteButton.dataset.deleteUser);
});
adminSettingsForm.addEventListener("submit", saveAdminSettings);
adminSettingsFields.addEventListener("click", handleSettingsClick);
adminSettingsFields.addEventListener("input", handleSettingsInput);
adminSettingsFields.addEventListener("change", handleSettingsFile);
adminResetLandButton.addEventListener("click", resetAllLand);
adminResetMoneyButton.addEventListener("click", resetAllMoney);
adminResetMachineryButton?.addEventListener("click", resetAllMachinery);
adminResetAssetsButton?.addEventListener("click", resetAllAssets);
adminClearEventsButton.addEventListener("click", () => clearEvents(""));
assetForm.addEventListener("submit", buyAsset);
assetOptions.addEventListener("change", updateAssetTotal);
assetQuantity.addEventListener("input", updateAssetTotal);
assetTotal.addEventListener("click", (event) => {
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
adminSettingsFields.addEventListener("click", (event) => {
  const photoButton = event.target.closest("[data-preview-src]");
  if (photoButton) openPreviewFromButton(photoButton);
});
imagePreviewPrev?.addEventListener("click", () => stepImagePreview(-1));
imagePreviewNext?.addEventListener("click", () => stepImagePreview(1));
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

replaceGameTerms(document.body);
initSplashMap();

requestJson("/api/me")
  .then((payload) => {
    if (payload.player.isGuest) return;
    startGame(payload.player, payload.farm);
  })
  .catch(() => {});
