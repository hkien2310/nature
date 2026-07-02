import { supabase } from "./supabase";

export interface EnrichmentTarget {
  id: string;
  name: string;
  scientific_name: string;
  class: string;
  order: string;
  family: string;
  real_weight: string;
  size: string;
  characteristics: string;
  habitat: string;
  location: string;
  survival_method: string;
  unique_traits: string;
  short_description: string;
  description: string;
  strengths: string;
  weaknesses: string;
  fun_facts: string;
  sources: string;
  image_color: string;
  enrichment_count: number;
  diet_type: string;
  diet_items: string;
  activity_pattern: string;
  lifespan_min: number;
  lifespan_max: number;
  lifespan_unit: string;
  reproduction_type: string;
  reproduction_notes: string;
  locomotion: string;
  speed_max: number;
  conservation_status: string;
  size_min_mm: number;
  size_max_mm: number;
  weight_avg_g: number;
}

export async function selectEnrichmentTargets(userId?: string, apiKey?: string): Promise<{ success: boolean; error?: string; targets?: EnrichmentTarget[] }> {
  try {
    // 1. Authenticate (must have valid admin userId or valid apiKey)
    if (userId) {
      const { data: account, error: authErr } = await supabase
        .from("accounts")
        .select("role, username")
        .eq("id", userId)
        .single();
      
      if (authErr || !account || (account.role !== "admin" && account.username !== "admin")) {
        return { success: false, error: "Access Denied: Bạn không có quyền Admin." };
      }
    } else if (apiKey) {
      const expectedKey = process.env.API_SECRET_KEY;
      if (apiKey !== expectedKey) {
        return { success: false, error: "Unauthorized: Invalid API key." };
      }
    } else {
      return { success: false, error: "Access Denied: Missing authorization credentials." };
    }

    // 2. Fetch all creatures with required columns
    const { data: dbCreatures, error: cErr } = await supabase
      .from("creatures")
      .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

    if (cErr || !dbCreatures || dbCreatures.length === 0) {
      return { success: false, error: "Không thể lấy dữ liệu sinh vật." };
    }

    // 3. Sort by enrichment_count ASC (treat null/undefined as 0) then id ASC
    const sorted = [...dbCreatures].sort((a, b) => {
      const aCount = a.enrichment_count ?? 0;
      const bCount = b.enrichment_count ?? 0;
      if (aCount !== bCount) {
        return aCount - bCount;
      }
      return a.id.localeCompare(b.id);
    });

    // 4. Return top 5 as targets
    const targets: EnrichmentTarget[] = sorted.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      class: c.class || "",
      order: c.order || "",
      family: c.family || "",
      real_weight: c.real_weight || "",
      size: c.size || "",
      characteristics: c.characteristics || "",
      habitat: c.habitat || "",
      location: c.location || "",
      survival_method: c.survival_method || "",
      unique_traits: c.unique_traits || "",
      short_description: c.short_description || "",
      description: c.description || "",
      strengths: c.strengths || "",
      weaknesses: c.weaknesses || "",
      fun_facts: c.fun_facts || "",
      sources: c.sources || "",
      image_color: c.image_color || "",
      enrichment_count: c.enrichment_count ?? 0,
      diet_type: c.diet_type || "",
      diet_items: c.diet_items || "",
      activity_pattern: c.activity_pattern || "",
      lifespan_min: c.lifespan_min ?? 0,
      lifespan_max: c.lifespan_max ?? 0,
      lifespan_unit: c.lifespan_unit || "",
      reproduction_type: c.reproduction_type || "",
      reproduction_notes: c.reproduction_notes || "",
      locomotion: c.locomotion || "",
      speed_max: c.speed_max ?? 0,
      conservation_status: c.conservation_status || "",
      size_min_mm: c.size_min_mm ?? 0,
      size_max_mm: c.size_max_mm ?? 0,
      weight_avg_g: c.weight_avg_g ?? 0,
    }));

    return {
      success: true,
      targets
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}
