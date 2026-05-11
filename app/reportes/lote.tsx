import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { lotesApi } from '../../services/api/lotes';
import { gastosApi } from '../../services/api/gastos';
import { dashboardApi } from '../../services/api/dashboard';
import { pesajesApi } from '../../services/api/pesajes';
import { animalesApi } from '../../services/api/animales';
import { exportarResumenLotePDF, exportarGastosPDF, exportarPesajesPDF } from '../../lib/reportes/pdf';
import { exportarAnimalesCSV, exportarGastosCSV, exportarPesajesCSV } from '../../lib/reportes/csv';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

type ReporteKey = 'resumen' | 'gastos' | 'pesajes';

interface ReporteConfig {
  key: ReporteKey;
  titulo: string;
  descripcion: string;
  icon: string;
  color: string;
  bg: string;
}

const REPORTES: ReporteConfig[] = [
  {
    key: 'resumen',
    titulo: 'Resumen del lote',
    descripcion: 'Animales, pesos, GDP, rentabilidad por animal y totales financieros.',
    icon: 'bar-chart-outline',
    color: COLORS.primario,
    bg: COLORS.primarioSuave,
  },
  {
    key: 'gastos',
    titulo: 'Historial de gastos',
    descripcion: 'Todos los gastos registrados, desglosados por categoría.',
    icon: 'receipt-outline',
    color: '#dc2626',
    bg: '#fee2e2',
  },
  {
    key: 'pesajes',
    titulo: 'Historial de pesajes',
    descripcion: 'Registro completo de pesajes de cada animal del lote.',
    icon: 'barbell-outline',
    color: '#7c3aed',
    bg: '#ede9fe',
  },
];

export default function ReportesLoteScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre: string }>();
  const router = useRouter();
  const [generando, setGenerando] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: lote } = useQuery({
    queryKey: ['lote', id],
    queryFn: () => lotesApi.obtener(id!),
    enabled: !!id,
  });

  const { data: animales = [] } = useQuery({
    queryKey: ['animales', id],
    queryFn: () => animalesApi.listarPorLote(id!),
    enabled: !!id,
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ['gastos', id],
    queryFn: () => gastosApi.porLote(id!),
    enabled: !!id,
  });

  const { data: rentabilidad } = useQuery({
    queryKey: ['rentabilidad', id],
    queryFn: () => dashboardApi.rentabilidadLote(id!),
    enabled: !!id,
  });

  const { data: precioMercado } = useQuery({
    queryKey: ['precio-mercado'],
    queryFn: () => dashboardApi.getPrecioMercado(),
  });

  // ── Generadores ───────────────────────────────────────────────────────────────

  async function generarPDF(key: ReporteKey) {
    const loteNombre = lote?.nombre ?? nombre ?? 'Lote';
    setGenerando(`pdf-${key}`);
    try {
      if (key === 'resumen') {
        if (!rentabilidad) {
          Alert.alert('Sin datos', 'Configura el precio de mercado para generar el resumen de rentabilidad.');
          return;
        }
        await exportarResumenLotePDF({
          loteNombre,
          finca: lote?.finca?.nombre,
          fechaCompra: lote?.fechaCompra,
          animales: rentabilidad.animales.map((a) => ({
            arete: a.arete ?? undefined,
            raza: a.raza ?? undefined,
            pesoInicialKg: animales.find((x) => x.id === a.animalId)?.pesoInicialKg ?? 0,
            pesoActualKg: a.pesoActualKg,
            gdpKgDia: a.gdpKgDia,
            precioCompraCop: a.precioCompraCop,
            valorHoyCop: a.valorVentaHoyCop,
            utilidadHoyCop: a.utilidadHoyCop,
          })),
          totalInvertidoCop: rentabilidad.costoTotalLoteCop,
          valorHoyTotalCop: rentabilidad.valorVentaTotalHoyCop,
          utilidadTotalCop: rentabilidad.utilidadHoyCop,
          gdpPromedio: rentabilidad.gdpPromedioKgDia,
          precioKiloCop: rentabilidad.precioKiloMercado,
        });
      } else if (key === 'gastos') {
        const porCategoria: Record<string, number> = {};
        gastos.forEach((g) => { porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + g.montoCop; });
        await exportarGastosPDF({
          loteNombre,
          gastos: gastos.map((g) => ({ fecha: g.fecha, categoria: g.categoria, descripcion: g.descripcion, montoCop: g.montoCop })),
          totalCop: gastos.reduce((s, g) => s + g.montoCop, 0),
          porCategoria,
        });
      } else if (key === 'pesajes') {
        // Traer pesajes de todos los animales del lote
        const todos: { animalArete?: string; animalRaza?: string; fecha: string; pesoKg: number; nota?: string }[] = [];
        for (const a of animales) {
          const ps = await pesajesApi.porAnimal(a.id);
          ps.forEach((p) => todos.push({
            animalArete: a.arete,
            animalRaza: a.raza,
            fecha: p.fecha,
            pesoKg: p.pesoKg,
            nota: p.nota,
          }));
        }
        todos.sort((a, b) => a.fecha.localeCompare(b.fecha));
        await exportarPesajesPDF({ loteNombre, pesajes: todos });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo generar el reporte');
    } finally {
      setGenerando(null);
    }
  }

  async function generarCSV(key: ReporteKey) {
    const loteNombre = lote?.nombre ?? nombre ?? 'Lote';
    setGenerando(`csv-${key}`);
    try {
      if (key === 'resumen') {
        if (!rentabilidad) {
          Alert.alert('Sin datos', 'Configura el precio de mercado para generar el resumen.');
          return;
        }
        await exportarAnimalesCSV({
          loteNombre,
          animales: rentabilidad.animales.map((a) => ({
            arete: a.arete ?? undefined,
            raza: a.raza ?? undefined,
            pesoInicialKg: animales.find((x) => x.id === a.animalId)?.pesoInicialKg ?? 0,
            pesoActualKg: a.pesoActualKg,
            gdpKgDia: a.gdpKgDia,
            precioCompraCop: a.precioCompraCop,
            valorHoyCop: a.valorVentaHoyCop,
            utilidadHoyCop: a.utilidadHoyCop,
          })),
          totalInvertidoCop: rentabilidad.costoTotalLoteCop,
          valorHoyTotalCop: rentabilidad.valorVentaTotalHoyCop,
          utilidadTotalCop: rentabilidad.utilidadHoyCop,
          gdpPromedio: rentabilidad.gdpPromedioKgDia,
          precioKiloCop: rentabilidad.precioKiloMercado,
        });
      } else if (key === 'gastos') {
        await exportarGastosCSV(
          gastos.map((g) => ({ fecha: g.fecha, categoria: g.categoria, descripcion: g.descripcion, montoCop: g.montoCop })),
          loteNombre,
        );
      } else if (key === 'pesajes') {
        const todos: { animalArete?: string; animalRaza?: string; fecha: string; pesoKg: number; nota?: string }[] = [];
        for (const a of animales) {
          const ps = await pesajesApi.porAnimal(a.id);
          ps.forEach((p) => todos.push({
            animalArete: a.arete,
            animalRaza: a.raza,
            fecha: p.fecha,
            pesoKg: p.pesoKg,
            nota: p.nota,
          }));
        }
        todos.sort((a, b) => a.fecha.localeCompare(b.fecha));
        await exportarPesajesCSV(todos, loteNombre);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo generar el archivo');
    } finally {
      setGenerando(null);
    }
  }

  const loteNombre = lote?.nombre ?? nombre ?? '—';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo}>Reportes</Text>
          <Text style={styles.headerSub}>{loteNombre}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Aviso si no hay precio mercado */}
        {!precioMercado && (
          <View style={styles.aviso}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.amarillo} />
            <Text style={styles.avisoTexto}>
              Sin precio de mercado: el reporte de resumen no incluirá rentabilidad.
            </Text>
          </View>
        )}

        {/* Estadísticas rápidas */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValor}>{animales.length}</Text>
            <Text style={styles.statLabel}>Animales</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValor}>{gastos.length}</Text>
            <Text style={styles.statLabel}>Gastos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValor}>
              ${(gastos.reduce((s, g) => s + g.montoCop, 0) / 1e6).toFixed(1)}M
            </Text>
            <Text style={styles.statLabel}>Total gastos</Text>
          </View>
        </View>

        {/* Tarjetas de reporte */}
        {REPORTES.map((r) => {
          const isPDFLoading = generando === `pdf-${r.key}`;
          const isCSVLoading = generando === `csv-${r.key}`;
          const isAny = isPDFLoading || isCSVLoading;

          return (
            <View key={r.key} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.cardIconBox, { backgroundColor: r.bg }]}>
                  <Ionicons name={r.icon as any} size={24} color={r.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitulo}>{r.titulo}</Text>
                  <Text style={styles.cardDesc}>{r.descripcion}</Text>
                </View>
              </View>

              <View style={styles.cardBotones}>
                {/* PDF */}
                <TouchableOpacity
                  style={[styles.btnExport, styles.btnPDF, isAny && styles.btnDisabled]}
                  onPress={() => generarPDF(r.key)}
                  disabled={!!generando}
                  activeOpacity={0.7}
                >
                  {isPDFLoading ? (
                    <ActivityIndicator size="small" color={COLORS.blanco} />
                  ) : (
                    <Ionicons name="document-outline" size={16} color={COLORS.blanco} />
                  )}
                  <Text style={styles.btnExportTexto}>
                    {isPDFLoading ? 'Generando…' : 'PDF'}
                  </Text>
                </TouchableOpacity>

                {/* Excel/CSV */}
                <TouchableOpacity
                  style={[styles.btnExport, styles.btnCSV, isAny && styles.btnDisabled]}
                  onPress={() => generarCSV(r.key)}
                  disabled={!!generando}
                  activeOpacity={0.7}
                >
                  {isCSVLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primario} />
                  ) : (
                    <Ionicons name="grid-outline" size={16} color={COLORS.primario} />
                  )}
                  <Text style={[styles.btnExportTexto, { color: COLORS.primario }]}>
                    {isCSVLoading ? 'Generando…' : 'Excel / CSV'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.nota}>
          Los archivos se abren directamente en WhatsApp, Google Drive, Numbers, Excel o cualquier app compatible en tu dispositivo.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    backgroundColor: COLORS.primarioOscuro, paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  headerSub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scroll: { padding: SPACING.md, paddingBottom: 48, gap: SPACING.md },

  aviso: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fef9c3', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#fde68a',
    padding: SPACING.md,
  },
  avisoTexto: { flex: 1, fontSize: FONT.sm, color: '#92400e', lineHeight: 18 },

  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borde,
    paddingVertical: SPACING.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.texto },
  statLabel: { fontSize: FONT.sm, color: COLORS.textoSuave },

  card: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    padding: SPACING.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
  cardIconBox: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitulo: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: 4 },
  cardDesc: { fontSize: FONT.sm, color: COLORS.textoSuave, lineHeight: 18 },

  cardBotones: { flexDirection: 'row', gap: SPACING.sm },
  btnExport: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: RADIUS.md,
  },
  btnPDF: { backgroundColor: COLORS.primario },
  btnCSV: {
    backgroundColor: COLORS.primarioSuave,
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
  },
  btnDisabled: { opacity: 0.5 },
  btnExportTexto: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.blanco },

  nota: {
    fontSize: FONT.sm, color: COLORS.textoMuysuave,
    textAlign: 'center', lineHeight: 18, paddingHorizontal: SPACING.md,
  },
});
