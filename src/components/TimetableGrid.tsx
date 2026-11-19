"use client";

import Link from "next/link";
import { useState } from "react";
import { statusOf, weekdayName, weekdayOf } from "@/lib/remaining";
import { deleteCourse, newId, upsertCourse } from "@/lib/storage";
import { PERIODS, WEEKDAYS, type Course, type Period, type Weekday } from "@/lib/types";
import { useAppData, useIsClient } from "@/lib/useAppData";
import { CourseEditor } from "./CourseEditor";

type Slot = { weekday: Weekday; period: Period };

export function TimetableGrid() {
  const [data, update] = useAppData();
  const isClient = useIsClient();
  const [editing, setEditing] = useState<Slot | null>(null);

  const todayWd = isClient ? weekdayOf(new Date()) : null;
  const courseAt = (wd: Weekday, p: Period): Course | null =>
    data?.courses.find((c) => c.weekday === wd && c.period === p) ?? null;

  const editingCourse = editing ? courseAt(editing.weekday, editing.period) : null;

  return (
    <main className="page page-timetable">
      <header className="topbar">
        <h1 className="topbar-title">時間割</h1>
        <Link href="/" className="link">
          今日
        </Link>
      </header>
      <p className="hint">マスを押して授業を入れます。数字はあと何回休めるか</p>

      <div className="grid" aria-label="時間割">
        <div className="grid-row">
          <span className="grid-corner" aria-hidden="true" />
          {WEEKDAYS.map((wd) => (
            <span
              key={wd}
              className={`grid-day${wd === todayWd ? " is-today" : ""}`}
              aria-current={wd === todayWd ? "date" : undefined}
            >
              {weekdayName(wd)}
            </span>
          ))}
        </div>
        {PERIODS.map((p) => (
          <div className="grid-row" key={p}>
            <span className="grid-period" aria-hidden="true">
              {p}
            </span>
            {WEEKDAYS.map((wd) => {
              const c = courseAt(wd, p);
              const label = `${weekdayName(wd)}曜 ${p}限`;
              if (!c || !data) {
                return (
                  <button
                    key={wd}
                    type="button"
                    className="cell cell-empty"
                    aria-label={`${label}（空き）に授業を入れる`}
                    onClick={() => setEditing({ weekday: wd, period: p })}
                    disabled={!data}
                  >
                    ＋
                  </button>
                );
              }
              const s = statusOf(c, data.absences);
              return (
                <button
                  key={wd}
                  type="button"
                  className={`cell tier-${s.tier}`}
                  aria-label={`${label} ${c.name}、あと${s.remaining.count}回。編集する`}
                  onClick={() => setEditing({ weekday: wd, period: p })}
                >
                  <span className="cell-number">{s.remaining.count}</span>
                  <span className="cell-name">{c.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {editing && (
        <CourseEditor
          key={`${editing.weekday}-${editing.period}`}
          weekday={editing.weekday}
          period={editing.period}
          course={editingCourse}
          onClose={() => setEditing(null)}
          onSave={(name, limit) => {
            update((d) =>
              upsertCourse(d, {
                id: editingCourse?.id ?? newId(),
                name,
                weekday: editing.weekday,
                period: editing.period,
                limit,
              }),
            );
            setEditing(null);
          }}
          onDelete={() => {
            if (editingCourse) update((d) => deleteCourse(d, editingCourse.id));
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}
