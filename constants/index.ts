export const COLORS = {
  // Primarios
  primario: '#16a34a',
  primarioOscuro: '#15803d',
  primarioSuave: '#f0fdf4',
  primarioBorde: '#bbf7d0',

  // Semáforo dashboard
  verde: '#22c55e',
  amarillo: '#f59e0b',
  rojo: '#ef4444',
  verdeClaro: '#dcfce7',
  amarilloClaro: '#fef9c3',
  rojoClaro: '#fee2e2',

  // Neutros
  fondo: '#f9fafb',
  fondoCard: '#ffffff',
  borde: '#e5e7eb',
  bordeActivo: '#16a34a',

  // Texto
  texto: '#111827',
  textoSecundario: '#374151',
  textoSuave: '#6b7280',
  textoMuysuave: '#9ca3af',

  // Base
  blanco: '#ffffff',
  negro: '#000000',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const FONT = {
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;

export const DIAS_SIN_PESAJE_ALERTA = 30;
export const GDP_UMBRAL_LENTO = 0.7;
