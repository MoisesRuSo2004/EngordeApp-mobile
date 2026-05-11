import { api } from '../../lib/api';

export interface Proveedor {
  id: string;
  nombre: string;
  telefono?: string;
  municipio?: string;
  historialCalificacion?: number;
  createdAt: string;
  _count?: { lotes: number };
  lotes?: { id: string; nombre: string; fechaCompra: string; estado: string }[];
}

export interface CreateProveedorPayload {
  nombre: string;
  telefono?: string;
  municipio?: string;
  historialCalificacion?: number;
}

export const proveedoresApi = {
  listar: () => api.get<Proveedor[]>('/proveedores'),
  obtener: (id: string) => api.get<Proveedor>(`/proveedores/${id}`),
  crear: (payload: CreateProveedorPayload) => api.post<Proveedor>('/proveedores', payload),
  actualizar: (id: string, payload: Partial<CreateProveedorPayload>) =>
    api.put<Proveedor>(`/proveedores/${id}`, payload),
  eliminar: (id: string) => api.delete<Proveedor>(`/proveedores/${id}`),
};
