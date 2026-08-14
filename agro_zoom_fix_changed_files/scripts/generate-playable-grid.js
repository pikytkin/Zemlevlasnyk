const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = JSON.parse(fs.readFileSync(path.join(root, "public", "ukraine-boundary.geojson"), "utf8"));
const settings = JSON.parse(fs.readFileSync(path.join(root, "data", "settings.json"), "utf8"));
const bounds = { south: 43.2, west: 21.0, north: 53.0, east: 41.2 };
const cellWidth = Number(settings?.map?.cellWidthDegrees) || 0.018;
const cellHeight = Number(settings?.map?.cellHeightDegrees) || 0.012;

function geometryPolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

const polygons = (source.features || []).flatMap((feature) => geometryPolygons(feature.geometry));

function scanlineRanges(ring, lat) {
  const intersections = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) === (yj > lat)) continue;
    intersections.push(xi + ((lat - yi) * (xj - xi)) / (yj - yi));
  }
  intersections.sort((a, b) => a - b);
  const ranges = [];
  for (let index = 0; index + 1 < intersections.length; index += 2) ranges.push([intersections[index], intersections[index + 1]]);
  return ranges;
}

const maxQ = Math.ceil((bounds.east - bounds.west) / cellWidth);
const maxR = Math.ceil((bounds.north - bounds.south) / cellHeight);
const rows = {};
let count = 0;

for (let r = 0; r < maxR; r += 1) {
  const lat = bounds.north - (r + 0.5) * cellHeight;
  const ranges = polygons.flatMap((polygon) => scanlineRanges(polygon[0], lat).map(([west, east]) => {
    const start = Math.max(0, Math.ceil((west - bounds.west) / cellWidth - 0.5));
    const end = Math.min(maxQ - 1, Math.floor((east - bounds.west) / cellWidth - 0.5));
    return [start, end];
  })).filter(([start, end]) => end >= start).sort((a, b) => a[0] - b[0]);
  count += ranges.reduce((sum, [start, end]) => sum + end - start + 1, 0);
  if (ranges.length) rows[r] = ranges;
}

const payload = { version: 2, count, cellWidthDegrees: cellWidth, cellHeightDegrees: cellHeight, rows };
fs.writeFileSync(path.join(root, "public", "playable-grid.json"), JSON.stringify(payload));
console.log(`Generated ${count} playable cells in ${Object.keys(rows).length} rows at ${cellWidth}° × ${cellHeight}°.`);
