"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { backupFileName, parseBackup, serializeBackup } from "@/lib/backup";
import { carryOverTerm } from "@/lib/term";
import type { AppData } from "@/lib/types";
import { useAppData } from "@/lib/useAppData";
import { ConfirmDialog } from "./ConfirmDialog";

type Message = { kind: "ok" | "error"; text: string } | null;
type Confirming = { kind: "import"; data: AppData } | { kind: "term" } | null;

function download(fileName: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SettingsView() {
  const [data, update] = useAppData();
  const [exportMsg, setExportMsg] = useState<Message>(null);
  const [importMsg, setImportMsg] = useState<Message>(null);
  const [termMsg, setTermMsg] = useState<Message>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onExport() {
    if (!data) return;
    const name = backupFileName(new Date());
    download(name, serializeBackup(data));
    setExportMsg({ kind: "ok", text: `${name} を書き出しました` });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setImportMsg(null);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportMsg({ kind: "error", text: "ファイルを読めませんでした" });
      return;
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setImportMsg({ kind: "error", text: `読み込めませんでした。${result.error}` });
      return;
    }
    setConfirming({ kind: "import", data: result.data });
  }

  function onTerm() {
    if (!data) return;
    if (data.absences.length + data.lates.length === 0) {
      setTermMsg({ kind: "ok", text: "欠席・遅刻・早退の記録はありません" });
      return;
    }
    setTermMsg(null);
    setConfirming({ kind: "term" });
  }

  const recordCount = (data?.absences.length ?? 0) + (data?.lates.length ?? 0);

  return (
    <main className="page page-settings">
      <header className="topbar">
        <h1 className="topbar-title">設定</h1>
        <nav className="topbar-links">
          <Link href="/" className="link">
            今日
          </Link>
          <Link href="/timetable" className="link">
            時間割
          </Link>
        </nav>
      </header>

      <div className="settings-list">
        <section className="setting" aria-labelledby="set-export">
          <h2 id="set-export" className="setting-title">
            書き出し
          </h2>
          <p className="setting-text">
            授業と欠席の記録を、ファイルに書き出します。機種変更のときに、新しい端末で読み込めます。
          </p>
          <button type="button" className="btn btn-primary setting-button" onClick={onExport} disabled={!data}>
            書き出す
          </button>
          <p className="setting-result" aria-live="polite">
            {exportMsg?.text}
          </p>
        </section>

        <section className="setting" aria-labelledby="set-import">
          <h2 id="set-import" className="setting-title">
            読み込み
          </h2>
          <p className="setting-text">書き出したファイルから、授業と欠席の記録を戻します。今のデータは置き換わります。</p>
          <input
            ref={fileRef}
            id="import-file"
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <label htmlFor="import-file" className="btn btn-primary setting-button">
            ファイルを選ぶ
          </label>
          <p
            className={`setting-result${importMsg?.kind === "error" ? " is-error" : ""}`}
            aria-live="polite"
          >
            {importMsg?.text}
          </p>
        </section>

        <section className="setting" aria-labelledby="set-term">
          <h2 id="set-term" className="setting-title">
            学期の引き継ぎ
          </h2>
          <p className="setting-text">
            学期が終わったら、時間割と授業は残したまま、欠席・遅刻・早退の記録だけを消します。残り回数は上限に戻ります。
          </p>
          <button type="button" className="btn btn-danger setting-button" onClick={onTerm} disabled={!data}>
            欠席を0に戻す
          </button>
          <p className="setting-result" aria-live="polite">
            {termMsg?.text}
          </p>
        </section>
      </div>

      {confirming?.kind === "import" && (
        <ConfirmDialog
          title="今のデータを置き換えます"
          message={`ファイルの授業${confirming.data.courses.length}件・欠席の記録${confirming.data.absences.length}件で、今の授業と欠席の記録をすべて置き換えます。よろしいですか？`}
          confirmLabel="置き換える"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const next = confirming.data;
            update(() => next);
            setImportMsg({
              kind: "ok",
              text: `授業${next.courses.length}件・欠席の記録${next.absences.length}件を読み込みました`,
            });
            setConfirming(null);
          }}
        />
      )}

      {confirming?.kind === "term" && (
        <ConfirmDialog
          title="欠席・遅刻・早退の記録を消します"
          message={`時間割と授業は残ります。欠席・遅刻・早退の記録${recordCount}件が消えて、すべての授業の残り回数が上限に戻ります。元には戻せません。`}
          confirmLabel="消す"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            update(carryOverTerm);
            setTermMsg({ kind: "ok", text: `欠席・遅刻・早退の記録${recordCount}件を消しました` });
            setConfirming(null);
          }}
        />
      )}
    </main>
  );
}
