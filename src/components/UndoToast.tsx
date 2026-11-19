"use client";

type Props = {
  message: string;
  onUndo: () => void;
};

/** 画面の下に出る取り消しの案内（消すタイミングは親が決める） */
export function UndoToast({ message, onUndo }: Props) {
  return (
    <div className="toast" role="status">
      <p className="toast-message">{message}</p>
      <button type="button" className="btn btn-on-dark toast-button" onClick={onUndo}>
        取り消す
      </button>
    </div>
  );
}
