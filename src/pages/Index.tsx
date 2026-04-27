import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { getRitiri, formatCodiceRitiro } from "@/lib/storage";
import { Ritiro } from "@/lib/types";
import RitiroForm from "@/components/RitiroForm";
import RitiriTable from "@/components/RitiriTable";
import EtichettaLabel from "@/components/EtichettaLabel";
import { generateRicevuta } from "@/lib/ricevuta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Package, Euro, List, TrendingUp, PlusCircle, BarChart2, ShieldCheck, Users } from "lucide-react";
import { MonthWheelPicker } from "@/components/MonthWheelPicker";
import { LoginDialog, RegisteredUser } from "@/components/ui/login-dialog";
import LoginPage from "@/components/LoginPage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReportReminderDialog, shouldShowReportReminder, markReportDone } from "@/components/ReportReminderDialog";
import { clearToken } from "@/lib/storage";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export default function Index() {
  const [ritiri, setRitiri] = useState<Ritiro[]>([]);
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    const raw = localStorage.getItem("ritiri_facili_user");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<RegisteredUser> | null;
      const email = typeof parsed?.email === "string" ? parsed.email.trim().toLowerCase() : "";

      if (!email) {
        localStorage.removeItem("ritiri_facili_user");
        return null;
      }

      const role = parsed?.role === "venditore" ? parsed.role : "admin";
      return {
        nome: typeof parsed?.nome === "string" ? parsed.nome : "",
        cognome: typeof parsed?.cognome === "string" ? parsed.cognome : "",
        cel: typeof parsed?.cel === "string" ? parsed.cel : undefined,
        email,
        role,
        ditta: typeof parsed?.ditta === "string" ? parsed.ditta : undefined,
        indirizzo: typeof parsed?.indirizzo === "string" ? parsed.indirizzo : undefined,
        piva: typeof parsed?.piva === "string" ? parsed.piva : undefined,
        allowRegistration: typeof parsed?.allowRegistration === "boolean" ? parsed.allowRegistration : undefined,
      };
    } catch {
      localStorage.removeItem("ritiri_facili_user");
      return null;
    }
  });
  const [showReportReminder, setShowReportReminder] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingRitiro, setEditingRitiro] = useState<Ritiro | null>(null);
  const [labelRitiro, setLabelRitiro] = useState<Ritiro | null>(null);
  const now = useMemo(() => new Date(), []);
  const [meseSelezionato, setMeseSelezionato] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const data = await getRitiri();
    setRitiri(data);
  }, []);

  useEffect(() => {
    if (!currentUser?.email) {
      setRitiri([]);
      return;
    }

    reload().catch(() => {
      setRitiri([]);
    });

    if (currentUser.role === "admin" && shouldShowReportReminder(currentUser.email)) {
      setShowReportReminder(true);
    }
  }, [reload, currentUser?.email]);

  useEffect(() => {
    const state = location.state as { editRitiro?: Ritiro } | null;
    if (state?.editRitiro) {
      setEditingRitiro(state.editRitiro);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Mesi disponibili in base ai ritiri esistenti (più mese corrente)
  const mesiDisponibili = useMemo(() => {
    const set = new Set<string>();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    ritiri.forEach((r) => {
      const d = new Date(r.dataAcquisto);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort().reverse();
  }, [ritiri, now]);

  // Ritiri filtrati per mese (per le statistiche)
  const ritiriDelMese = useMemo(() => {
    const [anno, mese] = meseSelezionato.split("-").map(Number);
    return ritiri.filter((r) => {
      const d = new Date(r.dataAcquisto);
      return d.getFullYear() === anno && d.getMonth() + 1 === mese;
    });
  }, [ritiri, meseSelezionato]);

  const speseSum = (r: Ritiro) => (r.speseAggiuntive ?? []).reduce((s, v) => s + v.prezzo, 0);
  const totaleMese = ritiriDelMese.reduce((s, r) => s + r.prezzo + speseSum(r), 0);

  const guadagniDelMese = useMemo(() => {
    const [anno, mese] = meseSelezionato.split("-").map(Number);
    return ritiri
      .filter((r) => {
        if (!r.venduto || r.prezzoVendita === undefined) return false;
        const dataRif = r.dataVendita ? new Date(r.dataVendita) : new Date(r.dataAcquisto);
        return dataRif.getFullYear() === anno && dataRif.getMonth() + 1 === mese;
      })
      .reduce((s, r) => s + ((r.prezzoVendita ?? 0) - r.prezzo), 0);
  }, [ritiri, meseSelezionato]);

  const filtered = useMemo(() => {
    const sorted = [...ritiri].sort(
      (a, b) => new Date(b.dataAcquisto).getTime() - new Date(a.dataAcquisto).getTime()
    );
    if (!search.trim()) return sorted.slice(0, 5);
    const q = search.trim().toLowerCase();
    return sorted.filter((r) => {
      const nomeCompleto1 = `${r.nomeCliente} ${r.cognomeCliente}`.toLowerCase();
      const nomeCompleto2 = `${r.cognomeCliente} ${r.nomeCliente}`.toLowerCase();
      return (
        nomeCompleto1.includes(q) ||
        nomeCompleto2.includes(q) ||
        r.nomeCliente.toLowerCase().includes(q) ||
        r.cognomeCliente.toLowerCase().includes(q) ||
        r.articolo.toLowerCase().includes(q) ||
        (r.marcaModello || "").toLowerCase().includes(q) ||
        r.codiceFiscale.toLowerCase().includes(q) ||
        r.numeroDocumento.toLowerCase().includes(q) ||
        (r.serialeImei || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        formatCodiceRitiro(r.numeroRitiro, r.dataAcquisto).toLowerCase().includes(q)
      );
    });
  }, [ritiri, search]);

  const handleEdit = (ritiro: Ritiro) => {
    setEditingRitiro(ritiro);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSaved = async (ritiro: Ritiro) => {
    setRitiri((prev) => {
      const idx = prev.findIndex((r) => r.id === ritiro.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = ritiro;
        return updated;
      }
      return [...prev, ritiro];
    });
    await reload();
    if (!editingRitiro) {
      setLabelRitiro(ritiro);
    }
  };

  const formatMese = (key: string) => {
    const [anno, mese] = key.split("-").map(Number);
    return `${MESI[mese - 1]} ${anno}`;
  };

  if (!currentUser) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); }} />;
  }

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
              <p className="text-sm opacity-80">
                Gestione acquisti articoli elettronici usati
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LoginDialog
              currentUser={currentUser}
              onAuthSuccess={(user) => setCurrentUser(user)}
              onLogout={() => {
                clearToken();
                localStorage.removeItem("ritiri_facili_user");
                setCurrentUser(null);
                setRitiri([]);
                setEditingRitiro(null);
                setLabelRitiro(null);
              }}
            />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <div className="rounded-lg bg-stat-bg p-4 flex items-center justify-center">
            <MonthWheelPicker
              value={meseSelezionato}
              options={mesiDisponibili}
              onChange={setMeseSelezionato}
            />
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">{ritiriDelMese.length}</p>
              <p className="text-xs text-muted-foreground">Ritiri del mese</p>
            </div>
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <Euro className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className="text-2xl font-bold text-stat-foreground">€ {Math.round(totaleMese)}</p>
              <p className="text-xs text-muted-foreground">Totale acquisti</p>
            </div>
          </div>
          <div className="rounded-lg bg-stat-bg p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-stat-foreground" />
            <div>
              <p className={`text-2xl font-bold ${guadagniDelMese >= 0 ? "text-stat-foreground" : "text-destructive"}`}>
                € {Math.round(guadagniDelMese)}
              </p>
              <p className="text-xs text-muted-foreground">Guadagni del mese</p>
            </div>
          </div>
        </div>

        {/* Nav tiles */}
        <div className="rounded-xl bg-card border shadow-sm p-6">
          <div className="grid grid-cols-2 gap-4">
            {(
              <button
                onClick={() => { setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 p-8 cursor-pointer"
              >
                <PlusCircle className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200" />
                <span className="text-base font-semibold">Registra Ritiro</span>
              </button>
            )}
            <button
              onClick={() => navigate("/storico")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 p-8 cursor-pointer"
            >
              <List className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200" />
              <span className="text-base font-semibold">Storico</span>
            </button>
            <button
              onClick={() => navigate("/grafico")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 p-8 cursor-pointer"
            >
              <BarChart2 className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200" />
              <span className="text-base font-semibold">Grafico Vendite</span>
            </button>
            <button
              onClick={() => navigate("/clienti")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 p-8 cursor-pointer"
            >
              <Users className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200" />
              <span className="text-base font-semibold">Registro Clienti</span>
            </button>
            {currentUser?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 p-8 cursor-pointer"
              >
                <ShieldCheck className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200" />
                <span className="text-base font-semibold">Gestione Utenti</span>
              </button>
            )}
          </div>
        </div>

        {/* Form (visibile solo quando richiesto) */}
        {showForm && (
          <div ref={formRef} className="rounded-xl bg-card p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Nuovo Ritiro</span>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingRitiro(null); }}>✕ Chiudi</Button>
            </div>
            <RitiroForm
              onSaved={(r) => { void handleSaved(r); if (!editingRitiro) setShowForm(false); }}
              editingRitiro={editingRitiro}
              onCancelEdit={() => { setEditingRitiro(null); setShowForm(false); }}
              nextNumeroRitiro={Math.max(0, ...ritiri.map((r) => r.numeroRitiro ?? 0)) + 1}
              ritiri={ritiri}
              userRole={currentUser?.role}
            />
          </div>
        )}

        {/* Ultimi ritiri + ricerca */}
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
          <RitiriTable
            ritiri={filtered}
            onChanged={() => { reload().catch(() => void 0); }}
            onEdit={(r) => { setEditingRitiro(r); setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }}
            onPrint={(r) => setLabelRitiro(r)}
            onRicevuta={(r) => {
              if (!currentUser) return;
              void generateRicevuta(r, {
                nome: currentUser.nome,
                cognome: currentUser.cognome,
                ditta: currentUser.ditta,
                indirizzo: currentUser.indirizzo,
                piva: currentUser.piva,
              });
            }}
            userRole={currentUser?.role}
          />
        </div>
      </main>

      <EtichettaLabel
        ritiro={labelRitiro}
        open={!!labelRitiro}
        onClose={() => setLabelRitiro(null)}
      />

      <ReportReminderDialog
        open={showReportReminder}
        onLater={() => setShowReportReminder(false)}
        onDone={() => { if (currentUser) markReportDone(currentUser.email); setShowReportReminder(false); }}
      />
    </div>
  );
}
