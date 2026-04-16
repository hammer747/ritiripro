import { Ritiro } from "@/lib/types";
import { deleteRitiro } from "@/lib/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, FileText, Lock } from "lucide-react";
import { toast } from "sonner";

const DOC_LABELS: Record<string, string> = {
  carta_identita: "C.I.",
  patente: "Patente",
  passaporto: "Passaporto",
  permesso_soggiorno: "P. Soggiorno",
};

interface Props {
  ritiri: Ritiro[];
  onChanged: () => void;
  onEdit: (ritiro: Ritiro) => void;
}

export default function RitiriTable({ ritiri, onChanged, onEdit }: Props) {
  const handleDelete = (id: string) => {
    if (!confirm("Eliminare questo ritiro?")) return;
    deleteRitiro(id);
    toast.success("Ritiro eliminato");
    onChanged();
  };

  if (ritiri.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Nessun ritiro registrato. Usa il form sopra per aggiungere il primo.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Articolo</TableHead>
            <TableHead className="text-right">Prezzo</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ritiri.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(r.dataAcquisto).toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">
                  {r.cognomeCliente} {r.nomeCliente}
                </div>
                {r.codiceFiscale && (
                  <div className="text-xs text-muted-foreground">
                    {r.codiceFiscale}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {DOC_LABELS[r.tipoDocumento] || r.tipoDocumento}
                  </span>
                  {(r.documentoFronteBase64 || r.documentoRetroBase64) && (
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.numeroDocumento}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm flex items-center gap-1">
                  {r.articolo}
                  {r.pinDispositivo && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                {r.descrizione && (
                  <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {r.descrizione}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-sm">
                € {r.prezzo.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(r)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
