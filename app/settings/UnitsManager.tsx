"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Unit {
  id: string;
  name: string;
  description: string | null;
  beds_count: number;
  max_mattresses: number;
  weekday_price: number;
  weekend_price: number;
  peak_price: number;
  is_whole_venue: boolean;
  sort_order: number;
}

interface Props {
  venueId: string;
  initialUnits: Unit[];
}

const EMPTY_FORM = {
  name: "",
  description: "",
  beds_count: "2",
  max_mattresses: "0",
  weekday_price: "0",
  weekend_price: "0",
  peak_price: "0",
  is_whole_venue: false,
};

const INPUT_STYLE = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--foreground)",
  outline: "none",
} as const;

type FormState = typeof EMPTY_FORM;

export default function UnitsManager({ venueId, initialUnits }: Props) {
  const [units, setUnits] = useState<Unit[]>(
    [...initialUnits].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [editingId, setEditingId] = useState<string | null>(null); // "new" | unit.id | null
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasWholeVenue = units.some((u) => u.is_whole_venue);

  function startEdit(unit: Unit) {
    setEditingId(unit.id);
    setForm({
      name: unit.name,
      description: unit.description ?? "",
      beds_count: String(unit.beds_count),
      max_mattresses: String(unit.max_mattresses),
      weekday_price: String(unit.weekday_price),
      weekend_price: String(unit.weekend_price),
      peak_price: String(unit.peak_price),
      is_whole_venue: unit.is_whole_venue,
    });
    setError(null);
  }

  function startAdd() {
    setEditingId("new");
    setForm(EMPTY_FORM);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  function updateForm(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveUnit() {
    if (!form.name.trim()) { setError("שם היחידה הוא שדה חובה"); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      beds_count: Number(form.beds_count) || 0,
      max_mattresses: Number(form.max_mattresses) || 0,
      weekday_price: Number(form.weekday_price) || 0,
      weekend_price: Number(form.weekend_price) || 0,
      peak_price: Number(form.peak_price) || 0,
      is_whole_venue: form.is_whole_venue,
    };

    if (editingId === "new") {
      const maxOrder = units.reduce((m, u) => Math.max(m, u.sort_order), -1);
      const { data: newUnit, error: err } = await supabase
        .from("units")
        .insert({ ...data, venue_id: venueId, sort_order: maxOrder + 1 })
        .select()
        .single();
      if (err) { setError(err.message); setLoading(false); return; }
      setUnits((prev) => [...prev, {
        ...newUnit,
        weekday_price: Number(newUnit.weekday_price),
        weekend_price: Number(newUnit.weekend_price),
        peak_price: Number(newUnit.peak_price),
      } as Unit]);
    } else {
      const { error: err } = await supabase.from("units").update(data).eq("id", editingId!);
      if (err) { setError(err.message); setLoading(false); return; }
      setUnits((prev) => prev.map((u) => u.id === editingId ? { ...u, ...data } : u));
    }

    setEditingId(null);
    setLoading(false);
  }

  async function deleteUnit(unitId: string) {
    if (!confirm("למחוק יחידה זו? לא ניתן לשחזר.")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("units").delete().eq("id", unitId);
    if (err) { alert(err.message); return; }
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
  }

  async function moveUnit(unitId: string, dir: "up" | "down") {
    const idx = units.findIndex((u) => u.id === unitId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= units.length) return;

    const a = units[idx];
    const b = units[swapIdx];
    const supabase = createClient();

    await Promise.all([
      supabase.from("units").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("units").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);

    const next = [...units];
    next[idx] = { ...a, sort_order: b.sort_order };
    next[swapIdx] = { ...b, sort_order: a.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setUnits(next);
  }

  return (
    <div className="flex flex-col gap-3">
        {units.map((unit, idx) =>
          editingId === unit.id ? (
            <UnitForm
              key={unit.id}
              form={form}
              onChange={updateForm}
              onSave={saveUnit}
              onCancel={cancel}
              loading={loading}
              error={error}
              hasWholeVenue={hasWholeVenue && !unit.is_whole_venue}
            />
          ) : (
            <UnitCard
              key={unit.id}
              unit={unit}
              isFirst={idx === 0}
              isLast={idx === units.length - 1}
              onEdit={() => startEdit(unit)}
              onDelete={() => deleteUnit(unit.id)}
              onMoveUp={() => moveUnit(unit.id, "up")}
              onMoveDown={() => moveUnit(unit.id, "down")}
            />
          )
        )}

        {editingId === "new" ? (
          <UnitForm
            form={form}
            onChange={updateForm}
            onSave={saveUnit}
            onCancel={cancel}
            loading={loading}
            error={error}
            isNew
            hasWholeVenue={hasWholeVenue}
          />
        ) : (
          <button onClick={startAdd}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: "transparent", border: "1px dashed var(--card-border)", color: "var(--muted)" }}>
            <span className="text-base">+</span> הוסף יחידה
          </button>
        )}
      </div>
  );
}

// ── כרטיס יחידה ────────────────────────────────────────────────

function UnitCard({ unit, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: {
  unit: Unit;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-2xl px-4 py-4"
      style={{
        background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
        border: `1px solid ${unit.is_whole_venue ? "rgba(229,175,92,0.4)" : "var(--card-border)"}`,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
      }}>
      {/* שורה עליונה */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{unit.name}</p>
          {unit.is_whole_venue && (
            <span className="text-xs" style={{ color: "var(--amber)" }}>כל המתחם</span>
          )}
        </div>
        {/* כפתורי סדר */}
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst}
            className="w-6 h-6 rounded flex items-center justify-center text-xs"
            style={{ color: isFirst ? "var(--card-border)" : "var(--muted)", background: "transparent" }}>▲</button>
          <button onClick={onMoveDown} disabled={isLast}
            className="w-6 h-6 rounded flex items-center justify-center text-xs"
            style={{ color: isLast ? "var(--card-border)" : "var(--muted)", background: "transparent" }}>▼</button>
        </div>
        {/* ערוך / מחק */}
        <button onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}
          title="ערוך">
          <EditIcon />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: "#ef4444" }}
          title="מחק">
          <TrashIcon />
        </button>
      </div>

      {/* פרטים */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {unit.beds_count} מיטות · מקס׳ {unit.max_mattresses} מזרונים
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        <PriceTag label='אמצ"ש' price={unit.weekday_price} />
        <PriceTag label='סופ"ש' price={unit.weekend_price} />
        <PriceTag label="שיא" price={unit.peak_price} />
      </div>
    </div>
  );
}

function PriceTag({ label, price }: { label: string; price: number }) {
  return (
    <span className="text-xs" style={{ color: price > 0 ? "var(--foreground)" : "var(--muted)" }}>
      {label}: {price > 0 ? `₪${price}` : "—"}
    </span>
  );
}

// ── טופס יחידה ──────────────────────────────────────────────────

function UnitForm({ form, onChange, onSave, onCancel, loading, error, isNew, hasWholeVenue }: {
  form: typeof EMPTY_FORM;
  onChange: (field: keyof typeof EMPTY_FORM, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  isNew?: boolean;
  hasWholeVenue: boolean;
}) {
  return (
    <div className="rounded-2xl px-4 py-4 flex flex-col gap-3"
      style={{
        background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
        border: "1px solid var(--amber)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>
      <p className="text-sm font-semibold" style={{ color: "var(--amber)" }}>
        {isNew ? "יחידה חדשה" : "עריכת יחידה"}
      </p>

      <FormField label="שם היחידה" required>
        <input type="text" value={form.name} onChange={(e) => onChange("name", e.target.value)}
          placeholder="שם היחידה" className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
      </FormField>

      <FormField label="תיאור">
        <input type="text" value={form.description} onChange={(e) => onChange("description", e.target.value)}
          placeholder="תיאור קצר (אופציונלי)" className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="מס׳ מיטות">
          <input type="number" min="0" value={form.beds_count} onChange={(e) => onChange("beds_count", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
        </FormField>
        <FormField label="מקס׳ מזרונים">
          <input type="number" min="0" value={form.max_mattresses} onChange={(e) => onChange("max_mattresses", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FormField label='מחיר אמצ"ש'>
          <div className="relative">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
            <input type="number" min="0" value={form.weekday_price} onChange={(e) => onChange("weekday_price", e.target.value)}
              className="w-full pr-5 pl-2 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
        </FormField>
        <FormField label='מחיר סופ"ש'>
          <div className="relative">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
            <input type="number" min="0" value={form.weekend_price} onChange={(e) => onChange("weekend_price", e.target.value)}
              className="w-full pr-5 pl-2 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
        </FormField>
        <FormField label="מחיר שיא">
          <div className="relative">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
            <input type="number" min="0" value={form.peak_price} onChange={(e) => onChange("peak_price", e.target.value)}
              className="w-full pr-5 pl-2 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
        </FormField>
      </div>

      {!hasWholeVenue && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_whole_venue}
            onChange={(e) => onChange("is_whole_venue", e.target.checked)}
            className="w-5 h-5" style={{ accentColor: "var(--amber)" }} />
          <div>
            <p className="text-sm">כל המתחם</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>אפשרות שכוללת את כלל היחידות</p>
          </div>
        </label>
      )}

      {error && (
        <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={onSave} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity"
          style={{ background: "var(--amber)", color: "#1a1000", opacity: loading ? 0.6 : 1 }}>
          {loading ? "שומר..." : "שמור"}
        </button>
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--card-border)", color: "var(--foreground)" }}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--amber)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
