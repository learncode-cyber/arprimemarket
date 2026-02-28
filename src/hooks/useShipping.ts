import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone {
  id: string;
  country_code: string;
  country_name: string;
  is_active: boolean;
  free_shipping_threshold: number | null;
}

export interface ShippingRate {
  id: string;
  zone_id: string;
  shipping_type: string;
  base_cost: number;
  per_kg_cost: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
}

export interface ShippingOption {
  rate: ShippingRate;
  zone: ShippingZone;
  totalCost: number;
  isFree: boolean;
  estimatedDays: string;
}

const COUNTRY_MAP: Record<string, string> = {
  Bangladesh: "BD", "United States": "US", USA: "US", Canada: "CA",
  "United Arab Emirates": "AE", UAE: "AE", "South Korea": "KR",
  "South Africa": "ZA", "Saudi Arabia": "SA", "Sri Lanka": "LK",
  "New Zealand": "NZ", "North Korea": "KP", "United Kingdom": "GB",
};

export function useShipping(country: string, subtotal: number, totalWeightKg: number = 0.5) {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("inside_dhaka");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data: z }, { data: r }] = await Promise.all([
        supabase.from("shipping_zones").select("*").eq("is_active", true),
        supabase.from("shipping_rates").select("*").eq("is_active", true),
      ]);
      setZones((z as ShippingZone[]) || []);
      setRates((r as ShippingRate[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const countryCode = COUNTRY_MAP[country] || country?.toUpperCase()?.slice(0, 2) || "BD";
  const isBD = countryCode === "BD";
  // Only fallback to BD zone if the selected country IS Bangladesh
  const zone = zones.find(z => z.country_code === countryCode) || (isBD ? zones.find(z => z.country_code === "BD") : undefined);
  // For BD: show inside_dhaka/outside_dhaka; for others: show standard/express
  const zoneRates = zone ? rates.filter(r => {
    if (r.zone_id !== zone.id) return false;
    if (isBD) return r.shipping_type === "inside_dhaka" || r.shipping_type === "outside_dhaka";
    return r.shipping_type === "standard" || r.shipping_type === "express";
  }) : [];

  const getOptions = useCallback((): ShippingOption[] => {
    if (!zone) return [];
    return zoneRates.map(rate => {
      const rawCost = Number(rate.base_cost) + Number(rate.per_kg_cost) * totalWeightKg;
      const isFree = zone.free_shipping_threshold != null && subtotal >= Number(zone.free_shipping_threshold) && rate.shipping_type === "standard";
      return {
        rate,
        zone,
        totalCost: isFree ? 0 : rawCost,
        isFree,
        estimatedDays: `${rate.min_days}-${rate.max_days}`,
      };
    });
  }, [zone, zoneRates, subtotal, totalWeightKg]);

  const options = getOptions();

  useEffect(() => {
    if (options.length === 0) return;
    if (!options.some((o) => o.rate.shipping_type === selectedType)) {
      setSelectedType(options[0].rate.shipping_type);
    }
  }, [options, selectedType]);

  const selected = options.find(o => o.rate.shipping_type === selectedType) || options[0];

  return { zones, rates, options, selected, selectedType, setSelectedType, loading, zone };
}

export function useShippingAdmin() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: z }, { data: r }] = await Promise.all([
      supabase.from("shipping_zones").select("*").order("country_name"),
      supabase.from("shipping_rates").select("*").order("shipping_type"),
    ]);
    setZones((z as ShippingZone[]) || []);
    setRates((r as ShippingRate[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateZone = async (id: string, updates: Partial<ShippingZone>) => {
    await supabase.from("shipping_zones").update(updates as any).eq("id", id);
    fetchAll();
  };

  const updateRate = async (id: string, updates: Partial<ShippingRate>) => {
    await supabase.from("shipping_rates").update(updates as any).eq("id", id);
    fetchAll();
  };

  const addZone = async (zone: { country_code: string; country_name: string; free_shipping_threshold: number | null }) => {
    await supabase.from("shipping_zones").insert(zone as any);
    fetchAll();
  };

  const addRate = async (rate: { zone_id: string; shipping_type: string; base_cost: number; per_kg_cost: number; min_days: number; max_days: number }) => {
    await supabase.from("shipping_rates").insert(rate as any);
    fetchAll();
  };

  const deleteRate = async (id: string) => {
    await supabase.from("shipping_rates").delete().eq("id", id);
    fetchAll();
  };

  return { zones, rates, loading, fetchAll, updateZone, updateRate, addZone, addRate, deleteRate };
}
