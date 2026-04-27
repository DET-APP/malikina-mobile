import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Xassida } from '@/services/api';
import { Colors } from '@/constants/colors';

export default function FiqhScreen() {
  const { data: xassidas = [], isLoading } = useQuery({
    queryKey: ['xassidas'],
    queryFn: api.xassidas.list,
  });

  const fiqhBooks = xassidas.filter(x => x.is_fiqh);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerArabic}>الفقه</Text>
        <Text style={styles.headerTitle}>Fiqh Islamique</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={fiqhBooks}
          keyExtractor={x => x.id}
          contentContainerStyle={styles.grid}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={<Text style={styles.empty}>Aucun livre de Fiqh disponible</Text>}
          renderItem={({ item }) => <FiqhCard book={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function FiqhCard({ book }: { book: Xassida }) {
  const hasContent = book.verse_count > 0;
  const chapters = book.chapters_json ? Object.values(book.chapters_json) : [];
  const icon = chapters[0]?.icon || '📖';

  return (
    <TouchableOpacity
      style={[styles.card, !hasContent && styles.cardDisabled]}
      onPress={() => hasContent && router.push(`/xassida/${book.id}`)}
      activeOpacity={hasContent ? 0.7 : 1}
    >
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>{book.title}</Text>
      {book.arabic_name && (
        <Text style={styles.cardArabic} numberOfLines={1}>{book.arabic_name}</Text>
      )}
      {!hasContent ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Bientôt</Text>
        </View>
      ) : (
        <Text style={styles.cardCount}>{book.verse_count} vers.</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  headerArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.gold },
  headerTitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 2 },
  grid: { padding: 12 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 6, minHeight: 140,
  },
  cardDisabled: { opacity: 0.5 },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontSize: 13, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  cardArabic: { fontSize: 15, fontFamily: 'Amiri', color: Colors.gold, textAlign: 'center' },
  cardCount: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  soonBadge: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  soonText: { fontSize: 11, color: Colors.textSecondary },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
