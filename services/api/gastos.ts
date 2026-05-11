import { api } from '../../lib/api';

export type CategoriaGasto =
  | 'ALIMENTACION'
  | 'MEDICAMENTOS'
  | 'TRANSPORTE'
  | 'MANO_DE_OBRA'
  | 'ARRENDAMIENTO'
  | 'OTROS';

export interface Gasto {
  id: string;
  loteId: string;
  animalId?: string;
  categoria: CategoriaGasto;
  montoCop: number;
  descripcion?: string;
  fecha: string;
}

export interface ResumenGastos {
  total: number;
  porCategoria: Record<string, number>;
  lista: Gasto[];
}

export interface CreateGastoPayload {
  loteId: string;
  animalId?: string;
  categoria: CategoriaGasto;
  montoCop: number;
  descripcion?: string;
  fecha: string;
}

export const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string; icon: string }[] = [
  { value: 'ALIMENTACION', label: 'Alimentación', icon: 'leaf-outline' },
  { value: 'MEDICAMENTOS', label: 'Medicamentos', icon: 'medkit-outline' },
  { value: 'TRANSPORTE', label: 'Transporte', icon: 'car-outline' },
  { value: 'MANO_DE_OBRA', label: 'Mano de obra', icon: 'people-outline' },
  { value: 'ARRENDAMIENTO', label: 'Arrendamiento', icon: 'home-outline' },
  { value: 'OTROS', label: 'Otros', icon: 'ellipsis-horizontal-outline' },
];

export const gastosApi = {
  crear: (payload: CreateGastoPayload) => api.post<Gasto>('/gastos', payload),
  porLote: (loteId: string) => api.get<Gasto[]>(`/gastos/lote/${loteId}`),
  resumenLote: (loteId: string) => api.get<ResumenGastos>(`/gastos/lote/${loteId}/resumen`),
  eliminar: (id: string) => api.delete<Gasto>(`/gastos/${id}`),
};
