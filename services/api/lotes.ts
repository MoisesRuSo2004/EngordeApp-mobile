import { api } from '../../lib/api';

export interface Lote {
  id: string;
  nombre: string;
  fechaCompra: string;
  fincaId: string;
  estado: string;
  finca?: { nombre: string; municipio: string };
  _count?: { animales: number };
  totalInvertidoCop?: number;
  animalesActivos?: number;
  diasEnOperacion?: number;
}

export interface CreateLotePayload {
  nombre: string;
  fechaCompra: string;
  fincaId: string;
  proveedorId?: string;
}

export interface Finca {
  id: string;
  nombre: string;
  municipio: string;
  departamento: string;
}

export const lotesApi = {
  listar: () => api.get<Lote[]>('/lotes'),
  obtener: (id: string) => api.get<Lote>(`/lotes/${id}`),
  crear: (payload: CreateLotePayload) => api.post<Lote>('/lotes', payload),
  archivar: (id: string) => api.put<Lote>(`/lotes/${id}/archivar`, {}),
};

export const fincasApi = {
  listar: () => api.get<Finca[]>('/fincas'),
  crear: (payload: { nombre: string; municipio: string; departamento: string }) =>
    api.post<Finca>('/fincas', payload),
};
