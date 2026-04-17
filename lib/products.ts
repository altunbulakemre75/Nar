import { supabase } from "./supabase";
import type { Product, Scan, Goal } from "@/types/database";
import { calculateScore } from "./scoring";
import { fetchFromOFF } from "./openFoodFacts";

/**
 * Barkod ile ürün getir.
 * Akış: 1) Supabase cache → 2) Open Food Facts → 3) Supabase'e kaydet.
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  // 1) Önce kendi veritabanımıza bak (cache)
  const { data: local, error: localError } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();

  if (localError) console.warn("products.select:", localError);
  if (local) return local as Product;

  // 2) Yoksa Open Food Facts'ten çek
  const offProduct = await fetchFromOFF(barcode);
  if (!offProduct) return null;

  // 3) Supabase'e kaydet — ikinci sefer cache'ten gelsin
  const { data: saved, error: insertError } = await supabase
    .from("products")
    .insert(offProduct)
    .select()
    .single();

  if (saved) return saved as Product;

  // 23505 = duplicate key. Race condition: başka biri aynı anda eklemiş olabilir
  if (insertError?.code === "23505") {
    const { data: retry } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (retry) return retry as Product;
  }

  // RLS veya başka nedenle insert başarısız → en azından bellekteki veriyi döndür
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

  // 1) scan kaydı
  const { error: scanError } = await supabase
    .from("scans")
    .insert({ user_id: user.id, product_id: product.id, score, logged_in_daily: true });

  if (scanError) {
    console.error("scans.insert:", scanError);
    return null;
  }

  // 2) günlük özet güncelle (upsert)
  const today = new Date().toISOString().split("T")[0];

  const { data: todayScans } = await supabase
    .from("scans")
    .select("score")
    .eq("user_id", user.id)
    .gte("scanned_at", `${today}T00:00:00`)
    .lte("scanned_at", `${today}T23:59:59`);

  const items = todayScans ?? [];
  const avg =
    items.length > 0
      ? items.reduce((sum, s) => sum + (s.score ?? 0), 0) / items.length
      : score;

  await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date: today,
      average_score: Math.round(avg * 100) / 100,
      items_count: items.length,
    },
    { onConflict: "user_id,date" }
  );

  // 3) scan_count artır
  await supabase
    .from("products")
    .update({ scan_count: (product.scan_count ?? 0) + 1 } as any)
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
