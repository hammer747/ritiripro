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
import { saveRitiro, updateRitiro, formatCodiceRitiro } from "@/lib/storage";
import { toast } from "sonner";
import { UserPlus, Pencil, Upload, X, FileText, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  onSaved: (ritiro: Ritiro) => void;
  editingRitiro?: Ritiro | null;
  onCancelEdit?: () => void;
  nextNumeroRitiro?: number;
}

const emptyForm = {
  nomeCliente: "",
  cognomeCliente: "",
  codiceFiscale: "",
  telefonoCliente: "",
  tipoDocumento: "",
  numeroDocumento: "",
  documentoFronteBase64: "",
  documentoFronteNome: "",
  documentoRetroBase64: "",
  documentoRetroNome: "",
  ricevutaAcquistoBase64: "",
  ricevutaAcquistoNome: "",
  tipoArticolo: "",
  marcaModello: "",
  serialeImei: "",
  articolo: "",
  descrizione: "",
  prezzo: "",
  prezzoVendita: "",
  venduto: false,
  dataVendita: "",
  pinDispositivo: "",
  dataAcquisto: new Date().toISOString().split("T")[0],
  note: "",
};

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function RitiroForm({ onSaved, editingRitiro, onCancelEdit, nextNumeroRitiro }: Props) {
  const [form, setForm] = useState(emptyForm);
  const fileFronteRef = useRef<HTMLInputElement>(null);
  const fileRetroRef = useRef<HTMLInputElement>(null);
  const fileRicevutaRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingRitiro;

  useEffect(() => {
    if (editingRitiro) {
      setForm({
        nomeCliente: editingRitiro.nomeCliente,
        cognomeCliente: editingRitiro.cognomeCliente,
        codiceFiscale: editingRitiro.codiceFiscale,
        telefonoCliente: editingRitiro.telefonoCliente || "",
        tipoDocumento: editingRitiro.tipoDocumento,
        numeroDocumento: editingRitiro.numeroDocumento,
        documentoFronteBase64: editingRitiro.documentoFronteBase64 || "",
        documentoFronteNome: editingRitiro.documentoFronteNome || "",
        documentoRetroBase64: editingRitiro.documentoRetroBase64 || "",
        documentoRetroNome: editingRitiro.documentoRetroNome || "",
        ricevutaAcquistoBase64: editingRitiro.ricevutaAcquistoBase64 || "",
        ricevutaAcquistoNome: editingRitiro.ricevutaAcquistoNome || "",
        tipoArticolo: editingRitiro.tipoArticolo || "",
        marcaModello: editingRitiro.marcaModello || "",
        serialeImei: editingRitiro.serialeImei || "",
        articolo: editingRitiro.articolo,
        descrizione: editingRitiro.descrizione,
        prezzo: editingRitiro.prezzo.toString(),
        prezzoVendita: editingRitiro.prezzoVendita?.toString() || "",
        venduto: editingRitiro.venduto || false,
        dataVendita: editingRitiro.dataVendita || "",
        pinDispositivo: editingRitiro.pinDispositivo || "",
        dataAcquisto: editingRitiro.dataAcquisto,
        note: editingRitiro.note,
      });
    }
  }, [editingRitiro]);

  const capitalizeFirstLetter = (value: string) => {
    return value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const compressImage = (file: File, maxWidth = 1280, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas non disponibile"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Immagine non valida"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Lettura file fallita"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (side: "fronte" | "retro") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sono accettati solo file fotografici (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Il file è troppo grande (max 5MB)");
      return;
    }
    try {
      const compressed = await compressImage(file);
      const base64Key = side === "fronte" ? "documentoFronteBase64" : "documentoRetroBase64";
      const nomeKey = side === "fronte" ? "documentoFronteNome" : "documentoRetroNome";
      setForm((f) => ({
        ...f,
        [base64Key]: compressed,
        [nomeKey]: file.name,
      }));
    } catch {
      toast.error("Errore durante l'elaborazione dell'immagine");
    }
  };

  const removeFile = (side: "fronte" | "retro") => {
    const base64Key = side === "fronte" ? "documentoFronteBase64" : "documentoRetroBase64";
    const nomeKey = side === "fronte" ? "documentoFronteNome" : "documentoRetroNome";
    setForm((f) => ({ ...f, [base64Key]: "", [nomeKey]: "" }));
    const ref = side === "fronte" ? fileFronteRef : fileRetroRef;
    if (ref.current) ref.current.value = "";
  };

  const handleRicevutaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Sono accettati solo file fotografici o PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Il file è troppo grande (max 5MB)");
      return;
    }
    if (isImage) {
      try {
        const compressed = await compressImage(file);
        setForm((f) => ({ ...f, ricevutaAcquistoBase64: compressed, ricevutaAcquistoNome: file.name }));
      } catch {
        toast.error("Errore durante l'elaborazione dell'immagine");
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({
        ...f,
        ricevutaAcquistoBase64: reader.result as string,
        ricevutaAcquistoNome: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeRicevuta = () => {
    setForm((f) => ({ ...f, ricevutaAcquistoBase64: "", ricevutaAcquistoNome: "" }));
    if (fileRicevutaRef.current) fileRicevutaRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[RitiroForm] handleSubmit triggered", { form });

    if (
      !form.nomeCliente.trim() ||
      !form.cognomeCliente.trim() ||
      !form.tipoArticolo ||
      !form.prezzo ||
      !form.tipoDocumento ||
      !form.numeroDocumento.trim()
    ) {
      console.warn("[RitiroForm] validation failed", {
        nomeCliente: form.nomeCliente,
        cognomeCliente: form.cognomeCliente,
        tipoArticolo: form.tipoArticolo,
        prezzo: form.prezzo,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
      });
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const ritiro: Ritiro = {
      id: isEditing ? editingRitiro!.id : generateUUID(),
      nomeCliente: form.nomeCliente.trim(),
      cognomeCliente: form.cognomeCliente.trim(),
      codiceFiscale: form.codiceFiscale.trim().toUpperCase(),
      telefonoCliente: form.telefonoCliente.trim() || undefined,
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      documentoFronteBase64: form.documentoFronteBase64 || undefined,
      documentoFronteNome: form.documentoFronteNome || undefined,
      documentoRetroBase64: form.documentoRetroBase64 || undefined,
      documentoRetroNome: form.documentoRetroNome || undefined,
      ricevutaAcquistoBase64: form.ricevutaAcquistoBase64 || undefined,
      ricevutaAcquistoNome: form.ricevutaAcquistoNome || undefined,
      tipoArticolo: form.tipoArticolo as Ritiro["tipoArticolo"],
      marcaModello: form.marcaModello.trim() || undefined,
      serialeImei: form.serialeImei.trim() || undefined,
      articolo: form.articolo.trim(),
      descrizione: form.descrizione.trim(),
      prezzo: parseFloat(form.prezzo),
      prezzoVendita: form.venduto && form.prezzoVendita ? parseFloat(form.prezzoVendita) : undefined,
      venduto: form.venduto,
      dataVendita: form.venduto ? form.dataVendita || undefined : undefined,
      pinDispositivo: form.pinDispositivo.trim() || undefined,
      dataAcquisto: form.dataAcquisto,
      note: form.note.trim(),
    };

    try {
      console.log("[RitiroForm] calling API...", { isEditing });
      let saved: Ritiro;
      if (isEditing) {
        saved = await updateRitiro(ritiro);
        console.log("[RitiroForm] updateRitiro succeeded", saved);
        toast.success("Ritiro aggiornato con successo!");
        onCancelEdit?.();
      } else {
        saved = await saveRitiro(ritiro);
        console.log("[RitiroForm] saveRitiro succeeded", saved);
        toast.success("Ritiro registrato con successo!");
      }

      setForm(emptyForm);
      if (fileFronteRef.current) fileFronteRef.current.value = "";
      if (fileRetroRef.current) fileRetroRef.current.value = "";
      if (fileRicevutaRef.current) fileRicevutaRef.current.value = "";
      await onSaved(saved);
    } catch (err) {
      console.error("[RitiroForm] error during save:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    if (fileFronteRef.current) fileFronteRef.current.value = "";
    if (fileRetroRef.current) fileRetroRef.current.value = "";
    if (fileRicevutaRef.current) fileRicevutaRef.current.value = "";
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
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Numero di Telefono</Label>
            <Input id="telefono" type="tel" value={form.telefonoCliente} onChange={(e) => set("telefonoCliente", e.target.value)} placeholder="+39 333 1234567" />
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
        <div className="space-y-3">
          <Label>Foto / Scan Documento (max 5MB per file)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fronte */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Fronte</p>
              {form.documentoFronteBase64 ? (
                <div className="rounded-md border bg-muted/50 p-2 space-y-2">
                  {(form.documentoFronteBase64.startsWith("data:image") || form.documentoFronteBase64.startsWith("http")) && (
                    <img src={form.documentoFronteBase64} alt="Fronte documento" className="max-h-32 rounded-md object-contain border w-full" />
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-xs truncate flex-1">{form.documentoFronteNome}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(form.documentoFronteBase64, form.documentoFronteNome || "fronte")}><Download className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile("fronte")}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input ref={fileFronteRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/heic" onChange={handleFileChange("fronte")} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileFronteRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Carica fronte
                  </Button>
                </div>
              )}
            </div>
            {/* Retro */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Retro</p>
              {form.documentoRetroBase64 ? (
                <div className="rounded-md border bg-muted/50 p-2 space-y-2">
                  {(form.documentoRetroBase64.startsWith("data:image") || form.documentoRetroBase64.startsWith("http")) && (
                    <img src={form.documentoRetroBase64} alt="Retro documento" className="max-h-32 rounded-md object-contain border w-full" />
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-xs truncate flex-1">{form.documentoRetroNome}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(form.documentoRetroBase64, form.documentoRetroNome || "retro")}><Download className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile("retro")}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input ref={fileRetroRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/heic" onChange={handleFileChange("retro")} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRetroRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Carica retro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Articolo */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-muted-foreground">
          Articolo Ritirato
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="numeroRitiro">Numero Ritiro</Label>
          <Input
            id="numeroRitiro"
            value={
              isEditing && editingRitiro?.numeroRitiro
                ? formatCodiceRitiro(editingRitiro.numeroRitiro, editingRitiro.dataAcquisto)
                : nextNumeroRitiro
                ? formatCodiceRitiro(nextNumeroRitiro, form.dataAcquisto)
                : "Auto-generato"
            }
            readOnly
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marcaModello">Marca e Modello</Label>
          <Input id="marcaModello" value={form.marcaModello} onChange={(e) => set("marcaModello", capitalizeFirstLetter(e.target.value))} placeholder="Samsung Galaxy S24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="serialeImei">Seriale / IMEI</Label>
            <Input id="serialeImei" value={form.serialeImei} onChange={(e) => set("serialeImei", e.target.value)} placeholder="356938035643809" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN Dispositivo</Label>
            <Input id="pin" value={form.pinDispositivo} onChange={(e) => set("pinDispositivo", e.target.value)} placeholder="1234" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data Acquisto *</Label>
            <Input id="data" type="date" value={form.dataAcquisto} onChange={(e) => set("dataAcquisto", e.target.value)} className="w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="venduto"
            checked={form.venduto}
            onCheckedChange={(checked) =>
              setForm((f) => ({
                ...f,
                venduto: !!checked,
                prezzoVendita: checked ? f.prezzoVendita : "",
                dataVendita: checked ? new Date().toISOString().split("T")[0] : "",
              }))
            }
          />
          <Label htmlFor="venduto" className="cursor-pointer">Articolo venduto</Label>
        </div>
        {form.venduto && (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prezzoVendita">Prezzo di Vendita (€) *</Label>
                <Input id="prezzoVendita" type="number" step="0.01" min="0" value={form.prezzoVendita} onChange={(e) => set("prezzoVendita", e.target.value)} placeholder="250.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataVendita">Data Vendita *</Label>
                <Input id="dataVendita" type="date" value={form.dataVendita} onChange={(e) => set("dataVendita", e.target.value)} />
              </div>
            </div>
            {form.prezzo && form.prezzoVendita && (
              <p className="text-sm text-muted-foreground">
                Margine: <span className={parseFloat(form.prezzoVendita) - parseFloat(form.prezzo) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  € {(parseFloat(form.prezzoVendita) - parseFloat(form.prezzo)).toFixed(2)}
                </span>
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descrizione / Condizioni</Label>
          <Textarea id="desc" value={form.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Graffi sul retro, batteria all'85%..." rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Note</Label>
          <Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Eventuali note..." />
        </div>

        <div className="space-y-2">
          <Label>Ricevuta di Acquisto (foto o PDF, max 5MB)</Label>
          {form.ricevutaAcquistoBase64 ? (
            <div className="rounded-md border bg-muted/50 p-2 space-y-2">
              {(form.ricevutaAcquistoBase64.startsWith("data:image") || form.ricevutaAcquistoBase64.startsWith("http")) ? (
                <img src={form.ricevutaAcquistoBase64} alt="Ricevuta acquisto" className="max-h-40 rounded-md object-contain border w-full" />
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <span className="text-sm">Documento PDF</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-xs truncate flex-1">{form.ricevutaAcquistoNome}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(form.ricevutaAcquistoBase64, form.ricevutaAcquistoNome || "ricevuta")}><Download className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeRicevuta}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ) : (
            <div>
              <input ref={fileRicevutaRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,application/pdf" onChange={handleRicevutaChange} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRicevutaRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Carica ricevuta
              </Button>
            </div>
          )}
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
