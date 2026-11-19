import type { Absence, Course, Late } from "./types";

export function lateCount(lates: readonly Late[], courseId: string): number {
  let n = 0;
  for (const l of lates) if (l.courseId === courseId) n += 1;
  return n;
}

/** 遅刻・早退の合計件数を、欠席何回分に換算するか（切り捨て）。未設定なら 0 */
export function convertedAbsences(lateTotal: number, latesPerAbsence: number | undefined): number {
  if (latesPerAbsence === undefined || latesPerAbsence < 2) return 0;
  return Math.floor(lateTotal / latesPerAbsence);
}

/** 換算後の欠席数 ＝ 欠席の件数 ＋ 遅刻・早退の換算分 */
export function effectiveAbsences(
  course: Pick<Course, "id" | "latesPerAbsence">,
  absences: readonly Absence[],
  lates: readonly Late[],
): number {
  let n = 0;
  for (const a of absences) if (a.courseId === course.id) n += 1;
  return n + convertedAbsences(lateCount(lates, course.id), course.latesPerAbsence);
}
