import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisteredUser } from "@/components/ui/login-dialog";

const CURRENT_USER_KEY = "ritiri_facili_user";
const USERS_KEY = "ritiri_facili_users";

function readUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is RegisteredUser =>
        !!u && typeof u === "object" && typeof (u as RegisteredUser).email === "string"
    );
  } catch {
    return [];
  }
}

interface Props {
  onLogin: (user: RegisteredUser) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cel, setCel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email e password sono obbligatorie.");
      return;
    }

    if (mode === "register") {
      if (!nome.trim() || !cognome.trim()) {
        setError("Nome e cognome sono obbligatori.");
        return;
      }
      const users = readUsers();
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalizedEmail)) {
        setError("Esiste già un account con questa email.");
        return;
      }
      const newUser: RegisteredUser = {
        nome: nome.trim(),
        cognome: cognome.trim(),
        cel: cel.trim() || undefined,
        email: normalizedEmail,
        password,
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      onLogin(newUser);
      return;
    }

    const users = readUsers();
    const found = users.find((u) => u.email === email.trim().toLowerCase());
    if (!found || found.password !== password) {
      setError("Credenziali non valide.");
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
    onLogin(found);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/logo.png"
            alt="Torino Hi-Tech"
            className="h-24 w-auto object-contain"
          />
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Accedi al tuo account" : "Crea un nuovo account"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lp-nome">Nome *</Label>
                    <Input id="lp-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mario" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lp-cognome">Cognome *</Label>
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
              <Label htmlFor="lp-email">Email *</Label>
              <Input id="lp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@esempio.com" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lp-password">Password *</Label>
              <Input id="lp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full">
              {mode === "login" ? "Accedi" : "Crea account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oppure</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Crea nuovo account" : "Hai già un account? Accedi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
