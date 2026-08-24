const assert = require("node:assert/strict");
const test = require("node:test");
const { areCellIdsConnected, sessionCookie, activeMachineryMap, settleDailyIncomeForFarm } = require("../server");
const GameRules = require("../public/game-rules");

test("building cells must form one connected rectangle-grid component", () => {
  assert.equal(areCellIdsConnected(["cell-100-200", "cell-101-200", "cell-101-201"]), true);
  assert.equal(areCellIdsConnected(["cell-100-200", "cell-102-200", "cell-102-201"]), false);
  assert.equal(areCellIdsConnected(["cell--1--1", "cell-0-0"]), true);
});

test("session cookie has the required browser protections", () => {
  const cookie = sessionCookie("test-token", 86400);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /Max-Age=86400/);
});

test("shared economy rules produce deterministic prices and upgrade costs", () => {
  const economy = { baseIncomeMin: 180, baseIncomeSpread: 0 };
  const levels = [
    { level: 1, cost: 0, incomeBonusPercent: 0 },
    { level: 2, cost: 900, incomeBonusPercent: 25 },
    { level: 3, cost: 1500, incomeBonusPercent: 60 }
  ];
  const pricing = [{ minOwned: 0, multiplier: 1 }, { minOwned: 6, multiplier: 1.1 }];

  assert.equal(GameRules.incomeForLandId("cell-10-20", economy), 180);
  assert.equal(GameRules.fertilizerMultiplier(3, levels), 1.6);
  assert.equal(GameRules.improvementCostForLevel(3, levels), 2400);
  assert.equal(GameRules.fertilizerUpgradeCost(1, 3, levels), 2400);
  assert.equal(GameRules.ownershipPriceMultiplier(6, pricing), 1.1);
});

test("expired machinery has no income effect after its final active day", () => {
  const inventory = { machineryBatches: [{ id: "tractor", qty: 1, purchasedDay: 1, expiresDay: 3 }] };
  assert.deepEqual(activeMachineryMap(inventory, 3), { tractor: 1 });
  assert.deepEqual(activeMachineryMap(inventory, 4), {});
});

test("offline income is capped and never makes a balance negative", () => {
  const now = Date.UTC(2026, 0, 10);
  const settings = {
    economy: { baseIncomeMin: 180, baseIncomeSpread: 0, incomeCycleMinutes: 1440, offlineIncomeCapHours: 48 },
    upgrades: { landLevels: [{ level: 1, cost: 0, incomeBonusPercent: 0 }] },
    assets: { machineryItems: [], elevatorItems: [] },
    clusters: []
  };
  const farm = {
    coins: 0,
    currentDay: 1,
    lastIncomeAt: new Date(now - 96 * 60 * 60 * 1000).toISOString(),
    land: { "cell-676-52": { id: "cell-676-52", level: 1 } },
    inventory: { machinery: {}, machineryBatches: [] },
    stats: { earned: 0 }
  };
  const settled = settleDailyIncomeForFarm(farm, settings, now);
  assert.equal(settled.days, 2);
  assert.equal(settled.income, 360);
  assert.equal(farm.coins, 360);
});
