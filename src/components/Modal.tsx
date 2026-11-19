"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  /** "sheet"＝下から出る面、"center"＝中央の確認 */
  variant: "sheet" | "center";
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

/** 開いている間だけ描く、ネイティブの dialog。Esc・外を押すと onClose */
export function Modal({ variant, labelledBy, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    return () => {
      if (el?.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal modal-${variant}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
