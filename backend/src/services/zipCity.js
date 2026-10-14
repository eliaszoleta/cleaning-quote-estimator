const axios = require('axios');

// ZIP -> city lookup shared by the admin homepage-leads panel and the
// partner/company lead-notification emails -- both need to backfill a city
// for leads that only ever have zip + state on file (LocationStep.js only
// asks a visitor for their city when a company has scoped its embedded
// widget to specific states/cities, which most calculator instances never
// are). One in-memory cache per server process instead of bundling/
// maintaining a full ~41k-row US ZIP database.
const zipCityCache = new Map(); // zip -> city string, or null if the lookup failed/had no match (cached either way so a bad ZIP isn't retried every time)

async function resolveCityForZip(zip) {
  if (!zip || !/^\d{5}$/.test(zip)) return null;
  if (zipCityCache.has(zip)) return zipCityCache.get(zip);
  try {
    const { data } = await axios.get(`https://api.zippopotam.us/us/${zip}`, { timeout: 4000 });
    const city = data?.places?.[0]?.['place name'] || null;
    zipCityCache.set(zip, city);
    return city;
  } catch (err) {
    zipCityCache.set(zip, null);
    return null;
  }
}

module.exports = { resolveCityForZip };
