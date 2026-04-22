import { useRef } from "react";
import { Ritiro } from "@/lib/types";
import { formatCodiceRitiro } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";

interface Props {
  ritiro: Ritiro | null;
  open: boolean;
  onClose: () => void;
}

export default function EtichettaLabel({ ritiro, open, onClose }: Props) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const codiceRitiro = ritiro ? formatCodiceRitiro(ritiro.numeroRitiro, ritiro.dataAcquisto) : "";
  const shortId = codiceRitiro || ritiro?.id.split("-")[0].toUpperCase() || "";

  const MESI_SHORT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const dataFormattata = ritiro ? (() => {
    const d = new Date(ritiro.dataAcquisto);
    return `${String(d.getDate()).padStart(2, "0")} ${MESI_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  })() : "";

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    const printWindow = window.open("", "_blank", "width=400,height=350");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Etichetta ${shortId}</title>
          <style>
            @page { size: 62mm 40mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
            .label {
              width: 58mm; padding: 2mm; display: flex; flex-direction: column;
              gap: 1mm; font-size: 9pt;
            }
            .header { font-weight: 700; font-size: 11pt; text-align: center; border-bottom: 1px solid #333; padding-bottom: 1mm; }
            .row { display: flex; justify-content: space-between; }
            .key { font-weight: 600; font-size: 8pt; color: #555; }
            .val { font-weight: 700; }
            .barcode { text-align: center; margin-top: 1mm; }
            .barcode svg { width: 100%; height: 30px; }
            .code { text-align: center; font-size: 7pt; color: #777; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          ${printAreaRef.current.innerHTML}
          <script>window.onload=function(){window.print();window.close();}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!ritiro) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Etichetta Dispositivo</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div
          ref={printAreaRef}
          className="border rounded-lg p-4 bg-white text-black mx-auto"
          style={{ width: "240px" }}
        >
          <div className="label" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "4px" }}>
            <div className="header" style={{ fontWeight: 700, fontSize: "22pt", textAlign: "center" }}>
              #{shortId}
            </div>
            <div style={{ fontSize: "10pt", color: "#555", textAlign: "center" }}>
              {dataFormattata}
            </div>
          </div>
        </div>

        <Button onClick={handlePrint} className="w-full mt-2">
          <Printer className="h-4 w-4 mr-2" /> Stampa Etichetta
        </Button>
      </DialogContent>
    </Dialog>
  );
}
