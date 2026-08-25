const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const port = 42000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "agro-game-test-"));
let server;

async function request(method, pathname, body, cookie = "") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload, cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/settings`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Test server did not start");
}

test.before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: String(port), AGRO_DATA_DIR: dataDir, NODE_ENV: "test" },
    stdio: "ignore"
  });
  await waitForServer();
});

test.after(() => {
  server?.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

async function register(username) {
  const result = await request("POST", "/api/register", { username, email: `${username}@example.test`, password: "test-password" });
  assert.equal(result.response.status, 201, result.payload.error);
  return result.cookie;
}

async function configureTestEconomy() {
  const admin = await request("POST", "/api/login", { username: "Admin", password: "Admin" });
  assert.equal(admin.response.status, 200, admin.payload.error);
  const current = await request("GET", "/api/settings");
  current.payload.economy.startingCoins = 50000;
  current.payload.assets.elevatorItems[0].cost = 100;
  current.payload.assets.elevatorItems[0].maxOwnerLandPercent = 100;
  current.payload.assets.machineryItems[0].cost = 100;
  current.payload.assets.machineryItems[0].durationDays = 1;
  const saved = await request("POST", "/api/admin/settings", { settings: current.payload }, admin.cookie);
  assert.equal(saved.response.status, 200, saved.payload.error);
  return admin.cookie;
}

test("only one concurrent buyer can claim the same land cell", async () => {
  const first = await register("buyer-one");
  const second = await register("buyer-two");
  const cell = { id: "cell-676-52", region: "Тест" };
  const [a, b] = await Promise.all([
    request("POST", "/api/claim", { cells: [cell] }, first),
    request("POST", "/api/claim", { cells: [cell] }, second)
  ]);
  assert.equal(a.payload.claimed.length + b.payload.claimed.length, 1);
  assert.equal(a.payload.coins + b.payload.coins, 11700 * 2 - 1800);
});

test("a land sale is idempotent and preserves a non-negative balance", async () => {
  const cookie = await register("seller");
  const cell = { id: "cell-677-52", region: "Тест" };
  const bought = await request("POST", "/api/claim", { cells: [cell] }, cookie);
  assert.equal(bought.payload.claimed.length, 1);
  const [firstSale, secondSale] = await Promise.all([
    request("POST", "/api/sell", { cells: [cell.id] }, cookie),
    request("POST", "/api/sell", { cells: [cell.id] }, cookie)
  ]);
  assert.equal(firstSale.payload.sold + secondSale.payload.sold, 1);
  const current = await request("GET", "/api/me", undefined, cookie);
  assert.ok(current.payload.farm.coins >= 0);
});

test("building and demolishing update only the selected connected building group", async () => {
  await configureTestEconomy();
  const cookie = await register("builder");
  const cells = ["cell-680-53", "cell-681-53", "cell-682-53"];
  const bought = await request("POST", "/api/claim", { cells: cells.map((id) => ({ id, region: "Тест" })) }, cookie);
  assert.equal(bought.payload.claimed.length, 3);
  const built = await request("POST", "/api/purchase-asset", { kind: "building", itemId: "elevator-basic", cellIds: cells }, cookie);
  assert.equal(built.response.status, 200, built.payload.error);
  const demolished = await request("POST", "/api/purchase-asset", { kind: "demolish", cellIds: [cells[0]] }, cookie);
  assert.equal(demolished.response.status, 200, demolished.payload.error);
  const current = await request("GET", "/api/me", undefined, cookie);
  assert.equal(Object.values(current.payload.farm.land).filter((cell) => cell.building || cell.buildingId).length, 0);
});

test("admin reset clears land and restores the configured starting balance", async () => {
  const adminCookie = await configureTestEconomy();
  const cookie = await register("reset-target");
  const claimed = await request("POST", "/api/claim", { cells: [{ id: "cell-676-53", region: "Тест" }] }, cookie);
  assert.equal(claimed.payload.claimed.length, 1);
  const resetLand = await request("POST", "/api/admin/reset-land", {}, adminCookie);
  assert.equal(resetLand.response.status, 200, resetLand.payload.error);
  const resetMoney = await request("POST", "/api/admin/reset-money", {}, adminCookie);
  assert.equal(resetMoney.response.status, 200, resetMoney.payload.error);
  const current = await request("GET", "/api/me", undefined, cookie);
  assert.equal(Object.keys(current.payload.farm.land).length, 0);
  assert.equal(current.payload.farm.coins, 50000);
});

async function configureLandValueScenario() {
  const admin = await request("POST", "/api/login", { username: "Admin", password: "Admin" });
  assert.equal(admin.response.status, 200, admin.payload.error);
  const current = await request("GET", "/api/settings");
  current.payload.economy.startingCoins = 50000;
  current.payload.economy.baseLandPriceMin = 100;
  current.payload.economy.baseLandPriceSpread = 0;
  current.payload.economy.nearbyPriceGrowthPercent = 100;
  current.payload.economy.nearbyPriceRadius = 1;
  current.payload.economy.sellRefundPercent = 50;
  current.payload.stages = current.payload.stages.map((stage) => ({ ...stage, landPriceMultiplier: 1 }));
  const saved = await request("POST", "/api/admin/settings", { settings: current.payload }, admin.cookie);
  assert.equal(saved.response.status, 200, saved.payload.error);
}

test("a compact purchase package does not make its own cells more expensive", async () => {
  await configureLandValueScenario();
  const cookie = await register("package-buyer");
  const cells = ["cell-700-80", "cell-701-80"];
  const bought = await request("POST", "/api/claim", { cells: cells.map((id) => ({ id, region: "Тест" })) }, cookie);
  assert.equal(bought.response.status, 200, bought.payload.error);
  assert.equal(bought.payload.claimed.length, 2);
  assert.equal(bought.payload.charged, 200);
});

test("land sale uses the current neighbourhood value instead of historical purchase price", async () => {
  await configureLandValueScenario();
  const seller = await register("market-seller");
  const neighbour = await register("market-neighbour");
  const cell = "cell-710-80";
  const adjacentCell = "cell-711-80";
  await request("POST", "/api/claim", { cells: [{ id: cell, region: "Тест" }] }, seller);
  await request("POST", "/api/claim", { cells: [{ id: adjacentCell, region: "Тест" }] }, neighbour);
  const sale = await request("POST", "/api/sell", { cells: [cell] }, seller);
  assert.equal(sale.response.status, 200, sale.payload.error);
  assert.equal(sale.payload.refund, 100);
});

test("bulk land sale values every parcel from one market snapshot", async () => {
  await configureLandValueScenario();
  const cookie = await register("snapshot-seller");
  const cells = ["cell-680-54", "cell-681-54"];
  const bought = await request("POST", "/api/claim", { cells: cells.map((id) => ({ id, region: "Тест" })) }, cookie);
  assert.equal(bought.payload.claimed.length, 2, bought.payload.error);
  const sale = await request("POST", "/api/sell", { cells }, cookie);
  assert.equal(sale.response.status, 200, sale.payload.error);
  assert.equal(sale.payload.refund, 200);
});

test("same machinery can be bought repeatedly to expand its land coverage", async () => {
  await configureLandValueScenario();
  const admin = await request("POST", "/api/login", { username: "Admin", password: "Admin" });
  const current = await request("GET", "/api/settings");
  current.payload.assets.machineryItems[0].cost = 100;
  current.payload.assets.machineryItems[0].minCells = 1;
  const saved = await request("POST", "/api/admin/settings", { settings: current.payload }, admin.cookie);
  assert.equal(saved.response.status, 200, saved.payload.error);

  const cookie = await register("machine-limit");
  await request("POST", "/api/claim", { cells: [{ id: "cell-720-80", region: "Тест" }] }, cookie);
  const itemId = current.payload.assets.machineryItems[0].id;
  const first = await request("POST", "/api/purchase-asset", { kind: "machinery", itemId }, cookie);
  const second = await request("POST", "/api/purchase-asset", { kind: "machinery", itemId }, cookie);
  const third = await request("POST", "/api/purchase-asset", { kind: "machinery", itemId }, cookie);
  assert.equal(first.response.status, 200, first.payload.error);
  assert.equal(second.response.status, 200, second.payload.error);
  assert.equal(third.response.status, 200, third.payload.error);
  const currentFarm = await request("GET", "/api/me", undefined, cookie);
  assert.equal(currentFarm.payload.farm.inventory.machinery[itemId], 3);
});
