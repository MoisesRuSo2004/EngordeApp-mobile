import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  maxHoy?: boolean; // bloquear fechas futuras
}

function parse(s: string) {
  const [y, m, d] = (s || '').split('-').map(Number);
  const now = new Date();
  return {
    day: d || now.getDate(),
    month: m || now.getMonth() + 1,
    year: y || now.getFullYear(),
  };
}

function toIso(day: number, month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function cycle(val: number, delta: number, min: number, max: number) {
  let next = val + delta;
  if (next < min) next = max;
  if (next > max) next = min;
  return next;
}

export function DatePickerField({ value, onChange, label, maxHoy = false }: Props) {
  const parsed = parse(value);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  const ahora = new Date();
  const maxYear = ahora.getFullYear();
  const minYear = maxYear - 10;

  function abrir() {
    const p = parse(value);
    setDay(p.day); setMonth(p.month); setYear(p.year);
    setOpen(true);
  }

  function confirmar() {
    const maxDay = daysInMonth(month, year);
    onChange(toIso(Math.min(day, maxDay), month, year));
    setOpen(false);
  }

  const fecha = new Date(`${value}T12:00:00`);
  const display = value
    ? fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Seleccionar fecha';

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={abrir} activeOpacity={0.75}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.primario} />
        <Text style={[styles.fieldTexto, !value && styles.fieldPlaceholder]}>{display}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textoMuysuave} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel}>
            <View style={styles.panelHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.primario} />
              <Text style={styles.panelTitulo}>{label ?? 'Seleccionar fecha'}</Text>
            </View>

            <View style={styles.columnas}>
              {/* Día */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>Día</Text>
                <TouchableOpacity onPress={() => setDay(cycle(day, 1, 1, daysInMonth(month, year)))} style={styles.arrow}>
                  <Ionicons name="chevron-up" size={24} color={COLORS.primario} />
                </TouchableOpacity>
                <View style={styles.colValorBox}>
                  <Text style={styles.colValor}>{String(day).padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity onPress={() => setDay(cycle(day, -1, 1, daysInMonth(month, year)))} style={styles.arrow}>
                  <Ionicons name="chevron-down" size={24} color={COLORS.primario} />
                </TouchableOpacity>
              </View>

              <View style={styles.colSep} />

              {/* Mes */}
              <View style={[styles.col, { flex: 1.8 }]}>
                <Text style={styles.colLabel}>Mes</Text>
                <TouchableOpacity onPress={() => setMonth(cycle(month, 1, 1, 12))} style={styles.arrow}>
                  <Ionicons name="chevron-up" size={24} color={COLORS.primario} />
                </TouchableOpacity>
                <View style={styles.colValorBox}>
                  <Text style={[styles.colValor, { fontSize: FONT.md }]}>{MESES[month - 1]}</Text>
                </View>
                <TouchableOpacity onPress={() => setMonth(cycle(month, -1, 1, 12))} style={styles.arrow}>
                  <Ionicons name="chevron-down" size={24} color={COLORS.primario} />
                </TouchableOpacity>
              </View>

              <View style={styles.colSep} />

              {/* Año */}
              <View style={[styles.col, { flex: 1.2 }]}>
                <Text style={styles.colLabel}>Año</Text>
                <TouchableOpacity onPress={() => setYear(cycle(year, 1, minYear, maxYear))} style={styles.arrow}>
                  <Ionicons name="chevron-up" size={24} color={COLORS.primario} />
                </TouchableOpacity>
                <View style={styles.colValorBox}>
                  <Text style={styles.colValor}>{year}</Text>
                </View>
                <TouchableOpacity onPress={() => setYear(cycle(year, -1, minYear, maxYear))} style={styles.arrow}>
                  <Ionicons name="chevron-down" size={24} color={COLORS.primario} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.botones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setOpen(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmar}>
                <Text style={styles.btnConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  fieldTexto: { flex: 1, fontSize: FONT.md, color: COLORS.texto, textTransform: 'capitalize' },
  fieldPlaceholder: { color: COLORS.textoMuysuave },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: SPACING.lg,
  },
  panel: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.lg, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 12, overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borde,
    backgroundColor: COLORS.primarioSuave,
  },
  panelTitulo: { fontSize: FONT.md, fontWeight: '700', color: COLORS.primarioOscuro },

  columnas: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg,
  },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  colSep: { width: 1, height: 80, backgroundColor: COLORS.borde, marginHorizontal: SPACING.sm },
  colLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textoMuysuave,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  arrow: { padding: 6 },
  colValorBox: {
    backgroundColor: COLORS.primarioSuave, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 8, minWidth: 44, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primarioBorde,
  },
  colValor: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.primarioOscuro },

  botones: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.borde,
  },
  btnCancelar: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.borde,
  },
  btnCancelarTexto: { fontSize: FONT.md, color: COLORS.textoSuave, fontWeight: '600' },
  btnConfirmar: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: COLORS.primario },
  btnConfirmarTexto: { fontSize: FONT.md, color: COLORS.blanco, fontWeight: '700' },
});
