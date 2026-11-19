import { EMPTY_DATA, type Absence, type AppData, type Course, type Limit, type Period, type Weekday } from "./types";

export const STORAGE_KEY = "ato-nankai:v1";

/** localStorage と同じ形の、読み書きできる入れ物（テストで差し替える） */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function parseLimit(v: unknown): Limit | null {
  if (!isObject(v)) return null;
  if (v.kind === "count" && isFiniteNumber(v.max) && Number.isInteger(v.max) && v.max >= 0 && v.max <= 99) {
    return { kind: "count", max: v.max };
  }
  if (
    v.kind === "hours" &&
    isFiniteNumber(v.maxHours) &&
    isFiniteNumber(v.hoursPerClass) &&
    v.maxHours >= 0 &&
    v.maxHours <= 999 &&
    v.hoursPerClass >= 0.5 &&
    v.hoursPerClass <= 12
  ) {
    return { kind: "hours", maxHours: v.maxHours, hoursPerClass: v.hoursPerClass };
  }
  return null;
}

function parseCourse(v: unknown): Course | null {
  if (!isObject(v)) return null;
  const { id, name, weekday, period } = v;
  if (typeof id !== "string" || id === "") return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (!isFiniteNumber(weekday) || !Number.isInteger(weekday) || weekday < 1 || weekday > 5) return null;
  if (!isFiniteNumber(period) || !Number.isInteger(period) || period < 1 || period > 6) return null;
  const limit = parseLimit(v.limit);
  if (!limit) return null;
  return { id, name: name.trim(), weekday: weekday as Weekday, period: period as Period, limit };
}

function parseAbsence(v: unknown): Absence | null {
  if (!isObject(v)) return null;
  const { id, courseId, date } = v;
  if (typeof id !== "string" || id === "") return null;
  if (typeof courseId !== "string" || courseId === "") return null;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { id, courseId, date };
}

/** 保存された文字列を読む。壊れていれば空として扱う */
export function parseData(raw: string | null): AppData {
  if (raw === null) return EMPTY_DATA;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return EMPTY_DATA;
  }
  if (!isObject(json) || json.version !== 1) return EMPTY_DATA;
  if (!Array.isArray(json.courses) || !Array.isArray(json.absences)) return EMPTY_DATA;
  const courses: Course[] = [];
  const slots = new Set<string>();
  for (const c of json.courses) {
    const course = parseCourse(c);
    if (!course) continue;
    const slot = `${course.weekday}-${course.period}`;
    if (slots.has(slot)) continue;
    slots.add(slot);
    courses.push(course);
  }
  const ids = new Set(courses.map((c) => c.id));
  const absences: Absence[] = [];
  for (const a of json.absences) {
    const absence = parseAbsence(a);
    if (absence && ids.has(absence.courseId)) absences.push(absence);
  }
  return { version: 1, courses, absences };
}

export function loadData(store: KeyValueStore): AppData {
  try {
    return parseData(store.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_DATA;
  }
}

export function saveData(store: KeyValueStore, data: AppData): void {
  store.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ここから下は、データを変える関数（元のデータは変えず、新しいデータを返す）

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 授業を保存する。同じマス（曜日×時限）の授業は上書きする */
export function upsertCourse(data: AppData, course: Course): AppData {
  const replaced = data.courses.filter(
    (c) => c.id !== course.id && c.weekday === course.weekday && c.period === course.period,
  );
  const removedIds = new Set(replaced.map((c) => c.id));
  const others = data.courses.filter((c) => c.id !== course.id && !removedIds.has(c.id));
  return {
    ...data,
    courses: [...others, course],
    absences: data.absences.filter((a) => !removedIds.has(a.courseId)),
  };
}

/** 授業を消す。その授業の欠席の記録も消す */
export function deleteCourse(data: AppData, courseId: string): AppData {
  return {
    ...data,
    courses: data.courses.filter((c) => c.id !== courseId),
    absences: data.absences.filter((a) => a.courseId !== courseId),
  };
}

export function addAbsence(data: AppData, absence: Absence): AppData {
  return { ...data, absences: [...data.absences, absence] };
}

export function removeAbsence(data: AppData, absenceId: string): AppData {
  return { ...data, absences: data.absences.filter((a) => a.id !== absenceId) };
}
