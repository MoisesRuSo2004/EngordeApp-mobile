import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS, FONT, SPACING, RADIUS } from '../constants';

interface Punto {
  fecha: string;
  pesoKg: number;
  esInicial?: boolean;
}

interface Props {
  puntos: Punto[];
}

const CHART_H = 160;
const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;

function formatFecha(iso: string) {
  if (!iso) return 'Inicio';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

// Genera path de curva suavizada (Catmull-Rom → Bezier)
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function GraficaPesos({ puntos }: Props) {
  if (puntos.length < 2) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioTexto}>Registra al menos un pesaje para ver la gráfica</Text>
      </View>
    );
  }

  const screenW = Dimensions.get('window').width - SPACING.md * 2;
  const PUNTO_ANCHO = Math.max(64, (screenW - PAD_LEFT - PAD_RIGHT) / (puntos.length - 1));
  const chartW = Math.max(screenW, PAD_LEFT + (puntos.length - 1) * PUNTO_ANCHO + PAD_RIGHT);

  const pesos = puntos.map((p) => p.pesoKg);
  const minPeso = Math.min(...pesos);
  const maxPeso = Math.max(...pesos);
  const rango = maxPeso - minPeso || 10;

  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const innerW = chartW - PAD_LEFT - PAD_RIGHT;

  function xOf(i: number) {
    return PAD_LEFT + (i / (puntos.length - 1)) * innerW;
  }
  function yOf(peso: number) {
    return PAD_TOP + (1 - (peso - minPeso) / rango) * innerH;
  }

  const coords = puntos.map((p, i) => ({ x: xOf(i), y: yOf(p.pesoKg) }));
  const linePath = smoothPath(coords);

  // Área de relleno: misma curva cerrando hacia abajo
  const areaPath = linePath
    + ` L ${coords[coords.length - 1].x} ${CHART_H - PAD_BOTTOM}`
    + ` L ${coords[0].x} ${CHART_H - PAD_BOTTOM} Z`;

  // Líneas de referencia horizontales
  const refLines = [0, 0.5, 1].map((t) => ({
    y: PAD_TOP + (1 - t) * innerH,
    valor: Math.round(minPeso + t * rango),
  }));

  // Color dominante de la línea (sube o baja en total)
  const subeGeneral = puntos[puntos.length - 1].pesoKg >= puntos[0].pesoKg;
  const lineColor = subeGeneral ? COLORS.primario : COLORS.rojo;
  const areaColorStart = subeGeneral ? '#16a34a' : '#ef4444';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <Svg width={chartW} height={CHART_H}>
          <Defs>
            {/* Gradiente del área */}
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={areaColorStart} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={areaColorStart} stopOpacity="0" />
            </LinearGradient>
            {/* Gradiente de la línea (de izq a der) */}
            <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={lineColor} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={lineColor} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Líneas de referencia */}
          {refLines.map(({ y, valor }) => (
            <React.Fragment key={valor}>
              <Line
                x1={PAD_LEFT} y1={y} x2={chartW - PAD_RIGHT} y2={y}
                stroke={COLORS.borde} strokeWidth="1" strokeDasharray="4 3"
              />
              <SvgText
                x={PAD_LEFT - 4} y={y + 4}
                fontSize="10" fill={COLORS.textoMuysuave}
                textAnchor="end"
              >
                {valor}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Área de relleno */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Línea principal */}
          <Path
            d={linePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos + etiquetas */}
          {coords.map(({ x, y }, i) => {
            const p = puntos[i];
            const esUltimo = i === puntos.length - 1;
            const esInicial = !!p.esInicial;
            const dotColor = esInicial
              ? COLORS.textoMuysuave
              : esUltimo ? COLORS.primarioOscuro : lineColor;

            return (
              <React.Fragment key={i}>
                {/* Halo del último punto */}
                {esUltimo && (
                  <Circle cx={x} cy={y} r={9} fill={lineColor} opacity={0.15} />
                )}
                {/* Punto */}
                <Circle cx={x} cy={y} r={5} fill={dotColor} stroke={COLORS.blanco} strokeWidth={2} />

                {/* Peso encima del punto */}
                <SvgText
                  x={x} y={y - 10}
                  fontSize={esUltimo ? '11' : '10'}
                  fontWeight={esUltimo ? 'bold' : 'normal'}
                  fill={esUltimo ? COLORS.primarioOscuro : COLORS.textoSecundario}
                  textAnchor="middle"
                >
                  {p.pesoKg}
                </SvgText>

                {/* Fecha debajo del eje */}
                <SvgText
                  x={x} y={CHART_H - PAD_BOTTOM + 14}
                  fontSize="10"
                  fill={COLORS.textoMuysuave}
                  textAnchor="middle"
                >
                  {p.esInicial ? 'Inicio' : formatFecha(p.fecha)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaLinea, { backgroundColor: COLORS.primario }]} />
          <Text style={styles.leyendaTexto}>Ganancia</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaLinea, { backgroundColor: COLORS.rojo }]} />
          <Text style={styles.leyendaTexto}>Pérdida</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaDot, { backgroundColor: COLORS.textoMuysuave }]} />
          <Text style={styles.leyendaTexto}>Peso inicial</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingTop: SPACING.sm, overflow: 'hidden',
  },
  vacio: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    padding: SPACING.lg, alignItems: 'center',
  },
  vacioTexto: { fontSize: FONT.sm, color: COLORS.textoMuysuave, textAlign: 'center' },
  leyenda: {
    flexDirection: 'row', gap: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.borde,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaLinea: { width: 16, height: 3, borderRadius: 2 },
  leyendaDot: { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { fontSize: 11, color: COLORS.textoSuave },
});
