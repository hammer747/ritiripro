import { Ritiro } from "./types";

const STORAGE_KEY = "ritiri_usato";

export function getRitiri(): Ritiro[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function persist(ritiri: Ritiro[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ritiri));
  } catch (err) {
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22)) {
      throw new Error(
        "Spazio di archiviazione esaurito. Rimuovi qualche allegato o elimina ritiri vecchi."
      );
    }
    throw err;
  }
}

export function saveRitiro(ritiro: Ritiro): void {
  const ritiri = getRitiri();
  ritiri.unshift(ritiro);
  persist(ritiri);
}

export function updateRitiro(updated: Ritiro): void {
  const ritiri = getRitiri().map((r) => (r.id === updated.id ? updated : r));
  persist(ritiri);
}

export function deleteRitiro(id: string): void {
  const ritiri = getRitiri().filter((r) => r.id !== id);
  persist(ritiri);
}
