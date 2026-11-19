import type { Course, Limit } from "./types";

export type LimitKind = Limit["kind"];

/** 編集の画面の入力（文字のまま） */
export type CourseForm = {
  name: string;
  kind: LimitKind;
  max: string;
  maxHours: string;
  hoursPerClass: string;
};

export type FormErrors = Partial<Record<"name" | "max" | "maxHours" | "hoursPerClass", string>>;

export function formFromCourse(course: Course | null): CourseForm {
  if (!course) return { name: "", kind: "count", max: "", maxHours: "", hoursPerClass: "1.5" };
  const { limit } = course;
  return limit.kind === "count"
    ? { name: course.name, kind: "count", max: String(limit.max), maxHours: "", hoursPerClass: "1.5" }
    : {
        name: course.name,
        kind: "hours",
        max: "",
        maxHours: String(limit.maxHours),
        hoursPerClass: String(limit.hoursPerClass),
      };
}

function toNumber(s: string): number | null {
  const t = s.trim().replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (t === "" || !/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

function isHalfStep(n: number): boolean {
  return Number.isInteger(n * 2);
}

/** 入力を確かめる。良ければ名前と上限、悪ければ誤りの文 */
export function validateForm(
  form: CourseForm,
): { ok: true; name: string; limit: Limit } | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (name === "") errors.name = "授業の名前を入れてください";
  else if (name.length > 40) errors.name = "授業の名前は40文字までです";

  let limit: Limit | null = null;
  if (form.kind === "count") {
    const max = toNumber(form.max);
    if (max === null || !Number.isInteger(max) || max < 0 || max > 99) errors.max = "0〜99の数を入れてください";
    else limit = { kind: "count", max };
  } else {
    const maxHours = toNumber(form.maxHours);
    const per = toNumber(form.hoursPerClass);
    if (maxHours === null || maxHours > 999 || !isHalfStep(maxHours)) {
      errors.maxHours = "0〜999の数を0.5刻みで入れてください";
    }
    if (per === null || per < 0.5 || per > 12 || !isHalfStep(per)) {
      errors.hoursPerClass = "0.5〜12の数を0.5刻みで入れてください";
    }
    if (!errors.maxHours && !errors.hoursPerClass && maxHours !== null && per !== null) {
      limit = { kind: "hours", maxHours, hoursPerClass: per };
    }
  }

  if (limit && Object.keys(errors).length === 0) return { ok: true, name, limit };
  return { ok: false, errors };
}
