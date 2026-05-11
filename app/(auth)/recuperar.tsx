import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleEnviar() {
    if (!email.trim()) return Alert.alert('Campo requerido', 'Ingresa tu correo electrónico');

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEnviado(true);
    }
  }

  if (enviado) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.texto} />
        </TouchableOpacity>

        <View style={styles.exitoBox}>
          <View style={styles.exitoIcono}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.verde} />
          </View>
          <Text style={styles.exitoTitulo}>¡Correo enviado!</Text>
          <Text style={styles.exitoSub}>
            Revisa tu bandeja de entrada en{'\n'}
            <Text style={{ fontWeight: '700', color: COLORS.primario }}>{email}</Text>
            {'\n\n'}Sigue el enlace del correo para crear tu nueva contraseña.
          </Text>
          <Text style={styles.exitoNota}>
            ¿No lo ves? Revisa tu carpeta de spam.
          </Text>
          <TouchableOpacity
            style={styles.btnVolver}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.btnVolverTexto}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={COLORS.texto} />
      </TouchableOpacity>

      <View style={styles.contenido}>
        <View style={styles.iconoBox}>
          <Ionicons name="lock-open-outline" size={38} color={COLORS.primario} />
        </View>
        <Text style={styles.titulo}>Recuperar contraseña</Text>
        <Text style={styles.sub}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textoSuave} style={styles.inputIcono} />
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor={COLORS.textoMuysuave}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleEnviar}
              returnKeyType="send"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.boton, loading && styles.botonDeshabilitado]}
          onPress={handleEnviar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.blanco} />
            : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color={COLORS.blanco} />
                <Text style={styles.botonTexto}>Enviar enlace</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo, padding: SPACING.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 48, marginBottom: SPACING.sm,
  },
  contenido: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
  iconoBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primarioSuave,
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg, alignSelf: 'center',
  },
  titulo: {
    fontSize: FONT.xxl, fontWeight: '800', color: COLORS.texto,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT.md, color: COLORS.textoSuave,
    textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl,
  },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textoSecundario, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.blanco, borderWidth: 1, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
  },
  inputIcono: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: FONT.md, color: COLORS.texto },
  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  // Estado enviado
  exitoBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  exitoIcono: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.verdeClaro, borderWidth: 2, borderColor: COLORS.verde,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
  },
  exitoTitulo: {
    fontSize: FONT.xxl, fontWeight: '800', color: COLORS.texto,
    textAlign: 'center', marginBottom: SPACING.md,
  },
  exitoSub: {
    fontSize: FONT.md, color: COLORS.textoSuave,
    textAlign: 'center', lineHeight: 24, marginBottom: SPACING.sm,
  },
  exitoNota: {
    fontSize: FONT.sm, color: COLORS.textoMuysuave,
    textAlign: 'center', marginBottom: SPACING.xl,
  },
  btnVolver: {
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: SPACING.xl,
  },
  btnVolverTexto: { fontSize: FONT.md, fontWeight: '600', color: COLORS.primario },
});
