importScripts("/h3-js.umd.js");

const PLAY_H3_RESOLUTION = 8;
const UKRAINE_AREA_KM2 = 603700;
const fallbackUkrainePolygon = [[[
  [22.1, 48.1], [23.2, 51.5], [27.8, 51.9], [31.8, 52.3], [35.1, 50.5], [40.2, 49.1],
  [39.7, 47.2], [37.6, 45.4], [33.6, 44.4], [31.1, 45.4], [29.2, 45.2], [28.2, 46.4],
  [24.9, 47.7], [22.1, 48.1]
]]];

let ukrainePolygons = fallbackUkrainePolygon;
let readyPromise = loadUkraineBoundary();

self.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type !== "cells") return;

  try {
    await readyPromise;
    const payload = cellsForBounds(message.bounds, message.resolution || PLAY_H3_RESOLUTION, message.limit || 2000);
    self.postMessage({ requestId: message.requestId, ...payload });
  } catch (error) {
    self.postMessage({ requestId: message.requestId, ids: [], error: error.message || "Worker error" });
  }
};

async function loadUkraineBoundary() {
  try {
    const response = await fetch("/ukraine-boundary.geojson");
    if (!response.ok) throw new Error("Boundary unavailable");
    ukrainePolygons = extractPolygonsFromGeoJson(await response.json());
  } catch {
    ukrainePolygons = fallbackUkrainePolygon;
  }
}

function cellsForBounds(bounds, resolution, limit) {
  const safeLimit = Math.max(200, Math.min(9000, Number(limit) || 2000));
  if (estimatedViewportCells(bounds, resolution) > safeLimit * 2.2) {
    return { ids: [], tooDense: true };
  }

  const viewportPolygon = [[
    [bounds.south, bounds.west],
    [bounds.south, bounds.east],
    [bounds.north, bounds.east],
    [bounds.north, bounds.west],
    [bounds.south, bounds.west]
  ]];

  const ids = h3.polygonToCells(viewportPolygon, resolution, false)
    .filter((id) => {
      const [cellLat, cellLng] = h3.cellToLatLng(id);
      return cellLat >= bounds.south
        && cellLat <= bounds.north
        && cellLng >= bounds.west
        && cellLng <= bounds.east
        && pointInUkraine([cellLng, cellLat]);
    });

  if (ids.length > safeLimit) return { ids: [], tooDense: true };
  return { ids, tooDense: false };
}

function estimatedViewportCells(bounds, resolution) {
  const latKm = Math.max(0, bounds.north - bounds.south) * 111.32;
  const meanLat = ((bounds.north + bounds.south) / 2) * Math.PI / 180;
  const lngKm = Math.max(0, bounds.east - bounds.west) * 111.32 * Math.cos(meanLat);
  const area = Math.min(UKRAINE_AREA_KM2, Math.max(0, latKm * lngKm));
  const avgCellArea = h3.getHexagonAreaAvg(resolution, "km2") || 0.737327598;
  return area / avgCellArea;
}

function extractPolygonsFromGeoJson(geojson) {
  const features = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const polygons = [];

  features.forEach((feature) => {
    const geometry = feature.type === "Feature" ? feature.geometry : feature;
    if (!geometry) return;
    if (geometry.type === "Polygon") polygons.push(...normalizePolygon(geometry.coordinates));
    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => polygons.push(...normalizePolygon(polygon)));
    }
  });

  return polygons.length ? polygons : fallbackUkrainePolygon;
}

function normalizePolygon(coordinates) {
  if (!Array.isArray(coordinates) || !coordinates.length) return [];
  return [coordinates.map((ring) => simplifyRing(ring))];
}

function simplifyRing(ring) {
  const clean = ring.filter((point) => Array.isArray(point) && point.length >= 2);
  const step = Math.max(1, Math.ceil(clean.length / 520));
  const simplified = clean.filter((_, index) => index % step === 0);
  if (simplified.length && simplified[0] !== simplified[simplified.length - 1]) {
    simplified.push(simplified[0]);
  }
  return simplified.length >= 4 ? simplified : clean;
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
