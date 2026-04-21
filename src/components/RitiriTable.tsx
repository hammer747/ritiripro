import { Ritiro } from "@/lib/types";
import { deleteRitiro, formatCodiceRitiro } from "@/lib/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, FileText, Tag } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/components/ui/login-dialog";

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
  onPrint?: (ritiro: Ritiro) => void;
  userRole?: UserRole;
}

export default function RitiriTable({ ritiri, onChanged, onEdit, onPrint, userRole = "admin" }: Props) {
  const canDelete = userRole === "admin";
  const canEdit = userRole !== "tecnico";
  const showPrice = userRole !== "tecnico";

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo ritiro?")) return;
    try {
      await deleteRitiro(id);
      toast.success("Ritiro eliminato");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante eliminazione");
    }
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
            <TableHead>N°</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Articolo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="text-right">Prezzo</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ritiri.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-sm font-semibold">
                {formatCodiceRitiro(r.numeroRitiro, r.dataAcquisto)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(r.dataAcquisto).toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell>
                <div className="font-bold text-sm">
                  {r.cognomeCliente} {r.nomeCliente}
                </div>
                {r.lastEditByName && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Modif. da {r.lastEditByName}
                    {r.lastEditAt && ` · ${new Date(r.lastEditAt).toLocaleDateString("it-IT")}`}
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
                <div className="font-bold text-sm">
                  {r.marcaModello || r.articolo}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${r.venduto ? "bg-green-500" : "bg-blue-500"}`}>
                  {r.venduto ? "Venduto" : "In stock"}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold text-sm">
                {showPrice
                  ? `€ ${Math.round(r.prezzo)}`
                  : <span className="text-muted-foreground text-xs font-normal italic">— Riservato —</span>
                }
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {onPrint && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Stampa etichetta" onClick={() => onPrint(r)}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
