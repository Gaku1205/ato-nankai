import { effectiveAbsences } from "./late";
import type { Absence, AppData, Course, Late, Limit, Weekday } from "./types";

export type Remaining = {
  /** あと何回休めるか（0以上） */
  count: number;
  /** 時間数の授業だけ：あと何時間休めるか（0以上） */
  hours?: number;
};

export type Tier = "zero" | "one" | "few" | "safe";

// 0.5刻みの足し引きで出る誤差を吸収するための小さな数
const EPSILON = 1e-9;

export function absenceCount(absences: readonly Absence[], courseId: string): number {
  let n = 0;
  for (const a of absences) if (a.courseId === courseId) n += 1;
  return n;
}

export function remainingFor(limit: Limit, absences: number): Remaining {
  if (limit.kind === "count") {
    return { count: Math.max(0, limit.max - absences) };
  }
  const hours = Math.max(0, limit.maxHours - absences * limit.hoursPerClass);
  const count = limit.hoursPerClass > 0 ? Math.floor(hours / limit.hoursPerClass + EPSILON) : 0;
  return { count, hours: Math.round(hours * 10) / 10 };
}

export function tierOf(count: number): Tier {
  if (count <= 0) return "zero";
  if (count === 1) return "one";
  if (count <= 3) return "few";
  return "safe";
}

export type CourseStatus = {
  course: Course;
  absences: number;
  remaining: Remaining;
  tier: Tier;
};

/** 欠席に、遅刻・早退の換算分を足して残り回数を出す */
export function statusOf(course: Course, absences: readonly Absence[], lates: readonly Late[]): CourseStatus {
  const n = effectiveAbsences(course, absences, lates);
  const remaining = remainingFor(course.limit, n);
  return { course, absences: n, remaining, tier: tierOf(remaining.count) };
}

/** 日付の曜日を Weekday に。土日は null */
export function weekdayOf(date: Date): Weekday | null {
  const d = date.getDay();
  return d >= 1 && d <= 5 ? (d as Weekday) : null;
}

/** 今日の曜日のコマを、残りが少ない順（同じなら時限の早い順）に並べる */
export function todayCourses(data: AppData, today: Date): CourseStatus[] {
  const wd = weekdayOf(today);
  if (wd === null) return [];
  return data.courses
    .filter((c) => c.weekday === wd)
    .map((c) => statusOf(c, data.absences, data.lates))
    .sort((a, b) => a.remaining.count - b.remaining.count || a.course.period - b.course.period);
}

/** 端末の時計の日付を YYYY-MM-DD に */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD を「11月12日（木）」に。形が違えばそのまま返す */
export function formatDateLabel(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${d.getMonth() + 1}月${d.getDate()}日（${dayName(d)}）`;
}

/** 日付の新しい順に並べる（同じ日は元の順を保つ） */
export function newestFirst<T extends { date: string }>(items: readonly T[]): T[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => (a.item.date < b.item.date ? 1 : a.item.date > b.item.date ? -1 : a.i - b.i))
    .map((x) => x.item);
}

const DAY_NAMES =["日", "月", "火", "水", "木", "金", "土"] as const;

export function dayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function weekdayName(wd: Weekday): string {
  return DAY_NAMES[wd];
}

/** 時間の表記：小数1桁まで、小数が0なら付けない */
export function formatHours(h: number): string {
  const r = Math.round(h * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
