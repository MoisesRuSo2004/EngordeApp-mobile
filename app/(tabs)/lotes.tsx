import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lotesApi, type Lote } from '../../services/api/lotes';
import { SkeletonLoteCard } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

interface LoteConResumen extends Lote {
  totalInvertidoCop?: number;
  animalesActivos?: number;
  diasEnOperacion?: number;
}

function LoteCard({ lote, onPress }: { lote: LoteConResumen; onPress: () => void }) {
  const activo = lote.estado === 'ACTIVO';
  const animales = lote.animalesActivos ?? lote._count?.animales ?? 0;
  const invertido = lote.totalInvertidoCop ?? 0;
  const dias = lote.diasEnOperacion ?? 0;

  const formatCOP = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, !activo && styles.cardArchivado]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Franja de color lateral */}
      <View style={[styles.cardAccent, activo ? styles.accentActivo : styles.accentArchivado]} />

      <View style={styles.cardBody}>
        {/* Fila superior: nombre + badge */}
        <View style={styles.cardTituloRow}>
          <Text style={styles.cardNombre} numberOfLines={1}>{lote.nombre}</Text>
          <View style={[styles.estadoBadge, activo ? styles.badgeActivo : styles.badgeArchivado]}>
            <View style={[styles.estadoDot, { backgroundColor: activo ? COLORS.verde : COLORS.textoMuysuave }]} />
            <Text style={[styles.estadoTexto, { color: activo ? COLORS.primario : COLORS.textoSuave }]}>
              {activo ? 'Activo' : 'Archivado'}
            </Text>
          </View>
        </View>

        {/* Finca */}
        {lote.finca && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textoSuave} />
            <Text style={styles.metaTexto} numberOfLines={1}>
              {lote.finca.nombre} · {lote.finca.municipio}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{animales}</Text>
            <Text style={styles.statLabel}>Animales</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={[styles.statValor, invertido > 0 ? { color: COLORS.texto } : { color: COLORS.textoMuysuave }]}>
              {invertido > 0 ? formatCOP(invertido) : '—'}
            </Text>
            <Text style={styles.statLabel}>Invertido</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{dias}d</Text>
            <Text style={styles.statLabel}>En operación</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textoMuysuave} style={{ marginLeft: 2 }} />
    </TouchableOpacity>
  );
}

export default function LotesScreen() {
  const router = useRouter();
  const { data: lotes, isLoading, refetch, isRefetching, isError, error } = useQuery({
    queryKey: ['lotes'],
    queryFn: lotesApi.listar,
  });

  const activos = (lotes ?? []).filter((l) => l.estado === 'ACTIVO');
  const archivados = (lotes ?? []).filter((l) => l.estado !== 'ACTIVO');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: SPACING.md, paddingBottom: 100 }}>
          {[1, 2, 3].map((k) => <SkeletonLoteCard key={k} />)}
        </View>
      </View>
    );
  }

  if (isError && !lotes) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="cloud-offline-outline" size={52} color={COLORS.borde} />
        <Text style={styles.errorTitulo}>No se pudieron cargar los lotes</Text>
        <Text style={styles.errorSub}>
          {(error as Error)?.message ?? 'Verifica tu conexión e intenta de nuevo.'}
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.blanco} />
          <Text style={styles.errorBtnTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const secciones = [
    ...(activos.length > 0 ? [{ type: 'header', label: `Activos (${activos.length})` }, ...activos] : []),
    ...(archivados.length > 0 ? [{ type: 'header', label: `Archivados (${archivados.length})` }, ...archivados] : []),
  ] as any[];

  return (
    <View style={styles.container}>
      <FlatList
        data={lotes?.length ? secciones : []}
        keyExtractor={(item, i) => item.id ?? `header-${i}`}
        contentContainerStyle={styles.lista}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="grid-outline"
            titulo="Sin lotes aún"
            sub="Crea tu primer lote para empezar a registrar y controlar tu ganado."
            botonTexto="Crear primer lote"
            onBoton={() => router.push('/lotes/crear')}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.seccionHeader}>{item.label}</Text>;
          }
          return (
            <LoteCard
              lote={item}
              onPress={() => router.push(`/lotes/${item.id}`)}
            />
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/lotes/crear')}>
        <Ionicons name="add" size={28} color={COLORS.blanco} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  lista: { padding: SPACING.md, paddingBottom: 100 },
  errorTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.texto, textAlign: 'center' },
  errorSub: { fontSize: FONT.sm, color: COLORS.textoSuave, textAlign: 'center', lineHeight: 20 },
  errorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  errorBtnTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  seccionHeader: {
    fontSize: FONT.sm, fontWeight: '700', color: COLORS.textoSuave,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: SPACING.sm, marginBottom: SPACING.xs, paddingHorizontal: 2,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardArchivado: { opacity: 0.75 },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  accentActivo: { backgroundColor: COLORS.primario },
  accentArchivado: { backgroundColor: COLORS.borde },

  cardBody: { flex: 1, padding: SPACING.md },

  cardTituloRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: SPACING.sm, marginBottom: 4,
  },
  cardNombre: { flex: 1, fontSize: FONT.lg, fontWeight: '800', color: COLORS.texto },

  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  badgeActivo: { backgroundColor: COLORS.primarioSuave },
  badgeArchivado: { backgroundColor: COLORS.fondo },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoTexto: { fontSize: 11, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, flex: 1 },

  divider: { height: 1, backgroundColor: COLORS.borde, marginVertical: SPACING.sm },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValor: { fontSize: FONT.md, fontWeight: '800', color: COLORS.texto },
  statLabel: { fontSize: 11, color: COLORS.textoSuave },
  statSep: { width: 1, height: 28, backgroundColor: COLORS.borde },

  vacio: {
    alignItems: 'center', paddingTop: 60,
    paddingHorizontal: SPACING.xl, gap: SPACING.sm,
  },
  vacioIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primarioSuave, borderWidth: 1.5,
    borderColor: COLORS.primarioBorde,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vacioTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.texto },
  vacioSub: { fontSize: FONT.md, color: COLORS.textoSuave, textAlign: 'center', lineHeight: 22 },
  vacioBoton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  vacioBotonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: COLORS.primario, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
