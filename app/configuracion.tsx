import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

function FilaSwitch({
  icon, iconBg, iconColor, titulo, sub, value, onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string; iconColor: string;
  titulo: string; sub: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.fila}>
      <View style={[styles.filaIcono, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.filaInfo}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.borde, true: COLORS.primario }}
        thumbColor={COLORS.blanco}
      />
    </View>
  );
}

function FilaLink({
  icon, iconBg, iconColor, titulo, sub, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string; iconColor: string;
  titulo: string; sub?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.fila} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.filaIcono, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.filaInfo}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        {sub && <Text style={styles.filaSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textoMuysuave} />
    </TouchableOpacity>
  );
}

export default function ConfiguracionScreen() {
  const router = useRouter();

  const [alertasPesaje, setAlertasPesaje] = useState(true);
  const [alertasGdp, setAlertasGdp] = useState(true);
  const [alertasPrecio, setAlertasPrecio] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Configuración</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Notificaciones */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Notificaciones</Text>
          <View style={styles.card}>
            <FilaSwitch
              icon="time-outline"
              iconBg={COLORS.amarilloClaro} iconColor={COLORS.amarillo}
              titulo="Pesaje pendiente"
              sub="Alerta cuando un animal lleva +30 días sin pesar"
              value={alertasPesaje}
              onChange={setAlertasPesaje}
            />
            <View style={styles.sep} />
            <FilaSwitch
              icon="trending-down-outline"
              iconBg={COLORS.rojoClaro} iconColor={COLORS.rojo}
              titulo="Crecimiento lento"
              sub="Alerta cuando el GDP está por debajo de 0.7 kg/día"
              value={alertasGdp}
              onChange={setAlertasGdp}
            />
            <View style={styles.sep} />
            <FilaSwitch
              icon="pricetag-outline"
              iconBg={COLORS.primarioSuave} iconColor={COLORS.primario}
              titulo="Precio desactualizado"
              sub="Alerta cuando el precio lleva +7 días sin actualizar"
              value={alertasPrecio}
              onChange={setAlertasPrecio}
            />
          </View>
        </View>

        {/* Precio de mercado */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Mercado</Text>
          <View style={styles.card}>
            <FilaLink
              icon="pricetag-outline"
              iconBg={COLORS.primarioSuave} iconColor={COLORS.primario}
              titulo="Actualizar precio de mercado"
              sub="Fijar el precio actual del kg en pie"
              onPress={() => router.push('/precio-mercado')}
            />
          </View>
        </View>

        {/* Seguridad */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Seguridad</Text>
          <View style={styles.card}>
            <FilaLink
              icon="lock-closed-outline"
              iconBg="#f3f4f6" iconColor={COLORS.textoSuave}
              titulo="Cambiar contraseña"
              sub="Actualiza tu contraseña de acceso"
              onPress={() => router.push('/cambiar-password')}
            />
          </View>
        </View>

        {/* Sobre la app */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Aplicación</Text>
          <View style={styles.card}>
            <View style={styles.fila}>
              <View style={[styles.filaIcono, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textoSuave} />
              </View>
              <View style={styles.filaInfo}>
                <Text style={styles.filaTitulo}>Versión</Text>
                <Text style={styles.filaSub}>EngordeApp v1.0 · Mayo 2026</Text>
              </View>
            </View>
            <View style={styles.sep} />
            <FilaLink
              icon="document-text-outline"
              iconBg="#f3f4f6" iconColor={COLORS.textoSuave}
              titulo="Términos y condiciones"
            />
            <View style={styles.sep} />
            <FilaLink
              icon="shield-outline"
              iconBg="#f3f4f6" iconColor={COLORS.textoSuave}
              titulo="Política de privacidad"
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primarioOscuro,
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },

  scroll: { paddingBottom: 48 },

  seccion: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  seccionTitulo: {
    fontSize: FONT.sm, fontWeight: '700', color: COLORS.textoSuave,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde, overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  filaIcono: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  filaInfo: { flex: 1 },
  filaTitulo: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.texto },
  filaSub: { fontSize: 12, color: COLORS.textoMuysuave, marginTop: 2, lineHeight: 17 },
  sep: { height: 1, backgroundColor: COLORS.borde, marginLeft: 68 },
});
