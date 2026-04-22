import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { ChevronDown, LogOut, UserCog, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export type UserRole = "admin" | "venditore" | "tecnico";

export type RegisteredUser = {
  nome: string;
  cognome: string;
  cel?: string;
  email: string;
  role: UserRole;
  ditta?: string;
  indirizzo?: string;
  piva?: string;
  allowRegistration?: boolean;
};

type LoginDialogProps = {
  currentUser?: RegisteredUser | null;
  onAuthSuccess?: (user: RegisteredUser) => void;
  onLogout?: () => void;
};

const CURRENT_USER_KEY = "ritiri_facili_user";

async function apiPost<T>(path: string, body: Record<string, string>, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { message?: string } & T;
  if (!res.ok) throw new Error((data as { message?: string }).message || "Errore");
  return data as T;
}

async function apiPut<T>(path: string, body: Record<string, string>, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { message?: string } & T;
  if (!res.ok) throw new Error((data as { message?: string }).message || "Errore");
  return data as T;
}

export function LoginDialog({
  currentUser = null,
  onAuthSuccess = () => {},
  onLogout = () => {},
}: LoginDialogProps) {
  const id = useId();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    if (currentUser) return;
    fetch(`${API_BASE_URL}/api/auth/registration-status`)
      .then((r) => r.json())
      .then((d: { enabled: boolean }) => setRegistrationEnabled(d.enabled))
      .catch(() => setRegistrationEnabled(true));
  }, [currentUser]);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cel, setCel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [profileNome, setProfileNome] = useState("");
  const [profileCognome, setProfileCognome] = useState("");
  const [profileCel, setProfileCel] = useState("");
  const [profileDitta, setProfileDitta] = useState("");
  const [profileIndirizzo, setProfileIndirizzo] = useState("");
  const [profilePiva, setProfilePiva] = useState("");
  const [profileAllowRegistration, setProfileAllowRegistration] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");

  useEffect(() => {
    if (!open) { setError(""); setPassword(""); }
  }, [open]);

  useEffect(() => {
    if (!isProfileOpen || !currentUser) return;
    setProfileError("");
    setProfileNome(currentUser.nome);
    setProfileCognome(currentUser.cognome);
    setProfileCel(currentUser.cel ?? "");
    setProfileDitta(currentUser.ditta ?? "");
    setProfileIndirizzo(currentUser.indirizzo ?? "");
    setProfilePiva(currentUser.piva ?? "");
    setProfileAllowRegistration(currentUser.allowRegistration !== false);
    setShowPasswordChange(false);
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
  }, [isProfileOpen, currentUser]);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Email e password sono obbligatorie."); return; }

    setLoading(true);
    try {
      if (isRegisterMode) {
        if (!nome.trim() || !cognome.trim()) { setError("Nome e cognome sono obbligatori."); return; }
        const user = await apiPost<RegisteredUser>("/api/auth/register", { nome: nome.trim(), cognome: cognome.trim(), cel: cel.trim(), email: email.trim().toLowerCase(), password });
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        onAuthSuccess(user);
        setOpen(false);
      } else {
        const user = await apiPost<RegisteredUser>("/api/auth/login", { email: email.trim().toLowerCase(), password });
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        onAuthSuccess(user);
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    const handleSaveProfile = async () => {
      setProfileError("");
      if (!profileNome.trim() || !profileCognome.trim()) { setProfileError("Nome e cognome sono obbligatori."); return; }
      if (showPasswordChange) {
        if (!currentPasswordInput.trim() || !newPasswordInput.trim() || !confirmNewPasswordInput.trim()) { setProfileError("Compila tutti i campi password."); return; }
        if (newPasswordInput !== confirmNewPasswordInput) { setProfileError("La conferma della nuova password non coincide."); return; }
      }

      setLoading(true);
      try {
        const body: Record<string, string> = { nome: profileNome.trim(), cognome: profileCognome.trim(), cel: profileCel.trim(), ditta: profileDitta.trim(), indirizzo: profileIndirizzo.trim(), piva: profilePiva.trim(), allowRegistration: String(profileAllowRegistration) };
        if (showPasswordChange) { body.currentPassword = currentPasswordInput; body.newPassword = newPasswordInput; }
        const updated = await apiPut<RegisteredUser>("/api/auth/profile", body, { "x-user-email": currentUser.email });
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
        onAuthSuccess(updated);
        setIsProfileOpen(false);
        toast.success(showPasswordChange ? "Password cambiata correttamente." : "Profilo aggiornato con successo.");
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Errore");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="secondary" className="flex items-center gap-1">
              Profilo <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-b mb-1">
              {currentUser.nome} {currentUser.cognome}
              <span className={`ml-2 font-semibold capitalize ${currentUser.role === "admin" ? "text-primary" : currentUser.role === "venditore" ? "text-blue-500" : "text-purple-500"}`}>
                · {currentUser.role}
              </span>
            </div>
            <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
              <UserCog className="h-4 w-4 mr-2" /> Modifica profilo
            </DropdownMenuItem>
            {currentUser.role === "admin" && (
              <DropdownMenuItem onSelect={() => navigate("/admin")}>
                <ShieldCheck className="h-4 w-4 mr-2" /> Gestione utenti
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Profilo utente</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSaveProfile(); }}>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-nome`}>Nome</Label>
                <Input id={`${id}-profile-nome`} value={profileNome} onChange={(e) => setProfileNome(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-cognome`}>Cognome</Label>
                <Input id={`${id}-profile-cognome`} value={profileCognome} onChange={(e) => setProfileCognome(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-cel`}>Cellulare</Label>
                <Input id={`${id}-profile-cel`} type="tel" value={profileCel} onChange={(e) => setProfileCel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-ditta`}>Ditta</Label>
                <Input id={`${id}-profile-ditta`} value={profileDitta} onChange={(e) => setProfileDitta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-indirizzo`}>Indirizzo</Label>
                <Input id={`${id}-profile-indirizzo`} value={profileIndirizzo} onChange={(e) => setProfileIndirizzo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-piva`}>P.Iva</Label>
                <Input id={`${id}-profile-piva`} value={profilePiva} onChange={(e) => setProfilePiva(e.target.value)} />
              </div>
              {currentUser.role === "admin" && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Registrazione nuovi account</p>
                    <p className="text-xs text-muted-foreground">{profileAllowRegistration ? "Il form di registrazione è visibile" : "Il form di registrazione è nascosto"}</p>
                  </div>
                  <Switch checked={profileAllowRegistration} onCheckedChange={setProfileAllowRegistration} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={currentUser.email} disabled />
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Sicurezza account</p>
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setShowPasswordChange((p) => !p); setCurrentPasswordInput(""); setNewPasswordInput(""); setConfirmNewPasswordInput(""); setProfileError(""); }}>
                    {showPasswordChange ? "Nascondi cambio password" : "Cambia password"}
                  </Button>
                </div>
                {showPasswordChange && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${id}-cur-pw`}>Password attuale</Label>
                      <Input id={`${id}-cur-pw`} type="password" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} placeholder="Password attuale" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${id}-new-pw`}>Nuova password</Label>
                      <Input id={`${id}-new-pw`} type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="Nuova password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${id}-conf-pw`}>Conferma nuova password</Label>
                      <Input id={`${id}-conf-pw`} type="password" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} placeholder="Conferma nuova password" />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-destructive min-h-[1.25rem]">{profileError}</p>
              <Button type="submit" className="w-full" disabled={loading}>Salva modifiche</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Accedi</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border" aria-hidden="true">
            <svg className="stroke-zinc-800 dark:stroke-zinc-100" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">{isRegisterMode ? "Crea il tuo account" : "Bentornato"}</DialogTitle>
            <p className="text-sm text-muted-foreground sm:text-center">
              {isRegisterMode ? "Compila i dati per registrarti." : "Inserisci le tue credenziali per accedere."}
            </p>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          <div className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-nome`}>Nome</Label>
                  <Input id={`${id}-nome`} placeholder="Mario" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-cognome`}>Cognome</Label>
                  <Input id={`${id}-cognome`} placeholder="Rossi" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-cel`}>Cellulare (facoltativo)</Label>
                  <Input id={`${id}-cel`} type="tel" placeholder="+39 333 1234567" value={cel} onChange={(e) => setCel(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input id={`${id}-email`} type="email" placeholder="mario@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input id={`${id}-password`} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          {!isRegisterMode && (
            <div className="flex justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id={`${id}-remember`} />
                <Label htmlFor={`${id}-remember`} className="font-normal text-muted-foreground">Ricordami</Label>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className={registrationEnabled ? "grid grid-cols-2 gap-2" : ""}>
            <Button type="submit" className="w-full" disabled={loading}>{isRegisterMode ? "Crea account" : "Accedi"}</Button>
            {registrationEnabled && (
              <Button type="button" variant="secondary" className="w-full" onClick={() => { setIsRegisterMode((p) => !p); setError(""); setPassword(""); }}>
                {isRegisterMode ? "Torna ad accesso" : "Registrati"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
