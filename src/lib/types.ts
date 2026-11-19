/** 曜日。1＝月 … 5＝金（Date#getDay() と同じ数） */
export type Weekday = 1 | 2 | 3 | 4 | 5;

/** 時限。1〜6限 */
export type Period = 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5];
export const PERIODS: readonly Period[] = [1, 2, 3, 4, 5, 6];

/** 欠席の上限。回数か時間数のどちらか */
export type Limit =
  | { kind: "count"; max: number }
  | { kind: "hours"; maxHours: number; hoursPerClass: number };

export type Course = {
  id: string;
  name: string;
  weekday: Weekday;
  period: Period;
  limit: Limit;
  /** 遅刻・早退が何回で欠席1回か（2〜20）。無い＝換算しない */
  latesPerAbsence?: number;
};

export const LATES_PER_ABSENCE_MIN = 2;
export const LATES_PER_ABSENCE_MAX = 20;

export type Absence = {
  id: string;
  courseId: string;
  /** YYYY-MM-DD */
  date: string;
};

export type LateKind = "late" | "early";

export type Late = {
  id: string;
  courseId: string;
  /** YYYY-MM-DD */
  date: string;
  kind: LateKind;
};

export type AppData = {
  version: 1;
  courses: Course[];
  absences: Absence[];
  lates: Late[];
};

export const EMPTY_DATA: AppData = { version: 1, courses: [], absences: [], lates: [] };
