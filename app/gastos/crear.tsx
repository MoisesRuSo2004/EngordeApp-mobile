import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { gastosApi, CATEGORIAS_GASTO, type CategoriaGasto } from '../../services/api/gastos';
import { DatePickerField } from '../../components/DatePickerField';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function CrearGastoScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const hoy = new Date().toISOString().split('T')[0];
  const [categoria, setCategoria] = useState<CategoriaGasto>('ALIMENTACION');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);

  const crear = useMutation({
    mutationFn: () =>
      gastosApi.crear({
        loteId: loteId!,
        categoria,
        montoCop: parseInt(monto.replace(/\D/g, ''), 10),
        descripcion: descripcion.trim() || undefined,
        fecha,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos', loteId] });
      qc.invalidateQueries({ queryKey: ['gastos-resumen', loteId] });
      qc.invalidateQueries({ queryKey: ['rentabilidad', loteId] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleGuardar = () => {
    const montoNum = parseInt(monto.replace(/\D/g, ''), 10);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a $0');
      return;
    }
    if (!fecha) {
      Alert.alert('Error', 'Ingresa la fecha del gasto');
      return;
    }
    crear.mutate();
  };

  const formatMonto = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits, 10).toLocaleString('es-CO') : '';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Registrar gasto</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Categorías */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="grid-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Categoría *</Text>
          </View>
          <View style={styles.categoriasGrid}>
            {CATEGORIAS_GASTO.map((cat) => {
              const activo = categoria === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoriaBtn, activo && styles.categoriaBtnActivo]}
                  onPress={() => setCategoria(cat.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={activo ? COLORS.primario : COLORS.textoSuave}
                  />
                  <Text style={[styles.categoriaBtnTexto, activo && styles.categoriaBtnTextoActivo]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Monto */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Monto (COP) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>$</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={monto}
              onChangeText={(val) => setMonto(formatMonto(val))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textoMuysuave}
            />
          </View>
        </View>

        {/* Fecha */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Fecha *</Text>
          </View>
          <DatePickerField
            value={fecha}
            onChange={setFecha}
            label="Fecha del gasto"
            maxHoy
          />
        </View>

        {/* Descripción */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="create-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Descripción</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Detalle del gasto…"
            placeholderTextColor={COLORS.textoMuysuave}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.btnGuardar, crear.isPending && styles.btnDeshabilitado]}
          onPress={handleGuardar}
          disabled={crear.isPending}
        >
          {crear.isPending ? (
            <ActivityIndicator color={COLORS.blanco} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.blanco} />
              <Text style={styles.btnGuardarTexto}>Guardar gasto</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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

  scroll: { padding: SPACING.md, paddingBottom: 40 },

  campo: { marginBottom: SPACING.lg },
  campoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  campoLabel: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },

  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  categoriaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  categoriaBtnActivo: {
    backgroundColor: COLORS.primarioSuave, borderColor: COLORS.primarioBorde,
  },
  categoriaBtnTexto: { fontSize: FONT.sm, color: COLORS.textoSuave, fontWeight: '500' },
  categoriaBtnTextoActivo: { color: COLORS.primario, fontWeight: '700' },

  input: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },
  inputFlex: { flex: 1 },
  inputArea: { minHeight: 90, paddingTop: 12 },
  inputConUnidad: { flexDirection: 'row', gap: SPACING.sm },
  unidad: {
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primarioBorde,
    paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  unidadTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.primario },

  btnGuardar: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
});
