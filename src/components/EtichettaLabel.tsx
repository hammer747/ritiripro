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
          className="border rounded-lg p-4 bg-white text-black space-y-2 mx-auto"
          style={{ width: "240px" }}
        >
          <div className="label">
            <div className="header text-center font-bold text-base border-b border-black pb-1">
              RITIRO #{shortId}
            </div>
            <div className="row flex justify-between text-sm mt-1">
              <span className="key text-xs text-gray-500">Cliente:</span>
              <span className="val font-semibold">
                {ritiro.cognomeCliente} {ritiro.nomeCliente}
              </span>
            </div>
            {ritiro.pinDispositivo && (
              <div className="row flex justify-between text-sm">
                <span className="key text-xs text-gray-500">PIN:</span>
                <span className="val font-semibold font-mono">
                  {ritiro.pinDispositivo}
                </span>
              </div>
            )}
            {ritiro.marcaModello && (
              <div className="row flex justify-between text-sm">
                <span className="key text-xs text-gray-500">Dispositivo:</span>
                <span className="val font-semibold text-right max-w-[140px] truncate">
                  {ritiro.marcaModello}
                </span>
              </div>
            )}

            <div className="code text-center text-[10px] text-gray-400 tracking-wider">
              {codiceRitiro || new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })}
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
