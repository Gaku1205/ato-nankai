"use client";

import Link from "next/link";
import { lateCount, convertedAbsences } from "@/lib/late";
import { formatHours, statusOf, toDateString, weekdayName } from "@/lib/remaining";
import { addLate, newId, removeAbsence, removeLate, setLatesPerAbsence } from "@/lib/storage";
import { LATES_PER_ABSENCE_MAX, LATES_PER_ABSENCE_MIN, type LateKind } from "@/lib/types";
import { useAppData } from "@/lib/useAppData";
import { AbsenceList, LateList } from "./AbsenceList";

const OPTIONS: number[] = [];
for (let n = LATES_PER_ABSENCE_MIN; n <= LATES_PER_ABSENCE_MAX; n += 1) OPTIONS.push(n);

export function ClassDetail({ id }: { id: string }) {
  const [data, update] = useAppData();

  const topbar = (
    <header className="topbar">
      <Link href="/" className="link link-start">
        今日
      </Link>
      {data?.courses.some((c) => c.id === id) && (
        <Link href="/timetable" className="link">
          時間割
        </Link>
      )}
    </header>
  );

  if (!data) return <main className="page page-detail">{topbar}</main>;

  const course = data.courses.find((c) => c.id === id);
  if (!course) {
    return (
      <main className="page page-detail">
        <header className="topbar">
          <span />
        </header>
        <section className="empty">
          <h1 className="empty-title">授業が見つかりません</h1>
          <Link href="/" className="link empty-link">
            今日に戻る
          </Link>
        </section>
      </main>
    );
  }

  const { remaining, tier } = statusOf(course, data.absences, data.lates);
  const absences = data.absences.filter((a) => a.courseId === id);
  const lates = data.lates.filter((l) => l.courseId === id);
  const per = course.latesPerAbsence;
  const hours = remaining.hours;

  function addLateOf(kind: LateKind) {
    update((d) => addLate(d, { id: newId(), courseId: id, date: toDateString(new Date()), kind }));
  }

  return (
    <main className="page page-detail">
      {topbar}

      <section className={`detail-face tier-${tier}`} aria-label={`${course.name}、あと${remaining.count}回`}>
        <p className="detail-slot">
          {weekdayName(course.weekday)}曜 {course.period}限
        </p>
        <h1 className="detail-name">{course.name}</h1>
        <p className="detail-count" aria-hidden="true">
          <span className="unit">あと</span>
          <span className="detail-number">{remaining.count}</span>
          <span className="unit">回</span>
          {hours !== undefined && <span className="detail-hours">あと{formatHours(hours)}時間</span>}
        </p>
      </section>

      <section aria-labelledby="h-absence">
        <div className="section-head">
          <h2 id="h-absence" className="section-title">
            欠席
          </h2>
          <span className="section-count">{absences.length}件</span>
        </div>
        <AbsenceList absences={absences} onRemove={(aid) => update((d) => removeAbsence(d, aid))} />
      </section>

      <section aria-labelledby="h-late">
        <div className="section-head">
          <h2 id="h-late" className="section-title">
            遅刻・早退
          </h2>
          <span className="section-count">{lates.length}件</span>
        </div>
        <div className="late-buttons">
          <button type="button" className="btn btn-primary" onClick={() => addLateOf("late")}>
            遅刻 +1
          </button>
          <button type="button" className="btn btn-primary" onClick={() => addLateOf("early")}>
            早退 +1
          </button>
        </div>
        <LateList lates={lates} onRemove={(lid) => update((d) => removeLate(d, lid))} />
      </section>

      <section aria-labelledby="h-convert">
        <div className="section-head">
          <h2 id="h-convert" className="section-title">
            遅刻・早退の換算
          </h2>
        </div>
        <div className="field">
          <label htmlFor="lates-per" className="field-label">
            遅刻・早退が何回で欠席1回
          </label>
          <select
            id="lates-per"
            className="input"
            value={per === undefined ? "" : String(per)}
            onChange={(e) => {
              const v = e.target.value;
              update((d) => setLatesPerAbsence(d, id, v === "" ? undefined : Number(v)));
            }}
          >
            <option value="">換算しない</option>
            {OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}回
              </option>
            ))}
          </select>
          <p className="field-note">
            {per === undefined
              ? "換算しないので、遅刻・早退は残り回数に入りません"
              : `いま遅刻・早退 ${lates.length}回 → 欠席 ${convertedAbsences(lateCount(lates, id), per)}回分`}
          </p>
        </div>
      </section>
    </main>
  );
}
