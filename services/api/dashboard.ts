import { api } from '../../lib/api';

export interface RentabilidadAnimal {
  animalId: string;
  arete?: string | null;
  raza?: string | null;
  pesoActualKg: number;
  gdpKgDia: number;
  pesoProyectado30d: number;
  precioCompraCop: number;
  gastosDirectosCop: number;
  costoTotalCop: number;
  valorVentaHoyCop: number;
  utilidadHoyCop: number;
  margenHoyPct: number;
  valorVenta30dCop: number;
  utilidad30dCop: number;
  margen30dPct: number;
}

export interface RentabilidadLote {
  loteId: string;
  nombre: string;
  totalAnimales: number;
  precioKiloMercado: number;
  costoTotalLoteCop: number;
  gastosLoteCop: number;
  valorVentaTotalHoyCop: number;
  utilidadHoyCop: number;
  margenHoyPct: number;
  gdpPromedioKgDia: number;
  animales: RentabilidadAnimal[];
}

export interface PrecioMercado {
  id: string;
  precioKiloCop: number;
  departamento?: string;
  fecha: string;
  fuente: string;
}

export interface AlertaComputed {
  tipo: 'PESAJE_PENDIENTE' | 'CRECIMIENTO_LENTO' | 'PRECIO_SIN_ACTUALIZAR';
  mensaje: string;
  animalId?: string;
  loteId?: string;
  arete?: string | null;
  loteNombre?: string;
  diasSinPesar?: number;
  gdp?: number;
}

export interface TopAnimal {
  animalId: string;
  arete?: string | null;
  raza?: string | null;
  loteNombre: string;
  loteId: string;
  gdpKgDia: number;
  pesoActualKg: number;
  utilidadHoyCop: number;
  margenHoyPct: number;
}

export interface GastoCategoriaResumen {
  categoria: string;
  total: number;
}

export interface ResumenGlobal {
  totalLotesActivos: number;
  totalAnimalesActivos: number;
  totalInvertidoCop: number;
  valorEstimadoHoyCop: number;
  utilidadEstimadaCop: number;
  precioKiloVigente: number;
  gdpPromedioGlobal: number;
  alertas: AlertaComputed[];
  topMejores: TopAnimal[];
  topPeores: TopAnimal[];
  gastosMesCop: number;
  gastosMesPorCategoria: GastoCategoriaResumen[];
}

export const dashboardApi = {
  resumen: () => api.get<ResumenGlobal>('/dashboard/resumen'),
  rentabilidadLote: (loteId: string) =>
    api.get<RentabilidadLote>(`/dashboard/rentabilidad/lote/${loteId}`),
  setPrecioMercado: (precioKiloCop: number, departamento?: string) =>
    api.post<PrecioMercado>('/dashboard/precio-mercado', { precioKiloCop, departamento }),
  getPrecioMercado: () => api.get<PrecioMercado | null>('/dashboard/precio-mercado'),
};
