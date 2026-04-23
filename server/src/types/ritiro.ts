export type TipoArticolo = "smartphone" | "computer" | "console" | "camera" | "altro";

export type SpeseAggiuntiva = {
  mode: "manuale" | "automatico";
  descrizione: string;
  prezzo: number;
  ritiroId?: string;
};

export type EditEntry = {
  name: string;
  at: string;
  details: string[];
};

export interface RitiroRecord {
  id: string;
  numeroRitiro: number;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  telefonoCliente: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFrontePath: string | null;
  documentoFronteNome: string | null;
  documentoRetroPath: string | null;
  documentoRetroNome: string | null;
  ricevutaAcquistoPath: string | null;
  ricevutaAcquistoNome: string | null;
  tipoArticolo: TipoArticolo;
  marcaModello: string | null;
  serialeImei: string | null;
  articolo: string;
  descrizione: string;
  prezzo: number;
  prezzoVendita: number | null;
  venduto: boolean;
  dataVendita: string | null;
  pinDispositivo: string | null;
  dataAcquisto: string;
  metodoPagamento: string | null;
  iban: string | null;
  note: string;
  speseAggiuntive: SpeseAggiuntiva[] | null;
  ownerEmail: string;
  createdByName: string | null;
  lastEditByName: string | null;
  lastEditAt: string | null;
  lastEditDetails: EditEntry[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRitiroPayload {
  ownerEmail: string;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  telefonoCliente: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFrontePath: string | null;
  documentoFronteNome: string | null;
  documentoRetroPath: string | null;
  documentoRetroNome: string | null;
  ricevutaAcquistoPath: string | null;
  ricevutaAcquistoNome: string | null;
  tipoArticolo: TipoArticolo;
  marcaModello: string | null;
  serialeImei: string | null;
  articolo: string;
  descrizione: string;
  prezzo: number;
  prezzoVendita: number | null;
  venduto: boolean;
  dataVendita: string | null;
  pinDispositivo: string | null;
  dataAcquisto: string;
  metodoPagamento: string | null;
  iban: string | null;
  note: string;
  speseAggiuntive: SpeseAggiuntiva[] | null;
  createdByName?: string | null | undefined;
  lastEditByName?: string | null | undefined;
  lastEditDetails?: EditEntry[] | null;
}
