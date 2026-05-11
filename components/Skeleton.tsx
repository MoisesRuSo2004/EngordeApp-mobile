import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = RADIUS.sm, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ─── Skeleton de tarjeta de lote ─────────────────────────────────────────────
export function SkeletonLoteCard() {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.cardBody}>
        <View style={styles.fila}>
          <SkeletonBox width="55%" height={18} />
          <SkeletonBox width="22%" height={22} borderRadius={99} />
        </View>
        <SkeletonBox width="40%" height={13} style={{ marginTop: 8 }} />
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <SkeletonBox width="28%" height={32} borderRadius={RADIUS.sm} />
          <SkeletonBox width="28%" height={32} borderRadius={RADIUS.sm} />
          <SkeletonBox width="28%" height={32} borderRadius={RADIUS.sm} />
        </View>
      </View>
    </View>
  );
}

// ─── Skeleton del hero del dashboard ─────────────────────────────────────────
export function SkeletonDashboardHero() {
  return (
    <View style={styles.hero}>
      <View style={styles.fila}>
        <View style={{ gap: 6, flex: 1 }}>
          <SkeletonBox width="45%" height={22} style={{ opacity: 0.3 } as any} />
          <SkeletonBox width="60%" height={13} style={{ opacity: 0.2 } as any} />
        </View>
        <SkeletonBox width={80} height={32} borderRadius={99} style={{ opacity: 0.2 } as any} />
      </View>
      <SkeletonBox width="35%" height={14} style={{ marginTop: 24, opacity: 0.25 } as any} />
      <SkeletonBox width="65%" height={44} style={{ marginTop: 6, opacity: 0.3 } as any} />
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <SkeletonBox width="42%" height={40} borderRadius={RADIUS.sm} style={{ opacity: 0.2 } as any} />
        <SkeletonBox width="42%" height={40} borderRadius={RADIUS.sm} style={{ opacity: 0.2 } as any} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: COLORS.borde },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borde,
    overflow: 'hidden',
  },
  accentBar: { width: 4, backgroundColor: COLORS.borde },
  cardBody: { flex: 1, padding: 16, gap: 0 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: COLORS.borde, marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hero: {
    backgroundColor: COLORS.primarioOscuro,
    paddingVertical: 24, paddingHorizontal: 16, gap: 0,
  },
});
