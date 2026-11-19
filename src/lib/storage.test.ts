import { describe, expect, it } from "vitest";
import {
  addAbsence,
  addLate,
  deleteCourse,
  loadData,
  parseData,
  removeAbsence,
  removeLate,
  saveData,
  setLatesPerAbsence,
  STORAGE_KEY,
  upsertCourse,
  type KeyValueStore,
} from "./storage";
import { EMPTY_DATA, type AppData, type Course } from "./types";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { items: Record<string, string> } {
  const items = { ...initial };
  return {
    items,
    getItem: (k) => (k in items ? items[k] : null),
    setItem: (k, v) => {
      items[k] = v;
    },
  };
}

const mkt: Course = { id: "mkt", name: "マーケティング論", weekday: 4, period: 2, limit: { kind: "count", max: 4 } };
const boki: Course = {
  id: "boki",
  name: "簿記演習",
  weekday: 1,
  period: 3,
  limit: { kind: "hours", maxHours: 6, hoursPerClass: 1.5 },
};

const sample: AppData = {
  version: 1,
  courses: [mkt, boki],
  absences: [{ id: "a1", courseId: "mkt", date: "2026-11-12" }],
  lates: [{ id: "l1", courseId: "mkt", date: "2026-11-05", kind: "late" }],
};

describe("保存と読み込み", () => {
  it("lates が無い保存データでも、授業と欠席は消えず、遅刻は空になる", () => {
    const raw = JSON.stringify({ version: 1, courses: [mkt, boki], absences: sample.absences });
    expect(parseData(raw)).toEqual({ version: 1, courses: [mkt, boki], absences: sample.absences, lates: [] });
  });

  it("latesPerAbsence は 2〜20 の整数だけ読み、それ以外は未設定にする", () => {
    const read = (v: unknown) =>
      parseData(JSON.stringify({ version: 1, courses: [{ ...mkt, latesPerAbsence: v }], absences: [] })).courses[0];
    expect(read(3).latesPerAbsence).toBe(3);
    expect(read(20).latesPerAbsence).toBe(20);
    for (const bad of [1, 21, 2.5, "3", null]) expect(read(bad).latesPerAbsence).toBeUndefined();
  });

  it("形の違う遅刻・早退の1件だけを捨てる", () => {
    const raw = JSON.stringify({
      version: 1,
      courses: [mkt],
      absences: [],
      lates: [
        { id: "l1", courseId: "mkt", date: "2026-11-05", kind: "early" },
        { id: "l2", courseId: "mkt", date: "2026-11-05", kind: "other" },
        { id: "l3", courseId: "nothing", date: "2026-11-05", kind: "late" },
      ],
    });
    expect(parseData(raw).lates).toEqual([{ id: "l1", courseId: "mkt", date: "2026-11-05", kind: "early" }]);
  });

  it("書いた物がそのまま読める", () => {
    const store = memoryStore();
    saveData(store, sample);
    expect(store.items[STORAGE_KEY]).toBeDefined();
    expect(loadData(store)).toEqual(sample);
  });

  it("値が無ければ空", () => {
    expect(loadData(memoryStore())).toEqual(EMPTY_DATA);
  });

  it("壊れた値は空として扱う", () => {
    expect(parseData("{not json")).toEqual(EMPTY_DATA);
    expect(parseData("null")).toEqual(EMPTY_DATA);
    expect(parseData("[]")).toEqual(EMPTY_DATA);
    expect(parseData(JSON.stringify({ version: 2, courses: [], absences: [] }))).toEqual(EMPTY_DATA);
    expect(parseData(JSON.stringify({ version: 1, courses: "x", absences: [] }))).toEqual(EMPTY_DATA);
  });

  it("読むときに例外が出ても空", () => {
    const store: KeyValueStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
    };
    expect(loadData(store)).toEqual(EMPTY_DATA);
  });

  it("形の違う1件だけを捨てる", () => {
    const raw = JSON.stringify({
      version: 1,
      courses: [
        mkt,
        { ...boki, id: "bad1", weekday: 6, period: 1 },
        { ...boki, id: "bad2", period: 4, limit: { kind: "count", max: -1 } },
        { ...boki, id: "bad3", period: 5, name: "  " },
      ],
      absences: [
        { id: "a1", courseId: "mkt", date: "2026-11-12" },
        { id: "a2", courseId: "mkt", date: "11/19" },
        { id: "a3", courseId: "nothing", date: "2026-11-12" },
      ],
    });
    expect(parseData(raw)).toEqual({
      version: 1,
      courses: [mkt],
      absences: [{ id: "a1", courseId: "mkt", date: "2026-11-12" }],
      lates: [],
    });
  });
});

describe("データを変える関数", () => {
  it("upsertCourse は新しい授業を足す・同じ id を書き換える", () => {
    const added = upsertCourse(EMPTY_DATA, mkt);
    expect(added.courses).toEqual([mkt]);
    const edited = upsertCourse(sample, { ...mkt, name: "マーケティング論Ⅱ", limit: { kind: "count", max: 5 } });
    expect(edited.courses.find((c) => c.id === "mkt")?.name).toBe("マーケティング論Ⅱ");
    expect(edited.courses).toHaveLength(2);
    expect(edited.absences).toHaveLength(1);
  });

  it("upsertCourse は同じマスの別の授業を上書きし、その欠席も消す", () => {
    const other: Course = { ...mkt, id: "other", name: "経営学" };
    const next = upsertCourse(sample, other);
    expect(next.courses.map((c) => c.id).sort()).toEqual(["boki", "other"]);
    expect(next.absences).toEqual([]);
    expect(next.lates).toEqual([]);
  });

  it("deleteCourse は授業とその欠席・遅刻を消す", () => {
    const next = deleteCourse(sample, "mkt");
    expect(next.courses).toEqual([boki]);
    expect(next.absences).toEqual([]);
    expect(next.lates).toEqual([]);
  });

  it("addLate と removeLate", () => {
    const added = addLate(sample, { id: "l2", courseId: "mkt", date: "2026-11-19", kind: "early" });
    expect(added.lates).toHaveLength(2);
    expect(removeLate(added, "l2")).toEqual(sample);
    expect(sample.lates).toHaveLength(1);
  });

  it("setLatesPerAbsence は設定・解除し、範囲外は解除にする", () => {
    const set = setLatesPerAbsence(sample, "mkt", 3);
    expect(set.courses.find((c) => c.id === "mkt")?.latesPerAbsence).toBe(3);
    expect(set.courses.find((c) => c.id === "boki")?.latesPerAbsence).toBeUndefined();
    expect(setLatesPerAbsence(set, "mkt", undefined)).toEqual(sample);
    expect(setLatesPerAbsence(set, "mkt", 1).courses[0].latesPerAbsence).toBeUndefined();
  });

  it("addAbsence と removeAbsence", () => {
    const added = addAbsence(sample, { id: "a2", courseId: "mkt", date: "2026-11-19" });
    expect(added.absences).toHaveLength(2);
    expect(removeAbsence(added, "a2")).toEqual(sample);
    expect(sample.absences).toHaveLength(1);
  });
});
