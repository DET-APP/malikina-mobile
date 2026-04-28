import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerArabic}>الفقه الإسلامي</Text>
        <Text style={styles.headerTitle}>Fiqh Islamique</Text>
        <Text style={styles.headerSub}>{fiqhBooks.length} livre{fiqhBooks.length > 1 ? 's' : ''}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={fiqhBooks}
          keyExtractor={x => x.id}
          contentContainerStyle={styles.grid}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucun livre disponible</Text>
            </View>
          }
          renderItem={({ item }) => <FiqhCard book={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function FiqhCard({ book }: { book: Xassida }) {
  const hasContent = book.verse_count > 0;
  return (
    <TouchableOpacity
      style={[styles.card, !hasContent && styles.cardDisabled]}
      onPress={() => hasContent && router.push(`/xassida/${book.id}`)}
      activeOpacity={hasContent ? 0.7 : 1}
    >
      {/* Decorative circles */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <View style={styles.cardIconCircle}>
        <Ionicons name="book-outline" size={22} color={Colors.primary} />
      </View>

      {book.arabic_name && (
        <Text style={styles.cardArabic} numberOfLines={1}>{book.arabic_name}</Text>
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>{book.title}</Text>

      {!hasContent ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Bientôt</Text>
        </View>
      ) : (
        <Text style={styles.cardCount}>{book.verse_count} versets</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary, paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 24, alignItems: 'center',
  },
  headerArabic: { fontFamily: 'Amiri', fontSize: 26, color: Colors.goldLight },
  headerTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  grid: { padding: 16, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },

  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, minHeight: 160,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardDisabled: { opacity: 0.55 },
  deco1: {
    position: 'absolute', top: -20, right: -20,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.primaryLight,
  },
  deco2: {
    position: 'absolute', top: -8, right: -8,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold + '22',
  },
  cardIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  cardArabic: { fontFamily: 'Amiri', fontSize: 15, color: Colors.primary, marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18, flex: 1 },
  soonBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.gold + '22',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.gold + '44', marginTop: 8,
  },
  soonText: { fontSize: 11, color: Colors.gold, fontWeight: '700' },
  cardCount: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
});
