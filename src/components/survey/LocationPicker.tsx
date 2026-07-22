"use client";

import { useEffect, useState } from "react";
import { getCitiesByProvince, getProvincesByRegion, getRegions, type City, type Province, type Region } from "@/lib/ph-locations";
import type { LocationAnswer } from "@/lib/survey/types";

type LocationPickerProps = {
  value: Partial<LocationAnswer> | undefined;
  onChange: (value: Partial<LocationAnswer>) => void;
  errors?: Partial<Record<"regionCode" | "provinceCode" | "cityCode", string>>;
};

const selectClasses =
  "w-full min-h-14 rounded-xl border border-border bg-surface px-4 text-base disabled:opacity-50 disabled:cursor-not-allowed";

export function LocationPicker({ value, onChange, errors }: LocationPickerProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch(() => setLoadError("Couldn't load the list of regions. Check your connection and reload."));
  }, []);

  useEffect(() => {
    if (!value?.regionCode) return;
    getProvincesByRegion(value.regionCode).then(setProvinces).catch(() => setLoadError("Couldn't load provinces."));
  }, [value?.regionCode]);

  useEffect(() => {
    if (!value?.provinceCode) return;
    getCitiesByProvince(value.provinceCode).then(setCities).catch(() => setLoadError("Couldn't load cities/municipalities."));
  }, [value?.provinceCode]);

  // Once a region/province is cleared, the previously fetched lists become
  // stale — derive what's actually shown instead of syncing more state.
  const visibleProvinces = value?.regionCode ? provinces : [];
  const visibleCities = value?.provinceCode ? cities : [];

  return (
    <div className="flex flex-col gap-4">
      <Field label="Region" error={errors?.regionCode}>
        <select
          className={selectClasses}
          value={value?.regionCode ?? ""}
          onChange={(e) => {
            const region = regions.find((r) => r.region_code === e.target.value);
            onChange({
              regionCode: region?.region_code ?? "",
              regionName: region?.region_name ?? "",
              provinceCode: "",
              provinceName: "",
              cityCode: "",
              cityName: "",
            });
          }}
        >
          <option value="">Select region…</option>
          {regions.map((r) => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Province" error={errors?.provinceCode}>
        <select
          className={selectClasses}
          value={value?.provinceCode ?? ""}
          disabled={!value?.regionCode}
          onChange={(e) => {
            const province = visibleProvinces.find((p) => p.province_code === e.target.value);
            onChange({
              ...value,
              provinceCode: province?.province_code ?? "",
              provinceName: province?.province_name ?? "",
              cityCode: "",
              cityName: "",
            });
          }}
        >
          <option value="">{value?.regionCode ? "Select province…" : "Select region first"}</option>
          {visibleProvinces.map((p) => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City / Municipality" error={errors?.cityCode}>
        <select
          className={selectClasses}
          value={value?.cityCode ?? ""}
          disabled={!value?.provinceCode}
          onChange={(e) => {
            const city = visibleCities.find((c) => c.city_code === e.target.value);
            onChange({
              ...value,
              cityCode: city?.city_code ?? "",
              cityName: city?.city_name ?? "",
            });
          }}
        >
          <option value="">{value?.provinceCode ? "Select city/municipality…" : "Select province first"}</option>
          {visibleCities.map((c) => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>
      </Field>

      {loadError && (
        <p className="text-sm text-danger" role="alert">
          {loadError}
        </p>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {error && (
        <span className="block mt-1 text-sm text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
