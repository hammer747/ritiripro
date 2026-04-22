import { API_BASE_URL } from "./api";
import { RegisteredUser } from "@/components/ui/login-dialog";
import { Ritiro, TipoArticolo, EditEntry } from "./types";

export function formatCodiceRitiro(numeroRitiro: number | undefined, dataAcquisto: string): string {
  if (!numeroRitiro) return "";
  const d = new Date(dataAcquisto);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const nn = String(numeroRitiro).padStart(2, "0");
  return `${dd}${mm}${yy}-${nn}`;
}

type ApiRitiro = {
  id: string;
  numeroRitiro?: number;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  telefonoCliente: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFrontePath: string | null;
  documentoFronteNome: string | null;
  documentoRetroPath: string | null;
  documentoRetroNome: string | null;
  ricevutaAcquistoPath: string | null;
  ricevutaAcquistoNome: string | null;
  tipoArticolo: TipoArticolo;
  marcaModello: string | null;
  serialeImei: string | null;
  articolo: string | null;
  descrizione: string | null;
  prezzo: number | string;
  prezzoVendita: number | string | null;
  venduto: boolean | number;
  dataVendita: string | null;
  pinDispositivo: string | null;
  dataAcquisto: string;
  note: string | null;
  speseAggiuntive: import("./types").SpeseAggiuntiva[] | string | null;
  createdByName?: string | null;
  lastEditByName?: string | null;
  lastEditAt?: string | null;
  lastEditDetails?: EditEntry[] | string | null;
};

function mapApiToRitiro(item: ApiRitiro): Ritiro {
  return {
    id: item.id,
    numeroRitiro: item.numeroRitiro,
    nomeCliente: item.nomeCliente,
    cognomeCliente: item.cognomeCliente,
    codiceFiscale: item.codiceFiscale,
    telefonoCliente: item.telefonoCliente || undefined,
    tipoDocumento: item.tipoDocumento,
    numeroDocumento: item.numeroDocumento,
    documentoFronteBase64: item.documentoFrontePath ? `${API_BASE_URL}${item.documentoFrontePath}` : undefined,
    documentoFronteNome: item.documentoFronteNome || undefined,
    documentoRetroBase64: item.documentoRetroPath ? `${API_BASE_URL}${item.documentoRetroPath}` : undefined,
    documentoRetroNome: item.documentoRetroNome || undefined,
    ricevutaAcquistoBase64: item.ricevutaAcquistoPath ? `${API_BASE_URL}${item.ricevutaAcquistoPath}` : undefined,
    ricevutaAcquistoNome: item.ricevutaAcquistoNome || undefined,
    tipoArticolo: item.tipoArticolo,
    marcaModello: item.marcaModello || undefined,
    serialeImei: item.serialeImei || undefined,
    articolo: item.articolo || "",
    descrizione: item.descrizione || "",
    prezzo: Number(item.prezzo) || 0,
    prezzoVendita: item.prezzoVendita !== null && item.prezzoVendita !== undefined ? Number(item.prezzoVendita) : undefined,
    venduto: !!item.venduto,
    dataVendita: item.dataVendita || undefined,
    pinDispositivo: item.pinDispositivo || undefined,
    dataAcquisto: item.dataAcquisto,
    note: item.note || "",
    speseAggiuntive: (() => {
      let arr = item.speseAggiuntive;
      if (!arr) return undefined;
      if (typeof arr === "string") {
        try { arr = JSON.parse(arr); } catch { return undefined; }
      }
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return (arr as import("./types").SpeseAggiuntiva[]).map((v) => ({
        ...v,
        prezzo: Number(v.prezzo) || 0,
      }));
    })(),
    createdByName: item.createdByName ?? undefined,
    lastEditByName: item.lastEditByName ?? undefined,
    lastEditAt: item.lastEditAt ?? undefined,
    lastEditDetails: (() => {
      let raw = item.lastEditDetails;
      if (!raw) return undefined;
      if (typeof raw === "string") {
        try { raw = JSON.parse(raw) as EditEntry[]; } catch { return undefined; }
      }
      if (!Array.isArray(raw) || raw.length === 0) return undefined;
      if (typeof raw[0] === "string") return undefined;
      return raw as EditEntry[];
    })(),
  };
}

function getCurrentUser(): RegisteredUser | null {
  const raw = localStorage.getItem("ritiri_facili_user");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RegisteredUser> | null;
    const email = typeof parsed?.email === "string" ? parsed.email.trim().toLowerCase() : "";

    if (!email) {
      localStorage.removeItem("ritiri_facili_user");
      return null;
    }

    const role = (parsed?.role === "venditore" || parsed?.role === "tecnico") ? parsed.role : "admin";
    return {
      nome: typeof parsed?.nome === "string" ? parsed.nome : "",
      cognome: typeof parsed?.cognome === "string" ? parsed.cognome : "",
      cel: typeof parsed?.cel === "string" ? parsed.cel : undefined,
      email,
      role,
      password: typeof parsed?.password === "string" ? parsed.password : "",
    };
  } catch {
    localStorage.removeItem("ritiri_facili_user");
    return null;
  }
}

function getAuthHeaders(): HeadersInit {
  const user = getCurrentUser();
  if (!user?.email) {
    throw new Error("Login richiesto");
  }
  return {
    "x-user-email": user.email.toLowerCase(),
  };
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    let message = text || "Errore API";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // not JSON, use text as-is
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

function toFormData(ritiro: Ritiro): FormData {
  const form = new FormData();
  form.append("nomeCliente", ritiro.nomeCliente);
  form.append("cognomeCliente", ritiro.cognomeCliente);
  form.append("codiceFiscale", ritiro.codiceFiscale || "");
  form.append("telefonoCliente", ritiro.telefonoCliente || "");
  form.append("tipoDocumento", ritiro.tipoDocumento);
  form.append("numeroDocumento", ritiro.numeroDocumento);
  form.append("tipoArticolo", ritiro.tipoArticolo);
  form.append("marcaModello", ritiro.marcaModello || "");
  form.append("serialeImei", ritiro.serialeImei || "");
  form.append("articolo", ritiro.articolo || "");
  form.append("descrizione", ritiro.descrizione || "");
  form.append("prezzo", String(ritiro.prezzo));
  form.append("prezzoVendita", ritiro.prezzoVendita !== undefined ? String(ritiro.prezzoVendita) : "");
  form.append("venduto", String(ritiro.venduto));
  form.append("dataVendita", ritiro.dataVendita || "");
  form.append("pinDispositivo", ritiro.pinDispositivo || "");
  form.append("dataAcquisto", ritiro.dataAcquisto);
  form.append("note", ritiro.note || "");

  // Send images as real file uploads (multer expects documentoFronte/Retro/ricevutaAcquisto)
  // If value is a base64 data URL, convert to Blob; if it's already a server path, send the path as text
  if (ritiro.documentoFronteBase64?.startsWith("data:")) {
    form.append("documentoFronte", base64ToBlob(ritiro.documentoFronteBase64), ritiro.documentoFronteNome || "fronte.jpg");
  } else if (ritiro.documentoFronteBase64) {
    form.append("documentoFrontePath", ritiro.documentoFronteBase64);
    form.append("documentoFronteNome", ritiro.documentoFronteNome || "");
  }

  if (ritiro.documentoRetroBase64?.startsWith("data:")) {
    form.append("documentoRetro", base64ToBlob(ritiro.documentoRetroBase64), ritiro.documentoRetroNome || "retro.jpg");
  } else if (ritiro.documentoRetroBase64) {
    form.append("documentoRetroPath", ritiro.documentoRetroBase64);
    form.append("documentoRetroNome", ritiro.documentoRetroNome || "");
  }

  if (ritiro.ricevutaAcquistoBase64?.startsWith("data:")) {
    form.append("ricevutaAcquisto", base64ToBlob(ritiro.ricevutaAcquistoBase64), ritiro.ricevutaAcquistoNome || "ricevuta.jpg");
  } else if (ritiro.ricevutaAcquistoBase64) {
    form.append("ricevutaAcquistoPath", ritiro.ricevutaAcquistoBase64);
    form.append("ricevutaAcquistoNome", ritiro.ricevutaAcquistoNome || "");
  }

  if (ritiro.speseAggiuntive && ritiro.speseAggiuntive.length > 0) {
    form.append("speseAggiuntive", JSON.stringify(ritiro.speseAggiuntive));
  }

  return form;
}

export async function markRitiroAsSold(ritiro: Ritiro): Promise<Ritiro> {
  return updateRitiro({
    ...ritiro,
    venduto: true,
    dataVendita: ritiro.dataVendita || new Date().toISOString().split("T")[0],
    prezzoVendita: ritiro.prezzoVendita ?? ritiro.prezzo,
  });
}

export async function unmarkRitiroAsSold(ritiro: Ritiro): Promise<Ritiro> {
  return updateRitiro({
    ...ritiro,
    venduto: false,
    dataVendita: undefined,
    prezzoVendita: undefined,
  });
}

export async function getRitiri(): Promise<Ritiro[]> {
  const user = getCurrentUser();
  if (!user?.email) return [];
  const data = await requestJson<ApiRitiro[]>(`${API_BASE_URL}/api/ritiri`, {
    headers: getAuthHeaders(),
  });
  return data.map(mapApiToRitiro);
}

export async function saveRitiro(ritiro: Ritiro): Promise<Ritiro> {
  const data = await requestJson<ApiRitiro>(`${API_BASE_URL}/api/ritiri`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: toFormData(ritiro),
  });
  return mapApiToRitiro(data);
}

export async function updateRitiro(updated: Ritiro): Promise<Ritiro> {
  const data = await requestJson<ApiRitiro>(`${API_BASE_URL}/api/ritiri/${updated.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: toFormData(updated),
  });
  return mapApiToRitiro(data);
}

export async function deleteRitiro(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/ritiri/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore durante eliminazione");
  }
}

export type SubUser = { nome: string; cognome: string; cel?: string | null; email: string; role: "venditore" | "tecnico" };

export async function getAdminUsers(): Promise<SubUser[]> {
  return requestJson<SubUser[]>(`${API_BASE_URL}/api/admin/users`, { headers: getAuthHeaders() });
}

export async function createAdminUser(data: { nome: string; cognome: string; cel?: string; email: string; password: string; role: "venditore" | "tecnico" }): Promise<SubUser> {
  return requestJson<SubUser>(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t || "Errore eliminazione utente"); }
}

export type LogRecord = { id: string; userEmail: string; userName: string; userRole: string; action: string; ritiroId: string | null; ritirodice: string | null; details: string | null; createdAt: string };

export async function getAdminLogs(): Promise<LogRecord[]> {
  return requestJson<LogRecord[]>(`${API_BASE_URL}/api/admin/logs`, { headers: getAuthHeaders() });
}
