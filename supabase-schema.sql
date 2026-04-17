-- ========================================
-- Nar — Supabase veritabanı şeması
-- ========================================
-- Kullanım:
-- 1. supabase.com → New Project (Region: Frankfurt)
-- 2. SQL Editor → New Query
-- 3. Bu dosyanın tamamını yapıştır, Run bas
-- 4. Settings → API'den URL ve anon key al, .env dosyasına yaz
-- ========================================

-- 1. Kullanıcı profilleri
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text,
  goal text check (goal in ('lose_weight', 'gain_muscle', 'clear_skin', 'reduce_bloat', 'better_sleep', 'more_energy', 'face_sculpt')),
  age int check (age > 0 and age < 120),
  gender text check (gender in ('male', 'female', 'other')),
  height_cm int check (height_cm > 50 and height_cm < 250),
  weight_kg numeric(5,2) check (weight_kg > 20 and weight_kg < 300),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  water_glasses int default 8,
  dietary_restrictions text[] default '{}',
  health_conditions text[] default '{}',
  allergies text[] default '{}'
);

-- 2. Ürünler (barkod veritabanı)
create table if not exists public.products (
  id bigserial primary key,
  barcode text unique not null,
  name text not null,
  brand text,
  category text,
  image_url text,
  ingredients text,
  nutrition jsonb,
  additives text[] default '{}',
  is_organic boolean default false,
  country text default 'TR',
  added_by uuid references auth.users,
  verified boolean default false,
  scan_count int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_products_name on public.products using gin(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(brand, '')));

-- 3. Tarama geçmişi
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  product_id bigint references public.products not null,
  score int check (score >= 0 and score <= 100),
  logged_in_daily boolean default false,
  scanned_at timestamptz default now()
);

create index if not exists idx_scans_user_date on public.scans(user_id, scanned_at desc);

-- 4. Günlük özet
create table if not exists public.daily_logs (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  average_score numeric(5,2),
  items_count int default 0,
  unique(user_id, date)
);

create index if not exists idx_daily_logs_user on public.daily_logs(user_id, date desc);

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.products enable row level security;

-- Profiles policies
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Scans policies
drop policy if exists "Users read own scans" on public.scans;
create policy "Users read own scans" on public.scans
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own scans" on public.scans;
create policy "Users insert own scans" on public.scans
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own scans" on public.scans;
create policy "Users delete own scans" on public.scans
  for delete using (auth.uid() = user_id);

-- Daily logs policies
drop policy if exists "Users read own logs" on public.daily_logs;
create policy "Users read own logs" on public.daily_logs
  for select using (auth.uid() = user_id);

drop policy if exists "Users manage own logs" on public.daily_logs;
create policy "Users manage own logs" on public.daily_logs
  for all using (auth.uid() = user_id);

-- Products policies
drop policy if exists "Products readable by all" on public.products;
create policy "Products readable by all" on public.products
  for select using (true);

drop policy if exists "Authenticated users add products" on public.products;
create policy "Authenticated users add products" on public.products
  for insert with check (auth.role() = 'authenticated');

-- 6. Trigger: Yeni kullanıcı için otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Örnek Türk ürünleri (test verisi)
insert into public.products (barcode, name, brand, category, nutrition, additives, verified) values
('8690504088332', 'Ülker Halley', 'Ülker', 'Bisküvi', '{"calories": 140, "sugar": 13, "saturated_fat": 3.5, "fat": 6, "sodium": 60, "fiber": 0.5, "protein": 1.5, "serving_size_g": 30}', '{"palm yağı", "yapay aroma"}', true),
('8690504014409', 'Eti Canga', 'Eti', 'Çikolata', '{"calories": 240, "sugar": 22, "saturated_fat": 6, "fat": 13, "sodium": 45, "fiber": 1, "protein": 3, "serving_size_g": 45}', '{"palm yağı"}', true),
('8690637004018', 'Pınar Süt Tam Yağlı', 'Pınar', 'Süt', '{"calories": 65, "sugar": 4.7, "saturated_fat": 2.2, "fat": 3.5, "sodium": 40, "fiber": 0, "protein": 3.3, "serving_size_g": 100}', '{}', true),
('8690504109006', 'Eti Tutku Kakaolu', 'Eti', 'Bisküvi', '{"calories": 145, "sugar": 10, "saturated_fat": 3, "fat": 6, "sodium": 80, "fiber": 1.2, "protein": 2, "serving_size_g": 30}', '{"palm yağı"}', true),
('8690504091103', 'Ülker Çikolatalı Gofret', 'Ülker', 'Çikolata', '{"calories": 180, "sugar": 18, "saturated_fat": 5, "fat": 9, "sodium": 35, "fiber": 0.8, "protein": 2, "serving_size_g": 36}', '{"palm yağı", "yapay aroma", "lesitin"}', true),
('8690824005008', 'Sütaş Yoğurt Tam Yağlı', 'Sütaş', 'Yoğurt', '{"calories": 60, "sugar": 4, "saturated_fat": 2, "fat": 3.2, "sodium": 50, "fiber": 0, "protein": 3.5, "serving_size_g": 100}', '{}', true),
('8690637125539', 'Torku Banvit Hindi Salam', 'Torku', 'Şarküteri', '{"calories": 110, "sugar": 0.5, "saturated_fat": 2.5, "fat": 6, "sodium": 850, "fiber": 0, "protein": 14, "serving_size_g": 50}', '{"sodyum nitrit", "E250"}', true),
('8690504100256', 'Eti Crax Sade', 'Eti', 'Kraker', '{"calories": 130, "sugar": 1, "saturated_fat": 2, "fat": 5, "sodium": 300, "fiber": 1, "protein": 2.5, "serving_size_g": 30}', '{"palm yağı"}', true)
on conflict (barcode) do nothing;

-- Bitti. Table Editor'den tablolarin olustugunu kontrol et.
