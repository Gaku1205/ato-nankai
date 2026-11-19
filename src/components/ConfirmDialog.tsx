"use client";

import { Modal } from "./Modal";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal variant="center" labelledBy="confirm-title" onClose={onCancel}>
      <h2 id="confirm-title" className="confirm-title">
        {title}
      </h2>
      <p className="confirm-message">{message}</p>
      <div className="button-row">
        <button type="button" className="btn btn-quiet" onClick={onCancel} autoFocus>
          やめる
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
