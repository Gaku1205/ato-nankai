"use client";

import { formatDateLabel, newestFirst } from "@/lib/remaining";
import type { Absence, Late } from "@/lib/types";

type AbsenceListProps = {
  absences: readonly Absence[];
  onRemove: (id: string) => void;
};

/** 欠席の一覧。日付の新しい順に1件ずつ、取り消せる */
export function AbsenceList({ absences, onRemove }: AbsenceListProps) {
  if (absences.length === 0) return <p className="record-empty">欠席はまだありません</p>;
  return (
    <ul className="records" aria-label="欠席の一覧">
      {newestFirst(absences).map((a) => (
        <li key={a.id} className="record">
          <span className="record-date">{formatDateLabel(a.date)}</span>
          <button
            type="button"
            className="btn btn-quiet record-button"
            onClick={() => onRemove(a.id)}
            aria-label={`${formatDateLabel(a.date)}の欠席を取り消す`}
          >
            取り消す
          </button>
        </li>
      ))}
    </ul>
  );
}

type LateListProps = {
  lates: readonly Late[];
  onRemove: (id: string) => void;
};

/** 遅刻・早退の一覧。日付の新しい順に1件ずつ、取り消せる */
export function LateList({ lates, onRemove }: LateListProps) {
  if (lates.length === 0) return <p className="record-empty">遅刻・早退はまだありません</p>;
  return (
    <ul className="records" aria-label="遅刻・早退の一覧">
      {newestFirst(lates).map((l) => {
        const kind = l.kind === "late" ? "遅刻" : "早退";
        return (
          <li key={l.id} className="record">
            <span className="record-date">{formatDateLabel(l.date)}</span>
            <span className={`record-tag record-tag-${l.kind}`}>{kind}</span>
            <button
              type="button"
              className="btn btn-quiet record-button"
              onClick={() => onRemove(l.id)}
              aria-label={`${formatDateLabel(l.date)}の${kind}を取り消す`}
            >
              取り消す
            </button>
          </li>
        );
      })}
    </ul>
  );
}
