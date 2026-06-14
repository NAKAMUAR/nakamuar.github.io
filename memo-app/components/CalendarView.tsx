"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EventEditor } from "@/components/EventEditor";
import { eventColor } from "@/lib/constants";
import {
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  buildMonthGrid,
  eventOnDay,
  formatDayTitle,
  formatMonthTitle,
  formatTime,
  isSameDay,
  isToday,
  startOfDay,
} from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types";

const MAX_CHIPS = 3;

export function CalendarView({ userId }: { userId: string }) {
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{
    event: Event | null;
    day: Date;
  } | null>(null);

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const rangeStart = grid[0];
    const rangeEnd = addDays(grid[grid.length - 1], 1);
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .lt("starts_at", rangeEnd.toISOString())
      .gte("ends_at", rangeStart.toISOString())
      .order("starts_at", { ascending: true });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }, [grid]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const eventsForDay = useCallback(
    (day: Date) =>
      events.filter((e) =>
        eventOnDay(
          new Date(e.starts_at),
          new Date(e.ends_at),
          day,
          e.all_day,
        ),
      ),
    [events],
  );

  const selectedEvents = useMemo(
    () =>
      eventsForDay(selectedDay).sort((a, b) => {
        if (a.all_day !== b.all_day) return a.all_day ? -1 : 1;
        return a.starts_at.localeCompare(b.starts_at);
      }),
    [eventsForDay, selectedDay],
  );

  function openNew(day: Date) {
    setEditing({ event: null, day });
  }

  function openEdit(event: Event) {
    setEditing({ event, day: new Date(event.starts_at) });
  }

  async function handleSaved() {
    setEditing(null);
    await loadEvents();
  }

  const monthIndex = monthAnchor.getMonth();

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          {formatMonthTitle(monthAnchor)}
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            aria-label="前の月"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setMonthAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(startOfDay(now));
            }}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            aria-label="次の月"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-neutral-200 text-center text-xs font-medium text-neutral-500">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={`py-2 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-x border-b border-neutral-200">
        {grid.map((day) => {
          const dayEvents = eventsForDay(day);
          const inMonth = day.getMonth() === monthIndex;
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);
          const weekday = day.getDay();

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(startOfDay(day))}
              onDoubleClick={() => openNew(startOfDay(day))}
              className={`min-h-[84px] border-b border-r border-neutral-100 p-1 text-left align-top transition last:border-r-0 ${
                inMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"
              } ${selected ? "ring-2 ring-inset ring-neutral-900" : ""}`}
            >
              <div className="flex justify-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? "bg-red-500 font-semibold text-white"
                      : inMonth
                        ? weekday === 0
                          ? "text-red-500"
                          : weekday === 6
                            ? "text-blue-500"
                            : "text-neutral-800"
                        : ""
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, MAX_CHIPS).map((e) => {
                  const c = eventColor(e.color);
                  return (
                    <div
                      key={e.id}
                      className={`truncate rounded px-1 py-px text-[10px] leading-tight ${c.chip}`}
                      title={e.title || "(無題)"}
                    >
                      {!e.all_day && (
                        <span className="mr-0.5 tabular-nums">
                          {formatTime(e.starts_at)}
                        </span>
                      )}
                      {e.title || "(無題)"}
                    </div>
                  );
                })}
                {dayEvents.length > MAX_CHIPS && (
                  <div className="px-1 text-[10px] text-neutral-400">
                    他 {dayEvents.length - MAX_CHIPS} 件
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">
            {formatDayTitle(selectedDay)}
          </h2>
          <button
            type="button"
            onClick={() => openNew(selectedDay)}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            ＋ 予定を追加
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-neutral-400">読み込み中…</p>
        ) : selectedEvents.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            予定はありません。
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => {
              const c = eventColor(e.color);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition hover:bg-neutral-50"
                  >
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900">
                        {e.title || "(無題)"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {e.all_day
                          ? "終日"
                          : `${formatTime(e.starts_at)} – ${formatTime(e.ends_at)}`}
                        {e.location ? ` ・ ${e.location}` : ""}
                      </p>
                      {e.notes && (
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-neutral-500">
                          {e.notes}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <EventEditor
          userId={userId}
          event={editing.event}
          defaultDay={editing.day}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
