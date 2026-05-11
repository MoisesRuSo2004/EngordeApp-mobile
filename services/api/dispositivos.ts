import { api } from '../../lib/api';

export const dispositivosApi = {
  registrarToken: (token: string, plataforma: 'ios' | 'android' | 'web') =>
    api.post('/dispositivos/token', { token, plataforma }),
};
