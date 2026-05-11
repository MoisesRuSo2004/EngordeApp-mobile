import { api } from '../../lib/api';

export interface Animal {
  id: string;
  loteId: string;
  pesoInicialKg: number;
  precioCompraCop: number;
  raza?: string;
  edadMeses?: number;
  arete?: string;
  fotoUrl?: string;
  estado: string;
  precioVentaCop?: number;
  pesoVentaKg?: number;
  fechaVenta?: string;
  // Campos calculados por el backend
  pesoActualKg?: number;
  gdpKgDia?: number;          // ganancia diaria de peso (kg/día)
  diasDesdeUltimoPesaje?: number;
  pesajes?: { pesoKg: number; fecha: string }[];
}

export interface CreateAnimalPayload {
  loteId: string;
  pesoInicialKg: number;
  precioCompraCop: number;
  raza?: string;
  edadMeses?: number;
  arete?: string;
  fotoUrl?: string;
}

export interface VenderAnimalPayload {
  precioVentaCop: number;
  pesoVentaKg: number;
  fechaVenta: string;
}

export const animalesApi = {
  listarPorLote: (loteId: string) => api.get<Animal[]>(`/animales/lote/${loteId}`),
  vendidosPorLote: (loteId: string) => api.get<Animal[]>(`/animales/lote/${loteId}/vendidos`),
  obtener: (id: string) => api.get<Animal>(`/animales/${id}`),
  crear: (payload: CreateAnimalPayload) => api.post<Animal>('/animales', payload),
  actualizar: (id: string, payload: Partial<CreateAnimalPayload>) =>
    api.put<Animal>(`/animales/${id}`, payload),
  vender: (id: string, payload: VenderAnimalPayload) =>
    api.post<Animal>(`/animales/${id}/vender`, payload),
  archivar: (id: string) => api.delete<Animal>(`/animales/${id}`),
};
