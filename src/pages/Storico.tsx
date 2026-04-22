import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getRitiri, formatCodiceRitiro } from "@/lib/storage";
import { Ritiro } from "@/lib/types";
import RitiriTable from "@/components/RitiriTable";
import EtichettaLabel from "@/components/EtichettaLabel";
import { generateMonthlyReport } from "@/lib/report";
import { Search, ArrowLeft, Package, Euro, FileDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginDialog, RegisteredUser } from "@/components/ui/login-dialog";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export default function Storico() {
  const navigate = useNavigate();
  const [ritiri, setRitiri] = useState<Ritiro[]>([]);
  const [search, setSearch] = useState("");
  const [meseFiltro, setMeseFiltro] = useState<string>("tutti");
  const [labelRitiro, setLabelRitiro] = useState<Ritiro | null>(null);
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("ritiri_facili_user") || "null");
      if (!parsed?.email) return null;
      const role = (parsed.role === "venditore" || parsed.role === "tecnico") ? parsed.role : "admin";
      return { ...parsed, role };
    } catch { return null; }
  });

  const reload = useCallback(() => {
    getRitiri().then(setRitiri).catch(() => setRitiri([]));
  }, []);

  useEffect(() => { reload(); }, [reload]);

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
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const codice = formatCodiceRitiro(r.numeroRitiro, r.dataAcquisto).toLowerCase();
        const nomeCompleto1 = `${r.nomeCliente} ${r.cognomeCliente}`.toLowerCase();
        const nomeCompleto2 = `${r.cognomeCliente} ${r.nomeCliente}`.toLowerCase();
        return (
          codice.includes(q) ||
          nomeCompleto1.includes(q) ||
          nomeCompleto2.includes(q) ||
          r.nomeCliente.toLowerCase().includes(q) ||
          r.cognomeCliente.toLowerCase().includes(q) ||
          r.articolo.toLowerCase().includes(q) ||
          (r.marcaModello || "").toLowerCase().includes(q) ||
          r.codiceFiscale.toLowerCase().includes(q) ||
          r.numeroDocumento.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [ritiri, search, meseFiltro]);

  const speseSum = (r: Ritiro) => (r.speseAggiuntive ?? []).reduce((s, v) => s + v.prezzo, 0);
  const totale = filtered.reduce((s, r) => s + r.prezzo + speseSum(r), 0);

  const formatMese = (key: string) => {
    const [anno, mese] = key.split("-").map(Number);
    return `${MESI[mese - 1]} ${anno}`;
  };

  return (
    <div className="min-h-screen">
      <header className="bg-header-bg text-header-foreground border-b shadow-sm">
        <div className="container max-w-5xl py-3 sm:py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" reloadDocument><img src="/logo.png" alt="Torino Hi-Tech" className="h-8 sm:h-12 w-auto object-contain cursor-pointer dark:invert" /></Link>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold tracking-tight">
                RitiriPro <span className="text-sm font-normal opacity-80">di Hammer Guerrero</span>
              </h1>
              <p className="text-sm opacity-80">Gestione acquisti articoli elettronici usati</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LoginDialog
              currentUser={currentUser}
              onAuthSuccess={(user) => setCurrentUser(user)}
              onLogout={() => {
                localStorage.removeItem("ritiri_facili_user");
                setCurrentUser(null);
                navigate("/");
              }}
            />
            <Link to="/">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-6">
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
              <p className="text-2xl font-bold text-stat-foreground">€ {Math.round(totale)}</p>
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
          <Button
            variant="outline"
            size="sm"
            disabled={meseFiltro === "tutti"}
            onClick={() => meseFiltro !== "tutti" && generateMonthlyReport(filtered, meseFiltro)}
          >
            <FileDown className="h-4 w-4 mr-1" /> Genera PDF
          </Button>
        </div>

        <RitiriTable
          ritiri={filtered}
          onChanged={reload}
          onEdit={(r) => navigate("/", { state: { editRitiro: r } })}
          onPrint={(r) => setLabelRitiro(r)}
          userRole={currentUser?.role}
        />
      </main>

      <EtichettaLabel
        ritiro={labelRitiro}
        open={!!labelRitiro}
        onClose={() => setLabelRitiro(null)}
      />
    </div>
  );
}
