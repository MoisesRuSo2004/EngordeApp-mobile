import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

const RAZAS_COMUNES = ['Cebú', 'Brahman', 'Simmental', 'Gyr', 'Nelore', 'Angus', 'Mestizo'];

export default function RegistroMasivoScreen() {
  const { loteId, loteNombre } = useLocalSearchParams<{ loteId: string; loteNombre: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [cantidad, setCantidad] = useState('');
  const [pesoPromedio, setPesoPromedio] = useState('');
  const [precioPromedio, setPrecioPromedio] = useState('');
  const [raza, setRaza] = useState('');
  const [razaPersonalizada, setRazaPersonalizada] = useState('');

  const crear = useMutation({
    mutationFn: () =>
      api.post('/animales/masivo', {
        loteId,
        cantidad: parseInt(cantidad, 10),
        pesoPromedioKg: parseFloat(pesoPromedio.replace(',', '.')),
        precioPromedioCop: parseInt(precioPromedio.replace(/\D/g, ''), 10),
        raza: razaPersonalizada.trim() || raza || undefined,
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['animales', loteId] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      qc.invalidateQueries({ queryKey: ['resumen'] });
      Alert.alert(
        '¡Listo!',
        `Se registraron ${data.count} animales exitosamente.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleGuardar = () => {
    const cant = parseInt(cantidad, 10);
    const peso = parseFloat(pesoPromedio.replace(',', '.'));
    const precio = parseInt(precioPromedio.replace(/\D/g, ''), 10);

    if (!cantidad || isNaN(cant) || cant < 1 || cant > 500)
      return Alert.alert('Dato inválido', 'Ingresa una cantidad entre 1 y 500 animales');
    if (!pesoPromedio || isNaN(peso) || peso <= 0)
      return Alert.alert('Dato inválido', 'El peso promedio es requerido');
    if (peso < 50 || peso > 800)
      return Alert.alert('Dato inválido', 'El peso promedio debe estar entre 50 y 800 kg');
    if (!precioPromedio || isNaN(precio) || precio <= 0)
      return Alert.alert('Dato inválido', 'El precio promedio de compra es requerido');
    if (precio < 10_000)
      return Alert.alert('Dato inválido', 'El precio mínimo por animal es $10.000 COP');

    const totalInvertido = precio * cant;
    Alert.alert(
      'Confirmar registro masivo',
      `${cant} animales × $${precio.toLocaleString('es-CO')}\nTotal invertido: $${totalInvertido.toLocaleString('es-CO')} COP`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Registrar', onPress: () => crear.mutate() },
      ],
    );
  };

  const formatPrecio = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d ? parseInt(d, 10).toLocaleString('es-CO') : '';
  };

  // Vista previa
  const cant = parseInt(cantidad, 10) || 0;
  const precio = parseInt(precioPromedio.replace(/\D/g, ''), 10) || 0;
  const totalPreview = cant * precio;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>Registro masivo</Text>
          {loteNombre && <Text style={styles.headerSub}>{loteNombre}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Explicación */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primario} />
          <Text style={styles.infoTexto}>
            Registra varios animales a la vez con peso y precio promedio. Ideal para lotes comprados en bloque.
          </Text>
        </View>

        {/* Cantidad */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="paw-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Cantidad de animales *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
            placeholder="Ej: 25"
            placeholderTextColor={COLORS.textoMuysuave}
          />
        </View>

        {/* Peso promedio */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Peso promedio (kg) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={pesoPromedio}
              onChangeText={setPesoPromedio}
              keyboardType="decimal-pad"
              placeholder="Ej: 215.0"
              placeholderTextColor={COLORS.textoMuysuave}
            />
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>kg</Text>
            </View>
          </View>
          <Text style={styles.hint}>Rango válido: 50 – 800 kg</Text>
        </View>

        {/* Precio promedio */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Precio promedio por animal (COP) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>$</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={precioPromedio}
              onChangeText={(v) => setPrecioPromedio(formatPrecio(v))}
              keyboardType="numeric"
              placeholder="Ej: 1.800.000"
              placeholderTextColor={COLORS.textoMuysuave}
            />
          </View>
          <Text style={styles.hint}>Mínimo $10.000 COP por animal</Text>
        </View>

        {/* Raza */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="star-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Raza (opcional)</Text>
          </View>
          <View style={styles.razasGrid}>
            {RAZAS_COMUNES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.razaChip, raza === r && !razaPersonalizada && styles.razaChipActivo]}
                onPress={() => { setRaza(r); setRazaPersonalizada(''); }}
              >
                <Text style={[styles.razaChipTexto, raza === r && !razaPersonalizada && styles.razaChipTextoActivo]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: SPACING.sm }]}
            value={razaPersonalizada}
            onChangeText={(v) => { setRazaPersonalizada(v); if (v) setRaza(''); }}
            placeholder="O escribe una raza diferente…"
            placeholderTextColor={COLORS.textoMuysuave}
          />
        </View>

        {/* Vista previa total */}
        {totalPreview > 0 && (
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total animales</Text>
              <Text style={styles.previewValor}>{cant}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Inversión total</Text>
              <Text style={[styles.previewValor, { color: COLORS.primario }]}>
                ${totalPreview.toLocaleString('es-CO')}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Peso total estimado</Text>
              <Text style={styles.previewValor}>
                {(parseFloat(pesoPromedio.replace(',', '.')) * cant || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })} kg
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnGuardar, crear.isPending && styles.btnDeshabilitado]}
          onPress={handleGuardar}
          disabled={crear.isPending}
        >
          {crear.isPending ? (
            <ActivityIndicator color={COLORS.blanco} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.blanco} />
              <Text style={styles.btnGuardarTexto}>Registrar {cant > 0 ? `${cant} ` : ''}animales</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    backgroundColor: COLORS.primario,
    paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  headerSub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  scroll: { padding: SPACING.md, paddingBottom: 40 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primarioBorde,
    marginBottom: SPACING.lg,
  },
  infoTexto: { flex: 1, fontSize: FONT.sm, color: COLORS.primarioOscuro, lineHeight: 20 },

  campo: { marginBottom: SPACING.lg },
  campoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  campoLabel: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },

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

  razasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  razaChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: COLORS.blanco, borderWidth: 1, borderColor: COLORS.borde,
  },
  razaChipActivo: { backgroundColor: COLORS.primarioSuave, borderColor: COLORS.primarioBorde },
  razaChipTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, fontWeight: '500' },
  razaChipTextoActivo: { color: COLORS.primario, fontWeight: '700' },

  previewCard: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    padding: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: FONT.md, color: COLORS.textoSuave },
  previewValor: { fontSize: FONT.md, fontWeight: '800', color: COLORS.texto },

  btnGuardar: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
  hint: { fontSize: 11, color: COLORS.textoMuysuave, marginTop: 4, marginLeft: 2 },
});
