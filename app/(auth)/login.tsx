import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { perfilesApi } from "../../services/api/perfiles";
import { COLORS, SPACING, RADIUS, FONT } from "../../constants";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const esEmail = identificador.includes("@");

  // ── Animaciones ────────────────────────────────────────────────────────────
  const logoFloat = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTransY = useRef(new Animated.Value(32)).current;
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo flota suavemente
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Card entra con fade + slide
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardTransY, {
        toValue: 0,
        delay: 200,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
    ]).start();

    // Círculos de fondo pulsan lento
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Scale, {
          toValue: 1.08,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Scale, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Scale, {
          toValue: 1.06,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(circle2Scale, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin() {
    if (!identificador.trim())
      return Alert.alert("Campo requerido", "Ingresa tu usuario o correo");
    if (!password)
      return Alert.alert("Campo requerido", "Ingresa tu contraseña");

    setLoading(true);
    try {
      let emailFinal = identificador.trim().toLowerCase();
      if (!esEmail) {
        const res = await perfilesApi.resolverEmail(emailFinal);
        emailFinal = res.email;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailFinal,
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      const msg = e.message ?? "";
      if (
        msg.includes("Invalid login") ||
        msg.includes("invalid_credentials")
      ) {
        Alert.alert("Datos incorrectos", "Usuario o contraseña incorrectos.");
      } else if (msg.includes("no encontrado") || msg.includes("not found")) {
        Alert.alert(
          "Usuario no encontrado",
          "No existe una cuenta con ese nombre de usuario.",
        );
      } else if (msg.includes("Email not confirmed")) {
        Alert.alert(
          "Correo sin confirmar",
          "Confirma tu correo antes de ingresar.",
        );
      } else {
        Alert.alert("Error al ingresar", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Fondo con círculos decorativos ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[styles.circle1, { transform: [{ scale: circle1Scale }] }]}
        />
        <Animated.View
          style={[styles.circle2, { transform: [{ scale: circle2Scale }] }]}
        />
        <View style={styles.circle3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo flotante ── */}
        <Animated.View
          style={[styles.logoArea, { transform: [{ translateY: logoFloat }] }]}
        >
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── Card del formulario ── */}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardOpacity, transform: [{ translateY: cardTransY }] },
          ]}
        >
          <Text style={styles.cardTitulo}>Bienvenido</Text>
          <Text style={styles.cardSub}>Ingresa a tu cuenta</Text>

          {/* Usuario o email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario o correo</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name={esEmail ? "mail-outline" : "at-outline"}
                size={18}
                color={COLORS.textoSuave}
                style={styles.inputIcono}
              />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario o correo"
                placeholderTextColor={COLORS.textoMuysuave}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={esEmail ? "email-address" : "default"}
                value={identificador}
                onChangeText={setIdentificador}
                returnKeyType="next"
              />
              {identificador.length > 0 && (
                <View
                  style={[
                    styles.modoBadge,
                    { backgroundColor: esEmail ? "#dcfce7" : COLORS.fondo },
                  ]}
                >
                  <Text
                    style={[
                      styles.modoBadgeTexto,
                      {
                        color: esEmail ? COLORS.primario : COLORS.textoMuysuave,
                      },
                    ]}
                  >
                    {esEmail ? "correo" : "usuario"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={COLORS.textoSuave}
                style={styles.inputIcono}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textoMuysuave}
                secureTextEntry={!verPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setVerPassword(!verPassword)}
                style={styles.ojito}
              >
                <Ionicons
                  name={verPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.textoSuave}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Olvidé contraseña */}
          <TouchableOpacity
            style={styles.olvideBtnRow}
            onPress={() => router.push("/(auth)/recuperar")}
          >
            <Text style={styles.olvideBtnTexto}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón ingresar */}
          <TouchableOpacity
            style={[styles.boton, loading && styles.botonDeshabilitado]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.blanco} />
            ) : (
              <View style={styles.botonInner}>
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={COLORS.blanco}
                />
                <Text style={styles.botonTexto}>Ingresar</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTexto}>¿nuevo aquí?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.registrarBtn} activeOpacity={0.8}>
              <Text style={styles.registrarTexto}>Crear cuenta gratis</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>

        {/* Tagline al pie */}
        <Text style={styles.tagline}>Controla · Crece · Gana</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },

  // ── Círculos decorativos ──
  circle1: {
    position: "absolute",
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: "rgba(22,163,74,0.07)",
    top: -width * 0.5,
    left: -width * 0.25,
  },
  circle2: {
    position: "absolute",
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: "rgba(22,163,74,0.05)",
    bottom: height * 0.05,
    right: -width * 0.3,
  },
  circle3: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(22,163,74,0.04)",
    top: height * 0.38,
    left: -50,
  },

  // ── Scroll ──
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  // ── Logo ──
  logoArea: { alignItems: "center", marginBottom: SPACING.lg },
  logoImg: { width: 240, height: 150 },

  // ── Card ──
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borde,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitulo: {
    fontSize: FONT.xxl,
    fontWeight: "800",
    color: COLORS.texto,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: FONT.md,
    color: COLORS.textoSuave,
    marginBottom: SPACING.lg,
  },

  // ── Inputs ──
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: COLORS.textoSecundario,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.fondo,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcono: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FONT.md,
    color: COLORS.texto,
  },
  ojito: { padding: 4 },
  modoBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  modoBadgeTexto: { fontSize: 11, fontWeight: "600" },

  // ── Olvidé ──
  olvideBtnRow: { alignItems: "flex-end", marginBottom: SPACING.md },
  olvideBtnTexto: {
    fontSize: FONT.sm,
    color: COLORS.primario,
    fontWeight: "600",
  },

  // ── Botón principal ──
  boton: {
    backgroundColor: COLORS.primario,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: COLORS.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  botonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: "700" },

  // ── Divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borde },
  dividerTexto: { fontSize: FONT.sm, color: COLORS.textoMuysuave },

  // ── Registrar ──
  registrarBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primario,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  registrarTexto: {
    fontSize: FONT.md,
    fontWeight: "700",
    color: COLORS.primario,
  },

  // ── Tagline ──
  tagline: {
    textAlign: "center",
    marginTop: SPACING.xl,
    fontSize: FONT.sm,
    color: COLORS.textoMuysuave,
    letterSpacing: 1.2,
    fontWeight: "500",
  },
});
