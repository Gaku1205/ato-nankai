import { describe, expect, it } from "vitest";
import { formFromCourse, validateForm, type CourseForm } from "./courseForm";

const base: CourseForm = { name: "マーケティング論", kind: "count", max: "4", maxHours: "", hoursPerClass: "1.5" };

describe("validateForm", () => {
  it("回数の上限", () => {
    expect(validateForm(base)).toEqual({ ok: true, name: "マーケティング論", limit: { kind: "count", max: 4 } });
  });

  it("時間数の上限", () => {
    expect(validateForm({ ...base, name: " 簿記演習 ", kind: "hours", maxHours: "6", hoursPerClass: "1.5" })).toEqual({
      ok: true,
      name: "簿記演習",
      limit: { kind: "hours", maxHours: 6, hoursPerClass: 1.5 },
    });
  });

  it("全角の数字も読む", () => {
    expect(validateForm({ ...base, max: "３" })).toMatchObject({ ok: true, limit: { kind: "count", max: 3 } });
  });

  it("名前が空・数が範囲の外なら誤り", () => {
    expect(validateForm({ ...base, name: "  ", max: "100" })).toEqual({
      ok: false,
      errors: { name: "授業の名前を入れてください", max: "0〜99の数を入れてください" },
    });
    expect(validateForm({ ...base, max: "2.5" })).toMatchObject({ ok: false });
    expect(validateForm({ ...base, max: "" })).toMatchObject({ ok: false });
    expect(validateForm({ ...base, kind: "hours", maxHours: "6.3", hoursPerClass: "0" })).toEqual({
      ok: false,
      errors: {
        maxHours: "0〜999の数を0.5刻みで入れてください",
        hoursPerClass: "0.5〜12の数を0.5刻みで入れてください",
      },
    });
  });
});

describe("formFromCourse", () => {
  it("空のマスは空の入力（1回の時間だけ1.5）", () => {
    expect(formFromCourse(null)).toEqual({ name: "", kind: "count", max: "", maxHours: "", hoursPerClass: "1.5" });
  });
  it("時間数の授業は今の中身を入れる", () => {
    expect(
      formFromCourse({
        id: "x",
        name: "簿記演習",
        weekday: 1,
        period: 3,
        limit: { kind: "hours", maxHours: 6, hoursPerClass: 1.5 },
      }),
    ).toMatchObject({ kind: "hours", maxHours: "6", hoursPerClass: "1.5" });
  });
});
