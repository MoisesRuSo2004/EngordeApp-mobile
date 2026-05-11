import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
  Animated, Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { perfilesApi } from '../../services/api/perfiles';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

// ─── Utilidades username ──────────────────────────────────────────────────────

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');         // solo alfanumérico
}

function sugerirUsername(nombre: string): string {
  const base = normalizar(nombre).slice(0, 12);
  if (!base) return '';
  const num = Math.floor(Math.random() * 90) + 10;
  return `${base}${num}`;
}

function validarUsername(u: string): string | null {
  if (u.length < 3) return 'Mínimo 3 caracteres';
  if (u.length > 20) return 'Máximo 20 caracteres';
  if (!/^[a-z0-9_.]+$/.test(u)) return 'Solo letras, números, puntos y _';
  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

type DisponibilidadEstado = 'idle' | 'cargando' | 'disponible' | 'ocupado' | 'invalido';

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dispEstado, setDispEstado] = useState<DisponibilidadEstado>('idle');
  const [dispMensaje, setDispMensaje] = useState('');
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animaciones de fondo
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Scale, { toValue: 1.08, duration: 3500, useNativeDriver: true }),
        Animated.timing(circle1Scale, { toValue: 1,    duration: 3500, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Scale, { toValue: 1.06, duration: 4200, useNativeDriver: true }),
        Animated.timing(circle2Scale, { toValue: 1,    duration: 4200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Sugerir username automáticamente cuando se escribe el nombre
  useEffect(() => {
    if (nombre.trim() && !username) {
      setUsername(sugerirUsername(nombre.trim()));
    }
  }, [nombre]);

  // Verificar disponibilidad con debounce mientras se escribe
  useEffect(() => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    if (!username) {
      setDispEstado('idle');
      setDispMensaje('');
      return;
    }

    const error = validarUsername(username);
    if (error) {
      setDispEstado('invalido');
      setDispMensaje(error);
      return;
    }

    setDispEstado('cargando');
    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await perfilesApi.checkDisponible(username);
        if (res.disponible) {
          setDispEstado('disponible');
          setDispMensaje('Disponible');
        } else {
          setDispEstado('ocupado');
          setDispMensaje('Ya está en uso');
        }
      } catch {
        setDispEstado('idle');
        setDispMensaje('');
      }
    }, 500);

    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, [username]);

  function handleUsernameChange(v: string) {
    // Forzar minúsculas y caracteres válidos al escribir
    const limpio = v.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(limpio);
  }

  async function handleRegister() {
    if (!nombre.trim()) return Alert.alert('Campo requerido', 'Ingresa tu nombre');
    if (!username.trim()) return Alert.alert('Campo requerido', 'Elige un nombre de usuario');

    const errUser = validarUsername(username);
    if (errUser) return Alert.alert('Usuario inválido', errUser);
    if (dispEstado === 'ocupado') return Alert.alert('Usuario en uso', 'Elige otro nombre de usuario');
    if (dispEstado === 'cargando') return Alert.alert('Un momento', 'Verificando disponibilidad…');

    if (!email.trim()) return Alert.alert('Campo requerido', 'Ingresa tu correo electrónico');
    if (!password) return Alert.alert('Campo requerido', 'Ingresa una contraseña');
    if (password.length < 6) return Alert.alert('Contraseña muy corta', 'Mínimo 6 caracteres');

    setLoading(true);
    try {
      // 1. Crear cuenta en Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { nombre: nombre.trim(), username: username.toLowerCase() } },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se pudo crear la cuenta');

      // 2. Crear perfil en el backend (endpoint público)
      await perfilesApi.crear(
        data.user.id,
        username.toLowerCase(),
        email.trim().toLowerCase(),
      );

      router.replace({
        pathname: '/(auth)/confirmar-email',
        params: { email: email.trim() },
      });
    } catch (e: any) {
      Alert.alert('Error al registrar', e.message ?? 'Inténtalo de nuevo');
    } finally {
      setLoading(false);
    }
  }

  // Color e ícono según estado de disponibilidad
  const dispColor = {
    idle: COLORS.textoMuysuave,
    cargando: COLORS.textoMuysuave,
    disponible: COLORS.verde,
    ocupado: COLORS.rojo,
    invalido: COLORS.amarillo,
  }[dispEstado];

  const dispIcono = {
    idle: null,
    cargando: null,
    disponible: 'checkmark-circle',
    ocupado: 'close-circle',
    invalido: 'warning',
  }[dispEstado] as any;

  const borderUsername = {
    idle: COLORS.borde,
    cargando: COLORS.borde,
    disponible: COLORS.verde,
    ocupado: COLORS.rojo,
    invalido: COLORS.amarillo,
  }[dispEstado];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Círculos decorativos de fondo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.circle1, { transform: [{ scale: circle1Scale }] }]} />
        <Animated.View style={[styles.circle2, { transform: [{ scale: circle2Scale }] }]} />
        <View style={styles.circle3} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoSub}>Crea tu cuenta gratuita</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitulo}>Registrarse</Text>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tu nombre</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.textoSuave} style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={COLORS.textoMuysuave}
                autoCapitalize="words"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nombre de usuario{' '}
              <Text style={styles.labelHint}>(para iniciar sesión)</Text>
            </Text>
            <View style={[styles.inputRow, { borderColor: borderUsername }]}>
              <Text style={styles.arrobaPrefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="ej: juan42"
                placeholderTextColor={COLORS.textoMuysuave}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={handleUsernameChange}
              />
              {dispEstado === 'cargando' && (
                <ActivityIndicator size="small" color={COLORS.textoMuysuave} style={{ marginRight: 4 }} />
              )}
              {dispIcono && (
                <Ionicons name={dispIcono} size={18} color={dispColor} style={{ marginRight: 4 }} />
              )}
            </View>
            {dispMensaje ? (
              <Text style={[styles.dispMensaje, { color: dispColor }]}>{dispMensaje}</Text>
            ) : (
              <Text style={styles.dispMensaje}>3–20 caracteres, solo letras y números</Text>
            )}
          </View>

          {/* Email */}
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
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textoSuave} style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textoMuysuave}
                secureTextEntry={!verPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.ojito}>
                <Ionicons name={verPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textoSuave} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.boton, (loading || dispEstado === 'ocupado') && styles.botonDeshabilitado]}
            onPress={handleRegister}
            disabled={loading || dispEstado === 'ocupado'}
          >
            {loading
              ? <ActivityIndicator color={COLORS.blanco} />
              : <Text style={styles.botonTexto}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkTexto}>
                ¿Ya tienes cuenta? <Text style={styles.linkAccion}>Ingresar</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  logoArea: { alignItems: 'center', marginBottom: SPACING.sm },
  logoImg: { width: 200, height: 126 },
  logoSub: { fontSize: FONT.md, color: COLORS.textoSuave, marginTop: -4, marginBottom: SPACING.md },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 24, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  formTitulo: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.texto, marginBottom: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textoSecundario, marginBottom: 6 },
  labelHint: { fontWeight: '400', color: COLORS.textoMuysuave },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fondo, borderWidth: 1.5, borderColor: COLORS.borde,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
  },
  arrobaPrefix: {
    fontSize: FONT.md, fontWeight: '700', color: COLORS.primario,
    marginRight: 4,
  },
  inputIcono: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: FONT.md, color: COLORS.texto },
  ojito: { padding: 4 },
  dispMensaje: { fontSize: 11, marginTop: 4, marginLeft: 2, color: COLORS.textoMuysuave },
  boton: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', marginTop: SPACING.sm,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: SPACING.lg },
  linkTexto: { fontSize: FONT.md, color: COLORS.textoSuave },
  linkAccion: { color: COLORS.primario, fontWeight: '700' },

  // Círculos decorativos
  circle1: {
    position: 'absolute',
    width: width * 1.1, height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: 'rgba(22,163,74,0.07)',
    top: -width * 0.5, left: -width * 0.25,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.85, height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(22,163,74,0.05)',
    bottom: height * 0.05, right: -width * 0.3,
  },
  circle3: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(22,163,74,0.04)',
    top: height * 0.45, left: -50,
  },
});
