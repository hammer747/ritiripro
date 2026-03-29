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
import { Trash2 } from "lucide-react";
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
}

export default function RitiriTable({ ritiri, onChanged }: Props) {
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
            <TableHead className="w-12"></TableHead>
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
                <span className="font-medium">
                  {DOC_LABELS[r.tipoDocumento] || r.tipoDocumento}
                </span>
                <br />
                <span className="text-xs text-muted-foreground">
                  {r.numeroDocumento}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{r.articolo}</div>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
