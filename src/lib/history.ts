import type { DesignResult } from "./designer.functions";

export type HistoryEntry = {
  id: string;
  createdAt: number;
  preview: string;
  result: DesignResult;
  variations?: string[];
};

const KEY = "aid:history";
const CURRENT = "aid:current";
const MAX = 12;

export function saveCurrent(entry: HistoryEntry) {
  try {
    sessionStorage.setItem(CURRENT, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    const next = [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function updateCurrent(patch: Partial<HistoryEntry>) {
  try {
    const raw = sessionStorage.getItem(CURRENT);
    if (!raw) return;
    const entry = JSON.parse(raw) as HistoryEntry;
    const next = { ...entry, ...patch };
    sessionStorage.setItem(CURRENT, JSON.stringify(next));
    // sync history
    const hraw = localStorage.getItem(KEY);
    if (hraw) {
      const list = JSON.parse(hraw) as HistoryEntry[];
      const idx = list.findIndex((e) => e.id === next.id);
      if (idx !== -1) {
        list[idx] = next;
        localStorage.setItem(KEY, JSON.stringify(list));
      }
    }
  } catch {
    /* ignore */
  }
}

export function loadCurrent(): HistoryEntry | null {
  try {
    const raw = sessionStorage.getItem(CURRENT);
    return raw ? (JSON.parse(raw) as HistoryEntry) : null;
  } catch {
    return null;
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function loadById(id: string): HistoryEntry | null {
  return loadHistory().find((e) => e.id === id) ?? null;
}

export function removeEntry(id: string) {
  try {
    const list = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
