-- ============================================================
-- Good Night – סכמת מסד הנתונים
-- ============================================================

-- ENUMS
create type user_role as enum ('admin', 'owner');
create type user_status as enum ('pending', 'active', 'suspended');
create type booking_status as enum ('pending', 'approved', 'cancelled');
create type payment_status as enum ('deposit', 'paid', 'refund_pending', 'refunded');
create type time_status as enum ('future', 'active', 'completed');
create type season as enum ('weekday', 'weekend', 'peak');
create type occupancy_status as enum ('booked', 'blocked');

-- ============================================================
-- USERS (מרחיב את auth.users של Supabase)
-- ============================================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'owner',
  status user_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- VENUES (מתחמים)
-- ============================================================
create table venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  venue_number serial,
  name text not null,
  phone_primary text,
  phone_secondary text,
  mattress_price numeric(10,2) not null default 0,
  package_type text,
  status text not null default 'active',
  created_at timestamptz not null default now()
  -- venue_code מחושב באפליקציה: 'M-' || lpad(venue_number::text, 3, '0')
);

-- ============================================================
-- UNITS (יחידות אירוח)
-- ============================================================
create table units (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  unit_number serial,
  name text not null,
  description text,
  beds_count int not null default 0,
  max_mattresses int not null default 0,
  weekday_price numeric(10,2) not null default 0,
  weekend_price numeric(10,2) not null default 0,
  peak_price numeric(10,2) not null default 0,
  is_whole_venue boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS (הזמנות)
-- ============================================================
create sequence booking_number_seq start 1;

create table bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  booking_number int not null default nextval('booking_number_seq'),
  guest_name text not null,
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  nights_count int generated always as (check_out - check_in) stored,
  season season not null default 'weekday',
  booking_status booking_status not null default 'pending',
  payment_status payment_status not null default 'deposit',
  discount_type text,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  balance_due numeric(10,2) generated always as (total_amount - amount_paid) stored,
  payment_method text,
  booking_source text,
  notes text,
  has_conflict boolean not null default false,
  created_at timestamptz not null default now()
);

-- time_status כ-view computed column
create or replace function get_time_status(check_in date, check_out date)
returns time_status
language sql
immutable
as $$
  select case
    when check_in > current_date then 'future'::time_status
    when check_out < current_date then 'completed'::time_status
    else 'active'::time_status
  end;
$$;

-- ============================================================
-- BOOKING_UNITS (שורות הזמנה – יחידות בתוך הזמנה)
-- ============================================================
create table booking_units (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  unit_id uuid not null references units(id) on delete restrict,
  mattresses_added int not null default 0,
  unit_total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- OCCUPANCY (תפוסה)
-- שורה אחת לכל יחידה לכל יום בהזמנה
-- ============================================================
create table occupancy (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  date date not null,
  status occupancy_status not null default 'booked',
  created_at timestamptz not null default now(),
  unique(unit_id, date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table users enable row level security;
alter table venues enable row level security;
alter table units enable row level security;
alter table bookings enable row level security;
alter table booking_units enable row level security;
alter table occupancy enable row level security;

-- פונקציית עזר: האם המשתמש הנוכחי הוא admin?
create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- פונקציית עזר: מחזירה את רשימת venue IDs של המשתמש הנוכחי
create or replace function my_venue_ids()
returns setof uuid
language sql
security definer
as $$
  select id from venues where owner_id = auth.uid();
$$;

-- USERS policies
create policy "users: self or admin"
  on users for all
  using (id = auth.uid() or is_admin());

-- VENUES policies
create policy "venues: owner or admin"
  on venues for all
  using (owner_id = auth.uid() or is_admin());

-- UNITS policies
create policy "units: venue owner or admin"
  on units for all
  using (venue_id in (select my_venue_ids()) or is_admin());

-- BOOKINGS policies
create policy "bookings: venue owner or admin"
  on bookings for all
  using (venue_id in (select my_venue_ids()) or is_admin());

-- BOOKING_UNITS policies
create policy "booking_units: via booking or admin"
  on booking_units for all
  using (
    booking_id in (
      select id from bookings where venue_id in (select my_venue_ids())
    )
    or is_admin()
  );

-- OCCUPANCY policies
create policy "occupancy: via unit or admin"
  on occupancy for all
  using (
    unit_id in (select id from units where venue_id in (select my_venue_ids()))
    or is_admin()
  );

-- ============================================================
-- TRIGGER: יצירת user אחרי הרשמה ב-auth
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into users (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'owner',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
