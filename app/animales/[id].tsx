import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { animalesApi } from '../../services/api/animales';
import { pesajesApi, type Pesaje } from '../../services/api/pesajes';
import { GraficaPesos } from '../../components/GraficaPesos';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

function GdpBadge({ gdp }: { gdp: number }) {
  const color = gdp >= 0.9 ? COLORS.verde : gdp >= 0.6 ? COLORS.amarillo : COLORS.rojo;
  const bg = gdp >= 0.9 ? COLORS.verdeClaro : gdp >= 0.6 ? COLORS.amarilloClaro : COLORS.rojoClaro;
  const label = gdp >= 0.9 ? 'Excelente' : gdp >= 0.6 ? 'Normal' : 'Bajo';
  return (
    <View style={[styles.gdpBadge, { backgroundColor: bg }]}>
      <View style={[styles.gdpDot, { backgroundColor: color }]} />
      <Text style={[styles.gdpBadgeTexto, { color }]}>{label}</Text>
    </View>
  );
}

function PesajeRow({ pesaje, onDelete }: { pesaje: Pesaje; onDelete: () => void }) {
  return (
    <View style={styles.pesajeRow}>
      <View style={styles.pesajeIconBox}>
        <Ionicons name="barbell-outline" size={16} color={COLORS.primario} />
      </View>
      <View style={styles.pesajeInfo}>
        <Text style={styles.pesajePeso}>{pesaje.pesoKg} kg</Text>
        <Text style={styles.pesajeFecha}>
          {new Date(pesaje.fecha).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </Text>
        {pesaje.nota ? (
          <Text style={styles.pesajeObs} numberOfLines={1}>{pesaje.nota}</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={COLORS.textoMuysuave} />
      </TouchableOpacity>
    </View>
  );
}

export default function DetalleAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: animal, isLoading: loadingAnimal } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => animalesApi.obtener(id!),
    enabled: !!id,
  });

  const { data: gdp, isLoading: loadingGdp } = useQuery({
    queryKey: ['gdp', id],
    queryFn: () => pesajesApi.gdp(id!),
    enabled: !!id,
  });

  const { data: pesajes = [], isLoading: loadingPesajes } = useQuery({
    queryKey: ['pesajes', id],
    queryFn: () => pesajesApi.porAnimal(id!),
    enabled: !!id,
  });

  const actualizarFoto = useMutation({
    mutationFn: (fotoUrl: string) => animalesApi.actualizar(id!, { fotoUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['animal', id] }),
    onError: () => Alert.alert('Error', 'No se pudo actualizar la foto'),
  });

  const eliminarPesaje = useMutation({
    mutationFn: (pesajeId: string) => pesajesApi.eliminar(pesajeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pesajes', id] });
      qc.invalidateQueries({ queryKey: ['gdp', id] });
    },
  });

  async function cambiarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') return;
    }

    Alert.alert('Foto del animal', 'Elige la fuente', [
      {
        text: 'Cámara', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled) subirYGuardar(result.assets[0].uri);
        },
      },
      {
        text: 'Galería', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled) subirYGuardar(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function subirYGuardar(uri: string) {
    try {
      const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const filename = `animal_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: `image/${ext}` } as any);
      const { error } = await supabase.storage
        .from('animales')
        .upload(filename, formData, { contentType: `image/${ext}` });
      if (error) throw error;
      const publicUrl = supabase.storage.from('animales').getPublicUrl(filename).data.publicUrl;
      actualizarFoto.mutate(publicUrl);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la foto');
    }
  }

  const confirmarEliminar = (pesajeId: string) => {
    Alert.alert('Eliminar pesaje', '¿Eliminar este registro de peso?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarPesaje.mutate(pesajeId) },
    ]);
  };

  const isLoading = loadingAnimal || loadingGdp || loadingPesajes;

  if (isLoading && !animal) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORS.primario} />
      </View>
    );
  }

  const pesoActual = gdp?.pesoActualKg ?? animal?.pesoInicialKg ?? 0;
  const gananciaTotal = pesoActual - (animal?.pesoInicialKg ?? 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
          </TouchableOpacity>
          {animal?.estado === 'ACTIVO' && (
            <TouchableOpacity
              onPress={() => router.push(`/animales/editar?id=${id}`)}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.blanco} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={cambiarFoto} activeOpacity={0.8}>
            {animal?.fotoUrl ? (
              <View>
                <Image
                  source={{ uri: animal.fotoUrl }}
                  style={styles.fotoAnimal}
                  onError={() => {}}
                />
                <View style={styles.fotoEditBadge}>
                  <Ionicons name="camera" size={10} color={COLORS.blanco} />
                </View>
              </View>
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Ionicons name="camera-outline" size={24} color="rgba(255,255,255,0.7)" />
                <Text style={styles.fotoPlaceholderTexto}>Agregar foto</Text>
              </View>
            )}
            {actualizarFoto.isPending && (
              <ActivityIndicator style={StyleSheet.absoluteFillObject} color={COLORS.blanco} />
            )}
          </TouchableOpacity>
          <View style={styles.headerTextos}>
            <Text style={styles.headerTitulo} numberOfLines={1}>
              {animal?.arete ? `Arete #${animal.arete}` : 'Sin arete'}
            </Text>
            {animal?.raza && <Text style={styles.headerSub}>{animal.raza}</Text>}
            {animal?.edadMeses && (
              <Text style={styles.headerSub}>{animal.edadMeses} meses de edad</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* GDP Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ganancia Diaria de Peso</Text>
          <View style={styles.gdpCard}>
            <View style={styles.gdpMain}>
              <Text style={styles.gdpValor}>
                {gdp ? `${gdp.gdpKgDia > 0 ? '+' : ''}${gdp.gdpKgDia.toFixed(3)} kg/día` : '—'}
              </Text>
              {gdp && <GdpBadge gdp={gdp.gdpKgDia} />}
            </View>
            {gdp && gdp.diasDesdeUltimoPesaje > 0 && (
              <View style={styles.gdpAlerta}>
                <Ionicons
                  name={gdp.diasDesdeUltimoPesaje > 30 ? 'warning-outline' : 'time-outline'}
                  size={13}
                  color={gdp.diasDesdeUltimoPesaje > 30 ? COLORS.amarillo : COLORS.textoSuave}
                />
                <Text style={[
                  styles.gdpAlertaTexto,
                  gdp.diasDesdeUltimoPesaje > 30 && { color: COLORS.amarillo },
                ]}>
                  Último pesaje hace {gdp.diasDesdeUltimoPesaje} días
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pesos resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pesos</Text>
          <View style={styles.pesosRow}>
            <View style={styles.pesoCard}>
              <Text style={styles.pesoLabel}>Peso inicial</Text>
              <Text style={styles.pesoValor}>{animal?.pesoInicialKg ?? '—'} kg</Text>
            </View>
            <View style={styles.pesoCard}>
              <Text style={styles.pesoLabel}>Peso actual</Text>
              <Text style={[styles.pesoValor, { color: COLORS.primario }]}>{pesoActual} kg</Text>
            </View>
            <View style={styles.pesoCard}>
              <Text style={styles.pesoLabel}>Ganancia</Text>
              <Text style={[
                styles.pesoValor,
                { color: gananciaTotal >= 0 ? COLORS.verde : COLORS.rojo },
              ]}>
                {gananciaTotal >= 0 ? '+' : ''}{gananciaTotal.toFixed(1)} kg
              </Text>
            </View>
          </View>

          {/* Gráfica de evolución de peso */}
          {animal && (
            <View style={{ marginTop: SPACING.md }}>
              <GraficaPesos
                puntos={[
                  { fecha: '', pesoKg: animal.pesoInicialKg ?? 0, esInicial: true },
                  ...pesajes.map((p) => ({ fecha: p.fecha, pesoKg: p.pesoKg })),
                ]}
              />
            </View>
          )}
        </View>

        {/* Proyecciones */}
        {gdp && gdp.gdpKgDia > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyecciones de peso</Text>
            <View style={styles.proyRow}>
              {[
                { label: '7 días', valor: gdp.pesoProyectado7d },
                { label: '15 días', valor: gdp.pesoProyectado15d },
                { label: '30 días', valor: gdp.pesoProyectado30d },
                { label: '60 días', valor: gdp.pesoProyectado60d },
              ].map(({ label, valor }) => (
                <View key={label} style={styles.proyCard}>
                  <Text style={styles.proyLabel}>{label}</Text>
                  <Text style={styles.proyValor}>{valor} kg</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info financiera */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información financiera</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="arrow-down-circle-outline" size={16} color={COLORS.textoSuave} />
              <Text style={styles.infoLabel}>Precio de compra</Text>
              <Text style={styles.infoValor}>
                ${animal?.precioCompraCop.toLocaleString('es-CO')}
              </Text>
            </View>

            {animal?.estado === 'VENDIDO' && animal.precioVentaCop ? (
              <>
                <View style={[styles.infoRow, { marginTop: SPACING.sm }]}>
                  <Ionicons name="arrow-up-circle-outline" size={16} color={COLORS.verde} />
                  <Text style={styles.infoLabel}>Precio de venta</Text>
                  <Text style={[styles.infoValor, { color: COLORS.verde }]}>
                    ${animal.precioVentaCop.toLocaleString('es-CO')}
                  </Text>
                </View>
                {animal.pesoVentaKg && (
                  <View style={[styles.infoRow, { marginTop: SPACING.sm }]}>
                    <Ionicons name="scale-outline" size={16} color={COLORS.textoSuave} />
                    <Text style={styles.infoLabel}>Peso al vender</Text>
                    <Text style={styles.infoValor}>{animal.pesoVentaKg} kg</Text>
                  </View>
                )}
                {(() => {
                  const ganancia = animal.precioVentaCop - animal.precioCompraCop;
                  const color = ganancia >= 0 ? COLORS.verde : COLORS.rojo;
                  const bg = ganancia >= 0 ? COLORS.verdeClaro : COLORS.rojoClaro;
                  return (
                    <View style={[styles.resultadoFinal, { backgroundColor: bg, borderColor: color }]}>
                      <Text style={styles.resultadoLabel}>Resultado final</Text>
                      <Text style={[styles.resultadoValor, { color }]}>
                        {ganancia >= 0 ? '+' : ''}${Math.abs(ganancia).toLocaleString('es-CO')}
                      </Text>
                      {animal.pesoVentaKg && (
                        <Text style={styles.resultadoSub}>
                          {(animal.pesoVentaKg - (animal.pesoInicialKg ?? 0)).toFixed(1)} kg ganados
                        </Text>
                      )}
                    </View>
                  );
                })()}
              </>
            ) : null}
          </View>

          {animal?.estado === 'ACTIVO' && (
            <TouchableOpacity
              style={styles.venderBtn}
              onPress={() => router.push(`/animales/vender?id=${id}`)}
            >
              <Ionicons name="checkmark-done-circle-outline" size={18} color={COLORS.primarioOscuro} />
              <Text style={styles.venderBtnTexto}>Registrar venta de este animal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Historial de pesajes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de pesajes</Text>
            <TouchableOpacity
              style={styles.agregarBtn}
              onPress={() => router.push(`/pesajes/crear?animalId=${id}&loteId=${animal?.loteId}`)}
            >
              <Ionicons name="add" size={16} color={COLORS.primario} />
              <Text style={styles.agregarBtnTexto}>Registrar</Text>
            </TouchableOpacity>
          </View>

          {pesajes.length === 0 ? (
            <EmptyState
              icon="barbell-outline"
              titulo="Sin pesajes"
              sub="Registra el primer pesaje para ver la evolución del peso."
              botonTexto="Registrar pesaje"
              onBoton={() => router.push(`/pesajes/crear?animalId=${id}&loteId=${animal?.loteId}`)}
            />
          ) : (
            <View style={styles.pesajesList}>
              <View style={[styles.pesajeRow, styles.pesajeInicial]}>
                <View style={[styles.pesajeIconBox, { backgroundColor: COLORS.fondo }]}>
                  <Ionicons name="flag-outline" size={16} color={COLORS.textoSuave} />
                </View>
                <View style={styles.pesajeInfo}>
                  <Text style={[styles.pesajePeso, { color: COLORS.textoSuave }]}>
                    {animal?.pesoInicialKg} kg
                  </Text>
                  <Text style={styles.pesajeFecha}>Peso inicial (compra)</Text>
                </View>
              </View>

              {pesajes.map((p) => (
                <PesajeRow key={p.id} pesaje={p} onDelete={() => confirmarEliminar(p.id)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.primario,
    paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  backBtn: {},
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  fotoAnimal: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  fotoEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primarioOscuro, borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.blanco,
  },
  fotoPlaceholder: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  fotoPlaceholderTexto: { fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  headerTextos: { flex: 1 },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  headerSub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  scroll: { padding: SPACING.md, paddingBottom: 40 },

  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: SPACING.sm },
  agregarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.primarioBorde,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4,
  },
  agregarBtnTexto: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.primario },

  gdpCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borde,
  },
  gdpMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  gdpValor: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.texto },
  gdpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  gdpDot: { width: 7, height: 7, borderRadius: 4 },
  gdpBadgeTexto: { fontSize: FONT.sm, fontWeight: '700' },
  gdpAlerta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gdpAlertaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave },

  pesosRow: { flexDirection: 'row', gap: SPACING.sm },
  pesoCard: {
    flex: 1, backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.borde,
    alignItems: 'center',
  },
  pesoLabel: { fontSize: FONT.sm, color: COLORS.textoSuave, marginBottom: 4, textAlign: 'center' },
  pesoValor: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.texto },

  proyRow: { flexDirection: 'row', gap: SPACING.sm },
  proyCard: {
    flex: 1, backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primarioBorde,
  },
  proyLabel: { fontSize: 11, color: COLORS.primarioOscuro, marginBottom: 4, textAlign: 'center' },
  proyValor: { fontSize: FONT.md, fontWeight: '700', color: COLORS.primarioOscuro },

  infoCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borde,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoLabel: { flex: 1, fontSize: FONT.md, color: COLORS.textoSuave },
  infoValor: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },

  pesajesList: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde, overflow: 'hidden',
  },
  pesajeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  pesajeInicial: { backgroundColor: COLORS.fondo },
  pesajeIconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarioSuave,
    justifyContent: 'center', alignItems: 'center',
  },
  pesajeInfo: { flex: 1 },
  pesajePeso: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },
  pesajeFecha: { fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 1 },
  pesajeObs: { fontSize: FONT.sm, color: COLORS.textoMuysuave, marginTop: 1 },

  resultadoFinal: {
    marginTop: SPACING.sm, borderRadius: RADIUS.sm,
    padding: SPACING.sm, borderWidth: 1, alignItems: 'center', gap: 2,
  },
  resultadoLabel: { fontSize: FONT.sm, color: COLORS.textoSuave },
  resultadoValor: { fontSize: FONT.xxl, fontWeight: '800' },
  resultadoSub: { fontSize: FONT.sm, color: COLORS.textoSuave },

  venderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.sm, paddingVertical: 12, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    backgroundColor: COLORS.primarioSuave,
  },
  venderBtnTexto: { fontSize: FONT.md, fontWeight: '600', color: COLORS.primarioOscuro },

});
