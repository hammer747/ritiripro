import { useState } from "react";
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
import { saveRitiro } from "@/lib/storage";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface Props {
  onSaved: () => void;
}

const emptyForm = {
  nomeCliente: "",
  cognomeCliente: "",
  codiceFiscale: "",
  tipoDocumento: "",
  numeroDocumento: "",
  articolo: "",
  descrizione: "",
  prezzo: "",
  dataAcquisto: new Date().toISOString().split("T")[0],
  note: "",
};

export default function RitiroForm({ onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.nomeCliente.trim() ||
      !form.cognomeCliente.trim() ||
      !form.articolo.trim() ||
      !form.prezzo ||
      !form.tipoDocumento ||
      !form.numeroDocumento.trim()
    ) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const ritiro: Ritiro = {
      id: crypto.randomUUID(),
      nomeCliente: form.nomeCliente.trim(),
      cognomeCliente: form.cognomeCliente.trim(),
      codiceFiscale: form.codiceFiscale.trim().toUpperCase(),
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      articolo: form.articolo.trim(),
      descrizione: form.descrizione.trim(),
      prezzo: parseFloat(form.prezzo),
      dataAcquisto: form.dataAcquisto,
      note: form.note.trim(),
    };

    saveRitiro(ritiro);
    setForm(emptyForm);
    toast.success("Ritiro registrato con successo!");
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Nuovo Ritiro
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
      </fieldset>

      {/* Articolo */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-muted-foreground">
          Articolo Ritirato
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="articolo">Articolo *</Label>
            <Input id="articolo" value={form.articolo} onChange={(e) => set("articolo", e.target.value)} placeholder="iPhone 13 Pro 128GB" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prezzo">Prezzo Acquisto (€) *</Label>
            <Input id="prezzo" type="number" step="0.01" min="0" value={form.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="150.00" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descrizione / Condizioni</Label>
          <Textarea id="desc" value={form.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Graffi sul retro, batteria all'85%..." rows={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="data">Data Acquisto *</Label>
            <Input id="data" type="date" value={form.dataAcquisto} onChange={(e) => set("dataAcquisto", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Eventuali note..." />
          </div>
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Registra Ritiro
      </Button>
    </form>
  );
}
