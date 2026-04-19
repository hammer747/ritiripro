import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RegisteredUser = {
  nome: string;
  cognome: string;
  cel?: string;
  email: string;
  password: string;
};

type LoginDialogProps = {
  currentUser?: RegisteredUser | null;
  onAuthSuccess?: (user: RegisteredUser) => void;
  onLogout?: () => void;
};

const CURRENT_USER_STORAGE_KEY = "ritiri_facili_user";
const USERS_STORAGE_KEY = "ritiri_facili_users";

function normalizeUser(value: unknown): RegisteredUser | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RegisteredUser>;
  const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : "";
  if (!email) return null;

  return {
    nome: typeof candidate.nome === "string" ? candidate.nome : "",
    cognome: typeof candidate.cognome === "string" ? candidate.cognome : "",
    cel: typeof candidate.cel === "string" ? candidate.cel : "",
    email,
    password: typeof candidate.password === "string" ? candidate.password : "",
  };
}

function readUsersFromStorage(): RegisteredUser[] {
  const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersRaw) return [];

  try {
    const parsed = JSON.parse(usersRaw) as unknown;
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(USERS_STORAGE_KEY);
      return [];
    }

    const normalized = parsed
      .map((entry) => normalizeUser(entry))
      .filter((entry): entry is RegisteredUser => !!entry);

    if (normalized.length !== parsed.length) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return [];
  }
}

export function LoginDialog({
  currentUser = null,
  onAuthSuccess = () => {},
  onLogout = () => {},
}: LoginDialogProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cel, setCel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [profileNome, setProfileNome] = useState("");
  const [profileCognome, setProfileCognome] = useState("");
  const [profileCel, setProfileCel] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (!isProfileOpen || !currentUser) return;
    setProfileMessage("");
    setProfileNome(currentUser.nome);
    setProfileCognome(currentUser.cognome);
    setProfileCel(currentUser.cel ?? "");
    setShowPasswordChange(false);
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
  }, [isProfileOpen, currentUser]);

  const resetRegisterFields = () => {
    setNome("");
    setCognome("");
    setCel("");
  };

  const handleToggleMode = () => {
    setError("");
    setIsRegisterMode((prev) => !prev);
    setPassword("");
    if (isRegisterMode) {
      resetRegisterFields();
    }
  };

  const handleSubmit = () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email e password sono obbligatorie.");
      return;
    }

    if (isRegisterMode) {
      if (!nome.trim() || !cognome.trim()) {
        setError("Nome e cognome sono obbligatori.");
        return;
      }

      const userToSave: RegisteredUser = {
        nome: nome.trim(),
        cognome: cognome.trim(),
        cel: cel.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      const users = readUsersFromStorage();

      const exists = users.some((u) => u.email === userToSave.email);
      if (exists) {
        setError("Esiste già un account con questa email.");
        return;
      }

      const updatedUsers = [...users, userToSave];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userToSave));
      onAuthSuccess(userToSave);
      setOpen(false);
      return;
    }

    const users = readUsersFromStorage();

    if (!users.length) {
      setError("Nessun account registrato. Clicca su Registrati.");
      return;
    }

    const found = users.find((u) => u.email === email.trim().toLowerCase());

    if (!found || found.password !== password) {
      setError("Credenziali non valide.");
      return;
    }

    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(found));
    onAuthSuccess(found);
    setOpen(false);
  };

  if (currentUser) {
    const handleSaveProfile = () => {
      if (!profileNome.trim() || !profileCognome.trim()) {
        setProfileMessage("Nome e cognome sono obbligatori.");
        return;
      }

      if (showPasswordChange) {
        if (!currentPasswordInput.trim() || !newPasswordInput.trim() || !confirmNewPasswordInput.trim()) {
          setProfileMessage("Compila tutti i campi password.");
          return;
        }

        if (currentPasswordInput !== currentUser.password) {
          setProfileMessage("La password attuale non è corretta.");
          return;
        }

        if (newPasswordInput === currentUser.password) {
          setProfileMessage("La nuova password deve essere diversa da quella attuale.");
          return;
        }

        if (newPasswordInput !== confirmNewPasswordInput) {
          setProfileMessage("La conferma della nuova password non coincide.");
          return;
        }
      }

      const updatedUser: RegisteredUser = {
        ...currentUser,
        nome: profileNome.trim(),
        cognome: profileCognome.trim(),
        cel: profileCel.trim(),
        password: showPasswordChange ? newPasswordInput : currentUser.password,
      };

      const users = readUsersFromStorage();

      const updatedUsers = users.map((u) =>
        u.email === currentUser.email ? updatedUser : u
      );

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      onAuthSuccess(updatedUser);
      setShowPasswordChange(false);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmNewPasswordInput("");
      setProfileMessage(
        showPasswordChange ? "Password cambiata correttamente." : "Profilo aggiornato con successo."
      );
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {currentUser.nome} {currentUser.cognome}
        </span>

        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="secondary">
              Profilo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profilo utente</DialogTitle>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-nome`}>Nome</Label>
                <Input
                  id={`${id}-profile-nome`}
                  type="text"
                  value={profileNome}
                  onChange={(e) => setProfileNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-cognome`}>Cognome</Label>
                <Input
                  id={`${id}-profile-cognome`}
                  type="text"
                  value={profileCognome}
                  onChange={(e) => setProfileCognome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-cel`}>Cellulare (facoltativo)</Label>
                <Input
                  id={`${id}-profile-cel`}
                  type="tel"
                  value={profileCel}
                  onChange={(e) => setProfileCel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-profile-email`}>Email</Label>
                <Input id={`${id}-profile-email`} type="email" value={currentUser.email} disabled />
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Sicurezza account</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const next = !showPasswordChange;
                      setShowPasswordChange(next);
                      if (!next) {
                        setCurrentPasswordInput("");
                        setNewPasswordInput("");
                        setConfirmNewPasswordInput("");
                      }
                      setProfileMessage("");
                    }}
                  >
                    {showPasswordChange ? "Nascondi cambio password" : "Cambia password"}
                  </Button>
                </div>

                {showPasswordChange ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${id}-profile-current-password`}>Password attuale</Label>
                      <Input
                        id={`${id}-profile-current-password`}
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Inserisci la password attuale"
                        required={showPasswordChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${id}-profile-new-password`}>Nuova password</Label>
                      <Input
                        id={`${id}-profile-new-password`}
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Inserisci la nuova password"
                        required={showPasswordChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${id}-profile-confirm-new-password`}>Conferma nuova password</Label>
                      <Input
                        id={`${id}-profile-confirm-new-password`}
                        type="password"
                        value={confirmNewPasswordInput}
                        onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                        placeholder="Conferma la nuova password"
                        required={showPasswordChange}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {profileMessage ? <p className="text-sm text-muted-foreground">{profileMessage}</p> : null}

              <Button type="submit" className="w-full">
                Salva modifiche
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Button type="button" size="sm" variant="outline" onClick={onLogout}>
          Esci
        </Button>
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
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <svg
              className="stroke-zinc-800 dark:stroke-zinc-100"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              {isRegisterMode ? "Crea il tuo account" : "Bentornato"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground sm:text-center">
              {isRegisterMode
                ? "Compila i dati per registrarti."
                : "Inserisci le tue credenziali per accedere al tuo account."}
            </p>
          </DialogHeader>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-nome`}>Nome</Label>
                  <Input
                    id={`${id}-nome`}
                    placeholder="Inserisci il tuo nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-cognome`}>Cognome</Label>
                  <Input
                    id={`${id}-cognome`}
                    placeholder="Inserisci il tuo cognome"
                    type="text"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-cel`}>Cellulare (facoltativo)</Label>
                  <Input
                    id={`${id}-cel`}
                    placeholder="Inserisci il tuo numero di cellulare"
                    type="tel"
                    value={cel}
                    onChange={(e) => setCel(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                placeholder="hi@yourcompany.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                placeholder="Inserisci la tua password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isRegisterMode ? (
            <div className="flex justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id={`${id}-remember`} />
                <Label htmlFor={`${id}-remember`} className="font-normal text-muted-foreground">
                  Ricordami
                </Label>
              </div>
              <a className="text-sm underline hover:no-underline" href="#">
                Password dimenticata?
              </a>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" className="w-full">
              {isRegisterMode ? "Crea account" : "Accedi"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleToggleMode}
            >
              {isRegisterMode ? "Torna ad accesso" : "Registrati"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
