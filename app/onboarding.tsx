import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Animated, Image, ViewToken,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

const { width: W, height: H } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completado_v1';

// ─── Datos de cada slide ───────────────────────────────────────────────────────

const slides = [
  {
    id: 'control',
    titulo: 'Controla cada animal',
    sub:    'Registra pesos, compras y la evolución de tus terneros desde cualquier lugar.',
  },
  {
    id: 'rentabilidad',
    titulo: 'Descubre cuánto ganas',
    sub:    'La app calcula costos, crecimiento y utilidad estimada por lote o animal.',
  },
  {
    id: 'decisiones',
    titulo: 'Alertas inteligentes',
    sub:    'Recibe notificaciones y proyecciones para vender en el mejor momento.',
  },
  {
    id: 'finca',
    titulo: 'Todo en un solo lugar',
    sub:    'Animales, lotes, gastos y reportes. Simple, rápido y siempre disponible.',
  },
];

// ─── Ilustración 1 — Control ───────────────────────────────────────────────────

function IllustracionControl({ isActive }: { isActive: boolean }) {
  const float   = useRef(new Animated.Value(0)).current;
  const b0      = useRef(new Animated.Value(0)).current;
  const b1      = useRef(new Animated.Value(0)).current;
  const b2      = useRef(new Animated.Value(0)).current;
  const b3      = useRef(new Animated.Value(0)).current;
  const b4      = useRef(new Animated.Value(0)).current;
  const cardOp  = useRef(new Animated.Value(0)).current;
  const cardY   = useRef(new Animated.Value(20)).current;
  const bars    = [b0, b1, b2, b3, b4];
  const targets = [55, 78, 44, 92, 67];

  useEffect(() => {
    if (isActive) {
      Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,   duration: 2000, useNativeDriver: true }),
      ])).start();
      Animated.stagger(80, bars.map((v, i) =>
        Animated.timing(v, { toValue: targets[i], duration: 500, useNativeDriver: false }),
      )).start();
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 400, delay: 350, useNativeDriver: true }),
        Animated.timing(cardY,  { toValue: 0, duration: 400, delay: 350, useNativeDriver: true }),
      ]).start();
    } else {
      float.stopAnimation(); float.setValue(0);
      bars.forEach(v => v.setValue(0));
      cardOp.setValue(0); cardY.setValue(20);
    }
  }, [isActive]);

  return (
    <View style={il.wrap}>
      <Animated.View style={{ transform: [{ translateY: float }] }}>
        <Image source={require('../assets/icon.png')} style={il.icono} resizeMode="contain" />
      </Animated.View>
      <View style={il.chartWrap}>
        {bars.map((val, i) => (
          <Animated.View key={i} style={[il.bar, {
            height: val.interpolate({ inputRange: [0, 100], outputRange: [4, 88] }),
            opacity: val.interpolate({ inputRange: [0, 20], outputRange: [0, 1] }),
          }]} />
        ))}
      </View>
      <Animated.View style={[il.card, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
        <View style={il.cardRow}>
          <Ionicons name="ear-outline" size={14} color={COLORS.primario} />
          <Text style={il.cardLabel}>#A-045  ·  Lote Los Cedros</Text>
        </View>
        <View style={il.cardRow}>
          <Text style={il.cardVal}>285 kg</Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.textoMuysuave} />
          <Text style={[il.cardVal, { color: COLORS.primario }]}>312 kg</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Ilustración 2 — Rentabilidad ─────────────────────────────────────────────

function IllustracionRentabilidad({ isActive }: { isActive: boolean }) {
  const [count, setCount] = useState(0);
  const counter  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const chipsOp   = useRef(new Animated.Value(0)).current;
  const chipsX    = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (isActive) {
      counter.addListener(({ value }) => setCount(Math.floor(value)));
      Animated.parallel([
        Animated.timing(counter,    { toValue: 850000, duration: 1600, useNativeDriver: false }),
        Animated.spring(cardScale,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(cardOp,     { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(chipsOp,    { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }),
        Animated.timing(chipsX,     { toValue: 0, duration: 400, delay: 700, useNativeDriver: true }),
      ]).start();
    } else {
      counter.removeAllListeners(); counter.setValue(0); setCount(0);
      cardScale.setValue(0.8); cardOp.setValue(0);
      chipsOp.setValue(0); chipsX.setValue(24);
    }
    return () => counter.removeAllListeners();
  }, [isActive]);

  const fmt = (n: number) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (
    <View style={il.wrap}>
      <Animated.View style={[il.profitCard, { opacity: cardOp, transform: [{ scale: cardScale }] }]}>
        <Text style={il.profitLabel}>Utilidad estimada</Text>
        <Text style={il.profitNum}>{fmt(count)}</Text>
        <View style={il.profitBadge}>
          <Ionicons name="trending-up" size={12} color="#fff" />
          <Text style={il.profitBadgeTxt}>+32% vs. mes anterior</Text>
        </View>
      </Animated.View>
      <Animated.View style={[il.statsRow, { opacity: chipsOp, transform: [{ translateX: chipsX }] }]}>
        <View style={il.statChip}>
          <Ionicons name="scale-outline" size={16} color={COLORS.primario} />
          <Text style={il.statVal}>4.2 kg</Text>
          <Text style={il.statSub}>ganancia/día</Text>
        </View>
        <View style={il.statChip}>
          <Ionicons name="cash-outline" size={16} color={COLORS.primario} />
          <Text style={il.statVal}>$18.400</Text>
          <Text style={il.statSub}>costo/kg</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Ilustración 3 — Decisiones ───────────────────────────────────────────────

function IllustracionDecisiones({ isActive }: { isActive: boolean }) {
  const bellRot = useRef(new Animated.Value(0)).current;
  const c1Op    = useRef(new Animated.Value(0)).current;
  const c1X     = useRef(new Animated.Value(40)).current;
  const c2Op    = useRef(new Animated.Value(0)).current;
  const c2X     = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.delay(200),
        Animated.loop(Animated.sequence([
          Animated.timing(bellRot, { toValue: 15,  duration: 100, useNativeDriver: true }),
          Animated.timing(bellRot, { toValue: -15, duration: 100, useNativeDriver: true }),
          Animated.timing(bellRot, { toValue: 10,  duration: 80,  useNativeDriver: true }),
          Animated.timing(bellRot, { toValue: -10, duration: 80,  useNativeDriver: true }),
          Animated.timing(bellRot, { toValue: 0,   duration: 80,  useNativeDriver: true }),
          Animated.delay(2500),
        ]), { iterations: 3 }),
      ]).start();
      Animated.parallel([
        Animated.timing(c1Op, { toValue: 1, duration: 350, delay: 300, useNativeDriver: true }),
        Animated.timing(c1X,  { toValue: 0, duration: 350, delay: 300, useNativeDriver: true }),
        Animated.timing(c2Op, { toValue: 1, duration: 350, delay: 480, useNativeDriver: true }),
        Animated.timing(c2X,  { toValue: 0, duration: 350, delay: 480, useNativeDriver: true }),
      ]).start();
    } else {
      bellRot.stopAnimation(); bellRot.setValue(0);
      c1Op.setValue(0); c1X.setValue(40);
      c2Op.setValue(0); c2X.setValue(40);
    }
  }, [isActive]);

  const rotate = bellRot.interpolate({ inputRange: [-15, 15], outputRange: ['-15deg', '15deg'] });

  return (
    <View style={il.wrap}>
      <Animated.View style={{ transform: [{ rotate }], marginBottom: 8 }}>
        <Ionicons name="notifications" size={56} color={COLORS.primario} />
      </Animated.View>
      <Animated.View style={[il.alertCard, { opacity: c1Op, transform: [{ translateX: c1X }] }]}>
        <View style={[il.alertDot, { backgroundColor: COLORS.verde }]} />
        <View style={{ flex: 1 }}>
          <Text style={il.alertTitulo}>Lote Los Cedros listo</Text>
          <Text style={il.alertSub}>Peso promedio: 420 kg  ·  Vender ahora</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textoMuysuave} />
      </Animated.View>
      <Animated.View style={[il.alertCard, { opacity: c2Op, transform: [{ translateX: c2X }] }]}>
        <View style={[il.alertDot, { backgroundColor: COLORS.amarillo }]} />
        <View style={{ flex: 1 }}>
          <Text style={il.alertTitulo}>Pesaje pendiente</Text>
          <Text style={il.alertSub}>Animal #A-023  ·  Hace 8 días</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textoMuysuave} />
      </Animated.View>
    </View>
  );
}

// ─── Ilustración 4 — Tu finca ──────────────────────────────────────────────────

function IllustracionFinca({ isActive }: { isActive: boolean }) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOp    = useRef(new Animated.Value(0)).current;
  const chipsOp   = useRef(new Animated.Value(0)).current;
  const chipsY    = useRef(new Animated.Value(20)).current;

  const features = [
    { icon: 'ear-outline',       label: 'Animales' },
    { icon: 'layers-outline',    label: 'Lotes'    },
    { icon: 'receipt-outline',   label: 'Gastos'   },
    { icon: 'bar-chart-outline', label: 'Reportes' },
  ];

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.timing(logoOp,    { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(chipsOp,   { toValue: 1, duration: 400, delay: 350, useNativeDriver: true }),
        Animated.timing(chipsY,    { toValue: 0, duration: 400, delay: 350, useNativeDriver: true }),
      ]).start();
    } else {
      logoScale.setValue(0.7); logoOp.setValue(0);
      chipsOp.setValue(0); chipsY.setValue(20);
    }
  }, [isActive]);

  return (
    <View style={il.wrap}>
      <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOp }}>
        <Image source={require('../assets/logo.png')} style={il.logoFull} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[il.chipsGrid, { opacity: chipsOp, transform: [{ translateY: chipsY }] }]}>
        {features.map((f) => (
          <View key={f.icon} style={il.featureChip}>
            <Ionicons name={f.icon as any} size={18} color={COLORS.primario} />
            <Text style={il.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Componentes de ilustración indexados ─────────────────────────────────────

const ILUSTRACIONES = [
  IllustracionControl,
  IllustracionRentabilidad,
  IllustracionDecisiones,
  IllustracionFinca,
];

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router  = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Círculos decorativos de fondo
  const c1Scale = useRef(new Animated.Value(1)).current;
  const c2Scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(c1Scale, { toValue: 1.08, duration: 3500, useNativeDriver: true }),
      Animated.timing(c1Scale, { toValue: 1,    duration: 3500, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(c2Scale, { toValue: 1.06, duration: 4200, useNativeDriver: true }),
      Animated.timing(c2Scale, { toValue: 1,    duration: 4200, useNativeDriver: true }),
    ])).start();
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setActiveIdx(viewableItems[0].index);
    },
    [],
  );

  async function terminar() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  }

  function siguiente() {
    if (activeIdx < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
    } else {
      terminar();
    }
  }

  const esUltimo = activeIdx === slides.length - 1;

  return (
    <View style={s.root}>

      {/* Fondo decorativo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[s.circle1, { transform: [{ scale: c1Scale }] }]} />
        <Animated.View style={[s.circle2, { transform: [{ scale: c2Scale }] }]} />
        <View style={s.circle3} />
      </View>

      {/* Botón omitir */}
      {!esUltimo && (
        <TouchableOpacity style={s.skipBtn} onPress={terminar} activeOpacity={0.7}>
          <Text style={s.skipTxt}>Omitir</Text>
        </TouchableOpacity>
      )}

      {/* Lista de slides */}
      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => {
          const Ilustracion = ILUSTRACIONES[index];
          return (
            <View style={s.slide}>
              <View style={s.ilustracionWrap}>
                <Ilustracion isActive={activeIdx === index} />
              </View>
              <View style={s.textoWrap}>
                <Text style={s.titulo}>{item.titulo}</Text>
                <Text style={s.sub}>{item.sub}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIdx && s.dotActive]} />
          ))}
        </View>
        <TouchableOpacity
          style={[s.boton, esUltimo && s.botonFinal]}
          onPress={siguiente}
          activeOpacity={0.85}
        >
          <View style={s.botonInner}>
            <Text style={s.botonTxt}>{esUltimo ? 'Comenzar ahora' : 'Siguiente'}</Text>
            <Ionicons name={esUltimo ? 'arrow-forward' : 'chevron-forward'} size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estilos ilustraciones ─────────────────────────────────────────────────────

const il = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  // Slide 1
  icono:     { width: 100, height: 100 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 88 },
  bar: {
    width: 32, borderRadius: 6,
    backgroundColor: COLORS.primario, opacity: 0.85,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, gap: 6,
  },
  cardRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel:{ fontSize: 12, color: COLORS.textoSuave },
  cardVal:  { fontSize: 15, fontWeight: '700', color: COLORS.texto },

  // Slide 2
  profitCard: {
    backgroundColor: COLORS.primario, borderRadius: 20, padding: 20,
    alignItems: 'center', gap: 6, width: W * 0.7,
    shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  profitLabel:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  profitNum:     { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  profitBadge:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  profitBadgeTxt:{ fontSize: 11, color: '#fff', fontWeight: '600' },
  statsRow:  { flexDirection: 'row', gap: 12 },
  statChip:  {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4, flex: 1,
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  statVal: { fontSize: 15, fontWeight: '700', color: COLORS.texto },
  statSub: { fontSize: 10, color: COLORS.textoMuysuave, textAlign: 'center' },

  // Slide 3
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.borde, width: W * 0.78,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  alertDot:   { width: 10, height: 10, borderRadius: 5 },
  alertTitulo:{ fontSize: 13, fontWeight: '700', color: COLORS.texto },
  alertSub:   { fontSize: 11, color: COLORS.textoSuave, marginTop: 1 },

  // Slide 4
  logoFull:   { width: W * 0.6, height: 110 },
  chipsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 8 },
  featureChip:{
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.borde,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  featureLabel:{ fontSize: 13, fontWeight: '600', color: COLORS.texto },
});

// ─── Estilos pantalla ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  circle1: {
    position: 'absolute', width: W * 1.1, height: W * 1.1,
    borderRadius: W * 0.55, backgroundColor: 'rgba(22,163,74,0.07)',
    top: -W * 0.5, left: -W * 0.25,
  },
  circle2: {
    position: 'absolute', width: W * 0.85, height: W * 0.85,
    borderRadius: W * 0.425, backgroundColor: 'rgba(22,163,74,0.05)',
    bottom: H * 0.05, right: -W * 0.3,
  },
  circle3: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(22,163,74,0.04)', top: H * 0.4, left: -50,
  },

  skipBtn: {
    position: 'absolute', top: 56, right: SPACING.lg, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(22,163,74,0.08)', borderRadius: 20,
  },
  skipTxt: { fontSize: FONT.sm, color: COLORS.primario, fontWeight: '600' },

  slide:          { width: W, flex: 1, paddingTop: 80 },
  ilustracionWrap:{ height: H * 0.42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
  textoWrap:      { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, alignItems: 'center' },
  titulo: {
    fontSize: FONT.xxl, fontWeight: '800', color: '#0d3d1f',
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT.md, color: COLORS.textoSuave,
    textAlign: 'center', lineHeight: 22,
  },

  footer: { paddingHorizontal: SPACING.lg, paddingBottom: 44, paddingTop: SPACING.md, gap: SPACING.md },
  dots:   { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(22,163,74,0.2)' },
  dotActive: { width: 24, backgroundColor: COLORS.primario },

  boton: {
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  botonFinal:  { backgroundColor: '#0d3d1f' },
  botonInner:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonTxt:    { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
});
