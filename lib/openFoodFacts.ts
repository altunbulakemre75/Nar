export interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_tr?: string;
  brands?: string;
  categories_tags?: string[];
  image_url?: string;
  ingredients_text?: string;
  ingredients_text_tr?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
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

    // 8 saniye timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: { "User-Agent": "Nar/1.0 (https://narapp.com)" },
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
  const nutriments = off.nutriments ?? {};
  const countries = off.countries_tags ?? [];

  // Türkiye'de satılıyor mu?
  const soldInTurkey = countries.some(
    (c) => c.toLowerCase().includes("turkey") || c.toLowerCase().includes("turkiye")
  );

  // Menşe ülke - countries_tags'in ilki tipik olarak ana ülke
  const originCountryRaw = countries[0]?.replace(/^en:/, "") ?? "UNKNOWN";
  const originCountry = originCountryRaw.toUpperCase();

  // Sodyum (g → mg). Eğer yoksa tuzdan yaklaşık hesapla (tuz * 400 ≈ sodyum mg)
  const sodium = nutriments.sodium_100g
    ? nutriments.sodium_100g * 1000
    : nutriments.salt_100g
    ? nutriments.salt_100g * 400
    : 0;

  // Kategori - son tag en spesifik oluyor genelde, ama basit tutalım
  const category = off.categories_tags?.[0]?.replace(/^en:/, "") ?? null;

  return {
    barcode,
    name: off.product_name_tr || off.product_name || "İsimsiz ürün",
    brand: off.brands?.split(",")[0]?.trim() || null,
    category,
    image_url: off.image_url || null,
    ingredients: off.ingredients_text_tr || off.ingredients_text || null,
    nutrition: {
      calories: Math.round(nutriments["energy-kcal_100g"] ?? 0),
      sugar: Number((nutriments.sugars_100g ?? 0).toFixed(1)),
      saturated_fat: Number((nutriments["saturated-fat_100g"] ?? 0).toFixed(1)),
      fat: Number((nutriments.fat_100g ?? 0).toFixed(1)),
      sodium: Math.round(sodium),
      fiber: Number((nutriments.fiber_100g ?? 0).toFixed(1)),
      protein: Number((nutriments.proteins_100g ?? 0).toFixed(1)),
      serving_size_g: 100,
    },
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
  };
}
