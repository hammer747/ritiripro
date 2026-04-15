export type TipoArticolo = "smartphone" | "computer" | "console" | "camera" | "altro";

export interface Ritiro {
  id: string;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoIdentitaBase64?: string;
  documentoIdentitaNome?: string;
  tipoArticolo: TipoArticolo;
  articolo: string;
  descrizione: string;
  prezzo: number;
  pinDispositivo?: string;
  dataAcquisto: string;
  note: string;
}
