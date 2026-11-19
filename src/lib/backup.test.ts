import { describe, expect, it } from "vitest";
import { backupFileName, parseBackup, serializeBackup } from "./backup";
import type { AppData } from "./types";

const data: AppData = {
  version: 1,
  courses: [
    { id: "c1", name: "情報リテラシー", weekday: 1, period: 1, limit: { kind: "count", max: 4 } },
    { id: "c2", name: "簿記演習", weekday: 1, period: 3, limit: { kind: "hours", maxHours: 6, hoursPerClass: 1.5 } },
  ],
  absences: [
    { id: "a1", courseId: "c1", date: "2026-11-10" },
    { id: "a2", courseId: "c2", date: "2026-11-12" },
  ],
  lates: [{ id: "l1", courseId: "c1", date: "2026-11-11", kind: "early" }],
};

function withChange(change: (d: Record<string, unknown>) => void): string {
  const copy = JSON.parse(serializeBackup(data)) as Record<string, unknown>;
  change(copy);
  return JSON.stringify(copy);
}

describe("backup", () => {
  it("書き出して読み込むと同じになる", () => {
    const result = parseBackup(serializeBackup(data));
    expect(result).toEqual({ ok: true, data });
  });

  it("空のデータも往復できる", () => {
    const empty: AppData = { version: 1, courses: [], absences: [], lates: [] };
    expect(parseBackup(serializeBackup(empty))).toEqual({ ok: true, data: empty });
  });

  it("lates が無い古い書き出しは、遅刻なしとして読む", () => {
    const r = parseBackup(withChange((d) => delete d.lates));
    expect(r).toEqual({ ok: true, data: { ...data, lates: [] } });
  });

  it("遅刻・早退が1件でも形が違う・授業が無いとエラー", () => {
    expect(
      parseBackup(
        withChange((d) => {
          (d.lates as unknown[])[0] = { id: "l1", courseId: "c1", date: "2026-11-11", kind: "x" };
        }),
      ),
    ).toEqual({ ok: false, error: "遅刻・早退の記録の1件目の形が違います" });
    expect(
      parseBackup(
        withChange((d) => {
          (d.lates as { courseId: string }[])[0].courseId = "zzz";
        }),
      ).ok,
    ).toBe(false);
  });

  it("書き出しの中身は保存形式そのまま", () => {
    expect(JSON.parse(serializeBackup(data))).toEqual(data);
  });

  it("ファイル名は ato-nankai-YYYY-MM-DD.json", () => {
    expect(backupFileName(new Date(2026, 10, 19))).toBe("ato-nankai-2026-11-19.json");
    expect(backupFileName(new Date(2026, 0, 5))).toBe("ato-nankai-2026-01-05.json");
  });

  it("JSONでないと日本語のエラー", () => {
    expect(parseBackup("これは違う")).toEqual({ ok: false, error: "JSONのファイルではありません" });
  });

  it("オブジェクトでない・versionが1でないとエラー", () => {
    expect(parseBackup("[]").ok).toBe(false);
    expect(parseBackup("null").ok).toBe(false);
    const r = parseBackup(withChange((d) => (d.version = 2)));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("versionが1ではありません");
  });

  it("配列でないとエラー", () => {
    expect(parseBackup(withChange((d) => (d.courses = {}))).ok).toBe(false);
    expect(parseBackup(withChange((d) => delete d.absences)).ok).toBe(false);
  });

  it("授業が1件でも形が違えば、まるごと読み込まない", () => {
    const r = parseBackup(
      withChange((d) => {
        (d.courses as unknown[])[1] = { id: "c2", name: "", weekday: 1, period: 3 };
      }),
    );
    expect(r).toEqual({ ok: false, error: "授業の2件目の形が違います" });
  });

  it("欠席が1件でも形が違えば、まるごと読み込まない", () => {
    const r = parseBackup(
      withChange((d) => {
        (d.absences as unknown[])[0] = { id: "a1", courseId: "c1", date: "昨日" };
      }),
    );
    expect(r).toEqual({ ok: false, error: "欠席の記録の1件目の形が違います" });
  });

  it("同じマス・重なったid・授業の無い欠席はエラー", () => {
    expect(
      parseBackup(
        withChange((d) => {
          (d.courses as { period: number }[])[1].period = 1;
        }),
      ).ok,
    ).toBe(false);
    expect(
      parseBackup(
        withChange((d) => {
          (d.courses as { id: string }[])[1].id = "c1";
        }),
      ).ok,
    ).toBe(false);
    expect(
      parseBackup(
        withChange((d) => {
          (d.absences as { id: string }[])[1].id = "a1";
        }),
      ).ok,
    ).toBe(false);
    expect(
      parseBackup(
        withChange((d) => {
          (d.absences as { courseId: string }[])[0].courseId = "zzz";
        }),
      ).ok,
    ).toBe(false);
  });
});
