const axios = require("axios");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept-Encoding": "gzip, deflate, br",
};

function firstPathSegment(href) {
  if (!href || typeof href !== "string") return null;
  return href.split("?")[0].split("/").filter(Boolean).pop() || null;
}

function afterPath(href, marker) {
  if (!href || typeof href !== "string" || !href.includes(marker)) return null;
  return href.split(marker)[1]?.split("?")[0] || null;
}

function numberFrom(value) {
  return value?.match(/\d+/)?.[0] || null;
}

function readSyncData($, key) {
  try {
    const raw = $("#syncData").text();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.[key] ?? null;
  } catch {
    return null;
  }
}

async function getHtml(url) {
  const response = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: 15000,
  });
  return response.data;
}

function sendRouteError(res, error, message = "Unable to fetch data") {
  console.error(message, error?.message || error);
  if (!res.headersSent) {
    res.status(502).json({ error: message });
  }
}

module.exports = {
  DEFAULT_HEADERS,
  USER_AGENT,
  afterPath,
  firstPathSegment,
  getHtml,
  numberFrom,
  readSyncData,
  sendRouteError,
};
