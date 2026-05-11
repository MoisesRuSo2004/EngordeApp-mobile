import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { lotesApi, type Lote } from '../../services/api/lotes';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

function LoteReporteCard({ lote }: { lote: Lote }) {
  const router = useRouter();
  const activo = lote.estado === 'ACTIVO';

  return (
    <View style={styles.card}>
      {/* Info del lote */}
      <View style={styles.cardTop}>
        <View style={[styles.cardIconBox, { backgroundColor: activo ? COLORS.primarioSuave : COLORS.fondo }]}>
          <Ionicons
            name={activo ? 'layers-outline' : 'archive-outline'}
            size={22}
            color={activo ? COLORS.primario : COLORS.textoSuave}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{lote.nombre}</Text>
          <View style={styles.cardMetas}>
            {lote.finca && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color={COLORS.textoSuave} />
                <Text style={styles.metaTexto}>{lote.finca.nombre}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textoSuave} />
              <Text style={styles.metaTexto}>
                {new Date(lote.fechaCompra).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            {lote._count && (
              <View style={styles.metaItem}>
                <Ionicons name="paw-outline" size={12} color={COLORS.textoSuave} />
                <Text style={styles.metaTexto}>{lote._count.animales} animales</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.estadoBadge, activo ? styles.estadoActivo : styles.estadoArchivado]}>
          <Text style={[styles.estadoTexto, { color: activo ? COLORS.primario : COLORS.textoSuave }]}>
            {activo ? 'Activo' : 'Archivado'}
          </Text>
        </View>
      </View>

      {/* Botones de exportación */}
      <View style={styles.botonesRow}>
        <TouchableOpacity
          style={styles.btnReporte}
          onPress={() => router.push(`/reportes/lote?id=${lote.id}&nombre=${encodeURIComponent(lote.nombre)}`)}
          activeOpacity={0.75}
        >
          <Ionicons name="document-text-outline" size={16} color={COLORS.primario} />
          <Text style={styles.btnReporteTexto}>Ver reportes</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primario} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReportesTabScreen() {
  const { data: lotes = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lotes'],
    queryFn: lotesApi.listar,
  });

  const activos = lotes.filter((l) => l.estado === 'ACTIVO');
  const archivados = lotes.filter((l) => l.estado !== 'ACTIVO');

  if (isLoading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORS.primario} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...activos, ...archivados]}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.lista}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Ionicons name="document-text-outline" size={28} color={COLORS.primario} />
            <View style={styles.headerTextos}>
              <Text style={styles.headerTitulo}>Reportes y exportaciones</Text>
              <Text style={styles.headerSub}>
                Selecciona un lote para generar reportes en PDF o Excel.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="layers-outline" size={56} color={COLORS.primarioBorde} />
            <Text style={styles.vacioTitulo}>Sin lotes registrados</Text>
            <Text style={styles.vacioSub}>Crea un lote primero para poder generar reportes.</Text>
          </View>
        }
        renderItem={({ item }) => <LoteReporteCard lote={item} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListFooterComponent={
          lotes.length > 0 ? (
            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textoMuysuave} />
              <Text style={styles.footerTexto}>
                Los reportes incluyen PDF listo para imprimir y CSV compatible con Excel y Google Sheets.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  lista: { padding: SPACING.md, paddingBottom: 48 },

  headerInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  headerTextos: { flex: 1 },
  headerTitulo: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: 4 },
  headerSub: { fontSize: FONT.sm, color: COLORS.textoSuave, lineHeight: 18 },

  card: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    padding: SPACING.md, paddingBottom: SPACING.sm,
  },
  cardIconBox: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: 5 },
  cardMetas: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave },
  estadoBadge: {
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3,
  },
  estadoActivo: { backgroundColor: COLORS.primarioSuave },
  estadoArchivado: { backgroundColor: COLORS.fondo },
  estadoTexto: { fontSize: 11, fontWeight: '700' },

  botonesRow: {
    borderTopWidth: 1, borderTopColor: COLORS.borde,
  },
  btnReporte: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.primarioSuave,
  },
  btnReporteTexto: { flex: 1, fontSize: FONT.sm, fontWeight: '700', color: COLORS.primario },

  vacio: { alignItems: 'center', paddingTop: SPACING.xl * 2, gap: SPACING.sm },
  vacioTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto },
  vacioSub: { fontSize: FONT.md, color: COLORS.textoSuave, textAlign: 'center' },

  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: SPACING.lg, paddingHorizontal: SPACING.sm,
  },
  footerTexto: { flex: 1, fontSize: FONT.sm, color: COLORS.textoMuysuave, lineHeight: 17 },
});
