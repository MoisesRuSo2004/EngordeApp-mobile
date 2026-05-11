import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { lotesApi } from '../../services/api/lotes';
import { animalesApi, type Animal } from '../../services/api/animales';
import { gastosApi, type Gasto, CATEGORIAS_GASTO } from '../../services/api/gastos';
import { dashboardApi, type RentabilidadLote } from '../../services/api/dashboard';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

type Tab = 'animales' | 'gastos' | 'rentabilidad';

// ─── Tarjeta animal ────────────────────────────────────────────────────────────
// ── Badge GDP ─────────────────────────────────────────────────────────────────
function GdpBadge({ gdp }: { gdp: number }) {
  const color = gdp >= 0.9 ? COLORS.verde : gdp >= 0.6 ? COLORS.amarillo : COLORS.rojo;
  const bg    = gdp >= 0.9 ? COLORS.verdeClaro : gdp >= 0.6 ? COLORS.amarilloClaro : COLORS.rojoClaro;
  const label = gdp >= 0.9 ? 'Exc' : gdp >= 0.6 ? 'Normal' : 'Bajo';
  return (
    <View style={[styles.gdpBadge, { backgroundColor: bg }]}>
      <View style={[styles.gdpDot, { backgroundColor: color }]} />
      <Text style={[styles.gdpBadgeTexto, { color }]}>{label}</Text>
    </View>
  );
}

function AnimalCard({ animal, onPress }: { animal: Animal; onPress: () => void }) {
  const pesajesOrdenados = animal.pesajes
    ? [...animal.pesajes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    : [];
  const pesoMostrado = animal.pesoActualKg ?? pesajesOrdenados[0]?.pesoKg ?? animal.pesoInicialKg;
  const esActual = !!(animal.pesoActualKg ?? pesajesOrdenados[0]?.pesoKg);
  const gananciKg = pesoMostrado - animal.pesoInicialKg;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardIconBox}>
        <Ionicons name="paw" size={20} color={COLORS.primario} />
      </View>
      <View style={styles.cardInfo}>
        {/* Fila superior: nombre + badge GDP */}
        <View style={styles.cardTituloRow}>
          <Text style={styles.cardNombre} numberOfLines={1}>
            {animal.arete ? `Arete #${animal.arete}` : 'Sin arete'}
            {animal.raza ? ` · ${animal.raza}` : ''}
          </Text>
          {animal.gdpKgDia !== undefined && <GdpBadge gdp={animal.gdpKgDia} />}
        </View>
        {/* Metas */}
        <View style={styles.cardMetas}>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={12} color={esActual ? COLORS.primario : COLORS.textoSuave} />
            <Text style={[styles.metaTexto, esActual && { color: COLORS.primario, fontWeight: '700' }]}>
              {pesoMostrado} kg
            </Text>
            <Text style={styles.metaEtiqueta}>{esActual ? 'actual' : 'inicial'}</Text>
          </View>
          {esActual && gananciKg !== 0 && (
            <View style={styles.metaItem}>
              <Ionicons
                name={gananciKg > 0 ? 'trending-up-outline' : 'trending-down-outline'}
                size={12}
                color={gananciKg > 0 ? COLORS.verde : COLORS.rojo}
              />
              <Text style={[styles.metaTexto, { color: gananciKg > 0 ? COLORS.verde : COLORS.rojo }]}>
                {gananciKg > 0 ? '+' : ''}{gananciKg.toFixed(1)} kg
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={12} color={COLORS.textoSuave} />
            <Text style={styles.metaTexto}>${animal.precioCompraCop.toLocaleString('es-CO')}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textoMuysuave} />
    </TouchableOpacity>
  );
}

// ─── Fila gasto ────────────────────────────────────────────────────────────────
function GastoRow({ gasto, onDelete }: { gasto: Gasto; onDelete: () => void }) {
  const cat = CATEGORIAS_GASTO.find((c) => c.value === gasto.categoria);
  return (
    <View style={styles.gastoRow}>
      <View style={styles.gastoIconBox}>
        <Ionicons name={cat?.icon as any ?? 'ellipsis-horizontal-outline'} size={16} color={COLORS.primario} />
      </View>
      <View style={styles.gastoInfo}>
        <Text style={styles.gastoCat}>{cat?.label ?? gasto.categoria}</Text>
        {gasto.descripcion ? <Text style={styles.gastoDesc} numberOfLines={1}>{gasto.descripcion}</Text> : null}
        <Text style={styles.gastoFecha}>
          {new Date(gasto.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.gastoMonto}>
        <Text style={styles.gastoMontoTexto}>${gasto.montoCop.toLocaleString('es-CO')}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={COLORS.textoMuysuave} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Panel rentabilidad ────────────────────────────────────────────────────────
function PanelRentabilidad({ loteId, precioKilo }: { loteId: string; precioKilo: number }) {
  const router = useRouter();
  const { data: rent, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rentabilidad', loteId],
    queryFn: () => dashboardApi.rentabilidadLote(loteId),
    enabled: precioKilo > 0,
  });

  if (precioKilo === 0) {
    return (
      <View style={styles.sinPrecio}>
        <Ionicons name="pricetag-outline" size={40} color={COLORS.borde} />
        <Text style={styles.sinPrecioTitulo}>Sin precio de mercado</Text>
        <Text style={styles.sinPrecioSub}>
          Configura el precio de mercado para calcular rentabilidad.
        </Text>
        <TouchableOpacity
          style={styles.setPrecioBtn}
          onPress={() => router.push('/precio-mercado')}
        >
          <Ionicons name="add" size={16} color={COLORS.blanco} />
          <Text style={styles.setPrecioBtnTexto}>Fijar precio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primario} />;
  }

  if (!rent) return null;

  const colorUtilidad = rent.utilidadHoyCop >= 0 ? COLORS.verde : COLORS.rojo;
  const bgUtilidad = rent.utilidadHoyCop >= 0 ? COLORS.verdeClaro : COLORS.rojoClaro;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
      {/* Resumen lote */}
      <View style={[styles.rentCard, { backgroundColor: bgUtilidad, borderColor: colorUtilidad }]}>
        <View style={styles.rentHeader}>
          <Text style={styles.rentTitulo}>Rentabilidad del lote</Text>
          <Text style={[styles.rentMargen, { color: colorUtilidad }]}>{rent.margenHoyPct}%</Text>
        </View>
        <View style={styles.rentRow}>
          <View style={styles.rentItem}>
            <Text style={styles.rentLabel}>Valor hoy</Text>
            <Text style={styles.rentValor}>${(rent.valorVentaTotalHoyCop / 1e6).toFixed(1)}M</Text>
          </View>
          <View style={styles.rentItem}>
            <Text style={styles.rentLabel}>Costo total</Text>
            <Text style={styles.rentValor}>${(rent.costoTotalLoteCop / 1e6).toFixed(1)}M</Text>
          </View>
          <View style={styles.rentItem}>
            <Text style={styles.rentLabel}>Utilidad</Text>
            <Text style={[styles.rentValor, { color: colorUtilidad }]}>
              {rent.utilidadHoyCop >= 0 ? '+' : ''}${(rent.utilidadHoyCop / 1e6).toFixed(1)}M
            </Text>
          </View>
        </View>
        <View style={styles.rentMeta}>
          <Ionicons name="trending-up-outline" size={14} color={COLORS.textoSuave} />
          <Text style={styles.rentMetaTexto}>
            GDP promedio: {rent.gdpPromedioKgDia.toFixed(3)} kg/día · Precio: ${rent.precioKiloMercado.toLocaleString('es-CO')}/kg
          </Text>
        </View>
      </View>

      {/* Lista animales con rentabilidad */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Por animal</Text>
      {rent.animales.map((a) => {
        const util = a.utilidadHoyCop;
        const color = util >= 0 ? COLORS.verde : COLORS.rojo;
        return (
          <View key={a.animalId} style={styles.animalRentCard}>
            <View style={styles.animalRentHeader}>
              <View style={styles.animalRentId}>
                <Ionicons name="paw-outline" size={14} color={COLORS.textoSuave} />
                <Text style={styles.animalRentNombre}>
                  {a.arete ? `#${a.arete}` : 'Sin arete'}
                  {a.raza ? ` · ${a.raza}` : ''}
                </Text>
              </View>
              <Text style={[styles.animalRentUtil, { color }]}>
                {util >= 0 ? '+' : ''}${(util / 1000).toFixed(0)}k
              </Text>
            </View>
            <View style={styles.animalRentMetas}>
              <Text style={styles.animalRentMeta}>{a.pesoActualKg} kg</Text>
              <Text style={styles.animalRentMetaDot}>·</Text>
              <Text style={styles.animalRentMeta}>GDP {a.gdpKgDia.toFixed(3)} kg/d</Text>
              <Text style={styles.animalRentMetaDot}>·</Text>
              <Text style={[styles.animalRentMeta, { color }]}>{a.margenHoyPct}%</Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => refetch()}
        disabled={isRefetching}
      >
        <Ionicons name="refresh-outline" size={16} color={COLORS.primario} />
        <Text style={styles.refreshBtnTexto}>{isRefetching ? 'Actualizando…' : 'Actualizar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export default function DetalleLoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('animales');
  const [mostrarVendidos, setMostrarVendidos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: () => lotesApi.obtener(id!),
  });

  const { data: animales = [], isRefetching: refAnimal, refetch: refetchAnimales } = useQuery({
    queryKey: ['animales', id],
    queryFn: () => animalesApi.listarPorLote(id!),
    enabled: !!id,
  });

  const { data: vendidos = [] } = useQuery({
    queryKey: ['animales-vendidos', id],
    queryFn: () => animalesApi.vendidosPorLote(id!),
    enabled: !!id && mostrarVendidos,
  });

  const { data: gastos = [], isRefetching: refGasto, refetch: refetchGastos } = useQuery({
    queryKey: ['gastos', id],
    queryFn: () => gastosApi.porLote(id!),
    enabled: !!id && tab === 'gastos',
  });

  const { data: precioMercado } = useQuery({
    queryKey: ['precio-mercado'],
    queryFn: () => dashboardApi.getPrecioMercado(),
  });

  const archivar = useMutation({
    mutationFn: () => lotesApi.archivar(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes'] });
      router.replace('/(tabs)/lotes');
    },
  });

  const eliminarGasto = useMutation({
    mutationFn: (gastoId: string) => gastosApi.eliminar(gastoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos', id] });
      qc.invalidateQueries({ queryKey: ['rentabilidad', id] });
    },
  });

  const animalesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return animales;
    const q = busqueda.toLowerCase();
    return animales.filter((a) =>
      (a.arete && a.arete.toLowerCase().includes(q)) ||
      (a.raza && a.raza.toLowerCase().includes(q))
    );
  }, [animales, busqueda]);

  if (isLoading) {
    return <View style={styles.centrado}><ActivityIndicator size="large" color={COLORS.primario} /></View>;
  }

  const activo = lote?.estado === 'ACTIVO';
  const totalGastos = gastos.reduce((s, g) => s + g.montoCop, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo} numberOfLines={1}>{lote?.nombre}</Text>
          <View style={styles.headerMetas}>
            {lote?.finca && (
              <View style={styles.headerMeta}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.headerMetaTexto}>{lote.finca.nombre} · {lote.finca.municipio}</Text>
              </View>
            )}
            <View style={styles.headerMeta}>
              <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerMetaTexto}>
                {new Date(lote?.fechaCompra ?? '').toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/reportes/lote?id=${id}&nombre=${encodeURIComponent(lote?.nombre ?? '')}`)}
          style={styles.precioBtn}
        >
          <Ionicons name="document-text-outline" size={16} color={COLORS.blanco} />
        </TouchableOpacity>
        {activo && (
          <TouchableOpacity
            onPress={() => router.push('/precio-mercado')}
            style={styles.precioBtn}
          >
            <Ionicons name="pricetag-outline" size={16} color={COLORS.blanco} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      {(() => {
        const diasOp = lote?.fechaCompra
          ? Math.floor((Date.now() - new Date(lote.fechaCompra).getTime()) / 86_400_000)
          : 0;
        return (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValor}>{animales.length}</Text>
              <Text style={styles.statLabel}>Animales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValor}>{diasOp}d</Text>
              <Text style={styles.statLabel}>Operación</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.estadoBadge, activo ? styles.estadoActivo : styles.estadoArchivado]}>
                <Ionicons name={activo ? 'checkmark-circle' : 'archive'} size={14} color={activo ? COLORS.primario : COLORS.textoSuave} />
                <Text style={[styles.estadoTexto, { color: activo ? COLORS.primario : COLORS.textoSuave }]}>
                  {activo ? 'Activo' : 'Archivado'}
                </Text>
              </View>
              <Text style={styles.statLabel}>Estado</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValor}>
                {precioMercado?.precioKiloCop
                  ? `$${(precioMercado.precioKiloCop / 1000).toFixed(0)}k`
                  : '—'}
              </Text>
              <Text style={styles.statLabel}>$/kg</Text>
            </View>
          </View>
        );
      })()}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['animales', 'gastos', 'rentabilidad'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActivo]}
            onPress={() => setTab(t)}
          >
            <Ionicons
              name={t === 'animales' ? 'paw-outline' : t === 'gastos' ? 'receipt-outline' : 'trending-up-outline'}
              size={15}
              color={tab === t ? COLORS.primario : COLORS.textoSuave}
            />
            <Text style={[styles.tabBtnTexto, tab === t && styles.tabBtnTextoActivo]}>
              {t === 'animales' ? 'Animales' : t === 'gastos' ? 'Gastos' : 'Rentabilidad'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab: Animales */}
      {tab === 'animales' && (
        <FlatList
          data={animalesFiltrados}
          keyExtractor={(a) => a.id}
          ListHeaderComponent={
            animales.length > 0 ? (
              <View style={styles.buscadorContainer}>
                <Ionicons name="search-outline" size={16} color={COLORS.textoSuave} />
                <TextInput
                  style={styles.buscadorInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por arete o raza…"
                  placeholderTextColor={COLORS.textoMuysuave}
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null
          }
          contentContainerStyle={styles.lista}
          onRefresh={refetchAnimales}
          refreshing={refAnimal}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="paw-outline" size={56} color={COLORS.primarioBorde} />
              <Text style={styles.vacioTitulo}>Sin animales</Text>
              <Text style={styles.vacioSub}>Agrega el primer animal a este lote.</Text>
              {activo && (
                <TouchableOpacity
                  style={styles.vacioBoton}
                  onPress={() => router.push(`/animales/crear?loteId=${id}`)}
                >
                  <Ionicons name="add" size={18} color={COLORS.blanco} />
                  <Text style={styles.vacioBotonTexto}>Agregar animal</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <AnimalCard animal={item} onPress={() => router.push(`/animales/${item.id}`)} />
          )}
          ListFooterComponent={
            <View>
              {/* Panel de animales vendidos */}
              <TouchableOpacity
                style={styles.vendidosToggle}
                onPress={() => setMostrarVendidos((v) => !v)}
              >
                <Ionicons
                  name={mostrarVendidos ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textoSuave}
                />
                <Text style={styles.vendidosToggleTexto}>
                  {mostrarVendidos ? 'Ocultar vendidos' : 'Ver animales vendidos'}
                </Text>
              </TouchableOpacity>

              {mostrarVendidos && vendidos.length === 0 && (
                <View style={styles.vendidosVacio}>
                  <Text style={styles.vendidosVacioTexto}>Sin animales vendidos en este lote</Text>
                </View>
              )}

              {mostrarVendidos && vendidos.map((v) => {
                const ganancia = (v.precioVentaCop ?? 0) - v.precioCompraCop;
                const color = ganancia >= 0 ? COLORS.verde : COLORS.rojo;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.card, styles.cardVendido]}
                    onPress={() => router.push(`/animales/${v.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cardIconBox, { backgroundColor: COLORS.fondo }]}>
                      <Ionicons name="checkmark-done" size={18} color={COLORS.textoSuave} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardNombre, { color: COLORS.textoSuave }]}>
                        {v.arete ? `Arete #${v.arete}` : 'Sin arete'}
                        {v.raza ? ` · ${v.raza}` : ''}
                      </Text>
                      <View style={styles.cardMetas}>
                        <View style={styles.metaItem}>
                          <Ionicons name="cash-outline" size={12} color={color} />
                          <Text style={[styles.metaTexto, { color }]}>
                            {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString('es-CO')}
                          </Text>
                        </View>
                        {v.fechaVenta && (
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.textoMuysuave} />
                            <Text style={styles.metaTexto}>
                              {new Date(v.fechaVenta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textoMuysuave} />
                  </TouchableOpacity>
                );
              })}

              {activo && (
                <TouchableOpacity
                  style={styles.archivarBtn}
                  onPress={() => Alert.alert('Archivar lote', '¿Seguro que deseas archivar este lote?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Archivar', style: 'destructive', onPress: () => archivar.mutate() },
                  ])}
                >
                  <Ionicons name="archive-outline" size={16} color={COLORS.rojo} />
                  <Text style={styles.archivarTexto}>Archivar este lote</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Tab: Gastos */}
      {tab === 'gastos' && (
        <FlatList
          data={gastos}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.lista}
          onRefresh={refetchGastos}
          refreshing={refGasto}
          ListHeaderComponent={
            gastos.length > 0 ? (
              <View style={styles.gastoTotalBanner}>
                <Text style={styles.gastoTotalLabel}>Total gastos</Text>
                <Text style={styles.gastoTotalValor}>${totalGastos.toLocaleString('es-CO')}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.primarioBorde} />
              <Text style={styles.vacioTitulo}>Sin gastos</Text>
              <Text style={styles.vacioSub}>Registra los gastos del lote.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GastoRow
              gasto={item}
              onDelete={() => Alert.alert('Eliminar gasto', '¿Eliminar este gasto?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => eliminarGasto.mutate(item.id) },
              ])}
            />
          )}
        />
      )}

      {/* Tab: Rentabilidad */}
      {tab === 'rentabilidad' && (
        <PanelRentabilidad loteId={id!} precioKilo={precioMercado?.precioKiloCop ?? 0} />
      )}

      {/* FAB contextual */}
      {activo && tab === 'animales' && (
        <>
          <TouchableOpacity
            style={styles.fabSecundario}
            onPress={() => router.push(`/animales/masivo?loteId=${id}&loteNombre=${encodeURIComponent(lote?.nombre ?? '')}`)}
          >
            <Ionicons name="list-outline" size={20} color={COLORS.primario} />
            <Text style={styles.fabSecundarioTexto}>Masivo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push(`/animales/crear?loteId=${id}`)}
          >
            <Ionicons name="add" size={28} color={COLORS.blanco} />
          </TouchableOpacity>
        </>
      )}
      {activo && tab === 'gastos' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/gastos/crear?loteId=${id}`)}
        >
          <Ionicons name="add" size={28} color={COLORS.blanco} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.primario, paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', marginTop: 2 },
  headerInfo: { flex: 1 },
  headerTitulo: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.blanco, marginBottom: 6 },
  headerMetas: { gap: 4 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerMetaTexto: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.85)' },
  precioBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },

  statsBar: {
    flexDirection: 'row', backgroundColor: COLORS.blanco,
    borderBottomWidth: 1, borderBottomColor: COLORS.borde,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.borde },
  statValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.texto },
  statLabel: { fontSize: FONT.sm, color: COLORS.textoSuave },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  estadoActivo: { backgroundColor: COLORS.primarioSuave },
  estadoArchivado: { backgroundColor: COLORS.fondo },
  estadoTexto: { fontSize: FONT.sm, fontWeight: '600' },

  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.blanco,
    borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActivo: { borderBottomColor: COLORS.primario },
  tabBtnTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, fontWeight: '500' },
  tabBtnTextoActivo: { color: COLORS.primario, fontWeight: '700' },

  lista: { padding: SPACING.md, paddingBottom: 100 },
  buscadorContainer: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    marginBottom: SPACING.sm,
  },
  buscadorInput: { flex: 1, fontSize: FONT.md, color: COLORS.texto },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  cardIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarioSuave,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTituloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardNombre: { flex: 1, fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  cardMetas: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave },
  metaEtiqueta: { fontSize: 10, color: COLORS.textoMuysuave, fontStyle: 'italic' },
  gdpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  gdpDot: { width: 6, height: 6, borderRadius: 3 },
  gdpBadgeTexto: { fontSize: 10, fontWeight: '700' },

  gastoRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  gastoIconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarioSuave,
    justifyContent: 'center', alignItems: 'center',
  },
  gastoInfo: { flex: 1 },
  gastoCat: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  gastoDesc: { fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 1 },
  gastoFecha: { fontSize: FONT.sm, color: COLORS.textoMuysuave, marginTop: 1 },
  gastoMonto: { alignItems: 'flex-end', gap: 6 },
  gastoMontoTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },

  gastoTotalBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  gastoTotalLabel: { fontSize: FONT.md, color: COLORS.textoSuave, fontWeight: '600' },
  gastoTotalValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.texto },

  vacio: { alignItems: 'center', paddingTop: SPACING.xl * 2, gap: SPACING.sm },
  vacioTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto },
  vacioSub: { fontSize: FONT.md, color: COLORS.textoSuave, textAlign: 'center' },
  vacioBoton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  vacioBotonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  archivarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.xl, paddingVertical: SPACING.sm,
  },
  archivarTexto: { color: COLORS.rojo, fontSize: FONT.md },

  vendidosToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: SPACING.md, marginTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.borde,
  },
  vendidosToggleTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, fontWeight: '600' },
  cardVendido: { opacity: 0.75, borderStyle: 'dashed' },
  vendidosVacio: { padding: SPACING.md, alignItems: 'center' },
  vendidosVacioTexto: { fontSize: FONT.sm, color: COLORS.textoMuysuave },

  // Rentabilidad
  sectionTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: SPACING.sm },
  rentCard: {
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, marginBottom: SPACING.sm,
  },
  rentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  rentTitulo: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },
  rentMargen: { fontSize: FONT.xxl, fontWeight: '800' },
  rentRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  rentItem: { flex: 1, alignItems: 'center' },
  rentLabel: { fontSize: FONT.sm, color: COLORS.textoSuave, marginBottom: 2 },
  rentValor: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.texto },
  rentMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rentMetaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, flex: 1 },

  animalRentCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  animalRentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  animalRentId: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  animalRentNombre: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  animalRentUtil: { fontSize: FONT.lg, fontWeight: '800' },
  animalRentMetas: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  animalRentMeta: { fontSize: FONT.sm, color: COLORS.textoSuave },
  animalRentMetaDot: { fontSize: FONT.sm, color: COLORS.textoMuysuave },

  sinPrecio: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm,
  },
  sinPrecioTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto },
  sinPrecioSub: { fontSize: FONT.md, color: COLORS.textoSuave, textAlign: 'center' },
  setPrecioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm,
  },
  setPrecioBtnTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.md, paddingVertical: SPACING.sm,
  },
  refreshBtnTexto: { color: COLORS.primario, fontSize: FONT.md },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: COLORS.primario, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  fabSecundario: {
    position: 'absolute', bottom: 96, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.full,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  fabSecundarioTexto: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.primario },
});
