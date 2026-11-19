"use client";

import { useCallback, useSyncExternalStore } from "react";
import { loadData, saveData, STORAGE_KEY } from "./storage";
import type { AppData } from "./types";

// 端末の保存（localStorage）を、画面から読み書きするための小さな入れ物

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppData {
  if (cache === null) cache = loadData(window.localStorage);
  return cache;
}

function getServerSnapshot(): AppData | null {
  return null;
}

/** 保存されたデータ（読み込み前は null）と、書き換える関数 */
export function useAppData(): [AppData | null, (update: (data: AppData) => AppData) => void] {
  const data = useSyncExternalStore<AppData | null>(subscribe, getSnapshot, getServerSnapshot);
  const update = useCallback((fn: (data: AppData) => AppData) => {
    const next = fn(getSnapshot());
    cache = next;
    try {
      saveData(window.localStorage, next);
    } catch {
      // 保存できない（容量・プライベートモード）ときも、画面の上では変える
    }
    emit();
  }, []);
  return [data, update];
}

// サーバーでは false、ブラウザでは true（今日の日付をブラウザの時計で出すため）
const noopSubscribe = () => () => {};
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
