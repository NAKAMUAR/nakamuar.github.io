"use client";

import { useState } from "react";

import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLORS,
  type EventColorKey,
} from "@/lib/constants";
import {
  parseLocalValue,
  startOfDay,
  toDateTimeLocalValue,
} from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types";

/** Sensible default start time when creating from a day cell. */
function defaultStart(day: Date): Date {
  const now = new Date();
  const base = startOfDay(day);
  // If creating on today, start at the next full hour; otherwise 9:00.
  if (startOfDay(now).getTime() === base.getTime()) {
    base.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    base.setHours(9, 0, 0, 0);
  }
  return base;
}

export function EventEditor({
  userId,
  event,
  defaultDay,
  onClose,
  onSaved,
}: {
  userId: string;
  event: Event | null;
  defaultDay: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialStart = event ? new Date(event.starts_at) : defaultStart(defaultDay);
  const initialEnd = event
    ? new Date(event.ends_at)
    : new Date(initialStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(event?.title ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startStr, setStartStr] = useState(toDateTimeLocalValue(initialStart));
  const [endStr, setEndStr] = useState(toDateTimeLocalValue(initialEnd));
  const [color, setColor] = useState<EventColorKey>(
    (event?.color as EventColorKey) ?? DEFAULT_EVENT_COLOR,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setStartDateOnly(date: string) {
    setStartStr(`${date}T00:00`);
  }
  function setEndDateOnly(date: string) {
    setEndStr(`${date}T00:00`);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const start = parseLocalValue(startStr);
    let end = parseLocalValue(endStr);

    let startsAt: Date;
    let endsAt: Date;
    if (allDay) {
      startsAt = startOfDay(start);
      const endDay = startOfDay(end);
      // All-day end is the last day, inclusive → store at 23:59 local.
      endsAt = new Date(
        Math.max(endDay.getTime(), startsAt.getTime()),
      );
      endsAt.setHours(23, 59, 0, 0);
    } else {
      startsAt = start;
      if (end.getTime() < start.getTime()) end = start;
      endsAt = end;
    }

    const supabase = createClient();
    const payload = {
      user_id: userId,
      title: title.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      all_day: allDay,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      color,
    };

    const { error } = event
      ? await supabase.from("events").update(payload).eq("id", event.id)
      : await supabase.from("events").insert(payload);

    if (error) {
      setError("保存に失敗しました");
      setSaving(false);
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!event) return;
    if (!confirm("この予定を削除しますか？")) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);
    if (error) {
      setError("削除に失敗しました");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {event ? "予定を編集" : "新しい予定"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
          >
            閉じる
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            autoFocus
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="場所"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />

          <label className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <span>終日</span>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-neutral-900"
            />
          </label>

          <div className="grid grid-cols-[auto,1fr] items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-neutral-500">開始</span>
            {allDay ? (
              <input
                type="date"
                value={startStr.slice(0, 10)}
                onChange={(e) => setStartDateOnly(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
              />
            ) : (
              <input
                type="datetime-local"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
              />
            )}

            <span className="text-neutral-500">終了</span>
            {allDay ? (
              <input
                type="date"
                value={endStr.slice(0, 10)}
                onChange={(e) => setEndDateOnly(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
              />
            ) : (
              <input
                type="datetime-local"
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">カラー</span>
            <div className="flex gap-1.5">
              {(Object.keys(EVENT_COLORS) as EventColorKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={EVENT_COLORS[key].label}
                  onClick={() => setColor(key)}
                  className={`h-6 w-6 rounded-full ${EVENT_COLORS[key].dot} ${
                    color === key
                      ? `ring-2 ring-offset-1 ${EVENT_COLORS[key].ring}`
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="メモ"
            rows={3}
            className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存"}
            </button>
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
