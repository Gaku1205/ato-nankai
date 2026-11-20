"use client";

import Link from "next/link";
import { useState } from "react";
import { formFromCourse, validateForm, type CourseForm, type FormErrors } from "@/lib/courseForm";
import { weekdayName } from "@/lib/remaining";
import type { Course, Limit, Period, Weekday } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

type Props = {
  weekday: Weekday;
  period: Period;
  course: Course | null;
  onSave: (name: string, limit: Limit) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CourseEditor({ weekday, period, course, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<CourseForm>(() => formFromCourse(course));
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (patch: Partial<CourseForm>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.name, result.limit);
  }

  if (confirmDelete && course) {
    return (
      <ConfirmDialog
        title="授業を消す"
        message={`「${course.name}」と欠席の記録を消しますか？`}
        confirmLabel="消す"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    );
  }

  return (
    <Modal variant="sheet" labelledBy="editor-title" onClose={onClose}>
      <form className="editor" onSubmit={submit} noValidate>
        <h2 id="editor-title" className="editor-title">
          {weekdayName(weekday)}曜 {period}限
        </h2>

        <div className="field">
          <label htmlFor="course-name" className="field-label">
            授業の名前
          </label>
          <input
            id="course-name"
            className="input"
            type="text"
            value={form.name}
            maxLength={40}
            autoComplete="off"
            onChange={(e) => set({ name: e.target.value })}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "course-name-error" : undefined}
          />
          {errors.name && (
            <p id="course-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <fieldset className="field">
          <legend className="field-label">上限の数え方</legend>
          <div className="switch">
            <button
              type="button"
              className="switch-button"
              aria-pressed={form.kind === "count"}
              onClick={() => set({ kind: "count" })}
            >
              回数
            </button>
            <button
              type="button"
              className="switch-button"
              aria-pressed={form.kind === "hours"}
              onClick={() => set({ kind: "hours" })}
            >
              時間数
            </button>
          </div>
        </fieldset>

        {form.kind === "count" ? (
          <NumberField
            id="course-max"
            label="欠席できる回数"
            unit="回"
            value={form.max}
            error={errors.max}
            step="1"
            onChange={(v) => set({ max: v })}
          />
        ) : (
          <div className="field-pair">
            <NumberField
              id="course-max-hours"
              label="欠席できる時間"
              unit="時間"
              value={form.maxHours}
              error={errors.maxHours}
              step="0.5"
              onChange={(v) => set({ maxHours: v })}
            />
            <NumberField
              id="course-per"
              label="1回の授業の時間"
              unit="時間"
              value={form.hoursPerClass}
              error={errors.hoursPerClass}
              step="0.5"
              onChange={(v) => set({ hoursPerClass: v })}
            />
          </div>
        )}

        {course && (
          <Link href={`/class/?id=${encodeURIComponent(course.id)}`} className="link link-start">
            授業の詳細を見る
          </Link>
        )}

        {course && (
          <button type="button" className="btn-text-danger" onClick={() => setConfirmDelete(true)}>
            この授業を消す
          </button>
        )}

        <div className="button-row">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            やめる
          </button>
          <button type="submit" className="btn btn-primary">
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  unit: string;
  value: string;
  error?: string;
  step: string;
  onChange: (v: string) => void;
};

function NumberField({ id, label, unit, value, error, step, onChange }: NumberFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="input-unit">
        <input
          id={id}
          className="input input-number"
          type="text"
          inputMode="decimal"
          data-step={step}
          value={value}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="unit-text">{unit}</span>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
