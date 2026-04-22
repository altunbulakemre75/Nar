export interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_tr?: string;
  brands?: string;
  categories_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  ingredients_text?: string;
  ingredients_text_tr?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kj_100g"?: number;
    energy_100g?: number;
    energy_unit?: string;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    "saturated-fat_100g"?: number;
    fat_100g?: number;
    sodium_100g?: number;
    salt_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
  };
  additives_tags?: string[];
  labels_tags?: string[];
  countries_tags?: string[];
}

export interface OFFMappedProduct {
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  ingredients: string | null;
  nutrition: {
    calories: number;
    sugar: number;
    saturated_fat: number;
    fat: number;
    sodium: number;
    fiber: number;
    protein: number;
    serving_size_g: number;
  };
  additives: string[];
  is_organic: boolean;
  sold_in_turkey: boolean;
  origin_country: string;
  country: string;
  verified: boolean;
  has_complete_data?: boolean;
}

/**
 * Open Food Facts'ten barkoda göre ürün çeker.
 * Bulamazsa null döner. Hata/timeout durumunda da null.
 */
export async function fetchFromOFF(barcode: string): Promise<OFFMappedProduct | null> {
  try {
    const fields = [
      "product_name",
      "product_name_tr",
      "brands",
      "categories_tags",
      "image_url",
      "image_front_url",
      "ingredients_text",
      "ingredients_text_tr",
      "nutriments",
      "additives_tags",
      "labels_tags",
      "countries_tags",
    ].join(",");

    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      barcode
    )}.json?fields=${fields}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: { "User-Agent": "NarAura/1.0 (https://narapp.com)" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return mapOFFtoProduct(data.product, barcode);
  } catch (error) {
    console.warn("OFF fetch error:", (error as Error).message);
    return null;
  }
}

function mapOFFtoProduct(off: OFFProduct, barcode: string): OFFMappedProduct {
  const n: Record<string, any> = off.nutriments ?? {};
  const countries = off.countries_tags ?? [];

  // Generic field resolver: tries primary key + fallbacks, returns 0 if nothing found
  const getField = (primary: string, ...fallbacks: string[]): number => {
    for (const key of [primary, ...fallbacks]) {
      const val = n[key];
      if (typeof val === "number" && val > 0) return val;
    }
    return 0;
  };

  // Calories: tries kcal keys first, then kJ with conversion
  const getCalories = (): number => {
    const kcal = getField("energy-kcal_100g", "energy-kcal", "energy_kcal_100g");
    if (kcal > 0) return Math.round(kcal);
    const kj = getField("energy-kj_100g", "energy-kj", "energy_kj_100g", "energy_100g");
    if (kj > 0) {
      const unit = (n["energy_unit"] ?? "").toLowerCase();
      if (unit === "kcal") return Math.round(kj);
      return Math.round(kj / 4.184);
    }
    return 0;
  };

  const soldInTurkey = countries.some(
    (c) => c.toLowerCase().includes("turkey") || c.toLowerCase().includes("turkiye")
  );
  const originCountryRaw = countries[0]?.replace(/^en:/, "") ?? "UNKNOWN";
  const originCountry = originCountryRaw.toUpperCase();

  const calories = getCalories();
  const sugar = Number(getField("sugars_100g", "sugar_100g").toFixed(1));
  const saturated_fat = Number(getField("saturated-fat_100g", "saturated_fat_100g").toFixed(1));
  const fat = Number(getField("fat_100g").toFixed(1));
  const fiber = Number(getField("fiber_100g", "fibers_100g").toFixed(1));
  const protein = Number(getField("proteins_100g", "protein_100g").toFixed(1));

  const sodiumRaw = getField("sodium_100g");
  const saltRaw = getField("salt_100g");
  const sodium = sodiumRaw > 0 ? Math.round(sodiumRaw * 1000) : saltRaw > 0 ? Math.round(saltRaw * 400) : 0;

  const category = off.categories_tags?.[0]?.replace(/^en:/, "") ?? null;

  const hasValidNutrition = calories > 0 || protein > 0;
  const nutrition = { calories, sugar, saturated_fat, fat, sodium, fiber, protein, serving_size_g: 100 };

  return {
    barcode,
    name: off.product_name_tr || off.product_name || "İsimsiz ürün",
    brand: off.brands?.split(",")[0]?.trim() || null,
    category,
    image_url: off.image_front_url || off.image_url || null,
    ingredients: off.ingredients_text_tr || off.ingredients_text || null,
    nutrition,
    additives: (off.additives_tags ?? [])
      .map((t) => t.replace(/^en:/, "").toUpperCase())
      .slice(0, 10),
    is_organic:
      off.labels_tags?.some(
        (l) => l.toLowerCase().includes("organic") || l.toLowerCase().includes("bio")
      ) ?? false,
    sold_in_turkey: soldInTurkey,
    origin_country: originCountry,
    country: soldInTurkey ? "TR" : originCountry,
    verified: false,
    has_complete_data: hasValidNutrition,
  };
}

