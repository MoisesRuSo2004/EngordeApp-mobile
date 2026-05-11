import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { perfilesApi } from '../services/api/perfiles';
import { useSessionStore } from '../stores/session.store';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

// ─── Validación username ──────────────────────────────────────────────────────
function validarUsername(u: string): string | null {
  if (u.length < 3) return 'Mínimo 3 caracteres';
  if (u.length > 20) return 'Máximo 20 caracteres';
  if (!/^[a-z0-9_.]+$/.test(u)) return 'Solo letras, números, puntos y _';
  return null;
}

type DispEstado = 'idle' | 'cargando' | 'disponible' | 'ocupado' | 'invalido' | 'actual';

export default function PerfilScreen() {
  const router = useRouter();
  const { session } = useSessionStore();

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Datos de vista
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [username, setUsername] = useState('');

  // Campos de edición
  const [nombreEdit, setNombreEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [usernameEdit, setUsernameEdit] = useState('');
  const [usernameOrig, setUsernameOrig] = useState(''); // para saber si cambió

  // Disponibilidad username
  const [dispEstado, setDispEstado] = useState<DispEstado>('idle');
  const [dispMensaje, setDispMensaje] = useState('');
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        const n = meta.nombre ?? meta.nombre_completo ?? meta.full_name ?? meta.name ?? '';
        const t = meta.telefono ?? '';
        setEmail(data.user.email ?? '');
        setNombre(n);
        setTelefono(t);
      }
    });
    // Cargar username del backend
    perfilesApi.obtenerMio().then((res: any) => {
      if (res?.username) {
        setUsername(res.username);
        setUsernameOrig(res.username);
      }
    }).catch(() => {});
  }, []);

  // Sincroniza si sesión cambia (tras guardar)
  useEffect(() => {
    const meta = session?.user?.user_metadata ?? {};
    const n = meta.nombre ?? meta.nombre_completo ?? meta.full_name ?? meta.name ?? '';
    const t = meta.telefono ?? '';
    setNombre(n);
    setTelefono(t);
    setEmail(session?.user?.email ?? '');
  }, [session]);

  // Verificar disponibilidad del username con debounce
  useEffect(() => {
    if (!editando) return;
    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    if (!usernameEdit) {
      setDispEstado('idle');
      setDispMensaje('');
      return;
    }

    // Si es igual al actual, no verificar
    if (usernameEdit === usernameOrig) {
      setDispEstado('actual');
      setDispMensaje('Tu usuario actual');
      return;
    }

    const error = validarUsername(usernameEdit);
    if (error) {
      setDispEstado('invalido');
      setDispMensaje(error);
      return;
    }

    setDispEstado('cargando');
    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await perfilesApi.checkDisponible(usernameEdit);
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
  }, [usernameEdit, editando]);

  function handleUsernameChange(v: string) {
    const limpio = v.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsernameEdit(limpio);
  }

  function iniciarEdicion() {
    setNombreEdit(nombre);
    setTelefonoEdit(telefono);
    setUsernameEdit(username);
    setDispEstado(username ? 'actual' : 'idle');
    setDispMensaje(username ? 'Tu usuario actual' : '');
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
  }

  async function guardar() {
    if (!nombreEdit.trim()) {
      return Alert.alert('Campo requerido', 'El nombre no puede estar vacío');
    }
    if (usernameEdit && dispEstado === 'ocupado') {
      return Alert.alert('Usuario en uso', 'Elige otro nombre de usuario');
    }
    if (usernameEdit && dispEstado === 'cargando') {
      return Alert.alert('Un momento', 'Verificando disponibilidad…');
    }
    if (usernameEdit && dispEstado === 'invalido') {
      return Alert.alert('Usuario inválido', dispMensaje);
    }

    setGuardando(true);
    try {
      // Guardar nombre y teléfono en Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          nombre: nombreEdit.trim(),
          telefono: telefonoEdit.trim() || null,
        },
      });
      if (error) throw error;

      // Guardar username en backend si cambió (o si aún no tiene perfil)
      if (usernameEdit && (usernameEdit !== usernameOrig || !usernameOrig)) {
        await perfilesApi.actualizarUsername(usernameEdit, email);
        setUsername(usernameEdit);
        setUsernameOrig(usernameEdit);
      }

      setEditando(false);
    } catch (e: any) {
      const msg = e.message ?? '';
      if (msg.includes('ocupado') || msg.includes('taken') || msg.includes('unique')) {
        Alert.alert('Usuario en uso', 'Ese nombre de usuario ya está tomado. Elige otro.');
      } else {
        Alert.alert('Error al guardar', msg);
      }
    } finally {
      setGuardando(false);
    }
  }

  function confirmarCerrar() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  const inicial = (nombre || email || 'U').charAt(0).toUpperCase();

  // Colores según estado disponibilidad
  const dispColor: Record<DispEstado, string> = {
    idle: COLORS.textoMuysuave,
    cargando: COLORS.textoMuysuave,
    disponible: COLORS.verde,
    ocupado: COLORS.rojo,
    invalido: COLORS.amarillo,
    actual: COLORS.textoMuysuave,
  };
  const dispBorder: Record<DispEstado, string> = {
    idle: COLORS.borde,
    cargando: COLORS.borde,
    disponible: COLORS.verde,
    ocupado: COLORS.rojo,
    invalido: COLORS.amarillo,
    actual: COLORS.borde,
  };
  const dispIcono: Record<DispEstado, string | null> = {
    idle: null,
    cargando: null,
    disponible: 'checkmark-circle',
    ocupado: 'close-circle',
    invalido: 'warning',
    actual: null,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={editando ? cancelarEdicion : () => router.back()}
            style={styles.headerBtn}
          >
            <Ionicons
              name={editando ? 'close' : 'arrow-back'}
              size={22} color={COLORS.blanco}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitulo}>
            {editando ? 'Editar perfil' : 'Mi Perfil'}
          </Text>

          {editando ? (
            <TouchableOpacity
              onPress={guardar}
              style={styles.headerBtn}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator size="small" color={COLORS.blanco} />
                : <Text style={styles.headerGuardar}>Guardar</Text>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={iniciarEdicion} style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={COLORS.blanco} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetra}>{inicial}</Text>
            </View>
            {!editando && (
              <>
                {nombre ? <Text style={styles.avatarNombre}>{nombre}</Text> : null}
                {username ? (
                  <Text style={styles.avatarUsername}>@{username}</Text>
                ) : null}
                <Text style={styles.avatarEmail}>{email}</Text>
              </>
            )}
            {editando && (
              <Text style={styles.avatarEmail}>{email}</Text>
            )}
          </View>

          {/* Modo EDICIÓN */}
          {editando && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Información personal</Text>
              <View style={styles.card}>

                {/* Nombre */}
                <View style={styles.campoEdit}>
                  <View style={[styles.campoEditIcono, { backgroundColor: COLORS.primarioSuave }]}>
                    <Ionicons name="person-outline" size={18} color={COLORS.primario} />
                  </View>
                  <View style={styles.campoEditContenido}>
                    <Text style={styles.campoEditLabel}>Nombre completo *</Text>
                    <TextInput
                      style={styles.campoEditInput}
                      value={nombreEdit}
                      onChangeText={setNombreEdit}
                      placeholder="Tu nombre"
                      placeholderTextColor={COLORS.textoMuysuave}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.sep} />

                {/* Teléfono */}
                <View style={styles.campoEdit}>
                  <View style={[styles.campoEditIcono, { backgroundColor: COLORS.primarioSuave }]}>
                    <Ionicons name="call-outline" size={18} color={COLORS.primario} />
                  </View>
                  <View style={styles.campoEditContenido}>
                    <Text style={styles.campoEditLabel}>Teléfono (opcional)</Text>
                    <TextInput
                      style={styles.campoEditInput}
                      value={telefonoEdit}
                      onChangeText={setTelefonoEdit}
                      placeholder="Ej: 3001234567"
                      placeholderTextColor={COLORS.textoMuysuave}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.sep} />

                {/* Username */}
                <View style={styles.campoEdit}>
                  <View style={[styles.campoEditIcono, { backgroundColor: COLORS.primarioSuave }]}>
                    <Ionicons name="at-outline" size={18} color={COLORS.primario} />
                  </View>
                  <View style={styles.campoEditContenido}>
                    <Text style={styles.campoEditLabel}>Nombre de usuario</Text>
                    <View style={[
                      styles.usernameRow,
                      { borderBottomColor: dispBorder[dispEstado] },
                    ]}>
                      <Text style={styles.arrobaEdit}>@</Text>
                      <TextInput
                        style={[styles.campoEditInput, { flex: 1, borderBottomWidth: 0 }]}
                        value={usernameEdit}
                        onChangeText={handleUsernameChange}
                        placeholder="tu_usuario"
                        placeholderTextColor={COLORS.textoMuysuave}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {dispEstado === 'cargando' && (
                        <ActivityIndicator size="small" color={COLORS.textoMuysuave} />
                      )}
                      {dispIcono[dispEstado] && (
                        <Ionicons
                          name={dispIcono[dispEstado] as any}
                          size={16}
                          color={dispColor[dispEstado]}
                        />
                      )}
                    </View>
                    {dispMensaje ? (
                      <Text style={[styles.dispHint, { color: dispColor[dispEstado] }]}>
                        {dispMensaje}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.sep} />

                {/* Email (no editable) */}
                <View style={styles.campoEdit}>
                  <View style={[styles.campoEditIcono, { backgroundColor: '#f3f4f6' }]}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textoSuave} />
                  </View>
                  <View style={styles.campoEditContenido}>
                    <Text style={styles.campoEditLabel}>Correo electrónico</Text>
                    <Text style={styles.campoEditNoEditable}>{email}</Text>
                  </View>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color={COLORS.textoMuysuave} />
                  </View>
                </View>
              </View>

              <Text style={styles.notaEdicion}>
                El correo electrónico no se puede cambiar desde aquí.
              </Text>
            </View>
          )}

          {/* Modo VISTA */}
          {!editando && (
            <>
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Cuenta</Text>
                <View style={styles.card}>

                  <View style={styles.fila}>
                    <View style={[styles.filaIcono, { backgroundColor: COLORS.primarioSuave }]}>
                      <Ionicons name="person-outline" size={18} color={COLORS.primario} />
                    </View>
                    <View style={styles.filaInfo}>
                      <Text style={styles.filaLabel}>Nombre</Text>
                      <Text style={[
                        styles.filaValor,
                        !nombre && styles.filaValorVacio,
                      ]}>
                        {nombre || 'Sin nombre — toca ✏️ para agregar'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sep} />

                  <View style={styles.fila}>
                    <View style={[styles.filaIcono, { backgroundColor: COLORS.primarioSuave }]}>
                      <Ionicons name="at-outline" size={18} color={COLORS.primario} />
                    </View>
                    <View style={styles.filaInfo}>
                      <Text style={styles.filaLabel}>Usuario</Text>
                      <Text style={[
                        styles.filaValor,
                        !username && styles.filaValorVacio,
                      ]}>
                        {username ? `@${username}` : 'Sin usuario asignado'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sep} />

                  <View style={styles.fila}>
                    <View style={[styles.filaIcono, { backgroundColor: COLORS.primarioSuave }]}>
                      <Ionicons name="call-outline" size={18} color={COLORS.primario} />
                    </View>
                    <View style={styles.filaInfo}>
                      <Text style={styles.filaLabel}>Teléfono</Text>
                      <Text style={[
                        styles.filaValor,
                        !telefono && styles.filaValorVacio,
                      ]}>
                        {telefono || 'No configurado'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sep} />

                  <View style={styles.fila}>
                    <View style={[styles.filaIcono, { backgroundColor: '#f3f4f6' }]}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.textoSuave} />
                    </View>
                    <View style={styles.filaInfo}>
                      <Text style={styles.filaLabel}>Correo electrónico</Text>
                      <Text style={styles.filaValor}>{email}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Accesos rápidos */}
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Ajustes</Text>
                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.fila}
                    onPress={() => router.push('/configuracion')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.filaIcono, { backgroundColor: '#f3f4f6' }]}>
                      <Ionicons name="settings-outline" size={18} color={COLORS.textoSuave} />
                    </View>
                    <View style={styles.filaInfo}>
                      <Text style={styles.filaLabel}>Configuración</Text>
                      <Text style={styles.filaValorSub}>Notificaciones, seguridad y más</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textoMuysuave} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cerrar sesión */}
              <TouchableOpacity
                style={styles.btnCerrar}
                onPress={confirmarCerrar}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.rojo} />
                <Text style={styles.btnCerrarTexto}>Cerrar sesión</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Botón guardar alternativo (abajo) en modo edición */}
          {editando && (
            <View style={{ paddingHorizontal: SPACING.md, marginTop: SPACING.lg }}>
              <TouchableOpacity
                style={[styles.btnGuardar, guardando && styles.btnDeshabilitado]}
                onPress={guardar}
                disabled={guardando}
              >
                {guardando
                  ? <ActivityIndicator color={COLORS.blanco} />
                  : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.blanco} />
                      <Text style={styles.btnGuardarTexto}>Guardar cambios</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primarioOscuro,
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerBtn: { width: 64, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.blanco },
  headerGuardar: { fontSize: FONT.md, fontWeight: '700', color: COLORS.blanco, textAlign: 'right' },

  scroll: { paddingBottom: 56 },

  avatarSection: {
    alignItems: 'center', paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primarioOscuro, paddingBottom: 32,
  },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarLetra: { fontSize: 36, fontWeight: '800', color: COLORS.blanco },
  avatarNombre: { fontSize: FONT.xl, fontWeight: '700', color: COLORS.blanco, marginBottom: 2 },
  avatarUsername: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  avatarEmail: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.65)' },

  seccion: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  seccionTitulo: {
    fontSize: FONT.sm, fontWeight: '700', color: COLORS.textoSuave,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borde, overflow: 'hidden',
  },

  // Modo vista
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  filaIcono: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  filaInfo: { flex: 1 },
  filaLabel: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.texto },
  filaValor: { fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 2 },
  filaValorVacio: { color: COLORS.textoMuysuave, fontStyle: 'italic' },
  filaValorSub: { fontSize: FONT.sm, color: COLORS.textoMuysuave, marginTop: 2 },
  sep: { height: 1, backgroundColor: COLORS.borde, marginLeft: 68 },

  // Modo edición
  campoEdit: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
  },
  campoEditIcono: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  campoEditContenido: { flex: 1 },
  campoEditLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textoSuave,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
  },
  campoEditInput: {
    fontSize: FONT.md, color: COLORS.texto,
    borderBottomWidth: 1.5, borderBottomColor: COLORS.primarioBorde,
    paddingBottom: 4,
  },
  campoEditNoEditable: {
    fontSize: FONT.md, color: COLORS.textoMuysuave,
  },
  lockBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.borde,
    justifyContent: 'center', alignItems: 'center',
  },
  notaEdicion: {
    fontSize: 11, color: COLORS.textoMuysuave,
    marginTop: SPACING.sm, marginLeft: SPACING.sm,
  },

  // Username edit row
  usernameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderBottomWidth: 1.5, paddingBottom: 4,
  },
  arrobaEdit: {
    fontSize: FONT.md, fontWeight: '700', color: COLORS.primario,
  },
  dispHint: { fontSize: 11, marginTop: 4 },

  btnGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: RADIUS.md, paddingVertical: 15,
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnGuardarTexto: { color: COLORS.blanco, fontSize: FONT.md, fontWeight: '700' },

  btnCerrar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.md, marginTop: SPACING.xl,
    paddingVertical: 15, borderRadius: RADIUS.md,
    backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca',
  },
  btnCerrarTexto: { fontSize: FONT.md, fontWeight: '700', color: COLORS.rojo },
});
