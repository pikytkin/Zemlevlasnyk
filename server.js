const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const polygonClipping = require("polygon-clipping");
const zlib = require("zlib");
const GameRules = require("./public/game-rules");
const Land = require("./lib/land");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const rows = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  rows.forEach((row) => {
    const line = row.trim();
    if (!line || line.startsWith("#")) return;
    const equalsAt = line.indexOf("=");
    if (equalsAt < 1) return;
    const key = line.slice(0, equalsAt).trim();
    let value = line.slice(equalsAt + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = process.env.AGRO_DATA_DIR ? path.resolve(process.env.AGRO_DATA_DIR) : path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.txt");
const MARKET_FILE = path.join(DATA_DIR, "market.txt");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const NEWS_FILE = path.join(DATA_DIR, "news.txt");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";
const DATABASE_URL = process.env.DATABASE_URL || "";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://zemlevlasnyk.com";
// Deployment mode must be explicit. A production database URL is also useful for local
// maintenance, where refusing to boot because NODE_ENV was omitted is needlessly disruptive.
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SESSION_COOKIE_SECURE = IS_PRODUCTION || process.env.SESSION_COOKIE_SECURE === "true";
const BASE_RIVALS = [];

const DEFAULT_SETTINGS = {
  economy: {
    startingCoins: 11700,
    baseLandPriceMin: 1800,
    baseLandPriceSpread: 0,
    baseIncomeMin: 180,
    baseIncomeSpread: 0,
    nearbyPriceGrowthPercent: 6,
    nearbyPriceRadius: 2,
    sellRefundPercent: 50,
    incomeCycleMinutes: 1440,
    offlineIncomeCapHours: 168,
    ownershipPriceMultipliers: [
      { minOwned: 0, multiplier: 1 },
      { minOwned: 6, multiplier: 1.1 },
      { minOwned: 16, multiplier: 1.25 },
      { minOwned: 31, multiplier: 1.5 },
      { minOwned: 61, multiplier: 1.8 },
      { minOwned: 101, multiplier: 2.2 },
      { minOwned: 201, multiplier: 2.8 },
      { minOwned: 501, multiplier: 3.5 }
    ],
    maxVisibleCells: 46000,
    detailZoomMin: 10,
    claimBatchSize: 1000,
    drawGrid: true
  },
  map: {
    zoomPresets: [
      { displayZoom: 5, mapZoom: 5, mode: "overview", showFreeGrid: false, freeGridOpacity: 0, maxVisibleCells: 2500 },
      { displayZoom: 7, mapZoom: 7, mode: "overview", showFreeGrid: false, freeGridOpacity: 0, maxVisibleCells: 7000 },
      { displayZoom: 10, mapZoom: 10, mode: "detail", showFreeGrid: true, freeGridOpacity: 0.12, maxVisibleCells: 18000 },
      { displayZoom: 12, mapZoom: 12, mode: "detail", showFreeGrid: true, freeGridOpacity: 0.26, maxVisibleCells: 46000 }
    ],
    maxOwnedCellsPerViewport: 50000,
    overviewMaxTerritories: 8000,
    cellWidthDegrees: 0.018,
    cellHeightDegrees: 0.012,
    gridCellCount: 363019
  },
  upgrades: {
    landMaxLevel: 5,
    landLevels: [
      { level: 1, name: "Без добрив", cost: 0, incomeBonusPercent: 0 },
      { level: 2, name: "Базові добрива", cost: 900, incomeBonusPercent: 25 },
      { level: 3, name: "Посилені добрива", cost: 1500, incomeBonusPercent: 60 },
      { level: 4, name: "Преміум добрива", cost: 2400, incomeBonusPercent: 110 },
      { level: 5, name: "Агрохімія повного циклу", cost: 3600, incomeBonusPercent: 175 }
    ],
    elevatorMinSelectedCells: 3,
  },
  assets: {
    machineryItems: [
      { id: "tractor-basic", icon: "🚜", name: "Трактор базовий", cost: 3600, incomeBonusPercent: 8, durationDays: 80, minCells: 10, photos: [] }
    ],
    elevatorItems: [
      { id: "elevator-basic", icon: "🏗", name: "Елеватор базовий", cost: 9000, incomePerDay: 900, minCells: 3, maxOwnerLandPercent: 20, photos: [] }
    ]
  },
  clusters: [
    { min: 5, bonusPercent: 2 },
    { min: 15, bonusPercent: 5 },
    { min: 40, bonusPercent: 9 },
    { min: 100, bonusPercent: 15 },
    { min: 250, bonusPercent: 22 },
    { min: 500, bonusPercent: 28 }
  ],
  stages: [
    { title: "Початок", min: 0, text: "Купуйте перші ділянки та формуйте базу господарства.", landPriceMultiplier: 1 },
    { title: "Господарство", min: 5, text: "Земля поруч підвищує ціну наступної покупки, а з'єднані ділянки дають бонус до доходу.", landPriceMultiplier: 1 },
    { title: "Компанія", min: 15, text: "З'єднані ділянки дають відчутний бонус до доходу.", landPriceMultiplier: 1.1 },
    { title: "Агрохолдинг", min: 40, text: "Розвивайте побудови, техніку і рівні землі.", landPriceMultiplier: 1.5 },
    { title: "Корпорація", min: 100, text: "Масштабуйте виробництво та баланс між землею й активами.", landPriceMultiplier: 2.2 },
    { title: "Національна корпорація", min: 250, text: "Гравець бореться за лідерство на карті України.", landPriceMultiplier: 2.8 }
  ],
  rivals: BASE_RIVALS
};

const sessions = new Map();
let previousNewsLeaders = { land: null, assets: null };
let newsCache = { key: "", rows: [] };
let storage = null;
let dbPool = null;
let deferredUsersPersistTimer = null;
let deferredMarketPersistTimer = null;
let deferredSessionsPersistTimer = null;
let marketVersion = 1;
let leaderboardVersion = 1;
let leaderboardCache = { version: 0, rows: [] };
let mapOverviewCache = new Map();
let mapCellsCache = new Map();

const MAP_BOUNDS = { south: 43.2, west: 21.0, north: 53.0, east: 41.2 };
const BASE_RECT_CELL_WIDTH_DEGREES = 0.018;
const BASE_RECT_CELL_HEIGHT_DEGREES = 0.012;
const BASE_PLAYABLE_CELL_COUNT = 363019;
let RECT_CELL_WIDTH_DEGREES = BASE_RECT_CELL_WIDTH_DEGREES;
let RECT_CELL_HEIGHT_DEGREES = BASE_RECT_CELL_HEIGHT_DEGREES;
const MARKET_INDEX_SPAN = 32;
const PLAYABLE_GRID_FILE = path.join(PUBLIC_DIR, "playable-grid.json");
let playableGridRowsCache = null;
let marketSpatialIndex = null;
let marketSpatialIndexVersion = 0;
const MAX_VIEWPORT_MARKET_CELLS = 6000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "", "utf8");
  }
  if (!fs.existsSync(MARKET_FILE)) {
    fs.writeFileSync(MARKET_FILE, JSON.stringify({ land: {} }, null, 2), "utf8");
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
  }
  if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, "[]", "utf8");
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, "[]", "utf8");
  }
}

function readFileStorageSnapshot() {
  ensureDataFiles();
  const users = fs.readFileSync(USERS_FILE, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => JSON.parse(row));

  let market = { land: {} };
  let settings = DEFAULT_SETTINGS;
  let news = [];

  try {
    market = JSON.parse(fs.readFileSync(MARKET_FILE, "utf8") || "{}");
  } catch {
    market = { land: {} };
  }

  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8") || "{}");
  } catch {
    settings = DEFAULT_SETTINGS;
  }

  try {
    const rows = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8") || "[]");
    news = Array.isArray(rows) ? rows : [];
  } catch {
    news = [];
  }

  let savedSessions = [];
  try {
    const rows = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8") || "[]");
    savedSessions = Array.isArray(rows) ? rows : [];
  } catch {
    savedSessions = [];
  }
  return { users, market, settings, news, messages: [], passwordResets: [], sessions: savedSessions };
}

async function initDatabaseStorage() {
  if (!DATABASE_URL) return null;

  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_users (
      id text PRIMARY KEY,
      username text NOT NULL,
      email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS game_land (
      cell_id text PRIMARY KEY,
      owner_id text NOT NULL,
      state jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS game_transactions (
      id uuid PRIMARY KEY,
      user_id text NOT NULL,
      type text NOT NULL,
      amount integer NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS game_assets (
      id uuid PRIMARY KEY,
      user_id text NOT NULL,
      kind text NOT NULL,
      item_id text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS game_sessions (
      token text PRIMARY KEY,
      user_id text NOT NULL,
      is_guest boolean NOT NULL DEFAULT false,
      last_seen_at bigint NOT NULL,
      expires_at bigint NOT NULL
    );
    CREATE INDEX IF NOT EXISTS game_land_owner_idx ON game_land (owner_id);
    CREATE INDEX IF NOT EXISTS game_sessions_expires_idx ON game_sessions (expires_at);
  `);

  const snapshot = readFileStorageSnapshot();
  for (const [key, value] of Object.entries(snapshot)) {
    await pool.query(
      `INSERT INTO app_state (key, value)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    );
  }

  const rows = await pool.query("SELECT key, value FROM app_state");
  const state = Object.fromEntries(rows.rows.map((row) => [row.key, row.value]));
  dbPool = pool;
  return {
    users: Array.isArray(state.users) ? state.users : [],
    market: state.market && typeof state.market === "object" ? state.market : { land: {} },
    settings: state.settings && typeof state.settings === "object" ? state.settings : DEFAULT_SETTINGS,
    news: Array.isArray(state.news) ? state.news : [],
    messages: Array.isArray(state.messages) ? state.messages : [],
    passwordResets: Array.isArray(state.passwordResets) ? state.passwordResets : [],
    sessions: Array.isArray(state.sessions) ? state.sessions : []
  };
}

function persistState(key) {
  if (!dbPool || !storage) return;
  dbPool.query(
    `INSERT INTO app_state (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(storage[key])]
  ).catch((error) => {
    console.error(`Failed to persist ${key}:`, error.message);
  });
}

function persistUsersToFile() {
  if (!storage) return;
  ensureDataFiles();
  const content = (Array.isArray(storage.users) ? storage.users : []).map((user) => JSON.stringify(user)).join("\n");
  fs.writeFileSync(USERS_FILE, content ? `${content}\n` : "", "utf8");
}

function scheduleUsersPersistence(delayMs = 350) {
  clearTimeout(deferredUsersPersistTimer);
  deferredUsersPersistTimer = setTimeout(() => {
    deferredUsersPersistTimer = null;
    if (dbPool) persistState("users");
    else persistUsersToFile();
  }, Math.max(0, delayMs));
}

function persistMarketToFile() {
  if (!storage) return;
  ensureDataFiles();
  fs.writeFileSync(MARKET_FILE, JSON.stringify(storage.market || { land: {} }), "utf8");
}

function scheduleMarketPersistence(delayMs = 350) {
  clearTimeout(deferredMarketPersistTimer);
  deferredMarketPersistTimer = setTimeout(() => {
    deferredMarketPersistTimer = null;
    persistMarketToFile();
  }, Math.max(0, delayMs));
}

function persistMarketPatch(upserts = {}, deleteIds = []) {
  if (!dbPool || !storage) return false;
  const safeDeletes = (Array.isArray(deleteIds) ? deleteIds : []).filter(isPlayableLandId);
  const safeUpserts = Object.fromEntries(Object.entries(upserts || {}).filter(([id]) => isPlayableLandId(id)));
  dbPool.query(
    `UPDATE app_state
     SET value = jsonb_set(
       value,
       '{land}',
       (COALESCE(value->'land', '{}'::jsonb) - $2::text[]) || $1::jsonb,
       true
     ), updated_at = now()
     WHERE key = 'market'`,
    [JSON.stringify(safeUpserts), safeDeletes]
  ).catch((error) => {
    console.error(`Failed to persist market patch:`, error.message);
    // Keep the in-memory state authoritative for this process; a later full write can heal DB state.
  });
  return true;
}

async function initStorage() {
  storage = await initDatabaseStorage();
  if (!storage) storage = readFileStorageSnapshot();
  const now = Date.now();
  (Array.isArray(storage.sessions) ? storage.sessions : []).forEach(([token, session]) => {
    if (!token || !session || session.expiresAt <= now) return;
    sessions.set(token, session);
  });
}

function persistSessions() {
  if (!storage) return;
  const now = Date.now();
  storage.sessions = [...sessions.entries()]
    .filter(([, session]) => session?.expiresAt > now)
    .map(([token, session]) => [token, session]);
  if (dbPool) {
    persistState("sessions");
    return;
  }
  ensureDataFiles();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(storage.sessions), "utf8");
}

function scheduleSessionsPersistence(delayMs = 350) {
  clearTimeout(deferredSessionsPersistTimer);
  deferredSessionsPersistTimer = setTimeout(() => {
    deferredSessionsPersistTimer = null;
    persistSessions();
  }, Math.max(0, delayMs));
}

function numberIn(value, fallback, min = 0, max = 1_000_000_000) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function intIn(value, fallback, min = 0, max = 1_000_000_000) {
  return Math.floor(numberIn(value, fallback, min, max));
}

function safeDecodeURIComponent(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
}

function isPlayableLandId(id) {
  return Land.isPlayableLandId(id);
}

function compactMarketEntry(entry = {}) {
  return {
    ownerId: String(entry.ownerId || "").slice(0, 64),
    ownerName: String(entry.ownerName || "Гравець").slice(0, 80),
    ownerColor: /^#[0-9a-f]{6}$/i.test(entry.ownerColor || "") ? entry.ownerColor : "#ef7669",
    level: Number.isFinite(entry.level) ? Math.max(1, Math.floor(entry.level)) : 1
  };
}

function cleanMarketLand(land) {
  if (!land || typeof land !== "object" || Array.isArray(land)) return {};
  return Object.fromEntries(Object.entries(land)
    .filter(([id, entry]) => isPlayableLandId(id) && entry?.ownerId)
    .map(([id, entry]) => [id, compactMarketEntry(entry)]));
}

function numberArray(value, fallback, maxLength = 12) {
  const source = Array.isArray(value) ? value : fallback;
  return source.slice(0, maxLength).map((item, index) => numberIn(Number(item), Number.isFinite(fallback[index]) ? fallback[index] : 0, 0, 100_000_000));
}

function sanitizeOwnershipPriceMultipliers(items, fallback = DEFAULT_SETTINGS.economy.ownershipPriceMultipliers) {
  const source = Array.isArray(items) && items.length ? items : fallback;
  return source
    .slice(0, 16)
    .map((item, index) => ({
      minOwned: intIn(item?.minOwned, fallback[index]?.minOwned || 0, 0, 1000000),
      multiplier: numberIn(Number(item?.multiplier), fallback[index]?.multiplier || 1, 0.1, 100)
    }))
    .sort((a, b) => a.minOwned - b.minOwned);
}

function sanitizeSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const economy = source.economy && typeof source.economy === "object" ? source.economy : {};
  const mapSettings = source.map && typeof source.map === "object" ? source.map : {};
  const upgrades = source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {};
  const assets = source.assets && typeof source.assets === "object" ? source.assets : {};
  const defaults = DEFAULT_SETTINGS;

  return {
    economy: {
      startingCoins: intIn(economy.startingCoins, defaults.economy.startingCoins, 0),
      baseLandPriceMin: intIn(economy.baseLandPriceMin, defaults.economy.baseLandPriceMin, 1),
      baseLandPriceSpread: intIn(economy.baseLandPriceSpread, defaults.economy.baseLandPriceSpread, 0),
      baseIncomeMin: intIn(economy.baseIncomeMin, defaults.economy.baseIncomeMin, 0),
      baseIncomeSpread: intIn(economy.baseIncomeSpread, defaults.economy.baseIncomeSpread, 0),
      nearbyPriceGrowthPercent: numberIn(Number(economy.nearbyPriceGrowthPercent), defaults.economy.nearbyPriceGrowthPercent, -95, 1000),
      nearbyPriceRadius: intIn(economy.nearbyPriceRadius, defaults.economy.nearbyPriceRadius, 1, 5),
      sellRefundPercent: numberIn(Number(economy.sellRefundPercent), defaults.economy.sellRefundPercent, 0, 100),
      incomeCycleMinutes: intIn(economy.incomeCycleMinutes, defaults.economy.incomeCycleMinutes, 5, 1440),
      offlineIncomeCapHours: intIn(economy.offlineIncomeCapHours, defaults.economy.offlineIncomeCapHours, 1, 168),
      ownershipPriceMultipliers: sanitizeOwnershipPriceMultipliers(economy.ownershipPriceMultipliers, defaults.economy.ownershipPriceMultipliers),
      maxVisibleCells: intIn(economy.maxVisibleCells, defaults.economy.maxVisibleCells, 1000, 500000),
      detailZoomMin: intIn(economy.detailZoomMin, defaults.economy.detailZoomMin, 10, 12),
      claimBatchSize: intIn(economy.claimBatchSize, defaults.economy.claimBatchSize, 1, 3000),
      drawGrid: typeof economy.drawGrid === "boolean" ? economy.drawGrid : defaults.economy.drawGrid
    },
    map: sanitizeMapSettings(mapSettings, defaults.map),
    upgrades: {
      landMaxLevel: intIn(upgrades.landMaxLevel, defaults.upgrades.landMaxLevel, 1, 10),
      landLevels: sanitizeLandLevels(upgrades.landLevels, upgrades, defaults.upgrades.landLevels),
      elevatorMinSelectedCells: intIn(upgrades.elevatorMinSelectedCells, defaults.upgrades.elevatorMinSelectedCells, 1, 50)
    },
    assets: {
      machineryItems: sanitizeAssetItems(assets.machineryItems, defaults.assets.machineryItems),
      elevatorItems: sanitizeAssetItems(assets.elevatorItems, defaults.assets.elevatorItems)
    },
    clusters: (Array.isArray(source.clusters) ? source.clusters : defaults.clusters)
      .slice(0, 8)
      .map((item) => ({
        min: intIn(item?.min, 1, 1, 1000000),
        bonusPercent: numberIn(Number(item?.bonusPercent), 0, 0, 1000)
      }))
      .sort((a, b) => a.min - b.min),
    stages: (Array.isArray(source.stages) ? source.stages : defaults.stages)
      .slice(0, 10)
      .map((item, index) => {
        const min = intIn(item?.min, defaults.stages[index]?.min || 0, 0, 1000000);
        return {
          title: String(item?.title || defaults.stages[index]?.title || "Етап").slice(0, 40),
          min,
          text: String(item?.text || defaults.stages[index]?.text || "").slice(0, 180),
          landPriceMultiplier: numberIn(
            Number(item?.landPriceMultiplier),
            GameRules.ownershipPriceMultiplier(min, sanitizeOwnershipPriceMultipliers(economy.ownershipPriceMultipliers, defaults.economy.ownershipPriceMultipliers)),
            0.1,
            100
          )
        };
      })
      .sort((a, b) => a.min - b.min),
    rivals: (Array.isArray(source.rivals) ? source.rivals : defaults.rivals)
      .slice(0, 12)
      .map((item, index) => ({
        id: String(item?.id || defaults.rivals[index]?.id || `rival-${index}`).slice(0, 40),
        name: String(item?.name || defaults.rivals[index]?.name || `Гравець ${index + 1}`).slice(0, 40),
        score: intIn(item?.score, defaults.rivals[index]?.score || 0, 0),
        landCount: intIn(item?.landCount, item?.landCount || 0, 0)
      }))
  };
}

function sanitizeMapSettings(mapSettings, fallback = DEFAULT_SETTINGS.map) {
  const source = mapSettings && typeof mapSettings === "object" ? mapSettings : {};
  const fallbackPresets = Array.isArray(fallback?.zoomPresets) ? fallback.zoomPresets : [];
  const incoming = Array.isArray(source.zoomPresets) ? source.zoomPresets : fallbackPresets;
  const expectedDisplayZooms = [5, 7, 10, 12];
  const zoomPresets = expectedDisplayZooms.map((displayZoom, index) => {
    const raw = incoming.find((item) => Number(item?.displayZoom) === displayZoom) || incoming[index] || fallbackPresets[index] || {};
    const base = fallbackPresets[index] || {};
    return {
      displayZoom,
      mapZoom: numberIn(Number(raw.mapZoom), Number(base.mapZoom ?? displayZoom), 3 + index * 0.25, 16 - (expectedDisplayZooms.length - 1 - index) * 0.25),
      mode: displayZoom >= 10
        ? "detail"
        : "overview",
      showFreeGrid: typeof raw.showFreeGrid === "boolean" ? raw.showFreeGrid : Boolean(base.showFreeGrid),
      freeGridOpacity: numberIn(Number(raw.freeGridOpacity), Number(base.freeGridOpacity || 0), 0, 1),
      maxVisibleCells: intIn(raw.maxVisibleCells, base.maxVisibleCells || 10000, 500, 500000)
    };
  });

  // Engine zooms must stay strictly increasing so discrete zoom snapping cannot become ambiguous.
  for (let index = 1; index < zoomPresets.length; index += 1) {
    if (zoomPresets[index].mapZoom <= zoomPresets[index - 1].mapZoom) {
      zoomPresets[index].mapZoom = Math.min(16, zoomPresets[index - 1].mapZoom + 0.25);
    }
  }

  return {
    zoomPresets,
    maxOwnedCellsPerViewport: intIn(source.maxOwnedCellsPerViewport, fallback?.maxOwnedCellsPerViewport || 50000, 6000, 500000),
    overviewMaxTerritories: intIn(source.overviewMaxTerritories, fallback?.overviewMaxTerritories || 8000, 500, 30000),
    cellWidthDegrees: numberIn(Number(source.cellWidthDegrees), fallback?.cellWidthDegrees || BASE_RECT_CELL_WIDTH_DEGREES, 0.002, 0.08),
    cellHeightDegrees: numberIn(Number(source.cellHeightDegrees), fallback?.cellHeightDegrees || BASE_RECT_CELL_HEIGHT_DEGREES, 0.0015, 0.06),
    gridCellCount: intIn(source.gridCellCount, fallback?.gridCellCount || BASE_PLAYABLE_CELL_COUNT, 10000, 2000000)
  };
}

function applyRuntimeMapSettings(settings = readSettings(), previousSettings = null) {
  const mapSettings = settings?.map || DEFAULT_SETTINGS.map;
  const previousMap = previousSettings?.map || null;
  RECT_CELL_WIDTH_DEGREES = numberIn(Number(mapSettings.cellWidthDegrees), BASE_RECT_CELL_WIDTH_DEGREES, 0.002, 0.08);
  RECT_CELL_HEIGHT_DEGREES = numberIn(Number(mapSettings.cellHeightDegrees), BASE_RECT_CELL_HEIGHT_DEGREES, 0.0015, 0.06);
  const geometryChanged = !previousMap || (
    Number(previousMap.cellWidthDegrees) !== Number(mapSettings.cellWidthDegrees)
    || Number(previousMap.cellHeightDegrees) !== Number(mapSettings.cellHeightDegrees)
    || Number(previousMap.gridCellCount) !== Number(mapSettings.gridCellCount)
  );
  if (geometryChanged) {
    marketSpatialIndex = null;
    marketSpatialIndexVersion = 0;
    playableGridRowsCache = null;
  }
}

function sanitizeLandLevels(items, upgrades = {}, fallback = DEFAULT_SETTINGS.upgrades.landLevels) {
  const source = Array.isArray(items) && items.length ? items : fallbackFromLegacyLandLevels(upgrades, fallback);
  return source.slice(0, 10).map((item, index) => ({
    level: intIn(item?.level, index + 1, 1, 10),
    name: String(item?.name || fallback[index]?.name || `Рівень ${index + 1}`).slice(0, 60),
    cost: intIn(item?.cost, fallback[index]?.cost || 0, 0),
    incomeBonusPercent: numberIn(Number(item?.incomeBonusPercent), fallback[index]?.incomeBonusPercent || 0, 0, 1000)
  })).sort((a, b) => a.level - b.level);
}

function fallbackFromLegacyLandLevels(upgrades, fallback) {
  if (!Array.isArray(upgrades.landCosts) && !Array.isArray(upgrades.landIncomeMultipliers)) return fallback;
  const max = Math.max(upgrades.landCosts?.length || 0, upgrades.landIncomeMultipliers?.length || 0, fallback.length);
  return Array.from({ length: max }, (_, index) => {
    const multiplier = Number(upgrades.landIncomeMultipliers?.[index]) || fallback[index]?.incomeBonusPercent / 100 + 1 || 1;
    return {
      level: index || 1,
      name: fallback[index]?.name || (index <= 1 ? "Без добрив" : `Добрива рівня ${index}`),
      cost: Number(upgrades.landCosts?.[index]) || fallback[index]?.cost || 0,
      incomeBonusPercent: Math.max(0, Math.round((multiplier - 1) * 100))
    };
  }).filter((item, index) => index !== 0);
}

function sanitizeAssetItems(items, fallback) {
  const source = Array.isArray(items) && items.length ? items : fallback;
  return source.slice(0, 20).map((item, index) => ({
    id: String(item?.id || fallback[index]?.id || `asset-${index + 1}`).replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || `asset-${index + 1}`,
    icon: sanitizeAssetIcon(item?.icon || fallback[index]?.icon || "•"),
    name: String(item?.name || fallback[index]?.name || `Актив ${index + 1}`).slice(0, 60),
    cost: intIn(item?.cost, fallback[index]?.cost || 0, 0),
    incomeBonusPercent: numberIn(Number(item?.incomeBonusPercent), fallback[index]?.incomeBonusPercent || 0, 0, 1000),
    durationDays: intIn(item?.durationDays, fallback[index]?.durationDays || 80, 1, 1000000),
    incomePerDay: intIn(item?.incomePerDay, fallback[index]?.incomePerDay || 0, 0),
    minCells: intIn(item?.minCells, fallback[index]?.minCells || 1, 1, 1000000),
    maxActiveUnits: intIn(item?.maxActiveUnits, fallback[index]?.maxActiveUnits || 1, 1, 1000000),
    maxOwnerLandPercent: numberIn(Number(item?.maxOwnerLandPercent), fallback[index]?.maxOwnerLandPercent ?? 25, 1, 100),
    serviceLifeExtensionDays: intIn(item?.serviceLifeExtensionDays, fallback[index]?.serviceLifeExtensionDays || 0, 0, 1000000),
    photos: sanitizeAssetPhotos(item?.photos || fallback[index]?.photos || [])
  }));
}

function sanitizeAssetIcon(icon) {
  const value = String(icon || "•");
  if (/^\/assets\/game\/[a-z0-9._-]+$/i.test(value)) return value;
  if (/^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(value) && value.length < 180000) {
    return storeAssetDataUrl(value);
  }
  return value.slice(0, 12);
}

function sanitizeAssetPhotos(photos) {
  return (Array.isArray(photos) ? photos : [])
    .filter((item) => typeof item === "string")
    .filter((item) => /^\/assets\/game\/[a-z0-9._-]+$/i.test(item) || (/^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(item) && item.length < 180000))
    .map(storeAssetDataUrl)
    .slice(0, 8);
}

function storeAssetDataUrl(value) {
  if (!String(value).startsWith("data:image/")) return value;
  const match = String(value).match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/i);
  if (!match) return "";
  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase() === "svg+xml" ? "svg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const directory = path.join(PUBLIC_DIR, "assets", "game");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${hash}.${extension}`), buffer);
  return `/assets/game/${hash}.${extension}`;
}

function readSettings() {
  try {
    return sanitizeSettings(storage?.settings || DEFAULT_SETTINGS);
  } catch {
    return sanitizeSettings(DEFAULT_SETTINGS);
  }
}

function writeSettings(settings) {
  const previousSettings = storage?.settings || null;
  const clean = sanitizeSettings(settings);
  if (storage) {
    storage.settings = clean;
    persistState("settings");
  } else {
    ensureDataFiles();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(clean, null, 2), "utf8");
  }
  applyRuntimeMapSettings(clean, previousSettings);
  // Settings can change overview/detail caps without changing marketVersion. Do not serve
  // stale map payloads that were produced with the previous limits.
  mapOverviewCache.clear();
  mapCellsCache.clear();
  return clean;
}

function defaultFarmState() {
  const settings = readSettings();
  return {
    coins: settings.economy.startingCoins,
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

function sanitizeFarmState(state) {
  const fallback = defaultFarmState();
  if (!state || typeof state !== "object") return fallback;
  const settings = readSettings();

  const stats = state.stats && typeof state.stats === "object" ? state.stats : {};
  const land = state.land && typeof state.land === "object" && !Array.isArray(state.land) ? state.land : {};
  const events = Array.isArray(state.events) ? state.events.slice(-30) : [];
  const ledger = Array.isArray(state.ledger) ? state.ledger.slice(-1000) : [];
  const inventory = state.inventory && typeof state.inventory === "object" ? state.inventory : {};

  return {
    coins: Number.isFinite(state.coins) ? Math.max(0, Math.floor(state.coins)) : fallback.coins,
    currentDay: Number.isFinite(state.currentDay) ? Math.max(1, Math.floor(state.currentDay)) : fallback.currentDay,
    land: Object.fromEntries(Object.entries(land).filter(([id]) => isPlayableLandId(id)).map(([id, cell]) => [id, {
      id,
      price: Number.isFinite(cell.price) ? Math.max(1, Math.floor(cell.price)) : 100,
      purchasedAt: typeof cell.purchasedAt === "string" ? cell.purchasedAt : new Date().toISOString(),
      level: Number.isFinite(cell.level) ? Math.min(settings.upgrades.landMaxLevel, Math.max(1, Math.floor(cell.level))) : 1,
      building: typeof cell.building === "string" ? cell.building.slice(0, 40) : null,
      buildingId: typeof cell.buildingId === "string" ? cell.buildingId.slice(0, 40) : (typeof cell.building === "string" ? cell.building.slice(0, 40) : null),
      buildingGroupId: typeof cell.buildingGroupId === "string" ? cell.buildingGroupId.slice(0, 60) : null,
      buildingBuiltAt: typeof cell.buildingBuiltAt === "string" ? cell.buildingBuiltAt : null,
      buildingLevel: 0,
      machinery: Boolean(cell.machinery),
      machineryLevel: 0,
      nickname: typeof cell.nickname === "string" ? cell.nickname.slice(0, 36) : ""
    }])),
    companyName: typeof state.companyName === "string" ? state.companyName.slice(0, 40) : fallback.companyName,
    color: /^#[0-9a-f]{6}$/i.test(state.color || "") ? state.color : fallback.color,
    logo: typeof state.logo === "string" && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(state.logo) && state.logo.length < 180000
      ? state.logo
      : "",
    inventory: {
      machinery: sanitizeInventoryMap(inventory.machinery),
      elevators: sanitizeInventoryMap(inventory.elevators),
      machineryBatches: sanitizeMachineryBatches(inventory.machineryBatches)
    },
    lastAdminResetAt: typeof state.lastAdminResetAt === "string" ? state.lastAdminResetAt : fallback.lastAdminResetAt,
    lastIncomeAt: typeof state.lastIncomeAt === "string" ? state.lastIncomeAt : fallback.lastIncomeAt,
    stats: {
      purchased: Number.isFinite(stats.purchased) ? Math.max(0, Math.floor(stats.purchased)) : 0,
      upgraded: Number.isFinite(stats.upgraded) ? Math.max(0, Math.floor(stats.upgraded)) : 0,
      buildings: Number.isFinite(stats.buildings) ? Math.max(0, Math.floor(stats.buildings)) : 0,
      machinery: Number.isFinite(stats.machinery) ? Math.max(0, Math.floor(stats.machinery)) : 0,
      earned: Number.isFinite(stats.earned) ? Math.max(0, Math.floor(stats.earned)) : 0
    },
    events: events.map((event) => ({
      text: typeof event.text === "string" ? event.text.slice(0, 140) : "",
      at: typeof event.at === "string" ? event.at : new Date().toISOString()
    })).filter((event) => event.text),
    ledger: ledger.map((item) => ({
      type: typeof item.type === "string" ? item.type.slice(0, 24) : "info",
      text: typeof item.text === "string" ? item.text.slice(0, 180) : "",
      amount: Number.isFinite(item.amount) ? Math.floor(item.amount) : 0,
      balance: Number.isFinite(item.balance) ? Math.floor(item.balance) : null,
      landDelta: Number.isFinite(item.landDelta) ? Math.floor(item.landDelta) : 0,
      at: typeof item.at === "string" ? item.at : new Date().toISOString()
    })).filter((item) => item.text)
  };
}

function sanitizeProfilePatch(profile, fallbackFarm = {}) {
  const source = profile && typeof profile === "object" ? profile : {};
  const fallback = fallbackFarm && typeof fallbackFarm === "object" ? fallbackFarm : {};
  const logo = typeof source.logo === "string" ? source.logo : (typeof fallback.logo === "string" ? fallback.logo : "");
  return {
    companyName: typeof source.companyName === "string" ? source.companyName.trim().slice(0, 40) : String(fallback.companyName || "").slice(0, 40),
    color: /^#[0-9a-f]{6}$/i.test(source.color || "") ? source.color : (/^#[0-9a-f]{6}$/i.test(fallback.color || "") ? fallback.color : "#35c982"),
    logo: /^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(logo) && logo.length < 180000 ? logo : ""
  };
}

function sanitizeFarmMetaPatch(meta, fallbackFarm = {}) {
  const source = meta && typeof meta === "object" ? meta : {};
  const fallback = fallbackFarm && typeof fallbackFarm === "object" ? fallbackFarm : defaultFarmState();
  const stats = source.stats && typeof source.stats === "object" ? source.stats : (fallback.stats || {});
  const inventory = source.inventory && typeof source.inventory === "object" ? source.inventory : (fallback.inventory || {});
  const events = Array.isArray(source.events) ? source.events.slice(-30) : (Array.isArray(fallback.events) ? fallback.events.slice(-30) : []);
  const ledger = Array.isArray(source.ledger) ? source.ledger.slice(-1000) : (Array.isArray(fallback.ledger) ? fallback.ledger.slice(-1000) : []);
  return {
    coins: Number.isFinite(source.coins) ? Math.max(0, Math.floor(source.coins)) : Math.max(0, Math.floor(Number(fallback.coins) || 0)),
    currentDay: Number.isFinite(source.currentDay) ? Math.max(1, Math.floor(source.currentDay)) : Math.max(1, Math.floor(Number(fallback.currentDay) || 1)),
    inventory: {
      machinery: sanitizeInventoryMap(inventory.machinery),
      elevators: sanitizeInventoryMap(inventory.elevators),
      machineryBatches: sanitizeMachineryBatches(inventory.machineryBatches)
    },
    lastIncomeAt: typeof source.lastIncomeAt === "string" ? source.lastIncomeAt : (typeof fallback.lastIncomeAt === "string" ? fallback.lastIncomeAt : null),
    stats: {
      purchased: Number.isFinite(stats.purchased) ? Math.max(0, Math.floor(stats.purchased)) : 0,
      upgraded: Number.isFinite(stats.upgraded) ? Math.max(0, Math.floor(stats.upgraded)) : 0,
      buildings: Number.isFinite(stats.buildings) ? Math.max(0, Math.floor(stats.buildings)) : 0,
      machinery: Number.isFinite(stats.machinery) ? Math.max(0, Math.floor(stats.machinery)) : 0,
      earned: Number.isFinite(stats.earned) ? Math.max(0, Math.floor(stats.earned)) : 0
    },
    events: events.map((event) => ({
      text: typeof event?.text === "string" ? event.text.slice(0, 140) : "",
      at: typeof event?.at === "string" ? event.at : new Date().toISOString()
    })).filter((event) => event.text),
    ledger: ledger.map((item) => ({
      type: typeof item?.type === "string" ? item.type.slice(0, 24) : "info",
      text: typeof item?.text === "string" ? item.text.slice(0, 180) : "",
      amount: Number.isFinite(item?.amount) ? Math.floor(item.amount) : 0,
      balance: Number.isFinite(item?.balance) ? Math.floor(item.balance) : null,
      landDelta: Number.isFinite(item?.landDelta) ? Math.floor(item.landDelta) : 0,
      at: typeof item?.at === "string" ? item.at : new Date().toISOString()
    })).filter((item) => item.text)
  };
}

function rawUserCompanyName(user) {
  const farm = user?.farm && typeof user.farm === "object" ? user.farm : {};
  const name = String(farm.companyName || "").trim();
  if (!name) return user?.username || "Гравець";
  if (user?.username && (name === `${user.username} Земля` || name === `${user.username} Agro`)) return user.username;
  return name.slice(0, 40);
}

function touchMapPresentationVersion() {
  marketVersion += 1;
  if (marketSpatialIndex) marketSpatialIndexVersion = marketVersion;
  mapOverviewCache.clear();
  mapCellsCache.clear();
}

function mapOwnerPresentationById() {
  return new Map(readUsers().map((user) => {
    const farm = user?.farm && typeof user.farm === "object" ? user.farm : {};
    return [String(user.id || ""), {
      name: rawUserCompanyName(user),
      color: /^#[0-9a-f]{6}$/i.test(farm.color || "") ? farm.color : "#ef7669",
      farm
    }];
  }).filter(([id]) => id));
}

function sanitizeInventoryMap(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return {};
  return Object.fromEntries(Object.entries(map)
    .map(([id, qty]) => [String(id).replace(/[^a-z0-9_-]/gi, "").slice(0, 40), intIn(qty, 0, 0, 1000000)])
    .filter(([id, qty]) => id && qty > 0));
}

function sanitizeMachineryBatches(batches) {
  return (Array.isArray(batches) ? batches : [])
    .slice(-500)
    .map((batch) => ({
      id: String(batch?.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40),
      qty: intIn(batch?.qty, 0, 0, 1000000),
      purchasedDay: intIn(batch?.purchasedDay, 1, 1, 1000000),
      expiresDay: intIn(batch?.expiresDay, 1, 1, 1000000)
    }))
    .filter((batch) => batch.id && batch.qty > 0 && batch.expiresDay >= batch.purchasedDay);
}

function readUsers() {
  return Array.isArray(storage?.users) ? storage.users : [];
}

function writeUsers(users, { deferPersistence = false } = {}) {
  if (!storage) storage = readFileStorageSnapshot();
  storage.users = users;
  if (deferPersistence) scheduleUsersPersistence();
  else if (dbPool) persistState("users");
  else persistUsersToFile();
  leaderboardVersion += 1;
}

function mutableFarmForLandTransaction(user) {
  if (!user || typeof user !== "object") return defaultFarmState();
  if (!user.farm || typeof user.farm !== "object" || Array.isArray(user.farm)) user.farm = defaultFarmState();
  const farm = user.farm;
  if (!farm.land || typeof farm.land !== "object" || Array.isArray(farm.land)) farm.land = {};
  if (!farm.stats || typeof farm.stats !== "object" || Array.isArray(farm.stats)) farm.stats = {};
  if (!farm.inventory || typeof farm.inventory !== "object" || Array.isArray(farm.inventory)) {
    farm.inventory = { machinery: {}, elevators: {}, machineryBatches: [] };
  }
  if (!Number.isFinite(farm.coins)) farm.coins = defaultFarmState().coins;
  if (!Number.isFinite(farm.currentDay)) farm.currentDay = 1;
  if (!/^#[0-9a-f]{6}$/i.test(farm.color || "")) farm.color = "#35c982";
  return farm;
}

function ensureAdminUser() {
  const users = readUsers();
  let admin = users.find((user) => String(user.username || "").toLowerCase() === ADMIN_USERNAME.toLowerCase());
  let changed = false;
  if (!admin) {
    admin = {
      id: "admin",
      username: ADMIN_USERNAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      isAdmin: true,
      farm: { ...defaultFarmState(), companyName: "Адміністрація Землевласника" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(admin);
    changed = true;
  } else {
    if (admin.username !== ADMIN_USERNAME) {
      admin.username = ADMIN_USERNAME;
      changed = true;
    }
    if (!admin.passwordHash) {
      admin.passwordHash = hashPassword(ADMIN_PASSWORD);
      changed = true;
    }
    if (!admin.isAdmin) {
      admin.isAdmin = true;
      changed = true;
    }
    if (!admin.farm || typeof admin.farm !== "object") {
      admin.farm = { ...defaultFarmState(), companyName: "Адміністрація Землевласника" };
      changed = true;
    }
    if (changed) admin.updatedAt = new Date().toISOString();
  }
  if (changed) writeUsers(users);
}

function assertProductionSecurity() {
  if (!IS_PRODUCTION) return;
  const insecurePasswords = new Set(["", "admin", "change-this-admin-password", "password", "123456", "12345678"]);
  const normalizedPassword = String(process.env.ADMIN_PASSWORD || "").trim().toLowerCase();
  if (!String(process.env.ADMIN_USERNAME || "").trim()) {
    throw new Error("Production requires ADMIN_USERNAME in environment variables.");
  }
  if (normalizedPassword.length < 16 || insecurePasswords.has(normalizedPassword)) {
    throw new Error("Production requires a strong ADMIN_PASSWORD (at least 16 characters) in environment variables.");
  }
}

function readMarket() {
  try {
    const market = storage?.market || { land: {} };
    return market && typeof market === "object" && market.land && typeof market.land === "object"
      ? { land: market.land, resetAt: typeof market.resetAt === "string" ? market.resetAt : null }
      : { land: {} };
  } catch {
    return { land: {} };
  }
}

function marketResponse(market = readMarket()) {
  return { ...market, version: marketVersion };
}

function globalMarketPayload(market = readMarket()) {
  return {
    version: marketVersion,
    resetAt: market.resetAt || null,
    stats: {
      ownedCells: Object.keys(market.land || {}).length
    }
  };
}

function marketVersionPayload() {
  return { version: marketVersion, resetAt: readMarket().resetAt || null };
}

let ukrainePolygonsCache = null;

function loadUkrainePolygons() {
  if (ukrainePolygonsCache) return ukrainePolygonsCache;
  const fallback = [[[
    [23.72, 52.34], [25.12, 51.85], [26.85, 51.72], [30.18, 52.28], [31.82, 51.58],
    [33.74, 52.18], [35.32, 51.36], [37.18, 50.62], [39.92, 50.24], [40.14, 49.12],
    [39.22, 48.34], [38.12, 47.88], [37.8, 47.1], [36.22, 46.72], [35.28, 46.02],
    [35.0, 45.44], [36.42, 45.18], [36.02, 44.62], [34.38, 44.42], [33.18, 45.0],
    [32.22, 45.28], [30.78, 45.38], [30.08, 46.0], [29.24, 45.38], [28.42, 45.48],
    [28.0, 46.2], [29.62, 46.38], [29.16, 46.82], [27.92, 47.58], [26.72, 48.2],
    [24.86, 47.78], [22.18, 48.34], [22.42, 49.34], [23.56, 50.42], [23.64, 51.18],
    [23.72, 52.34]
  ]]];
  try {
    const filePath = path.join(PUBLIC_DIR, "ukraine-boundary.geojson");
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const features = Array.isArray(raw?.features) ? raw.features : [raw];
    ukrainePolygonsCache = features.flatMap((feature) => {
      const geometry = feature?.geometry;
      if (!geometry) return [];
      if (geometry.type === "Polygon") return [geometry.coordinates];
      if (geometry.type === "MultiPolygon") return geometry.coordinates;
      return [];
    });
    if (!ukrainePolygonsCache.length) ukrainePolygonsCache = fallback;
  } catch {
    ukrainePolygonsCache = fallback;
  }
  return ukrainePolygonsCache;
}

function pointInPolygonMap(point, polygon) {
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

function pointInUkraineMap(lng, lat) {
  const polygons = loadUkrainePolygons();
  return polygons.some((polygon) => {
    if (!pointInPolygonMap([lng, lat], polygon[0])) return false;
    return !polygon.slice(1).some((hole) => pointInPolygonMap([lng, lat], hole));
  });
}

function parseCellGridId(id) {
  const match = String(id || "").match(/^cell-(-?\d+)-(-?\d+)$/);
  return { q: match ? Number(match[1]) : 0, r: match ? Number(match[2]) : 0 };
}

function areCellIdsConnected(cellIds) {
  return Land.areCellIdsConnected(cellIds);
}

function hashStringServer(value) {
  return GameRules.hashString(value);
}

function ownershipPriceMultiplier(ownedCount, settings = readSettings()) {
  return GameRules.stagePriceMultiplier(ownedCount, settings.stages || []);
}

function landPriceForMarket(id, market, settings = readSettings(), buyerOwnedCount = null, excludedIds = null) {
  const economy = settings.economy || {};
  const base = Number.isFinite(economy.baseLandPriceMin) ? economy.baseLandPriceMin : 1800;
  const spread = Number.isFinite(economy.baseLandPriceSpread) ? Math.max(0, Math.floor(economy.baseLandPriceSpread)) : 0;
  const seed = Math.abs(hashStringServer(id)) || 1;
  const basePrice = Math.round(base + (spread ? seed % spread : 0));
  const radius = Math.max(1, Math.floor(economy.nearbyPriceRadius || 2));
  const growth = Number.isFinite(economy.nearbyPriceGrowthPercent) ? economy.nearbyPriceGrowthPercent / 100 : 0.06;
  const { q, r } = parseCellGridId(id);
  let pressure = 0;
  for (let dq = -radius; dq <= radius; dq += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      const neighborId = `cell-${q + dq}-${r + dr}`;
      if ((dq || dr) && !excludedIds?.has(neighborId) && market.land[neighborId]) pressure += 1;
    }
  }
  const scale = Number.isFinite(buyerOwnedCount) ? ownershipPriceMultiplier(buyerOwnedCount, settings) : 1;
  return GameRules.landPrice(basePrice, pressure, growth * 100, scale);
}

function authoritativeLandPrice(id, market, settings = readSettings(), buyerOwnedCount = 0, excludedIds = null) {
  return landPriceForMarket(id, market, settings, buyerOwnedCount, excludedIds);
}

function scanlineGridRanges(ring, lat) {
  const intersections = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) === (yj > lat)) continue;
    intersections.push(xi + ((lat - yi) * (xj - xi)) / (yj - yi));
  }
  intersections.sort((a, b) => a - b);
  const ranges = [];
  for (let index = 0; index + 1 < intersections.length; index += 2) {
    ranges.push([intersections[index], intersections[index + 1]]);
  }
  return ranges;
}

function buildPlayableGridPayload(cellWidth, cellHeight) {
  const polygons = loadUkrainePolygons();
  const maxQ = Math.ceil((MAP_BOUNDS.east - MAP_BOUNDS.west) / cellWidth);
  const maxR = Math.ceil((MAP_BOUNDS.north - MAP_BOUNDS.south) / cellHeight);
  const rows = {};
  let count = 0;

  for (let r = 0; r < maxR; r += 1) {
    const lat = MAP_BOUNDS.north - (r + 0.5) * cellHeight;
    const ranges = polygons.flatMap((polygon) => scanlineGridRanges(polygon[0], lat).map(([west, east]) => {
      const start = Math.max(0, Math.ceil((west - MAP_BOUNDS.west) / cellWidth - 0.5));
      const end = Math.min(maxQ - 1, Math.floor((east - MAP_BOUNDS.west) / cellWidth - 0.5));
      return [start, end];
    })).filter(([start, end]) => end >= start).sort((a, b) => a[0] - b[0]);
    if (!ranges.length) continue;
    count += ranges.reduce((sum, [start, end]) => sum + end - start + 1, 0);
    rows[r] = ranges;
  }

  return {
    version: 2,
    count,
    cellWidthDegrees: cellWidth,
    cellHeightDegrees: cellHeight,
    rows
  };
}

function playableGridForTarget(targetCells) {
  const target = intIn(targetCells, BASE_PLAYABLE_CELL_COUNT, 50000, 1000000);
  let scale = Math.sqrt(BASE_PLAYABLE_CELL_COUNT / target);
  let cellWidth = BASE_RECT_CELL_WIDTH_DEGREES * scale;
  let cellHeight = BASE_RECT_CELL_HEIGHT_DEGREES * scale;
  let payload = null;

  // Scanline generation works per row rather than per cell, so a few refinement passes are cheap.
  // Preserve the original 3:2 width/height proportion while converging on the requested count.
  for (let pass = 0; pass < 3; pass += 1) {
    payload = buildPlayableGridPayload(cellWidth, cellHeight);
    if (!payload.count) break;
    const correction = Math.sqrt(payload.count / target);
    cellWidth *= correction;
    cellHeight *= correction;
  }
  payload = buildPlayableGridPayload(cellWidth, cellHeight);
  return payload;
}

function writePlayableGridPayload(payload) {
  const temporary = `${PLAYABLE_GRID_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(payload), "utf8");
  fs.renameSync(temporary, PLAYABLE_GRID_FILE);
  playableGridRowsCache = new Map(Object.entries(payload.rows || {}).map(([r, ranges]) => [Number(r), ranges]));
}

function loadPlayableGridRows() {
  if (playableGridRowsCache) return playableGridRowsCache;
  try {
    const payload = JSON.parse(fs.readFileSync(PLAYABLE_GRID_FILE, "utf8"));
    playableGridRowsCache = new Map(Object.entries(payload.rows || {}).map(([r, ranges]) => [Number(r), ranges]));
  } catch {
    playableGridRowsCache = new Map();
  }
  return playableGridRowsCache;
}

function isPlayableGridCellServer(q, r) {
  const ranges = loadPlayableGridRows().get(r);
  return Array.isArray(ranges) && ranges.some(([minQ, maxQ]) => q >= minQ && q <= maxQ);
}

function marketChunkKey(q, r) {
  return `${Math.floor(q / MARKET_INDEX_SPAN)}:${Math.floor(r / MARKET_INDEX_SPAN)}`;
}

function ensureMarketSpatialIndex(market) {
  if (marketSpatialIndex && marketSpatialIndexVersion === marketVersion) return marketSpatialIndex;
  const index = new Map();
  Object.entries(market.land || {}).forEach(([id, entry]) => {
    if (!isPlayableLandId(id)) return;
    const { q, r } = parseCellGridId(id);
    const key = marketChunkKey(q, r);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push([id, entry, q, r]);
  });
  marketSpatialIndex = index;
  marketSpatialIndexVersion = marketVersion;
  return index;
}

function patchMarketSpatialIndex(upsertIds = [], deleteIds = [], market = readMarket(), previousVersion = marketVersion) {
  if (!marketSpatialIndex || marketSpatialIndexVersion !== previousVersion) return false;

  for (const id of deleteIds || []) {
    if (!isPlayableLandId(id)) continue;
    const { q, r } = parseCellGridId(id);
    const key = marketChunkKey(q, r);
    const rows = marketSpatialIndex.get(key);
    if (!rows) continue;
    const nextRows = rows.filter((row) => row[0] !== id);
    if (nextRows.length) marketSpatialIndex.set(key, nextRows);
    else marketSpatialIndex.delete(key);
  }

  for (const id of upsertIds || []) {
    if (!isPlayableLandId(id)) continue;
    const entry = market.land?.[id];
    if (!entry) continue;
    const { q, r } = parseCellGridId(id);
    const key = marketChunkKey(q, r);
    const rows = marketSpatialIndex.get(key) || [];
    const index = rows.findIndex((row) => row[0] === id);
    const row = [id, entry, q, r];
    if (index >= 0) rows[index] = row;
    else rows.push(row);
    marketSpatialIndex.set(key, rows);
  }
  return true;
}

function forEachMarketEntryInBounds(market, bounds, preload = 1, visitor = () => true) {
  const index = ensureMarketSpatialIndex(market);
  const chunks = chunkBoundsForRange(bounds, MARKET_INDEX_SPAN, preload);
  for (let cq = chunks.minQ; cq <= chunks.maxQ; cq += 1) {
    for (let cr = chunks.minR; cr <= chunks.maxR; cr += 1) {
      const rows = index.get(`${cq}:${cr}`);
      if (!rows) continue;
      for (const row of rows) {
        if (visitor(row) === false) return false;
      }
    }
  }
  return true;
}

function marketEntriesInBounds(market, bounds, preload = 1) {
  const entries = [];
  forEachMarketEntryInBounds(market, bounds, preload, (row) => {
    entries.push(row);
  });
  return entries;
}

function cellCenterFromGrid(q, r) {
  return {
    lng: MAP_BOUNDS.west + (q + 0.5) * RECT_CELL_WIDTH_DEGREES,
    lat: MAP_BOUNDS.north - (r + 0.5) * RECT_CELL_HEIGHT_DEGREES
  };
}

function gridRangeForBounds(west, east, south, north, pad = 1) {
  return {
    minQ: Math.floor((west - MAP_BOUNDS.west) / RECT_CELL_WIDTH_DEGREES) - pad,
    maxQ: Math.ceil((east - MAP_BOUNDS.west) / RECT_CELL_WIDTH_DEGREES) + pad,
    minR: Math.floor((MAP_BOUNDS.north - north) / RECT_CELL_HEIGHT_DEGREES) - pad,
    maxR: Math.ceil((MAP_BOUNDS.north - south) / RECT_CELL_HEIGHT_DEGREES) + pad
  };
}

function rectBoundaryLatLngBlockServer(q, r, step) {
  const west = MAP_BOUNDS.west + q * RECT_CELL_WIDTH_DEGREES;
  const east = MAP_BOUNDS.west + (q + step) * RECT_CELL_WIDTH_DEGREES;
  const north = MAP_BOUNDS.north - r * RECT_CELL_HEIGHT_DEGREES;
  const south = MAP_BOUNDS.north - (r + step) * RECT_CELL_HEIGHT_DEGREES;
  return [[north, west], [north, east], [south, east], [south, west]];
}

function rectBoundaryRingForUnionServer(q, r, step) {
  const west = MAP_BOUNDS.west + q * RECT_CELL_WIDTH_DEGREES;
  const east = MAP_BOUNDS.west + (q + step) * RECT_CELL_WIDTH_DEGREES;
  const north = MAP_BOUNDS.north - r * RECT_CELL_HEIGHT_DEGREES;
  const south = MAP_BOUNDS.north - (r + step) * RECT_CELL_HEIGHT_DEGREES;
  return [[west, north], [east, north], [east, south], [west, south], [west, north]];
}

function polygonAreaSignedServer(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    area += (x1 * y2) - (x2 * y1);
  }
  return area / 2;
}

function largestRingFromUnionServer(unionResult) {
  if (!Array.isArray(unionResult) || !unionResult.length) return null;
  let bestRing = null;
  let bestArea = 0;
  unionResult.forEach((polygon) => {
    if (!Array.isArray(polygon) || !polygon.length) return;
    const outer = polygon[0];
    const area = Math.abs(polygonAreaSignedServer(outer));
    if (area > bestArea) {
      bestArea = area;
      bestRing = outer;
    }
  });
  return bestRing;
}

function ringToLatLngServer(ring) {
  return ring.map(([lng, lat]) => [lat, lng]);
}

function rectBoundaryLatLngRangeServer(minQ, maxQ, minR, maxR) {
  const west = MAP_BOUNDS.west + minQ * RECT_CELL_WIDTH_DEGREES;
  const east = MAP_BOUNDS.west + (maxQ + 1) * RECT_CELL_WIDTH_DEGREES;
  const north = MAP_BOUNDS.north - minR * RECT_CELL_HEIGHT_DEGREES;
  const south = MAP_BOUNDS.north - (maxR + 1) * RECT_CELL_HEIGHT_DEGREES;
  return [[north, west], [north, east], [south, east], [south, west]];
}

function overviewGridStepForZoomServer(zoom) {
  if (zoom <= 7) return 512;
  if (zoom <= 9) return 256;
  if (zoom <= 11) return 128;
  if (zoom <= 12) return 64;
  return 32;
}

function chunkLevelForZoom(zoom) {
  if (zoom <= 7) return 1;
  if (zoom <= 9) return 2;
  if (zoom <= 11) return 3;
  if (zoom <= 12) return 4;
  return 4;
}

function chunkCellSpanForLevel(level) {
  if (level <= 1) return 512;
  if (level === 2) return 256;
  if (level === 3) return 128;
  return 32;
}

function overviewGroupSpanForLevel(level) {
  if (level <= 1) return 8;
  if (level === 2) return 4;
  if (level === 3) return 2;
  return 2;
}

function groupKeyForCell(q, r, span) {
  return `${Math.floor(q / span)}:${Math.floor(r / span)}`;
}

function connectedComponentsForGroups(groupMap) {
  const groups = [...groupMap.values()];
  const byKey = new Map(groups.map((group) => [`${group.gq}:${group.gr}`, group]));
  const visited = new Set();
  const components = [];

  for (const group of groups) {
    const startKey = `${group.gq}:${group.gr}`;
    if (visited.has(startKey)) continue;
    const queue = [group];
    const component = { groups: [], cellCount: 0 };
    visited.add(startKey);

    while (queue.length) {
      const current = queue.pop();
      component.groups.push(current);
      component.cellCount += current.cellCount || 0;
      const neighbors = [
        [current.gq + 1, current.gr],
        [current.gq - 1, current.gr],
        [current.gq, current.gr + 1],
        [current.gq, current.gr - 1]
      ];
      neighbors.forEach(([nq, nr]) => {
        const neighborKey = `${nq}:${nr}`;
        if (visited.has(neighborKey)) return;
        const neighbor = byKey.get(neighborKey);
        if (!neighbor) return;
        visited.add(neighborKey);
        queue.push(neighbor);
      });
    }

    components.push(component);
  }

  return components;
}

function chunkBoundsForRange(bounds, span, preload = 1) {
  const range = gridRangeForBounds(bounds.west, bounds.east, bounds.south, bounds.north, 0);
  return {
    minQ: Math.floor(range.minQ / span) - preload,
    maxQ: Math.floor(range.maxQ / span) + preload,
    minR: Math.floor(range.minR / span) - preload,
    maxR: Math.floor(range.maxR / span) + preload
  };
}

function cellInsideChunkRange(q, r, chunkRange, span) {
  const chunkQ = Math.floor(q / span);
  const chunkR = Math.floor(r / span);
  return chunkQ >= chunkRange.minQ
    && chunkQ <= chunkRange.maxQ
    && chunkR >= chunkRange.minR
    && chunkR <= chunkRange.maxR;
}

function parseMapBoundsQuery(searchParams) {
  const west = Number(searchParams.get("west"));
  const east = Number(searchParams.get("east"));
  const south = Number(searchParams.get("south"));
  const north = Number(searchParams.get("north"));
  if (![west, east, south, north].every(Number.isFinite)) return null;
  return { west, east, south, north };
}

function mapCellsInViewport(bounds, zoom = 13, limit = MAX_VIEWPORT_MARKET_CELLS) {
  const cacheKey = `${marketVersion}|${zoom}|${limit}|${bounds.west.toFixed(3)}|${bounds.south.toFixed(3)}|${bounds.east.toFixed(3)}|${bounds.north.toFixed(3)}`;
  const cached = mapCellsCache.get(cacheKey);
  if (cached) return cached;
  const market = readMarket();
  const ownerProfiles = mapOwnerPresentationById();
  const owners = {};
  const cells = [];
  const span = chunkCellSpanForLevel(4);
  const chunkRange = chunkBoundsForRange(bounds, span, 1);

  let truncated = false;
  forEachMarketEntryInBounds(market, bounds, 1, ([id, entry, q, r]) => {
    if (!cellInsideChunkRange(q, r, chunkRange, span)) return true;
    if (!isPlayableGridCellServer(q, r)) return true;
    const ownerId = String(entry.ownerId || "");
    if (!ownerId) return true;
    if (cells.length >= limit) {
      truncated = true;
      return false;
    }
    if (!owners[ownerId]) {
      const profile = ownerProfiles.get(ownerId);
      owners[ownerId] = {
        color: profile?.color || entry.ownerColor || "#ef7669",
        name: profile?.name || entry.ownerName || "Гравець"
      };
    }
    const farmCell = ownerProfiles.get(ownerId)?.farm?.land?.[id];
    const buildingId = farmCell?.building || farmCell?.buildingId || null;
    const row = {
      id,
      o: ownerId,
      l: Number.isFinite(entry.level) ? entry.level : 1
    };
    if (buildingId) {
      row.b = String(buildingId).slice(0, 40);
      row.g = typeof farmCell.buildingGroupId === "string" ? farmCell.buildingGroupId.slice(0, 60) : "";
    }
    cells.push(row);
    return true;
  });
  const payload = { version: marketVersion, zoom, level: 4, owners, cells, truncated };
  mapCellsCache.set(cacheKey, payload);
  if (mapCellsCache.size > 24) mapCellsCache.delete(mapCellsCache.keys().next().value);
  return payload;
}

function unionPolygonsBatched(polygons, batchSize = 256) {
  let queue = Array.isArray(polygons) ? polygons.filter(Boolean) : [];
  if (!queue.length) return [];
  while (queue.length > 1) {
    const next = [];
    for (let index = 0; index < queue.length; index += batchSize) {
      const batch = queue.slice(index, index + batchSize);
      if (batch.length === 1) next.push(batch[0]);
      else next.push(polygonClipping.union(...batch));
    }
    queue = next;
  }
  const result = queue[0];
  // A single untouched input is a Polygon; polygon-clipping union normally returns MultiPolygon.
  if (!Array.isArray(result)) return [];
  if (result.length && Array.isArray(result[0]) && Array.isArray(result[0][0]) && typeof result[0][0][0] === "number") {
    return [result];
  }
  return result;
}

function mapOverviewTerritories(bounds, zoom, playerId = "") {
  const cacheKey = `${marketVersion}|${zoom}|${playerId}|${bounds.west.toFixed(3)}|${bounds.south.toFixed(3)}|${bounds.east.toFixed(3)}|${bounds.north.toFixed(3)}`;
  const cached = mapOverviewCache.get(cacheKey);
  if (cached) return cached;
  const market = readMarket();
  const ownerProfiles = mapOwnerPresentationById();
  const level = Math.min(3, chunkLevelForZoom(zoom));
  const preload = level <= 1 ? 36 : level === 2 ? 24 : 12;

  const owners = new Map();
  const overviewSpan = overviewGroupSpanForLevel(level);
  forEachMarketEntryInBounds(market, bounds, preload, ([id, entry]) => {
    if (!isPlayableLandId(id)) return true;
    const { q, r } = parseCellGridId(id);
    const ownerId = String(entry.ownerId || "");
    if (!ownerId) return true;
    const ownerProfile = ownerProfiles.get(ownerId);
    const color = ownerProfile?.color || entry.ownerColor || "#ef7669";
    const key = `${ownerId}:${color}`;
    if (!owners.has(key)) {
      owners.set(key, {
        ownerId,
        ownerKind: playerId && ownerId === playerId ? "player" : "rival",
        color,
        groupMap: new Map(),
        cellCount: 0
      });
    }
    const owner = owners.get(key);
    owner.cellCount += 1;
    const gq = Math.floor(q / overviewSpan);
    const gr = Math.floor(r / overviewSpan);
    const groupId = `${gq}:${gr}`;
    if (!owner.groupMap.has(groupId)) {
      owner.groupMap.set(groupId, {
        gq,
        gr,
        cellCount: 0,
        minQ: q,
        maxQ: q,
        minR: r,
        maxR: r
      });
    }
    const group = owner.groupMap.get(groupId);
    group.cellCount += 1;
    group.minQ = Math.min(group.minQ, q);
    group.maxQ = Math.max(group.maxQ, q);
    group.minR = Math.min(group.minR, r);
    group.maxR = Math.max(group.maxR, r);
    return true;
  });

  const territories = [];
  const configuredTerritoryLimit = readSettings().map?.overviewMaxTerritories || 8000;
  const maxTerritories = Math.max(500, Math.min(30000, configuredTerritoryLimit));

  const polygonToCenter = (polygon) => {
    const lats = polygon.map(([lat]) => lat);
    const lngs = polygon.map(([, lng]) => lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  };

  const buildGroupBounds = (group, span) => {
    const minQ = Math.max(0, Math.min(group.minQ, group.maxQ));
    const maxQ = Math.max(group.minQ, group.maxQ);
    const minR = Math.max(0, Math.min(group.minR, group.maxR));
    const maxR = Math.max(group.minR, group.maxR);
    // polygon-clipping expects GeoJSON axis order [lng, lat].
    const latLng = rectBoundaryLatLngRangeServer(minQ, maxQ, minR, maxR);
    const ring = latLng.map(([lat, lng]) => [lng, lat]);
    if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
      ring.push([...ring[0]]);
    }
    return ring;
  };

  const componentizeGroups = (groupMap) => {
    const byKey = new Map([...groupMap.values()].map((group) => [`${group.gq}:${group.gr}`, group]));
    const visited = new Set();
    const components = [];
    for (const group of groupMap.values()) {
      const startKey = `${group.gq}:${group.gr}`;
      if (visited.has(startKey)) continue;
      const queue = [group];
      const component = [];
      visited.add(startKey);
      while (queue.length) {
        const current = queue.pop();
        component.push(current);
        [
          [current.gq + 1, current.gr],
          [current.gq - 1, current.gr],
          [current.gq, current.gr + 1],
          [current.gq, current.gr - 1]
        ].forEach(([nq, nr]) => {
          const key = `${nq}:${nr}`;
          if (visited.has(key)) return;
          if (!byKey.has(key)) return;
          visited.add(key);
          queue.push(byKey.get(key));
        });
      }
      components.push(component);
    }
    return components;
  };

  const territoryBounds = (ring) => {
    const lats = ring.map(([lat]) => lat);
    const lngs = ring.map(([, lng]) => lng);
    return {
      west: Math.min(...lngs),
      east: Math.max(...lngs),
      south: Math.min(...lats),
      north: Math.max(...lats)
    };
  };

  const ownerComponentRows = [...owners.values()].map((owner) => ({
    owner,
    components: componentizeGroups(owner.groupMap).sort((a, b) => b.length - a.length),
    nextIndex: 0
  }));
  let overviewTruncated = false;
  let hasRemainingComponents = true;

  // Round-robin owners instead of exhausting one owner first. With a global cap this keeps
  // every player represented even when the map becomes highly fragmented.
  while (territories.length < maxTerritories && hasRemainingComponents) {
    hasRemainingComponents = false;
    for (const row of ownerComponentRows) {
      if (territories.length >= maxTerritories) break;
      const componentIndex = row.nextIndex;
      const component = row.components[componentIndex];
      if (!component) continue;
      hasRemainingComponents = true;
      row.nextIndex += 1;
      const polygons = component.map((group) => [buildGroupBounds(group, overviewSpan)]);
      const union = unionPolygonsBatched(polygons);
      if (!Array.isArray(union) || !union.length) continue;
      const componentCellCount = component.reduce((sum, group) => sum + (group.cellCount || 0), 0);
      union.forEach((polygon, polygonIndex) => {
        if (territories.length >= maxTerritories) {
          overviewTruncated = true;
          return;
        }
        if (!Array.isArray(polygon) || !polygon.length) return;
        const outerRing = polygon[0];
        const boundary = outerRing.map(([lng, lat]) => [lat, lng]);
        if (boundary.length < 4) return;
        const center = polygonToCenter(boundary);
        const box = territoryBounds(boundary);
        const intersectsViewport = box.east >= bounds.west
          && box.west <= bounds.east
          && box.north >= bounds.south
          && box.south <= bounds.north;
        if (!intersectsViewport) return;
        territories.push({
          ownerId: row.owner.ownerId,
          ownerKind: row.owner.ownerKind,
          chunkId: `z${level}:${row.owner.ownerId}:${componentIndex}:${polygonIndex}`,
          polygon: boundary,
          bbox: box,
          cellCount: componentCellCount,
          occupied: componentCellCount / Math.max(1, row.owner.cellCount),
          color: row.owner.color,
          lat: center.lat,
          lng: center.lng
        });
      });
    }
  }
  if (!overviewTruncated && territories.length >= maxTerritories) {
    overviewTruncated = ownerComponentRows.some((row) => row.nextIndex < row.components.length);
  }

  const payload = { version: marketVersion, zoom, level, territories, truncated: overviewTruncated };
  mapOverviewCache.set(cacheKey, payload);
  if (mapOverviewCache.size > 36) mapOverviewCache.delete(mapOverviewCache.keys().next().value);
  return payload;
}

function writeMarket(market, { upsertIds = null, deleteIds = null, deferPersistence = false } = {}) {
  const patchMode = Array.isArray(upsertIds) || Array.isArray(deleteIds);
  const safeUpsertIds = (Array.isArray(upsertIds) ? upsertIds : []).filter(isPlayableLandId);
  const safeDeleteIds = (Array.isArray(deleteIds) ? deleteIds : []).filter(isPlayableLandId);
  // Full maintenance/admin writes still scrub legacy/invalid ids. Hot-path claim/sell writes
  // already validated their ids, so avoid an O(total occupied cells) copy on every transaction.
  const land = patchMode
    ? (market?.land && typeof market.land === "object" ? market.land : {})
    : cleanMarketLand(market?.land);
  const clean = { land, resetAt: market?.resetAt || null };
  const previousVersion = marketVersion;

  if (storage) storage.market = clean;

  if (dbPool) {
    if (patchMode) {
      const upserts = Object.fromEntries(safeUpsertIds
        .filter((id) => clean.land[id])
        .map((id) => [id, clean.land[id]]));
      persistMarketPatch(upserts, safeDeleteIds);
    } else {
      persistState("market");
    }
  } else {
    // Bulk claims may arrive as several consecutive batches. Keep the in-memory market
    // authoritative immediately, but coalesce expensive full-file rewrites until the burst ends.
    if (deferPersistence) scheduleMarketPersistence();
    else persistMarketToFile();
  }

  const indexPatched = patchMode && patchMarketSpatialIndex(safeUpsertIds, safeDeleteIds, clean, previousVersion);
  marketVersion += 1;
  if (indexPatched) marketSpatialIndexVersion = marketVersion;
}

function readNewsEvents() {
  try {
    const rows = storage?.news || [];
    return Array.isArray(rows)
      ? rows.slice(-80).map((item) => ({
        type: String(item.type || "event").slice(0, 40),
        title: String(item.title || "Новина").slice(0, 120),
        text: String(item.text || "").slice(0, 500),
        at: typeof item.at === "string" ? item.at : new Date().toISOString(),
        tone: String(item.tone || "").slice(0, 40),
        targetCellId: isPlayableLandId(item.targetCellId) ? String(item.targetCellId).slice(0, 48) : null
      }))
      : [];
  } catch {
    return [];
  }
}

function writeNewsEvents(rows) {
  const clean = rows.slice(-80);
  if (storage) {
    storage.news = clean;
    persistState("news");
  } else {
    ensureDataFiles();
    fs.writeFileSync(NEWS_FILE, JSON.stringify(clean, null, 2), "utf8");
  }
  newsCache = { key: "", rows: [] };
}

function appendNewsEvent(row) {
  writeNewsEvents([...readNewsEvents(), {
    ...row,
    at: row.at || new Date().toISOString()
  }]);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function readMessages() {
  return Array.isArray(storage?.messages) ? storage.messages : [];
}

function writeMessages(messages) {
  if (!storage) return;
  storage.messages = messages.slice(-5000);
  persistState("messages");
}

function readPasswordResets() {
  return Array.isArray(storage?.passwordResets) ? storage.passwordResets : [];
}

function writePasswordResets(rows) {
  if (!storage) return;
  storage.passwordResets = rows.slice(-500);
  persistState("passwordResets");
}

async function sendPasswordResetEmail(email, resetUrl) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Password reset for ${email}: ${resetUrl}`);
    return false;
  }
  const nodemailer = require("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Відновлення пароля Землевласник",
    text: `Щоб змінити пароль, відкрийте посилання: ${resetUrl}\n\nПосилання дійсне 1 годину.`,
    html: `<p>Щоб змінити пароль у грі <strong>Землевласник</strong>, відкрийте посилання:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Посилання дійсне 1 годину.</p>`
  });
  return true;
}

function userCompanyName(user, sanitizedFarm = null) {
  const farm = sanitizedFarm && typeof sanitizedFarm === "object" ? sanitizedFarm : sanitizeFarmState(user?.farm);
  const name = String(farm.companyName || "").trim();
  if (!name) return user?.username || "Гравець";
  if (user?.username && (name === `${user.username} Земля` || name === `${user.username} Agro`)) return user.username;
  return name;
}

function publicPlayerDetails(user, rank = null) {
  const farm = sanitizeFarmState(user.farm);
  const settings = readSettings();
  const machineryMap = activeMachineryMap(farm.inventory, farm.currentDay);
  const buildingInventory = Object.values(farm.land || {}).reduce((map, cell) => {
    const id = cell.building || cell.buildingId;
    if (id) map[id] = (map[id] || 0) + 1;
    return map;
  }, {});
  return {
    id: user.id,
    username: user.username,
    companyName: userCompanyName(user, farm),
    logo: farm.logo || "",
    color: farm.color || "#35c982",
    landCount: Object.keys(farm.land || {}).length,
    cash: farm.coins,
    score: farmScoreSanitized(farm, settings),
    income: Object.values(farm.land || {}).reduce((sum, cell) => {
      if (cell.building || cell.buildingId) {
        return isFirstCellInBuildingGroup(cell.id, cell, farm.land) ? sum + buildingDailyIncomeForCell(cell, settings) : sum;
      }
      const base = rangedSettingValue(settings.economy.baseIncomeMin, settings.economy.baseIncomeSpread, cell.id, 180);
      return sum + Math.round(base * fertilizerMultiplier(cell.level || 1, settings) * inventoryIncomeMultiplier(farm.inventory, settings, farm.currentDay));
    }, 0),
    machineryCount: Object.values(machineryMap || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
    buildingCount: Object.values(buildingInventory || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
    machinery: machineryMap,
    buildings: buildingInventory,
    rank
  };
}

function compactMarketEntriesEqual(current, next) {
  if (!current || !next || typeof current !== "object") return false;
  // Legacy rows had price/logo/building/timestamp fields. Treat them as changed once so a
  // normal owner save compacts them instead of carrying that per-cell payload forever.
  if (Object.keys(current).length !== 4) return false;
  return current.ownerId === next.ownerId
    && current.ownerName === next.ownerName
    && current.ownerColor === next.ownerColor
    && Number(current.level || 1) === Number(next.level || 1);
}

function marketEntryForCell(farm, ownerId, ownerName, cell) {
  // Keep the global ownership index compact. Price, timestamps, buildings and logos live in
  // the owner's farm state; map queries only need ownership metadata and the land level.
  return compactMarketEntry({
    ownerId,
    ownerName,
    ownerColor: farm.color || "#35c982",
    level: Number.isFinite(cell?.level) ? cell.level : 1
  });
}

function mergeFarmIntoMarket(farm, ownerId, ownerName) {
  const market = readMarket();
  const settings = readSettings();
  let changed = false;
  const changedIds = [];
  Object.entries(farm.land || {}).forEach(([id, cell]) => {
    if (!isPlayableLandId(id)) return;
    if (market.land[id] && market.land[id].ownerId !== ownerId) return;
    const nextEntry = marketEntryForCell(farm, ownerId, ownerName, cell, settings);
    if (compactMarketEntriesEqual(market.land[id], nextEntry)) return;
    market.land[id] = nextEntry;
    changedIds.push(id);
    changed = true;
  });
  if (changed) writeMarket(market, { upsertIds: changedIds });
  return market;
}

function reconcileFarmLandWithMarket(submittedFarm, storedFarm, market, ownerId) {
  const land = {};
  const submittedLand = submittedFarm.land || {};
  const storedLand = storedFarm.land || {};
  const candidateIds = new Set([...Object.keys(storedLand), ...Object.keys(submittedLand)]);
  candidateIds.forEach((id) => {
    if (market.land[id]?.ownerId !== ownerId) return;
    land[id] = submittedLand[id] || storedLand[id];
  });
  return { ...submittedFarm, land };
}

function refreshRegisteredMarketEntries(users = readUsers()) {
  const market = readMarket();
  const settings = readSettings();
  const registeredIds = new Set(users.map((user) => user.id));
  const deleteIds = [];
  const upsertIds = [];
  Object.entries(market.land || {}).forEach(([id, owner]) => {
    if (!registeredIds.has(owner?.ownerId)) return;
    delete market.land[id];
    deleteIds.push(id);
  });
  users.forEach((user) => {
    const farm = sanitizeFarmState(user.farm);
    const ownerName = userCompanyName(user, farm);
    Object.entries(farm.land || {}).forEach(([id, cell]) => {
      if (!isPlayableLandId(id)) return;
      market.land[id] = marketEntryForCell(farm, user.id, ownerName, cell, settings);
      upsertIds.push(id);
    });
  });
  writeMarket(market, { upsertIds, deleteIds });
  return market;
}

function farmScoreSanitized(clean, settings = readSettings()) {
  const landValue = Object.values(clean.land || {}).reduce((sum, cell) => {
    return sum
      + cell.price
      + improvementCostForLevel(cell.level, settings)
      + (isFirstCellInBuildingGroup(cell.id, cell, clean.land) ? buildingCostForCell(cell, settings) : 0);
  }, 0);
  return clean.coins + landValue + inventoryValue(clean.inventory, settings, clean.currentDay);
}

function farmScore(farm) {
  return farmScoreSanitized(sanitizeFarmState(farm));
}

function inventoryValue(inventory, settings = readSettings(), currentDay = 1) {
  const machineryMap = activeMachineryMap(inventory, currentDay);
  const machinery = settings.assets.machineryItems.reduce((sum, item) => sum + ((machineryMap || {})[item.id] || 0) * item.cost, 0);
  return machinery;
}

function inventoryIncomeMultiplier(inventory, settings = readSettings(), currentDay = 1) {
  const machineryMap = activeMachineryMap(inventory, currentDay);
  const machineryBonus = settings.assets.machineryItems.reduce((sum, item) => sum + Math.min(item.maxActiveUnits || 1, (machineryMap || {})[item.id] || 0) * item.incomeBonusPercent, 0);
  return 1 + machineryBonus / 100;
}

function activeMachineryMap(inventory, currentDay = 1) {
  const batches = Array.isArray(inventory?.machineryBatches) ? inventory.machineryBatches : [];
  if (!batches.length) return inventory?.machinery || {};
  return batches.reduce((map, batch) => {
    if ((batch.expiresDay || 0) < currentDay) return map;
    map[batch.id] = (map[batch.id] || 0) + (batch.qty || 0);
    return map;
  }, {});
}

function buildingItemById(id, settings = readSettings()) {
  return settings.assets.elevatorItems.find((item) => item.id === id) || null;
}

function buildingCostForCell(cell, settings = readSettings()) {
  const item = buildingItemById(cell?.building, settings);
  return item ? item.cost || 0 : 0;
}

function buildingDailyIncomeForCell(cell, settings = readSettings()) {
  const item = buildingItemById(cell?.building, settings);
  return item ? item.incomePerDay || 0 : 0;
}

function buildingDailyIncomeForFarm(farm, settings = readSettings()) {
  const counted = new Set();
  return Object.values(farm.land || {}).reduce((sum, cell) => {
    const item = buildingItemById(cell?.building || cell?.buildingId, settings);
    if (!item) return sum;
    const key = cell.buildingGroupId || `${cell.id}:${item.id}`;
    if (counted.has(key)) return sum;
    counted.add(key);
    return sum + (item.incomePerDay || 0);
  }, 0);
}

function machineryServiceExtensionForFarm(farm, settings = readSettings()) {
  const counted = new Set();
  return Object.values(farm.land || {}).reduce((sum, cell) => {
    const item = buildingItemById(cell?.building || cell?.buildingId, settings);
    if (!item) return sum;
    const key = cell.buildingGroupId || `${cell.id}:${item.id}`;
    if (counted.has(key)) return sum;
    counted.add(key);
    return sum + Math.max(0, Number(item.serviceLifeExtensionDays) || 0);
  }, 0);
}

const buildingGroupFirstCellCache = new WeakMap();

function firstBuildingCellIds(land) {
  if (!land || typeof land !== "object") return new Set();
  const cached = buildingGroupFirstCellCache.get(land);
  if (cached) return cached;
  const firstIds = new Set();
  const seenGroups = new Set();
  Object.entries(land).forEach(([id, cell]) => {
    if (!cell?.building && !cell?.buildingId) return;
    const groupId = cell.buildingGroupId;
    if (!groupId) {
      firstIds.add(id);
      return;
    }
    if (seenGroups.has(groupId)) return;
    seenGroups.add(groupId);
    firstIds.add(id);
  });
  buildingGroupFirstCellCache.set(land, firstIds);
  return firstIds;
}

function isFirstCellInBuildingGroup(cellId, cell, land) {
  if (!cell?.building && !cell?.buildingId) return false;
  return firstBuildingCellIds(land).has(cellId);
}

function improvementCostForLevel(level, settings = readSettings()) {
  return GameRules.improvementCostForLevel(level, settings.upgrades.landLevels);
}

function fertilizerMultiplier(level, settings = readSettings()) {
  return GameRules.fertilizerMultiplier(level, settings.upgrades.landLevels);
}

function incomeForLandIdServer(id, settings = readSettings()) {
  return GameRules.incomeForLandId(id, settings.economy || {});
}

function clusterBonusMapForFarm(farm, settings = readSettings()) {
  const remaining = new Set(Object.keys(farm.land || {}));
  const bonusMap = new Map();
  const rules = Array.isArray(settings.clusters) ? settings.clusters : [];

  while (remaining.size) {
    const start = remaining.values().next().value;
    const queue = [start];
    const cluster = [];
    remaining.delete(start);
    let cursor = 0;
    while (cursor < queue.length) {
      const id = queue[cursor++];
      cluster.push(id);
      const { q, r } = parseCellGridId(id);
      for (let dq = -1; dq <= 1; dq += 1) {
        for (let dr = -1; dr <= 1; dr += 1) {
          if (!dq && !dr) continue;
          const neighborId = `cell-${q + dq}-${r + dr}`;
          if (!remaining.has(neighborId)) continue;
          remaining.delete(neighborId);
          queue.push(neighborId);
        }
      }
    }
    const bonus = rules
      .filter((rule) => cluster.length >= (rule.min || 0))
      .reduce((best, rule) => Math.max(best, (Number(rule.bonusPercent) || 0) / 100), 0);
    cluster.forEach((id) => bonusMap.set(id, bonus));
  }

  return bonusMap;
}

function farmDailyIncomeServer(farm, settings = readSettings(), clusterMap = null) {
  const bonuses = clusterMap || clusterBonusMapForFarm(farm, settings);
  const machineryMultiplier = inventoryIncomeMultiplier(farm.inventory, settings, farm.currentDay || 1);
  const countedBuildings = new Set();
  let rawIncome = 0;

  Object.entries(farm.land || {}).forEach(([id, cell]) => {
    const buildingItem = buildingItemById(cell?.building || cell?.buildingId, settings);
    if (buildingItem) {
      const key = cell.buildingGroupId || `${id}:${buildingItem.id}`;
      if (!countedBuildings.has(key)) {
        countedBuildings.add(key);
        rawIncome += Number(buildingItem.incomePerDay) || 0;
      }
      return;
    }
    const base = incomeForLandIdServer(id, settings);
    const landMultiplier = fertilizerMultiplier(cell?.level || 1, settings);
    const clusterMultiplier = 1 + (bonuses.get(id) || 0);
    rawIncome += base * landMultiplier * machineryMultiplier * clusterMultiplier;
  });

  return Math.max(0, Math.floor(rawIncome));
}

function incomeIntervalMs(settings = readSettings()) {
  return Math.max(60, Number(settings.economy?.incomeCycleMinutes) || 1440) * 60 * 1000;
}

function offlineIncomeCapMs(settings = readSettings()) {
  return Math.max(24, Number(settings.economy?.offlineIncomeCapHours) || 168) * 60 * 60 * 1000;
}

function settleDailyIncomeForFarm(farm, settings = readSettings(), nowMs = Date.now()) {
  const intervalMs = incomeIntervalMs(settings);
  const capMs = offlineIncomeCapMs(settings);
  const parsedLast = Date.parse(farm.lastIncomeAt || "");

  if (!Number.isFinite(parsedLast)) {
    farm.lastIncomeAt = new Date(nowMs).toISOString();
    return { changed: true, income: 0, days: 0, nextInMs: intervalMs };
  }

  const elapsedMs = Math.max(0, nowMs - parsedLast);
  const cappedElapsedMs = Math.min(elapsedMs, capMs);
  const days = Math.floor(cappedElapsedMs / intervalMs);
  if (days < 1) {
    return { changed: false, income: 0, days: 0, nextInMs: Math.max(0, intervalMs - elapsedMs) };
  }

  const clusterMap = clusterBonusMapForFarm(farm, settings);
  let income = 0;
  for (let index = 0; index < days; index += 1) {
    income += farmDailyIncomeServer(farm, settings, clusterMap);
    farm.currentDay = Math.max(1, Number(farm.currentDay) || 1) + 1;
  }

  farm.coins = Math.max(0, Math.floor((farm.coins || 0) + income));
  farm.stats = farm.stats || {};
  farm.stats.earned = Math.max(0, Math.floor((farm.stats.earned || 0) + income));
  farm.lastIncomeAt = new Date(elapsedMs > capMs ? nowMs : parsedLast + days * intervalMs).toISOString();

  return {
    changed: true,
    income,
    days,
    nextInMs: Math.max(0, intervalMs - Math.max(0, nowMs - Date.parse(farm.lastIncomeAt)))
  };
}

function settleAllDailyIncome(nowMs = Date.now()) {
  const users = readUsers();
  const settings = readSettings();
  const intervalMs = incomeIntervalMs(settings);
  let changed = false;

  users.forEach((user) => {
    const rawFarm = user?.farm && typeof user.farm === "object" ? user.farm : null;
    const parsedLast = Date.parse(rawFarm?.lastIncomeAt || "");
    if (!Number.isFinite(parsedLast) || nowMs - parsedLast < intervalMs) return;

    const farm = sanitizeFarmState(rawFarm);
    if (!Object.keys(farm.land || {}).length) return;
    const settlement = settleDailyIncomeForFarm(farm, settings, nowMs);
    if (!settlement.changed) return;

    user.farm = farm;
    user.updatedAt = new Date(nowMs).toISOString();
    changed = true;
  });

  if (changed) writeUsers(users, { deferPersistence: true });
  return changed;
}

function leaderboardRows() {
  if (leaderboardCache.version === leaderboardVersion) return leaderboardCache.rows;
  const rows = readUsers().map((user) => {
    const farm = sanitizeFarmState(user.farm);
    return {
      id: user.id,
      name: userCompanyName(user, farm),
      landCount: Object.keys(farm.land || {}).length,
      cash: farm.coins,
      score: farmScoreSanitized(farm)
    };
  })
    .map((row) => ({ landCount: 0, cash: row.score || 0, ...row }))
    .sort((a, b) => b.landCount - a.landCount || b.cash - a.cash || b.score - a.score)
    .slice(0, 12);
  leaderboardCache = { version: leaderboardVersion, rows };
  return rows;
}

function isAdmin(session, users = readUsers()) {
  if (!session || session.isGuest) return false;
  const user = users.find((item) => item.id === session.userId);
  return Boolean(user?.isAdmin);
}

function playerSessionPayload(user) {
  return {
    id: user.id,
    username: user.username,
    isGuest: false,
    isAdmin: Boolean(user.isAdmin)
  };
}

function publicUserRow(user) {
  const farm = sanitizeFarmState(user.farm);
  const settings = readSettings();
  const landCount = Object.keys(farm.land || {}).length;
  const activeMachinery = activeMachineryMap(farm.inventory, farm.currentDay);
  const buildingInventory = Object.values(farm.land || {}).reduce((map, cell) => {
    if (cell.building) map[cell.building] = (map[cell.building] || 0) + 1;
    return map;
  }, {});
  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    companyName: userCompanyName(user, farm),
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    coins: farm.coins,
    currentDay: farm.currentDay,
    landCount,
    color: farm.color,
    income: Object.values(farm.land || {}).reduce((sum, cell) => {
      if (cell.building || cell.buildingId) {
        return isFirstCellInBuildingGroup(cell.id, cell, farm.land)
          ? sum + buildingDailyIncomeForCell(cell, settings)
          : sum;
      }
      const base = rangedSettingValue(settings.economy.baseIncomeMin, settings.economy.baseIncomeSpread, cell.id, 180);
      return sum + Math.round(base * fertilizerMultiplier(cell.level || 1, settings) * inventoryIncomeMultiplier(farm.inventory, settings, farm.currentDay));
    }, 0),
    score: farmScoreSanitized(farm, settings),
    earned: farm.stats.earned,
    purchased: farm.stats.purchased,
    upgraded: farm.stats.upgraded,
    buildings: Object.values(farm.land || {}).filter((cell) => cell.building).length,
    machinery: farm.stats.machinery,
    inventory: { ...farm.inventory, machinery: activeMachinery },
    buildingInventory,
    isAdmin: Boolean(user.isAdmin)
  };
}

function regionFromCell(cell) {
  const nickname = String(cell?.nickname || "").trim();
  if (!nickname) return "невідомий регіон";
  return nickname.split(",")[0].trim() || "невідомий регіон";
}

function companyNameForUser(user, farm) {
  return userCompanyName(user, farm);
}

function adminSummaryUserRow(user) {
  const farm = user?.farm && typeof user.farm === "object" ? user.farm : {};
  const land = farm.land && typeof farm.land === "object" ? farm.land : {};
  const rawCompanyName = String(farm.companyName || "").trim();
  return {
    id: user.id,
    username: user.username || "",
    companyName: rawCompanyName || (user.username || ""),
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    coins: Number(farm.coins) || 0,
    landCount: Object.keys(land).length,
    color: farm.color || "#35c982",
    isAdmin: Boolean(user.isAdmin)
  };
}

function formatMoney(value) {
  return `${Math.floor(value || 0).toLocaleString("uk-UA")} мон.`;
}

function newsRows() {
  const cacheKey = `${marketVersion}:${leaderboardVersion}`;
  if (newsCache.key === cacheKey) return newsCache.rows;
  const users = readUsers();
  const settings = readSettings();
  const farms = users.map((user) => {
    const farm = sanitizeFarmState(user.farm);
    return {
      user,
      farm,
      company: companyNameForUser(user, farm),
      landCount: Object.keys(farm.land || {}).length,
      cash: farm.coins,
      assets: farmScoreSanitized(farm, settings)
    };
  });
  const rows = [];
  const now = new Date().toISOString();
  rows.push(...readNewsEvents());
  const landLeader = [...farms].sort((a, b) => b.landCount - a.landCount || b.cash - a.cash)[0];
  const assetLeader = [...farms].sort((a, b) => b.assets - a.assets || b.cash - a.cash)[0];

  if (landLeader?.user?.id && previousNewsLeaders.land && previousNewsLeaders.land !== landLeader.user.id) {
    rows.push({
      type: "leader-change",
      title: "Зміна лідера за землею",
      text: `${landLeader.company} вийшла на перше місце: ${landLeader.landCount} земельних ділянок.`,
      at: now,
      tone: "hot"
    });
  }
  if (assetLeader?.user?.id && previousNewsLeaders.assets && previousNewsLeaders.assets !== assetLeader.user.id) {
    rows.push({
      type: "leader-change",
      title: "Зміна лідера за активами",
      text: `${assetLeader.company} очолює рейтинг активів: ${formatMoney(assetLeader.assets)} орієнтовної вартості.`,
      at: now,
      tone: "hot"
    });
  }
  previousNewsLeaders = {
    land: landLeader?.user?.id || null,
    assets: assetLeader?.user?.id || null
  };

  const purchases = [];
  const regions = new Map();
  const buildings = [];
  farms.forEach(({ company, farm }) => {
    const seenBuildingGroups = new Set();
    Object.values(farm.land || {}).forEach((cell) => {
      const region = regionFromCell(cell);
      const regionRow = regions.get(region) || { region, count: 0, totalPrice: 0 };
      regionRow.count += 1;
      regionRow.totalPrice += Number(cell.price) || 0;
      regionRow.cellId = regionRow.cellId || cell.id;
      regions.set(region, regionRow);
      purchases.push({
        company,
        region,
        nickname: cell.nickname || region,
        price: Number(cell.price) || 0,
        at: cell.purchasedAt || now,
        cellId: cell.id
      });

      const buildingId = cell.building || cell.buildingId;
      if (!buildingId) return;
      const groupId = cell.buildingGroupId || `${cell.id}:${buildingId}`;
      if (seenBuildingGroups.has(groupId)) return;
      seenBuildingGroups.add(groupId);
      const item = buildingItemById(buildingId, settings);
      const groupCells = Object.values(farm.land || {}).filter((owned) => (owned.buildingGroupId || `${owned.id}:${owned.building || owned.buildingId}`) === groupId);
      buildings.push({
        company,
        name: item?.name || "Побудова",
        count: groupCells.length || 1,
        region,
        at: cell.buildingBuiltAt || cell.purchasedAt || now,
        cellId: cell.id
      });
    });
  });

  const hotRegion = [...regions.values()].sort((a, b) => b.count - a.count || (b.totalPrice / Math.max(1, b.count)) - (a.totalPrice / Math.max(1, a.count)))[0];
  if (hotRegion && hotRegion.count > 0) {
    rows.push({
      type: "hot-region",
      title: "Активний регіон",
      text: `${hotRegion.region}: куплено ${hotRegion.count} земельних ділянок, середня ціна ${formatMoney(hotRegion.totalPrice / hotRegion.count)}. Попит поруч піднімає вартість нових покупок.`,
      at: now,
      tone: "market",
      targetCellId: hotRegion.cellId || null
    });
  }

  const purchaseGroups = new Map();
  purchases.forEach((item) => {
    const date = new Date(item.at);
    const minute = Number.isNaN(date.getTime()) ? "unknown" : Math.floor(date.getTime() / 60000);
    const key = `${item.company}|${item.region}|${minute}`;
    const group = purchaseGroups.get(key) || { ...item, count: 0, totalPrice: 0 };
    group.count += 1;
    group.totalPrice += item.price;
    group.at = new Date(Math.max(new Date(group.at).getTime() || 0, date.getTime() || 0)).toISOString();
    group.cellId = group.cellId || item.cellId;
    purchaseGroups.set(key, group);
  });

  [...purchaseGroups.values()]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8)
    .forEach((item) => rows.push({
      type: "purchase",
      title: "Купівля землі",
      text: `${item.company} купила ${item.count} ${item.count === 1 ? "земельну ділянку" : "земельні ділянки"} в районі ${item.region} за ${formatMoney(item.totalPrice)}.`,
      at: item.at,
      tone: "deal",
      targetCellId: item.cellId
    }));

  buildings
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6)
    .forEach((item) => rows.push({
      type: "building",
      title: "Нова побудова",
      text: `${item.company} побудувала ${item.name} в районі ${item.region}, ${item.count} ділянок.`,
      at: item.at,
      tone: "build",
      targetCellId: item.cellId
    }));

  const result = rows
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 24)
    .map((row) => ({ ...row }));
  newsCache = { key: cacheKey, rows: result };
  return result;
}

function rangedSettingValue(baseValue, spreadValue, id, fallback) {
  const base = Number.isFinite(baseValue) ? baseValue : fallback;
  const spread = Number.isFinite(spreadValue) ? Math.max(0, Math.floor(spreadValue)) : 0;
  if (!spread) return Math.round(base);
  const seed = parseInt(String(id || "").slice(-6), 16) || 1;
  return Math.round(base + (Math.abs(seed) % spread));
}

function adminPayload(users = readUsers(), market = readMarket(), options = {}) {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthAgo = now - 1000 * 60 * 60 * 24 * 30;
  const onlineIds = new Set([...sessions.values()]
    .filter((session) => !session.isGuest && session.expiresAt > now && now - (session.lastSeenAt || 0) < 1000 * 60 * 5)
    .map((session) => session.userId));
  const summaryUsers = users.map(adminSummaryUserRow);
  return {
    users: options.includeUsers === false ? [] : users.map(publicUserRow),
    summary: {
      users: users.length,
      admins: users.filter((user) => user.isAdmin).length,
      occupiedLand: Object.keys(market.land || {}).length,
      totalCash: users.reduce((sum, user) => sum + (Number(user?.farm?.coins) || 0), 0),
      onlineUsers: onlineIds.size,
      registeredToday: users.filter((user) => new Date(user.createdAt || 0).getTime() >= dayStart.getTime()).length,
      registeredLast30Days: users.filter((user) => new Date(user.createdAt || 0).getTime() >= monthAgo).length,
      newestUsers: summaryUsers
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 40)
    }
  };
}

function normalizeUsername(username) {
  return String(username || "").trim().replace(/\s+/g, " ");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, expectedHash] = String(passwordHash || "").split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = crypto.scryptSync(String(password), salt, 64);
  return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), actualHash);
}

function createSession(userId, isGuest = false) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    userId,
    isGuest,
    lastSeenAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  scheduleSessionsPersistence();
  return token;
}

function sessionCookie(token, maxAge) {
  return [
    `agro_session=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(SESSION_COOKIE_SECURE ? ["Secure"] : [])
  ].join("; ");
}

function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)agro_session=([^;]+)/);
  if (!match) return null;

  const token = safeDecodeURIComponent(match[1]);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    scheduleSessionsPersistence();
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  session.lastSeenAt = Date.now();
  scheduleSessionsPersistence();
  return session;
}

function getSessionToken(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)agro_session=([^;]+)/);
  return match ? safeDecodeURIComponent(match[1]) : "";
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function sendJsonCompressed(req, res, status, payload, headers = {}) {
  const content = Buffer.from(JSON.stringify(payload));
  const baseHeaders = {
    "content-type": "application/json; charset=utf-8",
    ...headers
  };
  const acceptsGzip = /\bgzip\b/.test(req?.headers?.["accept-encoding"] || "");
  if (!acceptsGzip || content.length < 4096) {
    res.writeHead(status, baseHeaders);
    res.end(content);
    return;
  }
  // Map payloads contain many repeated ids/coordinates and compress extremely well.
  // Level 3 keeps CPU cost low while avoiding multi-megabyte transfers on overview/detail.
  zlib.gzip(content, { level: 3 }, (error, compressed) => {
    if (error) {
      res.writeHead(status, baseHeaders);
      res.end(content);
      return;
    }
    res.writeHead(status, { ...baseHeaders, "content-encoding": "gzip", vary: "Accept-Encoding" });
    res.end(compressed);
  });
}

function requestVersion(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const clientVersion = Number(url.searchParams.get("version"));
  return Number.isFinite(clientVersion) ? clientVersion : null;
}

function conditionalVersionPayload(req, payload, version) {
  const clientVersion = requestVersion(req);
  if (Number.isFinite(clientVersion) && clientVersion === version) {
    return { ok: true, notModified: true, version };
  }
  return payload;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    req.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > 25_000_000) {
        // Do not destroy the upstream socket here. Nginx reports a destroyed upstream as 502,
        // which hides the real reason from the browser. Drain the request and return JSON 413.
        tooLarge = true;
        body = "";
      }
    });
    req.on("end", () => {
      if (tooLarge) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        return;
      }
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error = new Error("Invalid JSON.");
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }
  const session = getSession(req);
  if (url.pathname === "/admin" && session && !isAdmin(session)) {
    res.writeHead(302, { location: "/" });
    res.end();
    return;
  }
  const requestedPath = safeDecodeURIComponent(url.pathname === "/" || url.pathname === "/admin" ? "/index.html" : url.pathname, "/index.html");
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const versioned = url.searchParams.has("v") || requestedPath.startsWith("/assets/");
    const headers = {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "cache-control": requestedPath === "/index.html" ? "no-cache" : versioned ? "public, max-age=31536000, immutable" : "public, max-age=3600"
    };
    const compressible = /\.(js|css|json|html|svg|geojson)$/i.test(filePath);
    if (compressible && /\bgzip\b/.test(req.headers["accept-encoding"] || "") && content.length > 1024) {
      zlib.gzip(content, { level: 6 }, (gzipError, compressed) => {
        if (gzipError) {
          res.writeHead(200, headers);
          res.end(content);
          return;
        }
        res.writeHead(200, { ...headers, "content-encoding": "gzip", vary: "Accept-Encoding" });
        res.end(compressed);
      });
      return;
    }
    res.writeHead(200, headers);
    res.end(content);
  });
}

async function handleApi(req, res) {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/market")) {
      if (requestVersion(req) === marketVersion) {
        sendJson(res, 200, { ok: true, notModified: true, version: marketVersion });
        return;
      }
      sendJson(res, 200, conditionalVersionPayload(req, globalMarketPayload(), marketVersion));
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/map/cells")) {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const bounds = parseMapBoundsQuery(url.searchParams);
      if (!bounds) {
        sendJson(res, 400, { error: "Потрібні параметри west, east, south, north." });
        return;
      }
      const zoom = intIn(Number(url.searchParams.get("zoom")), 13, 1, 20);
      const configuredLimit = readSettings().map?.maxOwnedCellsPerViewport || MAX_VIEWPORT_MARKET_CELLS;
      const limitParam = url.searchParams.get("limit");
      const requestedLimit = limitParam == null ? configuredLimit : intIn(Number(limitParam), configuredLimit, 6000, 500000);
      sendJsonCompressed(req, res, 200, mapCellsInViewport(bounds, zoom, Math.min(configuredLimit, requestedLimit)));
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/map/overview")) {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const bounds = parseMapBoundsQuery(url.searchParams);
      if (!bounds) {
        sendJson(res, 400, { error: "Потрібні параметри west, east, south, north." });
        return;
      }
      const zoom = intIn(Number(url.searchParams.get("z") || url.searchParams.get("zoom")), 8, 1, 20);
      const playerId = String(url.searchParams.get("playerId") || "").slice(0, 64);
      sendJsonCompressed(req, res, 200, mapOverviewTerritories(bounds, zoom, playerId));
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/leaderboard")) {
      if (requestVersion(req) === leaderboardVersion) {
        sendJson(res, 200, { ok: true, notModified: true, version: leaderboardVersion });
        return;
      }
      sendJson(res, 200, conditionalVersionPayload(req, { rows: leaderboardRows(), version: leaderboardVersion }, leaderboardVersion));
      return;
    }

    if (req.method === "GET" && req.url === "/api/news") {
      sendJson(res, 200, { rows: newsRows() });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/player-info")) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      const users = readUsers();
      const rows = users.map((user) => {
        const farm = sanitizeFarmState(user.farm);
        return {
          user,
          farm,
          landCount: Object.keys(farm.land || {}).length,
          cash: farm.coins,
          score: farmScoreSanitized(farm)
        };
      }).sort((a, b) => b.landCount - a.landCount || b.cash - a.cash || b.score - a.score);
      const index = rows.findIndex((row) => row.user.id === id);
      if (index < 0) {
        sendJson(res, 404, { error: "Власника не знайдено." });
        return;
      }
      const row = rows[index];
      sendJson(res, 200, publicPlayerDetails(row.user, index + 1));
      return;
    }

    if (req.method === "GET" && req.url === "/api/settings") {
      const settings = readSettings();
      const etag = `"${crypto.createHash("sha1").update(JSON.stringify(settings)).digest("hex")}"`;
      if (req.headers["if-none-match"] === etag) {
        res.writeHead(304, { etag, "cache-control": "private, max-age=0, must-revalidate" });
        res.end();
        return;
      }
      sendJson(res, 200, settings, { etag, "cache-control": "private, max-age=0, must-revalidate" });
      return;
    }

    if (req.method === "POST" && req.url === "/api/logout") {
      const token = getSessionToken(req);
      if (token) {
        sessions.delete(token);
        scheduleSessionsPersistence();
      }
      sendJson(res, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
      return;
    }

    if (req.method === "GET" && req.url === "/api/messages/summary") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }
      const users = readUsers();
      const messages = readMessages();
      const partners = new Map();
      messages
        .filter((message) => message.fromId === session.userId || message.toId === session.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((message) => {
          const userId = message.fromId === session.userId ? message.toId : message.fromId;
          if (!partners.has(userId)) {
            const partner = users.find((user) => user.id === userId);
            partners.set(userId, {
              userId,
              username: partner?.username || "Гравець",
              companyName: partner ? userCompanyName(partner) : "Гравець",
              lastText: message.text,
              lastAt: message.createdAt,
              unread: 0
            });
          }
          if (message.toId === session.userId && !message.readAt) {
            partners.get(userId).unread += 1;
          }
        });
      const unread = messages.filter((message) => message.toId === session.userId && !message.readAt).length;
      sendJson(res, 200, { unread, chats: [...partners.values()] });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/messages/thread")) {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }
      const url = new URL(req.url, `http://${req.headers.host}`);
      const partnerId = url.searchParams.get("userId");
      const users = readUsers();
      const partner = users.find((user) => user.id === partnerId);
      if (!partner) {
        sendJson(res, 404, { error: "Гравця не знайдено." });
        return;
      }
      const messages = readMessages();
      let changed = false;
      const rows = messages
        .filter((message) => (message.fromId === session.userId && message.toId === partnerId) || (message.fromId === partnerId && message.toId === session.userId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-100);
      messages.forEach((message) => {
        if (message.fromId === partnerId && message.toId === session.userId && !message.readAt) {
          message.readAt = new Date().toISOString();
          changed = true;
        }
      });
      if (changed) writeMessages(messages);
      sendJson(res, 200, { partner: publicPlayerDetails(partner), messages: rows });
      return;
    }

    if (req.method === "POST" && req.url === "/api/messages/send") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }
      const body = await readBody(req);
      const toUserId = String(body.toUserId || "");
      const text = String(body.text || "").trim().slice(0, 1000);
      const users = readUsers();
      if (!text) {
        sendJson(res, 400, { error: "Повідомлення не може бути порожнім." });
        return;
      }
      if (toUserId === session.userId || !users.some((user) => user.id === toUserId)) {
        sendJson(res, 404, { error: "Отримувача не знайдено." });
        return;
      }
      const messages = readMessages();
      messages.push({
        id: crypto.randomUUID(),
        fromId: session.userId,
        toId: toUserId,
        text,
        createdAt: new Date().toISOString(),
        readAt: null
      });
      writeMessages(messages);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/claim") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const requestedCells = Array.isArray(body.cells) ? body.cells.slice(0, 1000) : [];
      const market = readMarket();
      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 404, { error: "Гравця не знайдено." });
        return;
      }
      // Claim is a hot path and can run for players with 90k+ cells. Re-sanitizing the whole
      // farm twice per 1000-cell batch allocates tens of MB and can make Nginx lose upstream.
      // Mutate only the already validated transaction fields; full sanitization still happens
      // on login and explicit full-save routes.
      const farm = mutableFarmForLandTransaction(user);
      const ownerName = user.username || "Гравець";
      const settings = readSettings();
      const now = new Date().toISOString();
      const claimed = [];
      const rejected = [];
      const alreadyOwned = [];
      const prices = {};
      let charged = 0;
      const ownedBeforeClaim = Object.keys(farm.land || {}).length;
      const packageFreeIds = new Set(requestedCells
        .map((cell) => typeof cell?.id === "string" ? cell.id.slice(0, 48) : "")
        .filter((id) => isPlayableLandId(id) && !market.land[id]));

      requestedCells.forEach((cell) => {
        const id = typeof cell.id === "string" ? cell.id.slice(0, 48) : "";
        if (!isPlayableLandId(id)) return;
        const { q, r } = parseCellGridId(id);
        if (!isPlayableGridCellServer(q, r)) {
          rejected.push(id);
          return;
        }
        const existing = market.land[id];
        if (existing) {
          if (existing.ownerId === session.userId) {
            alreadyOwned.push(id);
            const ownedPrice = Number(farm.land?.[id]?.price);
            prices[id] = Number.isFinite(ownedPrice) ? ownedPrice : authoritativeLandPrice(id, market, settings, ownedBeforeClaim + claimed.length);
          } else {
            rejected.push(id);
          }
          return;
        }
        const price = authoritativeLandPrice(id, market, settings, ownedBeforeClaim + claimed.length, packageFreeIds);
        if (farm.coins - charged < price) {
          rejected.push(id);
          return;
        }
        charged += price;
        prices[id] = price;
        market.land[id] = compactMarketEntry({
          ownerId: session.userId,
          ownerName: session.isGuest ? "Гостьова розвідка" : (farm.companyName || ownerName),
          ownerColor: farm.color,
          level: 1
        });
        claimed.push(id);
      });

      farm.coins = Math.max(0, Math.floor(farm.coins - charged));
      farm.stats.purchased = Math.max(0, (farm.stats.purchased || 0) + claimed.length);
      if (ownedBeforeClaim === 0 && claimed.length) farm.lastIncomeAt = now;
      const requestedById = new Map(requestedCells.map((cell) => [cell.id, cell]));
      claimed.forEach((id) => {
        const requested = requestedById.get(id) || {};
        farm.land[id] = {
          id,
          price: prices[id],
          purchasedAt: now,
          level: 1,
          building: null,
          buildingId: null,
          buildingGroupId: null,
          buildingBuiltAt: null,
          buildingLevel: 0,
          machinery: false,
          machineryLevel: 0,
          nickname: typeof requested.nickname === "string" ? requested.nickname.slice(0, 36) : ""
        };
      });
      user.farm = farm;
      user.updatedAt = now;
      // Reply first and persist the large users snapshot after the burst of claim batches.
      // scheduleUsersPersistence() is debounced, so 4 x 1000-cell requests cause one write.
      writeUsers(users, { deferPersistence: true });
      if (claimed.length) writeMarket(market, { upsertIds: claimed, deferPersistence: true });
      if (claimed.length) {
        const regions = [...new Set(claimed.map((id) => String(requestedById.get(id)?.region || "невідомий регіон").trim()).filter(Boolean))];
        const region = regions.length === 1 ? regions[0] : regions[0] || "невідомий регіон";
        appendNewsEvent({
          type: "purchase",
          title: "Купівля землі",
          text: `${farm.companyName || ownerName} купила ${claimed.length} ${claimed.length === 1 ? "земельну ділянку" : "земельні ділянки"} в районі ${region}.`,
          tone: "deal",
          targetCellId: claimed[0]
        });
      }
      sendJson(res, 200, { ok: true, claimed, rejected, alreadyOwned, prices, charged, coins: farm.coins, stats: farm.stats, lastIncomeAt: farm.lastIncomeAt, ...marketVersionPayload() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/sell") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const requestedCells = Array.isArray(body.cells) ? body.cells : [];
      const ids = requestedCells
        .map((cell) => typeof cell === "string" ? cell : cell?.id)
        .filter((id) => isPlayableLandId(id));
      if (!ids.length) {
        sendJson(res, 200, { ok: true, sold: 0, soldIds: [], ...marketVersionPayload() });
        return;
      }
      const settings = readSettings();
      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 404, { error: "Користувача не знайдено." });
        return;
      }
      const farm = sanitizeFarmState(user.farm);
      const market = readMarket();
      let sold = 0;
      const soldIds = [];
      let sellerName = "Гравець";
      let targetCellId = null;
      const regions = [];
      let totalRefund = 0;
      const requestedIdSet = new Set(ids);
      const invalidBuildingGroups = new Set();
      const refundedBuildingGroups = new Set();

      Object.entries(farm.land || {}).forEach(([id, cell]) => {
        const groupId = cell?.buildingGroupId;
        if (!groupId || !requestedIdSet.has(id)) return;
        const groupIds = Object.entries(farm.land || {})
          .filter(([, candidate]) => candidate?.buildingGroupId === groupId)
          .map(([candidateId]) => candidateId);
        if (groupIds.some((candidateId) => !requestedIdSet.has(candidateId))) invalidBuildingGroups.add(groupId);
      });

      ids.forEach((id) => {
        const marketCell = market.land[id];
        const farmCell = farm.land?.[id];
        if (farmCell?.buildingGroupId && invalidBuildingGroups.has(farmCell.buildingGroupId)) return;
        if (marketCell?.ownerId === session.userId && farmCell) {
          sellerName = marketCell.ownerName || sellerName;
          targetCellId = targetCellId || id;
          const requestRow = requestedCells.find((cell) => typeof cell !== "string" && cell?.id === id);
          if (requestRow?.region) regions.push(String(requestRow.region));
          const buildingKey = (farmCell.building || farmCell.buildingId)
            ? (farmCell.buildingGroupId || `cell:${id}`)
            : null;
          const buildingValue = buildingKey && !refundedBuildingGroups.has(buildingKey)
            ? buildingCostForCell(farmCell, settings)
            : 0;
          if (buildingKey) refundedBuildingGroups.add(buildingKey);
          const baseValue = landPriceForMarket(id, market, settings)
            + improvementCostForLevel(farmCell.level || 1, settings)
            + buildingValue;
          const refundRate = Number.isFinite(settings.economy?.sellRefundPercent) ? settings.economy.sellRefundPercent / 100 : 0.50;
          const refund = Math.max(0, Math.floor(baseValue * refundRate));
          delete market.land[id];
          delete farm.land[id];
          totalRefund += refund;
          sold += 1;
          soldIds.push(id);
        }
      });

      if (!sold) {
        sendJson(res, 200, { ok: true, sold: 0, soldIds: [], ...marketVersionPayload() });
        return;
      }

      farm.coins = Math.max(0, Math.floor((farm.coins || 0) + totalRefund));
      user.farm = sanitizeFarmState(farm);
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      writeMarket(market, { deleteIds: soldIds });
      if (sold) {
        const region = [...new Set(regions.map((item) => item.trim()).filter(Boolean))][0] || "невідомий регіон";
        appendNewsEvent({
          type: "sale",
          title: "Продаж землі",
          text: `${sellerName} продала ${sold} ${sold === 1 ? "земельну ділянку" : "земельні ділянки"} в районі ${region}.`,
          tone: "deal",
          targetCellId
        });
      }
      sendJson(res, 200, {
        ok: true,
        sold,
        soldIds,
        refund: totalRefund,
        coins: farm.coins,
        ...marketVersionPayload()
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/purchase-asset") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const kind = String(body.kind || "");
      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 404, { error: "Гравця не знайдено." });
        return;
      }
      const settings = readSettings();
      const farm = sanitizeFarmState(user.farm);
      const now = new Date().toISOString();
      const landPatch = {};
      let charged = 0;
      let marketChangedIds = [];

      if (kind === "fertilizer") {
        const targetLevel = Math.max(1, Math.floor(Number(body.level) || 1));
        const targetRule = settings.upgrades.landLevels.find((item) => item.level === targetLevel);
        if (!targetRule || targetLevel <= 1) {
          sendJson(res, 400, { error: "Некоректний рівень добрив." });
          return;
        }
        const cellIds = [...new Set((Array.isArray(body.cellIds) ? body.cellIds : []).filter((id) => isPlayableLandId(id)))];
        const targets = cellIds.filter((id) => {
          const cell = farm.land?.[id];
          return cell && !cell.building && !cell.buildingId && (cell.level || 1) < targetLevel;
        });
        if (!targets.length) {
          sendJson(res, 400, { error: "Немає ділянок, які можна покращити до цього рівня." });
          return;
        }
        charged = targets.reduce((sum, id) => {
          const currentLevel = farm.land[id].level || 1;
          return sum + settings.upgrades.landLevels
            .filter((item) => item.level > currentLevel && item.level <= targetLevel)
            .reduce((subtotal, item) => subtotal + (item.cost || 0), 0);
        }, 0);
        if (farm.coins < charged) {
          sendJson(res, 400, { error: `Для добрив потрібно ${charged} мон.` });
          return;
        }
        farm.coins -= charged;
        targets.forEach((id) => {
          farm.land[id].level = targetLevel;
          landPatch[id] = { level: targetLevel };
        });
        farm.stats.upgraded = Math.max(0, (farm.stats.upgraded || 0) + targets.length);
        marketChangedIds = targets;
      } else if (kind === "machinery") {
        const item = settings.assets.machineryItems.find((candidate) => candidate.id === String(body.itemId || ""));
        if (!item) {
          sendJson(res, 400, { error: "Техніку не знайдено." });
          return;
        }
        const ownedCount = Object.keys(farm.land || {}).length;
        if (ownedCount < Math.max(1, item.minCells || 1)) {
          sendJson(res, 400, { error: `Для цієї техніки потрібно щонайменше ${Math.max(1, item.minCells || 1)} ділянок.` });
          return;
        }
        const active = activeMachineryMap(farm.inventory, farm.currentDay || 1);
        const maxActiveUnits = Math.max(1, Number(item.maxActiveUnits) || 1);
        if ((active[item.id] || 0) >= maxActiveUnits) {
          sendJson(res, 400, { error: `Ліміт цієї техніки: ${maxActiveUnits} активн. од.` });
          return;
        }
        charged = Math.max(0, Number(item.cost) || 0);
        if (farm.coins < charged) {
          sendJson(res, 400, { error: `Для покупки потрібно ${charged} мон.` });
          return;
        }
        farm.coins -= charged;
        const duration = Math.max(1, Number(item.durationDays) || 80);
        const extension = machineryServiceExtensionForFarm(farm, settings);
        farm.inventory = farm.inventory || { machinery: {}, elevators: {}, machineryBatches: [] };
        farm.inventory.machineryBatches = (Array.isArray(farm.inventory.machineryBatches) ? farm.inventory.machineryBatches : [])
          .filter((batch) => (batch.expiresDay || 0) >= (farm.currentDay || 1));
        farm.inventory.machineryBatches.push({
          id: item.id,
          qty: 1,
          purchasedDay: farm.currentDay || 1,
          expiresDay: (farm.currentDay || 1) + duration + extension
        });
        farm.inventory.machinery = activeMachineryMap(farm.inventory, farm.currentDay || 1);
        farm.stats.machinery = Math.max(0, (farm.stats.machinery || 0) + 1);
      } else if (kind === "building") {
        const item = settings.assets.elevatorItems.find((candidate) => candidate.id === String(body.itemId || ""));
        if (!item) {
          sendJson(res, 400, { error: "Побудову не знайдено." });
          return;
        }
        const required = Math.max(1, Number(item.minCells) || settings.upgrades.elevatorMinSelectedCells || 3);
        const cellIds = [...new Set((Array.isArray(body.cellIds) ? body.cellIds : []).filter((id) => isPlayableLandId(id)))];
        if (cellIds.length !== required) {
          sendJson(res, 400, { error: `Для цієї побудови потрібно рівно ${required} ділянок.` });
          return;
        }
        const valid = cellIds.every((id) => farm.land?.[id] && !farm.land[id].building && !farm.land[id].buildingId);
        if (!valid) {
          sendJson(res, 400, { error: "Усі вибрані ділянки мають належати вам і бути без побудов." });
          return;
        }
        if (!areCellIdsConnected(cellIds)) {
          sendJson(res, 400, { error: "Ділянки для побудови мають утворювати один суміжний масив." });
          return;
        }
        const ownedCount = Object.keys(farm.land || {}).length;
        // A building must be allowed to occupy at least its own required footprint.
        const maxAllowed = Math.max(required, Math.floor(ownedCount * Math.min(100, Math.max(1, Number(item.maxOwnerLandPercent) || 25)) / 100));
        const existingCells = Object.values(farm.land || {}).filter((cell) => (cell.building || cell.buildingId) === item.id).length;
        if (existingCells + required > maxAllowed) {
          sendJson(res, 400, { error: `Ліміт цієї побудови: максимум ${maxAllowed} ділянок.` });
          return;
        }
        charged = Math.max(0, Number(item.cost) || 0);
        if (farm.coins < charged) {
          sendJson(res, 400, { error: `Для побудови потрібно ${charged} мон.` });
          return;
        }
        farm.coins -= charged;
        const groupId = `b-${crypto.randomUUID()}`;
        cellIds.forEach((id) => {
          farm.land[id].building = item.id;
          farm.land[id].buildingId = item.id;
          farm.land[id].buildingGroupId = groupId;
          farm.land[id].buildingBuiltAt = now;
          farm.land[id].buildingLevel = 1;
          landPatch[id] = {
            building: item.id, buildingId: item.id, buildingGroupId: groupId,
            buildingBuiltAt: now, buildingLevel: 1
          };
        });
        farm.stats.buildings = Object.values(farm.land || {}).filter((cell) => cell.building || cell.buildingId).length;
      } else if (kind === "demolish") {
        const requested = new Set((Array.isArray(body.cellIds) ? body.cellIds : []).filter((id) => isPlayableLandId(id)));
        const targets = new Set();
        requested.forEach((id) => {
          const cell = farm.land?.[id];
          if (!cell || (!cell.building && !cell.buildingId)) return;
          if (cell.buildingGroupId) {
            Object.entries(farm.land || {}).forEach(([candidateId, candidate]) => {
              if (candidate.buildingGroupId === cell.buildingGroupId) targets.add(candidateId);
            });
          } else {
            targets.add(id);
          }
        });
        if (!targets.size) {
          sendJson(res, 400, { error: "На вибраних ділянках немає побудови." });
          return;
        }
        targets.forEach((id) => {
          farm.land[id].building = null;
          farm.land[id].buildingId = null;
          farm.land[id].buildingGroupId = null;
          farm.land[id].buildingBuiltAt = null;
          farm.land[id].buildingLevel = 0;
          landPatch[id] = {
            building: null, buildingId: null, buildingGroupId: null,
            buildingBuiltAt: null, buildingLevel: 0
          };
        });
        farm.stats.buildings = Object.values(farm.land || {}).filter((cell) => cell.building || cell.buildingId).length;
      } else {
        sendJson(res, 400, { error: "Невідомий тип покупки." });
        return;
      }

      user.farm = sanitizeFarmState(farm);
      user.updatedAt = now;
      writeUsers(users);
      if (marketChangedIds.length) {
        const market = readMarket();
        marketChangedIds.forEach((id) => {
          if (market.land[id]?.ownerId === session.userId) market.land[id].level = user.farm.land[id]?.level || 1;
        });
        writeMarket(market, { upsertIds: marketChangedIds });
      }
      sendJson(res, 200, {
        ok: true,
        kind,
        charged,
        coins: user.farm.coins,
        currentDay: user.farm.currentDay,
        inventory: user.farm.inventory,
        stats: user.farm.stats,
        landPatch
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/collect-income") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 404, { error: "Гравця не знайдено." });
        return;
      }

      const settings = readSettings();
      const farm = sanitizeFarmState(user.farm);
      if (!Object.keys(farm.land || {}).length) {
        sendJson(res, 400, { error: "Спочатку купіть землю, щоб отримувати пасивний дохід." });
        return;
      }

      const nowMs = Date.now();
      const settlement = settleDailyIncomeForFarm(farm, settings, nowMs);
      user.farm = farm;
      user.updatedAt = new Date(nowMs).toISOString();
      if (settlement.changed) writeUsers(users);

      sendJson(res, 200, {
        ok: true,
        income: settlement.income,
        days: settlement.days,
        cycles: settlement.days,
        coins: farm.coins,
        currentDay: farm.currentDay,
        lastIncomeAt: farm.lastIncomeAt,
        nextInMs: settlement.nextInMs,
        dailyIncome: farmDailyIncomeServer(farm, settings),
        stats: farm.stats
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/profile") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      if (session.isGuest) {
        let farm = sanitizeFarmState(body.farm);
        const marketSnapshot = readMarket();
        if (marketSnapshot.resetAt && farm.lastAdminResetAt !== marketSnapshot.resetAt) {
          farm = { ...farm, land: {}, lastAdminResetAt: marketSnapshot.resetAt };
        }
        mergeFarmIntoMarket(farm, session.userId, farm.companyName || "Гостьова розвідка");
        sendJson(res, 200, { ok: true, farm, ...marketVersionPayload() });
        return;
      }

      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }

      // Profile editing must not upload/sanitize/reconcile the whole land object. A farm with
      // 90k+ cells made a three-field profile save unnecessarily expensive.
      if (body.profile && typeof body.profile === "object") {
        const farm = user.farm && typeof user.farm === "object" ? user.farm : defaultFarmState();
        const profile = sanitizeProfilePatch(body.profile, farm);
        user.farm = { ...farm, ...profile };
        user.updatedAt = new Date().toISOString();
        writeUsers(users, { deferPersistence: true });
        touchMapPresentationVersion();
        sendJson(res, 200, { ok: true, profile, ...marketVersionPayload() });
        return;
      }

      // Backward compatibility for older clients that still send the complete farm.
      let farm = sanitizeFarmState(body.farm);
      const marketSnapshot = readMarket();
      if (marketSnapshot.resetAt && farm.lastAdminResetAt !== marketSnapshot.resetAt) {
        farm = { ...farm, land: {}, lastAdminResetAt: marketSnapshot.resetAt };
      }
      farm = reconcileFarmLandWithMarket(farm, sanitizeFarmState(user.farm), marketSnapshot, user.id);
      user.farm = farm;
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      mergeFarmIntoMarket(farm, user.id, userCompanyName(user, farm));
      sendJson(res, 200, { ok: true, farm, ...marketVersionPayload() });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/admin")) {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const includeUsers = url.searchParams.get("includeUsers") === "1";
      const payload = adminPayload(users, readMarket(), { includeUsers });
      sendJson(res, 200, { ...payload, settings: readSettings() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/settings") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const body = await readBody(req);
      const settings = writeSettings(body.settings || body);
      sendJson(res, 200, { ok: true, settings, ...adminPayload(users, readMarket(), { includeUsers: false }) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/rebuild-grid") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const body = await readBody(req);
      if (body.confirm !== "RESET_LAND") {
        sendJson(res, 400, { error: "Перебудова сітки потребує явного підтвердження обнулення землі." });
        return;
      }
      const targetCells = intIn(body.targetCells, 0, 50000, 1000000);
      if (!targetCells) {
        sendJson(res, 400, { error: "Вкажіть цільову кількість від 50 000 до 1 000 000 комірок." });
        return;
      }

      const grid = playableGridForTarget(targetCells);
      if (!grid?.count || grid.count < 10000) {
        sendJson(res, 500, { error: "Не вдалося побудувати коректну сітку України." });
        return;
      }

      writePlayableGridPayload(grid);
      const currentSettings = readSettings();
      const settings = writeSettings({
        ...currentSettings,
        map: {
          ...(currentSettings.map || {}),
          cellWidthDegrees: grid.cellWidthDegrees,
          cellHeightDegrees: grid.cellHeightDegrees,
          gridCellCount: grid.count
        }
      });
      // writeSettings clears the runtime grid cache, so immediately seed it with the grid that
      // was just generated rather than forcing a second disk parse on the first request.
      playableGridRowsCache = new Map(Object.entries(grid.rows || {}).map(([r, ranges]) => [Number(r), ranges]));

      const resetAt = new Date().toISOString();
      users.forEach((user) => {
        const farm = sanitizeFarmState(user.farm);
        user.farm = {
          ...farm,
          land: {},
          lastAdminResetAt: resetAt,
          stats: { ...farm.stats, purchased: 0, upgraded: 0, buildings: 0, machinery: 0 },
          events: [{ text: `Адміністратор перебудував сітку карти до ${grid.count} комірок. Землі обнулено.`, at: resetAt }, ...farm.events].slice(0, 30),
          ledger: [{
            type: "admin",
            text: `Перебудова сітки карти до ${grid.count} комірок; усі землі обнулено.`,
            amount: 0,
            balance: farm.coins,
            landDelta: -Object.keys(farm.land || {}).length,
            at: resetAt
          }, ...farm.ledger].slice(0, 1000)
        };
        user.updatedAt = resetAt;
      });
      writeUsers(users);
      writeMarket({ land: {}, resetAt });
      sendJson(res, 200, {
        ok: true,
        settings,
        grid: {
          requested: targetCells,
          count: grid.count,
          cellWidthDegrees: grid.cellWidthDegrees,
          cellHeightDegrees: grid.cellHeightDegrees
        },
        ...adminPayload(users, readMarket()),
        farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm)
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/reset-land") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const resetAt = new Date().toISOString();
      users.forEach((user) => {
        const farm = sanitizeFarmState(user.farm);
        user.farm = {
          ...farm,
          land: {},
          lastAdminResetAt: resetAt,
          stats: { ...farm.stats, purchased: 0, upgraded: 0, buildings: 0, machinery: 0 },
          events: [{ text: "Адміністратор обнулив усі землі.", at: resetAt }, ...farm.events].slice(0, 30),
          ledger: [{
            type: "admin",
            text: "Адміністратор обнулив усі землі.",
            amount: 0,
            balance: farm.coins,
            landDelta: -Object.keys(farm.land || {}).length,
            at: resetAt
          }, ...farm.ledger].slice(0, 1000)
        };
        user.updatedAt = new Date().toISOString();
      });
      writeUsers(users);
      writeMarket({ land: {}, resetAt });
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()), farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/reset-money") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const settings = readSettings();
      const resetAt = new Date().toISOString();
      users.forEach((user) => {
        const farm = sanitizeFarmState(user.farm);
        user.farm = {
          ...farm,
          coins: settings.economy.startingCoins,
          events: [{ text: `Адміністратор обнулив гроші до ${settings.economy.startingCoins} мон.`, at: resetAt }, ...farm.events].slice(0, 30),
          ledger: [{
            type: "admin",
            text: `Обнулення грошей адміністратором до ${settings.economy.startingCoins} мон.`,
            amount: settings.economy.startingCoins - farm.coins,
            balance: settings.economy.startingCoins,
            landDelta: 0,
            at: resetAt
          }, ...farm.ledger].slice(0, 1000)
        };
        user.updatedAt = resetAt;
      });
      writeUsers(users);
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()), farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/reset-machinery") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const resetAt = new Date().toISOString();
      users.forEach((user) => {
        const farm = sanitizeFarmState(user.farm);
        farm.inventory = { ...farm.inventory, machinery: {}, machineryBatches: [] };
        farm.stats.machinery = 0;
        farm.events = [{ text: "Адміністратор обнулив техніку.", at: resetAt }, ...farm.events].slice(0, 30);
        farm.ledger = [{
          type: "admin",
          text: "Обнулення техніки адміністратором.",
          amount: 0,
          balance: farm.coins,
          landDelta: 0,
          at: resetAt
        }, ...farm.ledger].slice(0, 1000);
        user.farm = farm;
        user.updatedAt = resetAt;
      });
      writeUsers(users);
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()), farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/reset-assets") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const resetAt = new Date().toISOString();
      users.forEach((user) => {
        const farm = sanitizeFarmState(user.farm);
        user.farm = {
          ...farm,
          land: {},
          inventory: { machinery: {}, elevators: {}, machineryBatches: [] },
          lastAdminResetAt: resetAt,
          stats: { ...farm.stats, purchased: 0, upgraded: 0, buildings: 0, machinery: 0 },
          events: [{ text: "Адміністратор обнулив власність і активи.", at: resetAt }, ...farm.events].slice(0, 30),
          ledger: [{
            type: "admin",
            text: "Обнулення власності й активів адміністратором.",
            amount: 0,
            balance: farm.coins,
            landDelta: -Object.keys(farm.land || {}).length,
            at: resetAt
          }, ...farm.ledger].slice(0, 1000)
        };
        user.updatedAt = resetAt;
      });
      writeUsers(users);
      writeMarket({ land: {}, resetAt });
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()), farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/clear-events") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const body = await readBody(req);
      const targetId = typeof body.id === "string" ? body.id : "";
      users.forEach((user) => {
        if (targetId && user.id !== targetId) return;
        const farm = sanitizeFarmState(user.farm);
        user.farm = { ...farm, events: [] };
        user.updatedAt = new Date().toISOString();
      });
      writeUsers(users);
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()), farm: sanitizeFarmState(users.find((user) => user.id === session.userId)?.farm) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/delete-user") {
      const session = getSession(req);
      let users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const body = await readBody(req);
      const user = users.find((item) => item.id === body.id);
      if (!user) {
        sendJson(res, 404, { error: "Учасника не знайдено." });
        return;
      }
      if (user.username === ADMIN_USERNAME || user.id === session.userId) {
        sendJson(res, 400, { error: "Цього учасника не можна видалити." });
        return;
      }

      users = users.filter((item) => item.id !== user.id);
      const market = readMarket();
      const deletedLandIds = [];
      Object.entries(market.land || {}).forEach(([id, owner]) => {
        if (owner.ownerId !== user.id) return;
        delete market.land[id];
        deletedLandIds.push(id);
      });
      writeUsers(users);
      writeMarket(market, { deleteIds: deletedLandIds });
      sendJson(res, 200, { ok: true, ...adminPayload(users, readMarket()) });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/admin/player")) {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const user = users.find((item) => item.id === url.searchParams.get("id"));
      if (!user) {
        sendJson(res, 404, { error: "Учасника не знайдено." });
        return;
      }
      const farm = sanitizeFarmState(user.farm);
      sendJson(res, 200, {
        user: publicUserRow(user),
        farm,
        land: Object.values(farm.land || {}),
        events: farm.events,
        ledger: farm.ledger
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/user") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      const body = await readBody(req);
      const user = users.find((item) => item.id === body.id);
      if (!user) {
        sendJson(res, 404, { error: "Учасника не знайдено." });
        return;
      }

      const farm = sanitizeFarmState(user.farm);
      if (typeof body.username === "string") {
        const nextUsername = normalizeUsername(body.username).slice(0, 24);
        const reservedAdmin = user.username === ADMIN_USERNAME;
        const duplicate = users.some((item) => item.id !== user.id && item.username.toLowerCase() === nextUsername.toLowerCase());
        if (!reservedAdmin && nextUsername.length >= 3 && !duplicate) user.username = nextUsername;
      }
      if (typeof body.companyName === "string") farm.companyName = body.companyName.slice(0, 40);
      if (Number.isFinite(body.coins)) farm.coins = Math.max(0, Math.floor(body.coins));
      if (Number.isFinite(body.currentDay)) farm.currentDay = Math.max(1, Math.floor(body.currentDay));
      if (/^#[0-9a-f]{6}$/i.test(body.color || "")) farm.color = body.color;
      if (body.inventory && typeof body.inventory === "object") {
        farm.inventory = {
          machinery: sanitizeInventoryMap(body.inventory.machinery),
          elevators: {}
        };
        farm.stats.machinery = Object.values(farm.inventory.machinery).reduce((sum, qty) => sum + qty, 0);
        farm.stats.buildings = Object.values(farm.land || {}).filter((cell) => cell.building).length;
      }
      if (body.resetLand) {
        const resetAt = new Date().toISOString();
        farm.land = {};
        farm.lastAdminResetAt = resetAt;
        farm.stats.purchased = 0;
        farm.stats.upgraded = 0;
        farm.stats.buildings = 0;
        farm.stats.machinery = 0;
        farm.events = [{ text: "Адміністратор обнулив землі учасника.", at: resetAt }, ...farm.events].slice(0, 30);
        farm.ledger = [{
          type: "admin",
          text: "Адміністратор обнулив землі учасника.",
          amount: 0,
          balance: farm.coins,
          landDelta: -Object.keys(sanitizeFarmState(user.farm).land || {}).length,
          at: resetAt
        }, ...farm.ledger].slice(0, 1000);
      }
      user.farm = farm;
      user.isAdmin = user.username === ADMIN_USERNAME || Boolean(body.isAdmin);
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      const market = readMarket();
      const removedLandIds = [];
      Object.entries(market.land || {}).forEach(([id, owner]) => {
        if (owner.ownerId !== user.id) return;
        delete market.land[id];
        removedLandIds.push(id);
      });
      writeMarket(market, { deleteIds: removedLandIds });
      mergeFarmIntoMarket(farm, user.id, userCompanyName(user, farm));
      sendJson(res, 200, {
        ok: true,
        ...adminPayload(users, readMarket()),
        farm: user.id === session.userId ? sanitizeFarmState(user.farm) : null
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/register") {
      const body = await readBody(req);
      const username = normalizeUsername(body.username);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      if (username.length < 3 || username.length > 24) {
        sendJson(res, 400, { error: "Ім'я має містити від 3 до 24 символів." });
        return;
      }

      if (!isValidEmail(email)) {
        sendJson(res, 400, { error: "Вкажіть коректну електронну пошту." });
        return;
      }

      if (password.length < 6) {
        sendJson(res, 400, { error: "Пароль має містити щонайменше 6 символів." });
        return;
      }

      const users = readUsers();
      const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        sendJson(res, 409, { error: "Такий гравець уже зареєстрований." });
        return;
      }
      if (users.some((user) => normalizeEmail(user.email) === email)) {
        sendJson(res, 409, { error: "Цей email уже використовується." });
        return;
      }

      const user = {
        id: crypto.randomUUID(),
        username,
        email,
        passwordHash: hashPassword(password),
        farm: defaultFarmState(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(user);
      writeUsers(users);

      const token = createSession(user.id);
      sendJson(res, 201, {
        player: playerSessionPayload(user),
        farm: user.farm
      }, { "set-cookie": sessionCookie(token, 86400) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/login") {
      const body = await readBody(req);
      const username = normalizeUsername(body.username);
      const login = normalizeEmail(body.username);
      const password = String(body.password || "");
      const users = readUsers();
      const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase() || normalizeEmail(item.email) === login);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        sendJson(res, 401, { error: "Неправильне ім'я гравця або пароль." });
        return;
      }

      const token = createSession(user.id);
      sendJson(res, 200, {
        player: playerSessionPayload(user),
        farm: sanitizeFarmState(user.farm)
      }, { "set-cookie": sessionCookie(token, 86400) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/password-reset/request") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const users = readUsers();
      const user = users.find((item) => normalizeEmail(item.email) === email);
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const resetUrl = `${PUBLIC_BASE_URL.replace(/\/$/, "")}/?reset=${token}`;
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
        const resets = readPasswordResets().filter((row) => row.userId !== user.id && new Date(row.expiresAt || 0).getTime() > Date.now());
        resets.push({ token, userId: user.id, expiresAt, createdAt: new Date().toISOString() });
        writePasswordResets(resets);
        await sendPasswordResetEmail(email, resetUrl);
      }
      sendJson(res, 200, { ok: true, message: "Якщо email існує, інструкція для відновлення буде надіслана." });
      return;
    }

    if (req.method === "POST" && req.url === "/api/password-reset/confirm") {
      const body = await readBody(req);
      const token = String(body.token || "");
      const password = String(body.password || "");
      if (password.length < 6) {
        sendJson(res, 400, { error: "Пароль має містити щонайменше 6 символів." });
        return;
      }
      const resets = readPasswordResets();
      const row = resets.find((item) => item.token === token && new Date(item.expiresAt || 0).getTime() > Date.now());
      if (!row) {
        sendJson(res, 400, { error: "Посилання відновлення недійсне або прострочене." });
        return;
      }
      const users = readUsers();
      const user = users.find((item) => item.id === row.userId);
      if (!user) {
        sendJson(res, 404, { error: "Користувача не знайдено." });
        return;
      }
      user.passwordHash = hashPassword(password);
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      writePasswordResets(resets.filter((item) => item.token !== token && item.userId !== user.id));
      sendJson(res, 200, { ok: true, message: "Пароль змінено. Увійдіть з новим паролем." });
      return;
    }

    if (req.method === "GET" && req.url === "/api/me") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "Немає активного входу." });
        return;
      }

      if (session.isGuest) {
        sendJson(res, 200, {
          player: { id: session.userId, username: "Гість", isGuest: true },
          farm: null
        });
        return;
      }

      const user = readUsers().find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }

      sendJson(res, 200, {
        player: playerSessionPayload(user),
        farm: sanitizeFarmState(user.farm)
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/save-meta") {
      const session = getSession(req);
      if (!session || session.isGuest) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }
      const farm = user.farm && typeof user.farm === "object" ? user.farm : defaultFarmState();
      const patch = sanitizeFarmMetaPatch(body.farm || body, farm);
      // Coins, timer and inventory are server-authoritative. Compact saves are only for
      // non-economic UI/history metadata.
      const { coins, currentDay, inventory, lastIncomeAt, stats, ...safePatch } = patch;
      user.farm = { ...farm, ...safePatch };
      user.updatedAt = new Date().toISOString();
      // Persistence is deferred until after the compact response is written. This keeps the
      // income button and logout responsive even when the user owns tens of thousands of cells.
      writeUsers(users, { deferPersistence: true });
      sendJson(res, 200, { ok: true, coins: user.farm.coins, currentDay: user.farm.currentDay });
      return;
    }

    if (req.method === "POST" && req.url === "/api/save") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      let farm = sanitizeFarmState(body.farm);
      const marketSnapshot = readMarket();
      if (marketSnapshot.resetAt && farm.lastAdminResetAt !== marketSnapshot.resetAt) {
        farm = { ...farm, land: {}, lastAdminResetAt: marketSnapshot.resetAt };
      }

      if (session.isGuest) {
        mergeFarmIntoMarket(farm, session.userId, farm.companyName || "Гостьова розвідка");
        sendJson(res, 200, { ok: true, coins: farm.coins, currentDay: farm.currentDay });
        return;
      }

      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }

      let authoritativeFarm = sanitizeFarmState(user.farm);
      if (marketSnapshot.resetAt && authoritativeFarm.lastAdminResetAt !== marketSnapshot.resetAt) {
        authoritativeFarm = { ...authoritativeFarm, land: {}, lastAdminResetAt: marketSnapshot.resetAt };
      }
      const safeLand = Object.fromEntries(Object.entries(authoritativeFarm.land || {}).map(([id, cell]) => [id, {
        ...cell,
        nickname: typeof farm.land?.[id]?.nickname === "string" ? farm.land[id].nickname.slice(0, 36) : cell.nickname
      }]));
      farm = {
        ...farm,
        coins: authoritativeFarm.coins,
        currentDay: authoritativeFarm.currentDay,
        inventory: authoritativeFarm.inventory,
        stats: authoritativeFarm.stats,
        lastIncomeAt: authoritativeFarm.lastIncomeAt,
        lastAdminResetAt: authoritativeFarm.lastAdminResetAt,
        land: safeLand
      };
      user.farm = sanitizeFarmState(farm);
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      const mapVersionBeforeSave = marketVersion;
      mergeFarmIntoMarket(user.farm, user.id, userCompanyName(user, user.farm));
      if (marketVersion === mapVersionBeforeSave) touchMapPresentationVersion();
      sendJson(res, 200, { ok: true, coins: user.farm.coins, currentDay: user.farm.currentDay });
      return;
    }

    sendJson(res, 404, { error: "Маршрут не знайдено." });
  } catch (error) {
    const status = Number.isFinite(error?.statusCode) ? Math.max(400, Math.min(599, error.statusCode)) : 500;
    sendJson(res, status, { error: error.message || "Помилка сервера." });
  }
}

async function startServer() {
  assertProductionSecurity();
  ensureDataFiles();
  await initStorage();
  applyRuntimeMapSettings(readSettings());
  ensureAdminUser();

  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
      handleApi(req, res);
      return;
    }

    serveStatic(req, res);
  });
  server.listen(PORT, HOST, () => {
    console.log(`Землевласник працює за адресою http://localhost:${PORT}`);
    console.log(`Доступ з локальної мережі увімкнено на порту ${PORT}.`);
    console.log(DATABASE_URL ? "Сховище гри: PostgreSQL." : "Сховище гри: локальні файли data.");
    console.log("Карта: математична прямокутна canvas-сітка.");
  });

  // Income is automatic: every completed 24-hour period is credited by the server.
  // Run the first global sweep after the server starts accepting requests, otherwise a farm
  // with many cells can keep browsers on the boot overlay while Node calculates income.
  const runIncomeSweep = () => {
    try {
      settleAllDailyIncome();
    } catch (error) {
      console.error("Daily income sweep failed:", error.message);
    }
  };
  const initialIncomeTimer = setTimeout(runIncomeSweep, 15000);
  const dailyIncomeTimer = setInterval(runIncomeSweep, 60 * 1000);
  if (typeof initialIncomeTimer.unref === "function") initialIncomeTimer.unref();
  if (typeof dailyIncomeTimer.unref === "function") dailyIncomeTimer.unref();
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Не вдалося запустити сервер:", error);
    process.exit(1);
  });
}

module.exports = {
  areCellIdsConnected,
  sessionCookie,
  activeMachineryMap,
  settleDailyIncomeForFarm
};
