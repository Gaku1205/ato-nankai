import { describe, expect, it } from "vitest";
import {
  dayName,
  formatHours,
  remainingFor,
  statusOf,
  tierOf,
  toDateString,
  todayCourses,
  weekdayOf,
} from "./remaining";
import type { AppData, Course } from "./types";

const course = (id: string, weekday: Course["weekday"], period: Course["period"], limit: Course["limit"], name = id): Course => ({
  id,
  name,
  weekday,
  period,
  limit,
});

describe("remainingFor（回数）", () => {
  it("上限 − 欠席数", () => {
    expect(remainingFor({ kind: "count", max: 4 }, 0)).toEqual({ count: 4 });
    expect(remainingFor({ kind: "count", max: 4 }, 3)).toEqual({ count: 1 });
  });
  it("0より小さくならない", () => {
    expect(remainingFor({ kind: "count", max: 4 }, 4)).toEqual({ count: 0 });
    expect(remainingFor({ kind: "count", max: 4 }, 7)).toEqual({ count: 0 });
  });
});

describe("remainingFor（時間数）", () => {
  it("残り時間を1回の時間で割って切り捨てる", () => {
    expect(remainingFor({ kind: "hours", maxHours: 6, hoursPerClass: 1.5 }, 1)).toEqual({ count: 3, hours: 4.5 });
    expect(remainingFor({ kind: "hours", maxHours: 5, hoursPerClass: 1.5 }, 0)).toEqual({ count: 3, hours: 5 });
  });
  it("割り切れるときに誤差で1回減らない", () => {
    expect(remainingFor({ kind: "hours", maxHours: 4.5, hoursPerClass: 1.5 }, 0).count).toBe(3);
    expect(remainingFor({ kind: "hours", maxHours: 0.3 * 3, hoursPerClass: 0.3 }, 0).count).toBe(3);
  });
  it("0より小さくならない", () => {
    expect(remainingFor({ kind: "hours", maxHours: 3, hoursPerClass: 1.5 }, 3)).toEqual({ count: 0, hours: 0 });
  });
});

describe("tierOf", () => {
  it("0・1・2〜3・4以上で段が分かれる", () => {
    expect(tierOf(0)).toBe("zero");
    expect(tierOf(1)).toBe("one");
    expect(tierOf(2)).toBe("few");
    expect(tierOf(3)).toBe("few");
    expect(tierOf(4)).toBe("safe");
    expect(tierOf(12)).toBe("safe");
  });
});

describe("statusOf", () => {
  it("その授業の欠席だけを数える", () => {
    const c = course("a", 4, 2, { kind: "count", max: 4 });
    const s = statusOf(c, [
      { id: "1", courseId: "a", date: "2026-11-12" },
      { id: "2", courseId: "b", date: "2026-11-12" },
      { id: "3", courseId: "a", date: "2026-11-19" },
    ]);
    expect(s.absences).toBe(2);
    expect(s.remaining.count).toBe(2);
    expect(s.tier).toBe("few");
  });
});

describe("todayCourses", () => {
  // 2026-11-19 は木曜
  const thursday = new Date(2026, 10, 19, 8, 0);
  const data: AppData = {
    version: 1,
    courses: [
      course("mkt", 4, 2, { kind: "count", max: 4 }),
      course("prog", 4, 3, { kind: "count", max: 5 }),
      course("manner", 4, 4, { kind: "hours", maxHours: 4.5, hoursPerClass: 1.5 }),
      course("eng", 2, 2, { kind: "count", max: 0 }),
    ],
    absences: [
      { id: "1", courseId: "prog", date: "2026-11-12" },
      { id: "2", courseId: "prog", date: "2026-11-05" },
      { id: "3", courseId: "prog", date: "2026-10-29" },
    ],
  };

  it("今日の曜日のコマだけを、残りが少ない順に並べる", () => {
    const list = todayCourses(data, thursday);
    expect(list.map((s) => s.course.id)).toEqual(["prog", "manner", "mkt"]);
    expect(list.map((s) => s.remaining.count)).toEqual([2, 3, 4]);
  });

  it("残りが同じなら時限の早い順", () => {
    const tie: AppData = {
      ...data,
      courses: [course("p4", 4, 4, { kind: "count", max: 2 }), course("p1", 4, 1, { kind: "count", max: 2 })],
      absences: [],
    };
    expect(todayCourses(tie, thursday).map((s) => s.course.id)).toEqual(["p1", "p4"]);
  });

  it("土日は空", () => {
    expect(todayCourses(data, new Date(2026, 10, 21))).toEqual([]);
    expect(todayCourses(data, new Date(2026, 10, 22))).toEqual([]);
  });
});

describe("日付と表記", () => {
  it("weekdayOf は月〜金を1〜5、土日を null に", () => {
    expect(weekdayOf(new Date(2026, 10, 16))).toBe(1);
    expect(weekdayOf(new Date(2026, 10, 20))).toBe(5);
    expect(weekdayOf(new Date(2026, 10, 21))).toBeNull();
  });
  it("toDateString は端末の日付を YYYY-MM-DD に", () => {
    expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("dayName", () => {
    expect(dayName(new Date(2026, 10, 19))).toBe("木");
  });
  it("formatHours は小数1桁まで、整数なら小数を付けない", () => {
    expect(formatHours(6)).toBe("6");
    expect(formatHours(4.5)).toBe("4.5");
    expect(formatHours(0.30000000000000004)).toBe("0.3");
  });
});
