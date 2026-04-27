import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginDialog, RegisteredUser } from "@/components/ui/login-dialog";
import { getClients, deleteClient, ClientRecord, clearToken } from "@/lib/storage";
import { ArrowLeft, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const DOC_LABELS: Record<string, string> = {
  carta_identita: "C.I.",
  patente: "Patente",
  passaporto: "Passaporto",
  permesso_soggiorno: "P. Soggiorno",
};

export default function Clienti() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("ritiri_facili_user") || "null");
      if (!parsed?.email) return null;
      const role = parsed.role === "venditore" ? parsed.role : "admin";
      return { ...parsed, role };
    } catch { return null; }
  });

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [confirmClient, setConfirmClient] = useState<ClientRecord | null>(null);

  const reload = useCallback(async (q?: string) => {
    try {
      const data = await getClients(q);
      setClients(data);
    } catch { setClients([]); }
  }, []);

  useEffect(() => {
    if (!currentUser?.email) { navigate("/"); return; }
    void reload();
  }, [currentUser, navigate, reload]);

  useEffect(() => {
    const t = setTimeout(() => void reload(search), 300);
    return () => clearTimeout(t);
  }, [search, reload]);

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      toast.success("Cliente eliminato.");
      void reload(search);
    } catch { toast.error("Errore durante l'eliminazione."); }
  };

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

      <main className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Registro Clienti</h2>
            <span className="text-sm text-muted-foreground ml-1">({clients.length})</span>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, cognome, codice fiscale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {clients.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            {search ? "Nessun cliente trovato." : "Nessun cliente registrato. I clienti vengono salvati automaticamente al primo ritiro."}
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Codice Fiscale</th>
                  <th className="text-left p-3 font-medium">Documento</th>
                  <th className="text-left p-3 font-medium">Telefono</th>
                  <th className="w-12 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold">{c.cognome} {c.nome}</td>
                    <td className="p-3 font-mono text-xs">{c.codiceFiscale || "—"}</td>
                    <td className="p-3 text-sm">
                      <span className="font-medium">{DOC_LABELS[c.tipoDocumento] ?? c.tipoDocumento}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{c.numeroDocumento}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.telefono || "—"}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmClient(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmClient}
        title="Eliminare il cliente?"
        description={confirmClient ? `Stai per eliminare ${confirmClient.cognome} ${confirmClient.nome} dal registro. I ritiri associati non verranno eliminati.` : ""}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => { if (confirmClient) void handleDelete(confirmClient.id); setConfirmClient(null); }}
        onCancel={() => setConfirmClient(null)}
      />
    </div>
  );
}
