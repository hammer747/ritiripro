export type TipoArticolo = "smartphone" | "computer" | "console" | "camera" | "altro";

export type EditEntry = {
  name: string;
  at: string;
  details: string[];
};

export type SpeseAggiuntiva = {
  mode: "manuale" | "automatico";
  descrizione: string;
  prezzo: number;
  ritiroId?: string;
};

export interface Ritiro {
  id: string;
  numeroRitiro?: number;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  telefonoCliente?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFronteBase64?: string;
  documentoFronteNome?: string;
  documentoRetroBase64?: string;
  documentoRetroNome?: string;
  ricevutaAcquistoBase64?: string;
  ricevutaAcquistoNome?: string;
  tipoArticolo: TipoArticolo;
  marcaModello?: string;
  serialeImei?: string;
  articolo: string;
  descrizione: string;
  prezzo: number;
  prezzoVendita?: number;
  venduto: boolean;
  dataVendita?: string;
  pinDispositivo?: string;
  dataAcquisto: string;
  metodoPagamento?: string;
  iban?: string;
  note: string;
  speseAggiuntive?: SpeseAggiuntiva[];
  createdByName?: string;
  lastEditByName?: string;
  lastEditAt?: string;
  lastEditDetails?: EditEntry[];
}
