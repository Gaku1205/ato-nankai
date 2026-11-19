import { parseAbsence, parseCourse, parseLate } from "./storage";
import type { Absence, AppData, Course, Late } from "./types";

export type ParseBackupResult = { ok: true; data: AppData } | { ok: false; error: string };

const NOT_BACKUP = "あと何回休める？の書き出しファイルではありません";

/** 書き出すファイルの中身（保存形式そのまま） */
export function serializeBackup(data: AppData): string {
  return JSON.stringify({ version: 1, courses: data.courses, absences: data.absences, lates: data.lates }, null, 2);
}

/** 書き出すファイルの名前：ato-nankai-YYYY-MM-DD.json（端末の日付） */
export function backupFileName(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ato-nankai-${y}-${m}-${d}.json`;
}

function fail(error: string): ParseBackupResult {
  return { ok: false, error };
}

/**
 * 読み込むファイルの中身を調べる。
 * 1件でも形が違えば、まるごと受け付けない（今のデータは変えない）。
 */
export function parseBackup(text: string): ParseBackupResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail("JSONのファイルではありません");
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) return fail(NOT_BACKUP);
  const obj = json as Record<string, unknown>;
  if (obj.version !== 1) return fail(`${NOT_BACKUP}（versionが1ではありません）`);
  if (!Array.isArray(obj.courses) || !Array.isArray(obj.absences)) {
    return fail("授業か欠席の記録の形が違います");
  }

  const courses: Course[] = [];
  const courseIds = new Set<string>();
  const slots = new Set<string>();
  for (let i = 0; i < obj.courses.length; i++) {
    const course = parseCourse(obj.courses[i]);
    if (!course) return fail(`授業の${i + 1}件目の形が違います`);
    if (courseIds.has(course.id)) return fail("授業のidが重なっています");
    const slot = `${course.weekday}-${course.period}`;
    if (slots.has(slot)) return fail("同じ曜日・時限に授業が2つあります");
    courseIds.add(course.id);
    slots.add(slot);
    courses.push(course);
  }

  const absences: Absence[] = [];
  const absenceIds = new Set<string>();
  for (let i = 0; i < obj.absences.length; i++) {
    const absence = parseAbsence(obj.absences[i]);
    if (!absence) return fail(`欠席の記録の${i + 1}件目の形が違います`);
    if (absenceIds.has(absence.id)) return fail("欠席の記録のidが重なっています");
    if (!courseIds.has(absence.courseId)) return fail("授業が見つからない欠席の記録があります");
    absenceIds.add(absence.id);
    absences.push(absence);
  }

  // lates が無いファイル（遅刻・早退を入れる前の書き出し）は空として読む
  const lates: Late[] = [];
  if (obj.lates !== undefined) {
    if (!Array.isArray(obj.lates)) return fail("遅刻・早退の記録の形が違います");
    const lateIds = new Set<string>();
    for (let i = 0; i < obj.lates.length; i++) {
      const late = parseLate(obj.lates[i]);
      if (!late) return fail(`遅刻・早退の記録の${i + 1}件目の形が違います`);
      if (lateIds.has(late.id)) return fail("遅刻・早退の記録のidが重なっています");
      if (!courseIds.has(late.courseId)) return fail("授業が見つからない遅刻・早退の記録があります");
      lateIds.add(late.id);
      lates.push(late);
    }
  }

  return { ok: true, data: { version: 1, courses, absences, lates } };
}
