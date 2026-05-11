import { api } from '../../lib/api';

export interface Pesaje {
  id: string;
  animalId: string;
  loteId: string;
  pesoKg: number;
  fecha: string;
  nota?: string;
}

export interface GdpResult {
  gdpKgDia: number;
  pesoActualKg: number;
  pesoProyectado7d: number;
  pesoProyectado15d: number;
  pesoProyectado30d: number;
  pesoProyectado60d: number;
  diasDesdeUltimoPesaje: number;
}

export interface CreatePesajePayload {
  animalId: string;
  loteId: string;
  pesoKg: number;
  fecha: string;
  nota?: string;
}

export const pesajesApi = {
  crear: (payload: CreatePesajePayload) => api.post<Pesaje>('/pesajes', payload),
  porAnimal: (animalId: string) => api.get<Pesaje[]>(`/pesajes/animal/${animalId}`),
  porLote: (loteId: string) => api.get<Pesaje[]>(`/pesajes/lote/${loteId}`),
  gdp: (animalId: string) => api.get<GdpResult>(`/pesajes/animal/${animalId}/gdp`),
  eliminar: (id: string) => api.delete<Pesaje>(`/pesajes/${id}`),
};
