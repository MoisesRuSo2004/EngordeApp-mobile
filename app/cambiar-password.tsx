import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

export default function CambiarPasswordScreen() {
  const router = useRouter();

  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  // Indicadores de fortaleza
  const tieneMinimo = nueva.length >= 6;
  const tieneNumero = /\d/.test(nueva);
  const tieneMayuscula = /[A-Z]/.test(nueva);
  const coinciden = nueva.length > 0 && nueva === confirmar;
  const fuerte = tieneMinimo && tieneNumero && tieneMayuscula;

  async function handleCambiar() {
    if (!nueva) return Alert.alert('Campo requerido', 'Ingresa la nueva contraseña');
    if (!tieneMinimo) return Alert.alert('Contraseña débil', 'Mínimo 6 caracteres');
    if (nueva !== confirmar) return Alert.alert('No coinciden', 'Las contraseñas no son iguales');

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setExito(true);
    }
  }

  if (exito) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnExito}>
          <Ionicons name="arrow-back" size={22} color={COLORS.texto} />
        </TouchableOpacity>
        <View style={styles.exitoBox}>
          <View style={styles.exitoIcono}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.verde} />
          </View>
          <Text style={styles.exitoTitulo}>¡Contraseña actualizada!</Text>
          <Text style={styles.exitoSub}>
            Tu contraseña se cambió correctamente.{'\n'}
            La próxima vez que inicies sesión usa tu nueva contraseña.
          </Text>
          <TouchableOpacity
            style={styles.btnVolver}
            onPress={() => router.back()}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.blanco} />
            <Text style={styles.btnVolverTexto}>Perfecto</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Cambiar contraseña</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primario} />
            <Text style={styles.infoBannerTexto}>
              No necesitas ingresar tu contraseña actual — ya estás autenticado.
            </Text>
          </View>

          {/* Nueva contraseña */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Nueva contraseña</Text>
            <View style={[styles.inputRow, nueva.length > 0 && !tieneMinimo && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textoSuave} style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                value={nueva}
                onChangeText={setNueva}
                secureTextEntry={!verNueva}
                placeholder="Nueva contraseña"
                placeholderTextColor={COLORS.textoMuysuave}
                autoFocus
              />
              <TouchableOpacity onPress={() => setVerNueva(!verNueva)} style={styles.ojito}>
                <Ionicons
                  name={verNueva ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color={COLORS.textoSuave}
                />
              </TouchableOpacity>
            </View>

            {/* Indicadores de fortaleza */}
            {nueva.length > 0 && (
              <View style={styles.fortalezaRow}>
                <Indicador ok={tieneMinimo} texto="Mínimo 6 caracteres" />
                <Indicador ok={tieneNumero} texto="Al menos un número" />
                <Indicador ok={tieneMayuscula} texto="Una mayúscula" />
              </View>
            )}
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Confirmar contraseña</Text>
            <View style={[
              styles.inputRow,
              confirmar.length > 0 && !coinciden && styles.inputError,
              coinciden && styles.inputOk,
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textoSuave} style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                value={confirmar}
                onChangeText={setConfirmar}
                secureTextEntry={!verConfirmar}
                placeholder="Repite la contraseña"
                placeholderTextColor={COLORS.textoMuysuave}
              />
              <TouchableOpacity onPress={() => setVerConfirmar(!verConfirmar)} style={styles.ojito}>
                <Ionicons
                  name={verConfirmar ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color={COLORS.textoSuave}
                />
              </TouchableOpacity>
            </View>
            {confirmar.length > 0 && !coinciden && (
              <Text style={styles.errorTexto}>Las contraseñas no coinciden</Text>
            )}
            {coinciden && (
              <View style={styles.coincideRow}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.verde} />
                <Text style={styles.coincideTexto}>Las contraseñas coinciden</Text>
              </View>
            )}
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[
              styles.btnCambiar,
              (!tieneMinimo || !coinciden || guardando) && styles.btnDeshabilitado,
            ]}
            onPress={handleCambiar}
            disabled={!tieneMinimo || !coinciden || guardando}
          >
            {guardando
              ? <ActivityIndicator color={COLORS.blanco} />
              : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.blanco} />
                  <Text style={styles.btnCambiarTexto}>Cambiar contraseña</Text>
                </>
              )
            }
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Indicador({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <View style={indicStyles.row}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={ok ? COLORS.verde : COLORS.textoMuysuave}
      />
      <Text style={[indicStyles.texto, ok && indicStyles.textoOk]}>{texto}</Text>
    </View>
  );
}

const indicStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  texto: { fontSize: 12, color: COLORS.textoMuysuave },
  textoOk: { color: COLORS.verde },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primarioOscuro,
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },

  scroll: { padding: SPACING.md, paddingBottom: 56 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primarioBorde,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  infoBannerTexto: {
    flex: 1, fontSize: FONT.sm, color: COLORS.primarioOscuro, lineHeight: 20,
  },

  campo: { marginBottom: SPACING.lg },
  campoLabel: {
    fontSize: FONT.sm, fontWeight: '600', color: COLORS.textoSecundario, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.blanco, borderWidth: 1.5, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
  },
  inputError: { borderColor: COLORS.rojo, backgroundColor: '#fff5f5' },
  inputOk: { borderColor: COLORS.verde },
  inputIcono: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: FONT.md, color: COLORS.texto },
  ojito: { padding: 4 },

  fortalezaRow: { marginTop: SPACING.sm, gap: 4 },
  errorTexto: { fontSize: 12, color: COLORS.rojo, marginTop: 5 },
  coincideRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  coincideTexto: { fontSize: 12, color: COLORS.verde },

  btnCambiar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15, marginTop: SPACING.sm,
  },
  btnDeshabilitado: { opacity: 0.45 },
  btnCambiarTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  // Estado éxito
  backBtnExito: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    marginTop: 56, marginLeft: SPACING.md,
  },
  exitoBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, paddingBottom: 80,
  },
  exitoIcono: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.verdeClaro, borderWidth: 2, borderColor: COLORS.verde,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
  },
  exitoTitulo: {
    fontSize: FONT.xxl, fontWeight: '800', color: COLORS.texto,
    textAlign: 'center', marginBottom: SPACING.md,
  },
  exitoSub: {
    fontSize: FONT.md, color: COLORS.textoSuave,
    textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl,
  },
  btnVolver: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: SPACING.xl,
  },
  btnVolverTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.blanco },
});
