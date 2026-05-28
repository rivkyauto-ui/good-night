# Good Night – לנהל אירוח בראש שקט

מערכת SaaS לניהול מתחמי אירוח וצימרים. בעלי מתחמים מנהלים הזמנות, תשלומים ותפוסה מממשק מובייל-ראשון. המפתחת (רבקי) מנהלת את כלל המערכת דרך פאנל אדמין.

---

## Tech Stack

- **Next.js 16** – App Router, TypeScript
- **Supabase** – Auth, PostgreSQL, Row Level Security
- **Tailwind CSS v4**
- **@supabase/ssr** לניהול sessions בצד שרת

אין shadcn/ui. קומפוננטות נכתבות ידנית.

---

## מבנה תיקיות (מתוכנן)

```
app/
  (auth)/           # login, register, forgot-password
  (admin)/          # פאנל אדמין – גישה לרבקי בלבד
  (dashboard)/      # אזור בעל המתחם
    dashboard/      # לוח בקרה ראשי
    bookings/       # רשימת הזמנות + פרטי הזמנה
    availability/   # יומן תפוסה
    settings/       # הגדרות מתחם ויחידות
components/
lib/
  supabase/         # client, server, middleware helpers
types/
```

---

## מסד נתונים – סכמה

### users
| עמודה | סוג | הערה |
|---|---|---|
| id | uuid (FK auth.users) | |
| email | text | |
| role | enum: admin / owner | admin = רבקי |
| status | enum: pending / active / suspended | pending עד אישור אדמין |
| created_at | timestamptz | |

### venues
| עמודה | סוג | הערה |
|---|---|---|
| id | uuid | |
| name | text | שם המתחם |
| owner_id | uuid (FK users) | |
| phone_primary | text | |
| phone_secondary | text | |
| email | text | |
| mattress_price | numeric | מחיר מזרון (אחיד לכל המתחם) |
| package_type | text | סוג חבילה |
| status | enum: active / inactive | |
| created_at | timestamptz | |

### units
| עמודה | סוג | הערה |
|---|---|---|
| id | uuid | |
| venue_id | uuid (FK venues) | |
| name | text | שם היחידה |
| description | text | |
| beds_count | int | מס' מיטות |
| max_mattresses | int | מקסימום מזרונים ביחידה |
| weekday_price | numeric | |
| weekend_price | numeric | |
| peak_price | numeric | שיא עונה וחגים |
| is_whole_venue | boolean | האם זו אופציית "כל המתחם" |
| sort_order | int | סדר הצגה |
| created_at | timestamptz | |

### bookings
| עמודה | סוג | הערה |
|---|---|---|
| id | uuid | |
| venue_id | uuid (FK venues) | |
| booking_number | serial | ORD-XXXX |
| guest_name | text | |
| guest_phone | text | |
| guest_email | text | |
| check_in | date | |
| check_out | date | |
| nights_count | int (generated) | check_out - check_in |
| season | enum: weekday / weekend / peak | בחירה ידנית |
| booking_status | enum: pending / approved / cancelled | |
| payment_status | enum: deposit / paid / refund_pending / refunded | |
| time_status | enum: future / active / completed | מחושב לפי תאריכים |
| discount_type | text | |
| discount_amount | numeric | |
| total_amount | numeric | מחושב |
| amount_paid | numeric | |
| balance_due | numeric (generated) | total - paid |
| payment_method | text | |
| booking_source | text | |
| notes | text | |
| has_conflict | boolean | default false |
| created_at | timestamptz | |

### booking_units
שורה אחת לכל יחידה בהזמנה.

| עמודה | סוג | הערה |
|---|---|---|
| id | uuid | |
| booking_id | uuid (FK bookings) | |
| unit_id | uuid (FK units) | |
| mattresses_added | int | default 0 |
| unit_total | numeric | מחיר יחידה זו בהזמנה |

### occupancy
שורה אחת לכל יחידה לכל יום בהזמנה. נוצר אוטומטית עם יצירת הזמנה.

| עמודה | סוג | הערה |
|---|---|---|
| id | uuid | |
| unit_id | uuid (FK units) | |
| booking_id | uuid (FK bookings) | |
| date | date | |
| status | enum: booked / blocked | |

---

## Row Level Security

- בעל מתחם רואה/עורך רק רשומות ששייכות ל-venues שבבעלותו
- admin (role = 'admin') עוקף את כל ה-RLS
- כלל RLS מוגדר על כל הטבלאות

---

## לוגיקה עסקית מרכזית

### כניסה של "כל המתחם"
כשיחידה עם `is_whole_venue = true` נבחרת בהזמנה, בשמירה המערכת:
1. מוסיפה שורה ב-booking_units לכל יחידת המתחם
2. יוצרת רשומות occupancy לכל יחידה בכל תאריך

### time_status
מחושב ב-DB כ-generated column:
- `future` – check_in > today
- `active` – check_in <= today <= check_out
- `completed` – check_out < today

### פעולות מהירות (quick actions)
פעולות שמשנות סטטוס בלחיצה אחת — ללא טופס עריכה:
- **הזמנה אושרה** → booking_status = approved
- **בוטלה** → booking_status = cancelled
- **סמן כשולם** → payment_status = paid, amount_paid = total_amount
- **בקשת החזר** → payment_status = refund_pending
- **החזר בוצע** → payment_status = refunded

### לוגיקת "דורש טיפול"
- **ממתינות לאישור**: booking_status = pending
- **ממתינות לגביה**: booking_status = approved AND balance_due > 0 AND time_status != completed
- **ממתינות להחזר**: payment_status = refund_pending

---

## מודל משתמשים

| תפקיד | מה הוא רואה |
|---|---|
| admin | כל המתחמים, כל ההזמנות, ניהול משתמשים |
| owner | רק המתחמים שלו, יחידות, הזמנות |

### תהליך הצטרפות
1. בעל מתחם ממלא טופס הרשמה (שם, מייל, טלפון, פרטי מתחם)
2. חשבון נוצר עם status = pending
3. אדמין רואה הרשמה חדשה, מאשר ידנית
4. status → active, מייל אישור נשלח לבעל המתחם
5. תשלום (הקמה + מנוי) — **נדחה לשלב מאוחר**

---

## עיצוב

- **מובייל קודם** – כל מסך מתוכנן לרוחב 390px תחילה
- **ניווט תחתון** ב-4 כפתורים: לוח בקרה / הזמנות / זמינות / הזמנה חדשה
- צבעים: dark theme, accent זהוב/amber (בהתאם ללוגו)
- שפת ממשק: עברית, כיוון RTL

---

## פרויקט ייחוס

הפרויקט בנוי באותו סטק ומוסכמות כמו `d:\קלוד קוד\yedid-nefesh`.
לפני כל החלטת ארכיטקטורה — בדוק שם קודם.

---

## נדחה לשלב מאוחר

- אינטגרציית Stripe (תשלום מנויים)
- WhatsApp / מיילים אוטומטיים
- תזכורות אוטומטיות
- קישורי תשלום
- זיהוי עונה אוטומטי לפי תאריך
- ניהול UI מיוחד לבעל שיש לו מספר מתחמים
