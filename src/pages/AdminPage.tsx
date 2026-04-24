import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAdminUsers, createAdminUser, deleteAdminUser, SubUser, getAdminLogs, LogRecord, getToken } from "@/lib/storage";
import { RegisteredUser } from "@/components/ui/login-dialog";
import { ArrowLeft, Trash2, UserPlus, ShieldCheck, Store, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { API_BASE_URL } from "@/lib/api";

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentUser] = useState<RegisteredUser | null>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("ritiri_facili_user") || "null");
      if (!parsed?.email) return null;
      const role = parsed.role === "venditore" ? parsed.role : "admin";
      return { ...parsed, role };
    } catch { return null; }
  });

  const [users, setUsers] = useState<SubUser[]>([]);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState<"venditore">("venditore");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmUser, setConfirmUser] = useState<SubUser | null>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [togglingReg, setTogglingReg] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [u, l] = await Promise.all([getAdminUsers(), getAdminLogs()]);
      setUsers(u);
      setLogs(l);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") { navigate("/"); return; }
    void reload();
    fetch(`${API_BASE_URL}/api/auth/registration-status`)
      .then((r) => r.json())
      .then((d: { enabled: boolean }) => setRegistrationEnabled(d.enabled))
      .catch(() => {});
  }, [currentUser, navigate, reload]);

  const handleToggleRegistration = async (enabled: boolean) => {
    setTogglingReg(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          nome: currentUser?.nome ?? "",
          cognome: currentUser?.cognome ?? "",
          cel: currentUser?.cel ?? "",
          ditta: currentUser?.ditta ?? "",
          indirizzo: currentUser?.indirizzo ?? "",
          piva: currentUser?.piva ?? "",
          allowRegistration: String(enabled),
        }),
      });
      if (!res.ok) throw new Error();
      setRegistrationEnabled(enabled);
      toast.success(enabled ? "Registrazione attivata." : "Registrazione disattivata.");
    } catch {
      toast.error("Errore durante l'aggiornamento.");
    } finally {
      setTogglingReg(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !cognome.trim() || !email.trim() || !password.trim()) { setError("Tutti i campi sono obbligatori."); return; }
    setLoading(true);
    try {
      await createAdminUser({ nome: nome.trim(), cognome: cognome.trim(), email: email.trim().toLowerCase(), password, role });
      toast.success(`Utente ${role} creato con successo.`);
      setNome(""); setCognome(""); setEmail(""); setPassword(""); setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userEmail: string) => {
    try {
      await deleteAdminUser(userEmail);
      toast.success("Utente eliminato.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    }
  };

  const roleIcon = (_r: string) => <Store className="h-3.5 w-3.5" />;
  const roleLabel = (_r: string) => "Venditore";
  const roleColor = (_r: string) => "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";

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
            <Link to="/"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Home</span></Button></Link>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Gestione Utenti</h2>
          </div>
          <Button size="sm" onClick={() => { setShowForm((v) => !v); setError(""); }}>
            <UserPlus className="h-4 w-4 mr-1" /> Nuovo utente
          </Button>
        </div>

        <div className="rounded-lg border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Registrazione nuovi account</p>
              <p className="text-xs text-muted-foreground">
                {registrationEnabled ? "Il form di registrazione è visibile nella pagina di login" : "Il form di registrazione è nascosto"}
              </p>
            </div>
          </div>
          <Switch checked={registrationEnabled} onCheckedChange={handleToggleRegistration} disabled={togglingReg} />
        </div>

        {showForm && (
          <form onSubmit={(e) => void handleCreate(e)} className="rounded-lg border p-6 space-y-4 bg-card">
            <h3 className="font-semibold">Crea nuovo utente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mario" required />
              </div>
              <div className="space-y-1.5">
                <Label>Cognome</Label>
                <Input value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Rossi" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@esempio.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>Crea utente</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
            </div>
          </form>
        )}

        {users.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessun utente secondario. Crea un venditore con il pulsante sopra.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Ruolo</th>
                  <th className="w-12 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{u.cognome} {u.nome}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleColor(u.role)}`}>
                        {roleIcon(u.role)} {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmUser(u)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Attività recenti</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Data e ora</th>
                    <th className="text-left p-3 font-medium">Utente</th>
                    <th className="text-left p-3 font-medium">Ritiro</th>
                    <th className="text-left p-3 font-medium">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString("it-IT")}
                      </td>
                      <td className="p-3 font-medium">{l.userName}</td>
                      <td className="p-3 font-mono text-xs">{l.ritirodice || l.ritiroId?.slice(0, 8)}</td>
                      <td className="p-3 capitalize">{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmUser}
        title="Eliminare l'utente?"
        description={confirmUser ? `Stai per eliminare l'utente ${confirmUser.cognome} ${confirmUser.nome} (${confirmUser.email}). L'operazione è irreversibile.` : "Questa operazione è irreversibile."}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => { if (confirmUser) { void handleDelete(confirmUser.email); } setConfirmUser(null); }}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  );
}
