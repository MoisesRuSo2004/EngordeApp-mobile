import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { animalesApi } from '../../services/api/animales';
import { RazaPickerField } from '../../components/RazaPickerField';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

// ─── Constantes de validación (mismas que crear.tsx) ─────────────────────────
const PESO_MIN = 50;
const PESO_MAX = 800;
const PRECIO_MIN = 10_000;
const EDAD_MAX = 120;

function validarCampos(peso: string, precio: string, edad: string): string | null {
  const pesoNum = parseFloat(peso.replace(',', '.'));
  if (!peso.trim()) return 'El peso inicial es requerido';
  if (isNaN(pesoNum) || pesoNum <= 0) return 'El peso debe ser un número positivo';
  if (pesoNum < PESO_MIN || pesoNum > PESO_MAX)
    return `El peso debe estar entre ${PESO_MIN} y ${PESO_MAX} kg`;

  const precioNum = parseInt(precio.replace(/\./g, '').replace(/\D/g, ''), 10);
  if (!precio.trim()) return 'El precio de compra es requerido';
  if (isNaN(precioNum) || precioNum <= 0) return 'El precio debe ser un número positivo';
  if (precioNum < PRECIO_MIN)
    return `El precio mínimo es $${PRECIO_MIN.toLocaleString('es-CO')}`;

  if (edad.trim()) {
    const edadNum = parseInt(edad, 10);
    if (isNaN(edadNum) || edadNum <= 0) return 'La edad debe ser un número positivo';
    if (edadNum > EDAD_MAX) return `La edad máxima es ${EDAD_MAX} meses`;
  }
  return null;
}

function formatPrecio(v: number | string): string {
  const num = typeof v === 'string' ? parseInt(v.replace(/\D/g, ''), 10) : v;
  return isNaN(num) ? '' : num.toLocaleString('es-CO');
}

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

export default function EditarAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => animalesApi.obtener(id!),
    enabled: !!id,
  });

  const [peso, setPeso] = useState('');
  const [precio, setPrecio] = useState('');
  const [raza, setRaza] = useState('');
  const [arete, setArete] = useState('');
  const [edad, setEdad] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);  // nueva foto local
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    if (animal) {
      setPeso(String(animal.pesoInicialKg));
      setPrecio(formatPrecio(animal.precioCompraCop));
      setRaza(animal.raza ?? '');
      setArete(animal.arete ?? '');
      setEdad(animal.edadMeses ? String(animal.edadMeses) : '');
    }
  }, [animal]);

  const actualizar = useMutation({
    mutationFn: (data: Parameters<typeof animalesApi.actualizar>[1]) =>
      animalesApi.actualizar(id!, data),
    onSuccess: () => {
      // Invalida con loteId correcto para refrescar la lista del lote
      qc.invalidateQueries({ queryKey: ['animal', id] });
      qc.invalidateQueries({ queryKey: ['animales', animal?.loteId] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  async function seleccionarFoto(fuente: 'camara' | 'galeria') {
    const pedir = fuente === 'camara'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await pedir();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', `Necesitamos acceso a tu ${fuente === 'camara' ? 'cámara' : 'galería'}`);
      return;
    }
    const lanzar = fuente === 'camara'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await lanzar({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }

  async function subirFoto(uri: string): Promise<string | undefined> {
    setSubiendoFoto(true);
    try {
      const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const filename = `animal_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: `image/${ext}` } as any);
      const { error } = await supabase.storage
        .from('animales')
        .upload(filename, formData, { contentType: `image/${ext}` });
      if (error) throw error;
      return supabase.storage.from('animales').getPublicUrl(filename).data.publicUrl;
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function handleGuardar() {
    const errorValidacion = validarCampos(peso, precio, edad);
    if (errorValidacion) return Alert.alert('Datos inválidos', errorValidacion);

    let fotoUrl = animal?.fotoUrl;
    if (fotoUri) {
      try {
        fotoUrl = await subirFoto(fotoUri);
      } catch {
        // Continúa sin actualizar la foto si la subida falla
      }
    }

    actualizar.mutate({
      pesoInicialKg: parseFloat(peso.replace(',', '.')),
      precioCompraCop: parseInt(precio.replace(/\./g, '').replace(/\D/g, ''), 10),
      raza: raza.trim() || undefined,
      arete: arete.trim() || undefined,
      edadMeses: edad.trim() ? parseInt(edad, 10) : undefined,
      fotoUrl,
    });
  }

  const guardando = actualizar.isPending || subiendoFoto;
  const fotoMostrada = fotoUri ?? animal?.fotoUrl ?? null;

  if (isLoading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORS.primario} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.texto} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Editar Animal</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Banner informativo */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primario} />
          <Text style={styles.infoTexto}>
            Para registrar un nuevo pesaje, usa el botón "Registrar" en la pantalla de detalle.
          </Text>
        </View>

        {/* Foto */}
        <View style={styles.fotoSection}>
          {fotoMostrada ? (
            <Image source={{ uri: fotoMostrada }} style={styles.fotoPreview} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={COLORS.primarioBorde} />
              <Text style={styles.fotoPlaceholderTexto}>Sin foto</Text>
            </View>
          )}
          <View style={styles.fotoBotones}>
            <TouchableOpacity style={styles.fotoBtnSecundario} onPress={() => seleccionarFoto('camara')}>
              <Ionicons name="camera-outline" size={16} color={COLORS.primario} />
              <Text style={styles.fotoBtnTexto}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fotoBtnSecundario} onPress={() => seleccionarFoto('galeria')}>
              <Ionicons name="images-outline" size={16} color={COLORS.primario} />
              <Text style={styles.fotoBtnTexto}>Galería</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Peso */}
        <Campo label="Peso inicial (kg)" requerido>
          <TextInput
            style={styles.input}
            placeholder="Ej: 215.5"
            placeholderTextColor={COLORS.textoMuysuave}
            keyboardType="decimal-pad"
            value={peso}
            onChangeText={setPeso}
          />
          <Text style={styles.hint}>Rango válido: {PESO_MIN} – {PESO_MAX} kg</Text>
        </Campo>

        {/* Precio */}
        <Campo label="Precio de compra (COP)" requerido>
          <View style={styles.inputConUnidad}>
            <View style={styles.unidad}>
              <Text style={styles.unidadTexto}>$</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Ej: 1.800.000"
              placeholderTextColor={COLORS.textoMuysuave}
              keyboardType="numeric"
              value={precio}
              onChangeText={(v) => {
                const d = v.replace(/\D/g, '');
                setPrecio(d ? parseInt(d, 10).toLocaleString('es-CO') : '');
              }}
            />
          </View>
          <Text style={styles.hint}>Mínimo $10.000 COP</Text>
        </Campo>

        {/* Raza */}
        <Campo label="Raza">
          <RazaPickerField value={raza} onChange={setRaza} />
        </Campo>

        {/* Arete y Edad */}
        <View style={styles.fila}>
          <View style={{ flex: 1 }}>
            <Campo label="Nº de arete">
              <TextInput
                style={styles.input}
                placeholder="Ej: 0045"
                placeholderTextColor={COLORS.textoMuysuave}
                keyboardType="numeric"
                value={arete}
                onChangeText={setArete}
              />
            </Campo>
          </View>
          <View style={{ flex: 1 }}>
            <Campo label="Edad (meses)">
              <TextInput
                style={styles.input}
                placeholder="Ej: 8"
                placeholderTextColor={COLORS.textoMuysuave}
                keyboardType="numeric"
                value={edad}
                onChangeText={setEdad}
              />
            </Campo>
          </View>
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnDeshabilitado]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <>
              <ActivityIndicator color={COLORS.blanco} />
              <Text style={styles.btnGuardarTexto}>
                {subiendoFoto ? 'Subiendo foto...' : 'Guardando...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.blanco} />
              <Text style={styles.btnGuardarTexto}>Guardar cambios</Text>
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
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.blanco, borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.texto },

  scroll: { padding: SPACING.md, paddingBottom: 60 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primarioBorde,
    marginBottom: SPACING.lg,
  },
  infoTexto: { flex: 1, fontSize: FONT.sm, color: COLORS.primarioOscuro, lineHeight: 20 },

  fotoSection: { marginBottom: SPACING.lg },
  fotoPreview: { width: '100%', height: 180, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  fotoPlaceholder: {
    width: '100%', height: 140, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarioSuave, borderWidth: 2,
    borderColor: COLORS.primarioBorde, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: SPACING.sm,
  },
  fotoPlaceholderTexto: { fontSize: FONT.sm, color: COLORS.textoSuave },
  fotoBotones: { flexDirection: 'row', gap: SPACING.sm },
  fotoBtnSecundario: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primario, borderRadius: RADIUS.sm, paddingVertical: 9,
  },
  fotoBtnTexto: { fontSize: FONT.sm, color: COLORS.primario, fontWeight: '600' },

  campo: { marginBottom: SPACING.md },
  label: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textoSecundario, marginBottom: 6 },
  hint: { fontSize: 11, color: COLORS.textoMuysuave, marginTop: 4, marginLeft: 2 },
  input: {
    backgroundColor: COLORS.blanco, borderWidth: 1, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },
  inputConUnidad: { flexDirection: 'row', gap: SPACING.sm },
  inputFlex: { flex: 1 },
  unidad: {
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primarioBorde,
    paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  unidadTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.primario },
  fila: { flexDirection: 'row', gap: SPACING.sm },

  btnGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15, marginTop: SPACING.sm,
  },
  btnGuardarTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },
  btnDeshabilitado: { opacity: 0.6 },
});
