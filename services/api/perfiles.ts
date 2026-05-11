import { api } from '../../lib/api';

export const perfilesApi = {
  /** Verifica si el username está disponible (sin auth) */
  checkDisponible: (username: string) =>
    api.get<{ disponible: boolean }>(`/perfiles/check/${username}`),

  /** Resuelve username → email para el login */
  resolverEmail: (username: string) =>
    api.get<{ email: string }>(`/perfiles/resolver/${username}`),

  /** Crea el perfil después del registro (sin auth) */
  crear: (userId: string, username: string, email: string) =>
    api.post('/perfiles', { userId, username, email }),

  /** Obtiene el perfil del usuario autenticado */
  obtenerMio: () => api.get('/perfiles/mio'),

  /** Cambia el username (envía email para crear el perfil si no existe aún) */
  actualizarUsername: (username: string, email: string) =>
    api.put('/perfiles/username', { username, email }),
};
