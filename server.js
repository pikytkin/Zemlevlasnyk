const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

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
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.txt");
const MARKET_FILE = path.join(DATA_DIR, "market.txt");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const NEWS_FILE = path.join(DATA_DIR, "news.txt");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";
const DATABASE_URL = process.env.DATABASE_URL || "";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://zemlevlasnyk.com";
const BASE_RIVALS = [];

const DEFAULT_SETTINGS = {
  economy: {
    startingCoins: 500,
    baseLandPriceMin: 70,
    baseLandPriceSpread: 0,
    baseIncomeMin: 8,
    baseIncomeSpread: 0,
    nearbyPriceGrowthPercent: 8,
    nearbyPriceRadius: 2,
    sellRefundPercent: 62,
    maxVisibleCells: 5000,
    detailZoomMin: 13,
    claimBatchSize: 1000,
    drawGrid: true
  },
  upgrades: {
    landMaxLevel: 5,
    landLevels: [
      { level: 1, name: "Без добрив", cost: 0, incomeBonusPercent: 0 },
      { level: 2, name: "Базові добрива", cost: 165, incomeBonusPercent: 18 },
      { level: 3, name: "Посилені добрива", cost: 260, incomeBonusPercent: 42 },
      { level: 4, name: "Преміум добрива", cost: 380, incomeBonusPercent: 72 },
      { level: 5, name: "Агрохімія повного циклу", cost: 540, incomeBonusPercent: 108 }
    ],
    elevatorMinSelectedCells: 3,
  },
  assets: {
    machineryItems: [
      { id: "tractor-basic", icon: "🚜", name: "Трактор базовий", cost: 480, incomeBonusPercent: 1, durationDays: 100, photos: [] }
    ],
    elevatorItems: [
      { id: "elevator-basic", icon: "🏗", mapEmoji: "🏗", name: "Елеватор базовий", cost: 1200, incomePerDay: 75, minCells: 3, maxOwnerLandPercent: 25, photos: [] }
    ]
  },
  clusters: [
    { min: 11, bonusPercent: 5 },
    { min: 51, bonusPercent: 12 },
    { min: 201, bonusPercent: 25 },
    { min: 1001, bonusPercent: 50 }
  ],
  stages: [
    { title: "Початок", min: 0, text: "Купуйте перші ділянки та формуйте базу господарства." },
    { title: "Господарство", min: 5, text: "Земля поруч підвищує ціну наступної покупки, а з'єднані ділянки дають бонус до доходу." },
    { title: "Компанія", min: 12, text: "З'єднані ділянки дають відчутний бонус до доходу." },
    { title: "Агрохолдинг", min: 24, text: "Розвивайте побудови, техніку і рівні землі." },
    { title: "Національна корпорація", min: 42, text: "Гравець бореться за лідерство на карті України." }
  ],
  rivals: BASE_RIVALS
};

const sessions = new Map();
let previousNewsLeaders = { land: null, assets: null };
let storage = null;
let dbPool = null;
let marketVersion = 1;
let leaderboardVersion = 1;

const MAP_BOUNDS = { south: 43.2, west: 21.0, north: 53.0, east: 41.2 };
const RECT_CELL_WIDTH_DEGREES = 0.018;
const RECT_CELL_HEIGHT_DEGREES = 0.012;
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

  return { users, market, settings, news, messages: [], passwordResets: [] };
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
    passwordResets: Array.isArray(state.passwordResets) ? state.passwordResets : []
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

async function initStorage() {
  storage = await initDatabaseStorage();
  if (!storage) storage = readFileStorageSnapshot();
}

function numberIn(value, fallback, min = 0, max = 1_000_000_000) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function intIn(value, fallback, min = 0, max = 1_000_000_000) {
  return Math.floor(numberIn(value, fallback, min, max));
}

function isPlayableLandId(id) {
  return /^cell--?\d+--?\d+$/.test(String(id || ""));
}

function cleanMarketLand(land) {
  if (!land || typeof land !== "object" || Array.isArray(land)) return {};
  return Object.fromEntries(Object.entries(land).filter(([id]) => isPlayableLandId(id)));
}

function numberArray(value, fallback, maxLength = 12) {
  const source = Array.isArray(value) ? value : fallback;
  return source.slice(0, maxLength).map((item, index) => numberIn(Number(item), Number.isFinite(fallback[index]) ? fallback[index] : 0, 0, 100_000_000));
}

function sanitizeSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const economy = source.economy && typeof source.economy === "object" ? source.economy : {};
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
      maxVisibleCells: intIn(economy.maxVisibleCells, defaults.economy.maxVisibleCells, 1000, 120000),
      detailZoomMin: intIn(economy.detailZoomMin, defaults.economy.detailZoomMin, 7, 13),
      claimBatchSize: intIn(economy.claimBatchSize, defaults.economy.claimBatchSize, 1, 3000),
      drawGrid: typeof economy.drawGrid === "boolean" ? economy.drawGrid : defaults.economy.drawGrid
    },
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
      .map((item, index) => ({
        title: String(item?.title || defaults.stages[index]?.title || "Етап").slice(0, 40),
        min: intIn(item?.min, defaults.stages[index]?.min || 0, 0, 1000000),
        text: String(item?.text || defaults.stages[index]?.text || "").slice(0, 180)
      }))
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
    durationDays: intIn(item?.durationDays, fallback[index]?.durationDays || 100, 1, 1000000),
    incomePerDay: intIn(item?.incomePerDay, fallback[index]?.incomePerDay || 0, 0),
    minCells: intIn(item?.minCells, fallback[index]?.minCells || 1, 1, 1000000),
    maxOwnerLandPercent: numberIn(Number(item?.maxOwnerLandPercent), fallback[index]?.maxOwnerLandPercent ?? 25, 1, 100),
    serviceLifeExtensionDays: intIn(item?.serviceLifeExtensionDays, fallback[index]?.serviceLifeExtensionDays || 0, 0, 1000000),
    mapEmoji: sanitizeMapEmoji(item?.mapEmoji || fallback[index]?.mapEmoji || (String(item?.icon || "").startsWith("data:image/") ? "🏗" : item?.icon) || fallback[index]?.icon || "•"),
    photos: sanitizeAssetPhotos(item?.photos || fallback[index]?.photos || [])
  }));
}

function sanitizeAssetIcon(icon) {
  const value = String(icon || "•");
  if (/^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(value) && value.length < 180000) {
    return value;
  }
  return value.slice(0, 12);
}

function sanitizeMapEmoji(value) {
  return String(value || "•").replace(/[<>]/g, "").slice(0, 8) || "•";
}

function sanitizeAssetPhotos(photos) {
  return (Array.isArray(photos) ? photos : [])
    .filter((item) => typeof item === "string")
    .filter((item) => /^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(item) && item.length < 180000)
    .slice(0, 8);
}

function readSettings() {
  try {
    return sanitizeSettings(storage?.settings || DEFAULT_SETTINGS);
  } catch {
    return sanitizeSettings(DEFAULT_SETTINGS);
  }
}

function writeSettings(settings) {
  const clean = sanitizeSettings(settings);
  if (storage) {
    storage.settings = clean;
    persistState("settings");
  } else {
    ensureDataFiles();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(clean, null, 2), "utf8");
  }
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

function writeUsers(users) {
  if (storage) {
    storage.users = users;
    persistState("users");
  } else {
    ensureDataFiles();
    const content = users.map((user) => JSON.stringify(user)).join("\n");
    fs.writeFileSync(USERS_FILE, content ? `${content}\n` : "", "utf8");
  }
  leaderboardVersion += 1;
}

function ensureAdminUser() {
  const users = readUsers();
  let admin = users.find((user) => String(user.username || "").toLowerCase() === ADMIN_USERNAME.toLowerCase());
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
  } else {
    admin.username = ADMIN_USERNAME;
    admin.passwordHash = hashPassword(ADMIN_PASSWORD);
    admin.isAdmin = true;
    admin.farm = { ...defaultFarmState(), ...sanitizeFarmState(admin.farm) };
    admin.updatedAt = new Date().toISOString();
  }
  writeUsers(users);
}

function readMarket() {
  try {
    const market = storage?.market || { land: {} };
    return market && typeof market === "object" && market.land && typeof market.land === "object"
      ? { land: cleanMarketLand(market.land), resetAt: typeof market.resetAt === "string" ? market.resetAt : null }
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
  return 32;
}

function chunkLevelForZoom(zoom) {
  if (zoom <= 7) return 1;
  if (zoom <= 9) return 2;
  if (zoom <= 11) return 3;
  return 4;
}

function chunkCellSpanForLevel(level) {
  if (level <= 1) return 512;
  if (level === 2) return 256;
  if (level === 3) return 128;
  return 32;
}

function overviewGroupSpanForLevel(level) {
  if (level <= 1) return 24;
  if (level === 2) return 12;
  if (level === 3) return 6;
  return 4;
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
  const market = readMarket();
  const owners = {};
  const cells = [];
  const span = chunkCellSpanForLevel(4);
  const chunkRange = chunkBoundsForRange(bounds, span, 1);

  Object.entries(market.land || {}).forEach(([id, entry]) => {
    if (!isPlayableLandId(id)) return;
    const { q, r } = parseCellGridId(id);
    if (!cellInsideChunkRange(q, r, chunkRange, span)) return;
    const { lng, lat } = cellCenterFromGrid(q, r);
    if (!pointInUkraineMap(lng, lat)) return;
    const ownerId = String(entry.ownerId || "");
    if (!ownerId) return;
    if (!owners[ownerId]) {
      owners[ownerId] = {
        color: entry.ownerColor || "#ef7669",
        name: entry.ownerName || "Гравець"
      };
    }
    cells.push({
      id,
      o: ownerId,
      l: Number.isFinite(entry.level) ? entry.level : 1
    });
  });

  const truncated = cells.length > limit;
  if (truncated) cells.length = limit;
  return { version: marketVersion, zoom, level: 4, owners, cells, truncated };
}

function mapOverviewTerritories(bounds, zoom, playerId = "") {
  const market = readMarket();
  const level = Math.min(3, chunkLevelForZoom(zoom));
  const chunkSpan = chunkCellSpanForLevel(level);
  const groupSpan = overviewGroupSpanForLevel(level);
  const chunkRange = chunkBoundsForRange(bounds, chunkSpan, 1);
  const rows = new Map();

  Object.entries(market.land || {}).forEach(([id, entry]) => {
    if (!isPlayableLandId(id)) return;
    const { q, r } = parseCellGridId(id);
    if (!cellInsideChunkRange(q, r, chunkRange, chunkSpan)) return;
    const ownerId = String(entry.ownerId || "");
    if (!ownerId) return;
    const parentQ = Math.floor(q / chunkSpan) * chunkSpan;
    const parentR = Math.floor(r / chunkSpan) * chunkSpan;
    const groupQ = Math.floor(q / groupSpan) * groupSpan;
    const groupR = Math.floor(r / groupSpan) * groupSpan;
    const color = entry.ownerColor || "#ef7669";
    const key = `${ownerId}:${color}:${groupQ}:${groupR}:${r}`;
    if (!rows.has(key)) {
      rows.set(key, {
        ownerId,
        ownerKind: playerId && ownerId === playerId ? "player" : "rival",
        color,
        parentQ,
        parentR,
        groupQ,
        groupR,
        r,
        qs: []
      });
    }
    rows.get(key).qs.push(q);
  });

  const rowRuns = [];
  rows.forEach((row) => {
    const qs = [...new Set(row.qs)].sort((a, b) => a - b);
    let start = null;
    let previous = null;
    qs.forEach((q) => {
      if (start === null) {
        start = q;
        previous = q;
        return;
      }
      if (q === previous + 1) {
        previous = q;
        return;
      }
      rowRuns.push({ ...row, minQ: start, maxQ: previous, cellCount: previous - start + 1 });
      start = q;
      previous = q;
    });
    if (start !== null) {
      rowRuns.push({ ...row, minQ: start, maxQ: previous, cellCount: previous - start + 1 });
    }
  });

  const maxGroups = level === 1 ? 4800 : level === 2 ? 6400 : 7800;
  const territories = rowRuns
    .sort((a, b) => b.cellCount - a.cellCount)
    .slice(0, maxGroups)
    .map((group) => {
      const center = cellCenterFromGrid((group.minQ + group.maxQ) / 2, group.r);
      return {
        ownerId: group.ownerId,
        ownerKind: group.ownerKind,
        chunkId: `z${level}:${group.groupQ / groupSpan}:${group.groupR / groupSpan}:${group.r}:${group.minQ}:${group.maxQ}:${group.ownerId}`,
        polygon: rectBoundaryLatLngRangeServer(group.minQ, group.maxQ, group.r, group.r),
        cellCount: group.cellCount,
        occupied: 1,
        color: group.color,
        lat: center.lat,
        lng: center.lng
      };
    });

  return { version: marketVersion, zoom, level, span: groupSpan, territories };
}

function writeMarket(market) {
  const clean = { land: cleanMarketLand(market.land), resetAt: market.resetAt || null };
  const previous = storage?.market && typeof storage.market === "object" ? storage.market : { land: {} };
  const changed = marketSignature(previous) !== marketSignature(clean) || (previous.resetAt || null) !== (clean.resetAt || null);
  if (storage) {
    storage.market = clean;
    persistState("market");
  } else {
    ensureDataFiles();
    fs.writeFileSync(MARKET_FILE, JSON.stringify(clean, null, 2), "utf8");
  }
  if (changed) {
    marketVersion += 1;
  }
}

function marketSignature(market = readMarket()) {
  const ids = Object.keys(market.land || {}).sort();
  let hash = 0;
  ids.forEach((id) => {
    const owner = market.land[id] || {};
    const token = `${id}:${owner.ownerId || ""}:${owner.ownerColor || ""}:${owner.buildingId || ""}:${owner.cellEmoji || ""}`;
    for (let index = 0; index < token.length; index += 1) hash = ((hash << 5) - hash + token.charCodeAt(index)) | 0;
  });
  return `${ids.length}:${hash}`;
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

function userCompanyName(user) {
  const farm = sanitizeFarmState(user?.farm);
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
    companyName: userCompanyName(user),
    logo: farm.logo || "",
    color: farm.color || "#35c982",
    landCount: Object.keys(farm.land || {}).length,
    cash: farm.coins,
    score: farmScore(farm),
    income: Object.values(farm.land || {}).reduce((sum, cell) => {
      if (cell.building || cell.buildingId) {
        return isFirstCellInBuildingGroup(cell.id, cell, farm.land) ? sum + buildingDailyIncomeForCell(cell, settings) : sum;
      }
      const base = rangedSettingValue(settings.economy.baseIncomeMin, settings.economy.baseIncomeSpread, cell.id, 8);
      return sum + Math.round(base * fertilizerMultiplier(cell.level || 1, settings) * inventoryIncomeMultiplier(farm.inventory, settings, farm.currentDay));
    }, 0),
    machineryCount: Object.values(machineryMap || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
    buildingCount: Object.values(buildingInventory || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
    machinery: machineryMap,
    buildings: buildingInventory,
    rank
  };
}

function marketEntryForCell(farm, ownerId, ownerName, cell, settings = readSettings()) {
  const item = buildingItemById(cell?.building || cell?.buildingId, settings);
  const buildingEmoji = item ? sanitizeMapEmoji(item.mapEmoji || item.icon || "🏗") : null;
  return {
    ownerId,
    ownerName,
    ownerColor: farm.color || "#35c982",
    ownerLogo: farm.logo || "",
    price: Number.isFinite(cell.price) ? Math.max(1, Math.floor(cell.price)) : 100,
    purchasedAt: typeof cell.purchasedAt === "string" ? cell.purchasedAt : new Date().toISOString(),
    building: cell.building || cell.buildingId || null,
    buildingId: cell.buildingId || cell.building || null,
    buildingGroupId: cell.buildingGroupId || null,
    buildingBuiltAt: cell.buildingBuiltAt || null,
    buildingMapEmoji: buildingEmoji,
    buildingName: item ? item.name : "",
    cellEmoji: buildingEmoji || "🌾"
  };
}

function mergeFarmIntoMarket(farm, ownerId, ownerName) {
  const market = readMarket();
  const settings = readSettings();
  Object.entries(farm.land || {}).forEach(([id, cell]) => {
    if (!isPlayableLandId(id)) return;
    if (market.land[id] && market.land[id].ownerId !== ownerId) return;
    market.land[id] = marketEntryForCell(farm, ownerId, ownerName, cell, settings);
  });
  writeMarket(market);
  return market;
}

function refreshRegisteredMarketEntries(users = readUsers()) {
  const market = readMarket();
  const settings = readSettings();
  const registeredIds = new Set(users.map((user) => user.id));
  Object.entries(market.land || {}).forEach(([id, owner]) => {
    if (registeredIds.has(owner?.ownerId)) delete market.land[id];
  });
  users.forEach((user) => {
    const farm = sanitizeFarmState(user.farm);
    const ownerName = userCompanyName(user);
    Object.entries(farm.land || {}).forEach(([id, cell]) => {
      if (!isPlayableLandId(id)) return;
      market.land[id] = marketEntryForCell(farm, user.id, ownerName, cell, settings);
    });
  });
  writeMarket(market);
  return market;
}

function farmScore(farm) {
  const clean = sanitizeFarmState(farm);
  const settings = readSettings();
  const landValue = Object.values(clean.land || {}).reduce((sum, cell) => {
    return sum
      + cell.price
      + improvementCostForLevel(cell.level, settings)
      + (isFirstCellInBuildingGroup(cell.id, cell, clean.land) ? buildingCostForCell(cell, settings) : 0);
  }, 0);
  return clean.coins + landValue + inventoryValue(clean.inventory, settings, clean.currentDay);
}

function inventoryValue(inventory, settings = readSettings(), currentDay = 1) {
  const machineryMap = activeMachineryMap(inventory, currentDay);
  const machinery = settings.assets.machineryItems.reduce((sum, item) => sum + ((machineryMap || {})[item.id] || 0) * item.cost, 0);
  return machinery;
}

function inventoryIncomeMultiplier(inventory, settings = readSettings(), currentDay = 1) {
  const machineryMap = activeMachineryMap(inventory, currentDay);
  const machineryBonus = settings.assets.machineryItems.reduce((sum, item) => sum + ((machineryMap || {})[item.id] || 0) * item.incomeBonusPercent, 0);
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

function isFirstCellInBuildingGroup(cellId, cell, land) {
  if (!cell?.building && !cell?.buildingId) return false;
  const groupId = cell.buildingGroupId;
  if (!groupId) return true;
  const firstId = Object.keys(land || {}).find((id) => land[id]?.buildingGroupId === groupId);
  return firstId === cellId;
}

function improvementCostForLevel(level, settings = readSettings()) {
  return settings.upgrades.landLevels
    .filter((item) => item.level <= Math.max(1, level || 1))
    .reduce((sum, item) => sum + (item.level > 1 ? item.cost : 0), 0);
}

function fertilizerMultiplier(level, settings = readSettings()) {
  const rule = [...settings.upgrades.landLevels].reverse().find((item) => (level || 1) >= item.level) || settings.upgrades.landLevels[0];
  return 1 + ((rule?.incomeBonusPercent || 0) / 100);
}

function leaderboardRows() {
  return readUsers().map((user) => {
    const farm = sanitizeFarmState(user.farm);
    return {
      id: user.id,
      name: userCompanyName(user),
      landCount: Object.keys(farm.land || {}).length,
      cash: farm.coins,
      score: farmScore(farm)
    };
  })
    .map((row) => ({ landCount: 0, cash: row.score || 0, ...row }))
    .sort((a, b) => b.landCount - a.landCount || b.cash - a.cash || b.score - a.score)
    .slice(0, 12);
}

function isAdmin(session, users = readUsers()) {
  if (!session || session.isGuest) return false;
  const user = users.find((item) => item.id === session.userId);
  return Boolean(user && (user.isAdmin || user.username.toLowerCase() === "admin"));
}

function playerSessionPayload(user) {
  return {
    id: user.id,
    username: user.username,
    isGuest: false,
    isAdmin: Boolean(user.isAdmin || String(user.username || "").toLowerCase() === "admin")
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
    companyName: userCompanyName(user),
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
      const base = rangedSettingValue(settings.economy.baseIncomeMin, settings.economy.baseIncomeSpread, cell.id, 8);
      return sum + Math.round(base * fertilizerMultiplier(cell.level || 1, settings) * inventoryIncomeMultiplier(farm.inventory, settings, farm.currentDay));
    }, 0),
    score: farmScore(farm),
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
  return userCompanyName(user);
}

function formatMoney(value) {
  return `${Math.floor(value || 0).toLocaleString("uk-UA")} мон.`;
}

function newsRows() {
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
      assets: farmScore(farm)
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
        emoji: item?.mapEmoji || item?.icon || "🏗",
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
      text: `${item.company} побудувала ${item.emoji} ${item.name} в районі ${item.region}, ${item.count} ділянок.`,
      at: item.at,
      tone: "build",
      targetCellId: item.cellId
    }));

  return rows
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 24);
}

function rangedSettingValue(baseValue, spreadValue, id, fallback) {
  const base = Number.isFinite(baseValue) ? baseValue : fallback;
  const spread = Number.isFinite(spreadValue) ? Math.max(0, Math.floor(spreadValue)) : 0;
  if (!spread) return Math.round(base);
  const seed = parseInt(String(id || "").slice(-6), 16) || 1;
  return Math.round(base + (Math.abs(seed) % spread));
}

function adminPayload(users = readUsers(), market = readMarket()) {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthAgo = now - 1000 * 60 * 60 * 24 * 30;
  const onlineIds = new Set([...sessions.values()]
    .filter((session) => !session.isGuest && session.expiresAt > now && now - (session.lastSeenAt || 0) < 1000 * 60 * 5)
    .map((session) => session.userId));
  return {
    users: users.map(publicUserRow),
    summary: {
      users: users.length,
      admins: users.filter((user) => user.isAdmin).length,
      occupiedLand: Object.keys(market.land || {}).length,
      totalCash: users.reduce((sum, user) => sum + sanitizeFarmState(user.farm).coins, 0),
      onlineUsers: onlineIds.size,
      registeredToday: users.filter((user) => new Date(user.createdAt || 0).getTime() >= dayStart.getTime()).length,
      registeredLast30Days: users.filter((user) => new Date(user.createdAt || 0).getTime() >= monthAgo).length
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
  return token;
}

function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)agro_session=([^;]+)/);
  if (!match) return null;

  const token = decodeURIComponent(match[1]);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  session.lastSeenAt = Date.now();
  return session;
}

function getSessionToken(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)agro_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(payload));
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
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 25_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const session = getSession(req);
  if (url.pathname === "/admin" && session && !isAdmin(session)) {
    res.writeHead(302, { location: "/" });
    res.end();
    return;
  }
  const requestedPath = decodeURIComponent(url.pathname === "/" || url.pathname === "/admin" ? "/index.html" : url.pathname);
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
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
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
      sendJson(res, 200, mapCellsInViewport(bounds, zoom));
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
      sendJson(res, 200, mapOverviewTerritories(bounds, zoom, playerId));
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
          score: farmScore(farm)
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
      sendJson(res, 200, readSettings());
      return;
    }

    if (req.method === "POST" && req.url === "/api/logout") {
      const token = getSessionToken(req);
      if (token) sessions.delete(token);
      sendJson(res, 200, { ok: true }, { "set-cookie": "agro_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
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
      if (!session) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const requestedCells = Array.isArray(body.cells) ? body.cells.slice(0, 1000) : [];
      const market = readMarket();
      const users = session.isGuest ? [] : readUsers();
      const user = session.isGuest ? null : users.find((item) => item.id === session.userId);
      const farm = user ? sanitizeFarmState(user.farm) : defaultFarmState();
      const ownerName = session.isGuest ? "Гостьова розвідка" : (user ? user.username : "Гравець");
      const now = new Date().toISOString();
      const claimed = [];
      const rejected = [];
      const alreadyOwned = [];

      requestedCells.forEach((cell) => {
        const id = typeof cell.id === "string" ? cell.id.slice(0, 48) : "";
        const price = Number.isFinite(cell.price) ? Math.max(1, Math.floor(cell.price)) : 100;
        if (!isPlayableLandId(id)) return;
        const existing = market.land[id];
        if (existing) {
          if (existing.ownerId === session.userId) alreadyOwned.push(id);
          else rejected.push(id);
          return;
        }
        market.land[id] = {
          ownerId: session.userId,
          ownerName: session.isGuest ? "Гостьова розвідка" : (farm.companyName || ownerName),
          ownerColor: farm.color,
          ownerLogo: farm.logo,
          price,
          purchasedAt: existing?.purchasedAt || now,
          building: null,
          buildingId: null,
          buildingGroupId: null,
          buildingBuiltAt: null,
          buildingMapEmoji: null,
          buildingName: "",
          cellEmoji: "🌾"
        };
        claimed.push(id);
      });

      writeMarket(market);
      if (claimed.length) {
        const requestedById = new Map(requestedCells.map((cell) => [cell.id, cell]));
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
      sendJson(res, 200, { ok: true, claimed, rejected, alreadyOwned, ...marketVersionPayload() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/sell") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "Спочатку увійдіть у гру." });
        return;
      }

      const body = await readBody(req);
      const requestedCells = Array.isArray(body.cells) ? body.cells.slice(0, 1000) : [];
      const ids = requestedCells
        .map((cell) => typeof cell === "string" ? cell : cell?.id)
        .filter((id) => isPlayableLandId(id));
      const market = readMarket();
      let sold = 0;
      const soldIds = [];
      let sellerName = "Гравець";
      let targetCellId = null;
      const regions = [];

      ids.forEach((id) => {
        if (market.land[id]?.ownerId === session.userId) {
          sellerName = market.land[id].ownerName || sellerName;
          targetCellId = targetCellId || id;
          const requestRow = requestedCells.find((cell) => typeof cell !== "string" && cell?.id === id);
          if (requestRow?.region) regions.push(String(requestRow.region));
          delete market.land[id];
          sold += 1;
          soldIds.push(id);
        }
      });

      writeMarket(market);
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
      sendJson(res, 200, { ok: true, sold, soldIds, ...marketVersionPayload() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/profile") {
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
        sendJson(res, 200, { ok: true, farm, ...marketVersionPayload() });
        return;
      }

      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }

      user.farm = farm;
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      mergeFarmIntoMarket(farm, user.id, userCompanyName(user));
      sendJson(res, 200, { ok: true, farm, ...marketVersionPayload() });
      return;
    }

    if (req.method === "GET" && req.url === "/api/admin") {
      const session = getSession(req);
      const users = readUsers();
      if (!isAdmin(session, users)) {
        sendJson(res, 403, { error: "Потрібен адміністратор." });
        return;
      }

      sendJson(res, 200, { ...adminPayload(users, readMarket()), settings: readSettings() });
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
      sendJson(res, 200, { ok: true, settings, ...adminPayload(users, readMarket()) });
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
      Object.entries(market.land || {}).forEach(([id, owner]) => {
        if (owner.ownerId === user.id) delete market.land[id];
      });
      writeUsers(users);
      writeMarket(market);
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
      Object.entries(market.land || {}).forEach(([id, owner]) => {
        if (owner.ownerId === user.id) delete market.land[id];
      });
      writeMarket(market);
      mergeFarmIntoMarket(farm, user.id, userCompanyName(user));
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
      }, { "set-cookie": `agro_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` });
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
      }, { "set-cookie": `agro_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` });
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
        sendJson(res, 200, { ok: true, farm });
        return;
      }

      const users = readUsers();
      const user = users.find((item) => item.id === session.userId);
      if (!user) {
        sendJson(res, 401, { error: "Користувача не знайдено." });
        return;
      }

      user.farm = farm;
      user.updatedAt = new Date().toISOString();
      writeUsers(users);
      mergeFarmIntoMarket(farm, user.id, userCompanyName(user));
      sendJson(res, 200, { ok: true, farm });
      return;
    }

    sendJson(res, 404, { error: "Маршрут не знайдено." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Помилка сервера." });
  }
}

async function startServer() {
  ensureDataFiles();
  await initStorage();
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
}

startServer().catch((error) => {
  console.error("Не вдалося запустити сервер:", error);
  process.exit(1);
});


