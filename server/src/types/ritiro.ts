export type TipoArticolo = "smartphone" | "computer" | "console" | "camera" | "altro";

export type SpeseAggiuntiva = {
  mode: "manuale" | "automatico";
  descrizione: string;
  prezzo: number;
  ritiroId?: string;
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
  note: string;
  speseAggiuntive: SpeseAggiuntiva[] | null;
  ownerEmail: string;
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
  note: string;
  speseAggiuntive: SpeseAggiuntiva[] | null;
}
