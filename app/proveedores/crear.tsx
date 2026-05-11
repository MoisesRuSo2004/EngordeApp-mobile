import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { proveedoresApi } from '../../services/api/proveedores';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function CrearProveedorScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [calificacion, setCalificacion] = useState(0);

  const crear = useMutation({
    mutationFn: () =>
      proveedoresApi.crear({
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        municipio: municipio.trim() || undefined,
        historialCalificacion: calificacion > 0 ? calificacion : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleGuardar = () => {
    if (!nombre.trim()) return Alert.alert('Requerido', 'Ingresa el nombre del proveedor');
    crear.mutate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Nuevo proveedor</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="person-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Nombre *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Juan Carlos Martínez"
            placeholderTextColor={COLORS.textoMuysuave}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="call-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Teléfono</Text>
          </View>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ej: 300 123 4567"
            placeholderTextColor={COLORS.textoMuysuave}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="location-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Municipio</Text>
          </View>
          <TextInput
            style={styles.input}
            value={municipio}
            onChangeText={setMunicipio}
            placeholder="Ej: Montería, Córdoba"
            placeholderTextColor={COLORS.textoMuysuave}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.campo}>
          <View style={styles.campoHeader}>
            <Ionicons name="star-outline" size={16} color={COLORS.primario} />
            <Text style={styles.campoLabel}>Calificación histórica</Text>
          </View>
          <View style={styles.estrellas}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setCalificacion(i === calificacion ? 0 : i)} hitSlop={6}>
                <Ionicons
                  name={i <= calificacion ? 'star' : 'star-outline'}
                  size={32}
                  color={i <= calificacion ? COLORS.amarillo : COLORS.borde}
                />
              </TouchableOpacity>
            ))}
          </View>
          {calificacion > 0 && (
            <Text style={styles.calificacionTexto}>
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calificacion]}
            </Text>
          )}
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
              <Text style={styles.btnGuardarTexto}>Guardar proveedor</Text>
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
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },

  estrellas: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: 4 },
  calificacionTexto: {
    fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 4, fontWeight: '600',
  },

  btnGuardar: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: SPACING.sm, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
});
