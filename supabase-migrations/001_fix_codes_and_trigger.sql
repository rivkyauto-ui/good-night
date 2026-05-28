-- ============================================================
-- תיקון 1: הוספת מספר רץ לקוד מתחם וקוד יחידה
-- ============================================================

-- venues: הוספת עמודת מספר רץ
alter table venues add column if not exists venue_number serial;

-- units: הוספת עמודת מספר רץ
alter table units add column if not exists unit_number serial;

-- venue_code ו-unit_code יחושבו בקוד האפליקציה:
-- venue_code = 'M-' || lpad(venue_number::text, 3, '0')  →  M-001, M-002...
-- unit_code  = 'U-' || lpad(unit_number::text,  3, '0')  →  U-001, U-002...

-- ============================================================
-- תיקון 2: trigger ישמור גם full_name
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
