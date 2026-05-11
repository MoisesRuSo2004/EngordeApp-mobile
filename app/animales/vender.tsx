import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { animalesApi } from '../../services/api/animales';
import { pesajesApi } from '../../services/api/pesajes';
import { DatePickerField } from '../../components/DatePickerField';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function VenderAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const hoy = new Date().toISOString().split('T')[0];

  const { data: animal } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => animalesApi.obtener(id!),
    enabled: !!id,
  });

  const { data: gdp } = useQuery({
    queryKey: ['gdp', id],
    queryFn: () => pesajesApi.gdp(id!),
    enabled: !!id,
  });

  const [precioVenta, setPrecioVenta] = useState('');
  const [pesoVenta, setPesoVenta] = useState('');
  const [fechaVenta, setFechaVenta] = useState(hoy);

  const vender = useMutation({
    mutationFn: () =>
      animalesApi.vender(id!, {
        precioVentaCop: parseInt(precioVenta.replace(/\D/g, ''), 10),
        pesoVentaKg: parseFloat(pesoVenta.replace(',', '.')),
        fechaVenta,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['animal', id] });
      qc.invalidateQueries({ queryKey: ['animales'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      qc.invalidateQueries({ queryKey: ['resumen'] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleVender = () => {
    const precio = parseInt(precioVenta.replace(/\D/g, ''), 10);
    const peso = parseFloat(pesoVenta.replace(',', '.'));

    if (!precioVenta.trim() || isNaN(precio) || precio <= 0)
      return Alert.alert('Dato inválido', 'El precio de venta es requerido');
    if (precio < 10_000)
      return Alert.alert('Dato inválido', 'El precio mínimo de venta es $10.000 COP');

    if (!pesoVenta.trim() || isNaN(peso) || peso <= 0)
      return Alert.alert('Dato inválido', 'El peso al momento de la venta es requerido');
    if (peso < 50 || peso > 800)
      return Alert.alert('Dato inválido', `El peso debe estar entre 50 y 800 kg`);

    const ganancia = precio - (animal?.precioCompraCop ?? 0);
    const signo = ganancia >= 0 ? '+' : '';
    const color = ganancia >= 0 ? 'verde' : 'roja';

    Alert.alert(
      '¿Confirmar venta?',
      `Precio: $${precio.toLocaleString('es-CO')}\nPeso venta: ${peso} kg\nResultado: ${signo}$${Math.abs(ganancia).toLocaleString('es-CO')} (${color})`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar venta',
          style: 'destructive',
          onPress: () => vender.mutate(),
        },
      ],
    );
  };

  const formatPrecio = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d ? parseInt(d, 10).toLocaleString('es-CO') : '';
  };

  // Vista previa de ganancia
  const precioNum = parseInt(precioVenta.replace(/\D/g, ''), 10) || 0;
  const pesoNum = parseFloat(pesoVenta.replace(',', '.')) || 0;
  const compra = animal?.precioCompraCop ?? 0;
  const gananciaPreview = precioNum > 0 ? precioNum - compra : null;
  const pesoInicial = animal?.pesoInicialKg ?? 0;
  const pesoActual = gdp?.pesoActualKg ?? pesoInicial;
  const kgGanados = pesoNum > 0 ? pesoNum - pesoInicial : pesoActual - pesoInicial;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>Registrar venta</Text>
          {animal?.arete && (
            <Text style={styles.headerSub}>Arete #{animal.arete}{animal.raza ? ` · ${animal.raza}` : ''}</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Resumen del animal */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Peso inicial</Text>
              <Text style={styles.resumenValor}>{pesoInicial} kg</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Peso actual est.</Text>
              <Text style={[styles.resumenValor, { color: COLORS.primario }]}>{pesoActual} kg</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Precio compra</Text>
              <Text style={styles.resumenValor}>${compra.toLocaleString('es-CO')}</Text>
            </View>
          </View>
        </View>

        {/* Vista previa de resultado */}
        {gananciaPreview !== null && (
          <View style={[
            styles.previewCard,
            { backgroundColor: gananciaPreview >= 0 ? COLORS.verdeClaro : COLORS.rojoClaro,
              borderColor: gananciaPreview >= 0 ? COLORS.verde : COLORS.rojo },
          ]}>
            <Text style={styles.previewLabel}>Resultado estimado</Text>
            <Text style={[styles.previewValor, { color: gananciaPreview >= 0 ? COLORS.verde : COLORS.rojo }]}>
              {gananciaPreview >= 0 ? '+' : ''}${Math.abs(gananciaPreview).toLocaleString('es-CO')} COP
            </Text>
            {pesoNum > 0 && (
              <Text style={styles.previewSub}>
                Kg ganados: {kgGanados >= 0 ? '+' : ''}{kgGanados.toFixed(1)} kg
              </Text>
            )}
          </View>
        )}

        {/* Precio de venta */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Precio de venta (COP) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>$</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={precioVenta}
              onChangeText={(v) => setPrecioVenta(formatPrecio(v))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textoMuysuave}
            />
          </View>
          <Text style={styles.hint}>Mínimo $10.000 COP</Text>
        </View>

        {/* Peso al vender */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Peso al vender (kg) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={pesoVenta}
              onChangeText={setPesoVenta}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={COLORS.textoMuysuave}
            />
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>kg</Text>
            </View>
          </View>
          <Text style={styles.hint}>Rango válido: 50 – 800 kg</Text>
        </View>

        {/* Fecha */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Fecha de venta *</Text>
          </View>
          <DatePickerField
            value={fechaVenta}
            onChange={setFechaVenta}
            label="Fecha de venta"
            maxHoy
          />
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.btnVender, vender.isPending && styles.btnDeshabilitado]}
          onPress={handleVender}
          disabled={vender.isPending}
        >
          {vender.isPending ? (
            <ActivityIndicator color={COLORS.blanco} />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle-outline" size={22} color={COLORS.blanco} />
              <Text style={styles.btnVenderTexto}>Confirmar venta</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.advertencia}>
          Esta acción marcará el animal como vendido. No se puede deshacer.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    backgroundColor: COLORS.primarioOscuro,
    paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  headerSub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scroll: { padding: SPACING.md, paddingBottom: 40 },

  resumenCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borde,
    marginBottom: SPACING.md,
  },
  resumenRow: { flexDirection: 'row' },
  resumenItem: { flex: 1, alignItems: 'center', gap: 4 },
  resumenLabel: { fontSize: FONT.sm, color: COLORS.textoSuave, textAlign: 'center' },
  resumenValor: { fontSize: FONT.md, fontWeight: '800', color: COLORS.texto },

  previewCard: {
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, marginBottom: SPACING.lg,
    alignItems: 'center', gap: 4,
  },
  previewLabel: { fontSize: FONT.sm, color: COLORS.textoSuave },
  previewValor: { fontSize: FONT.xxl, fontWeight: '800' },
  previewSub: { fontSize: FONT.sm, color: COLORS.textoSuave },

  campo: { marginBottom: SPACING.lg },
  campoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  campoLabel: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  hint: { fontSize: 11, color: COLORS.textoMuysuave, marginTop: 4, marginLeft: 2 },

  input: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },
  inputFlex: { flex: 1 },
  inputConUnidad: { flexDirection: 'row', gap: SPACING.sm },
  unidad: {
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primarioBorde,
    paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  unidadTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.primario },

  btnVender: {
    backgroundColor: COLORS.primarioOscuro, borderRadius: RADIUS.md,
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnVenderTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },

  advertencia: {
    fontSize: FONT.sm, color: COLORS.textoMuysuave,
    textAlign: 'center', marginTop: SPACING.md, lineHeight: 18,
  },
});
