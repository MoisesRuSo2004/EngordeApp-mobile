import { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, TextInput,
  StyleSheet, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

// ─── Catálogo ─────────────────────────────────────────────────────────────────

interface Raza {
  nombre: string;
  tipo: 'carne' | 'doble_proposito' | 'lechera';
  region?: string; // nota de contexto
}

const RAZAS: Raza[] = [
  // Cebú y derivados — dominan la costa caribe
  { nombre: 'Brahman Gris',      tipo: 'carne',           region: 'Costa Caribe' },
  { nombre: 'Brahman Rojo',      tipo: 'carne',           region: 'Costa Caribe' },
  { nombre: 'Gyr (Gir)',         tipo: 'doble_proposito', region: 'Costa Caribe' },
  { nombre: 'Nelore',            tipo: 'carne',           region: 'Costa Caribe' },
  { nombre: 'Guzerá',            tipo: 'doble_proposito', region: 'Costa Caribe' },
  // Criollas colombianas
  { nombre: 'Romosinuano',       tipo: 'carne',           region: 'Córdoba / Costa' },
  { nombre: 'Costeño con Cuernos', tipo: 'doble_proposito', region: 'Costa Caribe' },
  { nombre: 'BON (Blanco Orejinegro)', tipo: 'doble_proposito', region: 'Antioquia' },
  { nombre: 'Hartón del Valle',  tipo: 'doble_proposito', region: 'Valle del Cauca' },
  { nombre: 'Sanmartinero',      tipo: 'doble_proposito', region: 'Llanos' },
  { nombre: 'Casanareño',        tipo: 'carne',           region: 'Llanos' },
  // Cruces / sintéticos populares
  { nombre: 'Brangus',           tipo: 'carne' },
  { nombre: 'Braford',           tipo: 'carne' },
  { nombre: 'Senepol',           tipo: 'carne',           region: 'Costa Caribe' },
  { nombre: 'Simbrah',           tipo: 'carne' },
  { nombre: 'Santa Gertrudis',   tipo: 'carne' },
  // Europeas para mejoramiento
  { nombre: 'Simmental',         tipo: 'carne' },
  { nombre: 'Angus Negro',       tipo: 'carne' },
  { nombre: 'Angus Rojo',        tipo: 'carne' },
  { nombre: 'Charolais',         tipo: 'carne' },
  { nombre: 'Hereford',          tipo: 'carne' },
  { nombre: 'Limousin',          tipo: 'carne' },
  // Doble propósito
  { nombre: 'Pardo Suizo',       tipo: 'doble_proposito' },
  { nombre: 'Normando',          tipo: 'doble_proposito' },
  { nombre: 'Girolando',         tipo: 'doble_proposito' },
  // Cruce general
  { nombre: 'Mestizo / Criollo', tipo: 'carne' },
];

const TIPO_LABEL: Record<Raza['tipo'], string> = {
  carne:           'Carne',
  doble_proposito: 'Doble prop.',
  lechera:         'Lechera',
};

const TIPO_COLOR: Record<Raza['tipo'], string> = {
  carne:           COLORS.primario,
  doble_proposito: COLORS.amarillo,
  lechera:         COLORS.verde,
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function RazaPickerField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modoPersonalizada, setModoPersonalizada] = useState(false);
  const [textoPersonalizada, setTextoPersonalizada] = useState('');

  const razasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return RAZAS;
    const q = busqueda.toLowerCase();
    return RAZAS.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [busqueda]);

  function abrir() {
    setBusqueda('');
    setModoPersonalizada(false);
    setTextoPersonalizada('');
    setOpen(true);
  }

  function seleccionar(nombre: string) {
    onChange(nombre);
    setOpen(false);
  }

  function confirmarPersonalizada() {
    const txt = textoPersonalizada.trim();
    if (!txt) return;
    onChange(txt);
    setOpen(false);
  }

  function limpiar() {
    onChange('');
  }

  return (
    <>
      {/* Botón selector */}
      <TouchableOpacity style={styles.field} onPress={abrir} activeOpacity={0.75}>
        <Ionicons name="paw-outline" size={18} color={COLORS.primario} />
        <Text style={[styles.fieldTexto, !value && styles.fieldPlaceholder]}>
          {value || 'Seleccionar raza'}
        </Text>
        {value ? (
          <TouchableOpacity onPress={limpiar} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.textoMuysuave} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={COLORS.textoMuysuave} />
        )}
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
            <Pressable style={styles.panel}>

              {/* Header */}
              <View style={styles.panelHeader}>
                <Ionicons name="paw" size={20} color={COLORS.primario} />
                <Text style={styles.panelTitulo}>Seleccionar raza</Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={COLORS.textoSuave} />
                </TouchableOpacity>
              </View>

              {/* Buscador */}
              <View style={styles.buscador}>
                <Ionicons name="search-outline" size={16} color={COLORS.textoSuave} />
                <TextInput
                  style={styles.buscadorInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar raza…"
                  placeholderTextColor={COLORS.textoMuysuave}
                  autoCorrect={false}
                />
                {busqueda ? (
                  <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textoMuysuave} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Lista de razas */}
              {!modoPersonalizada ? (
                <FlatList
                  data={razasFiltradas}
                  keyExtractor={(r) => r.nombre}
                  keyboardShouldPersistTaps="handled"
                  style={styles.lista}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.item, value === item.nombre && styles.itemActivo]}
                      onPress={() => seleccionar(item.nombre)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemLeft}>
                        {value === item.nombre && (
                          <Ionicons name="checkmark" size={16} color={COLORS.primario} style={styles.itemCheck} />
                        )}
                        <View>
                          <Text style={[styles.itemNombre, value === item.nombre && styles.itemNombreActivo]}>
                            {item.nombre}
                          </Text>
                          {item.region && (
                            <Text style={styles.itemRegion}>{item.region}</Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.tipoBadge, { backgroundColor: TIPO_COLOR[item.tipo] + '22' }]}>
                        <Text style={[styles.tipoBadgeTexto, { color: TIPO_COLOR[item.tipo] }]}>
                          {TIPO_LABEL[item.tipo]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    <TouchableOpacity
                      style={styles.otraRazaBtn}
                      onPress={() => setModoPersonalizada(true)}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={COLORS.primario} />
                      <Text style={styles.otraRazaBtnTexto}>Otra raza no listada…</Text>
                    </TouchableOpacity>
                  }
                />
              ) : (
                /* Modo ingreso manual */
                <View style={styles.personalizada}>
                  <TouchableOpacity
                    style={styles.volverBtn}
                    onPress={() => setModoPersonalizada(false)}
                  >
                    <Ionicons name="arrow-back" size={16} color={COLORS.primario} />
                    <Text style={styles.volverBtnTexto}>Volver a la lista</Text>
                  </TouchableOpacity>
                  <Text style={styles.personalizadaLabel}>Nombre de la raza</Text>
                  <TextInput
                    style={styles.personalizadaInput}
                    value={textoPersonalizada}
                    onChangeText={setTextoPersonalizada}
                    placeholder="Ej: Lechero Tropical, F1 Brahman x Angus…"
                    placeholderTextColor={COLORS.textoMuysuave}
                    autoFocus
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={[styles.confirmarBtn, !textoPersonalizada.trim() && styles.confirmarBtnDisabled]}
                    onPress={confirmarPersonalizada}
                    disabled={!textoPersonalizada.trim()}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.blanco} />
                    <Text style={styles.confirmarBtnTexto}>Confirmar raza</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  fieldTexto: { flex: 1, fontSize: FONT.md, color: COLORS.texto },
  fieldPlaceholder: { color: COLORS.textoMuysuave },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: COLORS.blanco,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
  },

  panelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  panelTitulo: { flex: 1, fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },

  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    margin: SPACING.md, marginBottom: 0,
    backgroundColor: COLORS.fondo, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
  },
  buscadorInput: { flex: 1, fontSize: FONT.md, color: COLORS.texto },

  lista: { marginTop: SPACING.sm },

  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borde,
  },
  itemActivo: { backgroundColor: COLORS.primarioSuave },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemCheck: { marginRight: 6 },
  itemNombre: { fontSize: FONT.md, color: COLORS.texto, fontWeight: '500' },
  itemNombreActivo: { color: COLORS.primario, fontWeight: '700' },
  itemRegion: { fontSize: 11, color: COLORS.textoMuysuave, marginTop: 1 },

  tipoBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: SPACING.sm,
  },
  tipoBadgeTexto: { fontSize: 11, fontWeight: '700' },

  otraRazaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: COLORS.borde, marginTop: 4,
  },
  otraRazaBtnTexto: { fontSize: FONT.md, color: COLORS.primario, fontWeight: '600' },

  personalizada: { padding: SPACING.md, gap: SPACING.md },
  volverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  volverBtnTexto: { fontSize: FONT.sm, color: COLORS.primario, fontWeight: '600' },
  personalizadaLabel: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.texto },
  personalizadaInput: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: FONT.md, color: COLORS.texto,
  },
  confirmarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  confirmarBtnDisabled: { opacity: 0.45 },
  confirmarBtnTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.blanco },
});
