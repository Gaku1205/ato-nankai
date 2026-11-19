"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dayName, toDateString, todayCourses, type CourseStatus } from "@/lib/remaining";
import { addAbsence, newId, removeAbsence } from "@/lib/storage";
import { useAppData } from "@/lib/useAppData";
import { ClassCard } from "./ClassCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { UndoToast } from "./UndoToast";

const UNDO_MS = 5000;

type Undo = { absenceId: string; name: string };

export function TodayView() {
  const [data, update] = useAppData();
  const [confirming, setConfirming] = useState<CourseStatus | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  // 読み込み前（サーバーで作った最初の表示）は日付も出さない（端末の時計で出すため）
  const today = data ? new Date() : null;
  const list = data && today ? todayCourses(data, today) : [];

  function add(status: CourseStatus) {
    const absence = { id: newId(), courseId: status.course.id, date: toDateString(new Date()) };
    update((d) => addAbsence(d, absence));
    setUndo({ absenceId: absence.id, name: status.course.name });
  }

  function onAbsent(status: CourseStatus) {
    if (status.remaining.count <= 0) {
      setConfirming(status);
      return;
    }
    add(status);
  }

  const [hero, ...rest] = list;

  return (
    <main className="page">
      <header className="topbar">
        <p className="today">
          {today && (
            <>
              {today.getMonth() + 1}月{today.getDate()}日（<span className="today-day">{dayName(today)}</span>）
            </>
          )}
        </p>
        <nav className="topbar-links">
          <Link href="/timetable" className="link">
            時間割
          </Link>
          <Link href="/settings" className="link">
            設定
          </Link>
        </nav>
      </header>

      {data && data.courses.length === 0 && (
        <section className="empty">
          <h1 className="empty-title">まず時間割を作りましょう</h1>
          <p className="empty-text">授業を入れると、ここに「あと何回休めるか」が出ます。</p>
          <Link href="/timetable" className="btn btn-primary empty-button">
            時間割を作る
          </Link>
        </section>
      )}

      {data && data.courses.length > 0 && !hero && today && (
        <section className="empty">
          <h1 className="empty-title">今日（{dayName(today)}）は授業がありません</h1>
          <p className="empty-text">休める回数は、時間割の表で見られます。</p>
          <Link href="/timetable" className="link empty-link">
            時間割を見る
          </Link>
        </section>
      )}

      {hero && (
        <div className="today-layout">
          <ClassCard status={hero} hero onAbsent={onAbsent} />
          {rest.length > 0 && (
            <ul className="rows" aria-label="ほかの今日のコマ">
              {rest.map((s) => (
                <ClassCard key={s.course.id} status={s} onAbsent={onAbsent} />
              ))}
            </ul>
          )}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="受験資格がなくなるかも"
          message={`「${confirming.course.name}」はもう休める回数が残っていません。欠席を足しますか？`}
          confirmLabel="足す"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            add(confirming);
            setConfirming(null);
          }}
        />
      )}

      {undo && (
        <UndoToast
          key={undo.absenceId}
          message={`${undo.name}に欠席を1件足しました`}
          onUndo={() => {
            update((d) => removeAbsence(d, undo.absenceId));
            setUndo(null);
          }}
        />
      )}
    </main>
  );
}
