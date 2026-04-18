import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getRitiri } from "@/lib/storage";
import { Ritiro } from "@/lib/types";
import RitiriTable from "@/components/RitiriTable";
import { Search, Smartphone, ArrowLeft, Package, Euro } from "lucide-react";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export default function Storico() {
  const [ritiri, setRitiri] = useState<Ritiro[]>(getRitiri);
  const [search, setSearch] = useState("");
  const [meseFiltro, setMeseFiltro] = useState<string>("tutti");

  const reload = useCallback(() => setRitiri(getRitiri()), []);

  const mesiDisponibili = useMemo(() => {
    const set = new Set<string>();
    ritiri.forEach((r) => {
      const d = new Date(r.dataAcquisto);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort().reverse();
  }, [ritiri]);

  const filtered = useMemo(() => {
    let list = [...ritiri].sort(
      (a, b) => new Date(b.dataAcquisto).getTime() - new Date(a.dataAcquisto).getTime()
    );

    if (meseFiltro !== "tutti") {
      const [anno, mese] = meseFiltro.split("-").map(Number);
      list = list.filter((r) => {
        const d = new Date(r.dataAcquisto);
        return d.getFullYear() === anno && d.getMonth() + 1 === mese;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.nomeCliente.toLowerCase().includes(q) ||
          r.cognomeCliente.toLowerCase().includes(q) ||
          r.articolo.toLowerCase().includes(q) ||
          (r.marcaModello || "").toLowerCase().includes(q) ||
          r.codiceFiscale.toLowerCase().includes(q) ||
          r.numeroDocumento.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ritiri, search, meseFiltro]);

  const totale = filtered.reduce((s, r) => s + r.prezzo, 0);

  const formatMese = (key: string) => {
    const [anno, mese] = key.split("-").map(Number);
    return `${MESI[mese - 1]} ${anno}`;
  };

  return (
    <div className="min-h-screen">
      <header className="bg-header-bg text-header-foreground">
        <div className="container max-w-6xl py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Storico Ritiri</h1>
              <p className="text-sm opacity-80">Tutti i ritiri registrati</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-6xl py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Ritiri visualizzati</p>
            </div>
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Euro className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">€ {totale.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Totale visualizzato</p>
            </div>
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">{ritiri.length}</p>
              <p className="text-xs text-muted-foreground">Totale ritiri (tutti)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, articolo, modello, documento, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={meseFiltro} onValueChange={setMeseFiltro}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filtra per mese" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti i mesi</SelectItem>
              {mesiDisponibili.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMese(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <RitiriTable ritiri={filtered} onChanged={reload} onEdit={() => { /* edit only on Home */ }} />
      </main>
    </div>
  );
}
