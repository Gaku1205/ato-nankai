import { describe, expect, it } from "vitest";
import { statusOf } from "./remaining";
import { carryOverTerm } from "./term";
import type { AppData } from "./types";

const data: AppData = {
  version: 1,
  courses: [
    { id: "c1", name: "英語コミュニケーション", weekday: 2, period: 2, limit: { kind: "count", max: 3 } },
    { id: "c2", name: "ビジネスマナー", weekday: 4, period: 4, limit: { kind: "hours", maxHours: 4.5, hoursPerClass: 1.5 } },
  ],
  absences: [
    { id: "a1", courseId: "c1", date: "2026-11-10" },
    { id: "a2", courseId: "c1", date: "2026-11-17" },
    { id: "a3", courseId: "c2", date: "2026-11-12" },
  ],
  lates: [{ id: "l1", courseId: "c1", date: "2026-11-11", kind: "late" }],
};

describe("carryOverTerm", () => {
  it("授業は残り、欠席・遅刻・早退の記録は空になる", () => {
    const next = carryOverTerm(data);
    expect(next.courses).toEqual(data.courses);
    expect(next.absences).toEqual([]);
    expect(next.lates).toEqual([]);
    expect(next.version).toBe(1);
  });

  it("残り回数は上限に戻る", () => {
    const next = carryOverTerm(data);
    expect(statusOf(next.courses[0], next.absences, next.lates).remaining.count).toBe(3);
    expect(statusOf(next.courses[1], next.absences, next.lates).remaining.count).toBe(3);
  });

  it("元のデータは変えない", () => {
    carryOverTerm(data);
    expect(data.absences).toHaveLength(3);
  });
});
