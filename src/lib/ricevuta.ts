import jsPDF from "jspdf";
import { Ritiro } from "./types";
import { formatCodiceRitiro } from "./storage";

export type AdminInfo = {
  ditta?: string | null;
  indirizzo?: string | null;
  piva?: string | null;
  nome: string;
  cognome: string;
};

async function loadImageAsBase64(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src + "?t=" + Date.now();
  });
}

const DOC_LABELS: Record<string, string> = {
  carta_identita: "Carta d'Identità",
  patente: "Patente",
  passaporto: "Passaporto",
  permesso_soggiorno: "Permesso di Soggiorno",
};

const TIPO_LABELS: Record<string, string> = {
  smartphone: "Smartphone",
  computer: "Computer",
  console: "Console",
  camera: "Fotocamera",
  altro: "Altro",
};

export async function generateRicevuta(ritiro: Ritiro, admin: AdminInfo): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const DARK: [number, number, number] = [30, 30, 30];
  const GRAY: [number, number, number] = [120, 120, 120];
  const GREEN: [number, number, number] = [48, 192, 80];
  const LIGHT_GREEN: [number, number, number] = [240, 255, 243];

  const codice = formatCodiceRitiro(ritiro.numeroRitiro, ritiro.dataAcquisto);
  const dataFormatted = new Date(ritiro.dataAcquisto).toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const companyName = admin.ditta?.trim() || `${admin.nome} ${admin.cognome}`;

  // --- HEADER ---
  const logoData = await loadImageAsBase64("/logo.png");
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 38, 18);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(companyName, 196, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  if (admin.indirizzo?.trim()) doc.text(admin.indirizzo.trim(), 196, 18, { align: "right" });
  if (admin.piva?.trim()) doc.text(`P.IVA: ${admin.piva.trim()}`, 196, 23, { align: "right" });

  // green bar
  doc.setFillColor(...GREEN);
  doc.rect(14, 32, 182, 1.2, "F");

  // --- TITLE ---
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("RICEVUTA DI ACQUISTO", 105, 43, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`N° ${codice}`, 14, 51);
  doc.text(`Data: ${dataFormatted}`, 196, 51, { align: "right" });

  // thin separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, 55, 196, 55);

  // --- CLIENT SECTION ---
  let y = 63;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("DATI CLIENTE", 14, y);
  y += 5;

  const tipoDoc = DOC_LABELS[ritiro.tipoDocumento] ?? ritiro.tipoDocumento;

  const clientRows: [string, string][] = [
    ["Nome e Cognome", `${ritiro.nomeCliente} ${ritiro.cognomeCliente}`],
    ["Codice Fiscale", ritiro.codiceFiscale || "—"],
    ...(ritiro.telefonoCliente ? [["Telefono", ritiro.telefonoCliente] as [string, string]] : []),
    ["Documento d'identità", `${tipoDoc} — ${ritiro.numeroDocumento}`],
  ];

  for (const [label, value] of clientRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`${label}:`, 14, y);
    doc.setTextColor(...DARK);
    doc.text(value, 68, y);
    y += 5.5;
  }

  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);
  y += 8;

  // --- PRODUCT SECTION ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("OGGETTO ACQUISTATO", 14, y);
  y += 5;

  const prodRows: [string, string][] = [
    ["Descrizione", ritiro.marcaModello || ritiro.articolo || "—"],
    ["Tipo articolo", TIPO_LABELS[ritiro.tipoArticolo] ?? ritiro.tipoArticolo],
    ...(ritiro.serialeImei ? [["Seriale / IMEI", ritiro.serialeImei] as [string, string]] : []),
    ...(ritiro.descrizione?.trim() ? [["Note articolo", ritiro.descrizione.trim()] as [string, string]] : []),
  ];

  for (const [label, value] of prodRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`${label}:`, 14, y);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(value, 120) as string[];
    doc.text(lines, 68, y);
    y += Math.max(5.5, lines.length * 4.5);
  }

  y += 6;

  // --- PRICE BOX ---
  doc.setFillColor(...LIGHT_GREEN);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, y, 182, 18, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Prezzo di acquisto:", 20, y + 11);

  doc.setFontSize(14);
  doc.setTextColor(30, 140, 50);
  doc.text(`€ ${ritiro.prezzo.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`, 190, y + 11, { align: "right" });

  y += 28;

  // --- DECLARATION ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text(
    "Il sottoscritto dichiara di cedere volontariamente il bene sopra descritto, confermandone la piena proprietà e la libera disponibilità, sollevando l'esercente da qualsiasi responsabilità relativa alla provenienza del bene.",
    14, y, { maxWidth: 182 }
  );

  y += 16;

  // --- SIGNATURES ---
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(14, y, 88, y);
  doc.line(122, y, 196, y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Firma del cedente", 51, y + 4, { align: "center" });
  doc.text("Firma dell'esercente", 159, y + 4, { align: "center" });

  // --- FOOTER ---
  doc.setFontSize(7);
  doc.setTextColor(190, 190, 190);
  doc.text(
    `RitiriPro — ${companyName} — Documento generato il ${new Date().toLocaleDateString("it-IT")}`,
    105, 288, { align: "center" }
  );

  doc.save(`ricevuta-${codice || ritiro.id.slice(0, 8)}.pdf`);
}
