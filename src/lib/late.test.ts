import { describe, expect, it } from "vitest";
import { convertedAbsences, effectiveAbsences, lateCount } from "./late";
import { statusOf } from "./remaining";
import type { Absence, Course, Late } from "./types";

const lt = (id: string, courseId: string, kind: Late["kind"] = "late"): Late => ({ id, courseId, date: "2026-11-12", kind });
const ab = (id: string, courseId: string): Absence => ({ id, courseId, date: "2026-11-12" });

describe("convertedAbsences", () => {
  it("未設定なら換算しない", () => {
    expect(convertedAbsences(5, undefined)).toBe(0);
  });
  it("端数は切り捨てる（3回で1回）", () => {
    expect(convertedAbsences(2, 3)).toBe(0);
    expect(convertedAbsences(3, 3)).toBe(1);
    expect(convertedAbsences(5, 3)).toBe(1);
    expect(convertedAbsences(6, 3)).toBe(2);
  });
});

describe("effectiveAbsences", () => {
  const base = { id: "a" };
  it("遅刻と早退を合算して換算する", () => {
    const lates = [lt("1", "a"), lt("2", "a", "early"), lt("3", "a", "early")];
    expect(effectiveAbsences({ ...base, latesPerAbsence: 3 }, [], lates)).toBe(1);
    expect(effectiveAbsences({ ...base, latesPerAbsence: 4 }, [], lates)).toBe(0);
  });
  it("欠席の件数に足す。ほかの授業は数えない", () => {
    const lates = [lt("1", "a"), lt("2", "a"), lt("3", "b")];
    expect(effectiveAbsences({ ...base, latesPerAbsence: 2 }, [ab("x", "a"), ab("y", "b")], lates)).toBe(2);
  });
  it("未設定なら遅刻は入らない", () => {
    expect(effectiveAbsences(base, [ab("x", "a")], [lt("1", "a"), lt("2", "a")])).toBe(1);
  });
  it("lateCount はその授業の件数", () => {
    expect(lateCount([lt("1", "a"), lt("2", "b")], "a")).toBe(1);
  });
});

describe("statusOf と換算", () => {
  it("回数の授業：換算した分だけ残りが減る", () => {
    const c: Course = { id: "a", name: "A", weekday: 1, period: 1, limit: { kind: "count", max: 4 }, latesPerAbsence: 3 };
    const s = statusOf(c, [ab("1", "a")], [lt("1", "a"), lt("2", "a"), lt("3", "a", "early")]);
    expect(s.absences).toBe(2);
    expect(s.remaining.count).toBe(2);
  });
  it("時間数の授業：換算した分に1回の時間をかける", () => {
    const c: Course = {
      id: "b",
      name: "B",
      weekday: 1,
      period: 2,
      limit: { kind: "hours", maxHours: 6, hoursPerClass: 1.5 },
      latesPerAbsence: 2,
    };
    const s = statusOf(c, [], [lt("1", "b"), lt("2", "b"), lt("3", "b")]);
    expect(s.absences).toBe(1);
    expect(s.remaining).toEqual({ count: 3, hours: 4.5 });
  });
  it("未設定なら遅刻は残りに入らない", () => {
    const c: Course = { id: "c", name: "C", weekday: 1, period: 3, limit: { kind: "count", max: 4 } };
    expect(statusOf(c, [], [lt("1", "c"), lt("2", "c")]).remaining.count).toBe(4);
  });
});
