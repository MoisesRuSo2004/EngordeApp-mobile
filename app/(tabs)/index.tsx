import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Animated,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi, type AlertaComputed, type TopAnimal, type GastoCategoriaResumen,
} from '../../services/api/dashboard';
import { SkeletonDashboardHero, SkeletonBox } from '../../components/Skeleton';
import { useSessionStore } from '../../stores/session.store';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatCOP(v: number, compact = true): string {
  if (!compact) return `$${Math.abs(v).toLocaleString('es-CO')}`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString('es-CO')}`;
}

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

const CATEGORIA_LABEL: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  MEDICAMENTOS: 'Medicamentos',
  TRANSPORTE: 'Transporte',
  MANO_DE_OBRA: 'Mano de obra',
  ARRENDAMIENTO: 'Arrendamiento',
  OTROS: 'Otros',
};

const CATEGORIA_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  ALIMENTACION: 'leaf-outline',
  MEDICAMENTOS: 'medical-outline',
  TRANSPORTE: 'car-outline',
  MANO_DE_OBRA: 'people-outline',
  ARRENDAMIENTO: 'home-outline',
  OTROS: 'ellipsis-horizontal-outline',
};

const ALERTA_META: Record<AlertaComputed['tipo'], {
  icon: keyof typeof Ionicons.glyphMap; color: string; bg: string;
}> = {
  PESAJE_PENDIENTE: { icon: 'time-outline', color: COLORS.amarillo, bg: COLORS.amarilloClaro },
  CRECIMIENTO_LENTO: { icon: 'trending-down-outline', color: COLORS.rojo, bg: COLORS.rojoClaro },
  PRECIO_SIN_ACTUALIZAR: { icon: 'pricetag-outline', color: COLORS.amarillo, bg: COLORS.amarilloClaro },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionHeader({ title, badge }: { title: string; badge?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

function AlertaCard({ alerta, onPress }: { alerta: AlertaComputed; onPress?: () => void }) {
  const meta = ALERTA_META[alerta.tipo];
  return (
    <TouchableOpacity
      style={[styles.alertaCard, { backgroundColor: meta.bg, borderColor: meta.color + '50' }]}
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}
    >
      <View style={[styles.alertaIconBox, { backgroundColor: meta.color + '25' }]}>
        <Ionicons name={meta.icon} size={17} color={meta.color} />
      </View>
      <Text style={styles.alertaTexto} numberOfLines={2}>{alerta.mensaje}</Text>
      {onPress && <Ionicons name="chevron-forward" size={15} color={meta.color} />}
    </TouchableOpacity>
  );
}

function TopAnimalRow({ animal, tipo, onPress }: {
  animal: TopAnimal; tipo: 'mejor' | 'peor'; onPress: () => void;
}) {
  const esMejor = tipo === 'mejor';
  const color = esMejor
    ? (animal.utilidadHoyCop >= 0 ? COLORS.verde : COLORS.rojo)
    : (animal.gdpKgDia >= 0.7 ? COLORS.amarillo : COLORS.rojo);

  return (
    <TouchableOpacity style={styles.topRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.topIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons
          name={esMejor ? 'trending-up-outline' : 'trending-down-outline'}
          size={16} color={color}
        />
      </View>
      <View style={styles.topInfo}>
        <Text style={styles.topNombre} numberOfLines={1}>
          {animal.arete ? `Arete #${animal.arete}` : 'Sin arete'}
          {animal.raza ? ` · ${animal.raza}` : ''}
        </Text>
        <Text style={styles.topLote} numberOfLines={1}>{animal.loteNombre}</Text>
      </View>
      <View style={styles.topValor}>
        {esMejor ? (
          <>
            <Text style={[styles.topValorPrincipal, { color }]}>
              {animal.utilidadHoyCop >= 0 ? '+' : ''}{formatCOP(animal.utilidadHoyCop)}
            </Text>
            <Text style={styles.topValorSub}>{animal.margenHoyPct}%</Text>
          </>
        ) : (
          <>
            <Text style={[styles.topValorPrincipal, { color }]}>
              {animal.gdpKgDia.toFixed(3)} kg/d
            </Text>
            <Text style={styles.topValorSub}>{animal.pesoActualKg} kg</Text>
          </>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color={COLORS.textoMuysuave} />
    </TouchableOpacity>
  );
}

function GastoBar({ gasto, max }: { gasto: GastoCategoriaResumen; max: number }) {
  const pct = max > 0 ? gasto.total / max : 0;
  return (
    <View style={styles.gastoBarRow}>
      <View style={styles.gastoBarLeft}>
        <Ionicons
          name={CATEGORIA_ICON[gasto.categoria] ?? 'ellipsis-horizontal-outline'}
          size={14} color={COLORS.primario}
        />
        <Text style={styles.gastoBarLabel} numberOfLines={1}>
          {CATEGORIA_LABEL[gasto.categoria] ?? gasto.categoria}
        </Text>
      </View>
      <View style={styles.gastoBarTrack}>
        <View style={[styles.gastoBarFill, { flex: pct }]} />
        <View style={{ flex: 1 - pct }} />
      </View>
      <Text style={styles.gastoBarValor}>{formatCOP(gasto.total)}</Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function InicioScreen() {
  const router = useRouter();
  const { session } = useSessionStore();
  const nombreUsuario = session?.user?.user_metadata?.nombre as string | undefined;

  // Animación suave del ícono de bienvenida (pulso de opacidad)
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 0.35, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const { data: resumen, isLoading, isRefetching, refetch, isError, error } = useQuery({
    queryKey: ['resumen'],
    queryFn: dashboardApi.resumen,
    staleTime: 60_000,
  });

  const utilidad = resumen?.utilidadEstimadaCop ?? 0;
  const utilColor = utilidad >= 0 ? COLORS.verde : COLORS.rojo;
  const hayDatos = (resumen?.totalLotesActivos ?? 0) > 0;
  const hoy = new Date();
  const mesLabel = `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;

  if (isError && !resumen) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={52} color={COLORS.borde} />
        <Text style={styles.errorTitulo}>Sin conexión al servidor</Text>
        <Text style={styles.errorSub}>
          {(error as Error)?.message ?? 'No se pudo cargar el resumen. Verifica tu conexión.'}
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.blanco} />
          <Text style={styles.errorBtnTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.blanco} />
      }
    >
      {/* ── Banner de error parcial (datos desactualizados) ── */}
      {isError && resumen && (
        <TouchableOpacity style={styles.errorBanner} onPress={() => refetch()}>
          <Ionicons name="warning-outline" size={15} color={COLORS.amarillo} />
          <Text style={styles.errorBannerTexto}>Datos desactualizados · Toca para reintentar</Text>
        </TouchableOpacity>
      )}

      {/* ── Hero card ── */}
      {isLoading ? (
        <SkeletonDashboardHero />
      ) : null}

      {!isLoading && (
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <View style={styles.saludoRow}>
              <Text style={styles.heroSaludo}>
                {saludo()}{nombreUsuario ? `, ${nombreUsuario.split(' ')[0]}` : ''}
              </Text>
              <Animated.View style={{ opacity: pulso }}>
                <Ionicons name="leaf" size={16} color="rgba(255,255,255,0.7)" />
              </Animated.View>
            </View>
            <Text style={styles.heroFecha}>
              {hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.heroPrecioBtn} onPress={() => router.push('/precio-mercado')}>
            <Ionicons name="pricetag-outline" size={16} color="rgba(255,255,255,0.85)" />
            {resumen?.precioKiloVigente ? (
              <Text style={styles.heroPrecioBtnTexto}>
                ${(resumen.precioKiloVigente / 1000).toFixed(0)}k/kg
              </Text>
            ) : (
              <Text style={styles.heroPrecioBtnTexto}>Precio</Text>
            )}
          </TouchableOpacity>
        </View>

        <>
          <Text style={styles.heroInvertidoLabel}>Total invertido</Text>
          <Text style={styles.heroInvertidoValor}>
            {formatCOP(resumen?.totalInvertidoCop ?? 0)}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>Valor hoy</Text>
              <Text style={styles.heroItemValor}>
                {resumen?.precioKiloVigente
                  ? formatCOP(resumen.valorEstimadoHoyCop)
                  : '—'}
              </Text>
            </View>
            <View style={styles.heroSep} />
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>Utilidad est.</Text>
              <Text style={[
                styles.heroItemValor,
                resumen?.precioKiloVigente ? { color: utilidad >= 0 ? '#86efac' : '#fca5a5' } : {},
              ]}>
                {resumen?.precioKiloVigente
                  ? `${utilidad >= 0 ? '+' : ''}${formatCOP(utilidad)}`
                  : '—'}
              </Text>
            </View>
          </View>
        </>
      </View>
      )}

      {/* ── Chips de operación ── */}
      {!isLoading && (
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="grid-outline" size={13} color={COLORS.primario} />
            <Text style={styles.chipTexto}>{resumen?.totalLotesActivos ?? 0} lotes</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="paw-outline" size={13} color={COLORS.primario} />
            <Text style={styles.chipTexto}>{resumen?.totalAnimalesActivos ?? 0} animales</Text>
          </View>
          {(resumen?.gdpPromedioGlobal ?? 0) > 0 && (
            <View style={styles.chip}>
              <Ionicons name="trending-up-outline" size={13} color={COLORS.primario} />
              <Text style={styles.chipTexto}>GDP {resumen!.gdpPromedioGlobal.toFixed(3)} kg/d</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Estado vacío ── */}
      {!isLoading && !hayDatos && (
        <View style={styles.emptyCard}>
          <Ionicons name="leaf-outline" size={48} color={COLORS.primarioBorde} />
          <Text style={styles.emptyTitulo}>¡Bienvenido a EngordeApp!</Text>
          <Text style={styles.emptySub}>
            Crea tu primer lote para empezar a controlar tu negocio ganadero.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/lotes/crear')}>
            <Ionicons name="add" size={18} color={COLORS.blanco} />
            <Text style={styles.emptyBtnTexto}>Crear primer lote</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Alertas ── */}
      {!isLoading && (resumen?.alertas.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Alertas" badge={resumen!.alertas.length} />
          {resumen!.alertas.slice(0, 5).map((a, i) => (
            <AlertaCard
              key={i} alerta={a}
              onPress={a.animalId ? () => router.push(`/animales/${a.animalId}`) : undefined}
            />
          ))}
        </View>
      )}

      {/* ── Top animales ── */}
      {!isLoading && hayDatos && (resumen?.topMejores.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Mejor rendimiento" />
          <View style={styles.topCard}>
            {resumen!.topMejores.map((a, i) => (
              <View key={a.animalId}>
                {i > 0 && <View style={styles.topSep} />}
                <TopAnimalRow
                  animal={a} tipo="mejor"
                  onPress={() => router.push(`/animales/${a.animalId}`)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {!isLoading && hayDatos && (resumen?.topPeores.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Requieren atención" />
          <View style={styles.topCard}>
            {resumen!.topPeores.map((a, i) => (
              <View key={a.animalId}>
                {i > 0 && <View style={styles.topSep} />}
                <TopAnimalRow
                  animal={a} tipo="peor"
                  onPress={() => router.push(`/animales/${a.animalId}`)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Gastos del mes ── */}
      {!isLoading && hayDatos && (resumen?.gastosMesCop ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`Gastos de ${mesLabel}`} />
          <View style={styles.gastosCard}>
            <View style={styles.gastosTotalRow}>
              <Text style={styles.gastosTotalLabel}>Total del mes</Text>
              <Text style={styles.gastosTotalValor}>
                {formatCOP(resumen!.gastosMesCop, false)}
              </Text>
            </View>
            <View style={styles.gastosDivider} />
            {resumen!.gastosMesPorCategoria.map((g) => (
              <GastoBar
                key={g.categoria} gasto={g}
                max={resumen!.gastosMesPorCategoria[0].total}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Acciones rápidas ── */}
      <View style={styles.section}>
        <SectionHeader title="Acciones rápidas" />
        {/* Fila 1 */}
        <View style={styles.accionesGrid}>
          {[
            { icon: 'add-circle-outline' as const, color: COLORS.primario,   titulo: 'Nuevo lote',    sub: 'Registrar compra',  ruta: '/lotes/crear' },
            { icon: 'grid-outline'       as const, color: '#f59e0b',          titulo: 'Mis lotes',     sub: 'Ver y gestionar',   ruta: '/(tabs)/lotes' },
            { icon: 'pricetag-outline'   as const, color: '#8b5cf6',          titulo: 'Precio $/kg',   sub: 'Actualizar mercado',ruta: '/precio-mercado' },
          ].map((a) => (
            <TouchableOpacity key={a.titulo} style={styles.accionCard} onPress={() => router.push(a.ruta as any)} activeOpacity={0.75}>
              <View style={[styles.accionIcono, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={26} color={a.color} />
              </View>
              <Text style={styles.accionTitulo}>{a.titulo}</Text>
              <Text style={styles.accionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Fila 2 — acciones frecuentes del día */}
        <View style={[styles.accionesGrid, { marginTop: SPACING.sm }]}>
          {[
            { icon: 'barbell-outline'    as const, color: '#0ea5e9',          titulo: 'Pesaje',        sub: 'Registrar peso',    ruta: '/(tabs)/lotes' },
            { icon: 'receipt-outline'    as const, color: '#f97316',          titulo: 'Gasto',         sub: 'Registrar egreso',  ruta: '/(tabs)/lotes' },
            { icon: 'people-outline'     as const, color: '#64748b',          titulo: 'Proveedores',   sub: 'Ver directorio',    ruta: '/proveedores' },
          ].map((a) => (
            <TouchableOpacity key={a.titulo} style={styles.accionCard} onPress={() => router.push(a.ruta as any)} activeOpacity={0.75}>
              <View style={[styles.accionIcono, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={26} color={a.color} />
              </View>
              <Text style={styles.accionTitulo}>{a.titulo}</Text>
              <Text style={styles.accionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: COLORS.primarioOscuro,
    paddingTop: 20, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  saludoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroSaludo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  heroFecha: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2, textTransform: 'capitalize' },
  heroPrecioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPrecioBtnTexto: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroLoading: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  heroLoadingTexto: { color: 'rgba(255,255,255,0.6)', fontSize: FONT.sm },
  heroInvertidoLabel: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroInvertidoValor: { fontSize: 38, fontWeight: '800', color: COLORS.blanco, letterSpacing: -1 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: SPACING.md },
  heroRow: { flexDirection: 'row' },
  heroItem: { flex: 1 },
  heroSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: SPACING.md },
  heroItemLabel: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroItemValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },

  // Chips
  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  chipTexto: { fontSize: FONT.sm, color: COLORS.primarioOscuro, fontWeight: '600' },

  // Secciones
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },
  badge: {
    backgroundColor: COLORS.rojo, borderRadius: RADIUS.full,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeTexto: { fontSize: 11, fontWeight: '800', color: COLORS.blanco },

  // Estado vacío
  emptyCard: {
    margin: SPACING.md, backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.lg, padding: SPACING.xl,
    alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  emptyTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.texto, textAlign: 'center' },
  emptySub: { fontSize: FONT.sm, color: COLORS.textoSuave, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  emptyBtnTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  // Alertas
  alertaCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.md, padding: SPACING.sm,
    borderWidth: 1, marginBottom: SPACING.xs,
  },
  alertaIconBox: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  alertaTexto: { flex: 1, fontSize: FONT.sm, color: COLORS.textoSecundario, lineHeight: 18 },

  // Top animales
  topCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  topSep: { height: 1, backgroundColor: COLORS.borde },
  topIconBox: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  topInfo: { flex: 1 },
  topNombre: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.texto },
  topLote: { fontSize: 12, color: COLORS.textoMuysuave, marginTop: 1 },
  topValor: { alignItems: 'flex-end' },
  topValorPrincipal: { fontSize: FONT.sm, fontWeight: '800' },
  topValorSub: { fontSize: 11, color: COLORS.textoMuysuave, marginTop: 1 },

  // Gastos del mes
  gastosCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  gastosTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gastosTotalLabel: { fontSize: FONT.sm, color: COLORS.textoSuave, fontWeight: '600' },
  gastosTotalValor: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.texto },
  gastosDivider: { height: 1, backgroundColor: COLORS.borde, marginVertical: SPACING.sm },
  gastoBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  gastoBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 110 },
  gastoBarLabel: { fontSize: 12, color: COLORS.textoSuave, flex: 1 },
  gastoBarTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: COLORS.fondo, flexDirection: 'row', overflow: 'hidden',
  },
  gastoBarFill: { backgroundColor: COLORS.primario, borderRadius: 3 },
  gastoBarValor: { fontSize: 12, fontWeight: '700', color: COLORS.texto, width: 50, textAlign: 'right' },

  // Error states
  errorContainer: {
    flex: 1, backgroundColor: COLORS.fondo,
    alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.sm,
  },
  errorTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto, textAlign: 'center' },
  errorSub: { fontSize: FONT.sm, color: COLORS.textoSuave, textAlign: 'center', lineHeight: 20 },
  errorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  errorBtnTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.amarilloClaro, paddingVertical: 10,
    paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#fde68a',
  },
  errorBannerTexto: { fontSize: FONT.sm, color: '#92400e', fontWeight: '600' },

  // Acciones rápidas
  accionesGrid: { flexDirection: 'row', gap: SPACING.sm },
  accionCard: {
    flex: 1, backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.borde,
    alignItems: 'center', gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  accionIcono: { width: 48, height: 48, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  accionTitulo: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.texto, textAlign: 'center' },
  accionSub: { fontSize: 11, color: COLORS.textoMuysuave, textAlign: 'center' },
});
