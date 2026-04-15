import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ritiro } from "@/lib/types";
import { saveRitiro, updateRitiro } from "@/lib/storage";
import { toast } from "sonner";
import { UserPlus, Pencil, Upload, X, FileText } from "lucide-react";

interface Props {
  onSaved: (ritiro: Ritiro) => void;
  editingRitiro?: Ritiro | null;
  onCancelEdit?: () => void;
}

const emptyForm = {
  nomeCliente: "",
  cognomeCliente: "",
  codiceFiscale: "",
  tipoDocumento: "",
  numeroDocumento: "",
  documentoIdentitaBase64: "",
  documentoIdentitaNome: "",
  tipoArticolo: "",
  articolo: "",
  descrizione: "",
  prezzo: "",
  pinDispositivo: "",
  dataAcquisto: new Date().toISOString().split("T")[0],
  note: "",
};

export default function RitiroForm({ onSaved, editingRitiro, onCancelEdit }: Props) {
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingRitiro;

  useEffect(() => {
    if (editingRitiro) {
      setForm({
        nomeCliente: editingRitiro.nomeCliente,
        cognomeCliente: editingRitiro.cognomeCliente,
        codiceFiscale: editingRitiro.codiceFiscale,
        tipoDocumento: editingRitiro.tipoDocumento,
        numeroDocumento: editingRitiro.numeroDocumento,
        documentoIdentitaBase64: editingRitiro.documentoIdentitaBase64 || "",
        documentoIdentitaNome: editingRitiro.documentoIdentitaNome || "",
        tipoArticolo: editingRitiro.tipoArticolo || "",
        articolo: editingRitiro.articolo,
        descrizione: editingRitiro.descrizione,
        prezzo: editingRitiro.prezzo.toString(),
        pinDispositivo: editingRitiro.pinDispositivo || "",
        dataAcquisto: editingRitiro.dataAcquisto,
        note: editingRitiro.note,
      });
    }
  }, [editingRitiro]);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Il file è troppo grande (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({
        ...f,
        documentoIdentitaBase64: reader.result as string,
        documentoIdentitaNome: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setForm((f) => ({ ...f, documentoIdentitaBase64: "", documentoIdentitaNome: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.nomeCliente.trim() ||
      !form.cognomeCliente.trim() ||
      !form.tipoArticolo ||
      !form.articolo.trim() ||
      !form.prezzo ||
      !form.tipoDocumento ||
      !form.numeroDocumento.trim()
    ) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const ritiro: Ritiro = {
      id: isEditing ? editingRitiro!.id : crypto.randomUUID(),
      nomeCliente: form.nomeCliente.trim(),
      cognomeCliente: form.cognomeCliente.trim(),
      codiceFiscale: form.codiceFiscale.trim().toUpperCase(),
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      documentoIdentitaBase64: form.documentoIdentitaBase64 || undefined,
      documentoIdentitaNome: form.documentoIdentitaNome || undefined,
      tipoArticolo: form.tipoArticolo as Ritiro["tipoArticolo"],
      articolo: form.articolo.trim(),
      descrizione: form.descrizione.trim(),
      prezzo: parseFloat(form.prezzo),
      pinDispositivo: form.pinDispositivo.trim() || undefined,
      dataAcquisto: form.dataAcquisto,
      note: form.note.trim(),
    };

    if (isEditing) {
      updateRitiro(ritiro);
      toast.success("Ritiro aggiornato con successo!");
      onCancelEdit?.();
    } else {
      saveRitiro(ritiro);
      toast.success("Ritiro registrato con successo!");
    }

    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onSaved(ritiro);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onCancelEdit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        {isEditing ? (
          <Pencil className="h-5 w-5 text-primary" />
        ) : (
          <UserPlus className="h-5 w-5 text-primary" />
        )}
        <h2 className="text-lg font-semibold text-foreground">
          {isEditing ? "Modifica Ritiro" : "Nuovo Ritiro"}
        </h2>
      </div>

      {/* Cliente */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-muted-foreground">
          Dati Cliente / Venditore
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={form.nomeCliente} onChange={(e) => set("nomeCliente", e.target.value)} placeholder="Mario" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cognome">Cognome *</Label>
            <Input id="cognome" value={form.cognomeCliente} onChange={(e) => set("cognomeCliente", e.target.value)} placeholder="Rossi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">Codice Fiscale</Label>
            <Input id="cf" value={form.codiceFiscale} onChange={(e) => set("codiceFiscale", e.target.value)} placeholder="RSSMRA80A01H501U" className="uppercase" maxLength={16} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo Documento *</Label>
            <Select value={form.tipoDocumento} onValueChange={(v) => set("tipoDocumento", v)}>
              <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carta_identita">Carta d'Identità</SelectItem>
                <SelectItem value="patente">Patente</SelectItem>
                <SelectItem value="passaporto">Passaporto</SelectItem>
                <SelectItem value="permesso_soggiorno">Permesso di Soggiorno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numdoc">Numero Documento *</Label>
            <Input id="numdoc" value={form.numeroDocumento} onChange={(e) => set("numeroDocumento", e.target.value)} placeholder="AX1234567" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Foto / Scan Documento</Label>
          {form.documentoIdentitaNome ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm truncate flex-1">{form.documentoIdentitaNome}</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Carica documento
              </Button>
            </div>
          )}
        </div>
      </fieldset>

      {/* Articolo */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-muted-foreground">
          Articolo Ritirato
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo Articolo *</Label>
            <Select value={form.tipoArticolo} onValueChange={(v) => set("tipoArticolo", v)}>
              <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="computer">Computer</SelectItem>
                <SelectItem value="console">Console</SelectItem>
                <SelectItem value="camera">Camera</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prezzo">Prezzo Acquisto (€) *</Label>
            <Input id="prezzo" type="number" step="0.01" min="0" value={form.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="150.00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prezzo">Prezzo Acquisto (€) *</Label>
            <Input id="prezzo" type="number" step="0.01" min="0" value={form.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="150.00" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN Dispositivo</Label>
            <Input id="pin" value={form.pinDispositivo} onChange={(e) => set("pinDispositivo", e.target.value)} placeholder="1234" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data Acquisto *</Label>
            <Input id="data" type="date" value={form.dataAcquisto} onChange={(e) => set("dataAcquisto", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descrizione / Condizioni</Label>
          <Textarea id="desc" value={form.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Graffi sul retro, batteria all'85%..." rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Note</Label>
          <Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Eventuali note..." />
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {isEditing ? "Salva Modifiche" : "Registra Ritiro"}
        </Button>
        {isEditing && (
          <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
