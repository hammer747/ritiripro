export type TipoArticolo = "smartphone" | "computer" | "console" | "camera" | "altro";

export interface Ritiro {
  id: string;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  telefonoCliente?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoIdentitaBase64?: string;
  documentoIdentitaNome?: string;
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
  note: string;
}
