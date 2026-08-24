function isPlayableLandId(id) {
  return /^cell--?\d+--?\d+$/.test(String(id || ""));
}

function parseCellId(id) {
  const match = String(id || "").match(/^cell-(-?\d+)-(-?\d+)$/);
  return match ? { q: Number(match[1]), r: Number(match[2]) } : null;
}

function areCellIdsConnected(cellIds) {
  const ids = [...new Set((Array.isArray(cellIds) ? cellIds : []).filter(isPlayableLandId))];
  if (ids.length < 2) return ids.length === 1;

  const remaining = new Set(ids);
  const queue = [remaining.values().next().value];
  remaining.delete(queue[0]);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const { q, r } = parseCellId(queue[cursor]);
    for (let dq = -1; dq <= 1; dq += 1) {
      for (let dr = -1; dr <= 1; dr += 1) {
        if (!dq && !dr) continue;
        const neighborId = `cell-${q + dq}-${r + dr}`;
        if (remaining.delete(neighborId)) queue.push(neighborId);
      }
    }
  }
  return remaining.size === 0;
}

module.exports = { isPlayableLandId, parseCellId, areCellIdsConnected };
