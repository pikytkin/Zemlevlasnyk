(function initGameRules(root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  root.GameRules = rules;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function hashString(value) {
    let hash = 0;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    return hash;
  }

  function incomeForLandId(id, economy = {}) {
    const base = Number.isFinite(economy.baseIncomeMin) ? economy.baseIncomeMin : 180;
    const spread = Number.isFinite(economy.baseIncomeSpread) ? Math.max(0, Math.floor(economy.baseIncomeSpread)) : 0;
    const seed = Math.abs(hashString(id)) || 1;
    return Math.round(base + (spread ? seed % spread : 0));
  }

  function fertilizerMultiplier(level, landLevels = []) {
    const rule = [...landLevels].reverse().find((item) => (level || 1) >= item.level) || landLevels[0];
    return 1 + ((Number(rule?.incomeBonusPercent) || 0) / 100);
  }

  function improvementCostForLevel(level, landLevels = []) {
    return landLevels
      .filter((item) => item.level <= Math.max(1, level || 1))
      .reduce((sum, item) => sum + (item.level > 1 ? Number(item.cost) || 0 : 0), 0);
  }

  function fertilizerUpgradeCost(currentLevel, targetLevel, landLevels = []) {
    return landLevels
      .filter((item) => item.level > Math.max(1, currentLevel || 1) && item.level <= targetLevel)
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }

  function ownershipPriceMultiplier(ownedCount, rules = []) {
    return rules
      .filter((rule) => Math.max(0, ownedCount || 0) >= (rule.minOwned || 0))
      .reduce((value, rule) => Math.max(value, Number(rule.multiplier) || 1), 1);
  }

  function stagePriceMultiplier(ownedCount, stages = []) {
    return stages
      .filter((stage) => Math.max(0, ownedCount || 0) >= (Number(stage.min) || 0))
      .reduce((value, stage) => Math.max(value, Number(stage.landPriceMultiplier) || 1), 1);
  }

  function landPrice(basePrice, pressure = 0, nearbyGrowthPercent = 0, ownershipMultiplier = 1) {
    const base = Math.max(1, Number(basePrice) || 1);
    const growth = Number(nearbyGrowthPercent) || 0;
    const nearbyFactor = Math.max(0.05, 1 + Math.max(0, Number(pressure) || 0) * growth / 100);
    return Math.max(1, Math.round(base * nearbyFactor * Math.max(0.1, Number(ownershipMultiplier) || 1)));
  }

  return { hashString, incomeForLandId, fertilizerMultiplier, improvementCostForLevel, fertilizerUpgradeCost, ownershipPriceMultiplier, stagePriceMultiplier, landPrice };
}));
