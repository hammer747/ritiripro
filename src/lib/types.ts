export interface Ritiro {
  id: string;
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale: string;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoIdentitaBase64?: string; // foto/scan del documento
  documentoIdentitaNome?: string;   // nome file originale
  articolo: string;
  descrizione: string;
  prezzo: number;
  pinDispositivo?: string; // PIN del dispositivo se presente
  dataAcquisto: string;
  note: string;
}
