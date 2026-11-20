"use client";

import Link from "next/link";
import { formatHours, type CourseStatus } from "@/lib/remaining";

type Props = {
  status: CourseStatus;
  /** true＝トップの主役（画面いっぱいの数字）、false＝下に並ぶ行 */
  hero?: boolean;
  onAbsent: (status: CourseStatus) => void;
};

export function ClassCard({ status, hero = false, onAbsent }: Props) {
  const { course, remaining, tier } = status;
  const hours = remaining.hours;
  const label = `${course.name}、あと${remaining.count}回${hours !== undefined ? `（あと${formatHours(hours)}時間）` : ""}`;

  if (hero) {
    return (
      <section className={`hero tier-${tier}`} aria-label={label}>
        <div className="hero-head">
          <p className="hero-period">{course.period}限</p>
          <h1 className="hero-name">
            <Link href={`/class/?id=${encodeURIComponent(course.id)}`} className="name-link">
              {course.name}
            </Link>
          </h1>
        </div>
        <div className="hero-figure">
          <p className="hero-count" aria-hidden="true">
            <span className="unit">あと</span>
            <span className="hero-number">{remaining.count}</span>
            <span className="unit">回</span>
          </p>
          {hours !== undefined && (
            <p className="hero-hours" aria-hidden="true">
              あと{formatHours(hours)}時間
            </p>
          )}
        </div>
        <button type="button" className="btn btn-absent" onClick={() => onAbsent(status)}>
          欠席 +1
        </button>
      </section>
    );
  }

  return (
    <li className={`row tier-${tier}`} aria-label={label}>
      <span className="row-title">
        <span className="row-period">{course.period}限</span>
        <Link href={`/class/?id=${encodeURIComponent(course.id)}`} className="row-name name-link">
          {course.name}
        </Link>
      </span>
      <span className="row-figure" aria-hidden="true">
        <span className="row-count">
          <span className="unit">あと</span>
          <span className="row-number">{remaining.count}</span>
          <span className="unit">回</span>
        </span>
        {hours !== undefined && <span className="row-hours">あと{formatHours(hours)}時間</span>}
      </span>
      <button
        type="button"
        className="btn btn-absent row-button"
        onClick={() => onAbsent(status)}
        aria-label={`${course.name}に欠席 +1`}
      >
        欠席 +1
      </button>
    </li>
  );
}
