import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Ritiro } from "./types";
import { formatCodiceRitiro } from "./storage";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function generateMonthlyReport(ritiri: Ritiro[], meseKey: string): void {
  const [anno, mese] = meseKey.split("-").map(Number);
  const meseName = `${MESI[mese - 1]!} ${anno}`;

  const doc = new jsPDF({ orientation: "landscape" });

  const GREEN: [number, number, number] = [48, 192, 80];
  const DARK: [number, number, number] = [30, 30, 30];

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, 297, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`RitiriPro — Report ${meseName}`, 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generato il ${new Date().toLocaleDateString("it-IT")}`, 297 - 14, 12, { align: "right" });

  const venduti = ritiri.filter((r) => r.venduto);
  const inStock = ritiri.filter((r) => !r.venduto);
  const speseSum = (r: Ritiro) => (r.speseAggiuntive ?? []).reduce((s, v) => s + v.prezzo, 0);
  const totAcquisti = ritiri.reduce((s, r) => s + r.prezzo + speseSum(r), 0);
  const totGuadagni = venduti.reduce((s, r) => s + ((r.prezzoVendita ?? 0) - (r.prezzo + speseSum(r))), 0);

  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Ritiri: ${ritiri.length}  |  In stock: ${inStock.length}  |  Venduti: ${venduti.length}  |  Acquisti: € ${totAcquisti.toFixed(2)}  |  Guadagni: € ${totGuadagni.toFixed(2)}`,
    14,
    28
  );

  const rows = ritiri.map((r) => {
    const costoTotale = r.prezzo + speseSum(r);
    const margine = r.venduto && r.prezzoVendita !== undefined
      ? r.prezzoVendita - costoTotale
      : null;
    return [
      formatCodiceRitiro(r.numeroRitiro, r.dataAcquisto) || r.id.slice(0, 8),
      new Date(r.dataAcquisto).toLocaleDateString("it-IT"),
      `${r.cognomeCliente} ${r.nomeCliente}`,
      r.marcaModello || r.articolo,
      r.serialeImei || "-",
      `€ ${r.prezzo.toFixed(2)}`,
      speseSum(r) > 0 ? `€ ${speseSum(r).toFixed(2)}` : "-",
      `€ ${costoTotale.toFixed(2)}`,
      r.venduto ? "Venduto" : "In stock",
      r.venduto && r.prezzoVendita !== undefined ? `€ ${r.prezzoVendita.toFixed(2)}` : "-",
      margine !== null ? `€ ${margine.toFixed(2)}` : "-",
    ];
  });

  autoTable(doc, {
    head: [["N°", "Data", "Cliente", "Articolo", "Seriale/IMEI", "Acquisto", "Spese +", "Costo Tot.", "Stato", "Vendita", "Margine"]],
    body: rows,
    startY: 35,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 245] },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 8) {
        if (data.cell.raw === "Venduto") {
          data.cell.styles.textColor = [22, 160, 45];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [37, 99, 235];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.column.index === 10 && typeof data.cell.raw === "string" && data.cell.raw !== "-") {
        const val = parseFloat(data.cell.raw.replace("€ ", ""));
        if (!isNaN(val)) {
          data.cell.styles.textColor = val >= 0 ? [22, 160, 45] : [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`report-${meseKey}.pdf`);
}
