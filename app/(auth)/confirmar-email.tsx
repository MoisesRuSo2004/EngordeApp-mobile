import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

export default function ConfirmarEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  async function reenviarCorreo() {
    if (!email) return;
    setReenviando(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setReenviando(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setReenviado(true);
    }
  }

  return (
    <View style={styles.container}>
      {/* Ícono animado */}
      <View style={styles.iconoBox}>
        <Ionicons name="mail" size={44} color={COLORS.primario} />
      </View>

      <Text style={styles.titulo}>Revisa tu correo</Text>
      <Text style={styles.sub}>
        Enviamos un enlace de confirmación a:
      </Text>
      <View style={styles.emailBox}>
        <Ionicons name="at-outline" size={15} color={COLORS.primario} />
        <Text style={styles.emailTexto}>{email}</Text>
      </View>
      <Text style={styles.instruccion}>
        Haz clic en el enlace del correo para activar tu cuenta y luego vuelve a la app para iniciar sesión.
      </Text>

      {/* Reenviar */}
      {!reenviado ? (
        <TouchableOpacity
          style={styles.btnReenviar}
          onPress={reenviarCorreo}
          disabled={reenviando}
        >
          {reenviando
            ? <ActivityIndicator size="small" color={COLORS.primario} />
            : (
              <>
                <Ionicons name="refresh-outline" size={16} color={COLORS.primario} />
                <Text style={styles.btnReenviarTexto}>Reenviar correo</Text>
              </>
            )
          }
        </TouchableOpacity>
      ) : (
        <View style={styles.reenviado}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.verde} />
          <Text style={styles.reenviAdoTexto}>Correo reenviado</Text>
        </View>
      )}

      {/* Ir al login */}
      <TouchableOpacity
        style={styles.btnLogin}
        onPress={() => router.replace('/(auth)/login')}
      >
        <Ionicons name="log-in-outline" size={18} color={COLORS.blanco} />
        <Text style={styles.btnLoginTexto}>Ir al inicio de sesión</Text>
      </TouchableOpacity>

      <Text style={styles.nota}>
        ¿No ves el correo? Revisa tu carpeta de spam.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.fondo,
    alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconoBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primarioSuave,
    borderWidth: 2, borderColor: COLORS.primarioBorde,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  titulo: {
    fontSize: FONT.xxl, fontWeight: '800', color: COLORS.texto,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT.md, color: COLORS.textoSuave,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  emailBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primarioSuave,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primarioBorde,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  emailTexto: {
    fontSize: FONT.md, fontWeight: '700', color: COLORS.primario,
  },
  instruccion: {
    fontSize: FONT.sm, color: COLORS.textoSuave,
    textAlign: 'center', lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  btnReenviar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  btnReenviarTexto: {
    fontSize: FONT.md, fontWeight: '600', color: COLORS.primario,
  },
  reenviado: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: SPACING.md,
  },
  reenviAdoTexto: {
    fontSize: FONT.md, color: COLORS.verde, fontWeight: '600',
  },
  btnLogin: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  btnLoginTexto: {
    fontSize: FONT.md, fontWeight: '700', color: COLORS.blanco,
  },
  nota: {
    fontSize: FONT.sm, color: COLORS.textoMuysuave, textAlign: 'center',
  },
});
