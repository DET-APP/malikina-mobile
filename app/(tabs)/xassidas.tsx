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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerArabic}>القصائد</Text>
        <Text style={styles.headerTitle}>Xassidas</Text>
        <Text style={styles.headerCount}>{filtered.length} xassida{filtered.length > 1 ? 's' : ''}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un xassida…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Author filter chips */}
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

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={x => x.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun xassida trouvé</Text>
            </View>
          }
          renderItem={({ item }) => <XassidaRow xassida={item} />}
        />
      )}
    </SafeAreaView>
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
    backgroundColor: Colors.gold, paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 20, alignItems: 'center',
  },
  headerArabic: { fontFamily: 'Amiri', fontSize: 28, color: Colors.white, fontWeight: '700' },
  headerTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerCount: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },

  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },

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

  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
});
