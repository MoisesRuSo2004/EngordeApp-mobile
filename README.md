# EngordeApp — Mobile

App móvil para control de engorde ganadero. Construida con **React Native + Expo + Supabase**.

## Stack

- **Expo SDK 54** — React Native con Expo Router v6
- **TanStack Query v5** — Cache y estado del servidor
- **Supabase** — Autenticación y sesión
- **EAS Build** — Compilación y distribución

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
EXPO_PUBLIC_API_URL=https://tu-backend.railway.app
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Desarrollo local

```bash
npm install
npx expo start
```

Escanea el QR con **Expo Go** (iOS/Android).

## Build para distribución

```bash
# APK Android (instalación directa)
eas build -p android --profile preview

# Producción
eas build -p android --profile production
eas build -p ios --profile production
```

## Pantallas principales

| Pantalla | Descripción |
|---|---|
| Onboarding | Introducción animada (primera vez) |
| Login / Registro | Autenticación con usuario o correo |
| Dashboard | Resumen de fincas, lotes y rentabilidad |
| Lotes | Gestión de lotes de engorde |
| Animales | Registro, pesajes y ventas |
| Gastos | Control de gastos por lote |
| Reportes | Exportación PDF y CSV |
| Perfil | Datos del usuario y configuración |
