import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { pesajesApi } from '../../services/api/pesajes';
import { DatePickerField } from '../../components/DatePickerField';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function CrearPesajeScreen() {
  const { animalId, loteId } = useLocalSearchParams<{ animalId: string; loteId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const hoy = new Date().toISOString().split('T')[0];
  const [pesoKg, setPesoKg] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [nota, setNota] = useState('');

  const crear = useMutation({
    mutationFn: () =>
      pesajesApi.crear({
        animalId: animalId!,
        loteId: loteId!,
        pesoKg: parseFloat(pesoKg.replace(',', '.')),
        fecha,
        nota: nota.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pesajes', animalId] });
      qc.invalidateQueries({ queryKey: ['gdp', animalId] });
      qc.invalidateQueries({ queryKey: ['animal', animalId] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleGuardar = () => {
    const peso = parseFloat(pesoKg.replace(',', '.'));
    if (!pesoKg || isNaN(peso) || peso <= 0 || peso > 1500)
      return Alert.alert('Error', 'Ingresa un peso válido entre 1 y 1.500 kg');
    if (!fecha)
      return Alert.alert('Error', 'Selecciona la fecha del pesaje');
    crear.mutate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Registrar pesaje</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Peso actual (kg) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={pesoKg}
              onChangeText={setPesoKg}
              keyboardType="decimal-pad"
              placeholder="Ej: 285.5"
              placeholderTextColor={COLORS.textoMuysuave}
            />
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>kg</Text>
            </View>
          </View>
        </View>

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Fecha del pesaje *</Text>
          </View>
          <DatePickerField
            value={fecha}
            onChange={setFecha}
            label="Fecha del pesaje"
            maxHoy
          />
        </View>

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="create-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Observaciones</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputArea]}
            value={nota}
            onChangeText={setNota}
            placeholder="Notas sobre el pesaje o estado del animal…"
            placeholderTextColor={COLORS.textoMuysuave}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

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
              <Text style={styles.btnGuardarTexto}>Guardar pesaje</Text>
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
    backgroundColor: COLORS.primario, paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  campo: { marginBottom: SPACING.lg },
  campoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  campoLabel: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  input: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: FONT.md, color: COLORS.texto,
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
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
});
