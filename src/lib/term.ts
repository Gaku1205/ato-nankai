import type { AppData } from "./types";

/** 学期の引き継ぎ。授業（時間割）は残し、欠席・遅刻・早退の記録だけを消す。残り回数は上限に戻る */
export function carryOverTerm(data: AppData): AppData {
  return { ...data, courses: data.courses, absences: [], lates: [] };
}
