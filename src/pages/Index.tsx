import { useState, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getRitiri } from "@/lib/storage";
import { Ritiro } from "@/lib/types";
import RitiroForm from "@/components/RitiroForm";
import RitiriTable from "@/components/RitiriTable";
import EtichettaLabel from "@/components/EtichettaLabel";
import { Search, Smartphone, Package, Euro } from "lucide-react";

export default function Index() {
  const [ritiri, setRitiri] = useState<Ritiro[]>(getRitiri);
  const [search, setSearch] = useState("");
  const [editingRitiro, setEditingRitiro] = useState<Ritiro | null>(null);
  const [labelRitiro, setLabelRitiro] = useState<Ritiro | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => setRitiri(getRitiri()), []);

  const filtered = useMemo(() => {
    const sorted = [...ritiri].sort(
      (a, b) => new Date(b.dataAcquisto).getTime() - new Date(a.dataAcquisto).getTime()
    );
    if (!search.trim()) return sorted.slice(0, 5);
    const q = search.toLowerCase();
    return sorted.filter(
      (r) =>
        r.nomeCliente.toLowerCase().includes(q) ||
        r.cognomeCliente.toLowerCase().includes(q) ||
        r.articolo.toLowerCase().includes(q) ||
        r.codiceFiscale.toLowerCase().includes(q) ||
        r.numeroDocumento.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [ritiri, search]);

  const totale = ritiri.reduce((s, r) => s + r.prezzo, 0);

  const handleEdit = (ritiro: Ritiro) => {
    setEditingRitiro(ritiro);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaved = (ritiro: Ritiro) => {
    reload();
    if (!editingRitiro) {
      setLabelRitiro(ritiro);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-header-bg text-header-foreground">
        <div className="container max-w-5xl py-6 flex items-center gap-3">
          <Smartphone className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Registro Ritiri Usato
            </h1>
            <p className="text-sm opacity-80">
              Gestione acquisti articoli elettronici usati
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">{ritiri.length}</p>
              <p className="text-xs text-muted-foreground">Ritiri totali</p>
            </div>
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Euro className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">€ {totale.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Totale speso</p>
            </div>
          </div>
        </div>

        <div ref={formRef} className="rounded-xl bg-card p-6 shadow-sm border">
          <RitiroForm
            onSaved={handleSaved}
            editingRitiro={editingRitiro}
            onCancelEdit={() => setEditingRitiro(null)}
          />
        </div>

        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, articolo, documento, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <RitiriTable ritiri={filtered} onChanged={reload} onEdit={handleEdit} />
        </div>
      </main>

      <EtichettaLabel
        ritiro={labelRitiro}
        open={!!labelRitiro}
        onClose={() => setLabelRitiro(null)}
      />
    </div>
  );
}
