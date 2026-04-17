import { supabase } from "./supabase";
import type { Product, Scan, Goal } from "@/types/database";
import { calculateScore } from "./scoring";
import { fetchFromOFF } from "./openFoodFacts";

/**
 * Barkod ile ürün getir.
 * Akış: 1) Supabase cache → 2) Open Food Facts → 3) Supabase'e kaydet.
 */
function isStale(p: Product | null | undefined): boolean {
  if (!p) return true;
  // Fotoğraf yoksa da bayat say — OFF'tan tazele
  if (!p.image_url) return true;
  if (!p.nutrition) return true;
  const n = p.nutrition;
  return (n.calories ?? 0) === 0 && (n.protein ?? 0) === 0;
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  // 1) Önce kendi veritabanımıza bak (cache)
  const { data: local, error: localError } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();

  if (localError) console.warn("products.select:", localError);

  // Cache varsa ve verisi sağlam, kullan
  if (local && !isStale(local as Product)) {
    return local as Product;
  }

  // 2) OFF'tan taze veri çek (cache yok veya bayat)
  const offProduct = await fetchFromOFF(barcode);

  // OFF'ta da yoksa — eski cache'e düş (boş bile olsa)
  if (!offProduct) {
    return (local as Product) ?? null;
  }

  // 3) Cache'te var ama bayat → UPDATE. Yoksa → INSERT.
  if (local) {
    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update({
        name: offProduct.name,
        brand: offProduct.brand,
        image_url: offProduct.image_url,
        ingredients: offProduct.ingredients,
        nutrition: offProduct.nutrition,
        additives: offProduct.additives,
        is_organic: offProduct.is_organic,
        sold_in_turkey: offProduct.sold_in_turkey,
        origin_country: offProduct.origin_country,
        country: offProduct.country,
        has_complete_data: offProduct.has_complete_data,
      })
      .eq("barcode", barcode)
      .select()
      .single();

    if (updated) return updated as Product;
    if (updateError) console.warn("products.update (stale refresh):", updateError);
    // RLS update'i engelliyorsa taze OFF verisini bellekten döndür (id korunur)
    return { ...(local as Product), ...offProduct } as Product;
  }

  // Yeni kayıt
  const { data: saved, error: insertError } = await supabase
    .from("products")
    .insert(offProduct)
    .select()
    .single();

  if (saved) return saved as Product;

  if (insertError?.code === "23505") {
    const { data: retry } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (retry) return retry as Product;
  }

  if (insertError) console.warn("products.insert:", insertError);
  return offProduct as unknown as Product;
}

export async function saveScan(product: Product, goal: Goal | null): Promise<number | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    console.warn("saveScan: oturum yok");
    return null;
  }

  const score = calculateScore(product, goal ?? "lose_weight");
  if (score < 0) {
    console.warn("saveScan: skor hesaplanamadı (veri eksik)");
    return null;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // 1) scan kaydı — scanned_at açıkça gönder (DB default'a güvenme)
  const { error: scanError } = await supabase.from("scans").insert({
    user_id: user.id,
    product_id: product.id,
    score,
    logged_in_daily: true,
    scanned_at: now.toISOString(),
  });

  if (scanError) {
    console.error("scans.insert:", scanError);
    return null;
  }

  // 2) günlük özet güncelle — yeni insert yansımazsa en az 1 say
  const { data: todayScans } = await supabase
    .from("scans")
    .select("score")
    .eq("user_id", user.id)
    .gte("scanned_at", `${today}T00:00:00`)
    .lte("scanned_at", `${today}T23:59:59`);

  const items = todayScans ?? [];
  const count = Math.max(items.length, 1);
  const totalScore =
    items.length > 0 ? items.reduce((sum, s) => sum + (s.score ?? 0), 0) : score;
  const avg = items.length > 0 ? totalScore / items.length : score;

  await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date: today,
      average_score: Math.round(avg * 100) / 100,
      items_count: count,
    },
    { onConflict: "user_id,date" }
  );

  // 3) scan_count artır — read-then-write, TOCTOU race mümkün ama non-critical.
  // Tam atomiklik için DB'de `rpc('increment_scan_count', {pid: id})` oluşturulabilir.
  const { data: fresh } = await supabase
    .from("products")
    .select("scan_count")
    .eq("id", product.id)
    .maybeSingle();
  await supabase
    .from("products")
    .update({ scan_count: ((fresh?.scan_count ?? product.scan_count ?? 0) + 1) })
    .eq("id", product.id);

  return score;
}

export interface TodayLog {
  user_id: string;
  date: string;
  average_score: number;
  items_count: number;
}

export async function getTodayLog(): Promise<TodayLog | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return data as TodayLog | null;
}

export interface ScanWithProduct extends Scan {
  product: Product;
}

/**
 * Bir scan kaydını siler ve bugünün daily_logs özetini yeniden hesaplar.
 */
export async function deleteScan(scanId: string): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const { error } = await supabase.from("scans").delete().eq("id", scanId).eq("user_id", user.id);
  if (error) {
    console.warn("deleteScan:", error);
    return false;
  }

  // Bugünün özetini güncelle
  const today = new Date().toISOString().split("T")[0];
  const { data: todayScans } = await supabase
    .from("scans")
    .select("score")
    .eq("user_id", user.id)
    .gte("scanned_at", `${today}T00:00:00`)
    .lte("scanned_at", `${today}T23:59:59`);

  const items = todayScans ?? [];
  if (items.length === 0) {
    await supabase.from("daily_logs").delete().eq("user_id", user.id).eq("date", today);
  } else {
    const avg = items.reduce((sum, s) => sum + (s.score ?? 0), 0) / items.length;
    await supabase.from("daily_logs").upsert(
      {
        user_id: user.id,
        date: today,
        average_score: Math.round(avg * 100) / 100,
        items_count: items.length,
      },
      { onConflict: "user_id,date" }
    );
  }

  return true;
}

export async function getRecentScans(limit = 10): Promise<ScanWithProduct[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("scans")
    .select("*, product:products(*)")
    .eq("user_id", user.id)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentScans:", error);
    return [];
  }
  return (data as ScanWithProduct[]) ?? [];
}
