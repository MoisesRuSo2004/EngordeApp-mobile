import { useState, useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Pressable,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ inicial, onPress }: { inicial: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.avatarBtn} activeOpacity={0.8}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarLetra}>{inicial.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Panel de perfil ──────────────────────────────────────────────────────────

interface ProfilePanelProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (ruta: string) => void;
  email: string;
  nombre: string;
}

function ProfilePanel({ visible, onClose, onNavigate, email, nombre }: ProfilePanelProps) {
  const opacidad = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const inicial = nombre?.charAt(0) || email?.charAt(0) || 'U';

  function cerrarSesion() {
    onClose();
    supabase.auth.signOut();
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.panelOverlay} onPress={onClose}>
        <Animated.View
          style={[styles.panel, { opacity: opacidad, transform: [{ translateY }] }]}
        >
          {/* Info usuario */}
          <View style={styles.panelHeader}>
            <View style={styles.panelAvatarGrande}>
              <Text style={styles.panelAvatarLetra}>{inicial.toUpperCase()}</Text>
            </View>
            <View style={styles.panelHeaderInfo}>
              {nombre ? <Text style={styles.panelNombre} numberOfLines={1}>{nombre}</Text> : null}
              <Text style={styles.panelEmail} numberOfLines={1}>{email}</Text>
            </View>
          </View>

          <View style={styles.panelDivider} />

          {/* Opciones */}
          <TouchableOpacity
            style={styles.panelItem}
            onPress={() => onNavigate('/perfil')}
            activeOpacity={0.7}
          >
            <View style={[styles.panelItemIcon, { backgroundColor: COLORS.primarioSuave }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.primario} />
            </View>
            <View style={styles.panelItemTextos}>
              <Text style={styles.panelItemTitulo}>Mi perfil</Text>
              <Text style={styles.panelItemSub}>Ver y editar información</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textoMuysuave} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.panelItem}
            onPress={() => onNavigate('/configuracion')}
            activeOpacity={0.7}
          >
            <View style={[styles.panelItemIcon, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="settings-outline" size={18} color={COLORS.textoSuave} />
            </View>
            <View style={styles.panelItemTextos}>
              <Text style={styles.panelItemTitulo}>Configuración</Text>
              <Text style={styles.panelItemSub}>Notificaciones y preferencias</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textoMuysuave} />
          </TouchableOpacity>

          <View style={styles.panelDivider} />

          <TouchableOpacity style={styles.panelItem} onPress={cerrarSesion} activeOpacity={0.7}>
            <View style={[styles.panelItemIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.rojo} />
            </View>
            <View style={styles.panelItemTextos}>
              <Text style={[styles.panelItemTitulo, { color: COLORS.rojo }]}>Cerrar sesión</Text>
              <Text style={styles.panelItemSub}>Salir de la cuenta</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function TabsLayout() {
  const router = useRouter();
  const [panelVisible, setPanelVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '');
        setNombre(
          data.user.user_metadata?.nombre_completo
          ?? data.user.user_metadata?.full_name
          ?? data.user.user_metadata?.name
          ?? '',
        );
      }
    });
  }, []);

  const inicial = nombre?.charAt(0) || email?.charAt(0) || 'U';

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.primario,
          tabBarInactiveTintColor: COLORS.textoSuave,
          tabBarStyle: {
            backgroundColor: COLORS.blanco,
            borderTopColor: COLORS.borde,
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 10,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: COLORS.primarioOscuro },
          headerTintColor: COLORS.blanco,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerRight: () => (
            <Avatar inicial={inicial} onPress={() => setPanelVisible(true)} />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            headerTitle: 'EngordeApp',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lotes"
          options={{
            title: 'Lotes',
            headerTitle: 'Mis Lotes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reportes"
          options={{
            title: 'Reportes',
            headerTitle: 'Reportes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <ProfilePanel
        visible={panelVisible}
        onClose={() => setPanelVisible(false)}
        onNavigate={(ruta) => { setPanelVisible(false); router.push(ruta as any); }}
        email={email}
        nombre={nombre}
      />
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatarBtn: { marginRight: 14 },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetra: { fontSize: FONT.md, fontWeight: '800', color: COLORS.blanco },

  panelOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: 100, paddingRight: SPACING.sm,
  },
  panel: {
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.lg,
    width: 290,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 12,
    overflow: 'hidden',
  },

  panelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md,
  },
  panelAvatarGrande: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primario,
    justifyContent: 'center', alignItems: 'center',
  },
  panelAvatarLetra: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },
  panelHeaderInfo: { flex: 1 },
  panelNombre: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto },
  panelEmail: { fontSize: FONT.sm, color: COLORS.textoSuave, marginTop: 1 },

  panelDivider: { height: 1, backgroundColor: COLORS.borde },

  panelItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  panelItemIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  panelItemTextos: { flex: 1 },
  panelItemTitulo: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.texto },
  panelItemSub: { fontSize: 12, color: COLORS.textoMuysuave, marginTop: 1 },
});
