/**
 * Region / Province / City-Municipality data for the cascading location
 * picker. Bundled locally under /public/data/ph-locations (fetched once and
 * cached in memory) instead of calling a third-party API at runtime, so the
 * survey doesn't depend on an external site staying up during data
 * collection and stays fast on mobile data.
 *
 * Source snapshot: https://github.com/isaacdarcilla/philippine-addresses
 */

export type Region = {
  region_code: string;
  region_name: string;
};

export type Province = {
  province_code: string;
  province_name: string;
  region_code: string;
};

export type City = {
  city_code: string;
  city_name: string;
  province_code: string;
};

let regionsCache: Region[] | null = null;
let provincesCache: Province[] | null = null;
let citiesCache: City[] | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getRegions(): Promise<Region[]> {
  if (!regionsCache) {
    regionsCache = await fetchJson<Region[]>("/data/ph-locations/region.json");
  }
  return regionsCache;
}

export async function getProvincesByRegion(regionCode: string): Promise<Province[]> {
  if (!provincesCache) {
    provincesCache = await fetchJson<Province[]>("/data/ph-locations/province.json");
  }
  // NCR districts appear twice under the same province_code with slightly
  // different labels (e.g. "City Of Manila" vs "Ncr, City Of Manila, First
  // District"); keep one entry per code, preferring the plainer name.
  const byCode = new Map<string, Province>();
  for (const p of provincesCache.filter((p) => p.region_code === regionCode)) {
    const existing = byCode.get(p.province_code);
    if (!existing || p.province_name.length < existing.province_name.length) {
      byCode.set(p.province_code, p);
    }
  }
  return Array.from(byCode.values()).sort((a, b) => a.province_name.localeCompare(b.province_name));
}

export async function getCitiesByProvince(provinceCode: string): Promise<City[]> {
  if (!citiesCache) {
    citiesCache = await fetchJson<City[]>("/data/ph-locations/city.json");
  }
  return citiesCache
    .filter((c) => c.province_code === provinceCode)
    .sort((a, b) => a.city_name.localeCompare(b.city_name));
}
