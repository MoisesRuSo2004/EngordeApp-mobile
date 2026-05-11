import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fincasApi, lotesApi, type Finca } from '../../services/api/lotes';
import { DatePickerField } from '../../components/DatePickerField';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

function Campo({ label, children, requerido }: { label: string; children: React.ReactNode; requerido?: boolean }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>
        {label}{requerido && <Text style={{ color: COLORS.rojo }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function CrearLoteScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [nombre, setNombre] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [fincaId, setFincaId] = useState('');
  const [modalFinca, setModalFinca] = useState(false);
  const [modalNuevaFinca, setModalNuevaFinca] = useState(false);
  const [nuevaFinca, setNuevaFinca] = useState({ nombre: '', municipio: '', departamento: '' });

  const { data: fincas = [] } = useQuery({ queryKey: ['fincas'], queryFn: fincasApi.listar });

  const crearLote = useMutation({
    mutationFn: lotesApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes'] });
      router.replace('/(tabs)/lotes');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const crearFinca = useMutation({
    mutationFn: fincasApi.crear,
    onSuccess: (finca) => {
      qc.invalidateQueries({ queryKey: ['fincas'] });
      setFincaId(finca.id);
      setModalNuevaFinca(false);
      setModalFinca(false);
      setNuevaFinca({ nombre: '', municipio: '', departamento: '' });
    },
    onError: (e: any) => Alert.alert('Error al crear finca', e.message),
  });

  function handleGuardar() {
    if (!nombre.trim()) return Alert.alert('Requerido', 'Ingresa el nombre del lote');
    if (!fincaId) return Alert.alert('Requerido', 'Selecciona una finca');
    crearLote.mutate({ nombre: nombre.trim(), fechaCompra, fincaId });
  }

  const fincaSeleccionada = fincas.find((f) => f.id === fincaId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.texto} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Nuevo Lote</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Campo label="Nombre del lote" requerido>
          <TextInput
            style={styles.input}
            placeholder="Ej: Lote Caucasia Mayo 2026"
            placeholderTextColor={COLORS.textoMuysuave}
            value={nombre}
            onChangeText={setNombre}
          />
        </Campo>

        <Campo label="Fecha de compra" requerido>
          <DatePickerField
            value={fechaCompra}
            onChange={setFechaCompra}
            label="Fecha de compra del lote"
            maxHoy
          />
        </Campo>

        <Campo label="Finca" requerido>
          <TouchableOpacity style={styles.selector} onPress={() => setModalFinca(true)}>
            <Ionicons name="location-outline" size={18} color={COLORS.textoSuave} />
            <Text style={[styles.selectorTexto, !fincaId && { color: COLORS.textoMuysuave }]} numberOfLines={1}>
              {fincaSeleccionada
                ? `${fincaSeleccionada.nombre} · ${fincaSeleccionada.municipio}`
                : 'Seleccionar finca...'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textoSuave} />
          </TouchableOpacity>
        </Campo>

        <TouchableOpacity
          style={[styles.botonPrimario, crearLote.isPending && styles.botonDeshabilitado]}
          onPress={handleGuardar}
          disabled={crearLote.isPending}
        >
          {crearLote.isPending
            ? <ActivityIndicator color={COLORS.blanco} />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.blanco} />
                <Text style={styles.botonPrimarioTexto}>Guardar Lote</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selector de finca */}
      <Modal visible={modalFinca} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Seleccionar Finca</Text>
              <TouchableOpacity onPress={() => setModalFinca(false)}>
                <Ionicons name="close" size={24} color={COLORS.texto} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={fincas}
              keyExtractor={(f) => f.id}
              style={{ maxHeight: 220 }}
              ListEmptyComponent={
                <Text style={styles.sinFincas}>No tienes fincas registradas aún.</Text>
              }
              renderItem={({ item }: { item: Finca }) => (
                <TouchableOpacity
                  style={[styles.fincaItem, fincaId === item.id && styles.fincaItemActivo]}
                  onPress={() => { setFincaId(item.id); setModalFinca(false); }}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={fincaId === item.id ? COLORS.primario : COLORS.textoSuave}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fincaItemNombre}>{item.nombre}</Text>
                    <Text style={styles.fincaItemSub}>{item.municipio}, {item.departamento}</Text>
                  </View>
                  {fincaId === item.id && <Ionicons name="checkmark" size={18} color={COLORS.primario} />}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={() => { setModalFinca(false); setModalNuevaFinca(true); }}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primario} />
              <Text style={styles.botonSecundarioTexto}>Crear nueva finca</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal nueva finca */}
      <Modal visible={modalNuevaFinca} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nueva Finca</Text>
              <TouchableOpacity onPress={() => setModalNuevaFinca(false)}>
                <Ionicons name="close" size={24} color={COLORS.texto} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la finca *"
              placeholderTextColor={COLORS.textoMuysuave}
              value={nuevaFinca.nombre}
              onChangeText={(v) => setNuevaFinca((p) => ({ ...p, nombre: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Municipio *"
              placeholderTextColor={COLORS.textoMuysuave}
              value={nuevaFinca.municipio}
              onChangeText={(v) => setNuevaFinca((p) => ({ ...p, municipio: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Departamento *"
              placeholderTextColor={COLORS.textoMuysuave}
              value={nuevaFinca.departamento}
              onChangeText={(v) => setNuevaFinca((p) => ({ ...p, departamento: v }))}
            />

            <TouchableOpacity
              style={[styles.botonPrimario, crearFinca.isPending && styles.botonDeshabilitado]}
              onPress={() => {
                if (!nuevaFinca.nombre.trim()) return Alert.alert('Requerido', 'Ingresa el nombre de la finca');
                if (!nuevaFinca.municipio.trim()) return Alert.alert('Requerido', 'Ingresa el municipio');
                if (!nuevaFinca.departamento.trim()) return Alert.alert('Requerido', 'Ingresa el departamento');
                crearFinca.mutate(nuevaFinca);
              }}
              disabled={crearFinca.isPending}
            >
              {crearFinca.isPending
                ? <ActivityIndicator color={COLORS.blanco} />
                : <>
                    <Ionicons name="add" size={20} color={COLORS.blanco} />
                    <Text style={styles.botonPrimarioTexto}>Crear Finca</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.blanco, borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.texto },
  scroll: { padding: SPACING.md, gap: 4, paddingBottom: 60 },
  campo: { marginBottom: SPACING.md },
  label: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textoSecundario, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.blanco, borderWidth: 1, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderWidth: 1, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  selectorTexto: { flex: 1, fontSize: FONT.md, color: COLORS.texto },
  botonPrimario: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15, marginTop: SPACING.sm,
  },
  botonPrimarioTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },
  botonDeshabilitado: { opacity: 0.6 },
  botonSecundario: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 12, marginTop: SPACING.sm,
  },
  botonSecundarioTexto: { color: COLORS.primario, fontSize: FONT.md, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SPACING.lg, paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto },
  sinFincas: { color: COLORS.textoSuave, textAlign: 'center', padding: SPACING.lg },
  fincaItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.borde, marginBottom: SPACING.sm,
  },
  fincaItemActivo: { borderColor: COLORS.primario, backgroundColor: COLORS.primarioSuave },
  fincaItemNombre: { fontSize: FONT.md, fontWeight: '600', color: COLORS.texto },
  fincaItemSub: { fontSize: FONT.sm, color: COLORS.textoSuave },
});
