import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
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

  const filtered = xassidas.filter((x) => {
    const matchSearch = !search || x.title.toLowerCase().includes(search.toLowerCase());
    const matchAuthor = !selectedAuthor || x.author_id === selectedAuthor;
    return matchSearch && matchAuthor && !x.is_fiqh;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerArabic}>القصائد</Text>
        <Text style={styles.headerTitle}>Xassidas</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Author filter */}
      <FlatList
        horizontal
        data={[{ id: null, name: 'Tous' }, ...authors.map(a => ({ id: a.id, name: a.name }))]}
        keyExtractor={(a) => a.id ?? 'all'}
        contentContainerStyle={styles.authorFilter}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.authorChip, selectedAuthor === item.id && styles.authorChipActive]}
            onPress={() => setSelectedAuthor(item.id)}
          >
            <Text style={[styles.authorChipText, selectedAuthor === item.id && styles.authorChipTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Xassidas list */}
      {isLoading ? (
        <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <XassidaCard xassida={item} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucun xassida trouvé</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function XassidaCard({ xassida }: { xassida: Xassida }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/xassida/${xassida.id}`)}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{xassida.title}</Text>
        {xassida.author_name && (
          <Text style={styles.cardAuthor}>{xassida.author_name}</Text>
        )}
        {xassida.arabic_name && (
          <Text style={styles.cardArabic}>{xassida.arabic_name}</Text>
        )}
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardVerses}>{xassida.verse_count}</Text>
        <Text style={styles.cardVersesLabel}>vers.</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 12, backgroundColor: Colors.surface },
  headerArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.gold },
  headerTitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', margin: 12,
    backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  authorFilter: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  authorChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  authorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  authorChipText: { fontSize: 13, color: Colors.textSecondary },
  authorChipTextActive: { color: Colors.white, fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardLeft: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  cardAuthor: { fontSize: 12, color: Colors.textSecondary },
  cardArabic: { fontSize: 16, fontFamily: 'Amiri', color: Colors.gold },
  cardRight: { alignItems: 'center', gap: 2, marginLeft: 12 },
  cardVerses: { fontSize: 16, color: Colors.gold, fontWeight: '700' },
  cardVersesLabel: { fontSize: 10, color: Colors.textMuted },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
