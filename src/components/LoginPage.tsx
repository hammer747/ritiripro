import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisteredUser } from "@/components/ui/login-dialog";
import { API_BASE_URL } from "@/lib/api";
import { ShinyButton } from "@/components/ui/shiny-button";

interface Props {
  onLogin: (user: RegisteredUser) => void;
}

const CURRENT_USER_KEY = "ritiri_facili_user";

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cel, setCel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email e password sono obbligatorie.");
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      let body: Record<string, string>;

      if (mode === "register") {
        if (!nome.trim() || !cognome.trim()) { setError("Nome e cognome sono obbligatori."); return; }
        body = { nome: nome.trim(), cognome: cognome.trim(), cel: cel.trim(), email: email.trim().toLowerCase(), password };
        res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        body = { email: email.trim().toLowerCase(), password };
        res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json() as RegisteredUser & { message?: string };
      if (!res.ok) { setError(data.message || "Errore"); return; }

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      onLogin(data);
    } catch {
      setError("Errore di connessione al server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="Torino Hi-Tech" className="h-24 w-auto object-contain" />
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Accedi al tuo account" : "Crea un nuovo account"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lp-nome">Nome</Label>
                    <Input id="lp-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mario" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lp-cognome">Cognome</Label>
                    <Input id="lp-cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Rossi" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lp-cel">Cellulare (facoltativo)</Label>
                  <Input id="lp-cel" type="tel" value={cel} onChange={(e) => setCel(e.target.value)} placeholder="+39 333 1234567" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="lp-email">Email</Label>
              <Input id="lp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@esempio.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lp-password">Password</Label>
              <Input id="lp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Attendere..." : mode === "login" ? "Accedi" : "Crea account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oppure</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Crea nuovo account" : "Hai già un account? Accedi"}
          </Button>
        </div>

        <ShinyButton className="w-full">RitiriPro di Hammer Guerrero</ShinyButton>
      </div>
    </div>
  );
}
