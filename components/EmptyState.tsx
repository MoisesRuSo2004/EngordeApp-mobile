import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  sub?: string;
  botonTexto?: string;
  onBoton?: () => void;
  botonIcono?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ icon, titulo, sub, botonTexto, onBoton, botonIcono = 'add' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={38} color={COLORS.primario} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
      {botonTexto && onBoton && (
        <TouchableOpacity style={styles.boton} onPress={onBoton} activeOpacity={0.8}>
          <Ionicons name={botonIcono} size={18} color={COLORS.blanco} />
          <Text style={styles.botonTexto}>{botonTexto}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primarioSuave,
    borderWidth: 1.5, borderColor: COLORS.primarioBorde,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.texto, textAlign: 'center' },
  sub: { fontSize: FONT.md, color: COLORS.textoSuave, textAlign: 'center', lineHeight: 22 },
  boton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  botonTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },
});
