import { Ritiro } from "./types";

const STORAGE_KEY = "ritiri_usato";

export function getRitiri(): Ritiro[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRitiro(ritiro: Ritiro): void {
  const ritiri = getRitiri();
  ritiri.unshift(ritiro);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ritiri));
}

export function updateRitiro(updated: Ritiro): void {
  const ritiri = getRitiri().map((r) => (r.id === updated.id ? updated : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ritiri));
}

export function deleteRitiro(id: string): void {
  const ritiri = getRitiri().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ritiri));
}
