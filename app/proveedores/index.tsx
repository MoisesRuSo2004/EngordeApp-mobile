import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { proveedoresApi, type Proveedor } from '../../services/api/proveedores';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';

function CalificacionEstrellas({ valor }: { valor?: number }) {
  if (!valor) return null;
  return (
    <View style={styles.estrellas}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(valor) ? 'star' : 'star-outline'}
          size={12}
          color={i <= Math.round(valor) ? COLORS.amarillo : COLORS.borde}
        />
      ))}
    </View>
  );
}

function ProveedorCard({ proveedor, onPress, onDelete }: {
  proveedor: Proveedor;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarLetra}>{proveedor.nombre.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre}>{proveedor.nombre}</Text>
        <View style={styles.cardMetas}>
          {proveedor.municipio && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={COLORS.textoSuave} />
              <Text style={styles.metaTexto}>{proveedor.municipio}</Text>
            </View>
          )}
          {proveedor.telefono && (
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={12} color={COLORS.textoSuave} />
              <Text style={styles.metaTexto}>{proveedor.telefono}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="grid-outline" size={12} color={COLORS.textoSuave} />
            <Text style={styles.metaTexto}>{proveedor._count?.lotes ?? 0} lotes</Text>
          </View>
        </View>
        <CalificacionEstrellas valor={proveedor.historialCalificacion} />
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={COLORS.textoMuysuave} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ProveedoresScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: proveedores = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresApi.listar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => proveedoresApi.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const confirmarEliminar = (p: Proveedor) => {
    Alert.alert(
      'Eliminar proveedor',
      `¿Eliminar a "${p.nombre}"? Solo si no tiene lotes asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar.mutate(p.id) },
      ],
    );
  };

  if (isLoading) {
    return <View style={styles.centrado}><ActivityIndicator size="large" color={COLORS.primario} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Proveedores</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={proveedores}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            titulo="Sin proveedores"
            sub="Registra los vendedores de ganado para llevar un historial de compras."
            botonTexto="Agregar proveedor"
            onBoton={() => router.push('/proveedores/crear')}
          />
        }
        renderItem={({ item }) => (
          <ProveedorCard
            proveedor={item}
            onPress={() => router.push(`/proveedores/${item.id}`)}
            onDelete={() => confirmarEliminar(item)}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/proveedores/crear')}
      >
        <Ionicons name="add" size={28} color={COLORS.blanco} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.primario, paddingTop: 56, paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitulo: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.blanco },

  lista: { padding: SPACING.md, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.blanco, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borde,
  },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primario,
    justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarLetra: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.blanco },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: FONT.md, fontWeight: '700', color: COLORS.texto, marginBottom: 4 },
  cardMetas: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { fontSize: FONT.sm, color: COLORS.textoSuave },
  estrellas: { flexDirection: 'row', gap: 2 },
  deleteBtn: { padding: 4 },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: COLORS.primario, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
