import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { dashboardApi } from '../services/api/dashboard';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

const DEPARTAMENTOS = [
  'Antioquia', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
  'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
  'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vichada',
];

export default function PrecioMercadoScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: precioActual } = useQuery({
    queryKey: ['precio-mercado'],
    queryFn: () => dashboardApi.getPrecioMercado(),
  });

  const [precio, setPrecio] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [mostrarDepts, setMostrarDepts] = useState(false);

  const guardar = useMutation({
    mutationFn: () =>
      dashboardApi.setPrecioMercado(
        parseInt(precio.replace(/\D/g, ''), 10),
        departamento || undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['precio-mercado'] });
      qc.invalidateQueries({ queryKey: ['rentabilidad'] });
      Alert.alert('Guardado', 'Precio de mercado actualizado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleGuardar = () => {
    const p = parseInt(precio.replace(/\D/g, ''), 10);
    if (!precio || isNaN(p) || p <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido por kilogramo');
      return;
    }
    guardar.mutate();
  };

  const formatPrecio = (val: string) => {
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
        <Text style={styles.headerTitulo}>Precio de mercado</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Precio actual */}
        {precioActual && (
          <View style={styles.actualCard}>
            <View style={styles.actualIcon}>
              <Ionicons name="pricetag" size={20} color={COLORS.primario} />
            </View>
            <View>
              <Text style={styles.actualLabel}>Precio actual</Text>
              <Text style={styles.actualValor}>
                ${precioActual.precioKiloCop.toLocaleString('es-CO')} / kg
              </Text>
              {precioActual.departamento && (
                <Text style={styles.actualDept}>{precioActual.departamento}</Text>
              )}
              <Text style={styles.actualFecha}>
                {new Date(precioActual.fecha).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.info}>
          El precio por kilogramo de ganado en pie en tu región. Se usa para calcular la rentabilidad de cada lote.
        </Text>

        {/* Precio nuevo */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="scale-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Precio por kilogramo (COP) *</Text>
          </View>
          <View style={styles.inputConUnidad}>
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>$</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={precio}
              onChangeText={(v) => setPrecio(formatPrecio(v))}
              keyboardType="numeric"
              placeholder="6.000"
              placeholderTextColor={COLORS.textoMuysuave}
            />
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>/kg</Text>
            </View>
          </View>
        </View>

        {/* Departamento */}
        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="location-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Departamento (opcional)</Text>
          </View>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setMostrarDepts(!mostrarDepts)}
          >
            <Text style={departamento ? styles.selectorTexto : styles.selectorPlaceholder}>
              {departamento || 'Seleccionar departamento'}
            </Text>
            <Ionicons
              name={mostrarDepts ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textoSuave}
            />
          </TouchableOpacity>

          {mostrarDepts && (
            <View style={styles.deptLista}>
              {DEPARTAMENTOS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.deptItem, departamento === d && styles.deptItemActivo]}
                  onPress={() => { setDepartamento(d); setMostrarDepts(false); }}
                >
                  <Text style={[styles.deptTexto, departamento === d && styles.deptTextoActivo]}>
                    {d}
                  </Text>
                  {departamento === d && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primario} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardar.isPending && styles.btnDeshabilitado]}
          onPress={handleGuardar}
          disabled={guardar.isPending}
        >
          {guardar.isPending ? (
            <ActivityIndicator color={COLORS.blanco} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.blanco} />
              <Text style={styles.btnGuardarTexto}>Guardar precio</Text>
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

  actualCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primarioBorde,
    marginBottom: SPACING.md,
  },
  actualIcon: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.blanco,
    justifyContent: 'center', alignItems: 'center',
  },
  actualLabel: { fontSize: FONT.sm, color: COLORS.textoSuave, marginBottom: 2 },
  actualValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.primario },
  actualDept: { fontSize: FONT.sm, color: COLORS.primarioOscuro, marginTop: 1 },
  actualFecha: { fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 1 },

  info: {
    fontSize: FONT.sm, color: COLORS.textoSuave, lineHeight: 20,
    marginBottom: SPACING.lg,
  },

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

  selectorBtn: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorTexto: { fontSize: FONT.md, color: COLORS.texto },
  selectorPlaceholder: { fontSize: FONT.md, color: COLORS.textoMuysuave },

  deptLista: {
    marginTop: 4, backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borde,
    maxHeight: 240, overflow: 'hidden',
  },
  deptItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  deptItemActivo: { backgroundColor: COLORS.primarioSuave },
  deptTexto: { fontSize: FONT.md, color: COLORS.texto },
  deptTextoActivo: { color: COLORS.primario, fontWeight: '700' },

  btnGuardar: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
});
