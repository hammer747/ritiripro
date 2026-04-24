import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRitiri } from "@/lib/storage";
import { Ritiro } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginDialog, RegisteredUser } from "@/components/ui/login-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { clearToken } from "@/lib/storage";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export default function Grafico() {
  const navigate = useNavigate();
  const [ritiri, setRitiri] = useState<Ritiro[]>([]);
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

  useEffect(() => {
    if (!currentUser?.email) { navigate("/"); return; }
    reload();
  }, [currentUser, navigate, reload]);

  const anno = new Date().getFullYear();

  const datiMensili = useMemo(() => {
    return MESI.map((nome, i) => {
      const mese = i + 1;
      const delMese = ritiri.filter((r) => {
        const d = new Date(r.dataAcquisto);
        return d.getFullYear() === anno && d.getMonth() + 1 === mese;
      });
      const acquisti = delMese.reduce((s, r) => s + r.prezzo + (r.speseAggiuntive ?? []).reduce((a, v) => a + v.prezzo, 0), 0);
      const vendite = delMese
        .filter((r) => r.venduto && r.prezzoVendita !== undefined)
        .reduce((s, r) => s + (r.prezzoVendita ?? 0), 0);
      const guadagni = delMese
        .filter((r) => r.venduto && r.prezzoVendita !== undefined)
        .reduce((s, r) => s + ((r.prezzoVendita ?? 0) - r.prezzo), 0);
      return { nome, acquisti: Math.round(acquisti), vendite: Math.round(vendite), guadagni: Math.round(guadagni) };
    });
  }, [ritiri, anno]);

  return (
    <div className="min-h-screen">
      <header className="bg-header-bg text-header-foreground border-b shadow-sm">
        <div className="container max-w-5xl py-3 sm:py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" reloadDocument><img src="/logo.png" alt="RitiriPro" className="h-8 sm:h-12 w-auto object-contain cursor-pointer dark:invert" /></Link>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold tracking-tight">RitiriPro <span className="text-sm font-normal opacity-80">di Hammer Guerrero</span></h1>
              <p className="text-sm opacity-80">Gestione acquisti articoli elettronici usati</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LoginDialog
              currentUser={currentUser}
              onAuthSuccess={(user) => setCurrentUser(user)}
              onLogout={() => { clearToken(); localStorage.removeItem("ritiri_facili_user"); setCurrentUser(null); navigate("/"); }}
            />
            <Link to="/"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Home</span></Button></Link>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        <h2 className="text-xl font-bold">Grafico Vendite — {anno}</h2>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-4">Acquisti vs Vendite mensili (€)</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={datiMensili} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `€ ${v}`} />
              <Legend />
              <Bar dataKey="acquisti" name="Acquisti" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vendite" name="Vendite" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-4">Guadagno netto mensile (€)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datiMensili} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `€ ${v}`} />
              <Bar dataKey="guadagni" name="Guadagno netto" radius={[4, 4, 0, 0]}
                fill="#a78bfa"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}
