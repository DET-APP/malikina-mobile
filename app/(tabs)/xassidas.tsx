import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Xassida } from '@/services/api';
import { Colors } from '@/constants/colors';

export default function XassidasScreen() {
  const [search, setSearch] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const { data: xassidas = [], isLoading } = useQuery({
    queryKey: ['xassidas'],
    queryFn: api.xassidas.list,
  });

  const { data: authors = [] } = useQuery({
    queryKey: ['authors'],
    queryFn: api.authors.list,
  });

  const filtered = xassidas.filter(x => {
    const matchSearch = !search || x.title.toLowerCase().includes(search.toLowerCase())
      || (x.arabic_name || '').includes(search);
    const matchAuthor = !selectedAuthor || x.author_id === selectedAuthor;
    return matchSearch && matchAuthor && !x.is_fiqh;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header gold — identique à la PWA */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Xassidas</Text>
            <Text style={styles.headerCount}>
              {isLoading ? 'Chargement…' : `${filtered.length} xassidas`}
            </Text>
          </View>
        </View>

        {/* Search dans le header */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une xassida..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Grille / Liste toggles */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>
              ⊞ Grille
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              ☰ Liste
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres auteurs */}
      <FlatList
        horizontal
        data={[{ id: null as string | null, name: 'Tous' }, ...authors.map(a => ({ id: a.id, name: a.name }))]}
        keyExtractor={a => a.id ?? 'all'}
        contentContainerStyle={styles.chips}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedAuthor === item.id && styles.chipActive]}
            onPress={() => setSelectedAuthor(item.id)}
          >
            <Text style={[styles.chipText, selectedAuthor === item.id && styles.chipTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Contenu */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filtered}
          keyExtractor={x => x.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucune xassida trouvée</Text></View>}
          renderItem={({ item }) => <XassidaGridCard xassida={item} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={x => x.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucune xassida trouvée</Text></View>}
          renderItem={({ item }) => <XassidaRow xassida={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function XassidaGridCard({ xassida }: { xassida: Xassida }) {
  const initials = xassida.title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <TouchableOpacity style={styles.gridCard} onPress={() => router.push(`/xassida/${xassida.id}`)}>
      <View style={styles.gridDeco1} /><View style={styles.gridDeco2} />
      <View style={styles.gridInitials}>
        <Text style={styles.gridInitialsText}>{initials}</Text>
      </View>
      {xassida.arabic_name && (
        <Text style={styles.gridArabic} numberOfLines={1}>{xassida.arabic_name}</Text>
      )}
      <Text style={styles.gridTitle} numberOfLines={2}>{xassida.title}</Text>
      {xassida.author_name && (
        <View style={styles.gridAuthorBadge}>
          <Text style={styles.gridAuthorText}>{xassida.author_name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function XassidaRow({ xassida }: { xassida: Xassida }) {
  const initials = xassida.title.slice(0, 2).toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={() => router.push(`/xassida/${xassida.id}`)}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rowContent}>
        {xassida.arabic_name && (
          <Text style={styles.rowArabic} numberOfLines={1}>{xassida.arabic_name}</Text>
        )}
        <Text style={styles.rowTitle} numberOfLines={1}>{xassida.title}</Text>
        {xassida.author_name && (
          <View style={styles.rowAuthorBadge}>
            <Text style={styles.rowAuthorText}>{xassida.author_name}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.white },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.white, padding: 0 },

  viewToggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.surface },
  toggleText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  toggleTextActive: { color: Colors.gold },

  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },

  // List view
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  rowAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  rowContent: { flex: 1, gap: 2 },
  rowArabic: { fontFamily: 'Amiri', fontSize: 16, color: Colors.primary },
  rowTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowAuthorBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  rowAuthorText: { fontSize: 11, color: Colors.primary, fontWeight: '500' },

  // Grid view
  gridList: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minHeight: 155,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  gridDeco1: {
    position: 'absolute', top: -18, right: -18, width: 64, height: 64,
    borderRadius: 32, backgroundColor: Colors.gold + '18',
  },
  gridDeco2: {
    position: 'absolute', top: -6, right: -6, width: 38, height: 38,
    borderRadius: 19, backgroundColor: Colors.primaryLight,
  },
  gridInitials: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.gold + '22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  gridInitialsText: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  gridArabic: { fontFamily: 'Amiri', fontSize: 15, color: Colors.primary, marginBottom: 4 },
  gridTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18, flex: 1 },
  gridAuthorBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  gridAuthorText: { fontSize: 10, color: Colors.primary, fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
});
