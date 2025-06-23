const { nanoid } = require("nanoid");
const geoip = require("geoip-lite");
const { fakeUrls, fakeAnalytics } = require("./fakeData");

exports.shortenUrl = (req, res) => {
  const { originalUrl, validity, shortCode } = req.body;
  if (!originalUrl)
    return res.status(400).json({ error: "originalUrl is required" });

  const shortId = shortCode?.trim() || nanoid(6);
  if (fakeUrls[shortId])
    return res.status(409).json({ error: "Shortcode already in use" });

  const validMinutes = parseInt(validity) || 30;
  const expirationTime = new Date(Date.now() + validMinutes * 60 * 1000);

  fakeUrls[shortId] = {
    originalUrl,
    shortId,
    createdAt: new Date(),
    expiresAt: expirationTime,
  };
  fakeAnalytics[shortId] = [];

  res.status(201).json({
    message: "Short URL created",
    shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
    shortId,
    expiresAt: expirationTime.toISOString(),
  });
};

exports.redirectUrl = (req, res) => {
  const { shortId } = req.params;
  const url = fakeUrls[shortId];

  if (!url) return res.status(404).json({ error: "Short URL not found" });
  if (new Date() > url.expiresAt)
    return res.status(410).json({ error: "URL has expired" });

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const country = geoip.lookup(ip)?.country || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  const referrer = req.headers["referer"] || "Direct";

  fakeAnalytics[shortId].push({
    ip,
    country,
    userAgent,
    referrer,
    timestamp: new Date(),
  });

  res.redirect(url.originalUrl);
};

exports.getAnalytics = (req, res) => {
  const { shortId } = req.params;
  const url = fakeUrls[shortId];
  const logs = fakeAnalytics[shortId];

  if (!url) return res.status(404).json({ error: "URL not found" });

  res.json({
    shortId,
    originalUrl: url.originalUrl,
    createdAt: url.createdAt.toISOString(),
    expiresAt: url.expiresAt.toISOString(),
    totalClicks: logs.length,
    logs: logs.map((l) => ({ ...l, timestamp: l.timestamp.toISOString() })),
  });
};
