import { useState, useEffect, useRef } from "react";
import heic2any from "heic2any";
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
import { saveRitiro, updateRitiro, markRitiroAsSold, unmarkRitiroAsSold, formatCodiceRitiro } from "@/lib/storage";
import { toast } from "sonner";
import { UserPlus, Pencil, Upload, X, FileText, Download, Plus, Trash2 } from "lucide-react";
import { SpeseAggiuntiva } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  onSaved: (ritiro: Ritiro) => void;
  editingRitiro?: Ritiro | null;
  onCancelEdit?: () => void;
  nextNumeroRitiro?: number;
  ritiri?: Ritiro[];
  userRole?: "admin" | "venditore" | "tecnico";
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

type SpeseVoce = { mode: "manuale" | "automatico"; descrizione: string; prezzo: string; ritiroId: string };

export default function RitiroForm({ onSaved, editingRitiro, onCancelEdit, nextNumeroRitiro, ritiri = [], userRole = "admin" }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [speseVoci, setSpeseVoci] = useState<SpeseVoce[]>([]);
  const [removedRitiroIds, setRemovedRitiroIds] = useState<string[]>([]);
  const fileFronteRef = useRef<HTMLInputElement>(null);
  const fileRetroRef = useRef<HTMLInputElement>(null);
  const fileRicevutaRef = useRef<HTMLInputElement>(null);

  const err = (field: string) => fieldErrors.has(field);
  const errClass = (field: string) => err(field) ? "border-red-500 focus-visible:ring-red-500" : "";

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
      setSpeseVoci(
        (editingRitiro.speseAggiuntive ?? []).map((v) => ({
          mode: v.mode,
          descrizione: v.descrizione,
          prezzo: String(v.prezzo),
          ritiroId: v.ritiroId || "",
        }))
      );
      setRemovedRitiroIds([]);
    }
  }, [editingRitiro]);

  const capitalizeFirstLetter = (value: string) => {
    return value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
  };

  const set = (key: string, value: string) => {
    setFieldErrors((prev) => { const n = new Set(prev); n.delete(key); return n; });
    setForm((f) => ({ ...f, [key]: value }));
  };

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

  const toJpegFile = async (file: File): Promise<File> => {
    const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (!isHeic) return file;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const result = Array.isArray(blob) ? blob[0]! : blob;
    return new File([result], file.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
  };

  const handleFileChange = (side: "fronte" | "retro") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (!file.type.startsWith("image/") && !isHeic) {
      toast.error("Sono accettati solo file fotografici (JPG, PNG, WebP, HEIC)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Il file è troppo grande (max 5MB)");
      return;
    }
    try {
      const jpegFile = await toJpegFile(file);
      const compressed = await compressImage(jpegFile);
      const base64Key = side === "fronte" ? "documentoFronteBase64" : "documentoRetroBase64";
      const nomeKey = side === "fronte" ? "documentoFronteNome" : "documentoRetroNome";
      setForm((f) => ({
        ...f,
        [base64Key]: compressed,
        [nomeKey]: jpegFile.name,
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

    const errors = new Set<string>();
    if (!form.nomeCliente.trim()) errors.add("nomeCliente");
    if (!form.cognomeCliente.trim()) errors.add("cognomeCliente");
    if (!form.codiceFiscale.trim()) errors.add("codiceFiscale");
    if (!form.telefonoCliente.trim()) errors.add("telefonoCliente");
    if (!form.tipoDocumento) errors.add("tipoDocumento");
    if (!form.numeroDocumento.trim()) errors.add("numeroDocumento");
    if (!form.tipoArticolo) errors.add("tipoArticolo");
    if (!form.serialeImei.trim()) errors.add("serialeImei");
    if (!form.prezzo) errors.add("prezzo");
    if (!form.dataAcquisto) errors.add("dataAcquisto");
    if (errors.size > 0) {
      setFieldErrors(errors);
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setFieldErrors(new Set());

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
      speseAggiuntive: speseVoci.length > 0
        ? speseVoci
            .filter((v) => v.prezzo)
            .map((v) => ({
              mode: v.mode,
              descrizione: v.descrizione.trim(),
              prezzo: parseFloat(v.prezzo),
              ritiroId: v.mode === "automatico" ? v.ritiroId || undefined : undefined,
            } as SpeseAggiuntiva))
        : undefined,
    };

    try {
      let saved: Ritiro;
      if (isEditing) {
        saved = await updateRitiro(ritiro);
        toast.success("Ritiro aggiornato con successo!");
        onCancelEdit?.();
      } else {
        saved = await saveRitiro(ritiro);
        toast.success("Ritiro registrato con successo!");
      }

      for (const id of removedRitiroIds) {
        const linked = ritiri.find((r) => r.id === id);
        if (linked) await unmarkRitiroAsSold(linked);
      }

      for (const voce of speseVoci) {
        if (voce.mode === "automatico" && voce.ritiroId) {
          const linked = ritiri.find((r) => r.id === voce.ritiroId);
          if (linked && !linked.venduto) await markRitiroAsSold(linked);
        }
      }

      setForm(emptyForm);
      setSpeseVoci([]);
      setRemovedRitiroIds([]);
      if (fileFronteRef.current) fileFronteRef.current.value = "";
      if (fileRetroRef.current) fileRetroRef.current.value = "";
      if (fileRicevutaRef.current) fileRicevutaRef.current.value = "";
      await onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setFieldErrors(new Set());
    setSpeseVoci([]);
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
            <Label htmlFor="nome">Nome:</Label>
            <Input id="nome" value={form.nomeCliente} onChange={(e) => set("nomeCliente", capitalizeFirstLetter(e.target.value))} placeholder="Mario" className={errClass("nomeCliente")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cognome">Cognome:</Label>
            <Input id="cognome" value={form.cognomeCliente} onChange={(e) => set("cognomeCliente", capitalizeFirstLetter(e.target.value))} placeholder="Rossi" className={errClass("cognomeCliente")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">Codice Fiscale:</Label>
            <Input id="cf" value={form.codiceFiscale} onChange={(e) => set("codiceFiscale", e.target.value.toUpperCase())} placeholder="RSSMRA80A01H501U" className={errClass("codiceFiscale")} maxLength={16} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Numero di Telefono:</Label>
            <Input id="telefono" type="tel" value={form.telefonoCliente} onChange={(e) => set("telefonoCliente", e.target.value)} placeholder="+39 333 1234567" className={errClass("telefonoCliente")} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo Documento:</Label>
            <Select value={form.tipoDocumento} onValueChange={(v) => set("tipoDocumento", v)}>
              <SelectTrigger className={errClass("tipoDocumento")}><SelectValue placeholder="Seleziona..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carta_identita">Carta d'Identità</SelectItem>
                <SelectItem value="patente">Patente</SelectItem>
                <SelectItem value="passaporto">Passaporto</SelectItem>
                <SelectItem value="permesso_soggiorno">Permesso di Soggiorno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numdoc">Numero Documento:</Label>
            <Input id="numdoc" value={form.numeroDocumento} onChange={(e) => set("numeroDocumento", e.target.value.toUpperCase())} placeholder="AX1234567" className={errClass("numeroDocumento")} />
          </div>
        </div>
        <div className="space-y-3">
          <Label>Foto / Scan Documento (max 5MB per file):</Label>
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
          <Label htmlFor="numeroRitiro">Numero Ritiro:</Label>
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
            <Label>Tipo Articolo:</Label>
            <Select value={form.tipoArticolo} onValueChange={(v) => set("tipoArticolo", v)}>
              <SelectTrigger className={errClass("tipoArticolo")}><SelectValue placeholder="Seleziona..." /></SelectTrigger>
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
            <Label htmlFor="prezzo">Prezzo Acquisto (€):</Label>
            <Input id="prezzo" type="number" step="0.01" min="0" value={form.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="150.00" className={errClass("prezzo")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marcaModello">Marca e Modello:</Label>
          <Input id="marcaModello" value={form.marcaModello} onChange={(e) => set("marcaModello", capitalizeFirstLetter(e.target.value))} placeholder="Samsung Galaxy S24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="serialeImei">Seriale / IMEI:</Label>
            <Input id="serialeImei" value={form.serialeImei} onChange={(e) => set("serialeImei", e.target.value)} placeholder="356938035643809" className={errClass("serialeImei")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN Dispositivo:</Label>
            <Input id="pin" value={form.pinDispositivo} onChange={(e) => set("pinDispositivo", e.target.value)} placeholder="1234" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data Acquisto:</Label>
            <Input id="data" type="date" value={form.dataAcquisto} onChange={(e) => set("dataAcquisto", e.target.value)} className={`w-full appearance-none ${errClass("dataAcquisto")}`} />
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
                <Label htmlFor="prezzoVendita">Prezzo di Vendita (€):</Label>
                <Input id="prezzoVendita" type="number" step="0.01" min="0" value={form.prezzoVendita} onChange={(e) => set("prezzoVendita", e.target.value)} placeholder="250.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataVendita">Data Vendita:</Label>
                <Input id="dataVendita" type="date" value={form.dataVendita} onChange={(e) => set("dataVendita", e.target.value)} className="appearance-none" />
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
          <Label htmlFor="desc">Descrizione / Condizioni:</Label>
          <Textarea id="desc" value={form.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Graffi sul retro, batteria all'85%..." rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Note:</Label>
          <Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Eventuali note..." />
        </div>

        <div className="space-y-2">
          <Label>Ricevuta di Acquisto (foto o PDF, max 5MB):</Label>
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

      {/* Spese Aggiuntive */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-muted-foreground">Spese Aggiuntive</legend>

        {speseVoci.map((voce, i) => (
          <div key={i} className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {(["manuale", "automatico"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSpeseVoci((prev) => prev.map((v, j) => j === i ? { ...v, mode: m, ritiroId: "", prezzo: "", descrizione: "" } : v))}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${voce.mode === m ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"}`}
                  >
                    {m === "manuale" ? "Manuale" : "Automatico"}
                  </button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setSpeseVoci((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {voce.mode === "manuale" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Descrizione:</Label>
                  <Input value={voce.descrizione} onChange={(e) => setSpeseVoci((prev) => prev.map((v, j) => j === i ? { ...v, descrizione: e.target.value } : v))} placeholder="es. Riparazione schermo" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Importo (€):</Label>
                  <Input type="number" step="0.01" min="0" value={voce.prezzo} onChange={(e) => setSpeseVoci((prev) => prev.map((v, j) => j === i ? { ...v, prezzo: e.target.value } : v))} placeholder="20.00" className="h-8 text-sm" />
                </div>
              </div>
            )}

            {voce.mode === "automatico" && (() => {
              const linkedRitiro = voce.ritiroId ? ritiri.find((r) => r.id === voce.ritiroId) : null;
              const isExistingLink = !!(voce.ritiroId && linkedRitiro?.venduto);
              return (
                <div className="space-y-2">
                  <Label className="text-xs">Seleziona il ritiro desiderato:</Label>
                  {isExistingLink ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-3 py-2">
                      <div className="text-xs">
                        <p className="font-medium text-green-800 dark:text-green-400">
                          {formatCodiceRitiro(linkedRitiro!.numeroRitiro, linkedRitiro!.dataAcquisto)} — {linkedRitiro!.marcaModello || linkedRitiro!.articolo}
                        </p>
                        <p className="text-muted-foreground">{linkedRitiro!.cognomeCliente} {linkedRitiro!.nomeCliente} — € {Math.round(linkedRitiro!.prezzo)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        title="Rimuovi collegamento"
                        onClick={() => {
                          setRemovedRitiroIds((prev) => [...prev, voce.ritiroId]);
                          setSpeseVoci((prev) => prev.map((v, j) => j === i ? { ...v, ritiroId: "", prezzo: "", descrizione: "" } : v));
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={voce.ritiroId}
                        onValueChange={(id) => {
                          const linked = ritiri.find((r) => r.id === id);
                          setSpeseVoci((prev) => prev.map((v, j) => j === i ? {
                            ...v,
                            ritiroId: id,
                            prezzo: linked ? String(linked.prezzo) : "",
                            descrizione: linked ? `Ritiro ${formatCodiceRitiro(linked.numeroRitiro, linked.dataAcquisto) || id.slice(0, 8)}` : "",
                          } : v));
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleziona ritiro..." /></SelectTrigger>
                        <SelectContent>
                          {ritiri.filter((r) => !r.venduto && r.id !== editingRitiro?.id).map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {formatCodiceRitiro(r.numeroRitiro, r.dataAcquisto)} — {r.marcaModello || r.articolo} ({r.cognomeCliente}) — € {Math.round(r.prezzo)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {voce.ritiroId && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Verrà marcato come <strong>venduto</strong> al salvataggio.
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSpeseVoci((prev) => [...prev, { mode: "manuale", descrizione: "", prezzo: "", ritiroId: "" }])}
        >
          <Plus className="h-4 w-4 mr-1" /> Aggiungi spesa
        </Button>

        {speseVoci.length > 0 && form.prezzo && (
          <p className="text-sm font-medium pt-1">
            Costo totale:{" "}
            <span className="text-primary font-bold">
              € {(parseFloat(form.prezzo || "0") + speseVoci.reduce((s, v) => s + (parseFloat(v.prezzo) || 0), 0)).toFixed(2)}
            </span>
            <span className="text-muted-foreground font-normal ml-1 text-xs">
              (acquisto + {speseVoci.length} {speseVoci.length === 1 ? "spesa" : "spese"})
            </span>
          </p>
        )}
      </fieldset>

      {isEditing && editingRitiro?.lastEditByName && (
        <fieldset className="space-y-3 rounded-lg border border-amber-300 dark:border-amber-700 p-4 bg-amber-50 dark:bg-amber-950/30">
          <legend className="px-2 text-sm font-semibold text-amber-800 dark:text-amber-300">⚠ Modifiche Realizzate</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Operatore</p>
              <p className="font-semibold text-foreground">{editingRitiro.lastEditByName}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Data</p>
              <p className="font-semibold text-foreground">
                {editingRitiro.lastEditAt
                  ? new Date(editingRitiro.lastEditAt).toLocaleDateString("it-IT")
                  : "—"}
              </p>
            </div>
          </div>
          {editingRitiro.lastEditDetails && editingRitiro.lastEditDetails.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-amber-200 dark:border-amber-800">
              {editingRitiro.lastEditDetails.map((detail, i) => (
                <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

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
